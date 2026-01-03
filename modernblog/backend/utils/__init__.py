"""Utils package for ModernBlog."""

from .email_service import (
    send_email,
    send_new_post_notification,
    send_newsletter,
    subscribe_via_mailing_list,
    unsubscribe_via_mailing_list,
    send_to_mailing_list,
    send_new_post_notification_mailing_list,
    send_newsletter_mailing_list,
)

__all__ = [
    "send_email",
    "send_new_post_notification",
    "send_newsletter",
    "subscribe_via_mailing_list",
    "unsubscribe_via_mailing_list",
    "send_to_mailing_list",
    "send_new_post_notification_mailing_list",
    "send_newsletter_mailing_list",
]
