"""Email service for sending notifications."""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import logging

from ..config import get_settings

logger = logging.getLogger(__name__)


def get_smtp_connection():
    """Create SMTP connection using settings."""
    settings = get_settings()

    if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
        return None

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        return server
    except Exception as e:
        logger.error(f"Failed to connect to SMTP server: {e}")
        return None


def send_email(to: str, subject: str, html_content: str) -> bool:
    """Send a single email."""
    settings = get_settings()

    if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
        logger.warning("SMTP not configured, skipping email send")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to

    html_part = MIMEText(html_content, "html")
    msg.attach(html_part)

    try:
        server = get_smtp_connection()
        if server:
            server.sendmail(settings.SMTP_FROM_EMAIL, to, msg.as_string())
            server.quit()
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False


def subscribe_via_mailing_list(email: str) -> bool:
    """
    Subscribe an email address via Majordomo mailing list.
    Sends: approve [password] subscribe [list_name] [email]
    """
    settings = get_settings()

    if not settings.MAILING_LIST_ENABLED:
        logger.warning("Mailing list not enabled")
        return False

    if not all(
        [
            settings.MAILING_LIST_DOMAIN,
            settings.MAILING_LIST_NAME,
            settings.MAILING_LIST_PASSWORD,
        ]
    ):
        logger.warning("Mailing list not fully configured")
        return False

    majordomo_address = f"majordomo@{settings.MAILING_LIST_DOMAIN}"
    command = f"approve {settings.MAILING_LIST_PASSWORD} subscribe {settings.MAILING_LIST_NAME} {email}"

    msg = MIMEText(command, "plain")
    msg["Subject"] = ""
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = majordomo_address

    try:
        server = get_smtp_connection()
        if server:
            server.sendmail(
                settings.SMTP_FROM_EMAIL, majordomo_address, msg.as_string()
            )
            server.quit()
            logger.info(f"Sent subscribe command for {email} to mailing list")
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to send subscribe command for {email}: {e}")
        return False


def unsubscribe_via_mailing_list(email: str) -> bool:
    """
    Unsubscribe an email address via Majordomo mailing list.
    Sends: approve [password] unsubscribe [list_name] [email]
    """
    settings = get_settings()

    if not settings.MAILING_LIST_ENABLED:
        logger.warning("Mailing list not enabled")
        return False

    if not all(
        [
            settings.MAILING_LIST_DOMAIN,
            settings.MAILING_LIST_NAME,
            settings.MAILING_LIST_PASSWORD,
        ]
    ):
        logger.warning("Mailing list not fully configured")
        return False

    majordomo_address = f"majordomo@{settings.MAILING_LIST_DOMAIN}"
    command = f"approve {settings.MAILING_LIST_PASSWORD} unsubscribe {settings.MAILING_LIST_NAME} {email}"

    msg = MIMEText(command, "plain")
    msg["Subject"] = ""
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = majordomo_address

    try:
        server = get_smtp_connection()
        if server:
            server.sendmail(
                settings.SMTP_FROM_EMAIL, majordomo_address, msg.as_string()
            )
            server.quit()
            logger.info(f"Sent unsubscribe command for {email} to mailing list")
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to send unsubscribe command for {email}: {e}")
        return False


def send_to_mailing_list(subject: str, html_content: str) -> bool:
    """
    Send a message to the mailing list with Approve header.
    Message is sent to [list_name]@[domain] with header Approve: [password]
    """
    settings = get_settings()

    if not settings.MAILING_LIST_ENABLED:
        logger.warning("Mailing list not enabled")
        return False

    if not all(
        [
            settings.MAILING_LIST_DOMAIN,
            settings.MAILING_LIST_NAME,
            settings.MAILING_LIST_PASSWORD,
        ]
    ):
        logger.warning("Mailing list not fully configured")
        return False

    list_address = f"{settings.MAILING_LIST_NAME}@{settings.MAILING_LIST_DOMAIN}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = list_address
    msg["Approve"] = settings.MAILING_LIST_PASSWORD

    html_part = MIMEText(html_content, "html")
    msg.attach(html_part)

    try:
        server = get_smtp_connection()
        if server:
            server.sendmail(settings.SMTP_FROM_EMAIL, list_address, msg.as_string())
            server.quit()
            logger.info(f"Sent message to mailing list: {subject}")
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to send to mailing list: {e}")
        return False


