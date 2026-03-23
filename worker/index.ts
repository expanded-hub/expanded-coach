/**
 * Cloudflare Worker — Anthropic API Proxy
 *
 * This sits between your static GitHub Pages app and the Anthropic API.
 * It adds the API key server-side so it's never exposed in the browser.
 *
 * SETUP:
 *   1. Install Wrangler: npm install -g wrangler
 *   2. cd worker
 *   3. wrangler login
 *   4. wrangler secret put ANTHROPIC_API_KEY   (paste your key)
 *   5. wrangler deploy
 *
 * Then set VITE_API_PROXY_URL in your .env to the worker URL.
 */

export interface Env {
  ANTHROPIC_API_KEY: string;
}

const ALLOWED_ORIGINS = [
  'https://expanded-hub.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
];

function corsHeaders(origin: string | null): HeadersInit {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o))
      ? origin
      : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders(origin),
      });
    }

    try {
      const body = await request.json();

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: body.model || 'claude-sonnet-4-20250514',
          max_tokens: body.max_tokens || 2048,
          system: body.system || '',
          messages: body.messages || [],
        }),
      });

      const data = await response.text();

      return new Response(data, {
        status: response.status,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Proxy error', details: String(err) }),
        {
          status: 500,
          headers: {
            ...corsHeaders(origin),
            'Content-Type': 'application/json',
          },
        }
      );
    }
  },
};
