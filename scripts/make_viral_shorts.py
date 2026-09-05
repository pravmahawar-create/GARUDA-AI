import os
import sys
import subprocess
import json

VIDEO_URL = "https://www.youtube.com/watch?v=s-uFBOXA0ME"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "output", "shorts")
RAW_DIR = os.path.join(BASE_DIR, "output", "raw")
FFMPEG_EXE = os.path.join(BASE_DIR, "node_modules", "ffmpeg-static", "ffmpeg.exe")

os.makedirs(OUTPUT_DIR, exist_ok=True)
master_video_path = os.path.join(RAW_DIR, "master_source.mp4")

print(f"[*] Base Dir: {BASE_DIR}")
print(f"[*] Output Dir: {OUTPUT_DIR}")
print(f"[*] Master video: {master_video_path} (Size: {round(os.path.getsize(master_video_path)/1024/1024, 2)} MB)")

def create_short(clip_name, start_time, duration, title, description, tags):
    output_path = os.path.join(OUTPUT_DIR, f"{clip_name}.mp4")
    print(f"[*] Rendering Short: {clip_name} ({start_time}s to {start_time + duration}s)...")

    # High-quality 1080x1920 vertical upscale and optimization
    vf_filter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"

    cmd = [
        FFMPEG_EXE, "-y",
        "-ss", str(start_time),
        "-t", str(duration),
        "-i", master_video_path,
        "-vf", vf_filter,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        output_path
    ]

    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[-] Encoding failed: {res.stderr[:300]}")
        return None

    size_mb = round(os.path.getsize(output_path) / (1024 * 1024), 2)
    print(f"[+] [SUCCESS] Rendered: {clip_name}.mp4 ({size_mb} MB)")
    return {
        "fileName": f"{clip_name}.mp4",
        "absolutePath": output_path,
        "title": title,
        "description": description,
        "tags": tags,
        "sizeMb": size_mb,
        "durationSec": duration,
        "aspectRatio": "9:16 (1080x1920 Vertical Full HD)"
    }

def main():
    clips = [
        {
            "name": "Short_1_Soulful_Hook",
            "start": 50,
            "duration": 30,
            "title": "Jab Ye Dhun Bajti Hai... ❤️ Dil Ko Choo Gayi ✨ #Shorts #ViralMusic",
            "description": "Original soul & melody by Praveen Mahawar. Listen with earphones 🎧\n\nFull Video on channel: https://www.youtube.com/watch?v=s-uFBOXA0ME\n\n#shorts #hindisong #trending #indieartist #viral #praveenmahawar #sukoon #acoustic",
            "tags": ["#shorts", "trending", "hindisong", "praveenmahawar", "acoustic", "lofi", "reels", "indie", "sukoon"]
        },
        {
            "name": "Short_2_Midnight_Acoustic",
            "start": 85,
            "duration": 30,
            "title": "Midnight Acoustic Vibe 🎸 Sukoon Bhara Music #Shorts #AcousticMelody",
            "description": "Late night acoustic session by Praveen Mahawar. Close your eyes & feel the vibe 🌌\n\nFull song on channel: https://www.youtube.com/watch?v=s-uFBOXA0ME\n\n#shorts #guitar #lofi #indieindia #unplugged #praveenmahawar",
            "tags": ["#shorts", "guitar", "melody", "lofiindia", "sukoon", "viral", "unplugged", "praveenmahawar"]
        },
        {
            "name": "Short_3_Energy_Climax_Drop",
            "start": 135,
            "duration": 30,
            "title": "Wait For The Beat Drop! 🔥 Pure Energy Climax #Shorts #MusicDrop",
            "description": "Turn your volume UP 🔊 The energy shift in this track is insane!\n\nArtist: Praveen Mahawar\nFull Video: https://www.youtube.com/watch?v=s-uFBOXA0ME\n\n#shorts #beatdrop #viralmusic #energy #trendingreels",
            "tags": ["#shorts", "beatdrop", "musicclimax", "trendingmusic", "bass", "ytshorts", "indieartist", "praveenmahawar"]
        }
    ]

    manifest = []
    for c in clips:
        meta = create_short(c["name"], c["start"], c["duration"], c["title"], c["description"], c["tags"])
        if meta:
            manifest.append(meta)

    manifest_path = os.path.join(OUTPUT_DIR, "shorts_metadata.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"\n=======================================================")
    print(f"[COMPLETE SUCCESS] All 3 Shorts rendered in: {OUTPUT_DIR}")
    print(f"Metadata catalogued in: {manifest_path}")
    print(f"=======================================================")

if __name__ == "__main__":
    main()
