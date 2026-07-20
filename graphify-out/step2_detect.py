import json
from graphify.detect import detect
from pathlib import Path

INPUT_PATH = Path(r'D:\Project_AplikasiWeb\Next.JS\blinkscoreweb\src')
result = detect(INPUT_PATH)
print(json.dumps(result, ensure_ascii=False))
