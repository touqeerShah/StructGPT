from typing import List, Callable
import chromadb
from textwrap import dedent
from pydantic import BaseModel, Field
import random
import tiktoken
from elasticsearch import Elasticsearch
from app.src.agent.helper import AgentState, Struture
import json
from langchain_core.messages import HumanMessage, AIMessage
from pydantic import ValidationError


from app.src.llm.query_helper import get_llm_object

import time

import json
import re
from typing import Optional, Dict, Any


AWS_DEFAULT_REGION = "eu-central-1"
AWS_MODEL_ID = "anthropic.claude-sonnet-4-20250514-v1:0"
ELASTIC_HOST = "http://localhost:9200"
es = Elasticsearch(
    ELASTIC_HOST,
    headers={
        "Accept": "application/vnd.elasticsearch+json; compatible-with=8",
        "Content-Type": "application/vnd.elasticsearch+json; compatible-with=8",
    },
)


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


def sample_pages_by_offset(
    index_name: str, sample_count: int = 3, keywords: List[str] = []
) -> List[str]:
    if not keywords:
        # === 🔹 Sample from all documents ===
        count_result = es.count(index=index_name)
        total_docs = count_result["count"]

        if total_docs == 0:
            return []

        offsets = random.sample(range(total_docs), min(sample_count, total_docs))

        sampled_docs = []
        for offset in offsets:
            res = es.search(
                index=index_name,
                body={"query": {"match_all": {}}},
                from_=offset,
                size=1,
            )
            hits = res["hits"]["hits"]
            if hits:
                sampled_docs.append(hits[0]["_source"].get("content", ""))
        return sampled_docs
    else:
        # === 🔹 Sample from documents matching keywords ===
        query_text = " ".join(keywords)
        print("🔍 Performing keyword-based search in Elasticsearch...")
        query = {
            "query": {"match": {"content": {"query": query_text, "operator": "and"}}}
        }

        response = es.search(index=index_name, body=query, size=1000)
        hits = response["hits"]["hits"]

        if not hits:
            return []

        sampled_hits = random.sample(hits, min(sample_count, len(hits)))
        return [hit["_source"].get("content", "") for hit in sampled_hits]


