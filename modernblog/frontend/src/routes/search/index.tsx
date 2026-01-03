import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { searchPosts } from '../../api/client';
import PostCard from '../../components/PostCard';
import Spinner from '../../components/Spinner';
import './SearchPage.css';

export const Route = createFileRoute('/search/')({
  validateSearch: (search: Record<string, unknown>): { q?: string } => {
    return {
      q: (search.q as string) || undefined,
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const { t } = useTranslation();
  const { q: query } = Route.useSearch();

  const {
    data: posts = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchPosts(query!),
    enabled: !!query?.trim(),
  });

  useEffect(() => {
    if (error) {
      console.error('Search failed:', error);
    }
  }, [error]);

  useEffect(() => {
    if (!loading) {
      document.getElementById('root')?.classList.add('ready');
    }
  }, [loading]);

  useEffect(() => {
    if (query) {
      document.title = `Search: ${query} | Blog`;
    }
  }, [query]);

  if (loading) {
    return (
      <div className="container">
        <Spinner loading={loading} />
      </div>
    );
  }

  return (
    <div className="search-page">
      <div className="container">
        <motion.header
          className="search-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="back-link">
            {t('post.backToPosts')}
          </Link>
          <h1 className="search-title">
            {query ? <>{t('search.resultsFor', { query })}</> : t('search.title')}
          </h1>
          {query && <p className="search-count">{t('search.count', { count: posts.length })}</p>}
        </motion.header>

        {!query ? (
          <div className="no-query">
            <p>{t('search.noQuery')}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="no-results">
            <p>{t('search.noResults', { query })}</p>
            <p className="no-results-hint">{t('search.noResultsHint')}</p>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
