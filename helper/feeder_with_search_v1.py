from typing import List, Callable
import chromadb
import json

def search_and_expand_with_neighbors(
    chroma_host: str,
    collection_name: str,
    keywords: List[str],
    token_limit: int = 3000,
    min_tokens: int = 1000,
    count_tokens: Callable[[str], int] = lambda x: len(x.split())
) -> List[str]:
    """
    Performs keyword-based search over a ChromaDB collection, includes ±1 neighbor pages,
    and returns token-balanced chunks.

    Assumes each document has metadata with 'page': int.

    Args:
        chroma_host (str): Hostname of the ChromaDB server.
        collection_name (str): The collection to query.
        keywords (List[str]): List of keywords to search for.
        token_limit (int): Maximum token length for a combined chunk.
        min_tokens (int): Minimum tokens to combine before stopping.
        count_tokens (Callable): Function to count tokens in a string.

    Returns:
        List[str]: Token-balanced list of chunks from matched and adjacent pages.
    """

    # 1. Connect to Chroma
    db = chromadb.HttpClient(host=chroma_host, port=8000)
    collection = db.get_or_create_collection(collection_name)

    # 2. Perform keyword search using query_texts
    print("🔍 Performing keyword search...")
    search_results = collection.query(
        query_texts=keywords,
        n_results=100,
        include=["documents", "metadatas"]
    )
    with open("search_output.json", "w", encoding="utf-8") as f:
        json.dump(search_results, f, ensure_ascii=False, indent=2)
    print("search_results :",len(search_results))
    # 3. Extract matching page numbers from metadata
    matched_pages = set()
    for metadata_list in search_results.get("metadatas", []):
        # print("\n\nmetadata_list : ",len())
        for meta in metadata_list:
            page = meta.get("page")
            # print("\npage : ", page)
            if isinstance(page, int):
                matched_pages.update({page - 1, page, page + 1})

    print(f"🔎 Pages matched or expanded: {sorted(matched_pages)}")

    # 4. Load full collection to retrieve documents by page index
    print("📥 Loading entire collection...")
    all_pages = []
    offset = 0
    batch_size = 100

    while True:
        batch = collection.get(include=["documents"], offset=offset, limit=batch_size)
        docs = batch.get("documents", [])
        if not docs:
            break
        all_pages.extend(docs)
        offset += batch_size

    print(f"📄 Total pages in collection: {len(all_pages)}")

    # 5. Collect valid expanded pages
    pages = []
    seen = set()
    for idx in sorted(matched_pages):
        if 0 <= idx < len(all_pages):
            page_text = all_pages[idx].strip()
            if page_text and page_text not in seen:
                seen.add(page_text)
                pages.append(page_text)

    # 6. Token-aware sliding window
    feeder = []
    i = 0
    while i < len(pages):
        combined = pages[i]
        j = i + 1
        while j < len(pages):
            candidate = combined + "\n" + pages[j]
            token_count = count_tokens(candidate)

            if token_count > token_limit:
                break

            combined = candidate
            if token_count >= min_tokens:
                break

            j += 1

        feeder.append(combined)
        i = j if j > i else i + 1

    print(f"📦 Feeder chunks generated: {len(feeder)}")
    return feeder


import tiktoken
tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")
count_tokens = lambda x: len(tokenizer.encode(x))

feeder = search_and_expand_with_neighbors(
    chroma_host="localhost",
    collection_name="KW24Abstracts-1-20-1",
    keywords=["William Beaubien-Souligny"],
    token_limit=3000,
    min_tokens=1000,
    count_tokens=count_tokens
)
