import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getPost, createPost, updatePost, uploadImage, isAdmin, getImageUrl } from '../api/client';
import type { PostUpdate } from '../types';
import { useToast } from './Toast';
import MarkdownRenderer from './MarkdownRenderer';
import Spinner from './Spinner';
import SEO from './SEO';
import '../routes/admin/EditorPage.css';

interface PostEditorProps {
  slug?: string;
}

export default function PostEditor({ slug }: PostEditorProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEditing = !!slug;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [notifySubscribers, setNotifySubscribers] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Check auth
  useEffect(() => {
    if (!isAdmin()) {
      navigate({ to: '/admin', search: { page: 1 } });
    }
  }, [navigate]);

  // Load existing post
  const { data: post, isLoading: loadingPost } = useQuery({
    queryKey: ['post', slug],
    queryFn: () => getPost(slug!),
    enabled: isEditing && !!slug,
  });

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setExcerpt(post.excerpt || '');
      setContent(post.content);
      setCoverImage(post.cover_image || '');
      setTags(post.tags.map((t) => t.name).join(', '));
      setIsPublished(post.is_published);
      setIsFeatured(post.is_featured);
      document.getElementById('root')?.classList.add('ready');
    } else if (!isEditing) {
      document.getElementById('root')?.classList.add('ready');
    }
  }, [post, isEditing]);

  const createMutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => navigate({ to: '/admin', search: { page: 1 } }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: PostUpdate) => updatePost(slug!, data),
    onSuccess: () => navigate({ to: '/admin', search: { page: 1 } }),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadImage(file),
    onSuccess: (result) => {
      const imageUrl = getImageUrl(result.filename);
      const imageMarkdown = `![Image](${imageUrl})`;
      setContent((prev) => prev + '\n\n' + imageMarkdown);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: () => showToast(t('admin.editor.uploadError'), 'error'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast(t('admin.editor.validationError'), 'error');
      return;
    }

    const postData = {
      title: title.trim(),
      excerpt: excerpt.trim() || null,
      content: content.trim(),
      cover_image: coverImage.trim() || null,
      is_published: isPublished,
      is_featured: isFeatured,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      notify_subscribers: !isEditing && notifySubscribers,
    };

    if (isEditing) {
      updateMutation.mutate(postData);
    } else {
      createMutation.mutate(postData);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  const saving = createMutation.isPending || updateMutation.isPending;
  const uploading = uploadMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  if (loadingPost) {
    return (
      <div className="container">
        <Spinner loading={true} />
      </div>
    );
  }

  return (
    <div className="editor-page">
      <SEO
        title={isEditing ? t('admin.posts.edit') : t('admin.posts.new')}
        noindex={true}
      />
      <div className="container editor-container">
        <motion.header
          className="editor-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/admin" search={{ page: 1 }} className="back-link">
            {t('common.back')}
          </Link>{' '}
          <h1 className="editor-title">
            {isEditing ? t('admin.posts.edit') : t('admin.posts.new')}
          </h1>
        </motion.header>

        {error && <div className="editor-error">Failed to save post</div>}

        <div className="editor-layout">
          <form onSubmit={handleSubmit} className="editor-form">
            {/* Title */}
            <div className="form-field">
              <label htmlFor="title">{t('admin.editor.title')} *</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('admin.editor.titlePlaceholder')}
                required
              />
            </div>

            {/* Excerpt */}
            <div className="form-field">
              <label htmlFor="excerpt">{t('admin.editor.excerpt')}</label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder={t('admin.editor.excerptPlaceholder')}
                rows={2}
              />
            </div>

            {/* Content */}
            <div className="form-field content-field">
              <div className="content-header">
                <label htmlFor="content">{t('admin.editor.content')} *</label>
                <div className="content-actions">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="upload-button"
                    disabled={uploading}
                  >
                    {uploading ? t('admin.editor.uploading') : t('admin.editor.uploadImage')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="preview-toggle"
                  >
                    {showPreview ? t('common.edit') : t('admin.editor.preview')}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {showPreview ? (
                <div className="content-preview">
                  <MarkdownRenderer content={content} />
                </div>
              ) : (
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('admin.editor.contentPlaceholder')}
                  rows={20}
                  required
                />
              )}
            </div>

            {/* Markdown Cheatsheet */}
            <div className="markdown-help">
              <h4>Markdown Cheatsheet</h4>
              <div className="markdown-help-grid">
                <div className="markdown-help-section">
                  <h5>Headings</h5>
                  <ul>
                    <li>
                      Heading 1 → <code># text</code>
                    </li>
                    <li>
                      Heading 2 → <code>## text</code>
                    </li>
                    <li>
                      Heading 3 → <code>### text</code>
                    </li>
                  </ul>
                </div>
                <div className="markdown-help-section">
                  <h5>Text Formatting</h5>
                  <ul>
                    <li>
                      Bold → <code>**text**</code>
                    </li>
                    <li>
                      Italic → <code>*text*</code>
                    </li>
                    <li>
                      Strikethrough → <code>~~text~~</code>
                    </li>
                  </ul>
                </div>
                <div className="markdown-help-section">
                  <h5>Lists</h5>
                  <ul>
                    <li>
                      Bullet list → <code>- item</code>
                    </li>
                    <li>
                      Numbered list → <code>1. item</code>
                    </li>
                    <li>
                      Task list → <code>- [ ] task</code>
                    </li>
                  </ul>
                </div>
                <div className="markdown-help-section">
                  <h5>Links & Images</h5>
                  <ul>
                    <li>
                      Link → <code>[text](url)</code>
                    </li>
                    <li>
                      Image → <code>![alt](url)</code>
                    </li>
                  </ul>
                </div>
                <div className="markdown-help-section">
                  <h5>Code</h5>
                  <ul>
                    <li>
                      Inline code → <code>`code`</code>
                    </li>
                    <li>
                      Code block → <code>```lang</code>
                    </li>
                  </ul>
                </div>
                <div className="markdown-help-section">
                  <h5>Other</h5>
                  <ul>
                    <li>
                      Blockquote → <code>&gt; text</code>
                    </li>
                    <li>
                      Horizontal rule → <code>---</code>
                    </li>
                    <li>
                      Table → <code>| col | col |</code>
                    </li>
                  </ul>
                </div>
                <div className="markdown-help-section footnotes-section">
                  <h5>Footnotes</h5>
                  <ul>
                    <li>
                      Reference → <code>text[^1]</code>
                    </li>
                    <li>
                      Definition → <code>[^1]: note</code>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div className="form-field">
              <label htmlFor="cover">{t('admin.editor.coverImage')}</label>
              <input
                id="cover"
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder={t('admin.editor.coverImagePlaceholder')}
              />
            </div>

            {/* Tags */}
            <div className="form-field">
              <label htmlFor="tags">{t('admin.editor.tags')}</label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t('admin.editor.tagsPlaceholder')}
              />
            </div>

            {/* Options */}
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                <span>{t('admin.editor.isPublished')}</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <span>{t('admin.editor.isFeatured')}</span>
              </label>
              <label className="checkbox-label notify-checkbox">
                <input
                  type="checkbox"
                  checked={notifySubscribers}
                  disabled={isEditing || !isPublished}
                  onChange={(e) => setNotifySubscribers(e.target.checked)}
                />
                <span>{t('admin.editor.notifySubscribers')}</span>
              </label>
            </div>

            {/* Submit */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate({ to: '/admin', search: { page: 1 } })}
                className="cancel-button"
              >
                {t('common.cancel')}
              </button>
              <button type="submit" disabled={saving} className="save-button">
                {saving
                  ? t('admin.editor.saving')
                  : isEditing
                    ? t('admin.editor.save')
                    : t('admin.posts.new')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
