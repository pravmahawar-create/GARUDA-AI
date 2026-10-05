import re

with open("output/yt_sub.hi-orig.vtt", "r", encoding="utf-8") as f:
    content = f.read()

# Clean VTT lines
lines = content.splitlines()
cleaned_text = []
seen = set()

for line in lines:
    line = line.strip()
    if not line or line.startswith("WEBVTT") or "-->" in line or line.startswith("Kind:") or line.startswith("Language:"):
        continue
    # remove html tags like <c> </c>
    clean_line = re.sub(r"<[^>]+>", "", line).strip()
    if clean_line and clean_line not in seen:
        seen.add(clean_line)
        cleaned_text.append(clean_line)

full_transcript = " ".join(cleaned_text)

# Search for earning / paisa / monetization keywords
keywords = ["पैसे", "कमा", "earning", "क्लाइंट", "व्यापारी", "business", "freelanc", "fiverr", "upwork", "youtube", "मार्केट", "bootcamp", "secretary", "agent", "google flow", "avatar"]

results = []
for kw in keywords:
    matches = [m.start() for m in re.finditer(kw, full_transcript, re.IGNORECASE)]
    results.append(f"Keyword '{kw}': {len(matches)} occurrences")

# Extract snippets around earning / business
snippets = []
for m in re.finditer(r"(पैसे|कमा|business|व्यापारी|client|earning|service)", full_transcript, re.IGNORECASE):
    start = max(0, m.start() - 150)
    end = min(len(full_transcript), m.end() + 150)
    snippets.append(full_transcript[start:end])
    if len(snippets) >= 20:
        break

with open("output/yt_monetization_analysis.txt", "w", encoding="utf-8") as f:
    f.write("=== KEYWORD STATS ===\n" + "\n".join(results) + "\n\n")
    f.write("=== MONETIZATION SNIPPETS ===\n" + "\n---\n".join(snippets))

print("Monetization snippets saved to output/yt_monetization_analysis.txt")
