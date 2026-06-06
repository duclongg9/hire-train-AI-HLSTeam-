import sys
import os

# Add parent directory to path so app can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.aws import transcribe_service

def test_generate_url():
    print("Testing generate_presigned_websocket_url...")
    try:
        url = transcribe_service.get_presigned_websocket_url(
            language_code="vi-VN",
            sample_rate=16000,
            media_encoding="pcm"
        )
        print("\nSuccess! Presigned WebSocket URL generated successfully:")
        print(url)
    except Exception as e:
        print(f"\nError occurred: {e}")

if __name__ == "__main__":
    test_generate_url()
