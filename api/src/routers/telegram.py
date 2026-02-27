from fastapi import APIRouter, Request, HTTPException
import httpx

# Pastikan import settings kamu sesuai dengan lokasi filenya
# misal: from app.config import settings
from config import settings 

router = APIRouter(prefix="/telegram", tags=["Telegram Notification"])

TELEGRAM_API_URL = f"https://api.telegram.org/bot{settings.telegram_bot_token}"

async def send_telegram_message(chat_id: int, text: str):
    """Fungsi helper untuk mengirim pesan balik ke user via Telegram"""
    if not settings.telegram_bot_token:
        print("Telegram Bot Token belum di-set di .env")
        return

    url = f"{TELEGRAM_API_URL}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    }
    
    print(f"\n[DEBUG] Mencoba mengirim pesan ke Chat ID: {chat_id}")
    print(f"[DEBUG] Token yang terbaca: '{settings.telegram_bot_token}'")
    
    try:
        # Kita perbesar timeout menjadi 30 detik agar tidak mudah putus
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            print(f"[DEBUG] Status Pengiriman: {response.status_code}")
            print(f"[DEBUG] Respons Telegram: {response.text}\n")
    except Exception as e:
        print(f"\n[ERROR] Gagal mengirim pesan ke Telegram: {e}\n")
        
        
# ==========================================
# PENDEKATAN 1: WEBHOOK (Bagus untuk Production)
# ==========================================
@router.post("/webhook")
async def telegram_webhook(request: Request):
    """
    Route ini akan dipanggil otomatis oleh Telegram jika webhook sudah di-set.
    """
    update = await request.json()
    
    # Cek apakah update berisi pesan teks
    if "message" in update:
        chat_id = update["message"]["chat"]["id"]
        text = update["message"].get("text", "")
        
        # Jika user mengirim command /start
        if text == "/start":
            reply_text = (
                f"Halo! 👋\n\n"
                f"Chat ID kamu adalah: `{chat_id}`\n\n"
                f"Silakan *copy* Chat ID di atas dan masukkan ke dalam aplikasi kita untuk menerima notifikasi."
            )
            await send_telegram_message(chat_id, reply_text)
        if text == "/help":
            reply_text = (
                f"Hai! Berikut beberapa perintah yang bisa kamu gunakan:\n\n"
                f"/start - Menampilkan Chat ID kamu\n"
            )
            await send_telegram_message(chat_id, reply_text)
            
    return {"status": "ok"}

# ==========================================
# PENDEKATAN 2: GET UPDATES (Bagus untuk Localhost)
# ==========================================
@router.get("/get-chat-id")
async def get_telegram_chat_id():
    """
    Cara pakai: 
    1. Kirim pesan /start ke bot Telegram kamu.
    2. Buka http://127.0.0.1:8000/telegram/get-chat-id di browser.
    """
    if not settings.telegram_bot_token:
        raise HTTPException(status_code=400, detail="Telegram bot token belum dikonfigurasi.")
        
    url = f"{TELEGRAM_API_URL}/getUpdates"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()
        
        if data.get("ok") and data.get("result"):
            # Ambil pesan paling terakhir yang masuk ke bot
            last_message = data["result"][-1]
            
            if "message" in last_message:
                chat_id = last_message["message"]["chat"]["id"]
                username = last_message["message"]["from"].get("username", "Unknown")
                text = last_message["message"].get("text", "")
                
                return {
                    "status": "success",
                    "message": "Pesan terakhir ditemukan!",
                    "telegram_username": username,
                    "chat_id": chat_id,
                    "text_received": text
                }
                
        return {
            "status": "waiting", 
            "message": "Belum ada pesan baru. Coba kirim pesan ke Bot Telegram kamu sekarang!"
        }