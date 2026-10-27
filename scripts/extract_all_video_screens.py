import cv2
import os

video_path = r"C:\Users\hp\Downloads\VID-20260925-WA0055.mp4"
out_dir = r"D:\GARUDA-AI\output\video_all_screens"
os.makedirs(out_dir, exist_ok=True)

cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS) or 30
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"Total frames: {total_frames}, FPS: {fps}")

# Sample every 10 seconds of the 361s video (36 frames)
for sec in range(0, int(total_frames / fps), 10):
    frame_no = int(sec * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_no)
    ret, frame = cap.read()
    if ret:
        fn = os.path.join(out_dir, f"sec_{sec:03d}.jpg")
        cv2.imwrite(fn, frame)

cap.release()
print("Extracted frames across entire video duration.")
