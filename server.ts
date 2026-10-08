import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { synthesizeVoice } from './server/ttsService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    hasAuthProtected: Boolean(process.env.VOXSTUDIO_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// API: OpenAPI schema for n8n and AI tool integration
app.get('/api/openapi.json', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const proto = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'VoxStudio TTS API',
      version: '1.0.0',
      description: 'API for generating professional AI voice-overs using Gemini TTS with expressive emotions, pauses, and multilingual/Indian accents.',
    },
    servers: [{ url: `${proto}://${host}` }],
    paths: {
      '/api/generate-voice': {
        post: {
          summary: 'Generate Voice-Over Audio',
          description: 'Synthesizes text into a high-quality WAV audio base64 payload.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['script'],
                  properties: {
                    script: { type: 'string', description: 'The text script to synthesize, supporting [PAUSE 1.5] tags.' },
                    voice: { type: 'string', default: 'Charon', description: 'Voice name (Charon, Iapetus, Achird, Puck, Kore, Fenrir, etc.)' },
                    language: { type: 'string', default: 'en', description: 'Language code or dialect (en, en-in, hinglish, tamil_en, etc.)' },
                    emotion: { type: 'string', default: 'Default', description: 'Emotional tone (friendly, cheerful, serious, dramatic, etc.)' },
                    pace: { type: 'number', default: 1.0, description: 'Speaking pace multiplier (0.75 to 1.5)' },
                    pitch: { type: 'string', default: 'Default', description: 'Pitch register (Default, Low, Deep, High, Bright)' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful voice synthesis',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      audioBase64: { type: 'string', description: 'Base64 encoded WAV audio' },
                      mimeType: { type: 'string' },
                      sampleRate: { type: 'integer' },
                      durationSec: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
});

// API: Generate Voice
app.post('/api/generate-voice', async (req, res) => {
  try {
    // Optional API Key security for n8n / external webhook triggers
    const expectedApiKey = process.env.VOXSTUDIO_API_KEY;
    if (expectedApiKey && expectedApiKey.trim() !== '') {
      const authHeader = req.headers['authorization'] || req.headers['x-api-key'] || req.headers['x-voxstudio-key'];
      const providedKey = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
      if (providedKey !== expectedApiKey.trim()) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Invalid or missing API key. Provide Bearer token or x-api-key header.',
        });
      }
    }

    const userApiKey = (req.headers['x-gemini-api-key'] as string) || req.body?.apiKey;
    const result = await synthesizeVoice(req.body, userApiKey);
    if (!result.success) {
      const isQuota =
        result.retryAfterSec !== undefined ||
        result.error?.includes('quota') ||
        result.error?.includes('cooling down');
      return res.status(isQuota ? 429 : 500).json(result);
    }
    return res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ success: false, error: message });
  }
});

// Serve static frontend assets in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`VoxStudio voice-over server listening on port ${port}`);
});
