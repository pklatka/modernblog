import axios from 'axios';
import { API_BASE_URL } from '../config';
import type {
  BlogInfo,
  Post,
  PostListItem,
  PaginatedPosts,
  Tag,
  Comment,
  CommentCreate,
  PostCreate,
  PostUpdate,
} from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add admin token to requests if available
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    config.headers['Authorization'] = `Bearer ${adminToken}`;
  }
  return config;
});

// Blog info
export const getBlogInfo = async (): Promise<BlogInfo> => {
  const response = await api.get('/api/info');
  return response.data;
};

// Posts
export const getPosts = async (
  page = 1,
  perPage = 10,
  tag?: string,
  featured?: boolean,
  includeDrafts = false
): Promise<PaginatedPosts> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());
  if (tag) params.append('tag', tag);
  if (featured !== undefined) params.append('featured', featured.toString());
  if (includeDrafts) params.append('include_drafts', 'true');

  const response = await api.get(`/api/posts?${params.toString()}`);
  return response.data;
};

export const getFeaturedPosts = async (limit = 3): Promise<PostListItem[]> => {
  const response = await api.get(`/api/posts/featured?limit=${limit}`);
  return response.data;
};

export const searchPosts = async (query: string): Promise<PostListItem[]> => {
  const response = await api.get(`/api/posts/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const getPost = async (slug: string): Promise<Post> => {
  const response = await api.get(`/api/posts/${slug}`);
  return response.data;
};

export const createPost = async (data: PostCreate): Promise<Post> => {
  const response = await api.post('/api/posts', data);
  return response.data;
};

export const updatePost = async (slug: string, data: PostUpdate): Promise<Post> => {
  const response = await api.put(`/api/posts/${slug}`, data);
  return response.data;
};

export const deletePost = async (slug: string): Promise<void> => {
  await api.delete(`/api/posts/${slug}`);
};

// Tags
export const getTags = async (): Promise<Tag[]> => {
  const response = await api.get('/api/tags');
  return response.data;
};

// Comments
export const createComment = async (postSlug: string, data: CommentCreate): Promise<Comment> => {
  const response = await api.post(`/api/comments/${postSlug}`, data);
  return response.data;
};

export const deleteComment = async (commentId: number): Promise<void> => {
  await api.delete(`/api/comments/${commentId}`);
};

export const approveComment = async (commentId: number): Promise<void> => {
  await api.put(`/api/comments/${commentId}/approve`);
};

export const rejectComment = async (commentId: number): Promise<void> => {
  await api.put(`/api/comments/${commentId}/reject`);
};

export const getAllComments = async (
  page = 1,
  perPage = 50,
  status?: 'approved' | 'pending' | 'all'
): Promise<Comment[]> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());
  if (status) params.append('status', status);

  const response = await api.get(`/api/comments?${params.toString()}`);
  return response.data;
};

// Images
export const uploadImage = async (
  file: File,
  altText?: string
): Promise<{ id: number; filename: string; filepath: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  if (altText) formData.append('alt_text', altText);

  const response = await api.post('/api/images/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getImageUrl = (filename: string): string => {
  return `${API_BASE_URL}/api/images/${filename}`;
};

// Auth helpers
export const login = async (token: string): Promise<boolean> => {
  try {
    const response = await api.post('/api/auth/login', { token });
    if (response.data.success && response.data.access_token) {
      setAdminToken(response.data.access_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const setAdminToken = (token: string): void => {
  localStorage.setItem('adminToken', token);
};

export const getAdminToken = (): string | null => {
  return localStorage.getItem('adminToken');
};

export const clearAdminToken = (): void => {
  localStorage.removeItem('adminToken');
};

export const isAdmin = (): boolean => {
  return !!getAdminToken();
};

// Subscriber types
export interface Subscriber {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface NewsletterSend {
  post_ids: number[];
  subject: string;
  custom_message?: string;
}

// Subscribers
export const subscribe = async (email: string): Promise<Subscriber> => {
  const response = await api.post('/api/subscribers', { email });
  return response.data;
};

export const getSubscribers = async (): Promise<Subscriber[]> => {
  const response = await api.get('/api/subscribers');
  return response.data;
};

export const sendNewsletter = async (
  data: NewsletterSend
): Promise<{ message: string; sent_count: number }> => {
  const response = await api.post('/api/subscribers/send-newsletter', data);
  return response.data;
};
