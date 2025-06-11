async def formate_answer_node(state: AgentState):
    print("formate_answer_node")
    qa_advanced, llm = get_llm_object(state["collection_names"])

    if not qa_advanced or not llm:
        return None

    chain = qa_advanced
    chat_history = state.get("chat_history", [])
    last_indexes = state.get("last_index", [])

    if not last_indexes:
        print("No messages to format.")
        return None

    summary = state.get("summary", "")

    for index in last_indexes:
        if index >= len(chat_history):
            print(f"Invalid index: {index}, skipping...")
            continue
        
        ai_message = chat_history[index]
        message_content = ai_message.content if hasattr(ai_message, 'content') else str(ai_message)

        # Create the formatting prompt
        message = f"""
            You are a professional **HTML Report Formatter**. Your task is to generate a **high-quality, well-structured HTML report section** based on the provided topic and main point.
            **Very Important <<No NEED TO ADD COMMENT ONLY DATA RELATED TO REPORT>>**

            ### Instructions:
            1. **Output must be valid HTML** — do **not** use Markdown formatting.
            2. Use appropriate HTML tags:
                - `<h2>`, `<h3>` for headings  
                - `<p>` for paragraphs  
                - `<ul>` / `<ol>` for bullet or numbered lists  
                - `<table>` for structured comparisons  
                - `<pre><code class="mermaid">` for diagrams  

            3. **Ensure all HTML tags are properly closed.**

            4. **Use the most appropriate Mermaid diagram type** for the content.

            5. Do **not** include any **Conclusion** section.

            6. Do **not** include parentheses `(` or `)`, ampersands `&`, or other special characters inside Mermaid node labels.

            ### Summary Output:
            {summary}

            ### Message to Format:
            {message_content}

            ### Final Output:
            Return a full HTLM + Mermaid formatted section. Think of it as a well-written, visual report section.
        """

        # Attempt formatting the message
        for attempt in range(3):
            try:
                response = llm.invoke([HumanMessage(content=message)])
                print(f"\nformate_answer_node (attempt {attempt + 1}):", "\n")
                
                # Update the message content in chat history
                chat_history[index] = AIMessage(content=response.content)
                print(f"Formatted message for index {index} successfully.")
                break  # Exit the retry loop on success
            except Exception as e:
                print(f"Error during chain.invoke (attempt {attempt + 1}):", repr(e))
            time.sleep(3)

    # Clear last_index to avoid duplicate formatting
    state["last_index"] = []

    # Return the updated state
    return state
