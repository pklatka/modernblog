import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useEntranceAnimation } from '../hooks/useEntranceAnimation';
import { getPosts, getFeaturedPosts, getTags, getBlogInfo } from '../api/client';
import PostCard from '../components/PostCard';
import Spinner from '../components/Spinner';
import './index.css';
import { HeartIcon } from '../components/Icons';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { t } = useTranslation();
  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['posts', 'recent'],
    queryFn: () => getPosts(1, 1),
  });

  const { data: featuredPosts, isLoading: featuredLoading } = useQuery({
    queryKey: ['posts', 'featured'],
    queryFn: () => getFeaturedPosts(10),
  });

  const { data: tags, isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: getTags,
  });

  const { data: blogInfo, isLoading: infoLoading } = useQuery({
    queryKey: ['blogInfo'],
    queryFn: getBlogInfo,
  });

  const loading = recentLoading || featuredLoading || tagsLoading || infoLoading;
  const { shouldAnimate } = useEntranceAnimation();
  const recentPost = recentData?.posts[0] || null;

  useEffect(() => {
    if (!loading) {
      document.getElementById('root')?.classList.add('ready');
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="container">
        <Spinner loading={loading} />
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <motion.div
            className="hero-content"
            initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="hero-title">{blogInfo?.title || t('home.heroTitle')}</h1>
            <p className="hero-description">{blogInfo?.description || t('home.heroDescription')}</p>
            <div className="hero-stats">
              <span className="hero-stat">
                <strong>{blogInfo?.total_posts || 0}</strong> {t('home.posts')}
              </span>
              <span className="hero-stat-separator">·</span>
              <span className="hero-stat">
                <strong>{blogInfo?.total_views.toLocaleString() || 0}</strong> {t('home.views')}
              </span>
            </div>
            {blogInfo?.github_sponsor_url && (
              <a
                href={blogInfo.github_sponsor_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-sponsor"
              >
                <HeartIcon />
                {t('home.supportMyWork')}
              </a>
            )}
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container home-content">
        <div className="posts-section">
          <h2 className="section-title">{t('home.latestPosts')}</h2>

          <div className="posts-list">
            {recentPost && <PostCard post={recentPost} index={0} shouldAnimate={shouldAnimate} />}
            {featuredPosts
              ?.filter((post) => post.id !== recentPost?.id) // Avoid duplicate if recent is also featured
              .map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={index + 1}
                  shouldAnimate={shouldAnimate}
                />
              ))}
            {(!recentPost || !featuredPosts || featuredPosts.length === 0) && (
              <p className="no-posts">{t('posts.noPostsFound')}</p>
            )}
          </div>

          {/* View All Posts Link */}
          <div className="view-all-posts">
            <Link to="/posts" search={{ page: 1 }} className="view-all-link">
              {t('home.viewAllPosts')}
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          {/* About */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">{t('home.about')}</h3>
            <p className="sidebar-text">{blogInfo?.author_bio || t('home.welcomeMessage')}</p>
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="sidebar-section">
              <h3 className="sidebar-title">{t('home.topics')}</h3>
              <div className="tags-list">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to="/tag/$slug"
                    params={{ slug: tag.slug }}
                    search={{ page: 1 }}
                    className="tag-link"
                    style={{ '--tag-color': tag.color } as React.CSSProperties}
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Sponsor Card */}
          {blogInfo?.github_sponsor_url && (
            <div className="sidebar-section sponsor-card">
              <h3 className="sidebar-title">{t('home.supportSection')}</h3>
              <p className="sidebar-text">{t('home.supportDescription')}</p>
              <a
                href={blogInfo.github_sponsor_url}
                target="_blank"
                rel="noopener noreferrer"
                className="sponsor-button-large"
              >
                <HeartIcon />
                {t('home.becomeASponsor')}
              </a>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
