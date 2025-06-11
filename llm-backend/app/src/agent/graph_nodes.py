import boto3

# boto3.set_stream_logger(name='botocore')

from app.src.agent.helper import AgentState, Outline, Response
from typing import List

import json
from langchain_core.messages import HumanMessage, AIMessage
import botocore.exceptions


from app.src.llm.query_helper import get_llm_object

import time
from anthropic import AnthropicBedrock
from pydantic import BaseModel, Field
import json
import re
from typing import Optional, Dict, Any


AWS_DEFAULT_REGION = "eu-central-1"
AWS_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"


def extract_valid_json(raw_response: str) -> Optional[Dict[str, Any]]:
    """
    Attempts to extract and parse a valid JSON object from a raw string.

    Args:
        raw_response (str): The full response string from the model.

    Returns:
        Optional[Dict[str, Any]]: Parsed JSON object if successful, otherwise None.
    """
    # Step 1: Try direct parse
    try:
        return json.loads(raw_response)
    except json.JSONDecodeError:
        pass

    # Step 2: Try to extract the first JSON object using regex
    json_match = re.search(r"{[\s\S]+}", raw_response)
    if json_match:
        json_string = json_match.group(0)
        try:
            return json.loads(json_string)
        except json.JSONDecodeError as e:
            print("❌ JSON decode failed after regex:", e)
            return None

    print("❌ No valid JSON found in response.")
    return None


def queries_to_string(queries: List[dict]) -> str:
    return " ".join(f"Question: {q['question']} Answer: {q['answer']}" for q in queries)


def outline_node_aws(state: AgentState) -> AgentState:
    print("outline_node_aws")
    qa_advanced, llm = get_llm_object(state["collection_names"])

    if not qa_advanced or not llm:
        # state["outline"] = Outline(outline=[])
        state["no_iterate"] = 0
        return state

    context = queries_to_string(state["query"])
    chain = qa_advanced

    class TopicPoint(BaseModel):
        topic: str = Field(..., description="Topic for the report")
        points: List[str] = Field(
            ..., description="List of main points related to the topic"
        )

    class Outline(BaseModel):
        outline: List[TopicPoint] = Field(
            ..., description="List of topics with their main points"
        )

    schema = json.dumps(Outline.model_json_schema())

    message = f"""
        You are a report assistant tasked with generating a structured outline based on the user-provided context.

        Instructions:
        1. Carefully read the topic and context provided.
        2. Identify key ideas, themes, or issues related to the topic.
        3. For each distinct topic or subtopic found in the context, extract the most important supporting points.
        4. Present the output as a list of objects, where each object contains:
        - "topic": a concise subtopic or category.
        - "points": a list of main points related to that subtopic it should me more details point so easy to understand why you suggested this topic and what execting of topic.

        Topic:
        {state["topic"]}

        Context:
        {context}
        Your response should follow this format:

                [
                {{
                    "topic": "Subtopic 1",
                    "points": [
                    "Main point 1",
                    "Main point 2",
                    ...
                    ]
                }},
                {{
                    "topic": "Subtopic 2",
                    "points": [
                    "Main point 1",
                    ...
                    ]
                }}
                ]
        Output Requirements:
        Return only the JSON object instance (strictly adhering to the schema).
        Do not include any schema, explanations, or additional information in the output.
        {schema}
        
    """

    # print("message",message)
    for attempt in range(2):  # try twice
        try:
            response = llm.invoke([HumanMessage(content=message)])
            # print("response",response)
            raw_result = response.content
            print(f"\nAttempt {attempt + 1} ")

            parsed = extract_valid_json(raw_result)
            if parsed:
                validated = Outline.model_validate(parsed)
                state["outline"] = validated
                break  # Success, exit retry loop
            else:
                print(f"Attempt {attempt + 1} - Failed to parse JSON response.")

        except Exception as e:
            print(f"Attempt {attempt + 1} - Exception occurred:", e)
        time.sleep(3)
    else:
        # All attempts failed
        print("Failed to generate a valid outline after 2 attempts.")
        state["outline"] = Outline(outline=[])

    state["no_iterate"] = 0
    return state


