import { scanProject } from '../project-scan';
import { crossImpact } from './analyze/crossImpact';
import { notifyToMain } from './notify/toMain';

const PORT = 3000;

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function parseJsonBody(req: Request) {
  const text = await req.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === 'GET' && url.pathname === '/api/scan') {
      const result = await scanProject();
      return jsonResponse(result);
    }
    if (req.method === 'POST' && url.pathname === '/api/analyze') {
      const data = await parseJsonBody(req);
      if (!data) return jsonResponse({ error: 'Invalid JSON' }, 400);
      // Analyze cross impact (mock: just echo for now)
      const impact = crossImpact(data.prev, data.next);
      return jsonResponse({ impact });
    }
    if (req.method === 'POST' && url.pathname === '/api/notify') {
      const data = await parseJsonBody(req);
      if (!data) return jsonResponse({ error: 'Invalid JSON' }, 400);
      notifyToMain(data);
      return jsonResponse({ ok: true });
    }
    return jsonResponse({ error: 'Not found' }, 404);
  },
});

console.log(`AI Sync API server running at http://localhost:${PORT}`);
