import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import subprocess
import imageio_ffmpeg

base_dir = r"D:\GARUDA-AI\veer_azaad_reel"
raw_dir = os.path.join(base_dir, "raw_media")
assets_dir = os.path.join(base_dir, "extracted_assets")
badges_dir = os.path.join(base_dir, "badges")
audio_path = os.path.join(base_dir, "audio", "jaidev_30s.mp3")
out_mp4_raw = os.path.join(base_dir, "reel_raw.mp4")
out_mp4_final = os.path.join(base_dir, "Veer_Azaad_Sanatan_Setu_Reel.mp4")

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

WIDTH, HEIGHT = 1080, 1920
FPS = 30
TOTAL_FRAMES = 900 # 30 seconds

print("Loading badges...")
badge_sanatan = cv2.imread(os.path.join(badges_dir, "badge_sanatan_setu.png"), cv2.IMREAD_UNCHANGED)
badge_veer = cv2.imread(os.path.join(badges_dir, "badge_veer_azaad.png"), cv2.IMREAD_UNCHANGED)

print("Loading photos...")
img_crowd = cv2.imread(os.path.join(raw_dir, "IMG-20260920-WA0014.jpg"))
img_team_smile = cv2.imread(os.path.join(raw_dir, "IMG-20260920-WA0013.jpg"))
img_team_seva = cv2.imread(os.path.join(raw_dir, "IMG-20260920-WA0011.jpg"))
img_diya = cv2.imread(os.path.join(assets_dir, "img_p11_2_58.jpeg"))

# Fast sequential clip extractor
def extract_video_range(vpath, start_sec, duration_sec, target_fps=30):
    cap = cv2.VideoCapture(vpath)
    cap_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    start_f = int(start_sec * cap_fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_f)
    num_frames = int(duration_sec * target_fps)
    frames = []
    
    while len(frames) < num_frames:
        ret, frame = cap.read()
        if not ret:
            if frames:
                frames.append(frames[-1].copy())
            else:
                break
            continue
        h, w = frame.shape[:2]
        scale = max(WIDTH / w, HEIGHT / h)
        nw, nh = int(w * scale), int(h * scale)
        resized = cv2.resize(frame, (nw, nh), interpolation=cv2.INTER_LINEAR)
        x_off = (nw - WIDTH) // 2
        y_off = (nh - HEIGHT) // 2
        cropped = resized[y_off:y_off+HEIGHT, x_off:x_off+WIDTH]
        frames.append(cropped)
    cap.release()
    return frames

print("Fast extracting video segments...")
v17_path = os.path.join(raw_dir, "VID-20260920-WA0017.mp4")
v15_path = os.path.join(raw_dir, "VID-20260920-WA0015.mp4")

clip_ganesh = extract_video_range(v17_path, 14.2, 3.5, FPS)
clip_seva1 = extract_video_range(v17_path, 0.5, 4.0, FPS)
clip_saffron = extract_video_range(v17_path, 6.0, 4.0, FPS)
clip_fast = extract_video_range(v15_path, 0.2, 1.5, FPS)

def make_ken_burns(img, num_frames, zoom_start=1.0, zoom_end=1.15, center_bias=(0.5, 0.5)):
    h, w = img.shape[:2]
    base_scale = max(WIDTH / w, HEIGHT / h)
    frames = []
    for i in range(num_frames):
        t = i / max(1, num_frames - 1)
        z = zoom_start + (zoom_end - zoom_start) * t
        scale = base_scale * z
        nw, nh = int(w * scale), int(h * scale)
        resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LINEAR)
        cx, cy = center_bias
        max_x = max(0, nw - WIDTH)
        max_y = max(0, nh - HEIGHT)
        x_off = int(max_x * cx)
        y_off = int(max_y * cy)
        crop = resized[y_off:y_off+HEIGHT, x_off:x_off+WIDTH]
        frames.append(crop)
    return frames

print("Preparing Ken Burns sequences...")
seq_crowd = make_ken_burns(img_crowd, 100, 1.0, 1.14, (0.5, 0.6))
seq_team_smile = make_ken_burns(img_team_smile, 120, 1.0, 1.18, (0.5, 0.35))
seq_team_seva = make_ken_burns(img_team_seva, 120, 1.16, 1.0, (0.5, 0.4))
seq_diya = make_ken_burns(img_diya, 45, 1.0, 1.22, (0.5, 0.5))