def iterate_outline_node(state: AgentState):
    print("iterate_outline_node")
    outline_list = state["outline"].outline if "outline" in state else []
    # print("outline_list", outline_list)
    if state["no_iterate"] >= len(outline_list):
        state["is_Report_generated"] = True
        return state

    current_topic_obj = outline_list[state["no_iterate"]]
    current_topic = current_topic_obj.topic
    current_points = current_topic_obj.points

    print("\n current_topic = = == = = == >", current_topic)
    print("\n current_points = = == = = == >", current_points)

    # Try to generate the answer node, retry once if it fails
    try:
        state = generate_answer_node(state, current_topic, current_points)
    except Exception as e:
        print(f"Error during generate_answer_node (1st try): {e}")
        try:
            time.sleep(3)
            state = generate_answer_node(state, current_topic, current_points)
        except Exception as e2:
            print(f"Error during generate_answer_node (2nd try): {e2}")
            # Optionally mark an error flag or add to failed topics
            return state

    return state


def generate_answer_node(
    state: AgentState, current_topic: str, current_point: List[str]
):
    print("generate_answer_node")

    resulting_string = queries_to_string(state["query"])
    chain, llm = get_llm_object(state["collection_names"])

    if not chain or not llm:
        print(f"Error in generate_answer_node: {e}")
        raise
    message = f"""
        You are a professional **Report Assistant**. Your task is to generate a **high-quality,** report section** based on the provided topic and main point.

        ### Instructions:

        1. **Understand the topic and main point clearly.**
        2. Use only the provided **user history and context** to generate the content — do not make up information.
        3. The answer must be **detailed, well-organized, and accurate**, suitable for inclusion in a formal business or technical report.
        


        ### Topic:
            {current_topic}

        ### Main Point:
            {current_point}

        ### User History / Context:
            {resulting_string}


        
    """
    summary = state.get("summary", "")

    if summary:
        message += f"""

    ### Summary Output:
    This is a previously generated summary for background context:
    {summary}
    """

    message += """
        ### Final Output:
             Think of it as a well-written, visual report section.
    """
    try:
        response = llm.invoke([HumanMessage(content=message)])
        # print("\nresponse", response.content, "\n")
    except Exception as e:
        print(f"Error in generate_answer_node: {e}")
        raise  # Rethrow the error to be caught in outer logic

    # Append interaction to chat history
    state["chat_history"].append(
        HumanMessage(content=f"Topic: {current_topic}\nPoint: {current_point}")
    )
    state["chat_history"].append(AIMessage(content=response.content))
    # print("generate_answer_node history : ", state["chat_history"])
    return state


def formate_answer_verifier(llm, last_message):
    print("formate_answer_verifier")
    message = f"""
    You are a professional **Markdown and Mermaid Validator**. Your task is to validate the structure of Markdown and Mermaid code, ensuring it follows all formatting rules.
    **Very Important <<No NEED TO ADD COMMENT ONLY DATA RELATED TO REPORT>>**

    ### Rules for Markdown:
    1. **Output must be valid Markdown** — do **not** use pure HTML except for wrapping Mermaid diagrams.
    2. Use only the following Markdown elements:
        - `#`, `##`, `###`, `####` for headings  
        - Regular paragraphs for text  
        - `-`, `*`, `+` for bullet lists  
        - `1.`, `2.`, `3.` for numbered lists  
        - `|` for tables  
        - Blockquotes using `>` for quotes

    3. **Do not** include **Conclusion** sections.
    4. Avoid special characters like `()` or `&` in Mermaid labels.

    ### Rules for Mermaid Diagrams:
    - **Always wrap Mermaid diagrams in HTML for proper rendering:**  
    ```html
    <pre><code class="mermaid"> ... </code></pre>
    ```
    - **Diagram Types:**
        - `pie` — for percentages, ratios, or metrics  
        - `mindmap` — for concept mapping  
        - `flowchart` — for sequences or logic flows  
        - `gantt` — for project timelines  
        - `gitGraph` — for version control histories

    - **Gantt Diagrams (Strict Syntax Guide):**
        - Use `dateFormat YYYY-MM-DD`
        - Full date ranges required
        - No special characters in labels
        - Include `task_id`

    - **Correct Gantt Example:**
    ```html
    <pre><code class="mermaid">
    gantt
        title Project Timeline
        dateFormat YYYY-MM-DD
        section Phase 1
        Planning      :plan, 2023-01-01, 2023-03-31
        Development   :dev, 2023-04-01, 2023-06-30
        section Phase 2
        Testing       :test, 2023-07-01, 2023-08-31
        Deployment    :deploy, 2023-09-01, 2023-10-15
    </code></pre>
    ```

    - **Mindmap Example:**
    ```html
    <pre><code class="mermaid">
    mindmap
    root((Strategic Roadmap))
        Growth Initiatives
        International Expansion
        New Product Launches
        Operational Focus
        Cost Optimization
        Process Automation
    </code></pre>
    ```

    - **Flowchart Example:**
    ```html
    <pre><code class="mermaid">
    flowchart TD
        A[Start] --> B[Process] --> C[End]
        classDef primary fill:#537CFA,stroke:#4269E0,color:#fff;
        class B primary;
    </code></pre>
    ```

    - **GitGraph Example:**
    ```html
    <pre><code class="mermaid">
    gitGraph
        commit id: "Initial commit"
        commit id: "Add data layer"
        branch feature/auth
        checkout feature/auth
        commit id: "Login page"
        checkout main
        merge feature/auth
    </code></pre>
    ```

    - **Pie Chart Example:**
    ```html
    <pre><code class="mermaid">
    pie
        title Revenue Share
        "H1 2022" : 17.6
        "H1 2023" : 43.8
    </code></pre>
    ```

    ### User Message / Context:
    {last_message}

    ### ✅ Final Output:
    Return a full **Markdown** section with Mermaid diagrams wrapped in HTML. This will be included in rendered documents (PDFs, rich previews, etc).
"""

    print("\n\nlast_message : ", last_message)

    result = None
    for attempt in range(2):
        try:
            response = llm.invoke(message)
            result = response.content
            break
        except Exception as e:
            print(f"Attempt {attempt + 1} failed:", e)
        time.sleep(3)
    print("\n\nformate_answer_verifier : ", response.content)
    return result


