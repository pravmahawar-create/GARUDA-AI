import imaplib
import email
from email.header import decode_header
import os
from dotenv import load_dotenv

load_dotenv()

user = os.getenv("GARUDA_EMAIL_USER")
password = os.getenv("GARUDA_EMAIL_PASS")

print(f"Connecting to Gmail IMAP for {user}...")

try:
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(user, password)
    print("✔ IMAP Login Successful!")

    mail.select("inbox")

    # Search for linkedin emails
    status, messages = mail.search(None, '(FROM "linkedin")')
    if status == "OK":
        ids = messages[0].split()
        print(f"Found {len(ids)} LinkedIn emails in inbox.")
        latest_ids = ids[-5:] if len(ids) >= 5 else ids

        for msg_id in reversed(latest_ids):
            status, msg_data = mail.fetch(msg_id, "(RFC822)")
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    subject, encoding = decode_header(msg["Subject"])[0]
                    if isinstance(subject, bytes):
                        subject = subject.decode(encoding or "utf-8", errors="ignore")
                    sender = msg.get("From")
                    date = msg.get("Date")
                    print(f"\n--- Date: {date} ---")
                    print(f"From: {sender}")
                    print(f"Subject: {subject}")

                    # Extract snippet
                    body = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                body = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                                break
                    else:
                        body = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
                    print("Snippet:", body[:400].strip())
    mail.close()
    mail.logout()
except Exception as e:
    print("IMAP Error:", e)
