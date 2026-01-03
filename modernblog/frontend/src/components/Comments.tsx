import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { createComment, deleteComment, isAdmin } from '../api/client';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmModal';
import type { Comment } from '../types';
import './Comments.css';

const STORAGE_KEY_NAME = 'comment_author_name';
const STORAGE_KEY_EMAIL = 'comment_author_email';

interface CommentsProps {
  postSlug: string;
  comments: Comment[];
  onCommentAdded: () => void;
  shouldAnimate?: boolean;
}

export default function Comments({
  postSlug,
  comments,
  onCommentAdded,
  shouldAnimate = true,
}: CommentsProps) {
  const { t } = useTranslation();
  return (
    <section className="comments-section">
      <h2 className="comments-title">
        {t('comments.titleWithCount', { count: countAllComments(comments) })}
      </h2>

      <CommentForm postSlug={postSlug} onCommentAdded={onCommentAdded} />

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="comments-empty">{t('comments.noComments')}</p>
        ) : (
          comments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              postSlug={postSlug}
              onCommentAdded={onCommentAdded}
              shouldAnimate={shouldAnimate}
            />
          ))
        )}
      </div>
    </section>
  );
}

function countAllComments(comments: Comment[]): number {
  return comments.reduce((count, comment) => {
    return count + 1 + countAllComments(comment.replies || []);
  }, 0);
}

interface CommentFormProps {
  postSlug: string;
  parentId?: number;
  onCommentAdded: () => void;
  onCancel?: () => void;
  isReply?: boolean;
}

function CommentForm({
  postSlug,
  parentId,
  onCommentAdded,
  onCancel,
  isReply = false,
}: CommentFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Anti-spam: track when the form was rendered
  const formTimestamp = useRef(Math.floor(Date.now() / 1000));

  // Load stored user data from localStorage on mount
  useEffect(() => {
    const storedName = localStorage.getItem(STORAGE_KEY_NAME);
    const storedEmail = localStorage.getItem(STORAGE_KEY_EMAIL);
    if (storedName) setName(storedName);
    if (storedEmail) setEmail(storedEmail);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      setError(t('comments.validationError'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newComment = await createComment(postSlug, {
        author_name: name.trim(),
        author_email: email.trim() || undefined,
        content: content.trim(),
        parent_id: parentId,
        // Anti-spam fields
        honeypot: honeypot,
        form_timestamp: formTimestamp.current,
      });

      // Save user data to localStorage for future comments
      localStorage.setItem(STORAGE_KEY_NAME, name.trim());
      if (email.trim()) {
        localStorage.setItem(STORAGE_KEY_EMAIL, email.trim());
      }

      setContent('');

      if (!newComment.is_approved) {
        showToast(t('comments.awaitingApproval'), 'info');
      } else {
        showToast(t('comments.commentAdded'), 'success');
        onCommentAdded();
      }

      if (onCancel) onCancel();
    } catch {
      setError(t('comments.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`comment-form ${isReply ? 'comment-form-reply' : ''}`}>
      {/* Anti-spam honeypot field - hidden from users, filled by bots */}
      <div className="comment-form-honeypot" aria-hidden="true">
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {!isReply && <h3 className="comment-form-title">{t('comments.leaveComment')}</h3>}

      <div className="comment-form-row">
        <div className="comment-form-field">
          <label htmlFor={`name-${parentId || 'root'}`}>{t('comments.name')} *</label>
          <input
            id={`name-${parentId || 'root'}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('comments.namePlaceholder')}
            required
          />
        </div>
        <div className="comment-form-field">
          <label htmlFor={`email-${parentId || 'root'}`}>{t('comments.email')}</label>
          <input
            id={`email-${parentId || 'root'}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('comments.emailPlaceholder')}
          />
        </div>
      </div>

      <div className="comment-form-field">
        <label htmlFor={`content-${parentId || 'root'}`}>{t('comments.comment')} *</label>
        <textarea
          id={`content-${parentId || 'root'}`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('comments.commentPlaceholder')}
          rows={isReply ? 3 : 4}
          required
        />
      </div>

      {error && <p className="comment-form-error">{error}</p>}

      <div className="comment-form-actions">
        {onCancel && (
          <button type="button" onClick={onCancel} className="comment-form-cancel">
            {t('comments.cancel')}
          </button>
        )}
        <button type="submit" disabled={isSubmitting} className="comment-form-submit">
          {isSubmitting
            ? t('comments.submitting')
            : isReply
              ? t('comments.reply')
              : t('comments.submit')}
        </button>
      </div>
    </form>
  );
}

interface CommentThreadProps {
  comment: Comment;
  postSlug: string;
  onCommentAdded: () => void;
  depth?: number;
  shouldAnimate?: boolean;
}

function CommentThread({
  comment,
  postSlug,
  onCommentAdded,
  depth = 0,
  shouldAnimate = true,
}: CommentThreadProps) {
  const { t } = useTranslation();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const maxDepth = 4;

  return (
    <motion.div
      className={`comment ${depth > 0 ? 'comment-reply' : ''}`}
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="comment-header">
        <div className="comment-avatar">{comment.author_name.charAt(0).toUpperCase()}</div>
        <div className="comment-meta">
          <span className="comment-author">{comment.author_name}</span>
          <span className="comment-date">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="comment-body">
        <p>{comment.content}</p>
      </div>

      {depth < maxDepth && (
        <div className="comment-actions">
          <button onClick={() => setShowReplyForm(!showReplyForm)} className="comment-reply-button">
            {showReplyForm ? t('comments.cancel') : t('comments.reply')}
          </button>
          {isAdmin() && (
            <button
              onClick={async () => {
                const confirmed = await confirm({
                  title: t('comments.confirmDeleteTitle'),
                  message: t('comments.confirmDelete'),
                  confirmText: t('comments.delete'),
                  variant: 'danger',
                });
                if (confirmed) {
                  try {
                    await deleteComment(comment.id);
                    onCommentAdded();
                  } catch {
                    showToast(t('comments.deleteError'), 'error');
                  }
                }
              }}
              className="comment-delete-button"
            >
              {t('comments.delete')}
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {showReplyForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CommentForm
              postSlug={postSlug}
              parentId={comment.id}
              onCommentAdded={onCommentAdded}
              onCancel={() => setShowReplyForm(false)}
              isReply
            />
          </motion.div>
        )}
      </AnimatePresence>

      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postSlug={postSlug}
              onCommentAdded={onCommentAdded}
              depth={depth + 1}
              shouldAnimate={shouldAnimate}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
