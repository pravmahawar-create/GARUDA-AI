import os
import shutil
import sqlite3
import base64
import json

CHROME_USER_DATA = os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\User Data")

def dump_cookies(profile_name):
    cookie_path = os.path.join(CHROME_USER_DATA, profile_name, "Network", "Cookies")
    if not os.path.exists(cookie_path):
        return []
    
    temp_path = os.path.abspath(f"data/temp_{profile_name.replace(' ', '_')}.db")
    try:
        # Use a copy that handles locked files via powershell if direct copy fails
        try:
            shutil.copy2(cookie_path, temp_path)
        except Exception:
            import subprocess
            cmd = f'powershell -Command "$s = [System.IO.File]::Open(\'{cookie_path.replace(chr(92), "/")}\', [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite); $d = [System.IO.File]::Create(\'{temp_path.replace(chr(92), "/")}\'); $s.CopyTo($d); $s.Close(); $d.Close()"'
            subprocess.run(cmd, shell=True, check=True)
            
        conn = sqlite3.connect(temp_path)
        cursor = conn.cursor()
        cursor.execute("SELECT host_key, name, path, encrypted_value, is_secure, is_httponly, expires_utc FROM cookies WHERE host_key LIKE '%linkedin%'")
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for r in rows:
            results.append({
                "host_key": r[0],
                "name": r[1],
                "path": r[2],
                "encrypted_value_b64": base64.b64encode(r[3]).decode("ascii") if r[3] else None,
                "is_secure": bool(r[4]),
                "is_httponly": bool(r[5]),
                "expires_utc": r[6]
            })
        return results
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

def main():
    os.makedirs("data", exist_ok=True)
    all_profiles = ["Default", "Profile 1", "Profile 2", "Profile 3", "Profile 4"]
    found_any = False
    
    for prof in all_profiles:
        try:
            cookies = dump_cookies(prof)
            if cookies:
                print(f"[FOUND] Found {len(cookies)} LinkedIn cookies in {prof}")
                with open("data/raw_chrome_linkedin_cookies.json", "w", encoding="utf-8") as f:
                    json.dump({"profile": prof, "cookies": cookies}, f, indent=2)
                found_any = True
                break
        except Exception as e:
            print(f"Error checking {prof}: {e}")
            
    if not found_any:
        print("[NOT FOUND] No LinkedIn cookies found in any Chrome profile.")

if __name__ == "__main__":
    main()
