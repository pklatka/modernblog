import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { getPosts } from '../../api/client';
import PostCard from '../../components/PostCard';
import Spinner from '../../components/Spinner';
import SEO from '../../components/SEO';
import './TagPage.css';

export const Route = createFileRoute('/tag/$slug')({
  validateSearch: (search: Record<string, unknown>): { page: number } => {
    return {
      page: Number(search?.page ?? 1) || 1,
    };
  },
  component: TagPage,
});

function TagPage() {
  const { t } = useTranslation();
  const { slug } = Route.useParams();
  const { page } = Route.useSearch();

  const { data, isLoading } = useQuery({
    queryKey: ['posts', 'tag', slug, page],
    queryFn: () => getPosts(page, 10, slug),
  });

  useEffect(() => {
    if (!isLoading) {
      document.getElementById('root')?.classList.add('ready');
    }
  }, [isLoading]);

  const posts = data?.posts || [];
  const totalPages = data?.total_pages || 1;

  if (isLoading) {
    return (
      <div className="container">
        <Spinner loading={isLoading} />
      </div>
    );
  }

  return (
    <div className="tag-page">
      <SEO
        title={`${t('tag.postsTagged')} ${slug}`}
        description={t('tag.description', { tag: slug, count: posts.length })}
        type="website"
        url={`/tag/${slug}${page > 1 ? `?page=${page}` : ''}`}
        canonical={`/tag/${slug}`}
      />
      <div className="container">
        <motion.header
          className="tag-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="back-link">
            {t('post.backToPosts')}
          </Link>
          <h1 className="tag-title">
            {t('tag.postsTagged')} <span className="tag-name">{slug}</span>
          </h1>
          <p className="tag-count">{t('tag.count', { count: posts.length })}</p>
        </motion.header>

        {posts.length === 0 ? (
          <div className="no-posts">
            <p>{t('tag.noPosts')}</p>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <Link
              from="/tag/$slug"
              params={{ slug }}
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
              from="/tag/$slug"
              params={{ slug }}
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
