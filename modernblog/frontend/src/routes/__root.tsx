import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BlogInfoProvider, useBlogInfo } from '../context/BlogInfoContext';
import { useEffect } from 'react';
import '../components/Layout.css';

function Layout() {
  const { blogInfo } = useBlogInfo();

  useEffect(() => {
    if (blogInfo?.title) {
      document.title = blogInfo.title;
    }
    if (blogInfo?.description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', blogInfo.description);
      }
    }
  }, [blogInfo?.title, blogInfo?.description]);

  return (
    <div className="layout">
      <Header />
      <main className="main-content">
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
