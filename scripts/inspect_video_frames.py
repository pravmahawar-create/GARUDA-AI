import cv2
import os

video_path = r"C:\Users\hp\Downloads\VID-20260925-WA0055.mp4"
out_dir = r"D:\GARUDA-AI\output\video_reference_frames"
os.makedirs(out_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS) or 25
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = total_frames / fps
print(f"Video FPS: {fps}, Total Frames: {total_frames}, Duration: {duration:.2f}s")

# Extract 12 evenly spaced frames
indices = [int(total_frames * i / 12) for i in range(12)]

for idx in indices:
    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
    ret, frame = cap.read()
    if ret:
        sec = int(idx / fps)
        out_name = os.path.join(out_dir, f"frame_{sec:02d}s.jpg")
        cv2.imwrite(out_name, frame)
        print(f"Saved: {out_name}")

cap.release()
