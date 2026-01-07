import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

// Documentation content based on the README.md
const sections = [
    {
        id: 'overview',
        title: 'Overview',
        content: `
# ModernBlog

A self-hosted, modern blogging platform with a beautiful UI.

ModernBlog is designed for developers and writers who want complete control over their content. It's fully self-hosted, uses SQLite for simple data management, and includes everything you need out of the box.

## Key Highlights

- 🚀 **Quick Setup** - Install and run in minutes
- 💾 **Self-Hosted** - Own your data, run anywhere
- 🎨 **Beautiful UI** - Modern, responsive design
- 📝 **Markdown First** - Write content the way developers love
`,
    },
    {
        id: 'installation',
        title: 'Installation',
        content: `
# Installation

## Quick Install

Install ModernBlog with a single command:

\`\`\`bash
curl -LsSf https://modernblog.klatka.it/install.sh | sh
\`\`\`

This downloads and installs the latest release to \`~/.local/share/modernblog\`.

## Install from Source

For development or to get the latest changes:

\`\`\`bash
# Clone the repository
git clone https://github.com/pklatka/modernblog.git
cd modernblog

# Install with uv (Python package manager)
uv sync
\`\`\`

> **Note:** Requires Python 3.11+ and [uv](https://docs.astral.sh/uv/)
`,
    },
    {
        id: 'setup',
        title: 'Setup',
        content: `
# Setup

After installation, run the interactive setup wizard:

\`\`\`bash
modernblog setup
\`\`\`

You'll be prompted to configure:

- **Blog title and description** - Your blog's identity
- **Your name and bio** - Author information
- **Admin token** - Password for the admin panel
- **Comment approval** - Auto-approve or require moderation
- **Language** - English or Polish
- **Theme** - Choose from 6 built-in themes
- **Data directory** - Where to store your database and uploads
- **Email (optional)** - SMTP or mailing list configuration
- **GitHub Sponsors (optional)** - Add a sponsor button

## Start the Server

\`\`\`bash
modernblog run --port 8080
\`\`\`

Your blog is now live at \`http://localhost:8080\`!
`,
    },
    {
        id: 'cli',
        title: 'CLI Commands',
        content: `
# CLI Commands

ModernBlog provides a comprehensive CLI for managing your blog.

| Command | Description |
|---------|-------------|
| \`modernblog setup\` | Run the interactive setup wizard |
| \`modernblog run\` | Start the blog server |
| \`modernblog run --port 8080\` | Start on a specific port |
| \`modernblog run --host 0.0.0.0\` | Bind to all interfaces |
| \`modernblog run --reload\` | Enable auto-reload (dev) |
| \`modernblog run --workers 4\` | Run with multiple workers |
| \`modernblog check\` | Check environment for issues |
| \`modernblog start\` | Start as a background service |
| \`modernblog stop\` | Stop the background service |
| \`modernblog config\` | View current configuration |
| \`modernblog uninstall\` | Remove all data |

## Custom Config Directory

Use \`--config-dir <path>\` with any command to use a custom configuration directory:

\`\`\`bash
modernblog run --config-dir /var/www/myblog
\`\`\`
`,
    },
    {
        id: 'features',
        title: 'Features',
        content: `
# Features

## Markdown Editor
Write posts in Markdown with live preview. Supports:
- Syntax highlighting
- Images (upload or external URLs)
- Tables and lists
- Code blocks

## Nested Comments
Multi-level threaded discussions with:
- Moderation tools
- Anti-spam protection (honeypot, rate limiting)
- Optional approval workflow

## Theme Customization
6 built-in themes:
- **Modern** - Clean, neutral design
- **Amber** - Warm, earthy tones
- **Ocean** - Cool blue tones
- **Forest** - Natural green tones
- **Rose** - Soft pink tones
- **Slate** - Professional gray

## Email Subscriptions
Newsletter support with:
- Direct SMTP configuration
- Mailing list support (Majordomo)
- New post notifications

## Dark/Light Mode
Automatic system detection with manual toggle.

## Full-text Search
Fast, built-in search across all posts.

## Responsive Design
Optimized for desktop, tablet, and mobile.
`,
    },
    {
        id: 'configuration',
        title: 'Configuration',
        content: `
# Configuration

Configuration is stored in \`~/.modernblog/config.json\`.

## Data Storage

All data is stored in \`~/.modernblog/data/\`:
- \`blog.db\` - SQLite database
- \`uploads/\` - Uploaded images

## SMTP Configuration

\`\`\`json
{
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "user": "your-email@gmail.com",
    "password": "your-app-password",
    "from_email": "blog@example.com",
    "from_name": "My Blog"
  }
}
\`\`\`

## Mailing List (Majordomo)

\`\`\`json
{
  "mailing_list": {
    "enabled": true,
    "domain": "lists.example.com",
    "name": "blog-subscribers",
    "password": "majordomo-password"
  }
}
\`\`\`

## Theme

\`\`\`json
{
  "theme": {
    "name": "ocean"
  }
}
\`\`\`

## Comment Moderation

\`\`\`json
{
  "comment_approval_required": true
}
\`\`\`
`,
    },
    {
        id: 'deployment',
        title: 'Deployment',
        content: `
# Deployment

## Production Server

For production, run with multiple workers:

\`\`\`bash
modernblog run --workers 4 --host 127.0.0.1 --port 8080
\`\`\`

## Systemd Service

Start as a system service for automatic startup:

\`\`\`bash
modernblog start --port 8080 --workers 4
\`\`\`

To stop the service:

\`\`\`bash
modernblog stop
\`\`\`

The systemd service:
- Starts on boot
- Restarts on failure
- Runs as your user

## HTTPS with Caddy (Recommended)

We recommend [Caddy](https://caddyserver.com/) as a reverse proxy:

\`\`\`caddyfile
yourblog.com {
    reverse_proxy localhost:8080
}
\`\`\`

Caddy automatically provisions and renews SSL certificates.

## Direct HTTPS

For native SSL support:

\`\`\`bash
modernblog run --ssl-keyfile key.pem --ssl-certfile cert.pem
\`\`\`
`,
    },
    {
        id: 'security',
        title: 'Security',
        content: `
# Security

## Built-in Protections

- **Rate Limiting** - 1000 requests/hour per IP
- **Security Headers** - X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Path Traversal Protection** - Image serving validates paths
- **Input Validation** - All inputs validated via Pydantic
- **Admin Authentication** - Token-based auth for admin endpoints

## Anti-Spam

- **Honeypot field** - Hidden field that catches bots
- **Form timing** - Rejects submissions faster than 3 seconds
- **IP rate limiting** - Max 5 comments per IP in 5 minutes

## Best Practices

1. **Use a strong admin token** - Setup wizard generates 32-char random token
2. **Keep updated** - Regularly update ModernBlog
3. **Use HTTPS** - Always use TLS in production
4. **Backup regularly** - Database is at \`~/.modernblog/data/blog.db\`
`,
    },
];

