import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { subscribe } from '../api/client';
import { CloseIcon, SuccessIcon } from './Icons';
import './Modal.css';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscribeModal({ isOpen, onClose }: SubscribeModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const subscribeMutation = useMutation({
    mutationFn: subscribe,
    onSuccess: () => {
      setSuccess(true);
      setEmail('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    subscribeMutation.mutate(email.trim());
  };

  const handleClose = () => {
    setSuccess(false);
    setEmail('');
    subscribeMutation.reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <button
                className="modal-x-button"
                onClick={handleClose}
                aria-label={t('common.close')}
              >
                <CloseIcon />
              </button>
              <h2>{t('subscribe.title')}</h2>
              <p>{t('subscribe.description')}</p>
            </div>

            <div className="modal-content">
              {success ? (
                <>
                  <div className="modal-message success">
                    <SuccessIcon />
                    <span>{t('subscribe.success')}</span>
                  </div>
                  <button className="modal-close-button" onClick={handleClose}>
                    {t('subscribe.close')}
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmit} className="modal-form">
                  <input
                    type="email"
                    placeholder={t('subscribe.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="modal-input"
                    required
                    autoFocus
                  />

                  {subscribeMutation.error && (
                    <div className="modal-message error">
                      <span>
                        {(
                          subscribeMutation.error as unknown as {
                            response?: { data?: { detail?: string } };
                          }
                        )?.response?.data?.detail || t('subscribe.error')}
                      </span>
                    </div>
                  )}

                  <div className="modal-buttons">
                    <button
                      type="submit"
                      className="modal-button primary"
                      disabled={subscribeMutation.isPending}
                    >
                      {subscribeMutation.isPending
                        ? t('subscribe.subscribing')
                        : t('subscribe.button')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
