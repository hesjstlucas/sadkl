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
import { getDb } from '../../utils/db.js';
import { addInfraction } from '../../utils/infractions.js';
import { getNetwork, getAllNetworks, isNetworkLeader } from '../../utils/permissions.js';
import { Colors } from '../../utils/containers.js';
import { E } from '../../utils/emojis.js';

const CV2    = MessageFlags.IsComponentsV2;
const EPH    = MessageFlags.Ephemeral;
const CV2EPH = CV2 | EPH;

export async function executeKick(interaction) {
  const target  = interaction.options.getUser('user');
  const reason  = interaction.options.getString('reason') ?? 'No reason provided.';
  const network = await getNetwork(interaction.guildId);

  if (!network) return noNetworkReply(interaction);
  const callerMember = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  if (!await isNetworkLeader(callerMember, network)) return noPerm(interaction);

  const allNets = await getAllNetworks();
  if (!allNets.length) {
    await interaction.reply({ content: 'No network servers are registered.', flags: EPH });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(`kick_server_select:${target.id}:${encodeURIComponent(reason)}`)
    .setPlaceholder('Select which server to kick from…')
    .addOptions(
      allNets.map(n =>
        new StringSelectMenuOptionBuilder()
          .setLabel(n.name)
          .setValue(n.guildId)
          .setDescription(`Guild ID: ${n.guildId}`)
      )
    );

  const c = new ContainerBuilder().setAccentColor(Colors.WARNING);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.kick}  Network Kick — Select Server`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `You are about to kick <@${target.id}> from a network server.\nSelect the server below.`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));

  await interaction.reply({
    components: [c, new ActionRowBuilder().addComponents(select)],
    flags: CV2EPH,
  });
}

export async function handleKickSelect(interaction) {
  const [, targetId, encodedReason] = interaction.customId.split(':');
  const reason  = decodeURIComponent(encodedReason);
  const guildId = interaction.values[0];

  await interaction.deferUpdate();

  const db      = await getDb();
  const network = Object.values(db.data.networks).find(n => n.guildId === guildId);
  if (!network) return;

  const guild = interaction.client.guilds.cache.get(guildId);
  if (!guild) {
    const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Bot Not Present`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('The bot is not in that server.'));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));
    await interaction.editReply({ components: [c], flags: CV2EPH });
    return;
  }

  const member = await guild.members.fetch(targetId).catch(() => null);
  const kicked  = member
    ? await member.kick(`[Network Kick] ${reason}`).then(() => true).catch(() => false)
    : false;

  const inf = await addInfraction(targetId, 'KICK', reason, interaction.user.id, network.id);

  const c = new ContainerBuilder().setAccentColor(kicked ? Colors.WARNING : Colors.DANGER);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `## ${kicked ? `${E.kick}  Kick Successful` : `${E.down}  Kick Failed`}`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**User** <@${targetId}>\n` +
    `**Server** ${network.name}\n` +
    `**Reason** ${reason}\n` +
    `**Infraction ID** \`${inf.id}\`\n` +
    `**Status** ${kicked ? 'Successfully kicked' : 'User was not in the server or kick failed'}`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));

  await interaction.editReply({ components: [c], flags: CV2EPH });
}

function noNetworkReply(interaction) {
  const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Not Registered`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('This server has not been registered in the network.'));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));
  return interaction.reply({ components: [c], flags: CV2EPH });
}

function noPerm(interaction) {
  const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Insufficient Permissions`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('Only Network Leaders and Administrators can use this command.'));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));
  return interaction.reply({ components: [c], flags: CV2EPH });
}