async def search_and_expand_with_neighbors_elastic(
    index_name: str,
    keywords: List[str] = None,
    token_limit: int = 3000,
    min_tokens: int = 1000,
    state: AgentState = None,
    count_tokens: Callable[[str], int] = lambda x: len(x.split()),
) -> List[str]:
    try:
        if not keywords:
            print("📘 No keywords provided — fetching all pages...")
            query = {"query": {"match_all": {}}, "size": 1}
            response = es.search(index=index_name, body=query)
            hits = response["hits"]["hits"]
            print(f"🔎 Hits returned: {len(hits)}")
            if not hits:
                state["error"] = True
                state["error_message"] = f"No data found in index: {index_name}"
                return state
            meta = hits[0]["_source"].get("metadata", {})
            # print("meta  : ", meta)
            total_pages = meta.get("total_pages")
            if state["total_pages"] == -1:
                if total_pages == 0:
                    state["error"] = True
                    state["error_message"] = "No Data Found."
                    return state
                state["total_pages"] = total_pages
            # Build page map directly
            limit = state.get("limit", 10)
            # Initialize no_iterate
            state["no_iterate"] = state.get("no_iterate", 0)

            start_page = state["no_iterate"] * limit
            end_page = min(start_page + limit, state["total_pages"])
            state["start_page"] = start_page
            state["end_page"] = end_page
            if start_page >= state["total_pages"]:
                print("All pages processed.")
                return state  # Exit early
            # here  want to used starting and ending page
            query = {
                "query": {
                    "range": {"metadata.page": {"gte": start_page, "lt": end_page}}
                },
                "size": limit,
            }
            response = es.search(index=index_name, body=query)
            hits = response["hits"]["hits"]

            page_map = {}
            for hit in hits:
                meta = hit["_source"].get("metadata", {})
                page = meta.get("page")
                if isinstance(page, int):
                    page_map[page] = hit["_source"]["content"].strip()

            selected_texts = list(page_map.values())
        else:
            query_text = " ".join(keywords)

            # 1. Perform full-text search
            print("🔍 Performing full-text search in Elasticsearch...")
            query = {
                "query": {
                    "match": {"content": {"query": query_text, "operator": "and"}}
                },
                "size": 10000,
            }

            response = es.search(index=index_name, body=query)

            hits = response["hits"]["hits"]
            print(f"🔎 Hits returned: {len(hits)}")
            # Step 1: Set total pages based on full search result
            if state["total_pages"] == -1:
                state["total_pages"] = len(hits)

            limit = state.get("limit", 10)
            state["no_iterate"] = state.get("no_iterate", 0)

            start_page = state["no_iterate"] * limit
            end_page = min(start_page + limit, state["total_pages"])
            state["start_page"] = start_page
            state["end_page"] = end_page

            if start_page >= state["total_pages"]:
                print("✅ All matched pages processed.")
                return state

            # Step 2: Extract page numbers from this slice only
            subset_hits = hits[start_page:end_page]

            subset_pages = []
            for hit in subset_hits:
                metadata = hit["_source"].get("metadata", {})
                page = metadata.get("page")
                if isinstance(page, int):
                    subset_pages.append(page)

            # Step 3: Generate matched pages with ±1 neighbor logic
            matched_pages = set()
            for page in subset_pages:
                matched_pages.update({page - 1, page, page + 1})

            state["matched_pages"] = sorted(matched_pages)
            print(f"📘 Pages from subset + neighbors: {sorted(matched_pages)}")

            # 3. Fetch all documents from index (up to 10k limit by default)
            print("📥 Fetching all documents from index...")
            query = {
                "query": {"terms": {"metadata.page": list(matched_pages)}},
                "size": len(matched_pages),  # just enough to get them all
            }

            all_docs = es.search(
                index=index_name,
                body=query,
            )
            hits_all_docs = all_docs["hits"]["hits"]
            print(f"🔎 All Hits returned: {len(hits_all_docs)}")

            page_map = {}
            for hit in all_docs["hits"]["hits"]:
                meta = hit["_source"].get("metadata", {})
                page = meta.get("page")
                if isinstance(page, int):
                    page_map[page] = hit["_source"]["content"].strip()

            # 4. Extract selected pages
            selected_texts = []
            seen = set()
            for idx in sorted(matched_pages):
                text = page_map.get(idx, "")
                if text and text not in seen:
                    seen.add(text)
                    selected_texts.append(text)
    except Exception as e:
        state["error"] = True
        state["error_message"] = (
            f"Elasticsearch error for index '{index_name}': {str(e)}"
        )
        print(state["error_message"])
        return state
    # 5. Token-balanced grouping
    chunks = []
    i = 0
    while i < len(selected_texts):
        combined = selected_texts[i]
        j = i + 1
        while j < len(selected_texts):
            candidate = combined + "\n" + selected_texts[j]
            token_count = count_tokens(candidate)

            if token_count > token_limit:
                break

            combined = candidate
            if token_count >= min_tokens:
                break

            j += 1

        chunks.append(combined)
        i = j if j > i else i + 1

    print(f"📦 Final token-balanced chunks: {len(chunks)}")

    # Optional: save to disk
    # with open("elastic_search_documents_only.json", "w", encoding="utf-8") as f:
    #     json.dump(chunks, f, ensure_ascii=False, indent=2)
    state["feeder"] = chunks
    return state


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
    # print("pages : ", raw_pages)
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


