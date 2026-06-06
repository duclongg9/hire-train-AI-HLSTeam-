import logging
import boto3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from config import settings

logger = logging.getLogger(__name__)

class TranscribeService:
    def __init__(self):
        self.region = settings.AWS_REGION or "us-east-1"

    def get_presigned_websocket_url(
        self,
        language_code: str = "vi-VN",
        sample_rate: int = 16000,
        media_encoding: str = "pcm"
    ) -> str:
        """
        Generate a presigned WebSocket URL for AWS Transcribe Streaming using SigV4 authentication.
        """
        try:
            # Initialize Session (inherits credentials from env/EC2 profile)
            session = boto3.Session()
            credentials = session.get_credentials()
            if not credentials:
                raise ValueError("No AWS Credentials found on the server.")
            
            frozen_credentials = credentials.get_frozen_credentials()

            # Construct endpoint URL
            host = f"transcribestreaming.{self.region}.amazonaws.com:8443"
            endpoint_url = f"https://{host}/stream-transcription-websocket"
            
            params = {
                "language-code": language_code,
                "media-encoding": media_encoding,
                "sample-rate": str(sample_rate)
            }

            # Create AWS Request
            request = AWSRequest(
                method="GET",
                url=endpoint_url,
                params=params,
                headers={"host": host}
            )
            
            # Sign request using SigV4
            signer = SigV4Auth(frozen_credentials, "transcribe", self.region)
            signer.add_auth(request)
            
            # Prepare the request to get the final URL with signature query parameters
            prepared_request = request.prepare()
            signed_url = prepared_request.url
            
            # Convert HTTPS scheme to WSS for WebSocket connection
            websocket_url = signed_url.replace("https://", "wss://")
            return websocket_url

        except Exception as e:
            logger.error(f"Failed to generate presigned Transcribe URL: {e}")
            raise e

transcribe_service = TranscribeService()
