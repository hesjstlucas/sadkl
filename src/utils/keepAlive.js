import { createServer } from 'http';

const INTERVAL = 5 * 60 * 1000; // 5 minutes

export function startKeepAlive() {
  // Read env vars here so dotenv has already loaded them
  const PORT     = process.env.PORT ?? 3000;
  const SELF_URL = process.env.RENDER_EXTERNAL_URL ?? `http://localhost:${PORT}`;

  // ── HTTP server ──────────────────────────────────────────────────────────
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  });

  server.listen(PORT, () => {
    console.log(`[KEEP-ALIVE] HTTP server listening on port ${PORT}`);
    console.log(`[KEEP-ALIVE] Self-ping active every 5 minutes → ${SELF_URL}`);
  });

  // ── Self-ping every 5 minutes ────────────────────────────────────────────
  setInterval(async () => {
    try {
      const res = await fetch(SELF_URL);
      console.log(`[KEEP-ALIVE] Pinged ${SELF_URL} — ${res.status}`);
    } catch (err) {
      console.warn(`[KEEP-ALIVE] Ping failed: ${err.message}`);
    }
  }, INTERVAL);
}
