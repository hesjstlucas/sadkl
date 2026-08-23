import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands }  from './handlers/commandLoader.js';
import { loadEvents }    from './handlers/eventLoader.js';
import { startKeepAlive } from './utils/keepAlive.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.GuildMember],
});

// Load commands into client collection
client.commands = await loadCommands();

// Register event listeners
await loadEvents(client);

// Keep-alive HTTP server + self-ping (for Render free tier)
startKeepAlive();

// Login
client.login(process.env.BOT_TOKEN);
