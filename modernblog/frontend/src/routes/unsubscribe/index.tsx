import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../../config';
import './UnsubscribePage.css';
import { QuestionIcon, CheckIcon, LoadingIcon, ErrorIcon } from '../../components/Icons';

export const Route = createFileRoute('/unsubscribe/')({
  validateSearch: (search: Record<string, unknown>): { token: string } => {
    return {
      token: (search?.token as string) || '',
    };
  },
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { t } = useTranslation();
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<'loading' | 'confirm' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    document.getElementById('root')?.classList.add('ready');

    if (!token) {
      setStatus('error');
      setMessage(t('unsubscribe.invalidLink'));
      return;
    }

    // Don't auto-unsubscribe, wait for confirmation
    setStatus('confirm');
  }, [token, t]);

  const handleConfirm = async () => {
    setStatus('loading');
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscribers/unsubscribe/${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setEmail(data.email || '');
        setMessage(data.message || t('unsubscribe.success'));
      } else {
        setStatus('error');
        setMessage(data.detail || t('unsubscribe.error'));
      }
    } catch {
      setStatus('error');
      setMessage(t('unsubscribe.genericError'));
    }
  };

  return (
    <div className="unsubscribe-page">
      <div className="container">
        <motion.div
          className="unsubscribe-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={`unsubscribe-icon ${status}`}>
            {status === 'loading' && <LoadingIcon />}
            {status === 'confirm' && <QuestionIcon />}
            {status === 'success' && <CheckIcon />}
            {status === 'error' && <ErrorIcon size={32} />}
          </div>

          <h1 className="unsubscribe-title">
            {status === 'loading' && t('unsubscribe.processing')}
            {status === 'confirm' && t('unsubscribe.confirmQuestion')}
            {status === 'success' && t('unsubscribe.title')}
            {status === 'error' && 'Error'}
          </h1>

          <p className="unsubscribe-message">
            {status === 'confirm' ? (
              <div className="unsubscribe-actions">
                <button onClick={handleConfirm} className="unsubscribe-button confirm">
                  {t('unsubscribe.confirmButton')}
                </button>
                <Link to="/" className="unsubscribe-button cancel">
                  {t('unsubscribe.cancelButton')}
                </Link>
              </div>
            ) : (
              <>
                {message}
                {email && status === 'success' && (
                  <>
                    <br />
                    <strong>{email}</strong>
                  </>
                )}
              </>
            )}
          </p>

          {status !== 'confirm' && (
            <Link to="/" className="unsubscribe-home-link">
              {t('unsubscribe.backToHome')}
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
}
