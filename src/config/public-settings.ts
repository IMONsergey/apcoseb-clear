type PublicEnvironment = Partial<
  Record<'VITE_APCO_PRODUCT_URL' | 'VITE_APCO_SUPPORT_EMAIL' | 'VITE_APCO_SIGN_IN_URL', string>
>;

function httpUrl(input: string, setting: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error(`${setting} must be an absolute HTTP(S) URL.`);
  }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error(`${setting} must be an HTTP(S) URL without credentials.`);
  }
  // Plain HTTP is only supported for a local development server. Search queries
  // and sign-in links must never be sent to an unencrypted public endpoint.
  if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error(`${setting} requires HTTPS outside local loopback development.`);
  }
  return url;
}

/** Invalid public configuration fails before Vite serves or builds the site. */
export function readPublicSettings(env: PublicEnvironment) {
  const product = httpUrl(
    env.VITE_APCO_PRODUCT_URL?.trim() || 'https://apcosys.net',
    'VITE_APCO_PRODUCT_URL',
  );
  if (product.pathname !== '/' || product.search || product.hash) {
    throw new Error('VITE_APCO_PRODUCT_URL must be an origin without a path, query or fragment.');
  }
  const supportEmail = env.VITE_APCO_SUPPORT_EMAIL?.trim() || 'info@apcosys.net';
  if (
    !/^[A-Za-z0-9.!#$%&'*+/=_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(
      supportEmail,
    )
  ) {
    throw new Error(
      'VITE_APCO_SUPPORT_EMAIL must be a single email address without mailto parameters.',
    );
  }
  const signIn = env.VITE_APCO_SIGN_IN_URL?.trim();
  const signInUrl = signIn ? httpUrl(signIn, 'VITE_APCO_SIGN_IN_URL') : null;
  if (signInUrl && signInUrl.origin !== product.origin) {
    throw new Error('VITE_APCO_SIGN_IN_URL must stay on the product origin.');
  }
  return {
    productUrl: product.origin,
    supportEmail,
    signInUrl: signInUrl?.href ?? new URL('/login', product).href,
  };
}
