"""Posts router for ModernBlog."""

import asyncio
import math
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slugify import slugify
from sqlalchemy.orm import Session, joinedload

from ..config import get_settings
from ..database import get_db
from ..dependencies import is_admin, verify_admin
from ..models import Comment, Post, Tag
from ..schemas import (
    CommentResponse,
    PaginatedPosts,
    PostCreate,
    PostListResponse,
    PostResponse,
    PostUpdate,
)
from ..utils.email_service import (
    send_new_post_notification_batched,
    send_new_post_notification_mailing_list,
)

router = APIRouter(prefix="/api/posts", tags=["posts"])


def calculate_reading_time(content: str) -> int:
    """Estimate reading time based on word count (200 words per minute)."""
    words = len(content.split())
    return max(1, math.ceil(words / 200))


def generate_unique_slug(
    db: Session, title: str, exclude_id: Optional[int] = None
) -> str:
    """Generate a unique slug from the title."""
    base_slug = slugify(title)
    slug = base_slug
    counter = 1

    while True:
        query = db.query(Post).filter(Post.slug == slug)
        if exclude_id:
            query = query.filter(Post.id != exclude_id)
        if not query.first():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


def get_or_create_tags(db: Session, tag_names: List[str]) -> List[Tag]:
    """Get existing tags or create new ones."""
    tags = []
    for name in tag_names:
        name = name.strip()
        if not name:
            continue
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name, slug=slugify(name))
            db.add(tag)
            db.flush()
        tags.append(tag)
    return tags


def build_comment_tree(comments: List[Comment]) -> List[CommentResponse]:
    """Build a tree structure from flat comments list."""
    comment_map = {}
    root_comments = []

    # First pass: create CommentResponse and map by id
    for comment in comments:
        comment_response = CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            parent_id=comment.parent_id,
            author_name=comment.author_name,
            author_email=comment.author_email,
            content=comment.content,
            is_approved=comment.is_approved,
            created_at=comment.created_at,
            replies=[],
        )
        comment_map[comment.id] = comment_response

    # Second pass: build tree
    for comment in comments:
        comment_response = comment_map[comment.id]
        if comment.parent_id and comment.parent_id in comment_map:
            comment_map[comment.parent_id].replies.append(comment_response)
        else:
            root_comments.append(comment_response)

    return root_comments


def filter_public_posts(query):
    """Filter posts to show only published content."""
    return query.filter(Post.is_published, Post.published_at <= datetime.utcnow())


