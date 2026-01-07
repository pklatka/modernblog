"""SEO router for ModernBlog - Sitemap, RSS, and robots.txt."""

from datetime import datetime
from typing import Optional
from xml.etree.ElementTree import Element, SubElement, tostring

from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import Post, Tag

router = APIRouter(tags=["seo"])


def get_site_url(request: Request) -> str:
    """Get the site URL from settings or request."""
    settings = get_settings()
    if settings.SITE_URL:
        return settings.SITE_URL.rstrip("/")
    # Fallback to request base URL
    return str(request.base_url).rstrip("/")


def format_datetime_iso(dt: Optional[datetime]) -> str:
    """Format datetime to ISO 8601 format for sitemaps."""
    if not dt:
        return ""
    return dt.strftime("%Y-%m-%dT%H:%M:%S+00:00")


def format_datetime_rfc822(dt: Optional[datetime]) -> str:
    """Format datetime to RFC 822 format for RSS."""
    if not dt:
        return ""
    return dt.strftime("%a, %d %b %Y %H:%M:%S +0000")


@router.get("/sitemap.xml")
async def sitemap(request: Request, db: Session = Depends(get_db)):
    """
    Generate XML sitemap for search engine indexing.
    
    Includes:
    - Homepage
    - All published posts
    - Tag pages
    - Posts listing page
    """
    settings = get_settings()
    site_url = get_site_url(request)

    # Create XML structure
    urlset = Element("urlset")
    urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")
    urlset.set("xmlns:news", "http://www.google.com/schemas/sitemap-news/0.9")
    urlset.set("xmlns:image", "http://www.google.com/schemas/sitemap-image/1.1")

    # Add homepage
    homepage = SubElement(urlset, "url")
    SubElement(homepage, "loc").text = site_url
    SubElement(homepage, "changefreq").text = "daily"
    SubElement(homepage, "priority").text = "1.0"

    # Add posts listing page
    posts_page = SubElement(urlset, "url")
    SubElement(posts_page, "loc").text = f"{site_url}/posts"
    SubElement(posts_page, "changefreq").text = "daily"
    SubElement(posts_page, "priority").text = "0.9"

    # Get all published posts
    posts = (
        db.query(Post)
        .filter(Post.is_published, Post.published_at <= datetime.utcnow())
        .order_by(Post.published_at.desc())
        .all()
    )

    for post in posts:
        url_elem = SubElement(urlset, "url")
        SubElement(url_elem, "loc").text = f"{site_url}/post/{post.slug}"
        
        # Use the most recent date (updated or published)
        last_mod = post.updated_at or post.published_at
        if last_mod:
            SubElement(url_elem, "lastmod").text = format_datetime_iso(last_mod)
        
        SubElement(url_elem, "changefreq").text = "weekly"
        
        # Featured posts get higher priority
        priority = "0.8" if post.is_featured else "0.7"
        SubElement(url_elem, "priority").text = priority

        # Add image if cover image exists
        if post.cover_image:
            image_elem = SubElement(url_elem, "image:image")
            image_url = post.cover_image
            if not image_url.startswith("http"):
                image_url = f"{site_url}{image_url}"
            SubElement(image_elem, "image:loc").text = image_url
            SubElement(image_elem, "image:title").text = post.title
            if post.excerpt:
                SubElement(image_elem, "image:caption").text = post.excerpt[:500]

    # Get all tags with posts
    tags = db.query(Tag).all()
    for tag in tags:
        # Only include tags that have published posts
        has_posts = any(
            p.is_published and p.published_at and p.published_at <= datetime.utcnow()
            for p in tag.posts
        )
        if has_posts:
            url_elem = SubElement(urlset, "url")
            SubElement(url_elem, "loc").text = f"{site_url}/tag/{tag.slug}"
            SubElement(url_elem, "changefreq").text = "weekly"
            SubElement(url_elem, "priority").text = "0.6"

    # Generate XML string
    xml_string = tostring(urlset, encoding="unicode")
    xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
    
    return Response(
        content=xml_declaration + xml_string,
        media_type="application/xml",
        headers={
            "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
        },
    )


@router.get("/robots.txt")
async def robots_txt(request: Request):
    """
    Generate robots.txt for search engine crawlers.
    
    Allows all crawlers access to public content,
    blocks admin and API routes.
    """
    site_url = get_site_url(request)

    robots_content = f"""# robots.txt for ModernBlog
# https://www.robotstxt.org/

User-agent: *
Allow: /
Allow: /post/
Allow: /posts
Allow: /tag/

# Block admin and API routes
Disallow: /admin
Disallow: /api/

# Block search results (to avoid duplicate content)
Disallow: /search

# Sitemap location
Sitemap: {site_url}/sitemap.xml

# RSS Feed
# {site_url}/rss.xml
"""

    return Response(
        content=robots_content,
        media_type="text/plain",
        headers={
            "Cache-Control": "public, max-age=86400",  # Cache for 24 hours
        },
    )


