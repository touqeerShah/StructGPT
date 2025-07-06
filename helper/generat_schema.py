from pydantic import BaseModel, Field

import random
import json
from typing import List, Dict
import requests
from elasticsearch import Elasticsearch

ELASTIC_HOST = "http://localhost:9200"
es = Elasticsearch(ELASTIC_HOST)


class Struture(BaseModel):
    class_name: str = Field(
        ..., description="class name is generate some as class sturture"
    )
    class_struture: str = Field(
        ..., description="class struture from llm model which user wants"
    )


schema = json.dumps(Struture.model_json_schema())


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
                size=1
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
            "query": {
                "match": {
                    "content": {
                        "query": query_text,
                        "operator": "and"
                    }
                }
            }
        }

        response = es.search(index=index_name, body=query, size=1000)
        hits = response["hits"]["hits"]

        if not hits:
            return []

        sampled_hits = random.sample(hits, min(sample_count, len(hits)))
        return [hit["_source"].get("content", "") for hit in sampled_hits]


def call_ollama_model(prompt: str, model: str = "mistral") -> str:
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={"model": model, "prompt": prompt, "stream": False},
    )
    response.raise_for_status()
    return response.json()["response"]


def infer_document_structure(
    pages: List[str], model: str = "mistral", max_rounds: int = 3, schema={}
) -> dict:
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
        # print(page)
        context = f"### Context:\n{page.strip()}\n"
        previous = (
            f"### Previous structure attempt:\n{json.dumps(inferred_schema, indent=2)}"
            if inferred_schema
            else ""
        )
        full_prompt = f"{prompt_prefix}\n{context}\n{previous}"

        try:
            response = call_ollama_model(full_prompt, model=model)
            parsed = json.loads(response.strip())
            inferred_schema = parsed
            print(f"✅ Round {i+1}: Structure inferred: {parsed['class_name']}")
        except Exception as e:
            print(
                f"❌ Failed to parse response at round {i+1}: {e}\nResponse:\n{response}"
            )
            continue

    return inferred_schema


sampled = sample_pages_by_offset("kw24abstracts-1-20-1", sample_count=5)

inferred = infer_document_structure(pages=sampled, model="mistral", schema=schema)
print("Final structure:\n", inferred["class_struture"])
