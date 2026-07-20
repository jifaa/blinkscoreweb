import json
from pathlib import Path
from collections import Counter

raw = Path(r'graphify-out/.graphify_detect.json').read_text(encoding='utf-8', errors='replace')
d = json.loads(raw)
scan_root = d['scan_root']
all_files = [f for cat in ('code','document','paper','image','video') for f in d['files'].get(cat, [])]

counts = Counter()
for f in all_files:
    # strip scan_root prefix
    rel = f.replace(scan_root, '').strip('/').strip('\\')
    first = rel.split('/')[0] if '/' in rel else (rel.split('\\')[0] if '\\' in rel else rel)
    counts[first] += 1

for name, cnt in counts.most_common(10):
    print(f'{cnt:4d}  {name}')
