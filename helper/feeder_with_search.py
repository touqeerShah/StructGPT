from typing import List, Callable
from elasticsearch import Elasticsearch
import json
import tiktoken

ELASTIC_HOST = "http://localhost:9200"
es = Elasticsearch(ELASTIC_HOST)

def search_and_expand_with_neighbors_elastic(
    index_name: str,
    keywords: List[str],
    token_limit: int = 3000,
    min_tokens: int = 1000,
    count_tokens: Callable[[str], int] = lambda x: len(x.split()),
) -> List[str]:
    
    query_text = " ".join(keywords)

    # 1. Perform full-text search
    print("🔍 Performing full-text search in Elasticsearch...")
    query = {
        "query": {
            "match": {
                "content": {
                    "query": query_text,
                    "operator": "and"
                }
            }
        }
    }

    response = es.search(index=index_name, body=query)

    hits = response["hits"]["hits"]
    print(f"🔎 Hits returned: {len(hits)}")

    # 2. Extract matched pages from metadata and include ±1 neighbors
    matched_pages = set()
    metadata_map = {}
    for hit in hits:
        metadata = hit["_source"].get("metadata", {})
        page = metadata.get("page")
        if isinstance(page, int):
            matched_pages.update({page - 1, page, page + 1})
            metadata_map[page] = hit["_source"]

    print(f"📘 Pages matched or expanded: {sorted(matched_pages)}")

    # 3. Fetch all documents from index (up to 10k limit by default)
    print("📥 Fetching all documents from index...")
    all_docs = es.search(index=index_name, body={"query": {"match_all": {}}})

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
    with open("elastic_search_documents_only.json", "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    return chunks

# === USAGE ===
tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")
count_tokens = lambda x: len(tokenizer.encode(x))

feeder = search_and_expand_with_neighbors_elastic(
    index_name="kw24abstracts-1-20-1",
    keywords=["William Beaubien-Souligny"],
    token_limit=3000,
    min_tokens=1000,
    count_tokens=count_tokens,
)
