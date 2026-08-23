import { InteractionType } from 'discord.js';
import * as spHandlers from '../commands/net/sp.js';
import {
  handleClaim,
  handleStaffPanel,
  handleCloseRequest,
  handleDontClose,
  handleConfirmClose,
  handleEscalate,
  handleRename,
  handleRenameSubmit,
  handleAddUser,
  handleAddUserSubmit,
  handleRemoveUser,
  handleRemoveUserSubmit,
} from '../handlers/ticketActions.js';
import { handleKickSelect }        from '../commands/net/kick.js';
import { handleStaffServerSelect } from '../commands/net/staff.js';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction, client) {
  // ── Slash commands ──────────────────────────────────────────────────────
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`[CMD ERROR] ${interaction.commandName}:`, err);
      const reply = { content: '❌ An error occurred while running this command.', ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(reply).catch(() => null);
      } else {
        await interaction.reply(reply).catch(() => null);
      }
    }
    return;
  }

  // ── Select menus ────────────────────────────────────────────────────────
  if (interaction.isStringSelectMenu()) {
    const id = interaction.customId;

    if (id.startsWith('sp_type_select:'))     return spHandlers.handleTypeSelect(interaction);
    if (id.startsWith('sp_server_select:'))   return spHandlers.handleServerSelect(interaction);
    if (id.startsWith('kick_server_select:')) return handleKickSelect(interaction);
    if (id === 'staff_server_select')         return handleStaffServerSelect(interaction);
  }

  // ── Buttons ─────────────────────────────────────────────────────────────
  if (interaction.isButton()) {
    const id = interaction.customId;

    if (id.startsWith('sp_open_modal:'))          return spHandlers.handleOpenModal(interaction);
    if (id.startsWith('ticket_claim:'))            return handleClaim(interaction);
    if (id.startsWith('ticket_staff_panel:'))      return handleStaffPanel(interaction);
    if (id.startsWith('ticket_close_request:'))    return handleCloseRequest(interaction);
    if (id.startsWith('ticket_dont_close:'))       return handleDontClose(interaction);
    if (id.startsWith('ticket_confirm_close:'))    return handleConfirmClose(interaction);
    if (id.startsWith('ticket_escalate:'))         return handleEscalate(interaction);
    if (id.startsWith('ticket_rename:'))           return handleRename(interaction);
    if (id.startsWith('ticket_add_user:'))         return handleAddUser(interaction);
    if (id.startsWith('ticket_remove_user:'))      return handleRemoveUser(interaction);
  }

  // ── Modals ──────────────────────────────────────────────────────────────
  if (interaction.type === InteractionType.ModalSubmit) {
    const id = interaction.customId;

    if (id.startsWith('sp_inquiry_submit:'))          return spHandlers.handleInquirySubmit(interaction);
    if (id.startsWith('ticket_rename_submit:'))       return handleRenameSubmit(interaction);
    if (id.startsWith('ticket_add_user_submit:'))     return handleAddUserSubmit(interaction);
    if (id.startsWith('ticket_remove_user_submit:'))  return handleRemoveUserSubmit(interaction);
  }
}
