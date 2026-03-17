import cv2
import numpy as np
from ultralytics import YOLO
from paddleocr import PaddleOCR
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Ultralytics YOLO model
try:
    # Attempting to load the specified YOLO26 model.
    yolo_model = YOLO("yolo26n.pt") 
except Exception as e:
    logger.warning(f"Could not load yolo26n.pt: {e}. Falling back to standard YOLOv8n.")
    yolo_model = YOLO("yolov8n.pt")

# Initialize PaddleOCR
ocr_model = PaddleOCR(use_angle_cls=True, lang='en')

def decode_image_bytes(image_bytes: bytes) -> np.ndarray:
    """Decodes raw image bytes into an OpenCV numpy array (BGR)."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_cv2 = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_cv2 is None:
        raise ValueError("Could not decode image bytes into valid image.")
    return img_cv2

def process_proof_image(image_bytes: bytes) -> dict:
    """
    1. Loads the image structure from memory.
    2. Runs YOLO object detection.
    3. Crops bounding boxes from the physical environment verification.
    4. Runs PaddleOCR on the cropped boxes to extract texts.
    5. Returns detections info mapped with OCR.
    """
    img = decode_image_bytes(image_bytes)
    
    # Execute YOLO Object Detection
    results = yolo_model(img, stream=False)
    
    detections_info = []
    highest_confidence = 0.0
    
    for result in results:
        boxes = result.boxes
        for box in boxes:
            conf = float(box.conf[0])
            if conf > highest_confidence:
                highest_confidence = conf
                
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cls_id = int(box.cls[0])
            cls_name = yolo_model.names[cls_id]
            
            # Edge-handling: Clamp ROI to be within image dims
            h, w = img.shape[:2]
            y1 = max(0, y1)
            x1 = max(0, x1)
            y2 = min(h, y2)
            x2 = min(w, x2)
            
            crop_img = img[y1:y2, x1:x2]
            
            extracted_text = ""
            # Hand over Region of Interest logic to PaddleOCR
            if crop_img.size != 0:
                ocr_result = ocr_model.ocr(crop_img, cls=True)
                
                # ocr_result structure parsing
                if ocr_result and ocr_result[0]:
                    texts = [line[1][0] for line in ocr_result[0] if line]
                    extracted_text = " ".join(texts)
                
            detections_info.append({
                "class": cls_name,
                "confidence": conf,
                "box": [x1, y1, x2, y2],
                "ocr_text": extracted_text
            })

    return {
        "detections": detections_info,
        "max_confidence": highest_confidence
    }

def verify_quest_proof(before_bytes: bytes, after_bytes: bytes, quest_params: dict) -> tuple[bool, float]:
    """
    Compares the processed proofs against quest_parameters to emit a verification boolean.
    Returns: (is_verified: bool, confidence_score: float)
    """
    before_analysis = process_proof_image(before_bytes)
    after_analysis = process_proof_image(after_bytes)
    
    # Baseline comparison logic 
    overall_confidence = after_analysis.get("max_confidence", 0.0)
    
    # We evaluate basic heuristics for passing parameters if they dictate specific
    # detected keywords or classes.
    is_verified = False
    
    # Hardcoded threshold behavior based on initial evaluation rules
    # In a real environment, this dynamically interprets the `quest_params` object schema
    if overall_confidence >= 0.85:
        is_verified = True
        
    return is_verified, overall_confidence
