/// <reference types="vite/client" />

declare const __APCO_PUBLIC_SETTINGS__: ReturnType<
  typeof import('./config/public-settings').readPublicSettings
>;

interface ImportMetaEnv {
  readonly VITE_APCO_PRODUCT_URL?: string;
  readonly VITE_APCO_SUPPORT_EMAIL?: string;
  readonly VITE_APCO_SIGN_IN_URL?: string;
}
