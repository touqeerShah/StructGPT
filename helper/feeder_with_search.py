from typing import List, Callable
from elasticsearch import Elasticsearch
import json
import tiktoken

ELASTIC_HOST = "http://localhost:9200"
es = Elasticsearch(ELASTIC_HOST)


def search_and_expand_with_neighbors_elastic(
    index_name: str,
    keywords: List[str] = None,
    token_limit: int = 3000,
    min_tokens: int = 1000,
    state: object = None,
    count_tokens: Callable[[str], int] = lambda x: len(x.split()),
) -> List[str]:
    try:
        if not keywords:
            print("📘 No keywords provided — fetching all pages...")
            query = {"query": {"match_all": {}}, "size": 1}
            response = es.search(index=index_name, body=query)
            hits = response["hits"]["hits"]
            # print(f"🔎 Hits returned: {len(hits)}")
            if not hits:
                state["error"] = True
                state["error_message"] = f"No data found in index: {index_name}"
                return state
            meta = hits[0]["_source"].get("metadata", {})
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
                return []

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


# === USAGE ===
tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")
count_tokens = lambda x: len(tokenizer.encode(x))

state = search_and_expand_with_neighbors_elastic(
    index_name="1-20-1",
    # keywords=["William Beaubien-Souligny"],
    token_limit=3000,
    min_tokens=1000,
    count_tokens=count_tokens,
    state={"total_pages": -1, "start_page": 0, "end_page": 0, "no_iterate": 1},
)
print("state : ", state)
