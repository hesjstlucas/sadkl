import { createServer } from 'http';

const PORT      = process.env.PORT ?? 3000;
const SELF_URL  = process.env.RENDER_EXTERNAL_URL ?? `http://localhost:${PORT}`;
const INTERVAL  = 5 * 60 * 1000; // 5 minutes

/**
 * Starts a lightweight HTTP server so Render detects an open port,
 * then self-pings every 5 minutes to prevent the free-tier spin-down.
 */
export function startKeepAlive() {
  // ── HTTP server ──────────────────────────────────────────────────────────
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  });

  server.listen(PORT, () => {
    console.log(`[KEEP-ALIVE] HTTP server listening on port ${PORT}`);
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

  console.log(`[KEEP-ALIVE] Self-ping active every 5 minutes → ${SELF_URL}`);
}
