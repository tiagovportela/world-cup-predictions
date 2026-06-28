import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only middleware that runs the Netlify function locally so
// `npm run dev` serves /.netlify/functions/* without the Netlify CLI.
// In production, the real Netlify function (netlify/functions/*.mjs) runs.
function netlifyFunctionsDev(env) {
  return {
    name: 'netlify-functions-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/.netlify/functions/football')) {
          return next()
        }
        try {
          // Expose the server-side key to the function (never sent to browser)
          if (env.FOOTBALL_DATA_KEY) {
            process.env.FOOTBALL_DATA_KEY = env.FOOTBALL_DATA_KEY
          }
          // Cache-bust so edits to the function hot-reload in dev
          const fnUrl = new URL('./netlify/functions/football.mjs', import.meta.url)
          const { default: handler } = await import(`${fnUrl.href}?t=${Date.now()}`)

          const request = new Request('http://localhost' + req.url, { method: req.method })
          const response = await handler(request)

          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(await response.text())
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error.message }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ ones like FOOTBALL_DATA_KEY)
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), netlifyFunctionsDev(env)],
    server: {
      port: 5173,
      open: true,
    },
  }
})
