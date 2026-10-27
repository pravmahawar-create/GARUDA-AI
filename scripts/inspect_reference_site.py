import urllib.request
import re

url = "https://ngopremium.portalwale.com/"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        links = re.findall(r'href=[\'"]([^\'"]+)[\'"]', html)
        print("--- REFERENCE SITE LINKS (Total:", len(links), ") ---")
        unique_links = sorted(set(links))
        for l in unique_links:
            if not l.startswith("#") and not l.startswith("javascript") and not l.endswith(".css") and not l.endswith(".js"):
                print(l)
except Exception as e:
    print("Error:", e)
