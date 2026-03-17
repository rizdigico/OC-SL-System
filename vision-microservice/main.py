from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
import uvicorn
import logging

from crypto_utils import decrypt_payload
from s3_utils import upload_fallback_to_s3
from vision_utils import verify_quest_proof

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Vision & Quest Verification Microservice",
    description="Microservice for AI image verification using YOLO and PaddleOCR."
)

class VerifyQuestRequest(BaseModel):
    user_id: str
    quest_id: str
    before_image_encrypted: str  # Base64-encoded AES-256 payload
    after_image_encrypted: str   # Base64-encoded AES-256 payload
    quest_parameters: Dict       # Contains JSON conditions to match

class VerifyQuestResponse(BaseModel):
    verified: bool
    confidence: float
    fallback_moderation_id: Optional[str] = None
    message: str

@app.post("/verify-quest", response_model=VerifyQuestResponse)
async def verify_quest(payload: VerifyQuestRequest):
    try:
        # Decrypt incoming payloads
        before_image_bytes = decrypt_payload(payload.before_image_encrypted)
        after_image_bytes = decrypt_payload(payload.after_image_encrypted)
    except ValueError as e:
        logger.error(f"Failed decryption: {e}")
        raise HTTPException(status_code=400, detail=f"Bad request: Payload decryption failed. {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in decryption: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during decryption.")

    try:
        # Process and verify the images based on quest parameters
        is_verified, confidence = verify_quest_proof(
            before_bytes=before_image_bytes, 
            after_bytes=after_image_bytes, 
            quest_params=payload.quest_parameters
        )
    except Exception as e:
        logger.error(f"Vision processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Vision processing pipeline failed: {str(e)}")

    # Specific Directive: If the initial confidence score falls below 0.85, 
    # execute a fallback routing the payload to an S3 bucket for human 'Guild Moderation'
    if confidence < 0.85:
        logger.info(f"Low confidence ({confidence}) detected for quest={payload.quest_id}. Routing to Moderation.")
        moderation_id = upload_fallback_to_s3(
            before_img_bytes=before_image_bytes,
            after_img_bytes=after_image_bytes,
            user_id=payload.user_id,
            quest_id=payload.quest_id
        )
        return VerifyQuestResponse(
            verified=False,
            confidence=confidence,
            fallback_moderation_id=moderation_id,
            message="Confidence score below threshold of 0.85. Proof routed to S3 bucket for Guild Moderation."
        )

    # Success: Matches quest parameters and confidence threshold
    return VerifyQuestResponse(
        verified=is_verified,
        confidence=confidence,
        fallback_moderation_id=None,
        message="Proof successfully validated and matches quest parameters." if is_verified else "Proof verification failed based on parameters."
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
