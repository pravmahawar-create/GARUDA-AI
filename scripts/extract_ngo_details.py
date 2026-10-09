import re

with open('data/rashtrabhakti_bundle.js', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'regNo\s*:\s*[`\'"]([^`\'"]+)[`\'"]', text):
    print('regNo value:', m.group(0))

for m in re.finditer(r'chairman\s*:\s*[`\'"]([^`\'"]+)[`\'"]', text):
    print('chairman value:', m.group(0))

# Also search around regNo
pos = text.find('regNo')
if pos != -1:
    print('Surrounding context of regNo:\n', text[max(0, pos-100):min(len(text), pos+300)])
