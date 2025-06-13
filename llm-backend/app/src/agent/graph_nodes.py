from typing import List, Callable
import chromadb
from textwrap import dedent
from pydantic import BaseModel, Field

# boto3.set_stream_logger(name='botocore')
import tiktoken

from app.src.agent.helper import AgentState, Struture, Response

import json
from langchain_core.messages import HumanMessage, AIMessage
import botocore.exceptions


from app.src.llm.query_helper import get_llm_object

import time

import json
import re
from typing import Optional, Dict, Any


AWS_DEFAULT_REGION = "eu-central-1"
AWS_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"


def generate_feeder_from_page_range(
    chroma_host: str,
    collection_name: str,
    start_page: int,
    end_page: int,
    token_limit: int = 3000,
    min_tokens: int = 1000,
    count_tokens: Callable[[str], int] = lambda x: len(
        x.split()
    ),  # Replace with tokenizer
) -> List[str]:
    """
    Fetches a specific page range from ChromaDB and generates context-aware sliding window strings.

    Parameters:
        chroma_host (str): ChromaDB host
        collection_name (str): Name of the collection
        start_page (int): Page index to start from (0-based)
        end_page (int): Page index to stop at (exclusive)
        token_limit (int): Max token length per combined text
        min_tokens (int): Minimum tokens to aim for when combining pages
        count_tokens (Callable): Function to count tokens in a string

    Returns:
        List[str]: List of feeder text chunks
    """
    # 1. Connect to ChromaDB
    db = chromadb.HttpClient(host=chroma_host, port=8000)
    collection = db.get_or_create_collection(collection_name)

    # 2. Fetch pages in the requested range
    page_count = end_page - start_page
    results = collection.get(include=["documents"], offset=start_page, limit=page_count)
    # print("results : ",results)
    raw_pages = results.get("documents", [])
    print("pages : ", raw_pages)
    seen = set()
    pages = []
    for page in raw_pages:
        normalized = page.strip()
        if normalized not in seen:
            seen.add(normalized)
            pages.append(normalized)
    feeder = []
    num_pages = len(pages)
    print("num_pages : ", num_pages)
    # 3. Sliding window over fetched pages
    for i in range(num_pages - 1):
        combined = pages[i]
        j = i + 1

        while j < num_pages:
            new_combined = combined + "\n" + pages[j]
            # print("new_combined :",new_combined)
            tokens = count_tokens(new_combined)

            if tokens > token_limit:
                break
            elif tokens >= min_tokens:
                combined = new_combined
                break
            else:
                combined = new_combined
                j += 1

        feeder.append(combined)

    return feeder


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


