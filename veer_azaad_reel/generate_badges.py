import os
from PIL import Image, ImageDraw, ImageFont

base_dir = r"D:\GARUDA-AI\veer_azaad_reel"
raw_dir = os.path.join(base_dir, "raw_media")
out_badge_dir = os.path.join(base_dir, "badges")
os.makedirs(out_badge_dir, exist_ok=True)

font_title = ImageFont.truetype("arialbd.ttf", 44)
font_sub = ImageFont.truetype("arialbd.ttf", 26)

# 1. NEW SANATAN SETU EMBLEM (Black & Gold 'S' with Mandir, Trishul, Damru)
sanatan_img_path = r"D:\GARUDA-AI\GARUDA\sanatan setu\images\Sanatan Setu Golden Spiritual Emblem.png"
sanatan_src = Image.open(sanatan_img_path).convert("RGBA")
# Crop center circle: cx=627, cy=490, r=430
cx, cy, r = 627, 490, 430
box = (cx - r, cy - r, cx + r, cy + r)
crop_s = sanatan_src.crop(box)
mask_s = Image.new('L', (crop_s.width, crop_s.height), 0)
draw_ms = ImageDraw.Draw(mask_s)
draw_ms.ellipse((0, 0, crop_s.width, crop_s.height), fill=255)
sanatan_emblem = Image.new('RGBA', (crop_s.width, crop_s.height), (0, 0, 0, 0))
sanatan_emblem.paste(crop_s, (0, 0), mask=mask_s)
sanatan_emblem = sanatan_emblem.resize((180, 180), Image.LANCZOS)

# 2. VEER AZAAD EMBLEM
veer_img = Image.open(os.path.join(raw_dir, "IMG-20260920-WA0016.jpg")).convert("RGBA")
circle_box = (185, 15, 895, 675)
veer_cropped = veer_img.crop(circle_box)
w_v, h_v = veer_cropped.size
mask2 = Image.new('L', (w_v, h_v), 0)
d_m2 = ImageDraw.Draw(mask2)
d_m2.ellipse((6, 6, w_v-6, h_v-6), fill=255)
veer_emblem = Image.new('RGBA', (w_v, h_v), (0, 0, 0, 0))
veer_emblem.paste(veer_cropped, (0, 0), mask=mask2)
veer_emblem = veer_emblem.resize((180, 180), Image.LANCZOS)

# BUILD BADGE 1: SANATAN SETU (BLACK & GOLD REGAL BOARD)
bw, bh = 760, 210
badge1 = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
d1 = ImageDraw.Draw(badge1)

for pad in range(6, 0, -1):
    d1.rounded_rectangle([15-pad, 15-pad, bw-15+pad, bh-15+pad], radius=100, fill=(255, 180, 0, 18))

# Regal Obsidian Black capsule
d1.rounded_rectangle([15, 15, bw-15, bh-15], radius=95, fill=(10, 10, 14, 245), outline=(255, 200, 30, 255), width=5)
d1.rounded_rectangle([22, 22, bw-22, bh-22], radius=88, outline=(255, 235, 120, 180), width=2)
d1.ellipse((15, 15, 195, 195), fill=(0, 0, 0, 255), outline=(255, 210, 40, 255), width=4)
badge1.paste(sanatan_emblem, (15, 15), mask=sanatan_emblem)

d1.text((225, 42), "SANATAN SETU", fill=(255, 215, 40), font=font_title)
d1.text((225, 108), "DIVYA BHANDARA SEVA", fill=(245, 240, 225), font=font_sub)
badge1.save(os.path.join(out_badge_dir, "badge_sanatan_setu.png"))

# BUILD BADGE 2: VEER AZAAD
badge2 = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
d2 = ImageDraw.Draw(badge2)

for pad in range(6, 0, -1):
    d2.rounded_rectangle([15-pad, 15-pad, bw-15+pad, bh-15+pad], radius=100, fill=(255, 200, 0, 18))

d2.rounded_rectangle([15, 15, bw-15, bh-15], radius=95, fill=(10, 22, 45, 245), outline=(255, 205, 0, 255), width=5)
d2.rounded_rectangle([22, 22, bw-22, bh-22], radius=88, outline=(255, 235, 120, 180), width=2)
d2.ellipse((15, 15, 195, 195), fill=(255, 255, 255, 255), outline=(255, 205, 0, 255), width=4)
badge2.paste(veer_emblem, (15, 15), mask=veer_emblem)

d2.text((225, 42), "VEER AZAAD", fill=(255, 215, 20), font=font_title)
d2.text((225, 108), "CHARITABLE FOUNDATION", fill=(255, 255, 255), font=font_sub)
badge2.save(os.path.join(out_badge_dir, "badge_veer_azaad.png"))
print("Both badges generated successfully!")
