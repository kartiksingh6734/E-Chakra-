interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly BASE_URL: string;
  readonly VITE_GITHUB_PAGES?: string;
  readonly VITE_FIREBASE_AUTH_EMULATOR?: string;
  readonly VITE_FIREBASE_CONFIG?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
