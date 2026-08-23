import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from 'discord.js';

const CV2EPH = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

export const data = new SlashCommandBuilder()
  .setName('dev')
  .setDescription('Developer utilities')
  .addSubcommand(sub =>
    sub.setName('emojis')
       .setDescription('List all emojis in this server with their IDs')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'emojis') return listEmojis(interaction);
}

async function listEmojis(interaction) {
  await interaction.deferReply({ flags: CV2EPH });

  const emojis = interaction.guild.emojis.cache;

  if (!emojis.size) {
    const c = new ContainerBuilder().setAccentColor(0x5865f2);
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('## No emojis found in this server.'));
    return interaction.editReply({ components: [c], flags: CV2EPH });
  }

  const chunks = [];
  const all    = [...emojis.values()];
  for (let i = 0; i < all.length; i += 20) chunks.push(all.slice(i, i + 20));

  const containers = chunks.map((chunk, idx) => {
    const c = new ContainerBuilder().setAccentColor(0x5865f2);

    if (idx === 0) {
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `## Emoji List — ${interaction.guild.name}\n` +
        `**Total:** ${emojis.size} emoji(s)\n` +
        `-# Copy the string in \`code\` and paste it into emojis.js`
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    }

    const lines = chunk.map(e => {
      const raw    = e.animated ? `<a:${e.name}:${e.id}>` : `<:${e.name}:${e.id}>`;
      const config = e.animated
        ? `\`'<a:${e.name}:${e.id}>'\``
        : `\`'<:${e.name}:${e.id}>'\``;
      return `${raw}  **:${e.name}:**  ${config}`;
    });

    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')));

    if (idx === chunks.length - 1) {
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `-# Paste the quoted strings into src/utils/emojis.js · Delete this command when done`
      ));
    }

    return c;
  });

  await interaction.editReply({ components: containers, flags: CV2EPH });
}