def overlay_3d_badge(frame, badge_rgba, angle_deg, cx, cy, scale=1.15, shadow=True):
    rad = np.radians(angle_deg)
    cos_a = np.cos(rad)
    if abs(cos_a) < 0.04:
        return
    bw, bh = badge_rgba.shape[1], badge_rgba.shape[0]
    src = np.array([[0,0], [bw,0], [bw,bh], [0,bh]], dtype=np.float32)
    w_curr = (bw * abs(cos_a)) * scale
    h_curr = bh * scale
    sin_a = np.sin(rad)
    persp = sin_a * 0.18
    dx = w_curr / 2.0
    dy_l = (h_curr / 2.0) * (1.0 + persp)
    dy_r = (h_curr / 2.0) * (1.0 - persp)
    
    if shadow:
        s_off_y = 12
        dst_s = np.array([
            [cx - dx, cy - dy_l + s_off_y],
            [cx + dx, cy - dy_r + s_off_y],
            [cx + dx, cy + dy_r + s_off_y],
            [cx - dx, cy + dy_l + s_off_y]
        ], dtype=np.float32)
        Ms = cv2.getPerspectiveTransform(src, dst_s)
        w_s = cv2.warpPerspective(badge_rgba, Ms, (WIDTH, HEIGHT), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0,0,0,0))
        alpha_s = (w_s[:, :, 3] / 255.0) * 0.5
        for c in range(3):
            frame[:, :, c] = ((1.0 - alpha_s) * frame[:, :, c]).astype(np.uint8)

    dst = np.array([
        [cx - dx, cy - dy_l],
        [cx + dx, cy - dy_r],
        [cx + dx, cy + dy_r],
        [cx - dx, cy + dy_l]
    ], dtype=np.float32)
    M = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(badge_rgba, M, (WIDTH, HEIGHT), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0,0,0,0))
    alpha = warped[:, :, 3] / 255.0
    for c in range(3):
        frame[:, :, c] = ((1.0 - alpha) * frame[:, :, c] + alpha * warped[:, :, c]).astype(np.uint8)

def draw_lower_banner(frame, title, subtitle="", bg_color=(10, 12, 22, 240), border_color=(255, 200, 30)):
    pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_img, "RGBA")
    
    bw, bh = 940, 140
    bx = (WIDTH - bw) // 2
    by = HEIGHT - 310
    
    draw.rounded_rectangle([bx-5, by-5, bx+bw+5, by+bh+5], radius=35, fill=(0, 0, 0, 140))
    draw.rounded_rectangle([bx, by, bx+bw, by+bh], radius=30, fill=bg_color, outline=border_color, width=4)
    
    f_title = ImageFont.truetype("arialbd.ttf", 46)
    f_sub = ImageFont.truetype("arialbd.ttf", 28)

    bbox_t = draw.textbbox((0, 0), title, font=f_title)
    tx = bx + (bw - (bbox_t[2] - bbox_t[0])) // 2
    draw.text((tx, by + 22), title, font=f_title, fill=(255, 215, 30))
    
    if subtitle:
        bbox_s = draw.textbbox((0, 0), subtitle, font=f_sub)
        sx = bx + (bw - (bbox_s[2] - bbox_s[0])) // 2
        draw.text((sx, by + 82), subtitle, font=f_sub, fill=(240, 245, 255))
        
    return cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

def apply_flash(frame, intensity):
    if intensity <= 0.01: return frame
    white = np.full_like(frame, 255)
    return cv2.addWeighted(frame, 1.0 - intensity, white, intensity, 0)

np.random.seed(42)
particles = []
for _ in range(50):
    particles.append([
        np.random.randint(40, WIDTH-40),
        np.random.randint(80, HEIGHT-80),
        np.random.uniform(0.6, 2.8),
        np.random.uniform(2, 5.5),
        np.random.uniform(0.4, 0.95)
    ])

def draw_particles(frame, f_idx):
    for p in particles:
        p[1] -= p[2]
        if p[1] < 40:
            p[1] = HEIGHT - 80
            p[0] = np.random.randint(40, WIDTH-40)
        alpha = p[4] * (0.6 + 0.4 * np.sin(f_idx * 0.12 + p[0]))
        color = (int(70 * alpha), int(210 * alpha), int(255 * alpha))
        cv2.circle(frame, (int(p[0]), int(p[1])), int(p[3]), color, -1)

print("Rendering video frames...")
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out_writer = cv2.VideoWriter(out_mp4_raw, fourcc, FPS, (WIDTH, HEIGHT))