export const Route = createFileRoute('/docs')({
    component: DocsPage,
});

function DocsPage() {
    const [activeSection, setActiveSection] = useState('overview');

    const currentSection = sections.find((s) => s.id === activeSection) || sections[0];

    return (
        <div className="min-h-screen bg-slate-950 pt-20">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-24">
                            <nav className="space-y-1">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === section.id
                                            ? 'bg-violet-500/20 text-violet-300 border-l-2 border-violet-500'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                            }`}
                                    >
                                        {section.title}
                                    </button>
                                ))}
                            </nav>

                            <div className="mt-8 pt-8 border-t border-slate-800">
                                <Link
                                    to="/"
                                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to Home
                                </Link>
                            </div>
                        </div>
                    </aside>

                    {/* Mobile nav */}
                    <div className="lg:hidden mb-6 w-full">
                        <select
                            value={activeSection}
                            onChange={(e) => setActiveSection(e.target.value)}
                            className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            {sections.map((section) => (
                                <option key={section.id} value={section.id}>
                                    {section.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Content */}
                    <main className="flex-1 min-w-0">
                        <article className="prose prose-invert prose-slate max-w-none prose-headings:font-semibold prose-h1:text-3xl prose-h1:mb-4 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-p:text-slate-300 prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline prose-code:text-violet-300 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800 prose-table:border-collapse prose-th:border prose-th:border-slate-700 prose-th:bg-slate-800 prose-th:px-4 prose-th:py-2 prose-td:border prose-td:border-slate-700 prose-td:px-4 prose-td:py-2 prose-blockquote:border-l-violet-500 prose-blockquote:bg-slate-900/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-strong:text-white">
                            <Markdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                            >
                                {currentSection.content}
                            </Markdown>
                        </article>

                        {/* Navigation */}
                        <div className="flex justify-between mt-12 pt-8 border-t border-slate-800">
                            {sections.findIndex((s) => s.id === activeSection) > 0 && (
                                <button
                                    onClick={() => {
                                        const idx = sections.findIndex((s) => s.id === activeSection);
                                        setActiveSection(sections[idx - 1].id);
                                    }}
                                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Previous
                                </button>
                            )}
                            <div className="flex-1" />
                            {sections.findIndex((s) => s.id === activeSection) < sections.length - 1 && (
                                <button
                                    onClick={() => {
                                        const idx = sections.findIndex((s) => s.id === activeSection);
                                        setActiveSection(sections[idx + 1].id);
                                    }}
                                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    Next
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
