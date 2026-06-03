import logging
import asyncio

logger = logging.getLogger(__name__)

async def send_email_async(to_email: str, subject: str, body: str) -> bool:
    """
    Dummy function to send an email asynchronously.
    Currently just prints to the console/logger.
    """
    logger.info(f"--- MOCK EMAIL SENDER ---")
    logger.info(f"To: {to_email}")
    logger.info(f"Subject: {subject}")
    logger.info(f"Body: {body}")
    logger.info(f"-------------------------")
    
    # Simulate async work
    await asyncio.sleep(0.5)
    
    print(f"Email sent to {to_email} with subject: {subject}")
    return True
