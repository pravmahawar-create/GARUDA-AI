import os
from PIL import Image, ImageOps, ImageDraw

base_dir = r"D:\GARUDA-AI\veer-azad-portal\public\assets"

# 1. Clean Chairman Signature
sig_path = os.path.join(base_dir, "chairman_signature.png")
if os.path.exists(sig_path):
    img = Image.open(sig_path).convert("RGBA")
    w, h = img.size
    
    # We want to crop out the top-left '18' and bottom-right curves
    # The blue signature and "Authorised Signatory Aditya agrawal (Chairman)" are in x: 10% to 95%, y: 5% to 90%
    # Let's crop:
    crop_box = (int(w * 0.05), int(h * 0.04), int(w * 0.96), int(h * 0.88))
    cropped = img.crop(crop_box)
    
    # Make background transparent (pixels that are near white/cream)
    datas = cropped.getdata()
    new_data = []
    for item in datas:
        # Check if pixel is light cream / white background
        r, g, b, a = item
        if r > 210 and g > 200 and b > 185:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    cropped.putdata(new_data)
    cropped.save(sig_path, "PNG")
    print("Cleaned chairman_signature.png")

# 2. Clean Gold Medallion
med_path = os.path.join(base_dir, "gold_medallion.png")
if os.path.exists(med_path):
    img = Image.open(med_path).convert("RGBA")
    w, h = img.size
    
    # Create circular mask for the medallion & wreath
    # Medallion is centered in the image
    center_x, center_y = w // 2, h // 2
    radius_x = int(w * 0.46)
    radius_y = int(h * 0.46)
    
    mask = Image.new('L', (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((center_x - radius_x, center_y - radius_y, center_x + radius_x, center_y + radius_y), fill=255)
    
    # Apply mask and remove cream background outside
    datas = img.getdata()
    mask_data = mask.getdata()
    new_data = []
    for i, item in enumerate(datas):
        m = mask_data[i]
        r, g, b, a = item
        if m == 0:
            new_data.append((255, 255, 255, 0))
        elif r > 225 and g > 215 and b > 200: # background cream
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append((r, g, b, m))
            
    img.putdata(new_data)
    img.save(med_path, "PNG")
    print("Cleaned gold_medallion.png")
