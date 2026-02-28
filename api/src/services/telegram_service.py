import httpx
from config import settings

TELEGRAM_API_URL = f"https://api.telegram.org/bot{settings.telegram_bot_token}"

async def send_telegram_message(chat_id: str, text: str):
    """Helper function to send a message to a user via Telegram"""
    if not settings.telegram_bot_token:
        print("Telegram Bot Token not set in .env")
        return

    if not chat_id:
        print("Chat ID is empty, skipping Telegram notification")
        return

    url = f"{TELEGRAM_API_URL}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    }
    
    print(f"\n[DEBUG] Attempting to send message to Chat ID: {chat_id}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            print(f"[DEBUG] Send Status: {response.status_code}")
            if response.status_code != 200:
                print(f"[DEBUG] Telegram Response: {response.text}")
    except Exception as e:
        print(f"\n[ERROR] Failed to send message to Telegram: {e}\n")
