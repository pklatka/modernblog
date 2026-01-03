"""Tags router for ModernBlog."""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from slugify import slugify

from ..dependencies import is_admin, verify_admin
from ..database import get_db
from ..models import Post, Tag
from ..schemas import TagCreate, TagResponse


router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("", response_model=List[TagResponse])
async def list_tags(is_admin: bool = Depends(is_admin), db: Session = Depends(get_db)):
    """List all tags."""
    query = db.query(Tag)

    if not is_admin:
        query = (
            query.join(Tag.posts)
            .filter(Post.is_published, Post.published_at <= datetime.utcnow())
            .distinct()
        )

    tags = query.order_by(Tag.name).all()
    return [TagResponse.model_validate(t) for t in tags]


@router.get("/{slug}", response_model=TagResponse)
async def get_tag(slug: str, db: Session = Depends(get_db)):
    """Get a single tag by slug."""
    tag = db.query(Tag).filter(Tag.slug == slug).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return TagResponse.model_validate(tag)


@router.post("", response_model=TagResponse, dependencies=[Depends(verify_admin)])
async def create_tag(tag_data: TagCreate, db: Session = Depends(get_db)):
    """Create a new tag (admin only)."""
    existing = db.query(Tag).filter(Tag.name == tag_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tag already exists")

    tag = Tag(
        name=tag_data.name,
        slug=slugify(tag_data.name),
        description=tag_data.description,
        color=tag_data.color,
    )

    db.add(tag)
    db.commit()
    db.refresh(tag)

    return TagResponse.model_validate(tag)


@router.delete("/{slug}", dependencies=[Depends(verify_admin)])
async def delete_tag(slug: str, db: Session = Depends(get_db)):
    """Delete a tag (admin only)."""
    tag = db.query(Tag).filter(Tag.slug == slug).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    db.delete(tag)
    db.commit()

    return {"message": "Tag deleted successfully"}