def generate_struture(state: AgentState) -> AgentState:
    print("generate_struture")
    qa_advanced, llm = get_llm_object(state["collection_names"])

    if not qa_advanced or not llm:
        # state["outline"] = Outline(outline=[])
        state["no_iterate"] = 0
        return state

    schema = json.dumps(Struture.model_json_schema())

    message = f"""
        You are a report assistant tasked with generating a structured class definition from user context.

        Instructions:
        1. Carefully read the context provided.
        2. Based on that, suggest a class name and its complete Python class definition.
        3. The Python class should follow the Pydantic format.
        4. Include nested models if needed (but fully define them inside the class string).
        5. Output strictly the JSON object with the following fields:
            - "class_name": A valid PascalCase class name.
            - "class_struture": A complete Python class string (including imports and nested models if required).


        Context:
        {state["query"]}

        Output Format:
        {{
        "class_name": "YourClassName",
        "class_struture": "class YourClassName(BaseModel):\\n    field1: str\\n    field2: int\\n..."
        }}



        
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
                validated = Struture.model_validate(parsed)
                state["struture"] = validated
                break  # Success, exit retry loop
            else:
                print(f"Attempt {attempt + 1} - Failed to parse JSON response.")

        except Exception as e:
            print(f"Attempt {attempt + 1} - Exception occurred:", e)
        time.sleep(3)
    else:
        # All attempts failed
        print("Failed to generate a valid outline after 2 attempts.")
        state["outline"] = Struture(class_name="", class_struture="")

    return state


def feed_data(state: AgentState):
    print("getter_data")

    tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")
    count_tokens = lambda x: len(tokenizer.encode(x))

    db = chromadb.HttpClient(host="localhost", port=8000)
    collection = db.get_or_create_collection(state["collection_name"])

    # Compute total number of pages once
    if state["total_pages"] == -1:
        print("Calculating total pages...")
        total = 0
        offset = 0
        batch_size = 100
        while True:
            batch = collection.get(offset=offset, limit=batch_size)
            count = len(batch["ids"])
            if count == 0:
                break
            total += count
            offset += batch_size
        state["total_pages"] = total
        if total == 0:
            state["error"] = True
            state["error_message"] = "No Data Found."
            return state
        print(f"Total pages: {total}")

    # Configurable limit (pages per batch)
    limit = state.get("limit", 10)

    # Initialize no_iterate
    state["no_iterate"] = state.get("no_iterate", 0)

    # Compute start and end page for current iteration
    start_page = state["no_iterate"] * limit
    end_page = min(start_page + limit, state["total_pages"])
    state["start_page"] = start_page
    state["end_page"] = end_page
    if start_page >= state["total_pages"]:
        print("All pages processed.")
        return state  # Exit early

    print(f"Processing pages {start_page} to {end_page}...")

    feeder = generate_feeder_from_page_range(
        chroma_host="localhost",
        collection_name=state["collection_name"],
        start_page=start_page,
        end_page=end_page,
        token_limit=3000,
        min_tokens=1000,
        count_tokens=count_tokens,
    )

    print(feeder)
    print(f"Feeder has {len(feeder)} items for pages {start_page}–{end_page - 1}")
    state["feeder"] = feeder
    # Update iteration count
    state["no_iterate"] += 1

    return state


def extract_structured_data_from_feeder(state: AgentState) -> AgentState:
    print("extract_structured_data_from_feeder")

    if not state.get("struture") or not state.get("feeder"):
        print("Missing struture or feeder in state.")
        state["error"] = True
        state["error_message"] = "Missing class structure or feeder input."
        return state

    # Setup: load LLM and dynamic class
    qa_advanced, llm = get_llm_object(state["collection_names"])
    if not qa_advanced or not llm:
        state["error"] = True
        state["error_message"] = "LLM loading failed."
        return state

    struture = state["struture"]
    namespace = {"BaseModel": BaseModel}

    try:
        exec(dedent(struture.class_struture), namespace)
        DynamicClass = namespace[struture.class_name]
    except Exception as e:
        state["error"] = True
        state["error_message"] = f"Failed to create class from structure: {e}"
        return state

    # Ensure answers list is initialized
    state["answer"] = []
    schema = json.dumps(DynamicClass.model_json_schema())

    # Iterate over each feeder entry
    for idx, context in enumerate(state["feeder"]):
        print(f"Processing feeder item {idx + 1}/{len(state['feeder'])}")

        message = f"""
        You are a structured data extractor. Based on the following Pydantic model definition, extract a JSON object from the input text.


        ### Input Text:
        {context}

        Output Requirements:
        Return only the JSON object instance (strictly adhering to the schema).
        Do not include any schema, explanations, or additional information in the output.
        {schema}
         """

        try:
            response = llm.invoke([HumanMessage(content=message)])
            raw_output = response.content
            parsed = extract_valid_json(raw_output)

            if not parsed:
                print(f"Feeder item {idx + 1} - failed to extract valid JSON.")
                continue

            validated = DynamicClass.model_validate(parsed)
            state["answer"].append(validated.model_dump())

        except Exception as e:
            print(f"Feeder item {idx + 1} - exception: {e}")
            continue

    return state


def stream_node(state: AgentState):
    print("stream_node")
    return state