def get_email_styles():
    """Get common email styles and colors."""
    from ..themes import get_theme

    settings = get_settings()
    theme = get_theme(settings.THEME_NAME)

    # Use light mode colors for emails (better compatibility with email clients)
    primary_color = theme["light"]["accent"]
    link_color = theme["light"]["link"]

    # Header background logic: use solid color from theme
    header_bg = f"background: {primary_color};"

    return primary_color, link_color, header_bg


def build_email_html(
    header_title: str,
    body_content: str,
    footer_content: str,
    unsubscribe_url: Optional[str] = None,
) -> str:
    """
    Build a complete email HTML template with consistent styling.

    Args:
        header_title: The title shown in the email header
        body_content: The main content HTML
        footer_content: The footer message HTML
        unsubscribe_url: Optional unsubscribe link URL

    Returns:
        Complete HTML email string
    """
    primary_color, link_color, header_bg = get_email_styles()

    unsubscribe_html = ""
    if unsubscribe_url:
        unsubscribe_html = f'<p><a href="{unsubscribe_url}">Unsubscribe</a></p>'

    return f"""<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ {header_bg} color: white; padding: 30px; border-radius: 12px 12px 0 0; }}
        .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }}
        .button {{ display: inline-block; background: {primary_color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
        a {{ color: {link_color}; text-decoration: none; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">{header_title}</h1>
        </div>
        <div class="content">
            {body_content}
            <div class="footer">
                {footer_content}
                {unsubscribe_html}
            </div>
        </div>
    </div>
</body>
</html>"""