@router.get("", response_model=PaginatedPosts)
async def list_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    tag: Optional[str] = None,
    featured: Optional[bool] = None,
    include_drafts: bool = False,
    is_admin: bool = Depends(is_admin),
    db: Session = Depends(get_db),
):
    """List all published posts with pagination."""
    query = db.query(Post).options(joinedload(Post.tags))

    if include_drafts and not is_admin:
        raise HTTPException(status_code=401, detail="Unauthorized to view drafts")

    # Only show published posts if drafts are not requested
    if not include_drafts:
        query = filter_public_posts(query)

    if tag:
        query = query.join(Post.tags).filter(Tag.slug == tag)

    if featured is not None:
        query = query.filter(Post.is_featured == featured)

    # Get total count
    total = query.count()

    # Apply pagination
    posts = (
        query.order_by(Post.published_at.desc().nullsfirst(), Post.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return PaginatedPosts(
        posts=[PostListResponse.model_validate(p) for p in posts],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total > 0 else 1,
    )


@router.get("/featured", response_model=List[PostListResponse])
async def get_featured_posts(
    limit: int = Query(3, ge=1, le=10), db: Session = Depends(get_db)
):
    """Get featured posts."""
    query = db.query(Post).options(joinedload(Post.tags))
    query = filter_public_posts(query)

    posts = (
        query.filter(Post.is_featured)
        .order_by(Post.published_at.desc())
        .limit(limit)
        .all()
    )
    return [PostListResponse.model_validate(p) for p in posts]


@router.get("/recent", response_model=List[PostListResponse])
async def get_recent_posts(
    limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)
):
    """Get most recent posts."""
    query = db.query(Post).options(joinedload(Post.tags))
    query = filter_public_posts(query)

    posts = query.order_by(Post.published_at.desc()).limit(limit).all()
    return [PostListResponse.model_validate(p) for p in posts]


@router.get("/search", response_model=List[PostListResponse])
async def search_posts(
    q: str = Query(..., min_length=2), db: Session = Depends(get_db)
):
    """Search posts by title and content."""
    search_term = f"%{q}%"
    query = db.query(Post).options(joinedload(Post.tags))
    query = filter_public_posts(query)

    posts = (
        query.filter(
            (
                Post.title.ilike(search_term)
                | Post.content.ilike(search_term)
                | Post.excerpt.ilike(search_term)
            ),
        )
        .order_by(Post.published_at.desc())
        .limit(20)
        .all()
    )
    return [PostListResponse.model_validate(p) for p in posts]


@router.get("/{slug}", response_model=PostResponse)
async def get_post(
    slug: str,
    is_admin: bool = Depends(is_admin),
    db: Session = Depends(get_db),
):
    """Get a single post by slug."""
    post = (
        db.query(Post)
        .options(joinedload(Post.tags), joinedload(Post.comments))
        .filter(Post.slug == slug)
        .first()
    )

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Only admins can view unpublished posts
    is_visible = post.is_published and (
        post.published_at and post.published_at <= datetime.utcnow()
    )
    if not is_visible and not is_admin:
        raise HTTPException(status_code=404, detail="Post not found")

    # Increment view count
    post.views += 1
    db.commit()

    # Build comment tree
    approved_comments = [c for c in post.comments if c.is_approved]
    comment_tree = build_comment_tree(approved_comments)

    response = PostResponse.model_validate(post)
    response.comments = comment_tree
    return response


@router.post("", response_model=PostResponse, dependencies=[Depends(verify_admin)])
async def create_post(
    post_data: PostCreate, request: Request, db: Session = Depends(get_db)
):
    """Create a new post (admin only)."""

    slug = generate_unique_slug(db, post_data.title)
    reading_time = calculate_reading_time(post_data.content)

    post = Post(
        slug=slug,
        title=post_data.title,
        excerpt=post_data.excerpt,
        content=post_data.content,
        cover_image=post_data.cover_image,
        reading_time=reading_time,
        is_published=post_data.is_published,
        is_featured=post_data.is_featured,
        published_at=datetime.utcnow() if post_data.is_published else None,
    )

    # Handle tags
    if post_data.tags:
        post.tags = get_or_create_tags(db, post_data.tags)

    db.add(post)
    db.commit()
    db.refresh(post)

    # Send notification to subscribers if requested and post is published (in background)
    if post_data.notify_subscribers and post_data.is_published:
        base_url = str(request.base_url).rstrip("/")
        settings = get_settings()

        if settings.MAILING_LIST_ENABLED:
            # Send via mailing list (single email to list)
            asyncio.create_task(
                asyncio.to_thread(
                    send_new_post_notification_mailing_list,
                    post_title=post.title,
                    post_slug=post.slug,
                    post_excerpt=post.excerpt,
                    base_url=base_url,
                )
            )
        else:
            # Send direct emails to each subscriber
            asyncio.create_task(
                asyncio.to_thread(
                    send_new_post_notification_batched,
                    post_title=post.title,
                    post_slug=post.slug,
                    post_excerpt=post.excerpt,
                    base_url=base_url,
                )
            )

    return PostResponse.model_validate(post)


@router.put(
    "/{slug}", response_model=PostResponse, dependencies=[Depends(verify_admin)]
)
async def update_post(slug: str, post_data: PostUpdate, db: Session = Depends(get_db)):
    """Update a post (admin only)."""
    post = db.query(Post).filter(Post.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Update fields
    if "title" in post_data.model_fields_set and post_data.title is not None:
        post.title = post_data.title
        post.slug = generate_unique_slug(db, post_data.title, exclude_id=post.id)

    if "excerpt" in post_data.model_fields_set:
        post.excerpt = post_data.excerpt

    if "content" in post_data.model_fields_set and post_data.content is not None:
        post.content = post_data.content
        post.reading_time = calculate_reading_time(post_data.content)

    if "cover_image" in post_data.model_fields_set:
        post.cover_image = post_data.cover_image

    if (
        "is_featured" in post_data.model_fields_set
        and post_data.is_featured is not None
    ):
        post.is_featured = post_data.is_featured

    if (
        "is_published" in post_data.model_fields_set
        and post_data.is_published is not None
    ):
        was_published = post.is_published
        post.is_published = post_data.is_published
        if post_data.is_published and not was_published:
            post.published_at = datetime.utcnow()

    if "tags" in post_data.model_fields_set and post_data.tags is not None:
        post.tags = get_or_create_tags(db, post_data.tags)

    db.commit()
    db.refresh(post)

    return PostResponse.model_validate(post)


@router.delete("/{slug}", dependencies=[Depends(verify_admin)])
async def delete_post(slug: str, db: Session = Depends(get_db)):
    """Delete a post (admin only)."""
    post = db.query(Post).filter(Post.slug == slug).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    db.delete(post)
    db.commit()

    return {"message": "Post deleted successfully"}
