import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Collection } from 'discord.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const commandsDir = join(__dirname, '../commands');

export async function loadCommands() {
  const commands = new Collection();
  const files = readdirSync(commandsDir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const mod = await import(`../commands/${file}`);
    if (!mod.data || !mod.execute) continue;
    commands.set(mod.data.name, { data: mod.data, execute: mod.execute });
    console.log(`[CMD] Loaded: /${mod.data.name}`);
  }

  return commands;
}
