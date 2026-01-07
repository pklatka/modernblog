import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BlogInfoProvider, useBlogInfo } from '../context/BlogInfoContext';
import { useEffect } from 'react';
import '../components/Layout.css';

function Layout() {
  const { blogInfo } = useBlogInfo();

  // Set HTML lang attribute based on blog language
  useEffect(() => {
    if (blogInfo?.language) {
      document.documentElement.lang = blogInfo.language;
      // Also update og:locale
      const ogLocale = document.querySelector('meta[property="og:locale"]');
      if (ogLocale) {
        ogLocale.setAttribute('content', blogInfo.language === 'pl' ? 'pl_PL' : 'en_US');
      }
    }
  }, [blogInfo?.language]);

  return (
    <div className="layout">
      <Header />
      <main className="main-content" role="main">
        <Outlet />
      </main>
      <Footer />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  );
}

export const Route = createRootRoute({
  component: () => (
    <BlogInfoProvider>
      <Layout />
    </BlogInfoProvider>
  ),
});
