export const productionPublisherId = 'ca-pub-5973138354533758';

// Validation and ownership records can also be used without loading advertising.
export function adsenseVerification(value = '') {
  const supplied = value.trim();
  if (!supplied) return null;
  if (!/^(?:ca-)?pub-\d{16}$/.test(supplied)) {
    throw new Error('ADSENSE_PUBLISHER_ID must be a real pub- or ca-pub- ID with 16 digits');
  }
  const publisherId = supplied.replace(/^ca-/, '');
  return {
    meta: `<meta name="google-adsense-account" content="ca-${publisherId}">`,
    adsTxt: `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
  };
}

export function siteAdsense({
  origin = process.env.SITE_ORIGIN || '',
  base = process.env.SITE_BASE || '/',
  branch = process.env.CF_PAGES_BRANCH || 'main',
  publisherId = process.env.ADSENSE_PUBLISHER_ID ?? productionPublisherId
} = {}) {
  // Keep local builds, deployment previews and GitHub Pages free of ad requests.
  if (origin.replace(/\/$/, '') !== 'https://tensordrill.com' || base !== '/' || branch !== 'main') return null;
  const verification = adsenseVerification(publisherId);
  if (!verification) return null;
  const client = 'ca-' + publisherId.trim().replace(/^ca-/, '');
  return {
    ...verification,
    script: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}" crossorigin="anonymous"></script>`
  };
}
