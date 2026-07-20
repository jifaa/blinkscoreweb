import json
from pathlib import Path

# Write empty semantic file for code-only corpus (Part B is skipped)
Path(r'graphify-out/.graphify_semantic.json').write_text(
    json.dumps({'nodes': [], 'edges': [], 'hyperedges': [], 'input_tokens': 0, 'output_tokens': 0}),
    encoding='utf-8'
)
print('Empty semantic file written')
