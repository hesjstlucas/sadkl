import {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} from 'discord.js';
import { connectDb, Ticket } from '../utils/db.js';
import { Colors } from '../utils/containers.js';
import { E, eid } from '../utils/emojis.js';

const CV2    = MessageFlags.IsComponentsV2;
const EPH    = MessageFlags.Ephemeral;
const CV2EPH = CV2 | EPH;

const CLOSE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

// ─── Claim ─────────────────────────────────────────────────────────────────
export async function handleClaim(interaction) {
  await connectDb();
  const ticketId = interaction.customId.split(':')[1];
  const ticket   = await Ticket.findOne({ id: ticketId });

  if (!ticket) return interaction.reply({ content: '❌ Ticket not found.', flags: EPH });
  if (ticket.claimedBy) {
    return interaction.reply({
      content: `❌ This ticket is already claimed by <@${ticket.claimedBy}>.`,
      flags: EPH,
    });
  }

  ticket.claimedBy = interaction.user.id;
  await ticket.save();

  const c = new ContainerBuilder().setAccentColor(Colors.SUCCESS);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `## ${E.members}  Ticket Claimed\n<@${interaction.user.id}> has taken ownership of this ticket.`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));

  await interaction.reply({ components: [c], flags: CV2 });
}

// ─── Staff Panel ──────────────────────────────────────────────────────────
export async function handleStaffPanel(interaction) {
  await connectDb();
  const ticketId = interaction.customId.split(':')[1];
  const ticket   = await Ticket.findOne({ id: ticketId });

  if (!ticket) return interaction.reply({ content: '❌ Ticket not found.', flags: EPH });

  const panelC = new ContainerBuilder().setAccentColor(Colors.INFO);
  panelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.shield}  Staff Panel`));
  panelC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

  panelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${E.up}  Escalate**`));
  panelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    'Move this ticket up to the next tier (General → IA → Management).'
  ));
  panelC.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small));

  panelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${E.line}  Rename**`));
  panelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    'Rename the ticket channel to better reflect the issue.'
  ));
  panelC.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small));

  panelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**${E.member}  Add / Remove User**`));
  panelC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    'Grant or revoke access to this ticket channel.'
  ));
  panelC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  panelC.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));

  const escalateBtn = new ButtonBuilder()
    .setCustomId(`ticket_escalate:${ticketId}`)
    .setLabel('Escalate Ticket')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(eid(E.up));

  const renameBtn = new ButtonBuilder()
    .setCustomId(`ticket_rename:${ticketId}`)
    .setLabel('Rename Ticket')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(eid(E.line));

  const addUserBtn = new ButtonBuilder()
    .setCustomId(`ticket_add_user:${ticketId}`)
    .setLabel('Add User')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(eid(E.member));

  const removeUserBtn = new ButtonBuilder()
    .setCustomId(`ticket_remove_user:${ticketId}`)
    .setLabel('Remove User')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(eid(E.kick));

  const row = new ActionRowBuilder().addComponents(escalateBtn, renameBtn, addUserBtn, removeUserBtn);

  await interaction.reply({ components: [panelC, row], flags: CV2EPH });
}

// ─── Close Request ────────────────────────────────────────────────────────
export async function handleCloseRequest(interaction) {
  await connectDb();
  const ticketId = interaction.customId.split(':')[1];
  const ticket   = await Ticket.findOne({ id: ticketId });

  if (!ticket || ticket.status === 'closed') {
    return interaction.reply({ content: '❌ Ticket not found or already closed.', flags: EPH });
  }

  ticket.closeRequestedAt = Date.now();
  ticket.status = 'close_requested';
  await ticket.save();

  const c = new ContainerBuilder().setAccentColor(Colors.WARNING);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`<@${ticket.userId}>`));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.ticket}  Close Request Sent`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `<@${ticket.userId}>, a staff member has requested this ticket be closed.\n` +
    `You have **24 hours** to respond. If no response is received, this ticket will be automatically closed.\n\n` +
    `Click **Don't Close** if you still need assistance.`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));

  const dontClose = new ButtonBuilder()
    .setCustomId(`ticket_dont_close:${ticketId}`)
    .setLabel("Don't Close")
    .setStyle(ButtonStyle.Success)
    .setEmoji(eid(E.up));

  const confirmClose = new ButtonBuilder()
    .setCustomId(`ticket_confirm_close:${ticketId}`)
    .setLabel('Close Now')
    .setStyle(ButtonStyle.Danger)
    .setEmoji(eid(E.kick));

  const row = new ActionRowBuilder().addComponents(dontClose, confirmClose);

  await interaction.reply({ components: [c, row], flags: CV2 });

  setTimeout(async () => {
    await connectDb();
    const t = await Ticket.findOne({ id: ticketId });
    if (!t || t.status !== 'close_requested') return;
    await closeTicket(interaction.client, t, 'Auto-closed after 24-hour inactivity.');
  }, CLOSE_TIMEOUT_MS);
}

// ─── Don't Close ──────────────────────────────────────────────────────────
export async function handleDontClose(interaction) {
  await connectDb();
  const ticketId = interaction.customId.split(':')[1];
  const ticket   = await Ticket.findOne({ id: ticketId });

  if (!ticket) return interaction.reply({ content: '❌ Ticket not found.', flags: EPH });
  if (interaction.user.id !== ticket.userId) {
    return interaction.reply({ content: '❌ Only the ticket owner can cancel a close request.', flags: EPH });
  }

  ticket.status = 'open';
  ticket.closeRequestedAt = null;
  await ticket.save();

  const c = new ContainerBuilder().setAccentColor(Colors.SUCCESS);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `## ${E.check}  Close Request Cancelled\n<@${interaction.user.id}> still needs assistance. The close request has been withdrawn.`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));

  await interaction.update({ components: [c], flags: CV2 });
}

