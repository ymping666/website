// Verification only: this never loads advertising or consent scripts.
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
