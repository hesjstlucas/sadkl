import {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from 'discord.js';
import { getDb } from '../../utils/db.js';
import { addInfraction } from '../../utils/infractions.js';
import { getNetwork, isNetworkLeader } from '../../utils/permissions.js';
import { Colors } from '../../utils/containers.js';
import { E } from '../../utils/emojis.js';

const CV2EPH = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

export async function executeBan(interaction) {
  await interaction.deferReply({ flags: CV2EPH });

  const target  = interaction.options.getUser('user');
  const reason  = interaction.options.getString('reason') ?? 'No reason provided.';
  const network = await getNetwork(interaction.guildId);

  if (!network) return noNetworkReply(interaction);
  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  if (!await isNetworkLeader(member, network)) return noPerm(interaction);

  await interaction.guild.bans.create(target.id, { reason: `[Network Ban] ${reason}` }).catch(() => null);
  const inf = await addInfraction(target.id, 'BAN', reason, interaction.user.id, network.id);

  const db = await getDb();
  const others = Object.values(db.data.networks).filter(n => n.guildId !== interaction.guildId);
  const results = [];
  for (const net of others) {
    const guild = interaction.client.guilds.cache.get(net.guildId);
    if (!guild) { results.push(`${E.down} **${net.name}** — bot not in server`); continue; }
    await guild.bans.create(target.id, { reason: `[Network Ban] ${reason}` }).catch(() => null);
    results.push(`${E.check} **${net.name}**`);
  }

  const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.gavel}  Network Ban Issued`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**User** <@${target.id}> \`${target.tag}\`\n` +
    `**Infraction ID** \`${inf.id}\`\n` +
    `**Reason** ${reason}\n` +
    `**Issued By** <@${interaction.user.id}>`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**Network Propagation**\n${results.length ? results.join('\n') : '—  No other servers in network.'}`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Paralix Network Management'));

  return interaction.editReply({ components: [c], flags: CV2EPH });
}

function noNetworkReply(interaction) {
  const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Not Registered`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    'This server is not registered in any network. Run `/net register` first.'
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Paralix Network Management'));
  return interaction.editReply({ components: [c], flags: CV2EPH });
}

function noPerm(interaction) {
  const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Insufficient Permissions`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    'You must be a Network Leader or Administrator to use this command.'
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Paralix Network Management'));
  return interaction.editReply({ components: [c], flags: CV2EPH });
}
