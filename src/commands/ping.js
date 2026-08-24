import {SlashCommandBuilder,
    PermissionFlagsBits
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check the bot\'s latency');

  async function execute(interaction) {
    const sent = await interaction.reply({content: 'Pinging...', fetchReply: true});
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`Pong! Latency is ${latency}ms.`);
  }