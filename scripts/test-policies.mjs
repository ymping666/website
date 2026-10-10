import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { policyPages, publicContactEmail } from '../src/policy-pages.mjs';
import { adsenseVerification, siteAdsense, productionPublisherId } from './adsense.mjs';
import { siteRoot, siteBase } from './config.mjs';
import { decodeHtml } from './localize.mjs';

assert.equal(adsenseVerification(), null);
assert.equal(adsenseVerification('  '), null);
const testId = 'pub-' + '1234567890123456';
assert.deepEqual(adsenseVerification(testId), adsenseVerification('ca-' + testId));
assert.equal(adsenseVerification(testId).adsTxt, `google.com, ${testId}, DIRECT, f08c47fec0942fa0\n`);
for (const value of ['pub-123', 'pub-12345678901234567', 'pub-<script>', 'ca-' + testId + '\nextra']) {
  assert.throws(() => adsenseVerification(value), /ADSENSE_PUBLISHER_ID/);
}
const production = { origin: 'https://tensordrill.com', base: '/', branch: 'main', publisherId: productionPublisherId };
const adCode = siteAdsense(production);
assert.equal(adCode.script, `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${productionPublisherId}" crossorigin="anonymous"></script>`);
for (const origin of ['', 'http://localhost:4173', 'https://ymping666.github.io', 'https://preview.pages.dev', 'https://tensordrill.com.example.com']) {
  assert.equal(siteAdsense({ ...production, origin }), null, 'No ads outside production');
}
assert.equal(siteAdsense({ ...production, base: '/website/' }), null);
assert.equal(siteAdsense({ ...production, branch: 'codex/preview' }), null);
assert.equal(siteAdsense({ ...production, publisherId: '' }), null);
assert.throws(() => siteAdsense({ ...production, publisherId: 'pub-bad' }), /ADSENSE_PUBLISHER_ID/);
const verification = siteAdsense();
const footerPaths = ['/privacy/', '/terms/', '/cookies/', '/advertising/', '/contact/'];
for (const page of policyPages) {
  for (const [i, prefix] of [[0, ''], [1, 'zh/']]) {
    const html = await readFile(join(siteRoot, prefix, page.path.slice(1), 'index.html'), 'utf8');
    const decoded = decodeHtml(html);
    assert.ok(decoded.includes(page.heading[i]), page.path + ': localized heading');
    assert.ok(decoded.includes(page.intro[i]), page.path + ': localized introduction');
    for (const section of page.sections) {
      assert.ok(decoded.includes(section.heading[i]), page.path + ': localized section');
      for (const paragraph of section.paragraphs) assert.ok(decoded.includes(paragraph[i]), page.path + ': complete policy translation');
    }
    assert.ok(html.includes('mailto:' + publicContactEmail));
    for (const path of footerPaths) assert.ok(html.match(/<footer[\s\S]*?<\/footer>/)[0].includes(`href="${siteBase() + prefix + path.slice(1)}"`));
    if (verification) assert.ok(html.includes(verification.meta));
    else assert.doesNotMatch(html, /name="google-adsense-account"/);
  }
}
let checkedPages = 0;
async function checkAdCode(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) await checkAdCode(file);
    else if (entry.name.endsWith('.html')) {
      const html = await readFile(file, 'utf8');
      const scripts = html.match(/<script\b[^>]*\bsrc="[^"]*(?:adsbygoogle|googlesyndication)[^"]*"[^>]*><\/script>/gi) || [];
      if (verification) {
        assert.deepEqual(scripts, [verification.script], file + ': exactly one AdSense script');
        assert.ok(html.match(/<head>[\s\S]*?<\/head>/)[0].includes(verification.script), file + ': script in head');
      } else assert.equal(scripts.length, 0, file + ': no ads in preview');
      checkedPages++;
    }
  }
}
await checkAdCode(siteRoot);
const privacy = decodeHtml(await readFile(join(siteRoot, 'privacy/index.html'), 'utf8'));
for (const expected of ['localStorage', 'other sites', 'web beacons', 'IP addresses', 'Google-certified', 'Switzerland', 'https://myadcenter.google.com/', 'https://optout.aboutads.info/', 'https://policies.google.com/technologies/partner-sites']) {
  assert.ok(privacy.includes(expected), 'Privacy disclosure: ' + expected);
}
if (verification) assert.equal(await readFile(join(siteRoot, 'ads.txt'), 'utf8'), verification.adsTxt);
else await assert.rejects(access(join(siteRoot, 'ads.txt')), { code: 'ENOENT' });
console.log(`PASS bilingual policies, public contact, privacy disclosures, ads.txt and AdSense placement on ${checkedPages} HTML pages`);
