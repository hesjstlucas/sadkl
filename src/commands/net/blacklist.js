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

export async function executeBlacklist(interaction) {
  await interaction.deferReply({ flags: CV2EPH });

  const target  = interaction.options.getUser('user');
  const reason  = interaction.options.getString('reason') ?? 'No reason provided.';
  const network = await getNetwork(interaction.guildId);

  if (!network) return noNetworkReply(interaction);
  const callerMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  if (!await isNetworkLeader(callerMember, network)) return noPerm(interaction);

  const inf = await addInfraction(target.id, 'BLACKLIST', reason, interaction.user.id, network.id);

  const db = await getDb();
  const results = [];

  for (const net of Object.values(db.data.networks)) {
    const guild = interaction.client.guilds.cache.get(net.guildId);
    if (!guild) { results.push(`${E.down} **${net.name}** — bot not in server`); continue; }

    const member = await guild.members.fetch(target.id).catch(() => null);
    if (!member) { results.push(`${E.down} **${net.name}** — user not in server`); continue; }

    const rolesToRemove = member.roles.cache
      .filter(r => r.id !== net.communityRoleId && r.id !== guild.id)
      .map(r => r.id);

    for (const roleId of rolesToRemove) {
      await member.roles.remove(roleId, `[Network Blacklist] ${reason}`).catch(() => null);
    }
    await member.roles.add(net.blacklistRoleId, `[Network Blacklist] ${reason}`).catch(() => null);
    results.push(`${E.check} **${net.name}**`);
  }

  const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Network Blacklist Applied`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**User** <@${target.id}> \`${target.tag}\`\n` +
    `**Infraction ID** \`${inf.id}\`\n` +
    `**Reason** ${reason}\n` +
    `**Issued By** <@${interaction.user.id}>`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**Network Propagation**\n${results.length ? results.join('\n') : '—'}`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `-# All roles removed · Blacklist role applied · Community Member role retained\n-# Paralix Network Management`
  ));

  return interaction.editReply({ components: [c], flags: CV2EPH });
}

function noNetworkReply(interaction) {
  const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Not Registered`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('This server has not been registered in the network.'));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Paralix Network Management'));
  return interaction.editReply({ components: [c], flags: CV2EPH });
}

function noPerm(interaction) {
  const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Insufficient Permissions`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('Only Network Leaders and Administrators can blacklist members.'));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Paralix Network Management'));
  return interaction.editReply({ components: [c], flags: CV2EPH });
}
