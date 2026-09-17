/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APP_THEME?: string;
  readonly VITE_APP_SHOW_THEME_PICKER?: string;
  readonly VITE_APP_ALLOW_THEME_CUSTOMIZATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
