import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const eventsDir = join(__dirname, '../events');

export async function loadEvents(client) {
  const files = readdirSync(eventsDir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const mod = await import(`../events/${file}`);
    if (!mod.name) continue;

    const handler = (...args) => mod.execute(...args, client);

    if (mod.once) {
      client.once(mod.name, handler);
    } else {
      client.on(mod.name, handler);
    }

    console.log(`[EVT] Registered: ${mod.name} (once=${mod.once ?? false})`);
  }
}
