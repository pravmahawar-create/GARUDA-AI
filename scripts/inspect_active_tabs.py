import os
import re
import subprocess

src = r"C:\Users\hp\AppData\Local\Google\Chrome\User Data\Profile 3\Sessions\Tabs_13436892195736939"
dst = r"D:\GARUDA-AI\data\temp_tabs_inspect.bin"

ps_cmd = f'powershell -Command "$src = [System.IO.File]::Open(\'{src}\', [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite); $dst = [System.IO.File]::Create(\'{dst}\'); $src.CopyTo($dst); $src.Close(); $dst.Close()"'

res = subprocess.run(ps_cmd, shell=True)
if os.path.exists(dst):
    with open(dst, 'rb') as f:
        content = f.read().decode('latin1', errors='ignore')
    try:
        os.remove(dst)
    except:
        pass
    
    urls = set(re.findall(r'https?://[a-zA-Z0-9\.\_\-\/\?\=\&\%\#]+', content))
    filtered = [u for u in urls if not any(x in u for x in ['gstatic', 'google.com/chrome', 'clients2', 'optimizationguide'])]
    print("Found", len(filtered), "active URLs in Profile 3:")
    for u in sorted(filtered)[:25]:
        print("  •", u)
else:
    print("Could not copy locked tabs file.")
