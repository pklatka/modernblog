"""Images router for ModernBlog."""

import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from PIL import Image as PILImage

from ..database import get_db
from ..models import Image
from ..schemas import ImageResponse
from ..config import get_settings
from ..dependencies import verify_admin


router = APIRouter(prefix="/api/images", tags=["images"])


@router.post(
    "/upload", response_model=ImageResponse, dependencies=[Depends(verify_admin)]
)
async def upload_image(
    file: UploadFile = File(...),
    alt_text: Optional[str] = None,
    post_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Upload an image (admin only)."""
    settings = get_settings()

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > settings.MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.MAX_IMAGE_SIZE / 1024 / 1024}MB",
        )

    # Create uploads directory if it doesn't exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Generate unique filename
    unique_id = str(uuid.uuid4())
    filename = f"{unique_id}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    # Save file
    with open(filepath, "wb") as f:
        f.write(content)

    # Get image dimensions (for non-SVG images)
    width = None
    height = None
    if ext != ".svg":
        try:
            with PILImage.open(filepath) as img:
                width, height = img.size
        except Exception:
            pass

    # Create database record
    image = Image(
        post_id=post_id,
        filename=filename,
        filepath=filepath,
        alt_text=alt_text,
        width=width,
        height=height,
        size_bytes=len(content),
    )

    db.add(image)
    db.commit()
    db.refresh(image)

    return ImageResponse.model_validate(image)


@router.get("/{filename}")
async def get_image(filename: str):
    """Serve an image file."""
    settings = get_settings()
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    # Security check: ensure path is within uploads directory
    uploads_dir = os.path.abspath(settings.UPLOAD_DIR)
    file_path = os.path.abspath(filepath)

    # Ensure uploads_dir ends with separator to prevent partial matching protection bypass
    if not uploads_dir.endswith(os.sep):
        uploads_dir += os.sep

    if not file_path.startswith(uploads_dir):
        raise HTTPException(status_code=403, detail="Access denied")

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(filepath)


@router.delete("/{image_id}", dependencies=[Depends(verify_admin)])
async def delete_image(image_id: int, db: Session = Depends(get_db)):
    """Delete an image (admin only)."""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Delete file from disk
    if os.path.exists(image.filepath):
        os.remove(image.filepath)

    db.delete(image)
    db.commit()

    return {"message": "Image deleted successfully"}
