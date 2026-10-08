import { type ServerTierId } from '../../src/config/pricing';

export const OFFER_DETAILS: Record<ServerTierId, { timeline: string; deliverables: string[] }> = {
  landing: { timeline: '3 days', deliverables: ['One-page cinematic site', 'GSAP scroll choreography', 'Mobile-first layout', 'Custom domain + SSL', 'Cloudflare deployment', 'Contact form + analytics'] },
  business: { timeline: '14 days', deliverables: ['5–7 custom pages', 'Blog-ready CMS', 'Custom motion language', 'SEO foundation', 'Email capture forms', 'Analytics dashboard'] },
  store: { timeline: '21 days', deliverables: ['Stripe checkout integration', 'Supabase customer accounts', 'Product catalog (up to 50 SKUs)', 'Order management', 'Email automation', 'Cookie banner'] },
  webapp: { timeline: '4–6 weeks', deliverables: ['Authentication + user dashboards', 'Custom database schema', 'Stripe subscriptions', 'n8n automation hooks', 'Admin panel', 'API integrations'] },
};
