import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()
logger = logging.getLogger(__name__)

async def mock_server_push(websocket: WebSocket):
    """
    Task chạy ngầm để mô phỏng Server Push (AI Response) mỗi 5 giây.
    """
    try:
        while True:
            await asyncio.sleep(5)
            await websocket.send_json({
                "event_type": "ai_response_chunk",
                "customer_sentiment": "neutral"
            })
            logger.debug("Pushed mock AI response chunk to client.")
    except Exception:
        # Im lặng kết thúc khi WebSocket đóng hoặc có lỗi
        pass

@router.websocket("/live")
async def interview_live_stream(websocket: WebSocket):
    """
    WebSocket Endpoint: wss://api.hiretrain.ai/v1/interview/live
    Thiết lập luồng Real-time cho phòng phỏng vấn ảo.
    """
    await websocket.accept()
    logger.info(f"WebSocket client {websocket.client} connected to Virtual Interview Room.")
    
    # Khởi chạy task mô phỏng AI gửi tín hiệu phân tích về Frontend
    sender_task = asyncio.create_task(mock_server_push(websocket))
    
    try:
        while True:
            # Liên tục nhận audio stream từ Client
            data = await websocket.receive_bytes()
            
            # Tại đây trong tương lai sẽ forward data này qua Google Gemini WebRTC (Gemini 2.0)
            # Hoặc Speech-to-Text để phân tích nội dung ứng viên đang nói.
            pass
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket client {websocket.client} disconnected. Cleaning up resources...")
    except Exception as e:
        logger.error(f"Unexpected WebSocket error: {e}")
    finally:
        # Đảm bảo hủy task push ngầm khi client rớt mạng
        sender_task.cancel()
