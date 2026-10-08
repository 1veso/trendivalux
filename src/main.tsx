import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import * as Sentry from '@sentry/react';
import { AppRoutes } from './App';
import './index.css';

// Sentry error tracking. Disabled when VITE_SENTRY_DSN is not set so local
// Dev does not phone home. Error events scrub private links and breadcrumbs;
// transactions with private links are discarded and session replay is disabled.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN as string,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSendTransaction(event) {
      // Checkout, project and quote-review URLs contain bearer tokens.
      if (JSON.stringify(event).includes('token=')) return null;
      return event;
    },
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies;
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      if (event.request?.url) event.request.url = event.request.url.replace(/([?&]token=)[^&]+/g, '$1[redacted]');
      if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map(crumb => ({ ...crumb, data: undefined }));
      return event;
    },
  });
}

function ErrorFallback() {
  return (
    <div style={{ padding: '40px 24px', fontFamily: 'system-ui, sans-serif', color: '#fff', background: '#0A0A0F', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong.</h1>
      <p style={{ color: '#A0A0B8', maxWidth: 540 }}>
        The page hit an unexpected error. Refresh to try again, or email
        <a href="mailto:hello@trendivalux.com" style={{ color: '#00E5D4', marginLeft: 6 }}>hello@trendivalux.com</a>.
      </p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <HelmetProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </HelmetProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
