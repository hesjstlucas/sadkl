import {SlashCommandBuilder,
    PermissionFlagsBits
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check the bot\'s latency');

  async function execute(interaction) {
  await interaction.reply({ content: `Pong! Latency is ${Date.now() - interaction.createdTimestamp}ms.`, ephemeral: true });
  }