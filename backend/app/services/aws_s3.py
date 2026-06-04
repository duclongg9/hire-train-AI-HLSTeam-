import logging
import boto3
from botocore.exceptions import ClientError
from typing import Optional, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )
            self.bucket_name = settings.AWS_S3_BUCKET
        except Exception as e:
            logger.error(f"Failed to initialize AWS S3 client: {e}")
            self.s3_client = None
            self.bucket_name = None

    def upload_file(self, file_obj: Any, object_name: str, content_type: str = None) -> bool:
        """Upload a file to an S3 bucket"""
        if not self.s3_client or not self.bucket_name:
            logger.error("S3 client not initialized. Cannot upload file.")
            return False

        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
                
            self.s3_client.upload_fileobj(file_obj, self.bucket_name, object_name, ExtraArgs=extra_args)
            logger.info(f"Successfully uploaded {object_name} to {self.bucket_name}")
            return True
        except ClientError as e:
            logger.error(f"Failed to upload file to S3: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error uploading file to S3: {e}")
            return False

    def download_file(self, object_name: str, file_path: str) -> bool:
        """Download a file from an S3 bucket"""
        if not self.s3_client or not self.bucket_name:
            logger.error("S3 client not initialized. Cannot download file.")
            return False

        try:
            self.s3_client.download_file(self.bucket_name, object_name, file_path)
            logger.info(f"Successfully downloaded {object_name} from {self.bucket_name} to {file_path}")
            return True
        except ClientError as e:
            logger.error(f"Failed to download file from S3: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error downloading file from S3: {e}")
            return False

    def get_presigned_url(self, object_name: str, expiration: int = 3600) -> Optional[str]:
        """Generate a presigned URL to share an S3 object"""
        if not self.s3_client or not self.bucket_name:
            logger.error("S3 client not initialized. Cannot generate presigned URL.")
            return None

        try:
            response = self.s3_client.generate_presigned_url('get_object',
                                                             Params={'Bucket': self.bucket_name,
                                                                     'Key': object_name},
                                                             ExpiresIn=expiration)
            return response
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error generating presigned URL: {e}")
            return None

s3_service = S3Service()
