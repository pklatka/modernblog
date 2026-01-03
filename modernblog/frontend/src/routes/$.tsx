import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import './$.css';

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
});

function NotFoundPage() {
  useEffect(() => {
    document.getElementById('root')?.classList.add('ready');
  }, []);

  return (
    <div className="not-found-page">
      <div className="container">
        <motion.div
          className="not-found-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="not-found-code">404</div>
          <h1 className="not-found-title">Page Not Found</h1>
          <p className="not-found-description">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link to="/" className="not-found-link">
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
