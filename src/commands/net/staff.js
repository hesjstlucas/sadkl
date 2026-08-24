import {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} from 'discord.js';
import { getAllNetworks, getNetwork, isNetworkLeader } from '../../utils/permissions.js';
import { Colors } from '../../utils/containers.js';
import { E } from '../../utils/emojis.js';

const CV2    = MessageFlags.IsComponentsV2;
const EPH    = MessageFlags.Ephemeral;
const CV2EPH = CV2 | EPH;

export async function executeStaff(interaction) {
  await interaction.deferReply({ flags: CV2EPH });

  const network = await getNetwork(interaction.guildId);
  if (!network) {
    const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Not Registered`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('This server has not been registered in the network.'));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));
    return interaction.editReply({ components: [c], flags: CV2EPH });
  }

  const callerMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  if (!await isNetworkLeader(callerMember, network)) {
    const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Insufficient Permissions`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('Only Network Leaders and Administrators can view staff rosters.'));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));
    return interaction.editReply({ components: [c], flags: CV2EPH });
  }

  // If a specific server was requested via option, show it directly
  const targetGuildId = interaction.options.getString('server');

  const allNets = await getAllNetworks();
  if (!allNets.length) {
    const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  No Networks Registered`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('No servers are registered in the network yet.'));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));
    return interaction.editReply({ components: [c], flags: CV2EPH });
  }

  // If a server was specified, show it
  if (targetGuildId) {
    const targetNet = allNets.find(n => n.guildId === targetGuildId || n.id === targetGuildId);
    if (!targetNet) {
      const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Server Not Found`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent('That server is not registered in the network.'));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));
      return interaction.editReply({ components: [c], flags: CV2EPH });
    }
    const container = await buildStaffContainer(interaction.client, targetNet);
    return interaction.editReply({ components: [container], flags: CV2EPH });
  }

  // No server specified — show a dropdown to pick one
  const select = new StringSelectMenuBuilder()
    .setCustomId('staff_server_select')
    .setPlaceholder('Select a server to view its staff roster…')
    .addOptions(
      allNets.map(n =>
        new StringSelectMenuOptionBuilder()
          .setLabel(n.name)
          .setValue(n.id)
          .setDescription(`Guild ID: ${n.guildId}`)
      )
    );

  const c = new ContainerBuilder().setAccentColor(Colors.INFO);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.members}  Staff Roster — Select Server`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    'Select which network server\'s staff roster you want to view.'
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));

  return interaction.editReply({
    components: [c, new ActionRowBuilder().addComponents(select)],
    flags: CV2EPH,
  });
}

// ─── Dropdown handler (called from interactionCreate) ─────────────────────
export async function handleStaffServerSelect(interaction) {
  await interaction.deferUpdate();

  const networkId = interaction.values[0];
  const allNets   = await getAllNetworks();
  const targetNet = allNets.find(n => n.id === networkId);

  if (!targetNet) {
    const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Server Not Found`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));
    return interaction.editReply({ components: [c], flags: CV2EPH });
  }

  const container = await buildStaffContainer(interaction.client, targetNet);
  return interaction.editReply({ components: [container], flags: CV2EPH });
}

// ─── Build the staff roster container for a given network ─────────────────
async function buildStaffContainer(client, net) {
  const guild = client.guilds.cache.get(net.guildId);

  const c = new ContainerBuilder().setAccentColor(Colors.INFO);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `## ${E.members}  ${net.name} — Staff Roster`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large));

  if (!guild) {
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `${E.down}  Bot is not in this server — cannot fetch member data.`
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));
    return c;
  }

  // Fetch all members so role caches are populated
  await guild.members.fetch().catch(() => null);

  // ── Leadership ─────────────────────────────────────────────────────────
  const leadershipMembers = net.leadershipRoleId
    ? guild.roles.cache.get(net.leadershipRoleId)?.members.filter(m => !m.user.bot)
    : null;

  const leaderLines = leadershipMembers?.size
    ? [...leadershipMembers.values()].map(m =>
        `${E.member}  <@${m.id}>  \`${m.user.username}\``
      ).join('\n')
    : '— No members with this role.';

  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `### ${E.stats}  Leadership\n` +
    (net.leadershipRoleId ? `<@&${net.leadershipRoleId}>  ·  ${leadershipMembers?.size ?? 0} member(s)\n` : '_Role not configured_\n') +
    leaderLines
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

  // ── HR ─────────────────────────────────────────────────────────────────
  const hrMembers = net.hrRoleId
    ? guild.roles.cache.get(net.hrRoleId)?.members.filter(m => !m.user.bot)
    : null;

  const hrLines = hrMembers?.size
    ? [...hrMembers.values()].map(m =>
        `${E.member}  <@${m.id}>  \`${m.user.username}\``
      ).join('\n')
    : '— No members with this role.';

  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `### ${E.shield}  Human Resources\n` +
    (net.hrRoleId ? `<@&${net.hrRoleId}>  ·  ${hrMembers?.size ?? 0} member(s)\n` : '_Role not configured_\n') +
    hrLines
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

  // ── Staff ──────────────────────────────────────────────────────────────
  const staffMembers = net.staffRoleId
    ? guild.roles.cache.get(net.staffRoleId)?.members.filter(m => !m.user.bot)
    : null;

  const staffLines = staffMembers?.size
    ? [...staffMembers.values()].map(m =>
        `${E.member}  <@${m.id}>  \`${m.user.username}\``
      ).join('\n')
    : '— No members with this role.';

  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `### ${E.members}  Staff\n` +
    (net.staffRoleId ? `<@&${net.staffRoleId}>  ·  ${staffMembers?.size ?? 0} member(s)\n` : '_Role not configured_\n') +
    staffLines
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large));

  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `-# ${net.name}  ·  Vyron Development  ·  Updated <t:${Math.floor(Date.now() / 1000)}:R>`
  ));

  return c;
}
