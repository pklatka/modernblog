import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBlogInfo } from '../context/BlogInfoContext';
import SubscribeModal from './SubscribeModal';
import './Footer.css';
import { Link } from '@tanstack/react-router';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const { blogInfo } = useBlogInfo();
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-content">
          <p className="footer-copyright footer-powered-by">
            {t('footer.copyright', { year: currentYear, author: blogInfo?.author_name || '...' })}
            <br />
            {t('footer.poweredBy')}{' '}
            <a href="https://modernblog.klatka.it" target="_blank" rel="noopener noreferrer">
              ModernBlog
            </a>
            .
          </p>
          <div className="footer-links">
            <Link to="/posts" className="footer-link" search={{ page: 1 }}>
              {t('header.posts')}
            </Link>
            {blogInfo?.subscription_enabled && (
              <button className="footer-link" onClick={() => setSubscribeOpen(true)}>
                {t('header.subscribe')}
              </button>
            )}
            {blogInfo?.github_sponsor_url && (
              <a
                href={blogInfo.github_sponsor_url}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                {t('header.sponsor')}
              </a>
            )}
          </div>
        </div>
      </div>
      <SubscribeModal isOpen={subscribeOpen} onClose={() => setSubscribeOpen(false)} />
    </footer>
  );
}
