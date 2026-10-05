import fitz
import os
from PIL import Image

pdf_path = r"D:\GARUDA-AI\veer_azaad_reel\raw_media\SanatanSetu.pdf"
out_dir = r"D:\GARUDA-AI\veer_azaad_reel\extracted_assets"
os.makedirs(out_dir, exist_ok=True)

if os.path.exists(pdf_path):
    doc = fitz.open(pdf_path)
    count = 0
    for i, page in enumerate(doc):
        for img_index, img in enumerate(page.get_images()):
            xref = img[0]
            base_img = doc.extract_image(xref)
            ext = base_img["ext"]
            w = base_img["width"]
            h = base_img["height"]
            fname = f"img_p{i+1}_{img_index}_{xref}.{ext}"
            p = os.path.join(out_dir, fname)
            with open(p, "wb") as f:
                f.write(base_img["image"])
            count += 1
            print(f"Extracted [P{i+1}]: {fname} ({w}x{h})")
    print(f"Total extracted: {count}")