def formate_answer_verifier_node(state):
    print("formate_answer_verifier_node")
    if state["scape_formate"]:
        print("nothing to formate")
        return state
    qa_advanced, llm = get_llm_object(state["collection_names"])

    if not qa_advanced or not llm:
        return state

    chat_history = state.get("chat_history", [])
    last_message = chat_history[-1] if chat_history else None
    if last_message:
        return state

    result = formate_answer_verifier(llm, last_message)

    if not result:
        return state

    # Store the HTML result in chat_history or in a separate key
    ai_msg = AIMessage(content=result)
    if chat_history:
        state["chat_history"][-1] = ai_msg
    else:
        state["chat_history"].append(ai_msg)

    # ✅ Return the updated AgentState (as dict)
    return state


async def formate_answer_node(
    state: AgentState,
):
    print("formate_answer_node")
    qa_advanced, llm = get_llm_object(state["collection_names"])

    if not qa_advanced or not llm:
        return None

    chain = qa_advanced
    chat_history = state.get("chat_history", [])
    last_message = chat_history[-1] if chat_history else None
    message = f"""
    You are a professional **Markdown Report Formatter**. Your task is to generate a **well-structured, high-quality Markdown report section** based on the provided topic and main point.
    **Very Important <<No NEED TO ADD COMMENT ONLY DATA RELATED TO REPORT>>**

    ### Instructions:
    1. **Output must be valid Markdown** — use Markdown for everything except Mermaid diagrams.
    2. Use only the following Markdown elements:
        - `#`, `##`, `###`, `####` for headings  
        - Paragraphs for regular text  
        - `-`, `*`, `+` for bullet lists  
        - `1.`, `2.`, `3.` for numbered lists  
        - `|` for tables  
        - **Mermaid diagrams** wrapped in HTML `<pre><code class="mermaid">...</code></pre>` blocks

    3. **Wrap all diagrams in valid Mermaid blocks**, using:
    ```html
    <pre><code class="mermaid"> ... </code></pre>
    ```
    4. **Always close all Mermaid HTML tags properly**, including:
        - `</code></pre>` after Mermaid blocks

    5. Use the most appropriate **Mermaid diagram type** for the content being visualized. Recommended formats:

    - **Pie Charts:** For percentages, ratios, or metrics  
    ```html
    <pre><code class="mermaid">
    pie
        title Revenue Share
        "H1 2022" : 17.6
        "H1 2023" : 43.8
    </code></pre>
    ```

    - **Mindmaps:** For concept mapping  
    ```html
    <pre><code class="mermaid">
    mindmap
    root((Strategic Roadmap))
        Growth Initiatives
        International Expansion
        New Product Launches
        Operational Focus
        Cost Optimization
        Process Automation
    </code></pre>
    ```

    - **Flowcharts:** For sequences or logic flows  
    ```html
    <pre><code class="mermaid">
    flowchart TD
        A[Start] --> B[Process] --> C[End]
        classDef primary fill:#537CFA,stroke:#4269E0,color:#fff;
        class B primary;
    </code></pre>
    ```

    - **Gantt Charts (Strict Syntax Guide):**
    ```html
    <pre><code class="mermaid">
    gantt
        title Project Timeline
        dateFormat YYYY-MM-DD
        section Phase 1
        Planning      :plan, 2023-01-01, 2023-03-31
        Development   :dev, 2023-04-01, 2023-06-30
        section Phase 2
        Testing       :test, 2023-07-01, 2023-08-31
        Deployment    :deploy, 2023-09-01, 2023-10-15
    </code></pre>
    ```

    6. **Gantt Diagram Rules (Strict Syntax Guide)**

        - **Always provide a full date range** for each task using the format:  
        `Task Label :task_id, start_date, end_date`

        - ✅ Example: `Strategy Development :sd, 2023-07-01, 2023-12-31`
        - ❌ Avoid using just a year like `:2023` — it will throw a parse error.

        - **Use ISO date format (`YYYY-MM-DD`) only**, even if the timeline is annual.  
        - ✅ Correct: `2023-01-01, 2023-12-31`
        - ❌ Incorrect: `2023` or `01-01-2023`

        - **Each task must include a `task_id`**, even if not styled.  
        - ✅ Good: `Materiality Analysis :mat1, 2023-01-01, 2023-12-31`

        - **Avoid special characters** like parentheses `()`, ampersands `&`, or other special characters in task labels. Use `-` or plain text instead.
        - ✅ Use: `Net Profit - Loss`
        - ❌ Avoid: `Net Profit (Loss)` or `Company A & B`

        - **Define `dateFormat` explicitly** near the top of the Gantt:
        - ✅ `dateFormat YYYY-MM-DD`
        - This ensures Mermaid interprets dates correctly.

    7. Do **not** return only Mermaid code. Output should be a **full Markdown section** with headings, explanations, and diagrams embedded within.

    8. Do **not** include any **Conclusion** section.

    9. Do **not** include parentheses `(` or `)`, ampersands `&`, or other special characters inside Mermaid node labels.
        - ✅ Use: `Net Profit - Loss`
        - ❌ Avoid: `Net Profit (Loss)` or `Company A & B`

    ## 🗒️ AI Message / Context:
    {last_message}

    ## ✅ Final Output:
    Return a full Markdown section with embedded HTML for Mermaid diagrams. This will be included in rendered documents (PDFs, rich previews, etc).
"""

    summary = state.get("summary", "")

    if summary:
        message += f"""

    ### Summary Output:
    This is a previously generated summary for background context:
    {summary}
    """

    message += """
        ### Final Output:
        Return a full HTLM + Mermaid formatted section. Think of it as a well-written, visual report section.
    """
    for attempt in range(2):
        try:
            response = llm.invoke([HumanMessage(content=message)])
            print(f"\nformate_answer_node (attempt {attempt + 1}):", "\n")
            return response.content
        # except botocore.exceptions.ClientError as e:
        #     print(f"AWS ClientError (attempt {attempt + 1}):", e.response)
        except Exception as e:
            print(f"Error during chain.invoke (attempt {attempt + 1}):", repr(e))
        time.sleep(3)
    # If both attempts fail
    return None


