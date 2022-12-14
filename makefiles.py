import re
from pathlib import Path

pattern = "\$ref\: \.\/(docs\/v.*\.md)"

paths = [
    "/files/icas.yaml",
    "/files/formz.yaml",
    "/files/actions.yaml",
    "/files/crm.yaml",
    "/files/storage.yaml",
]

for path in paths:
    f = open('the-zen-of-python.txt','r')
    contents = f.read()
    f.close()

    docs = re.findall(pattern, contents)
    for doc in docs:
        doc_path = f"/files/spec/{doc}"
        file = Path('data.py')
        file.touch(exist_ok=True)
