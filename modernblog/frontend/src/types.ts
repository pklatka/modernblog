export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
}

export interface Comment {
  id: number;
  post_id: number;
  parent_id?: number;
  author_name: string;
  author_email?: string;
  content: string;
  is_approved: boolean;
  ip_address?: string;
  created_at: string;
  replies: Comment[];
}

export interface PostListItem {
  id: number;
  slug: string;
  title: string;
  excerpt?: string;
  cover_image?: string;
  reading_time: number;
  is_featured: boolean;
  views: number;
  created_at: string;
  published_at?: string;
  is_published: boolean;
  tags: Tag[];
}

export interface Post extends PostListItem {
  content: string;
  is_published: boolean;
  updated_at: string;
  comments: Comment[];
}

export interface BlogInfo {
  title: string;
  description: string;
  author_name: string;
  author_bio: string;
  github_sponsor_url: string;
  site_url: string;
  total_posts: number;
  total_views: number;
  subscription_enabled: boolean;
  comment_approval_required: boolean;
  language: string;
}

export interface PaginatedPosts {
  posts: PostListItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CommentCreate {
  author_name: string;
  author_email?: string;
  content: string;
  parent_id?: number;
  // Anti-spam fields
  honeypot?: string;
  form_timestamp?: number;
}

export interface PostCreate {
  title: string;
  excerpt?: string | null;
  content: string;
  cover_image?: string | null;
  is_published: boolean;
  is_featured: boolean;
  tags: string[];
}

export interface PostUpdate {
  title?: string;
  excerpt?: string | null;
  content?: string;
  cover_image?: string | null;
  is_published?: boolean;
  is_featured?: boolean;
  tags?: string[];
}
