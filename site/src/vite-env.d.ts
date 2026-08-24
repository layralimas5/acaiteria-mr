/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Conta usada pelo login automático do painel em desenvolvimento. */
  readonly VITE_DEV_ADMIN_EMAIL?: string
  /** Senha dessa conta. Só existe no `.env.development`, nunca no build. */
  readonly VITE_DEV_ADMIN_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
