from typing import List, Callable
import chromadb

def generate_feeder_from_page_range(
    chroma_host: str,
    collection_name: str,
    start_page: int,
    end_page: int,
    token_limit: int = 3000,
    min_tokens: int = 1000,
    count_tokens: Callable[[str], int] = lambda x: len(x.split())  # Replace with tokenizer
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
    results = collection.get(
        include=["documents"],
        offset=start_page,
        limit=page_count
    )
    # print("results : ",results)
    raw_pages = results.get("documents", [])
    print("pages : ",raw_pages)
    seen = set()
    pages = []
    for page in raw_pages:
        normalized = page.strip()
        if normalized not in seen:
            seen.add(normalized)
            pages.append(normalized)
    feeder = []
    num_pages = len(pages)
    print("num_pages : ",num_pages)
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
import tiktoken
tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")
count_tokens = lambda x: len(tokenizer.encode(x))

feeder = generate_feeder_from_page_range(
    chroma_host="localhost",
    collection_name="KW24Abstracts-1-20-1",
    start_page=0,
    end_page=10,
    token_limit=3000,
    min_tokens=1000,
    count_tokens=count_tokens
)

# print(feeder)
print(f"Feeder has {len(feeder)} items from pages 100–149")



#from pydantic import BaseModel

# from pydantic import BaseModel

# # Your structure string with multiple classes
# structure = """
# class Address(BaseModel):
#     street: str
#     city: str
#     zip_code: str

# class User(BaseModel):
#     id: int
#     name: str
#     email: str
#     address: Address
# """

# # Step 1: Prepare the execution namespace
# namespace = {'BaseModel': BaseModel}

# # Step 2: Execute the structure string to define the classes
# exec(structure, namespace)

# # Step 3: Extract the class objects
# User = namespace['User']
# Address = namespace['Address']

# # Step 4: Create and validate an object using nested structure
# data = {
#     "id": 1,
#     "name": "Diego",
#     "email": "diego@example.com",
#     "address": {
#         "street": "Main St",
#         "city": "Berlin",
#         "zip_code": "10115"
#     }
# }

# user = User.model_validate(data)

# print(user)
# print(user.address.city)
