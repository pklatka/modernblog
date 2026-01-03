import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { isAdmin } from '../api/client';
import { useBlogInfo } from '../context/BlogInfoContext';
import { CloseIcon, HeartIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon } from './Icons';
import SubscribeModal from './SubscribeModal';
import './Header.css';

export default function Header() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { blogInfo } = useBlogInfo();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: '/search', search: { q: searchQuery.trim() } });
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <header className="header">
      <div className="container header-container">
        <Link to="/" className="logo">
          <span className="logo-text">{blogInfo?.author_name || t('common.loading')}</span>
        </Link>

        <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
          <Link
            to="/posts"
            search={{ page: 1 }}
            className="nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('header.posts')}
          </Link>
          {blogInfo?.subscription_enabled && (
            <button
              className="nav-link"
              onClick={() => {
                setSubscribeOpen(true);
                setMobileMenuOpen(false);
              }}
            >
              {t('header.subscribe')}
            </button>
          )}
          {blogInfo?.github_sponsor_url ? (
            <a
              href={blogInfo.github_sponsor_url}
              target="_blank"
              rel="noopener noreferrer"
              className="sponsor-button"
              onClick={() => setMobileMenuOpen(false)}
            >
              <HeartIcon />
              <span>{t('header.sponsor')}</span>
            </a>
          ) : null}
          {isAdmin() && (
            <Link
              to="/admin"
              search={{ page: 1 }}
              className="nav-link admin-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('header.admin')}
            </Link>
          )}
        </nav>

        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label={t('header.toggleSearch')}
          >
            <SearchIcon />
          </button>

          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label={t('header.toggleTheme', { mode: theme === 'light' ? 'dark' : 'light' })}
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>

          <button
            className="mobile-menu-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={t('header.toggleMenu')}
          >
            {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            className="search-bar"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleSearch} className="container">
              <input
                type="text"
                placeholder={t('header.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="search-input"
              />
              <button type="submit" className="search-submit">
                {t('header.search')}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <SubscribeModal isOpen={subscribeOpen} onClose={() => setSubscribeOpen(false)} />
    </header>
  );
}