def infer_document_structure(state: AgentState) -> dict:
    pages = sample_pages_by_offset(
        state["collection_name"], sample_count=5, keywords=state["keywords"]
    )
    llm = get_llm_object(state["collection_name"])

    if not llm:
        # state["outline"] = Outline(outline=[])
        state["no_iterate"] = 0
        return state
    inferred_schema = None
    schema = json.dumps(Struture.model_json_schema())
    prompt_prefix = f"""You are a report assistant tasked with generating a structured class definition from user context.

        Instructions:
        1. Carefully read the context provided.
        2. Based on that, suggest a class name and its complete Python class definition.
        3. The Python class must follow **Pydantic v2 standards**.
        4. Include nested models if needed (and define them fully within the same string).
        5. Return only a strict JSON object with two fields:
            - "class_name": A valid PascalCase name for the top-level model.
            - "class_struture": A complete Python class string that can be executed directly with `exec()`.

        ### Pydantic v2 Rules (Important):
        - Use `pattern=...` instead of `regex=...` in `Field()`.
        - You can use constraints like `min_length`, `max_length`, `gt`, `lt`, `ge`, `le` inside `Field()`.
        - All classes should inherit from `BaseModel`.
        - Use type hints like `str`, `int`, `float`, `bool`, `List[str]`, `Optional[int]` correctly.
        - Use `from typing import List, Optional` if needed.
        - Import `Field` and `BaseModel` at the top: `from pydantic import BaseModel, Field`.

        ### Output Format:
        {{
            "class_name": "YourClassName",
            "class_struture": "from pydantic import BaseModel, Field\\nfrom typing import List, Optional\\n\\nclass YourClassName(BaseModel):\\n    field1: str\\n    field2: Optional[int] = None"
            }}

        Return only the JSON object. Do not explain or comment.
        ### Output Requirements:
            - Return only the JSON object.
            - Do not explain the class.
            - Do not include any comments or markdown.
            - Do not include the schema or any extra text.
            {schema}
        """

    # sampled = sample_pages(pages, count=max_rounds)
    for i, page in enumerate(pages):
        context = f"### Context:\n{page.strip()}\n"
        previous = (
            f"### Previous structure attempt:\n{json.dumps(state['struture'].model_dump(), indent=2)}"
            if state.get("struture")
            else ""
        )
        full_prompt = f"{prompt_prefix}\n{context}\n{previous}"

        try:
            for attempt in range(2):  # try twice
                try:
                    response = llm.invoke([HumanMessage(content=full_prompt)])
                    raw_result = (
                        response.content if hasattr(response, "content") else response
                    )
                    print(f"\nAttempt {attempt + 1} ")
                    print("raw_result : ", raw_result)

                    parsed = extract_valid_json(raw_result)
                    if parsed:
                        try:
                            validated = Struture.model_validate(parsed)
                            state["struture"] = validated
                            print(
                                f"✅ Round {i+1}: Structure inferred: {parsed['class_name']}"
                            )
                            break  # Success
                        except ValidationError as ve:
                            print(f"Validation failed: {ve}")
                    else:
                        print(f"Attempt {attempt + 1} - Failed to parse JSON response.")
                except Exception as e:
                    print(f"Attempt {attempt + 1} - Exception occurred:", e)
                time.sleep(3)
            else:
                print("❌ Failed to generate a valid structure after 2 attempts.")
                state["struture"] = None

        except Exception as e:
            print(
                f"❌ Failed to parse response at round {i+1}: {e}\nResponse:\n{response}"
            )
            continue

    # ✅ Final check after all page rounds
    if not isinstance(state.get("struture"), Struture):
        state["error"] = True
        state["error_message"] = f"No valid structure inferred from any page in index"
    state["next_step"] = "infer_split_regex_node"

    return state


