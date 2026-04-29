import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import TrendivaLuxLanding from './components/TrendivaLuxLanding';
import TierPage from './pages/TierPage';
import LegalPageSkeleton from './components/LegalPageSkeleton';
import { TIER_CONFIGS } from './lib/tier-configs';
import './index.css';

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
  </React.StrictMode>,
);
