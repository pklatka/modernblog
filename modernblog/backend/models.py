"""SQLAlchemy models for ModernBlog."""

from datetime import UTC, datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base

# Many-to-many relationship between posts and tags
post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    title = Column(String(500), nullable=False)
    excerpt = Column(Text, nullable=True)  # Short description for previews
    content = Column(Text, nullable=False)  # Markdown content
    cover_image = Column(String(500), nullable=True)  # Cover image URL
    reading_time = Column(Integer, default=1)  # Estimated reading time in minutes
    is_published = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    views = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )
    published_at = Column(DateTime, nullable=True)

    # Relationships
    tags = relationship("Tag", secondary=post_tags, back_populates="posts")
    comments = relationship(
        "Comment", back_populates="post", cascade="all, delete-orphan"
    )
    images = relationship("Image", back_populates="post", cascade="all, delete-orphan")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String(7), default="#6366f1")  # Hex color for tag

    posts = relationship("Post", secondary=post_tags, back_populates="tags")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    parent_id = Column(
        Integer, ForeignKey("comments.id"), nullable=True
    )  # For nested comments
    author_name = Column(String(100), nullable=False)
    author_email = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    ip_address = Column(String(45), nullable=True)
    is_approved = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(
        DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    # Relationships
    post = relationship("Post", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(
        Integer, ForeignKey("posts.id"), nullable=True
    )  # Can be null for standalone images
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    alt_text = Column(String(500), nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))

    post = relationship("Post", back_populates="images")


class Subscriber(Base):
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    unsubscribe_token = Column(String(36), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))


class RateLimit(Base):
    __tablename__ = "rate_limits"

    ip_address = Column(String(45), primary_key=True)
    request_count = Column(Integer, default=0)
    window_start = Column(DateTime, default=lambda: datetime.now(UTC))
