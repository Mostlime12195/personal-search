// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  srcDir: 'app',
  serverDir: 'app/server',
  ssr: false,
  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5' },
        { name: 'theme-color', content: '#eaddce' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      searchApiKey: process.env.VITE_SEARCH_API_KEY
    }
  }
})
