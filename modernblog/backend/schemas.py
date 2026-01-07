"""Pydantic schemas for ModernBlog API."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, field_validator


# Tag schemas
class TagBase(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#6366f1"


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int
    slug: str

    class Config:
        from_attributes = True


# Image schemas
class ImageResponse(BaseModel):
    id: int
    filename: str
    filepath: str
    alt_text: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Comment schemas
class CommentBase(BaseModel):
    author_name: str
    author_email: Optional[str] = None
    content: str

    @field_validator("author_name")
    @classmethod
    def validate_author_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("Author name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("Author name must be less than 100 characters")
        return v.strip()

    @field_validator("content")
    @classmethod
    def validate_content(cls, v):
        if len(v.strip()) < 1:
            raise ValueError("Comment content cannot be empty")
        if len(v) > 5000:
            raise ValueError("Comment must be less than 5000 characters")
        return v.strip()


class CommentCreate(CommentBase):
    parent_id: Optional[int] = None
    # Anti-spam fields
    honeypot: Optional[str] = None
    form_timestamp: Optional[int] = None


class CommentResponse(CommentBase):
    id: int
    post_id: int
    parent_id: Optional[int] = None
    is_approved: bool
    ip_address: Optional[str] = None
    created_at: datetime
    replies: List["CommentResponse"] = []

    class Config:
        from_attributes = True


# Post schemas
class PostBase(BaseModel):
    title: str
    excerpt: Optional[str] = None
    content: str
    cover_image: Optional[str] = None
    is_published: bool = False
    is_featured: bool = False


class PostCreate(PostBase):
    tags: List[str] = []
    notify_subscribers: bool = False


class PostUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_image: Optional[str] = None
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None
    tags: Optional[List[str]] = None


class PostListResponse(BaseModel):
    id: int
    slug: str
    title: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    reading_time: int
    is_featured: bool
    views: int
    created_at: datetime
    published_at: Optional[datetime] = None
    is_published: bool
    tags: List[TagResponse] = []

    class Config:
        from_attributes = True


class PostResponse(PostListResponse):
    content: str
    is_published: bool
    updated_at: datetime
    comments: List[CommentResponse] = []

    class Config:
        from_attributes = True


# Blog info schemas
class BlogInfo(BaseModel):
    title: str
    description: str
    author_name: str
    author_bio: str
    github_sponsor_url: str
    site_url: str = ""
    total_posts: int
    total_views: int
    subscription_enabled: bool = False
    comment_approval_required: bool = False
    language: str = "en"


# Pagination
class PaginatedPosts(BaseModel):
    posts: List[PostListResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


# Subscriber schemas
class SubscriberCreate(BaseModel):
    email: str


class SubscriberResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NewsletterSend(BaseModel):
    post_ids: List[int]
    subject: str
    custom_message: Optional[str] = None