async def summary(state: AgentState):
    print("summary_node")
    try:
        qa_advanced, llm = get_llm_object(state["collection_names"])

        if not qa_advanced or not llm:
            return state
        chain = qa_advanced
        chat_history = state.get("chat_history", [])
        summary_history = state.get("summary", "")
        last_message = chat_history[-1] if chat_history else None

        if not last_message:
            state["summary"] = "No message found to summarize."
            return {"result": state["summary"]}

        message = f"""
            You are a report assistant. Summarize the following message into a **professional, clear, and concise report-style summary**.

            ### Instructions:
            - Extract the key points from the message.
            - Rephrase them clearly and formally.
            - Ensure the summary is well-structured and easy to understand.
            - Avoid adding new information or personal commentary.
            
            ### User History / Context:
            {summary_history}

            ### Message to Summarize:
            {last_message.content if hasattr(last_message, 'content') else last_message}

            ### Final Output:
            Provide a single paragraph or short section that captures the essence of the message.
        """
        for attempt in range(2):
            try:
                response = llm.invoke([HumanMessage(content=message)])
                return response.content
            except Exception as e:
                print(f"Error during chain.invoke (attempt {attempt + 1}):", repr(e))
                import traceback

                traceback.print_exc()
                print("Error during get_llm_object:", repr(e))
            time.sleep(3)

        # If both attempts fail
        return state["summary"]
    except Exception as e:
        print("[Error in summary generation]", str(e))
        # state["summary"] = "An error occurred while generating the summary."
        return state["summary"]


