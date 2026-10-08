import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { synthesizeVoice } from './server/ttsService';

dotenv.config();

function apiPlugin(): Plugin {
  return {
    name: 'voxstudio-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              status: 'ok',
              hasApiKey: Boolean(process.env.GEMINI_API_KEY),
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        if (req.url === '/api/generate-voice' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const result = await synthesizeVoice(body);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = result.success
                ? 200
                : result.error?.includes('cooling down')
                  ? 429
                  : 500;
              res.end(JSON.stringify(result));
            } catch (err: unknown) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  success: false,
                  error: err instanceof Error ? err.message : 'Server error',
                })
              );
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