def generate_struture(state: AgentState) -> AgentState:
    print("generate_struture")
    llm = get_llm_object(state["collection_name"])

    if not llm:
        # state["outline"] = Outline(outline=[])
        state["no_iterate"] = 0
        return state

    schema = json.dumps(Struture.model_json_schema())

    message = f"""
    You are a report assistant tasked with generating a structured class definition from user context.

    Instructions:
    1. Carefully read the context provided.
    2. Based on that, suggest a class name and its complete Python class definition.
    3. The Python class must follow **Pydantic v2 standards**.
    4. Include nested models if needed (and define them fully within the same string).
    5. Return only a strict JSON object with two fields:
        - "class_name": A valid PascalCase name for the top-level model.
        - "class_struture": A complete Python class string that can be executed directly with `exec()`.

    ### Pydantic v2 Rules (Important):
    - Use `pattern=...` instead of `regex=...` in `Field()`.
    - You can use constraints like `min_length`, `max_length`, `gt`, `lt`, `ge`, `le` inside `Field()`.
    - All classes should inherit from `BaseModel`.
    - Use type hints like `str`, `int`, `float`, `bool`, `List[str]`, `Optional[int]` correctly.
    - Use `from typing import List, Optional` if needed.
    - Import `Field` and `BaseModel` at the top: `from pydantic import BaseModel, Field`.

    ### Fields:
    {" ".join(state["fields"])}

    ### Context:
    {" ".join(state["query"])}
    
    ### Output Format:
    {{
    "class_name": "YourClassName",
    "class_struture": "from pydantic import BaseModel, Field\\nfrom typing import List, Optional\\n\\nclass YourClassName(BaseModel):\\n    field1: str\\n    field2: Optional[int] = None"
    }}

    ### Output Requirements:
    - Return only the JSON object.
    - Do not explain the class.
    - Do not include any comments or markdown.
    - Do not include the schema or any extra text.
    {schema}
    """

    # print("message",message)
    for attempt in range(2):  # try twice
        try:
            response = llm.invoke([HumanMessage(content=message)])
            # print("response",response)
            raw_result = response.content if hasattr(response, "content") else response
            print(f"\nAttempt {attempt + 1} ")
            print("raw_result : ", raw_result)
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
        print("Failed to generate a valid struture after 2 attempts.")
        state["struture"] = None
    # ✅ Final check after all page rounds
    if not isinstance(state.get("struture"), Struture):
        state["error"] = True
        state["error_message"] = f"No valid structure "
    state["next_step"] = "infer_split_regex_node"
    return state


async def feed_data(state: AgentState):
    print("getter_data")

    tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")
    count_tokens = lambda x: len(tokenizer.encode(x))
    collection_name = state.get("collection_name")
    keywords = state.get("keywords", [])
    if not collection_name or not isinstance(collection_name, str):
        state["error"] = True
        state["error_message"] = "Invalid or missing collection_name in state."
        return state

    state = await search_and_expand_with_neighbors_elastic(
        index_name=collection_name,
        keywords=keywords,
        token_limit=3000,
        min_tokens=1000,
        count_tokens=count_tokens,
        state=state,
    )

    # print(feeder)
    start_page = state["start_page"]
    end_page = state["end_page"]
    feeder = state["feeder"]
    print(f"Feeder has {len(feeder)} items for pages {start_page} – {end_page - 1}")
    # state["feeder"] = feeder
    # Update iteration count
    state["no_iterate"] += 1
    state["next_step"] = "extract_structured_data_from_feeder_node"

    return state