// ─── Confirm Close ────────────────────────────────────────────────────────
export async function handleConfirmClose(interaction) {
  await connectDb();
  const ticketId = interaction.customId.split(':')[1];
  const ticket   = await Ticket.findOne({ id: ticketId });

  if (!ticket) return interaction.reply({ content: '❌ Ticket not found.', flags: EPH });

  await interaction.deferUpdate();
  await closeTicket(interaction.client, ticket, `Closed by <@${interaction.user.id}>`);
}

// ─── Escalate ────────────────────────────────────────────────────────────
const ESCALATION_MAP = { general: 'ia', ia: 'management', management: 'management' };

export async function handleEscalate(interaction) {
  await connectDb();
  const ticketId = interaction.customId.split(':')[1];
  const ticket   = await Ticket.findOne({ id: ticketId });

  if (!ticket) return interaction.reply({ content: '❌ Ticket not found.', flags: EPH });

  const newType = ESCALATION_MAP[ticket.type] ?? ticket.type;
  if (newType === ticket.type) {
    return interaction.reply({ content: '⚠️ This ticket is already at the highest tier.', flags: EPH });
  }

  ticket.type = newType;
  await ticket.save();

  const c = new ContainerBuilder().setAccentColor(Colors.WARNING);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `## ${E.up}  Ticket Escalated\nThis ticket has been escalated to **${newType.toUpperCase()}** level.`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));

  await interaction.reply({ components: [c], flags: CV2 });
}

// ─── Rename ───────────────────────────────────────────────────────────────
export async function handleRename(interaction) {
  const ticketId = interaction.customId.split(':')[1];

  const modal = new ModalBuilder()
    .setCustomId(`ticket_rename_submit:${ticketId}`)
    .setTitle('Rename Ticket');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('new_name')
        .setLabel('New channel name')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. ban-appeal-johndoe')
        .setRequired(true)
        .setMaxLength(90)
    )
  );

  await interaction.showModal(modal);
}

export async function handleRenameSubmit(interaction) {
  const ticketId = interaction.customId.split(':')[1];
  const newName  = interaction.fields.getTextInputValue('new_name')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .slice(0, 90);

  await interaction.channel.setName(newName).catch(() => null);

  const c = new ContainerBuilder().setAccentColor(Colors.SUCCESS);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `## ${E.line}  Ticket Renamed\nChannel has been renamed to **${newName}**.`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));

  await interaction.reply({ components: [c], flags: CV2EPH });
}

// ─── Add User ─────────────────────────────────────────────────────────────
export async function handleAddUser(interaction) {
  const ticketId = interaction.customId.split(':')[1];

  const modal = new ModalBuilder()
    .setCustomId(`ticket_add_user_submit:${ticketId}`)
    .setTitle('Add User to Ticket');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('User ID')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter the Discord User ID')
        .setRequired(true)
    )
  );

  await interaction.showModal(modal);
}

export async function handleAddUserSubmit(interaction) {
  const ticketId = interaction.customId.split(':')[1];
  const userId   = interaction.fields.getTextInputValue('user_id').trim();

  await interaction.channel.permissionOverwrites.create(userId, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
  }).catch(() => null);

  const c = new ContainerBuilder().setAccentColor(Colors.SUCCESS);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `## ${E.member}  User Added\n<@${userId}> has been granted access to this ticket.`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));

  await interaction.reply({ components: [c], flags: CV2EPH });
}

// ─── Remove User ──────────────────────────────────────────────────────────
export async function handleRemoveUser(interaction) {
  const ticketId = interaction.customId.split(':')[1];

  const modal = new ModalBuilder()
    .setCustomId(`ticket_remove_user_submit:${ticketId}`)
    .setTitle('Remove User from Ticket');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('User ID')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter the Discord User ID')
        .setRequired(true)
    )
  );

  await interaction.showModal(modal);
}

export async function handleRemoveUserSubmit(interaction) {
  const ticketId = interaction.customId.split(':')[1];
  const userId   = interaction.fields.getTextInputValue('user_id').trim();

  await interaction.channel.permissionOverwrites.delete(userId).catch(() => null);

  const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `## ${E.kick}  User Removed\n<@${userId}> has been removed from this ticket.`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Vyron Development'));

  await interaction.reply({ components: [c], flags: CV2EPH });
}

// ─── Internal close helper ────────────────────────────────────────────────
async function closeTicket(client, ticket, reason) {
  ticket.status   = 'closed';
  ticket.closedAt = Date.now();
  await ticket.save();

  const channel = client.channels.cache.get(ticket.channelId);
  if (!channel) return;

  const c = new ContainerBuilder().setAccentColor(0x4e5058);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.kick}  Ticket Closed`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**Reason** ${reason}\n**Closed At** <t:${Math.floor(Date.now() / 1000)}:F>`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    '-# This channel will be deleted in 10 seconds. · Vyron Development'
  ));

  await channel.send({ components: [c], flags: CV2 }).catch(() => null);
  setTimeout(() => channel.delete('Ticket closed').catch(() => null), 10_000);
}
