import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import TrendivaLuxLanding from './components/TrendivaLuxLanding';
import TierPage from './pages/TierPage';
import ContractPage from './pages/ContractPage';
import SuccessPage from './pages/SuccessPage';
import ImpressumPage from './pages/ImpressumPage';
import DatenschutzPage from './pages/DatenschutzPage';
import AGBPage from './pages/AGBPage';
import AGBB2CPage from './pages/AGBB2CPage';
import WiderrufsbelehrungPage from './pages/WiderrufsbelehrungPage';
import { TIER_CONFIGS } from './lib/tier-configs';
import './index.css';

function TierRoute() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug || !(slug in TIER_CONFIGS)) {
    return <Navigate to="/" replace />;
  }
  const config = TIER_CONFIGS[slug as keyof typeof TIER_CONFIGS];
  return <TierPage config={config} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TrendivaLuxLanding />} />
          <Route path="/tiers/:slug" element={<TierRoute />} />
          <Route path="/contract/:orderId" element={<ContractPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
          <Route path="/datenschutz" element={<DatenschutzPage />} />
          <Route path="/agb" element={<AGBPage />} />
          <Route path="/agb-b2c" element={<AGBB2CPage />} />
          <Route path="/widerrufsbelehrung" element={<WiderrufsbelehrungPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
);