@router.get("/rss.xml")
@router.get("/feed.xml")
@router.get("/atom.xml")
async def rss_feed(request: Request, db: Session = Depends(get_db)):
    """
    Generate RSS 2.0 feed for blog posts.
    
    Includes the 20 most recent published posts.
    """
    settings = get_settings()
    site_url = get_site_url(request)

    # Create RSS structure
    rss = Element("rss")
    rss.set("version", "2.0")
    rss.set("xmlns:atom", "http://www.w3.org/2005/Atom")
    rss.set("xmlns:content", "http://purl.org/rss/1.0/modules/content/")
    rss.set("xmlns:dc", "http://purl.org/dc/elements/1.1/")

    channel = SubElement(rss, "channel")

    # Channel metadata
    SubElement(channel, "title").text = settings.BLOG_TITLE
    SubElement(channel, "description").text = settings.BLOG_DESCRIPTION
    SubElement(channel, "link").text = site_url
    SubElement(channel, "language").text = settings.LANGUAGE
    SubElement(channel, "generator").text = "ModernBlog"

    # Atom self link (for feed readers)
    atom_link = SubElement(channel, "atom:link")
    atom_link.set("href", f"{site_url}/rss.xml")
    atom_link.set("rel", "self")
    atom_link.set("type", "application/rss+xml")

    # Get recent published posts
    posts = (
        db.query(Post)
        .filter(Post.is_published, Post.published_at <= datetime.utcnow())
        .order_by(Post.published_at.desc())
        .limit(20)
        .all()
    )

    # Set lastBuildDate to the most recent post
    if posts:
        most_recent = posts[0].published_at or posts[0].created_at
        SubElement(channel, "lastBuildDate").text = format_datetime_rfc822(most_recent)
        SubElement(channel, "pubDate").text = format_datetime_rfc822(most_recent)

    for post in posts:
        item = SubElement(channel, "item")
        
        SubElement(item, "title").text = post.title
        SubElement(item, "link").text = f"{site_url}/post/{post.slug}"
        SubElement(item, "guid").text = f"{site_url}/post/{post.slug}"
        
        # Description (excerpt or truncated content)
        description = post.excerpt or (post.content[:300] + "..." if len(post.content) > 300 else post.content)
        SubElement(item, "description").text = description
        
        # Full content (encoded)
        content_encoded = SubElement(item, "content:encoded")
        content_encoded.text = f"<![CDATA[{post.content}]]>"
        
        # Publication date
        pub_date = post.published_at or post.created_at
        SubElement(item, "pubDate").text = format_datetime_rfc822(pub_date)
        
        # Author
        SubElement(item, "dc:creator").text = settings.AUTHOR_NAME
        
        # Categories (tags)
        for tag in post.tags:
            category = SubElement(item, "category")
            category.text = tag.name

        # Enclosure for cover image
        if post.cover_image:
            enclosure = SubElement(item, "enclosure")
            image_url = post.cover_image
            if not image_url.startswith("http"):
                image_url = f"{site_url}{image_url}"
            enclosure.set("url", image_url)
            enclosure.set("type", "image/jpeg")  # Assume JPEG, could be improved
            enclosure.set("length", "0")  # Unknown length

    # Generate XML string
    xml_string = tostring(rss, encoding="unicode")
    xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
    
    return Response(
        content=xml_declaration + xml_string,
        media_type="application/rss+xml",
        headers={
            "Cache-Control": "public, max-age=1800",  # Cache for 30 minutes
        },
    )


@router.get("/api/seo/metadata")
async def get_seo_metadata(request: Request, db: Session = Depends(get_db)):
    """
    Get SEO metadata for the blog.
    
    Returns site URL, social links, and other SEO-related configuration.
    """
    settings = get_settings()
    site_url = get_site_url(request)

    # Get total published posts count
    total_posts = (
        db.query(Post)
        .filter(Post.is_published, Post.published_at <= datetime.utcnow())
        .count()
    )

    return {
        "site_url": site_url,
        "title": settings.BLOG_TITLE,
        "description": settings.BLOG_DESCRIPTION,
        "author": settings.AUTHOR_NAME,
        "language": settings.LANGUAGE,
        "total_posts": total_posts,
        "feeds": {
            "rss": f"{site_url}/rss.xml",
            "sitemap": f"{site_url}/sitemap.xml",
        },
    }

