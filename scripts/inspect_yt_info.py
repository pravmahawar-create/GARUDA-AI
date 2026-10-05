import json
import sys

try:
    with open('output/yt_video_info.json', 'r', encoding='utf-16') as f:
        data = json.load(f)
except Exception:
    with open('output/yt_video_info.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

out = []
out.append(f"Title: {data.get('title')}")
out.append(f"Channel: {data.get('channel')}")
out.append(f"Duration (min): {(data.get('duration') or 0) / 60:.1f}")

out.append("\n--- Chapters ---")
for c in data.get('chapters') or []:
    st = int(c.get('start_time', 0))
    out.append(f"{st//60:02d}:{st%60:02d} - {c.get('title')}")

out.append("\n--- Description ---")
out.append(data.get('description', ''))

out.append("\n--- Tags ---")
out.append(", ".join(data.get('tags') or []))

with open('output/yt_video_analysis.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(out))

print("Successfully written to output/yt_video_analysis.txt")
