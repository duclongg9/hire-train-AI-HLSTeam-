import asyncio
import io
import edge_tts

async def test():
    voices = ["vi-VN-NamMinhNeural", "vi-VN-HoaiMyNeural"]
    for voice in voices:
        try:
            communicate = edge_tts.Communicate(text="Xin chao ban", voice=voice, rate="+0%", volume="+0%")
            buf = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    buf.write(chunk["data"])
            data = buf.getvalue()
            print(f"[OK] {voice}: {len(data)} bytes")
        except Exception as e:
            print(f"[FAIL] {voice}: {e}")

asyncio.run(test())
