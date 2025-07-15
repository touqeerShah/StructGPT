import json
import csv
import xml.etree.ElementTree as ET
from typing import Union


import csv
import io

def to_csv_stream(docs: list[dict]):
    # Get all unique fieldnames from docs
    all_keys = set()
    for doc in docs:
        all_keys.update(doc.keys())
    fieldnames = list(all_keys)

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=fieldnames)
    writer.writeheader()
    for doc in docs:
        writer.writerow(doc)
        yield buffer.getvalue()
        buffer.seek(0)
        buffer.truncate(0)



def to_json_stream(documents):
    yield "["
    first = True
    for doc in documents:
        if not first:
            yield ","
        yield json.dumps(doc)
        first = False
    yield "]"


def to_xml_stream(documents, root_tag="records", record_tag="record"):
    yield f"<{root_tag}>"
    for doc in documents:
        yield f"<{record_tag}>"
        for k, v in doc.items():
            yield f"<{k}>{v}</{k}>"
        yield f"</{record_tag}>"
    yield f"</{root_tag}>"
