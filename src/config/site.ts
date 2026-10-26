/** Vite validates these public destinations before serving or building the site. */
export const { productUrl, supportEmail, signInUrl } = __APCO_PUBLIC_SETTINGS__;

/** Resolve through siteHref at render time to retain the active language and hosting base. */
export const apiDocumentationPath = '/developers/api/docs';
