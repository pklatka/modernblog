"""Subscribers router for ModernBlog."""

import uuid
import re
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..dependencies import verify_admin
from ..database import get_db
from ..models import Subscriber, Post
from ..schemas import SubscriberCreate, SubscriberResponse, NewsletterSend
from ..config import get_settings
from ..utils.email_service import (
    send_newsletter,
    send_newsletter_mailing_list,
    subscribe_via_mailing_list,
    unsubscribe_via_mailing_list,
)


router = APIRouter(prefix="/api/subscribers", tags=["subscribers"])


def is_valid_email(email: str) -> bool:
    """Basic email validation."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


@router.post("", response_model=SubscriberResponse)
async def subscribe(subscriber_data: SubscriberCreate, db: Session = Depends(get_db)):
    """Subscribe an email to the newsletter."""
    email = subscriber_data.email.lower().strip()

    if not is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    # Check if already subscribed
    existing = db.query(Subscriber).filter(Subscriber.email == email).first()
    if existing:
        if existing.is_active:
            raise HTTPException(status_code=400, detail="Email already subscribed")
        else:
            # Reactivate subscription
            existing.is_active = True
            existing.unsubscribe_token = str(uuid.uuid4())
            db.commit()
            db.refresh(existing)
            return SubscriberResponse.model_validate(existing)

    # Create new subscriber
    subscriber = Subscriber(
        email=email, unsubscribe_token=str(uuid.uuid4()), is_active=True
    )
    db.add(subscriber)
    db.commit()
    db.refresh(subscriber)

    # If mailing list is enabled, also subscribe via mailing list
    settings = get_settings()
    if settings.MAILING_LIST_ENABLED:
        subscribe_via_mailing_list(email)

    return SubscriberResponse.model_validate(subscriber)


@router.get("/unsubscribe/{token}")
async def unsubscribe(token: str, db: Session = Depends(get_db)):
    """Unsubscribe using token."""
    subscriber = (
        db.query(Subscriber).filter(Subscriber.unsubscribe_token == token).first()
    )

    if not subscriber:
        raise HTTPException(status_code=404, detail="Invalid unsubscribe token")

    if not subscriber.is_active:
        return {"message": "Already unsubscribed", "email": subscriber.email}

    subscriber.is_active = False
    db.commit()

    # If mailing list is enabled, also unsubscribe via mailing list
    settings = get_settings()
    if settings.MAILING_LIST_ENABLED:
        unsubscribe_via_mailing_list(subscriber.email)

    return {"message": "Successfully unsubscribed", "email": subscriber.email}


@router.get(
    "", response_model=List[SubscriberResponse], dependencies=[Depends(verify_admin)]
)
async def list_subscribers(db: Session = Depends(get_db)):
    """List all subscribers (admin only)."""
    subscribers = db.query(Subscriber).filter(Subscriber.is_active).all()
    return [SubscriberResponse.model_validate(s) for s in subscribers]


@router.post("/send-newsletter", dependencies=[Depends(verify_admin)])
async def send_newsletter_endpoint(
    data: NewsletterSend, request: Request, db: Session = Depends(get_db)
):
    """Send newsletter to all active subscribers (admin only)."""
    # Get posts
    posts = db.query(Post).filter(Post.id.in_(data.post_ids)).all()
    if not posts:
        raise HTTPException(status_code=400, detail="No valid posts selected")

    # Get active subscribers
    subscribers = db.query(Subscriber).filter(Subscriber.is_active).all()
    if not subscribers:
        raise HTTPException(status_code=400, detail="No active subscribers")

    # Prepare data
    posts_data = [
        {"title": p.title, "slug": p.slug, "excerpt": p.excerpt} for p in posts
    ]
    subscribers_data = [(s.email, s.unsubscribe_token) for s in subscribers]

    # Get base URL from request
    base_url = str(request.base_url).rstrip("/")

    # Check if mailing list is enabled
    settings = get_settings()

    if settings.MAILING_LIST_ENABLED:
        # Send newsletter via mailing list (single email to list)
        success = send_newsletter_mailing_list(
            posts=posts_data,
            subject=data.subject,
            custom_message=data.custom_message,
            base_url=base_url,
        )

        return {
            "message": "Newsletter sent to mailing list"
            if success
            else "Failed to send newsletter",
            "sent_count": 1 if success else 0,
            "total_subscribers": len(subscribers),
            "via_mailing_list": True,
        }
    else:
        # Send newsletter via direct emails (one per subscriber)
        sent_count = send_newsletter(
            posts=posts_data,
            subscribers=subscribers_data,
            subject=data.subject,
            custom_message=data.custom_message,
            base_url=base_url,
        )

        return {
            "message": f"Newsletter sent to {sent_count} subscribers",
            "sent_count": sent_count,
            "total_subscribers": len(subscribers),
            "via_mailing_list": False,
        }
