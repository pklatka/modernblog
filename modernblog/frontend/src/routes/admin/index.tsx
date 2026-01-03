import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useEntranceAnimation } from '../../hooks/useEntranceAnimation';
import {
  getPosts,
  deletePost,
  login,
  clearAdminToken,
  isAdmin,
  getSubscribers,
  sendNewsletter,
  getAllComments,
  approveComment,
  rejectComment,
  deleteComment as apiDeleteComment,
} from '../../api/client';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmModal';
import Spinner from '../../components/Spinner';
import './AdminPage.css';

export const Route = createFileRoute('/admin/')({
  validateSearch: (search: Record<string, unknown>): { page: number } => {
    return {
      page: Number(search?.page ?? 1) || 1,
    };
  },
  component: AdminPage,
});

function AdminPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { shouldAnimate } = useEntranceAnimation();
  const { page } = Route.useSearch();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [authenticated, setAuthenticated] = useState(isAdmin());
  const [token, setToken] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'subscribers' | 'comments'>('posts');
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterPage, setNewsletterPage] = useState(1);

  // Comments state
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentStatus, setCommentStatus] = useState<'all' | 'pending' | 'approved'>('all');

  const perPage = 5;

  // Fetch posts if authenticated
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'posts', page],
    queryFn: () => getPosts(page, perPage, undefined, undefined, true),
    enabled: authenticated,
    placeholderData: (prev) => prev,
  });

  // Ready effect
  useEffect(() => {
    if (!authenticated || (!isLoading && data)) {
      document.getElementById('root')?.classList.add('ready');
    }
  }, [authenticated, isLoading, data]);

  const posts = data?.posts || [];
  const totalPages = data?.total_pages || 1;

  // Fetch posts for newsletter selection (separate pagination)
  const newsletterPostsPerPage = 5;
  const { data: newsletterPostsData, isLoading: loadingNewsletterPosts } = useQuery({
    queryKey: ['admin', 'newsletter-posts', newsletterPage],
    queryFn: () => getPosts(newsletterPage, newsletterPostsPerPage, undefined, undefined, false),
    enabled: authenticated && activeTab === 'subscribers',
    placeholderData: (prev) => prev,
  });
  const newsletterPosts = newsletterPostsData?.posts || [];
  const newsletterTotalPages = newsletterPostsData?.total_pages || 1;

  // Fetch subscribers
  const { data: subscribers = [], isLoading: loadingSubscribers } = useQuery({
    queryKey: ['admin', 'subscribers'],
    queryFn: getSubscribers,
    enabled: authenticated,
  });

  // Fetch comments
  const commentsPerPage = 10;
  const { data: commentsData, isLoading: loadingComments } = useQuery({
    queryKey: ['admin', 'comments', commentsPage, commentStatus],
    queryFn: () => getAllComments(commentsPage, commentsPerPage, commentStatus),
    enabled: authenticated,
  });
  // Lets assume there's a next page if full page is returned.
  const comments = Array.isArray(commentsData) ? commentsData : [];
  const commentsTotalPages = comments.length === commentsPerPage ? commentsPage + 1 : commentsPage; // Simple estimation

  // Newsletter mutation
  const newsletterMutation = useMutation({
    mutationFn: sendNewsletter,
    onSuccess: (result) => {
      showToast(t('admin.subscribers.newsletterSent', { count: result.sent_count }), 'success');
      setSelectedPosts([]);
      setNewsletterSubject('');
      setNewsletterMessage('');
    },
    onError: () => {
      showToast(t('admin.subscribers.newsletterError'), 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => deletePost(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
    },
    onError: () => {
      showToast(t('admin.posts.deleteError'), 'error');
    },
  });

  // Comment mutations
  const approveCommentMutation = useMutation({
    mutationFn: approveComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
      showToast(t('admin.comments.approvedSuccess'), 'success');
    },
  });

  const rejectCommentMutation = useMutation({
    mutationFn: rejectComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
      showToast(t('admin.comments.rejectedSuccess'), 'success');
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: apiDeleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
      showToast(t('admin.comments.deletedSuccess'), 'success');
    },
  });

  const handleApproveComment = (id: number) => {
    approveCommentMutation.mutate(id);
  };

  const handleRejectComment = (id: number) => {
    rejectCommentMutation.mutate(id);
  };

  const handleDeleteComment = async (id: number) => {
    const confirmed = await confirm({
      title: t('admin.comments.confirmDeleteTitle'),
      message: t('admin.comments.confirmDeleteMessage'),
      confirmText: t('admin.comments.delete'),
      variant: 'danger',
    });
    if (confirmed) {
      deleteCommentMutation.mutate(id);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoginError(null);

    const success = await login(token.trim());
    if (success) {
      setAuthenticated(true);
      setToken('');
    } else {
      setLoginError('Invalid admin token');
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    setAuthenticated(false);
    queryClient.removeQueries({ queryKey: ['admin', 'posts'] });
  };

  const handleDelete = async (slug: string, title: string) => {
    const confirmed = await confirm({
      title: t('admin.posts.confirmDeleteTitle'),
      message: t('admin.posts.confirmDeleteMessage', { title }),
      confirmText: t('admin.posts.delete'),
      variant: 'danger',
    });
    if (!confirmed) return;
    deleteMutation.mutate(slug);
  };

  if (!authenticated) {
    return (
      <div className="admin-page">
        <div className="container admin-container">
          <motion.div
            className="login-card"
            initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="login-title">{t('admin.login.title')}</h1>
            <p className="login-description">{t('admin.login.description')}</p>

            {loginError && <div className="admin-error">{loginError}</div>}
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-field">
                <label htmlFor="token">{t('admin.login.tokenLabel')}</label>
                <input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder={t('admin.login.tokenPlaceholder')}
                  autoFocus
                />
              </div>
              <button type="submit" className="login-button">
                {t('admin.login.button')}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container admin-container">
        <motion.header
          className="admin-header"
          initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="admin-header-content">
            <h1 className="admin-title">{t('admin.dashboardTitle')}</h1>
            <p className="admin-subtitle">{t('admin.dashboardSubtitle')}</p>
          </div>
          <div className="admin-actions">
            <Link to="/admin/new" className="new-post-button">
              <PlusIcon />
              {t('admin.posts.new')}
            </Link>
            <button onClick={handleLogout} className="logout-button">
              {t('admin.logout')}
            </button>
          </div>
        </motion.header>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            {t('admin.tabs.posts')}
          </button>
          <button
            className={`admin-tab ${activeTab === 'subscribers' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscribers')}
          >
            {t('admin.tabs.subscribers')} ({subscribers.length})
          </button>
          <button
            className={`admin-tab ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            {t('admin.tabs.comments')} ({comments.filter((comment) => !comment.is_approved).length})
          </button>
        </div>

        {activeTab === 'posts' && (
          <>
            {error && <div className="admin-error">Failed to fetch posts</div>}

            {isLoading ? (
              <Spinner loading={isLoading} />
            ) : (
              <div className="posts-table-wrapper">
                <table className="posts-table">
                  <thead>
                    <tr>
                      <th>{t('admin.table.title')}</th>
                      <th>{t('admin.table.status')}</th>
                      <th>{t('admin.table.views')}</th>
                      <th>{t('admin.table.date')}</th>
                      <th>{t('admin.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="no-posts-cell">
                          {t('admin.posts.noPosts')}
                        </td>
                      </tr>
                    ) : (
                      posts.map((post, index) => (
                        <motion.tr
                          key={post.id}
                          initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <td className="post-title-cell">
                            <div className="post-title-cell-inner">
                              <Link
                                to="/post/$slug"
                                params={{ slug: post.slug }}
                                className="post-title-link"
                              >
                                {post.title}
                              </Link>
                              {post.is_featured && <span className="featured-badge">Featured</span>}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`status-badge ${post.is_published ? 'published' : ''}`}
                            >
                              {post.is_published
                                ? t('admin.posts.published')
                                : t('admin.posts.draft')}
                            </span>
                          </td>
                          <td>{post.views.toLocaleString()}</td>
                          <td>
                            {format(new Date(post.published_at || post.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="actions-cell">
                            <Link
                              to="/admin/edit/$slug"
                              params={{ slug: post.slug }}
                              className="action-button edit"
                            >
                              {t('admin.posts.edit')}
                            </Link>
                            <button
                              onClick={() => handleDelete(post.slug, post.title)}
                              className="action-button delete"
                            >
                              {t('admin.posts.delete')}
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="admin-pagination">
                    <Link
                      from="/admin"
                      search={{ page: Math.max(1, page - 1) }}
                      disabled={page === 1}
                      className="pagination-button"
                    >
                      ← Previous
                    </Link>
                    <span className="pagination-info">
                      Page {page} of {totalPages}
                    </span>
                    <Link
                      from="/admin"
                      search={{ page: Math.min(totalPages, page + 1) }}
                      disabled={page === totalPages}
                      className="pagination-button"
                    >
                      Next →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'subscribers' && (
          <div className="subscribers-tab">
            {loadingSubscribers ? (
              <Spinner loading={true} />
            ) : (
              <>
                <div className="newsletter-section">
                  <h2 className="section-title">{t('admin.subscribers.sendNewsletter')}</h2>
                  <p className="section-description">
                    {t('admin.subscribers.selectPostsDescription', { count: subscribers.length })}
                  </p>

                  <div className="newsletter-form">
                    <div className="form-field">
                      <label htmlFor="subject">{t('admin.subscribers.subject')} *</label>
                      <input
                        id="subject"
                        type="text"
                        value={newsletterSubject}
                        onChange={(e) => setNewsletterSubject(e.target.value)}
                        placeholder={t('admin.subscribers.subjectPlaceholder')}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="message">{t('admin.subscribers.customMessage')}</label>
                      <textarea
                        id="message"
                        value={newsletterMessage}
                        onChange={(e) => setNewsletterMessage(e.target.value)}
                        placeholder={t('admin.subscribers.customMessagePlaceholder')}
                        rows={3}
                      />
                    </div>

                    <div className="post-selection">
                      <label>{t('admin.subscribers.selectPosts')}</label>
                      {loadingNewsletterPosts ? (
                        <Spinner loading={true} />
                      ) : (
                        <>
                          <div className="post-checkboxes">
                            {newsletterPosts.map((post) => (
                              <label key={post.id} className="post-checkbox-label">
                                <input
                                  type="checkbox"
                                  checked={selectedPosts.includes(post.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPosts([...selectedPosts, post.id]);
                                    } else {
                                      setSelectedPosts(
                                        selectedPosts.filter((id) => id !== post.id)
                                      );
                                    }
                                  }}
                                />
                                <span>{post.title}</span>
                              </label>
                            ))}
                            {newsletterTotalPages > 1 && (
                              <div className="admin-pagination">
                                <button
                                  onClick={() => setNewsletterPage((p) => Math.max(1, p - 1))}
                                  disabled={newsletterPage === 1}
                                  className="pagination-button"
                                >
                                  ← Previous
                                </button>
                                <span className="pagination-info">
                                  Page {newsletterPage} of {newsletterTotalPages}
                                </span>
                                <button
                                  onClick={() =>
                                    setNewsletterPage((p) => Math.min(newsletterTotalPages, p + 1))
                                  }
                                  disabled={newsletterPage === newsletterTotalPages}
                                  className="pagination-button"
                                >
                                  Next →
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      className="send-newsletter-button"
                      disabled={
                        selectedPosts.length === 0 ||
                        !newsletterSubject.trim() ||
                        newsletterMutation.isPending
                      }
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: t('admin.subscribers.confirmSendTitle'),
                          message: t('admin.subscribers.confirmSendMessage', {
                            count: subscribers.length,
                          }),
                          confirmText: t('admin.subscribers.send'),
                        });
                        if (confirmed) {
                          newsletterMutation.mutate({
                            post_ids: selectedPosts,
                            subject: newsletterSubject,
                            custom_message: newsletterMessage || undefined,
                          });
                        }
                      }}
                    >
                      {newsletterMutation.isPending
                        ? 'Sending...'
                        : `Send to ${subscribers.length} Subscribers`}
                    </button>
                  </div>
                </div>

                <div className="subscribers-list-section">
                  <h2 className="section-title">{t('admin.subscribers.activeSubscribers')}</h2>
                  <div className="subscribers-list">
                    {subscribers.length === 0 ? (
                      <p className="no-subscribers">{t('admin.subscribers.noSubscribers')}</p>
                    ) : (
                      <ul>
                        {subscribers.map((sub) => (
                          <li key={sub.id}>
                            <span className="subscriber-email">{sub.email}</span>
                            <span className="subscriber-date">
                              Subscribed {format(new Date(sub.created_at), 'MMM d, yyyy')}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="comments-tab">
            {loadingComments ? (
              <Spinner loading={true} />
            ) : (
              <div className="comments-table-wrapper">
                <div className="comments-filters">
                  <select
                    value={commentStatus}
                    onChange={(e) =>
                      setCommentStatus(e.target.value as 'all' | 'pending' | 'approved')
                    }
                    className="status-filter"
                  >
                    <option value="all">{t('admin.comments.filterAll')}</option>
                    <option value="pending">{t('admin.comments.filterPending')}</option>
                    <option value="approved">{t('admin.comments.filterApproved')}</option>
                  </select>
                </div>

                <table className="posts-table comments-table">
                  <thead>
                    <tr>
                      <th>{t('admin.comments.author')}</th>
                      <th>{t('admin.comments.content')}</th>
                      <th>{t('admin.comments.date')}</th>
                      <th>{t('admin.comments.status')}</th>
                      <th>{t('admin.comments.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="no-posts-cell">
                          {t('admin.comments.noComments')}
                        </td>
                      </tr>
                    ) : (
                      comments.map((comment, index) => (
                        <motion.tr
                          key={comment.id}
                          initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <td className="comment-author-cell">
                            <div className="comment-author-info">
                              <span className="comment-author-name">{comment.author_name}</span>
                              <span className="comment-author-email">{comment.author_email}</span>
                              <span className="comment-ip">
                                {t('admin.comments.ip')}: {comment.ip_address || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td className="comment-content-cell">
                            <div className="comment-content-wrapper">{comment.content}</div>
                          </td>
                          <td>{format(new Date(comment.created_at), 'MMM d, HH:mm')}</td>
                          <td>
                            <span
                              className={`status-badge ${comment.is_approved ? 'published' : 'draft'}`}
                            >
                              {comment.is_approved
                                ? t('admin.comments.approved')
                                : t('admin.comments.pending')}
                            </span>
                          </td>
                          <td className="actions-cell">
                            {!comment.is_approved && (
                              <button
                                onClick={() => handleApproveComment(comment.id)}
                                className="action-button approve"
                                title={t('admin.comments.approve')}
                              >
                                ✓
                              </button>
                            )}
                            {comment.is_approved && (
                              <button
                                onClick={() => handleRejectComment(comment.id)}
                                className="action-button reject"
                                title={t('admin.comments.reject')}
                              >
                                ✗
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="action-button delete"
                              title={t('admin.comments.delete')}
                            >
                              🗑
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
                {/* Pagination */}
                {commentsTotalPages > 1 && (
                  <div className="admin-pagination">
                    <button
                      onClick={() => setCommentsPage((p) => Math.max(1, p - 1))}
                      disabled={commentsPage === 1}
                      className="pagination-button"
                    >
                      ← Previous
                    </button>
                    <span className="pagination-info">
                      Page {commentsPage} of {commentsTotalPages}
                    </span>
                    <button
                      onClick={() => setCommentsPage((p) => Math.min(commentsTotalPages, p + 1))}
                      disabled={commentsPage === commentsTotalPages}
                      className="pagination-button"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