def generate_conclusion(state: AgentState):
    try:
        print("generate_conclusion_node")
        qa_advanced, llm = get_llm_object(state["collection_names"])

        if not qa_advanced or not llm:
            return state
        chain = qa_advanced
        if not chain:
            raise ValueError("QA chain (`qa_advanced`) is not available in the state.")

        chat_history = state.get("chat_history", [])
        ai_messages = "\n".join(
            msg.content
            for msg in chat_history
            if isinstance(msg, AIMessage) and isinstance(msg.content, str)
        ).strip()

        if not ai_messages:
            raise ValueError("No valid AI messages found in chat history.")

        message = f"""
            You are a **Report Assistant** tasked with analyzing the report and generating a **brief, explainable conclusion** based on prior AI messages and context.

            ## 🧠 Instructions:
            1. **Fully understand the user context and extracted AI-generated points.**
            2. Use **only the provided AI message history** — do not make assumptions or introduce new facts.
            3. Write a **comprehensive yet concise conclusion** that feels formal, readable, and highly informative.
            4. **Output must be Markdown** — but wrap Mermaid diagrams in valid **HTML** for better control.
            5. Use the following structure:
                - `#`, `##`, `###` for headings  
                - Paragraphs for regular text  
                - `-`, `*`, or `+` for bullet lists  
                - `1.`, `2.`, `3.` for numbered lists  
                - `|` for tables  
                - **Wrap Mermaid diagrams** in HTML `<pre><code class="mermaid">...</code></pre>` blocks

            6. Do not ask the user follow-up questions or suggest actions — this is a **final report-style summary**.
            7. If data is unclear, omit uncertain conclusions rather than guessing.

            ## 📐 Markdown Templates (Mandatory Structure):
            
            - **Main Heading:**  
            ```markdown
            # Main Heading or Title
            ```
            
            - **Sub-heading:**  
            ```markdown
            ## Sub-heading and Title
            ```
            
            - **Sub-sub-heading:**  
            ```markdown
            ### Sub-sub-heading and Title
            ```
            
            - **Paragraph:**  
            ```markdown
            Regular paragraph text here.
            ```
            
            - **Bullet List:**  
            ```markdown
            - Item 1
            - Item 2
            - Item 3
            ```
            
            - **Numbered List:**  
            ```markdown
            1. First Item
            2. Second Item
            3. Third Item
            ```
            
            - **Blockquote:**  
            ```markdown
            > This is a blockquote.
            ```

            - **Tables:**  
            ```markdown
            | Heading 1 | Heading 2 | Heading 3 |
            |-----------|-----------|-----------|
            | Row 1     | Data 1    | Data 2    |
            | Row 2     | Data 3    | Data 4    |
            ```
            
            - **Mermaid Diagrams (HTML Wrapper):**  
            ```html
            <pre><code class="mermaid">
            gantt
                title Project Timeline
                dateFormat YYYY-MM-DD
                section Phase 1
                Planning      :plan, 2023-01-01, 2023-03-31
                Development   :dev, 2023-04-01, 2023-06-30
                section Phase 2
                Testing       :test, 2023-07-01, 2023-08-31
                Deployment    :deploy, 2023-09-01, 2023-10-15
            </code></pre>
            ```

            ## 🗒️ AI Message History:
            {ai_messages}

            ## ✅ Final Output:
            Write your full structured conclusion below using **Markdown** with **Mermaid** blocks wrapped in HTML. This section will be included in rendered documents (PDFs, rich previews, etc).
        """

        for attempt in range(2):
            try:
                response = llm.invoke([HumanMessage(content=message)])
                result = response.content
                state["conclusion"] = result.strip()
                result = formate_answer_verifier(llm, result.strip())
                if not result:
                    return state
                state["conclusion"] = result.strip()
                return state
            except Exception as e:
                print(f"Error during chain.invoke (attempt {attempt + 1}):", repr(e))
            time.sleep(3)

        return state

    except Exception as e:
        print("[Error in conclusion generation]", str(e))
        state["conclusion"] = ""
        return state


def stream_node(state: AgentState):
    print("stream_node")
    return state
