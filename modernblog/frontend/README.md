# Blog Frontend

A modern React frontend for the personal blog application.

## Features

- **Dark/Light Theme**: Automatic detection with manual toggle
- **Markdown Rendering**: Full Markdown support with syntax highlighting
- **Nested Comments**: Multi-level comment threads
- **Search**: Full-text search across posts
- **Tags**: Filter posts by topic
- **Responsive Design**: Works on all devices
- **Admin Dashboard**: Create and manage posts easily

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Writing Posts

Posts are written in **Markdown** with full support for:

### Text Formatting

- `**bold**` for **bold text**
- `*italic*` for _italic text_
- `` `code` `` for inline code

### Headings

```markdown
# Heading 1

## Heading 2

### Heading 3
```

### Links and References

```markdown
[Link text](https://example.com)
```

### Images

```markdown
![Alt text](image-url)
```

Or upload directly via the editor.

### Code Blocks

````markdown
```javascript
function hello() {
  console.log('Hello World!');
}
```
````

### Blockquotes

```markdown
> This is a quote
```

### Lists

```markdown
- Item 1
- Item 2
  - Nested item
```

## Environment Variables

- `VITE_API_URL`: Backend API URL (optional, defaults to same origin)

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Framer Motion
- react-markdown
- date-fns
