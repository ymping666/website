export const measurementId = 'G-PRJS97CCNN';

export function siteAnalytics({
  origin = process.env.SITE_ORIGIN || '',
  base = process.env.SITE_BASE || '/',
  branch = process.env.CF_PAGES_BRANCH || process.env.CF_BRANCH || 'main'
} = {}) {
  // Do not count development, GitHub Pages or deployment previews as visitors.
  if (origin.replace(/\/$/, '') !== 'https://tensordrill.com' || base !== '/' || branch !== 'main') return '';
  return `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');
</script>`;
}
