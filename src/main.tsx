import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import * as Sentry from '@sentry/react';
import TrendivaLuxLanding from './components/TrendivaLuxLanding';
import TierPage from './pages/TierPage';
import LegalPageSkeleton from './components/LegalPageSkeleton';
import { TIER_CONFIGS } from './lib/tier-configs';
import './index.css';

// Sentry error tracking. Disabled when VITE_SENTRY_DSN is not set so local
// dev does not phone home. PII scrubbing is in beforeSend; Replay masks
// text and blocks media so signing flows and Stripe iframes stay private.
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
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      if (event.request?.cookies) delete event.request.cookies;
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
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

const ContractPage = lazy(() => import('./pages/ContractPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const ImpressumPage = lazy(() => import('./pages/ImpressumPage'));
const DatenschutzPage = lazy(() => import('./pages/DatenschutzPage'));
const AGBPage = lazy(() => import('./pages/AGBPage'));
const AGBB2CPage = lazy(() => import('./pages/AGBB2CPage'));
const WiderrufsbelehrungPage = lazy(() => import('./pages/WiderrufsbelehrungPage'));

function TierRoute() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug || !(slug in TIER_CONFIGS)) {
    return <Navigate to="/" replace />;
  }
  const config = TIER_CONFIGS[slug as keyof typeof TIER_CONFIGS];
  return <TierPage config={config} />;
}

const withSkeleton = (node: React.ReactNode) => (
  <Suspense fallback={<LegalPageSkeleton />}>{node}</Suspense>
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <HelmetProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<TrendivaLuxLanding />} />
            <Route path="/tiers/:slug" element={<TierRoute />} />
            <Route path="/contract/:orderId" element={withSkeleton(<ContractPage />)} />
            <Route path="/success" element={withSkeleton(<SuccessPage />)} />
            <Route path="/impressum" element={withSkeleton(<ImpressumPage />)} />
            <Route path="/datenschutz" element={withSkeleton(<DatenschutzPage />)} />
            <Route path="/agb" element={withSkeleton(<AGBPage />)} />
            <Route path="/agb-b2c" element={withSkeleton(<AGBB2CPage />)} />
            <Route path="/widerrufsbelehrung" element={withSkeleton(<WiderrufsbelehrungPage />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </HelmetProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
