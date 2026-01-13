/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_AUTH_LOGIN_URL: string;
  readonly VITE_AUTH_ME_URL: string;
  readonly VITE_AUTH_LOGOUT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
