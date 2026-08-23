import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const commandsDir = join(__dirname, 'commands');

const commandData = [];
const files = readdirSync(commandsDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const mod = await import(`./commands/${file}`);
  if (!mod.data) continue;
  commandData.push(mod.data.toJSON());
  console.log(`[DEPLOY] Queued: /${mod.data.name}`);
}

const rest = new REST().setToken(process.env.BOT_TOKEN);

// ── Wipe old global commands so they don't conflict ────────────────────────
console.log('[DEPLOY] Clearing global commands…');
await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
console.log('[DEPLOY] Global commands cleared.');

// ── Register as guild commands on every server the bot is in ──────────────
// Fetch the bot's guild list via the guilds endpoint
const guilds = await rest.get(Routes.userGuilds());
console.log(`[DEPLOY] Found ${guilds.length} guild(s). Registering commands on each…`);

let success = 0;
let failed  = 0;

for (const guild of guilds) {
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
      { body: commandData },
    );
    console.log(`[DEPLOY] ✅  ${guild.name} (${guild.id})`);
    success++;
  } catch (err) {
    console.error(`[DEPLOY] ❌  ${guild.name} (${guild.id}):`, err.message);
    failed++;
  }
}

console.log(`\n[DEPLOY] Done — ${success} succeeded, ${failed} failed.`);
