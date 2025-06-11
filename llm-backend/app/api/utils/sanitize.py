import re

def sanitize_name(name):
    return re.sub(r"\W+", "_", name).strip("_")
