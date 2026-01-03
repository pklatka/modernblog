import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { PostListItem } from '../types';
import './PostCard.css';

interface PostCardProps {
  post: PostListItem;
  featured?: boolean;
  index?: number;
  shouldAnimate?: boolean;
}

export default function PostCard({
  post,
  featured = false,
  index = 0,
  shouldAnimate = true,
}: PostCardProps) {
  const { t } = useTranslation();
  const date = post.published_at ? new Date(post.published_at) : new Date(post.created_at);

  return (
    <motion.article
      className={`post-card ${featured ? 'post-card-featured' : ''}`}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link to="/post/$slug" params={{ slug: post.slug }} className="post-card-link">
        {post.cover_image && featured && (
          <div className="post-card-image">
            <img src={post.cover_image} alt={post.title} />
          </div>
        )}
        <div className="post-card-content">
          <div className="post-card-meta">
            <time dateTime={date.toISOString()}>{format(date, 'MMMM d, yyyy')}</time>
            <span className="post-card-meta-separator">·</span>
            <span>{t('posts.readingTime', { minutes: post.reading_time })}</span>
          </div>

          <h2 className="post-card-title">{post.title}</h2>

          {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}

          {post.tags.length > 0 && (
            <div className="post-card-tags">
              {post.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="post-card-tag"
                  style={{ '--tag-color': tag.color } as React.CSSProperties}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.article>
  );
}
