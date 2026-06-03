import boto3
from config import settings

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

def upload_file_to_s3(file_obj, filename: str) -> str:
    """
    Uploads a file to AWS S3 and returns the S3 key.
    """
    key = f"cvs/{filename}"
    # s3_client.upload_fileobj(file_obj, settings.AWS_S3_BUCKET_NAME, key)
    return key

def generate_presigned_url(key: str, expiration: int = 3600) -> str:
    """
    Generates a presigned URL to securely download a file from S3.
    """
    # url = s3_client.generate_presigned_url('get_object', Params={'Bucket': settings.AWS_S3_BUCKET_NAME, 'Key': key}, ExpiresIn=expiration)
    return f"https://s3.amazonaws.com/{settings.AWS_S3_BUCKET_NAME}/{key}"
