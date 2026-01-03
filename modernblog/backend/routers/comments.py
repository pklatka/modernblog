"""Comments router for ModernBlog."""

import time
from typing import Optional

from datetime import datetime, timedelta, UTC

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..dependencies import verify_admin
from ..database import get_db
from ..models import Post, Comment
from ..schemas import CommentCreate, CommentResponse
from ..config import get_settings


router = APIRouter(prefix="/api/comments", tags=["comments"])


@router.post("/{post_slug}", response_model=CommentResponse)
async def create_comment(
    post_slug: str,
    comment_data: CommentCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    """Add a comment to a post."""
    current_time = time.time()
    client_ip = request.client.host if request.client else "unknown"

    # Anti-spam check 1: Honeypot field (should be empty)
    if comment_data.honeypot:
        raise HTTPException(status_code=400, detail="Spam detected")

    # Anti-spam check 2: Form timing
    if comment_data.form_timestamp:
        time_diff = current_time - comment_data.form_timestamp
        if time_diff < get_settings().MIN_FORM_TIME_SECONDS:
            raise HTTPException(
                status_code=400, detail="Please take your time filling out the form"
            )

    # Anti-spam check 3: Rate limiting per IP
    window_start = datetime.now(UTC) - timedelta(
        seconds=get_settings().RATE_LIMIT_WINDOW
    )
    recent_comments_count = (
        db.query(Comment)
        .filter(Comment.ip_address == client_ip, Comment.created_at >= window_start)
        .count()
    )

    if recent_comments_count >= get_settings().RATE_LIMIT_MAX_COMMENTS:
        raise HTTPException(
            status_code=429, detail="Too many comments. Please try again later."
        )

    # Find the post
    post = db.query(Post).filter(Post.slug == post_slug, Post.is_published).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Verify parent comment exists if provided
    if comment_data.parent_id:
        parent = (
            db.query(Comment)
            .filter(Comment.id == comment_data.parent_id, Comment.post_id == post.id)
            .first()
        )
        if not parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")

    # Check if approval is required
    is_approved = not get_settings().COMMENT_APPROVAL_REQUIRED

    comment = Comment(
        post_id=post.id,
        parent_id=comment_data.parent_id,
        author_name=comment_data.author_name,
        author_email=comment_data.author_email,
        content=comment_data.content,
        ip_address=client_ip,
        is_approved=is_approved,
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    return CommentResponse.model_validate(comment)


@router.delete("/{comment_id}", dependencies=[Depends(verify_admin)])
async def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    """Delete a comment (admin only)."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Delete all child comments recursively
    def delete_replies(parent_id: int):
        replies = db.query(Comment).filter(Comment.parent_id == parent_id).all()
        for reply in replies:
            delete_replies(reply.id)
            db.delete(reply)

    delete_replies(comment.id)
    db.delete(comment)
    db.commit()

    return {"message": "Comment deleted successfully"}


@router.put("/{comment_id}/approve", dependencies=[Depends(verify_admin)])
async def approve_comment(comment_id: int, db: Session = Depends(get_db)):
    """Approve a comment (admin only)."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.is_approved = True
    db.commit()

    return {"message": "Comment approved"}


@router.put("/{comment_id}/reject", dependencies=[Depends(verify_admin)])
async def reject_comment(comment_id: int, db: Session = Depends(get_db)):
    """Reject/hide a comment (admin only)."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.is_approved = False
    db.commit()

    return {"message": "Comment rejected"}


@router.get(
    "", response_model=list[CommentResponse], dependencies=[Depends(verify_admin)]
)
async def get_all_comments(
    page: int = 1,
    per_page: int = 50,
    status: Optional[str] = None,  # "approved", "pending", "all"
    db: Session = Depends(get_db),
):
    """Get all comments (admin only)."""
    query = db.query(Comment)

    if status == "approved":
        query = query.filter(Comment.is_approved)
    elif status == "pending":
        query = query.filter(Comment.is_approved.is_(False))

    # Order by newest first
    comments = (
        query.order_by(Comment.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return [CommentResponse.model_validate(c) for c in comments]
