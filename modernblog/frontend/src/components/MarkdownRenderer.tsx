import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { getImageUrl } from '../api/client';
import './MarkdownRenderer.css';
import { ExternalLinkIcon } from './Icons';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          // Custom image rendering
          img: ({ src, alt, ...props }) => {
            // If it's a relative path starting with /api/images, use getImageUrl
            const imageSrc = src?.startsWith('/api/images/')
              ? getImageUrl(src.replace('/api/images/', ''))
              : src;

            return (
              <figure className="markdown-figure">
                <img src={imageSrc} alt={alt || ''} loading="lazy" {...props} />
                {alt && <figcaption>{alt}</figcaption>}
              </figure>
            );
          },

          // Custom link rendering with external link handling
          a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith('http') || href?.startsWith('//');
            return (
              <a
                href={href}
                {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                {...props}
              >
                {children}
                {isExternal && <ExternalLinkIcon />}
              </a>
            );
          },

          // Custom code block with copy button
          pre: ({ children }) => {
            return (
              <div className="code-block-wrapper">
                <pre>{children}</pre>
              </div>
            );
          },

          // Custom heading with anchor links
          h2: ({ children, ...props }) => {
            const id = children
              ?.toString()
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^\w-]/g, '');
            return (
              <h2 id={id} {...props}>
                <a href={`#${id}`} className="heading-anchor">
                  #
                </a>
                {children}
              </h2>
            );
          },
          h3: ({ children, ...props }) => {
            const id = children
              ?.toString()
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^\w-]/g, '');
            return (
              <h3 id={id} {...props}>
                <a href={`#${id}`} className="heading-anchor">
                  #
                </a>
                {children}
              </h3>
            );
          },

          // Custom table rendering
          table: ({ children, ...props }) => (
            <div className="table-wrapper">
              <table {...props}>{children}</table>
            </div>
          ),

          // Prevent hydration error: unwrap block elements from paragraphs
          // Images are wrapped in <p> by markdown, but our img component returns <figure>
          p: ({ children, node, ...props }) => {
            // Check if any child is an image element (which will become a figure)
            const hasImage = node?.children?.some(
              (child: unknown) => (child as { tagName?: string }).tagName === 'img'
            );

            // If paragraph contains an image, don't wrap in <p>
            if (hasImage) {
              return <>{children}</>;
            }

            return <p {...props}>{children}</p>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