for f in range(TOTAL_FRAMES):
    # SEGMENT 1: 0 - 95 (0.0s - 3.2s) Divine Ganesh Pandal
    if f < 95:
        idx = min(f, len(clip_ganesh) - 1)
        base = clip_ganesh[idx].copy()
        draw_particles(base, f)
        
        if f < 25:
            angle = -90.0 * (1.0 - (f / 25.0)**2)
        elif f < 75:
            angle = 3.5 * np.sin((f - 25) * 0.15)
        else:
            angle = 90.0 * ((f - 75) / 20.0)**2
            
        overlay_3d_badge(base, badge_sanatan, angle, 540, 310, 1.25)
        base = draw_lower_banner(base, "JAI GANESH DEVA", "DIVYA DARSHAN • MAHA BHANDARA", border_color=(255, 180, 20))
        
        if f < 8:
            base = apply_flash(base, (8 - f) / 8.0 * 0.85)
        elif f >= 88:
            base = apply_flash(base, (f - 88) / 7.0 * 0.75)
            
        out_writer.write(base)

    # SEGMENT 2: 95 - 195 (3.2s - 6.5s) Night Crowd Gathering
    elif f < 195:
        rel_f = f - 95
        idx = min(rel_f, len(seq_crowd) - 1)
        base = seq_crowd[idx].copy()
        draw_particles(base, f)
        
        base = draw_lower_banner(base, "GRAND BHANDARA MAHOTSAV", "DEVOTEES GATHERED IN THOUSANDS", border_color=(255, 160, 0))
        
        if rel_f < 6:
            base = apply_flash(base, (6 - rel_f) / 6.0 * 0.85)
        elif rel_f >= 92:
            base = apply_flash(base, (rel_f - 92) / 8.0 * 0.75)
            
        out_writer.write(base)

    # SEGMENT 3: 195 - 315 (6.5s - 10.5s) Seva in Motion (Veer Azaad)
    elif f < 315:
        rel_f = f - 195
        idx = min(rel_f, len(clip_seva1) - 1)
        base = clip_seva1[idx].copy()
        draw_particles(base, f)
        
        if rel_f < 25:
            angle = -90.0 * (1.0 - (rel_f / 25.0)**2)
        elif rel_f < 95:
            angle = 3.5 * np.sin((rel_f - 25) * 0.15)
        else:
            angle = 90.0 * ((rel_f - 95) / 25.0)**2
            
        overlay_3d_badge(base, badge_veer, angle, 540, 310, 1.25)
        base = draw_lower_banner(base, "SEVA HI PARAMO DHARMA", "HOT PRASAD DISTRIBUTION IN ACTION", border_color=(255, 215, 0))
        
        if rel_f < 6:
            base = apply_flash(base, (6 - rel_f) / 6.0 * 0.85)
        elif rel_f >= 112:
            base = apply_flash(base, (rel_f - 112) / 8.0 * 0.75)
            
        out_writer.write(base)

    # SEGMENT 4: 315 - 435 (10.5s - 14.5s) Team Smile (Yellow T-shirts)
    elif f < 435:
        rel_f = f - 315
        idx = min(rel_f, len(seq_team_smile) - 1)
        base = seq_team_smile[idx].copy()
        draw_particles(base, f)
        
        pulse = 0.0
        for p_frame in [30, 60, 90]:
            if 0 <= rel_f - p_frame < 5:
                pulse = (5 - (rel_f - p_frame)) / 5.0 * 0.35
        if pulse > 0:
            base = apply_flash(base, pulse)
            
        base = draw_lower_banner(base, "TEAM VEER AZAAD HEROES", "DEDICATED YOUTH SERVING WITH PRIDE", border_color=(255, 210, 0))
        
        if rel_f < 6:
            base = apply_flash(base, (6 - rel_f) / 6.0 * 0.85)
        elif rel_f >= 112:
            base = apply_flash(base, (rel_f - 112) / 8.0 * 0.75)
            
        out_writer.write(base)

    # SEGMENT 5: 435 - 555 (14.5s - 18.5s) Saffron / Sanatan Setu Seva
    elif f < 555:
        rel_f = f - 435
        idx = min(rel_f, len(clip_saffron) - 1)
        base = clip_saffron[idx].copy()
        draw_particles(base, f)
        
        if rel_f < 25:
            angle = -90.0 * (1.0 - (rel_f / 25.0)**2)
        elif rel_f < 95:
            angle = 3.5 * np.sin((rel_f - 25) * 0.15)
        else:
            angle = 90.0 * ((rel_f - 95) / 25.0)**2
            
        overlay_3d_badge(base, badge_sanatan, angle, 540, 310, 1.25)
        base = draw_lower_banner(base, "SANATAN SETU PARIVAR", "UNITED IN CULTURE AND NOBLE SEVA", border_color=(255, 180, 20))
        
        if rel_f < 6:
            base = apply_flash(base, (6 - rel_f) / 6.0 * 0.85)
        elif rel_f >= 112:
            base = apply_flash(base, (rel_f - 112) / 8.0 * 0.75)
            
        out_writer.write(base)

    # SEGMENT 6: 555 - 675 (18.5s - 22.5s) Close-up Seva
    elif f < 675:
        rel_f = f - 555
        idx = min(rel_f, len(seq_team_seva) - 1)
        base = seq_team_seva[idx].copy()
        draw_particles(base, f)
        
        base = draw_lower_banner(base, "ANNADAANAM MAHA DAANAM", "EVERY DEVOTEE SERVED WITH LOVE", border_color=(255, 205, 20))
        
        if rel_f < 6:
            base = apply_flash(base, (6 - rel_f) / 6.0 * 0.85)
        elif rel_f >= 112:
            base = apply_flash(base, (rel_f - 112) / 8.0 * 0.75)
            
        out_writer.write(base)

    # SEGMENT 7: 675 - 765 (22.5s - 25.5s) Fast Cuts & Diya
    elif f < 765:
        rel_f = f - 675
        if rel_f < 45:
            idx = min(rel_f, len(clip_fast) - 1)
            base = clip_fast[idx].copy()
            base = draw_lower_banner(base, "NON-STOP SEVA RUSH", "ENERGY & DEVOTION AT PEAK")
            if rel_f < 5: base = apply_flash(base, (5 - rel_f) / 5.0 * 0.85)
        else:
            d_idx = min(rel_f - 45, len(seq_diya) - 1)
            base = seq_diya[d_idx].copy()
            draw_particles(base, f)
            base = draw_lower_banner(base, "RADHE RADHE", "DIVINE BLESSINGS ALWAYS", border_color=(255, 215, 0))
            if rel_f - 45 < 5: base = apply_flash(base, (5 - (rel_f - 45)) / 5.0 * 0.85)
            
        out_writer.write(base)

    # SEGMENT 8: 765 - 900 (25.5s - 30.0s) Grand Finale Outro
    else:
        rel_f = f - 765
        idx = min(rel_f, len(clip_ganesh) - 1)
        bg = clip_ganesh[idx].copy()
        bg = cv2.GaussianBlur(bg, (41, 41), 0)
        bg = (bg * 0.42).astype(np.uint8)
        draw_particles(bg, f)
        
        if rel_f < 30:
            angle_sanatan = 90.0 * (1.0 - (rel_f / 30.0)**2)
            angle_veer = -90.0 * (1.0 - (rel_f / 30.0)**2)
        else:
            angle_sanatan = -2.5 * np.sin(rel_f * 0.12)
            angle_veer = 2.5 * np.sin(rel_f * 0.12)
            
        overlay_3d_badge(bg, badge_sanatan, angle_sanatan, 540, 710, 1.18)
        overlay_3d_badge(bg, badge_veer, angle_veer, 540, 1020, 1.18)
        
        pil_bg = Image.fromarray(cv2.cvtColor(bg, cv2.COLOR_BGR2RGB))
        draw_end = ImageDraw.Draw(pil_bg, "RGBA")
        
        f_top = ImageFont.truetype("arialbd.ttf", 50)
        f_bot = ImageFont.truetype("arialbd.ttf", 34)
            
        top_txt = "SEVA • SAMARPAN • SANATAN"
        bbox = draw_end.textbbox((0,0), top_txt, font=f_top)
        tx = (WIDTH - (bbox[2] - bbox[0])) // 2
        draw_end.text((tx, 440), top_txt, font=f_top, fill=(255, 215, 30))
        
        bot_txt = "HEARTFELT THANKS TO ALL DEVOTEES"
        bbox_b = draw_end.textbbox((0,0), bot_txt, font=f_bot)
        bx = (WIDTH - (bbox_b[2] - bbox_b[0])) // 2
        draw_end.text((bx, 1310), bot_txt, font=f_bot, fill=(240, 245, 255))
        
        base = cv2.cvtColor(np.array(pil_bg), cv2.COLOR_RGB2BGR)
        
        if rel_f >= 105:
            fade_out = (rel_f - 105) / 30.0
            black = np.zeros_like(base)
            base = cv2.addWeighted(base, 1.0 - fade_out, black, fade_out, 0)
            
        out_writer.write(base)

    if (f + 1) % 150 == 0:
        print(f"Rendered {f + 1}/{TOTAL_FRAMES} frames ({int((f+1)/TOTAL_FRAMES*100)}%)")

out_writer.release()
print("Composite video complete:", out_mp4_raw)

print("Encoding final reel with audio...")
cmd_mux = [
    ffmpeg_exe, "-y",
    "-i", out_mp4_raw,
    "-i", audio_path,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "22",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    out_mp4_final
]

subprocess.run(cmd_mux, check=True)
final_size_mb = os.path.getsize(out_mp4_final) / (1024 * 1024)
print(f"DONE! Final Reel created: {out_mp4_final} (Size: {final_size_mb:.2f} MB)")
