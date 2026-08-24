import {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from 'discord.js';
import { connectDb, Ticket, Infraction } from '../../utils/db.js';
import { getNetwork, isNetworkLeader } from '../../utils/permissions.js';
import { Colors } from '../../utils/containers.js';
import { E } from '../../utils/emojis.js';

const CV2EPH = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

export async function executeManage(interaction) {
  await interaction.deferReply({ flags: CV2EPH });
  await connectDb();

  const network = await getNetwork(interaction.guildId);
  if (!network) return noNetworkReply(interaction);

  const callerMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  if (!await isNetworkLeader(callerMember, network)) return noPerm(interaction);

  const guild = interaction.guild;
  const now   = Date.now();
  const day30 = 30 * 24 * 60 * 60 * 1000;

  await guild.members.fetch().catch(() => null);
  const allMembers   = guild.members.cache;
  const totalMembers = allMembers.size;
  const bots         = allMembers.filter(m => m.user.bot).size;
  const humans       = totalMembers - bots;
  const newLast30    = allMembers.filter(m => !m.user.bot && (now - m.joinedTimestamp) < day30).size;

  const roles = guild.roles.cache
    .filter(r => r.id !== guild.id && !r.managed)
    .sort((a, b) => b.members.size - a.members.size)
    .first(10);

  const db             = null; // unused — direct mongo below
  let totalInfractions = await Infraction.countDocuments({ networkId: network.id });
  const openTickets    = await Ticket.countDocuments({ guildId: interaction.guildId, status: 'open' });
  const blRole           = guild.roles.cache.get(network.blacklistRoleId);
  const blacklistedCount = blRole ? blRole.members.size : 0;
  const textChannels     = guild.channels.cache.filter(ch => ch.type === 0).size;
  const voiceChannels    = guild.channels.cache.filter(ch => ch.type === 2).size;
  const categories       = guild.channels.cache.filter(ch => ch.type === 4).size;

  const c = new ContainerBuilder().setAccentColor(Colors.INFO);

  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `## ${E.stats}  ${network.name} — Network Dashboard`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `### ${E.members}  Server Overview\n` +
    `**Total Members** ${totalMembers.toLocaleString()} (${humans} humans · ${bots} bots)\n` +
    `**Joined in Last 30 Days** ${newLast30}\n` +
    `**Server Boost Level** ${guild.premiumTier ?? 0} (${guild.premiumSubscriptionCount ?? 0} boosts)\n` +
    `**Created** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small));

  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `### ${E.shield}  Moderation Stats\n` +
    `**Network Infractions (this server)** ${totalInfractions}\n` +
    `**Blacklisted Members** ${blacklistedCount}\n` +
    `**Open Tickets** ${openTickets}`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small));

  const leaderMentions = network.leadershipRoleId ? `<@&${network.leadershipRoleId}>` : '—';
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `### ${E.network}  Network Leadership\n${leaderMentions}`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small));

  const roleList = roles.map(r => `<@&${r.id}> — ${r.members.size} members`).join('\n') || '—';
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `### ${E.member}  Top Roles (by member count)\n${roleList}`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small));

  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `### ${E.line}  Channel Overview\n` +
    `**Text** ${textChannels}  ·  **Voice** ${voiceChannels}  ·  **Categories** ${categories}`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small));

  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `### ${E.stats}  Network Configuration\n` +
    `**Network ID** \`${network.id}\`\n` +
    `**Community Role** <@&${network.communityRoleId}>\n` +
    `**Blacklist Role** <@&${network.blacklistRoleId}>\n` +
    `**Registered** <t:${Math.floor(network.registeredAt / 1000)}:D> by <@${network.registeredBy}>`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));

  return interaction.editReply({ components: [c], flags: CV2EPH });
}

function noNetworkReply(interaction) {
  const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Not Registered`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('This server has not been registered in the network.'));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));
  return interaction.editReply({ components: [c], flags: CV2EPH });
}

function noPerm(interaction) {
  const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Insufficient Permissions`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('Only Network Leaders and Administrators can view the dashboard.'));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));
  return interaction.editReply({ components: [c], flags: CV2EPH });
}
