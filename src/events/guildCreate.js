import { REST, Routes } from 'discord.js';

export const name = 'guildCreate';
export const once = false;

export async function execute(guild, client) {
  const commandData = [...client.commands.values()].map(c => c.data.toJSON());
  const rest = new REST().setToken(process.env.BOT_TOKEN);

  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
      { body: commandData },
    );
    console.log(`[GUILD JOIN] Commands registered in ${guild.name} (${guild.id})`);
  } catch (err) {
    console.error(`[GUILD JOIN] Failed to register commands in ${guild.name}:`, err.message);
  }
}
