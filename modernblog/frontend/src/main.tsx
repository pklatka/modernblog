import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

// Initialize i18n before app renders
import './i18n/i18n';

// Import the generated route tree
import { routeTree } from './routeTree.gen';
import { setGlobalAction } from './hooks/useEntranceAnimation';

// Create a new router instance
const router = createRouter({
  routeTree,
  scrollRestoration: true,
  scrollRestorationBehavior: 'instant',
});

// Subscribe to history changes to track navigation action for animations
router.history.subscribe((event) => {
  if (event.action) {
    setGlobalAction(event.action);
  }
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmModal';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <ConfirmProvider>
            <RouterProvider router={router} />
          </ConfirmProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