def extract_structured_data_from_feeder(state: AgentState) -> AgentState:
    print("extract_structured_data_from_feeder")

    if not state.get("struture") or not state.get("feeder"):
        print("Missing struture or feeder in state.")
        state["error"] = True
        state["error_message"] = "Missing class structure or feeder input."
        return state

    # Setup: load LLM and dynamic class
    llm = get_llm_object(state["collection_name"])
    if not llm:
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
        # print(f"\n\n{context}\n\n")
        chunks = re.split(state["split_pattern"], context, flags=re.MULTILINE)
        # Step 2: Merge mis-split chunks based on pattern alignment
        results: List[str] = []

        for i in range(len(chunks)):
            if chunks[i].strip():
                if i > 0 and not re.match(state["split_pattern"], chunks[i]):
                    results[-1] += "\n" + chunks[i]
                else:
                    results.append(chunks[i])
        print("len results : ", len(results))
        for idx, chunk in enumerate(results):
            message = f"""
                You are a structured data extractor. Based on the following Pydantic model definition, extract a JSON object from the input text.

                Extra Details :
                {state["query"]}

                Input Text:
                {chunk}

                Output Requirements:
                - Return only a **JSON array** of objects matching the schema.
                - No markdown, explanations, or comments.
                - Just valid JSON Array output like: [{...}, {...}]
                - The array can be empty if nothing matches.
                
                Schema:
                {schema}

                """

            try:
                response = llm.invoke([HumanMessage(content=message)])
                raw_output = (
                    response.content if hasattr(response, "content") else response
                )
                print("\raw_output : ", raw_output)

                parsed = extract_valid_json(raw_output)
                print("\nparsed : ", parsed)
                if not parsed or not isinstance(parsed, list):
                    print(f"Feeder item {idx + 1} - JSON not a list or not valid.")
                    continue

                for item in parsed:
                    try:
                        validated = DynamicClass.model_validate(item)
                        state["answer"].append(validated.model_dump())
                    except Exception as ve:
                        print(
                            f"Validation failed for one item in feeder {idx + 1}: {ve}"
                        )
                        continue

            except Exception as e:
                print(f"Feeder item {idx + 1} - exception: {e}")
                continue
    state["next_step"] = "stream"

    return state


def stream_node(state: AgentState):
    print("stream_node")
    return state


def infer_split_regex(
    state: AgentState,
) -> Optional[str]:
    pages = sample_pages_by_offset("kw24abstracts-1-20-1", sample_count=5)
    llm = get_llm_object(state["collection_name"])
    print("== = = = > ", state["struture"])
    class_structure = state["struture"].class_struture
    """
    Uses an LLM to infer a regex pattern to split a document into chunks matching a given Pydantic class.
    Tries up to `max_attempts` and feeds back failed regex patterns for improvement.
    """
    previous_pattern = None
    patterns: List[str] = []
    for i, page in enumerate(pages):
        print(f"\n🔁 Attempt {i} to infer regex...")

        feedback = (
            f"\nHere was the previous regexs from other pages with some document:\n{patterns}\n"
            "make regex which support all those page it will be general for all user regexs share above"
            if patterns
            else ""
        )

        prompt = f"""
                You are an expert in analyzing unstructured text to extract structured records.

                ## Goal:
                Analyze the sample input text and identify the optimal boundary **string or pattern** to use with Python's `re.split()` so that **each resulting chunk will contain one full logical record** matching the fields in the given class structure.

                ## Requirements:
                - Carefully examine the class structure to understand what fields must be present in each complete record.
                - Infer a **distinctive, recurring pattern** in the input text that marks the start of a new record (e.g., titles, session headers, section dividers, IDs, etc.).
                - Return only the **Python regex pattern** that can be used with `re.split()` to split the input into logical chunks.
                - The pattern should be **strongly anchored** (e.g., look for section headers, abstract types, unique codes like `TH-OR01`, etc.).
                - Your output must be a **raw regex pattern** inside triple backticks — no extra comments or markdown.

                ## Class Structure:
                {class_structure}

                ## Sample Input Text:
                {page}

                ## Output:
                A single valid Python regex pattern to split the text into chunks containing one complete record each.

                {feedback}

                """

        # print(prompt)
        try:
            response = llm.invoke([HumanMessage(content=prompt)])
            raw_output = response.content if hasattr(response, "content") else response
            print("🧠 LLM raw regex response:\n", raw_output)

            match = re.search(r"```(?:python)?\s*(.+?)\s*```", raw_output, re.DOTALL)
            if match:
                previous_pattern = match.group(1).strip()
                print("✅ Inferred regex pattern:", previous_pattern)
                patterns.append(raw_output)

            else:
                print("⚠️ Could not extract regex pattern. Will retry...")
                previous_pattern = raw_output.strip()
        except Exception as e:
            print(f"❌ LLM regex generation failed: {e}")
            state["error"] = True
            state["error_message"] = f"{e}"
            break

    state["split_pattern"] = previous_pattern
    print("previous_pattern : ", previous_pattern)
    state["next_step"] = "feed_data_node"
    return state
