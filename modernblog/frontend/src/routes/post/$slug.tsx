import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { getPost } from '../../api/client';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import Comments from '../../components/Comments';
import Spinner from '../../components/Spinner';
import SEO from '../../components/SEO';
import { useBlogInfo } from '../../context/BlogInfoContext';
import { useEffect, useMemo } from 'react';
import { useEntranceAnimation } from '../../hooks/useEntranceAnimation';
import './PostPage.css';
import { HeartIcon } from '../../components/Icons';

export const Route = createFileRoute('/post/$slug')({
  component: PostPage,
});

function PostPage() {
  const { slug } = Route.useParams();
  const { t } = useTranslation();
  const { blogInfo } = useBlogInfo();
  const queryClient = useQueryClient();

  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => getPost(slug),
  });

  // We only enable animation if we are loading initially.
  const { shouldAnimate } = useEntranceAnimation();

  useEffect(() => {
    if (!isLoading) {
      document.getElementById('root')?.classList.add('ready');
    }
  }, [isLoading]);

  // Calculate word count for structured data
  const wordCount = useMemo(() => {
    if (!post?.content) return 0;
    return post.content.split(/\s+/).length;
  }, [post?.content]);

  if (isLoading) {
    return (
      <div className="container">
        <Spinner loading={isLoading} />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container">
        <div className="error-state">
          <h1>{t('post.notFoundTitle')}</h1>
          <p>{t('post.notFoundMessage')}</p>
          <Link to="/" className="back-link">
            {t('notFound.backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  const publishedDate = post.published_at ? new Date(post.published_at) : new Date(post.created_at);

  return (
    <article className="post-page">
      <SEO
        title={post.title}
        description={post.excerpt || post.content.substring(0, 160)}
        image={post.cover_image || undefined}
        url={`/post/${post.slug}`}
        type="article"
        publishedTime={post.published_at || post.created_at}
        modifiedTime={post.updated_at}
        author={blogInfo?.author_name}
        tags={post.tags.map((tag) => tag.name)}
        articleBody={post.content}
        wordCount={wordCount}
        readingTime={post.reading_time}
      />
      <div className="container">
        {/* Post Header */}
        <motion.header
          className="post-header"
          initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="post-meta">
            <time dateTime={publishedDate.toISOString()}>
              {format(publishedDate, 'MMMM d, yyyy')}
            </time>
            <span className="post-meta-separator">·</span>
            <span>{t('posts.readingTime', { minutes: post.reading_time })}</span>
            <span className="post-meta-separator">·</span>
            <span>
              {post.views.toLocaleString()} {t('post.views')}
            </span>
          </div>

          <h1 className="post-title">{post.title}</h1>

          {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}

          {post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag) => (
                <Link
                  key={tag.id}
                  to="/tag/$slug"
                  params={{ slug: tag.slug }}
                  search={{ page: 1 }}
                  className="post-tag"
                  style={{ '--tag-color': tag.color } as React.CSSProperties}
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </motion.header>

        {/* Cover Image */}
        {post.cover_image && (
          <motion.div
            className="post-cover"
            initial={shouldAnimate ? { opacity: 0, scale: 0.98 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <img src={post.cover_image} alt={post.title} />
          </motion.div>
        )}

        {/* Post Content */}
        <motion.div
          className="post-content"
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <MarkdownRenderer content={post.content} />
        </motion.div>

        {/* Sponsor CTA */}
        {blogInfo?.github_sponsor_url && (
          <motion.div
            className="sponsor-cta"
            initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <p>{t('post.sponsorCTA')}</p>
            <a
              href={blogInfo.github_sponsor_url}
              target="_blank"
              rel="noopener noreferrer"
              className="sponsor-cta-button"
            >
              <HeartIcon />
              {t('post.sponsorButton')}
            </a>
          </motion.div>
        )}

        {/* Comments Section */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Comments
            postSlug={post.slug}
            comments={post.comments}
            onCommentAdded={() => {
              queryClient.invalidateQueries({ queryKey: ['post', slug] });
            }}
            shouldAnimate={shouldAnimate}
          />
        </motion.div>

        {/* Back to Home */}
        <div className="post-footer">
          <Link to="/" className="back-link">
            {t('post.backToPosts')}
          </Link>
        </div>
      </div>
    </article>
  );
}
