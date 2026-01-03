# ModernBlog

A self-hosted, modern blogging platform with a beautiful UI.

![ModernBlog](https://img.shields.io/badge/ModernBlog-v1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/python-3.11+-blue)

## Features

- 📝 **Markdown Editor** - Write posts in Markdown with live preview
- 🖼️ **Image Upload** - Upload images directly or use external URLs
- 💬 **Nested Comments** - Multi-level threaded discussions with moderation
- 🏷️ **Tags** - Organize posts by topic
- 🔍 **Full-text Search** - Search across all posts
- 🌙 **Dark/Light Theme** - Automatic system detection with manual toggle
- 🎨 **Theme Customization** - Multiple built-in color themes
- 📧 **Email Subscriptions** - Newsletter support with SMTP or mailing lists
- 📱 **Responsive Design** - Optimized for all devices
- 💚 **GitHub Sponsors** - Built-in sponsor button integration

## Quick Demo

<div align="center">
  <video src="https://github.com/user-attachments/assets/a3ba2589-e22b-4b06-a799-371d79f372e9" width="600" />
</div>

## Quick Start

### Installation

Install using the standalone installer (downloads the latest release):

```bash
curl -LsSf https://modernblog.klatka.it/install | sh
```

Or install from source for development (requires [uv](https://docs.astral.sh/uv/)):

```bash
git clone https://github.com/pklatka/modernblog.git
cd modernblog
uv sync
```

### Setup

Run the interactive setup wizard to configure your blog:

```bash
modernblog setup
```

You'll be prompted to enter:
- Blog title and description
- Your name and bio
- Admin token (for accessing the admin panel)
- Comment approval preference (auto-approve or manual)
- Language preference (English or Polish)
- Theme selection
- Data directory (for database and uploads)
- Optional: Email configuration (Direct SMTP or Mailing List)
- Optional: GitHub Sponsors URL

### Start the Server

```bash
modernblog run --port 8080
```

Your blog is now running at `http://localhost:8080`!

## CLI Commands

| Command | Description |
|---------|-------------|
| `modernblog setup` | Run the interactive setup wizard |
| `modernblog run` | Start the blog server |
| `modernblog run --port 8080` | Start on a specific port |
| `modernblog run --host 0.0.0.0` | Bind to all interfaces (any IP) |
| `modernblog run --reload` | Enable auto-reload (development) |
| `modernblog run --workers 4` | Run with multiple worker processes |
| `modernblog run --ssl-keyfile k.pem --ssl-certfile c.pem` | Run with native HTTPS |
| `modernblog check` | Check environment for deployment issues |
| `modernblog start` | Start as a background service (systemd) |
| `modernblog stop` | Stop the background service |
| `modernblog config` | View current configuration |
| `modernblog uninstall` | Remove all data and configuration |

> [!TIP]
> Use `--config-dir <path>` with any command to use a custom configuration directory.

## Configuration

Configuration is stored in `~/.modernblog/config.json`. You can customize it manually or with the `modernblog setup` command.

### Data Storage

By default, all data is stored in `~/.modernblog/data/`:
- `blog.db` - SQLite database with posts, comments, and tags
- `uploads/` - Uploaded images

## Admin Panel

Access the admin panel at `/admin` and enter your admin token to:
- Create, edit, and delete posts
- Manage comments (approve/reject/delete)
- Send newsletters to subscribers

## Email Subscriptions

ModernBlog supports email subscriptions for notifying readers about new posts.

### SMTP Configuration

During setup or in `config.json`, configure SMTP:

```json
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
```

### Mailing List Support (Majordomo)

For larger deployments, you can use a Majordomo mailing list:

```json
{
  "mailing_list": {
    "enabled": true,
    "domain": "lists.example.com",
    "name": "blog-subscribers",
    "password": "majordomo-password"
  }
}
```

## Theme Customization

ModernBlog includes 6 built-in themes:

| Theme | Description |
|-------|-------------|
| **Modern** | Clean, neutral design with stone backgrounds |
| **Amber** | Warm, earthy tones with amber accents |
| **Ocean** | Cool blue tones inspired by the sea |
| **Forest** | Natural green tones with earthy accents |
| **Rose** | Soft pink and rose tones for a warm aesthetic |
| **Slate** | Neutral gray tones for a professional look |

Select a theme during setup or update `config.json`:

```json
{
  "theme": {
    "name": "ocean"
  }
}
```

## Internationalization

ModernBlog supports multiple languages. Currently available:
- **English** (`en`)
- **Polish** (`pl`)

Configure the language during setup or in `config.json`:

```json
{
  "i18n": {
    "language": "en"
  }
}
```

## Comment Moderation

### Auto-approve Comments
By default, comments are auto-approved. To require manual approval:

```json
{
  "comment_approval_required": true
}
```

### Anti-Spam Protection

ModernBlog includes built-in anti-spam measures:
- **Honeypot field** - Hidden field that catches bots
- **Form timing** - Rejects submissions faster than 3 seconds
- **IP rate limiting** - Max 5 comments per IP in 5 minutes

## Security

### Built-in Protections

- **Rate Limiting** - Global API rate limiting (1000 requests/hour per IP)
- **Security Headers** - X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Path Traversal Protection** - Image serving validates paths
- **Input Validation** - All inputs validated via Pydantic schemas
- **Admin Authentication** - Token-based authentication for admin endpoints

### Best Practices

1. **Use a strong admin token** - The setup wizard generates a random 32-character token
2. **Keep your server updated** - Regularly update ModernBlog and dependencies
3. **Use HTTPS in production** - Put ModernBlog behind a reverse proxy with TLS
4. **Backup regularly** - The SQLite database is in `~/.modernblog/data/blog.db`

## Deployment

### Production Server

For production environments, you should run the server with multiple workers and potentially bind to localhost if using a reverse proxy:

```bash
modernblog run --workers 4 --host 127.0.0.1 --port 8080
```

### System Service (Linux)

To ensure ModernBlog starts on boot and restarts automatically, you can run it as a systemd service:

```bash
# Start as a background service with 4 workers
modernblog start --port 8080 --workers 4

# Stop the service
modernblog stop
```

### HTTPS with Caddy (Recommended)

We recommend using [Caddy](https://caddyserver.com/) as a modern, automatic HTTPS reverse proxy.

1.  **Install Caddy**: Follow instructions at [caddyserver.com](https://caddyserver.com/docs/install)
2.  **Create Caddyfile**:

```caddyfile
yourblog.com {
    reverse_proxy localhost:8080
}
```

3.  **Run Caddy**: `caddy run` (or install as a service)

Caddy will automatically provision and renew SSL certificates for your domain.

### Direct HTTPS (Native)

If you prefer to handle SSL directly in Python (not recommended for performance):

```bash
modernblog run --ssl-keyfile key.pem --ssl-certfile cert.pem
```

## Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- uv (https://docs.astral.sh/uv/)

### Setup

```bash
uv sync
source .venv/bin/activate
```

### Backend Development

```bash
modernblog run --reload
```

### Frontend Development

```bash
cd modernblog/frontend
npm install
npm run dev
```

### Building for Production

```bash
cd modernblog/frontend
npm run build
```

The built frontend is automatically served by the backend.

## Troubleshooting

### Server won't start
- Ensure Python 3.11+ is installed
- Run `modernblog setup` if configuration is missing
- Check logs for specific error messages

### Frontend not loading
- Build the frontend: `cd modernblog/frontend && npm run build`
- Check that `modernblog/frontend/dist/` exists

### Emails not sending
- Verify SMTP credentials in `config.json`
- For Gmail, use an App Password (not your main password)
- Check spam folder for test emails

### Comments not appearing
- If `comment_approval_required` is true, approve comments in admin panel
- Check browser console for API errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

Created by [Patryk Klatka](https://klatka.it)

[![Sponsor](https://img.shields.io/badge/Sponsor-❤️-red)](https://github.com/sponsors/pklatka)
