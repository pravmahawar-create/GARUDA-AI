#!/usr/bin/env python3
"""
🦅 GARUDA Inbox Hygiene & Bounce Purge Engine
Enforces Rule 15 of AGENTS.md / GEMINI.md
Searches for Mail Delivery Subsystems, Delivery Failures, and Bounces in praveen@garudaos.in
and permanently deletes them to maintain pristine inbox governance.
"""

import imaplib
import email
from email.header import decode_header
import os
from dotenv import load_dotenv

load_dotenv(r"D:\GARUDA-AI\.env")

user = os.getenv("GARUDA_EMAIL_USER", "praveen@garudaos.in")
password = os.getenv("GARUDA_EMAIL_PASS")
host = os.getenv("GARUDA_EMAIL_HOST", "smtp.zoho.in")

imap_host = "imap.zoho.in"
if "zoho.com" in host:
    imap_host = "imap.zoho.com"
elif "gmail" in host:
    imap_host = "imap.gmail.com"

print("=" * 60)
print("🦅 GARUDA INBOX BOUNCE PURGE DAEMON")
print(f"Target: {user} | Server: {imap_host}:993")
print("=" * 60)

try:
    mail = imaplib.IMAP4_SSL(imap_host, 993)
    mail.login(user, password)
    print("✔ IMAP Login Successful.")
    
    mail.select("INBOX")
    
    # Search for common bounce / failure indicators
    queries = [
        '(SUBJECT "Delivery Status Notification")',
        '(SUBJECT "Mail delivery failed")',
        '(SUBJECT "Undelivered Mail Returned")',
        '(FROM "mailer-daemon")',
        '(FROM "postmaster")'
    ]
    
    all_bounce_ids = set()
    
    for q in queries:
        status, data = mail.search(None, q)
        if status == "OK" and data[0]:
            ids = data[0].split()
            all_bounce_ids.update(ids)
            
    print(f"Total Bounce / Undelivered Messages Found: {len(all_bounce_ids)}")
    
    if all_bounce_ids:
        for msg_id in all_bounce_ids:
            # Mark for deletion
            mail.store(msg_id, "+FLAGS", "\\Deleted")
            
        # Expunge deleted messages
        mail.expunge()
        print(f"✔ Successfully deleted {len(all_bounce_ids)} bounce messages from INBOX.")
    else:
        print("✔ No bounce messages found in INBOX.")
        
    mail.logout()
    print("✔ Purge cycle complete.")
except Exception as e:
    print(f"❌ Error during bounce purge: {e}")
    if "enable IMAP" in str(e):
        print("\n[NOTE] Zoho Mail requires 1-time IMAP toggle in Settings -> Mail Accounts -> IMAP Access (Enable).")
