/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_GHANA_NIA_API_KEY?: string
  readonly VITE_NIGERIA_NIMC_API_KEY?: string
  readonly VITE_KENYA_REG_API_KEY?: string
  readonly VITE_SA_DHA_API_KEY?: string
  readonly VITE_US_SSA_API_KEY?: string
  readonly VITE_UK_GOV_API_KEY?: string
  readonly VITE_CANADA_SC_API_KEY?: string
  readonly VITE_USE_REAL_GOVERNMENT_DB?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
