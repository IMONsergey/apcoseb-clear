/** Public documents only: never accept credentials, fragments or non-loopback HTTP. */
export function publicApiSpecUrl(value: string): string {
  const url = new URL(value);
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hash ||
    (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
  )
    throw new Error('The public API specification URL must use credential-free HTTPS.');
  return url.href;
}
