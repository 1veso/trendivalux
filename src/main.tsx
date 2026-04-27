import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import TrendivaLuxLanding from './components/TrendivaLuxLanding';
import TierPage from './pages/TierPage';
import ContractPage from './pages/ContractPage';
import SuccessPage from './pages/SuccessPage';
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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TrendivaLuxLanding />} />
        <Route path="/tiers/:slug" element={<TierRoute />} />
        <Route path="/contract/:orderId" element={<ContractPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
