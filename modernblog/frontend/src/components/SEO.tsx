import { useEffect, useMemo } from 'react';
import { useBlogInfo } from '../context/BlogInfoContext';

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
  noindex?: boolean;
  canonical?: string;
  // For article structured data
  articleBody?: string;
  wordCount?: number;
  readingTime?: number;
}

interface JsonLdBase {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

/**
 * SEO Component for managing meta tags and structured data
 * Handles Open Graph, Twitter Cards, and JSON-LD structured data
 */
export default function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  tags = [],
  noindex = false,
  canonical,
  articleBody,
  wordCount,
  readingTime,
}: SEOProps) {
  const { blogInfo } = useBlogInfo();

  // Compute the full title
  const fullTitle = useMemo(() => {
    if (!title) return blogInfo?.title || 'Blog';
    return `${title} | ${blogInfo?.title || 'Blog'}`;
  }, [title, blogInfo?.title]);

  // Compute the meta description
  const metaDescription = useMemo(() => {
    return description || blogInfo?.description || '';
  }, [description, blogInfo?.description]);

  // Get the site URL from blog info or current window
  const siteUrl = useMemo(() => {
    if (blogInfo?.site_url) return blogInfo?.site_url.replace(/\/$/, '');
    if (typeof window === 'undefined') return '';
    return window.location.origin;
  }, [blogInfo?.site_url]);

  // Compute the page URL
  const pageUrl = useMemo(() => {
    if (canonical) return canonical;
    if (url) return url.startsWith('http') ? url : `${siteUrl}${url}`;
    if (typeof window === 'undefined') return siteUrl;
    return window.location.href.split('?')[0]; // Remove query params for canonical
  }, [url, canonical, siteUrl]);

  // Compute the OG image URL
  const ogImage = useMemo(() => {
    if (!image) return null;
    return image.startsWith('http') ? image : `${siteUrl}${image}`;
  }, [image, siteUrl]);

  // Generate JSON-LD structured data
  const jsonLd = useMemo(() => {
    const schemas: JsonLdBase[] = [];

    // Website schema (always present)
    const websiteSchema: JsonLdBase = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: blogInfo?.title || 'Blog',
      description: blogInfo?.description || '',
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${siteUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };
    schemas.push(websiteSchema);

    // Author/Person schema
    if (blogInfo?.author_name) {
      const personSchema: JsonLdBase = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: blogInfo.author_name,
        description: blogInfo.author_bio || undefined,
        url: siteUrl,
      };
      schemas.push(personSchema);
    }

    // Article schema (for blog posts)
    if (type === 'article' && title) {
      const articleSchema: JsonLdBase = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: metaDescription,
        url: pageUrl,
        datePublished: publishedTime,
        dateModified: modifiedTime || publishedTime,
        author: {
          '@type': 'Person',
          name: author || blogInfo?.author_name || 'Anonymous',
        },
        publisher: {
          '@type': 'Organization',
          name: blogInfo?.title || 'Blog',
          url: siteUrl,
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': pageUrl,
        },
        inLanguage: blogInfo?.language || 'en',
      };

      // Add optional article properties
      if (ogImage) {
        articleSchema.image = {
          '@type': 'ImageObject',
          url: ogImage,
        };
      }

      if (tags.length > 0) {
        articleSchema.keywords = tags.join(', ');
      }

      if (articleBody) {
        articleSchema.articleBody = articleBody.substring(0, 5000); // Limit for performance
      }

      if (wordCount) {
        articleSchema.wordCount = wordCount;
      }

      if (readingTime) {
        articleSchema.timeRequired = `PT${readingTime}M`;
      }

      schemas.push(articleSchema);
    }

    // BreadcrumbList schema for articles
    if (type === 'article' && title) {
      const breadcrumbSchema: JsonLdBase = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Posts',
            item: `${siteUrl}/posts`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: title,
            item: pageUrl,
          },
        ],
      };
      schemas.push(breadcrumbSchema);
    }

    return schemas;
  }, [
    blogInfo,
    siteUrl,
    type,
    title,
    metaDescription,
    pageUrl,
    publishedTime,
    modifiedTime,
    author,
    ogImage,
    tags,
    articleBody,
    wordCount,
    readingTime,
  ]);

  // Update document meta tags
  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Helper to set or remove meta tag
    const setMetaTag = (name: string, content: string | null, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

      if (content) {
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(attribute, name);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      } else if (element) {
        element.remove();
      }
    };

    // Helper to set or remove link tag
    const setLinkTag = (rel: string, href: string | null) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

      if (href) {
        if (!element) {
          element = document.createElement('link');
          element.setAttribute('rel', rel);
          document.head.appendChild(element);
        }
        element.setAttribute('href', href);
      } else if (element) {
        element.remove();
      }
    };

    // Basic meta tags
    setMetaTag('description', metaDescription);
    setMetaTag('author', author || blogInfo?.author_name || null);
    setMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph tags
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', metaDescription, true);
    setMetaTag('og:type', type === 'article' ? 'article' : 'website', true);
    setMetaTag('og:url', pageUrl, true);
    setMetaTag('og:site_name', blogInfo?.title || 'Blog', true);
    setMetaTag('og:locale', blogInfo?.language === 'pl' ? 'pl_PL' : 'en_US', true);
    setMetaTag('og:image', ogImage, true);

    // Article-specific OG tags
    if (type === 'article') {
      setMetaTag('article:published_time', publishedTime || null, true);
      setMetaTag('article:modified_time', modifiedTime || publishedTime || null, true);
      setMetaTag('article:author', author || blogInfo?.author_name || null, true);
      tags.forEach((tag, index) => {
        setMetaTag(`article:tag:${index}`, tag, true);
      });
    }

    // Twitter Card tags
    setMetaTag('twitter:card', ogImage ? 'summary_large_image' : 'summary');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', metaDescription);
    setMetaTag('twitter:image', ogImage);

    // Canonical URL
    setLinkTag('canonical', pageUrl);

    // Clean up function to remove article-specific tags when navigating away
    return () => {
      if (type === 'article') {
        setMetaTag('article:published_time', null, true);
        setMetaTag('article:modified_time', null, true);
        setMetaTag('article:author', null, true);
        tags.forEach((_, index) => {
          setMetaTag(`article:tag:${index}`, null, true);
        });
      }
    };
  }, [
    fullTitle,
    metaDescription,
    pageUrl,
    ogImage,
    type,
    publishedTime,
    modifiedTime,
    author,
    tags,
    noindex,
    blogInfo,
  ]);

  // Update JSON-LD script tags
  useEffect(() => {
    // Remove existing JSON-LD scripts
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach((script) => script.remove());

    // Add new JSON-LD scripts
    jsonLd.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema, null, 0);
      document.head.appendChild(script);
    });

    // Cleanup
    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach((script) => script.remove());
    };
  }, [jsonLd]);

  // This component doesn't render anything visible
  return null;
}

