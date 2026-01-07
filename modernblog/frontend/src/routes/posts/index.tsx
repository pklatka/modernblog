import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getPosts } from '../../api/client';
import PostCard from '../../components/PostCard';
import Spinner from '../../components/Spinner';
import SEO from '../../components/SEO';
import './PostsPage.css';
import { useEntranceAnimation } from '../../hooks/useEntranceAnimation';

export const Route = createFileRoute('/posts/')({
  validateSearch: (search: Record<string, unknown>): { page: number } => {
    return {
      page: Number(search?.page ?? 1) || 1,
    };
  },
  component: PostsPage,
});

function PostsPage() {
  const { t } = useTranslation();
  const { shouldAnimate } = useEntranceAnimation();
  const { page } = Route.useSearch();

  const { data, isLoading } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => getPosts(page, 12),
    placeholderData: (prev) => prev,
  });

  // Basic ready state for entrance animation if needed
  if (!isLoading) {
    document.getElementById('root')?.classList.add('ready');
  }

  const posts = data?.posts || [];
  const totalPages = data?.total_pages || 1;

  if (isLoading && !data) {
    return (
      <div className="container">
        <Spinner loading={isLoading} />
      </div>
    );
  }
  return (
    <div className="posts-page">
      <SEO
        title={t('posts.title')}
        description={t('posts.description')}
        type="website"
        url={`/posts${page > 1 ? `?page=${page}` : ''}`}
        canonical="/posts"
      />
      <div className="container">
        <motion.header
          className="posts-header"
          initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="posts-page-title">{t('posts.title')}</h1>
          <p className="posts-page-description">{t('posts.description')}</p>
        </motion.header>

        {posts.length === 0 ? (
          <div className="no-posts">
            <p>{t('posts.noPostsFound')}</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} shouldAnimate={shouldAnimate} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <Link
              from="/posts"
              search={{ page: Math.max(1, page - 1) }}
              disabled={page === 1}
              className="pagination-button"
            >
              {t('posts.pagination.previous')}
            </Link>
            <span className="pagination-info">
              {t('posts.pagination.page', { current: page, total: totalPages })}
            </span>
            <Link
              from="/posts"
              search={{ page: Math.min(totalPages, page + 1) }}
              disabled={page === totalPages}
              className="pagination-button"
            >
              {t('posts.pagination.next')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