def send_new_post_notification_mailing_list(
    post_title: str, post_slug: str, post_excerpt: Optional[str], base_url: str = ""
) -> bool:
    """
    Send new post notification to mailing list.
    Uses send_to_mailing_list to send a single email to all subscribers.
    """
    settings = get_settings()
    post_url = f"{base_url}/post/{post_slug}"

    primary_color, link_color, header_bg = get_email_styles()

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ {header_bg} color: white; padding: 30px; border-radius: 12px 12px 0 0; }}
            .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }}
            .button {{ display: inline-block; background: {primary_color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
            .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
            a {{ color: {link_color}; text-decoration: none; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">New Post Published!</h1>
            </div>
            <div class="content">
                <h2>{post_title}</h2>
                {f"<p>{post_excerpt}</p>" if post_excerpt else ""}
                <a href="{post_url}" class="button">Read the Post</a>
                <div class="footer">
                    <p>You're receiving this because you subscribed to {settings.BLOG_TITLE}.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    return send_to_mailing_list(f"New Post: {post_title}", html_content)


def send_new_post_notification(
    post_title: str,
    post_slug: str,
    post_excerpt: Optional[str],
    subscribers: List[tuple],  # List of (email, unsubscribe_token)
    base_url: str = "",
) -> int:
    """
    Send new post notification to all subscribers.
    Returns count of successfully sent emails.
    """
    settings = get_settings()
    sent_count = 0

    primary_color, link_color, header_bg = get_email_styles()

    for email, unsubscribe_token in subscribers:
        unsubscribe_url = f"{base_url}/unsubscribe?token={unsubscribe_token}"
        post_url = f"{base_url}/post/{post_slug}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ {header_bg} color: white; padding: 30px; border-radius: 12px 12px 0 0; }}
                .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }}
                .button {{ display: inline-block; background: {primary_color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
                a {{ color: {link_color}; text-decoration: none; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">New Post Published!</h1>
                </div>
                <div class="content">
                    <h2>{post_title}</h2>
                    {f"<p>{post_excerpt}</p>" if post_excerpt else ""}
                    <a href="{post_url}" class="button">Read the Post</a>
                    <div class="footer">
                        <p>You're receiving this because you subscribed to {settings.BLOG_TITLE}.</p>
                        <p><a href="{unsubscribe_url}">Unsubscribe</a></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        if send_email(email, f"New Post: {post_title}", html_content):
            sent_count += 1

    return sent_count


def send_new_post_notification_batched(
    post_title: str,
    post_slug: str,
    post_excerpt: Optional[str],
    base_url: str = "",
    batch_size: int = 100,
) -> int:
    """
    Send new post notification to all subscribers in batches.
    Queries subscribers in chunks to avoid loading all into memory.
    Returns count of successfully sent emails.
    """
    from ..database import SessionLocal
    from ..models import Subscriber

    sent_count = 0
    offset = 0

    while True:
        # Create a fresh session for each batch
        db = SessionLocal()
        try:
            # Query one batch of subscribers
            subscribers = (
                db.query(Subscriber)
                .filter(Subscriber.is_active.is_(True))
                .offset(offset)
                .limit(batch_size)
                .all()
            )

            if not subscribers:
                break

            # Process this batch
            subscribers_data = [(s.email, s.unsubscribe_token) for s in subscribers]
            sent_count += send_new_post_notification(
                post_title=post_title,
                post_slug=post_slug,
                post_excerpt=post_excerpt,
                subscribers=subscribers_data,
                base_url=base_url,
            )

            offset += batch_size

            # If we got fewer than batch_size, we're done
            if len(subscribers) < batch_size:
                break
        finally:
            db.close()

    logger.info(f"Sent new post notification to {sent_count} subscribers")
    return sent_count


def send_newsletter(
    posts: List[dict],  # List of {title, slug, excerpt}
    subscribers: List[tuple],  # List of (email, unsubscribe_token)
    subject: str,
    custom_message: Optional[str] = None,
    base_url: str = "",
) -> int:
    """
    Send newsletter with multiple posts to all subscribers.
    Returns count of successfully sent emails.
    """
    settings = get_settings()
    sent_count = 0

    primary_color, link_color, header_bg = get_email_styles()

    # Build posts HTML
    posts_html = ""
    for post in posts:
        post_url = f"{base_url}/post/{post['slug']}"
        posts_html += f"""
        <div style="margin-bottom: 24px; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 8px 0;">
                <a href="{post_url}" style="color: {primary_color}; text-decoration: none;">{post["title"]}</a>
            </h3>
            {f"<p style='margin: 0; color: #666;'>{post['excerpt']}</p>" if post.get("excerpt") else ""}
        </div>
        """

    for email, unsubscribe_token in subscribers:
        unsubscribe_url = f"{base_url}/unsubscribe?token={unsubscribe_token}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ {header_bg} color: white; padding: 30px; border-radius: 12px 12px 0 0; }}
                .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
                a {{ color: {link_color}; text-decoration: none; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">{settings.BLOG_TITLE} Newsletter</h1>
                </div>
                <div class="content">
                    {f"<p>{custom_message}</p>" if custom_message else ""}
                    <h2>Featured Posts</h2>
                    {posts_html}
                    <div class="footer">
                        <p>You're receiving this because you subscribed to {settings.BLOG_TITLE}.</p>
                        <p><a href="{unsubscribe_url}">Unsubscribe</a></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        if send_email(email, subject, html_content):
            sent_count += 1

    return sent_count


def send_newsletter_mailing_list(
    posts: List[dict],  # List of {title, slug, excerpt}
    subject: str,
    custom_message: Optional[str] = None,
    base_url: str = "",
) -> bool:
    """
    Send newsletter with multiple posts to mailing list.
    Uses send_to_mailing_list to send a single email to all subscribers.
    """
    settings = get_settings()

    primary_color, link_color, header_bg = get_email_styles()

    # Build posts HTML
    posts_html = ""
    for post in posts:
        post_url = f"{base_url}/post/{post['slug']}"
        posts_html += f"""
        <div style="margin-bottom: 24px; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 8px 0;">
                <a href="{post_url}" style="color: {primary_color}; text-decoration: none;">{post["title"]}</a>
            </h3>
            {f"<p style='margin: 0; color: #666;'>{post['excerpt']}</p>" if post.get("excerpt") else ""}
        </div>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ {header_bg} color: white; padding: 30px; border-radius: 12px 12px 0 0; }}
            .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }}
            .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
            a {{ color: {link_color}; text-decoration: none; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">{settings.BLOG_TITLE} Newsletter</h1>
            </div>
            <div class="content">
                {f"<p>{custom_message}</p>" if custom_message else ""}
                <h2>Featured Posts</h2>
                {posts_html}
                <div class="footer">
                    <p>You're receiving this because you subscribed to {settings.BLOG_TITLE}.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    return send_to_mailing_list(subject, html_content)
