import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  pathname?: string;
  noIndex?: boolean;
}

const DEFAULT_TITLE = 'TrendivaLux — Cinematic Websites Built to Be Remembered';
const DEFAULT_DESCRIPTION =
  'Premium motion-driven websites for businesses that refuse to be forgotten. Solo-built in Düren, deployed globally, yours forever.';
const DEFAULT_OG_IMAGE = 'https://trendivalux.com/og-trendivalux.png';
const SITE_URL = 'https://trendivalux.com';

export default function SEO({ title, description, ogImage, pathname, noIndex }: SEOProps) {
  const fullTitle = title ? `${title} :: TrendivaLux` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESCRIPTION;
  const og = ogImage || DEFAULT_OG_IMAGE;
  const url = pathname ? `${SITE_URL}${pathname}` : SITE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={og} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={og} />

      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta httpEquiv="Content-Language" content="en" />
    </Helmet>
  );
}
