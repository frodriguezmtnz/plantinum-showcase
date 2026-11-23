export function designPreviewsEnabled() {
  if (process.env.NODE_ENV !== 'production') return true;

  return (
    process.env.PRISM_PLAYGROUND === '1' &&
    process.env.VERCEL_ENV !== 'production'
  );
}
