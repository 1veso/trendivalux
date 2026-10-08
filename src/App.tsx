import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useParams, useLocation, Navigate } from 'react-router-dom';
import TrendivaLuxLanding from './components/TrendivaLuxLanding';
import TierPage from './pages/TierPage';
import LegalPageSkeleton from './components/LegalPageSkeleton';
import { TIER_CONFIGS } from './lib/tier-configs';

const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OfferReviewPage = lazy(() => import('./pages/OfferReviewPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const PostPaymentScoping = lazy(() => import('./pages/PostPaymentScoping'));
const ImpressumPage = lazy(() => import('./pages/ImpressumPage'));
const DatenschutzPage = lazy(() => import('./pages/DatenschutzPage'));
const AGBPage = lazy(() => import('./pages/AGBPage'));
const AGBB2CPage = lazy(() => import('./pages/AGBB2CPage'));
const WiderrufsbelehrungPage = lazy(() => import('./pages/WiderrufsbelehrungPage'));

function RouteScroll() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    const id = decodeURIComponent(hash.slice(1));
    const timer = window.setTimeout(() => document.getElementById(id)?.scrollIntoView(), 0);
    return () => window.clearTimeout(timer);
  }, [pathname, hash]);
  return null;
}

function TierRoute() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug || !(slug in TIER_CONFIGS)) {
    return <Navigate to="/" replace />;
  }
  const config = TIER_CONFIGS[slug as keyof typeof TIER_CONFIGS];
  return <TierPage key={config.id} config={config} />;
}

const withSkeleton = (node: React.ReactNode) => (
  <Suspense fallback={<LegalPageSkeleton />}>{node}</Suspense>
);

export function AppRoutes() {
  return <>
          <RouteScroll />
          <Routes>
            <Route path="/" element={<TrendivaLuxLanding />} />
            <Route path="/tiers/:slug" element={<TierRoute />} />
            <Route path="/checkout/:orderId" element={withSkeleton(<CheckoutPage />)} />
            <Route path="/offer-review/:orderId" element={withSkeleton(<OfferReviewPage />)} />
            <Route path="/success" element={withSkeleton(<SuccessPage />)} />
            <Route path="/impressum" element={withSkeleton(<ImpressumPage />)} />
            <Route path="/datenschutz" element={withSkeleton(<DatenschutzPage />)} />
            <Route path="/agb" element={withSkeleton(<AGBPage />)} />
            <Route path="/agb-b2c" element={withSkeleton(<AGBB2CPage />)} />
            <Route path="/widerrufsbelehrung" element={withSkeleton(<WiderrufsbelehrungPage />)} />
            <Route path="/scoping/:orderId" element={withSkeleton(<PostPaymentScoping />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
  </>;
}
