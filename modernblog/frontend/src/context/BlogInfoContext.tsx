import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import i18n from '../i18n/i18n';
import { getBlogInfo } from '../api/client';
import type { BlogInfo } from '../types';

interface BlogInfoContextType {
  blogInfo: BlogInfo | null;
  loading: boolean;
  error: Error | null;
  refreshBlogInfo: () => Promise<void>;
}

const BlogInfoContext = createContext<BlogInfoContextType | undefined>(undefined);

// Default fallback based on static config
const defaultBlogInfo: BlogInfo = {
  title: '',
  description: '',
  author_name: '',
  author_bio: '',
  github_sponsor_url: '',
  total_posts: 0,
  total_views: 0,
  subscription_enabled: false,
  comment_approval_required: false,
  language: 'en',
};

export function BlogInfoProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['blogInfo'],
    queryFn: getBlogInfo,
    retry: false,
  });

  const blogInfo = data || defaultBlogInfo;

  const refreshBlogInfo = async () => {
    await refetch();
  };

  // Initialize language from blog info
  useEffect(() => {
    if (blogInfo?.language) {
      i18n.changeLanguage(blogInfo.language);
    }
  }, [blogInfo?.language]);

  return (
    <BlogInfoContext.Provider
      value={{ blogInfo, loading: isLoading, error: error as Error | null, refreshBlogInfo }}
    >
      {children}
    </BlogInfoContext.Provider>
  );
}

export function useBlogInfo() {
  const context = useContext(BlogInfoContext);
  if (context === undefined) {
    throw new Error('useBlogInfo must be used within a BlogInfoProvider');
  }
  return context;
}
