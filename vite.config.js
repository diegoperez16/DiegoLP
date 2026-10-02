import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import story from './api/story.js'
import itunes from './api/itunes.js'

export default defineConfig(({ mode }) => {
  // api/story.js reads ANTHROPIC_API_KEY from the environment; in dev, .env.local wins over whatever the shell had.
  const key = loadEnv(mode, process.cwd(), '').ANTHROPIC_API_KEY
  if (key) process.env.ANTHROPIC_API_KEY = key
  return {
    plugins: [
      react(),
      // Serve the Vercel function locally so `npm run dev` has a working /api/story.
      { name: 'api', configureServer(server) { server.middlewares.use('/api/story', (req, res) => story(req, res)); server.middlewares.use('/api/itunes', (req, res) => itunes(req, res)) } },
    ],
    build: {
      rollupOptions: {
        // Two pages: the portfolio, and /me.html (the not-necessarily-professional page behind the globe's photo bubble).
        input: { main: 'index.html', me: 'me.html' },
      },
    },
  }
})
