"""Database initialization logic."""

from datetime import datetime, timedelta

from modernblog.backend.database import (
    get_session_local,
)
from modernblog.backend.models import Post, Tag


def create_example_posts():
    """Create example blog posts for demonstration."""
    SessionLocal = get_session_local()
    db = SessionLocal()

    try:
        # Check if posts already exist
        existing_posts = db.query(Post).count()
        if existing_posts > 0:
            return

        # Create tags
        tags = {
            "getting-started": Tag(name="Getting Started", slug="getting-started"),
            "tutorial": Tag(name="Tutorial", slug="tutorial"),
            "features": Tag(name="Features", slug="features"),
            "markdown": Tag(name="Markdown", slug="markdown"),
        }
        for tag in tags.values():
            db.add(tag)
        db.flush()

        # Example posts
        posts_data = [
            {
                "title": "Welcome to ModernBlog",
                "slug": "welcome-to-modernblog",
                "content": """# Welcome to ModernBlog! 🎉

This is your new self-hosted blogging platform. ModernBlog is designed to be simple, beautiful, and fast.

## Getting Started

1. **Create posts** - Visit `/admin` to access the admin panel
2. **Customize** - Run `modernblog setup` to configure your blog
3. **Write** - Use Markdown to create beautiful content

## Features

- 📝 **Markdown Editor** with live preview
- 🖼️ **Image Upload** support
- 💬 **Nested Comments** for discussions
- 🏷️ **Tags** to organize content
- 🔍 **Full-text Search** across all posts
- 🌙 **Dark/Light Theme** with auto-detection

Enjoy your new blog!
""",
                "excerpt": "Welcome to your new self-hosted blogging platform. Learn how to get started with ModernBlog.",
                "is_published": True,
                "is_featured": True,
                "tags": [tags["getting-started"], tags["features"]],
                "created_at": datetime.utcnow() - timedelta(days=2),
                "published_at": datetime.utcnow() - timedelta(days=2),
            },
            {
                "title": "Mastering Markdown in ModernBlog",
                "slug": "mastering-markdown",
                "content": """# Mastering Markdown

ModernBlog uses Markdown for content creation. Here's a quick guide to the syntax.

## Text Formatting

- **Bold text** using `**bold**`
- *Italic text* using `*italic*`
- ~~Strikethrough~~ using `~~strikethrough~~`
- `Inline code` using backticks

## Code Blocks

```python
def hello_world():
    print("Hello, ModernBlog!")
```

## Lists

### Unordered
- Item one
- Item two
- Nested item

### Ordered
1. First step
2. Second step
3. Third step

## Links and Images

- Links: `[text](url)`
- Images: `![alt text](image-url)`

## Blockquotes

> "The best way to predict the future is to create it."
> — Peter Drucker

## Tables

| Feature | Status |
|---------|--------|
| Markdown | ✅ |
| Syntax Highlighting | ✅ |
| Tables | ✅ |

Happy writing!
""",
                "excerpt": "A comprehensive guide to using Markdown syntax in your blog posts.",
                "is_published": True,
                "is_featured": False,
                "tags": [tags["tutorial"], tags["markdown"]],
                "created_at": datetime.utcnow() - timedelta(days=1),
                "published_at": datetime.utcnow() - timedelta(days=1),
            },
            {
                "title": "Customizing Your Blog Theme",
                "slug": "customizing-your-theme",
                "content": """# Customizing Your Theme

ModernBlog supports extensive theme customization through the setup wizard.

## Running the Setup Wizard

```bash
modernblog setup
```

## Available Options

### Colors
- **Modern** - Clean, neutral design
- **Amber** - Warm, earthy tones
- **Ocean** - Cool blue tones
- **Forest** - Natural green tones
- **Rose** - Soft pink and rose tones
- **Slate** - Neutral gray tones

### Example Configuration

```json
{
  "theme": {
    "name": "ocean"
  }
}
```

## Dark Mode

ModernBlog automatically detects your system preference and switches between light and dark modes. Users can also toggle manually using the theme switcher in the header.

## Tips

1. Choose a theme that fits your content
2. Test both light and dark modes
3. Use high-quality images for posts

Your configuration is saved to `~/.modernblog/config.json`.
""",
                "excerpt": "Learn how to customize the colors and appearance of your ModernBlog instance.",
                "is_published": True,
                "is_featured": False,
                "tags": [tags["tutorial"], tags["features"]],
                "created_at": datetime.utcnow(),
                "published_at": datetime.utcnow(),
            },
        ]

        for post_data in posts_data:
            post_tags = post_data.pop("tags")
            post = Post(**post_data)
            post.tags = post_tags
            db.add(post)

        db.commit()
        print(f"✓ Created {len(posts_data)} example posts with {len(tags)} tags")

    except Exception as e:
        db.rollback()
        print(f"Error creating example posts: {e}")
        raise
    finally:
        db.close()
