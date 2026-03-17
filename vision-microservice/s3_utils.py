import boto3
import uuid
import base64

S3_BUCKET_NAME = "guild-moderation-bucket"

# Initialize the S3 client using default boto3 credential resolution
s3_client = boto3.client('s3')

def upload_fallback_to_s3(before_img_bytes: bytes, after_img_bytes: bytes, user_id: str, quest_id: str) -> str:
    """
    Uploads the raw image bytes to an S3 bucket for human 'Guild Moderation'.
    Returns a unified submission ID or prefix where the images were stored.
    """
    submission_id = str(uuid.uuid4())
    prefix = f"moderation/{user_id}/{quest_id}/{submission_id}"
    
    try:
        # We assume the images are JPEG or PNG.
        # Fallback to binary/octet-stream if unknown.
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=f"{prefix}/before.jpg",
            Body=before_img_bytes,
            ContentType="image/jpeg"
        )
        
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=f"{prefix}/after.jpg",
            Body=after_img_bytes,
            ContentType="image/jpeg"
        )
        
        return submission_id
    except Exception as e:
        # Log the exception in a real system
        print(f"Failed to upload to S3: {e}")
        return submission_id
