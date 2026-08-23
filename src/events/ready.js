import { REST, Routes } from 'discord.js';

export const name = 'ready';
export const once = true;

export async function execute(client) {
  console.log(`[READY] Logged in as ${client.user.tag}`);
  console.log(`[READY] Serving ${client.guilds.cache.size} guild(s)`);

  const commandData = [...client.commands.values()].map(c => c.data.toJSON());
  const rest = new REST().setToken(process.env.BOT_TOKEN);

  let success = 0;
  let failed  = 0;

  for (const [guildId, guild] of client.guilds.cache) {
    try {
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guildId),
        { body: commandData },
      );
      success++;
    } catch (err) {
      console.error(`[READY] Failed to register commands in ${guild.name}:`, err.message);
      failed++;
    }
  }

  console.log(`[READY] Commands synced — ${success} guild(s) updated, ${failed} failed.`);
}
