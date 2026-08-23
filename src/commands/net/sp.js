import {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';

const CV2    = MessageFlags.IsComponentsV2;
const EPH    = MessageFlags.Ephemeral;
const CV2EPH = CV2 | EPH;
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../../utils/db.js';
import { getNetwork, getAllNetworks } from '../../utils/permissions.js';
import { Colors } from '../../utils/containers.js';
import { E, eid } from '../../utils/emojis.js';

// ─── Image URLs — swap these out for your own hosted images ───────────────
// Must be publicly accessible HTTPS URLs (Discord CDN, Imgur, etc.)
export const IMAGES = {
  // Banner shown at the top of the support panel
  SUPPORT_PANEL_BANNER: 'https://cdn.discordapp.com/attachments/1535343009539817503/1541194627929874582/New_Project1.png?ex=6a8cb4d9&is=6a8b6359&hm=52f3d2b4009826cfa8b96908fac8337ef2036bc873cb2568b34ffdaefeb68864&',
  // Footer image shown at the bottom of the support panel
  SUPPORT_PANEL_FOOTER: 'https://cdn.discordapp.com/attachments/1535343009539817503/1541194781449785506/image.png?ex=6a8cb4fd&is=6a8b637d&hm=f59bca151d1cea2909a83ee8fa4925e753cdad14b3509f4ef13309cabf7c1d0a&',
  // Banner shown at the top of ticket info
  TICKET_BANNER:        'https://cdn.discordapp.com/attachments/1535343009539817503/1541194627929874582/New_Project1.png?ex=6a8cb4d9&is=6a8b6359&hm=52f3d2b4009826cfa8b96908fac8337ef2036bc873cb2568b34ffdaefeb68864&',
  // Footer image shown at the bottom of ticket info
  TICKET_FOOTER:        'https://cdn.discordapp.com/attachments/1535343009539817503/1541194781449785506/image.png?ex=6a8cb4fd&is=6a8b637d&hm=f59bca151d1cea2909a83ee8fa4925e753cdad14b3509f4ef13309cabf7c1d0a&',
};

// ─── Helper: single-image MediaGallery ────────────────────────────────────
function mediaImage(url, description = '') {
  return new MediaGalleryBuilder().addItems(
    new MediaGalleryItemBuilder().setURL(url).setDescription(description)
  );
}

// ─── Ticket types config ───────────────────────────────────────────────────
const TICKET_TYPES = [
  {
    label:        'Network Leadership',
    value:        'network_leadership',
    emoji:        E.network,
    description:  'Direct line to Network Leadership.',
    categoryName: 'Network Leadership',
    staffRoleKey: 'networkLeaderRoleId',
  },
  {
    label:        'Server Leadership',
    value:        'server_leadership',
    emoji:        E.members,
    description:  "Contact a specific server's leadership team.",
    categoryName: 'Server Leadership',
    staffRoleKey: null,
  },
];

// ─── /net sp — post the support panel ─────────────────────────────────────
export async function executeSp(interaction) {
  await interaction.deferReply({ flags: CV2EPH });

  const network = await getNetwork(interaction.guildId);
  if (!network) {
    const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `## ${E.down}  Not Registered\nRegister this server with \`/net register\` before posting the support panel.`
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Paralix Network Management'));
    return interaction.editReply({ components: [c], flags: CV2EPH });
  }

  // ── Support panel container ──────────────────────────────────────────────
  const panel = new ContainerBuilder().setAccentColor(Colors.DEFAULT);

  // BANNER (top)
  panel.addMediaGalleryComponents(
    mediaImage(IMAGES.SUPPORT_PANEL_BANNER, `${network.name} Support`)
  );

  panel.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small));
  panel.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `# ${E.ticket}  ${network.name} Support Desk`
  ));
  panel.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large));

  panel.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `Welcome to the **${network.name}** support portal. Select a ticket category below that best ` +
    `matches your concern. Be specific and professional — vague requests may be closed without action.\n\n` +
    `> ⚠️  **Do not ping staff members.** All tickets are reviewed in order of priority. ` +
    `Misuse of this system will result in disciplinary action.`
  ));
  panel.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

  for (const t of TICKET_TYPES) {
    panel.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**${t.emoji}  ${t.label}**`
    ));
    panel.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `> ${t.description}`
    ));
    panel.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small));
  }

  panel.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

  // FOOTER text
  panel.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `-# ${network.name}  ·  Powered by Paralix Network  ·  Do not misuse this system.`
  ));

  // FOOTER image (bottom)
  panel.addMediaGalleryComponents(
    mediaImage(IMAGES.SUPPORT_PANEL_FOOTER, `${network.name}`)
  );

  // ── Dropdown ──
  const select = new StringSelectMenuBuilder()
    .setCustomId(`sp_type_select:${interaction.guildId}`)
    .setPlaceholder(`${network.name} Support Desk`)
    .addOptions(
      TICKET_TYPES.map(t =>
        new StringSelectMenuOptionBuilder()
          .setLabel(t.label)
          .setValue(t.value)
          .setEmoji(t.emoji)
          .setDescription(t.description.slice(0, 50))
      )
    );

  const row = new ActionRowBuilder().addComponents(select);

  await interaction.channel.send({ components: [panel, row], flags: CV2 });
  await interaction.editReply({ content: '✅ Support panel posted.', flags: EPH });
}

// ─── Step 1: User picks a ticket type ──────────────────────────────────────
export async function handleTypeSelect(interaction) {
  const type    = interaction.values[0];
  const guildId = interaction.customId.split(':')[1];

  if (type === 'server_leadership') {
    const allNets = await getAllNetworks();
    if (!allNets.length) {
      await interaction.reply({ content: 'No network servers are currently registered.', flags: MessageFlags.Ephemeral });
      return;
    }

    const serverSelect = new StringSelectMenuBuilder()
      .setCustomId(`sp_server_select:${guildId}`)
      .setPlaceholder('Which server?')
      .addOptions(
        allNets.map(n =>
          new StringSelectMenuOptionBuilder().setLabel(n.name).setValue(n.id)
        )
      );

    const c = new ContainerBuilder().setAccentColor(Colors.INFO);
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.members}  Server Leadership — Select a Server`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      'Select which server\'s leadership you need to reach.'
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Paralix Network Management'));

    await interaction.reply({
      components: [c, new ActionRowBuilder().addComponents(serverSelect)],
      flags: CV2EPH,
    });
    return;
  }

  await promptInquiry(interaction, type, null);
}

// ─── Step 2 (server_leadership path): User picks a server ──────────────────
export async function handleServerSelect(interaction) {
  const networkId = interaction.values[0];
  await promptInquiry(interaction, 'server_leadership', networkId);
}

// ─── Step 3: Show inquiry prompt ───────────────────────────────────────────
async function promptInquiry(interaction, type, networkId) {
  const key = networkId ? `${type}:${networkId}` : type;

  const c = new ContainerBuilder().setAccentColor(Colors.INFO);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.ticket}  Describe Your Inquiry`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    'Please describe your concern clearly and include any relevant details, usernames, or evidence.\n' +
    '> Once submitted, a ticket channel will be created for you.'
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Paralix Network Management'));

  const btn = new ButtonBuilder()
    .setCustomId(`sp_open_modal:${key}`)
    .setLabel('Enter Inquiry')
    .setStyle(ButtonStyle.Primary)
    .setEmoji(eid(E.line));

  const fn = interaction.replied || interaction.deferred ? 'editReply' : 'reply';
  await interaction[fn]({
    components: [c, new ActionRowBuilder().addComponents(btn)],
    flags: CV2EPH,
  });
}

// ─── Step 4: Open modal ────────────────────────────────────────────────────
export async function handleOpenModal(interaction) {
  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: AR } = await import('discord.js');
  const key = interaction.customId.replace('sp_open_modal:', '');

  const modal = new ModalBuilder()
    .setCustomId(`sp_inquiry_submit:${key}`)
    .setTitle('Support Inquiry');

  modal.addComponents(
    new AR().addComponents(
      new TextInputBuilder()
        .setCustomId('inquiry')
        .setLabel('What do you need help with?')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Be specific. Include names, dates, screenshots if relevant.')
        .setRequired(true)
        .setMaxLength(1000)
    )
  );

  await interaction.showModal(modal);
}

// ─── Step 5: Modal submitted — create the ticket channel ──────────────────
export async function handleInquirySubmit(interaction) {
  await interaction.deferReply({ flags: CV2EPH });

  const key     = interaction.customId.replace('sp_inquiry_submit:', '');
  const inquiry = interaction.fields.getTextInputValue('inquiry');
  const guild   = interaction.guild;
  const db      = await getDb();
  const network = await getNetwork(guild.id);

  if (!network) {
    await interaction.editReply({ content: '❌ Network config not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  let type      = key;
  let networkId = null;

  if (key.startsWith('server_leadership:')) {
    type      = 'server_leadership';
    networkId = key.split(':')[1];
  }

  const typeConfig = TICKET_TYPES.find(t => t.value === type);
  const ticketId   = uuidv4().slice(0, 8).toUpperCase();

  // ── Find or create category ──
  let category = guild.channels.cache.find(
    ch => ch.type === ChannelType.GuildCategory &&
          ch.name.toLowerCase() === typeConfig.categoryName.toLowerCase()
  );
  if (!category) {
    category = await guild.channels.create({
      name: typeConfig.categoryName,
      type: ChannelType.GuildCategory,
    });
  }

  // ── Determine staff role ──
  let staffRoleId = network[typeConfig.staffRoleKey] ?? null;
  if (type === 'server_leadership' && networkId) {
    const targetNet = db.data.networks[networkId];
    staffRoleId = targetNet?.serverLeaderRoleId ?? null;
  }

  // ── Network servers this user is in ──
  const allNets    = await getAllNetworks();
  const memberNets = [];
  for (const net of allNets) {
    const g = interaction.client.guilds.cache.get(net.guildId);
    if (!g) continue;
    const m = await g.members.fetch(interaction.user.id).catch(() => null);
    if (m) memberNets.push(net.name);
  }

  // ── Channel permissions ──
  const permOverwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: interaction.user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
    },
  ];
  if (staffRoleId) {
    permOverwrites.push({
      id: staffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  const ticketChannel = await guild.channels.create({
    name:  `${type.replace(/_/g, '-')}-${interaction.user.username}-${ticketId}`,
    type:  ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: permOverwrites,
    topic: `Ticket ${ticketId} | ${interaction.user.tag} | ${typeConfig.label}`,
  });

  // ── Save to db ──
  db.data.tickets[ticketId] = {
    id:               ticketId,
    channelId:        ticketChannel.id,
    guildId:          guild.id,
    userId:           interaction.user.id,
    type,
    networkId,
    inquiry,
    status:           'open',
    claimedBy:        null,
    createdAt:        Date.now(),
    closeRequestedAt: null,
  };
  await saveDb();

  // ── Ticket info container ─────────────────────────────────────────────────
  const info = new ContainerBuilder().setAccentColor(Colors.DEFAULT);

  // BANNER (top)
  info.addMediaGalleryComponents(
    mediaImage(IMAGES.TICKET_BANNER, `${typeConfig.label} — Ticket ${ticketId}`)
  );

  info.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small));
  info.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `# ${E.ticket}  ${typeConfig.label} Ticket`
  ));
  info.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large));

  // User info block
  info.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**Discord User** <@${interaction.user.id}>\n` +
    `**Discord ID** \`${interaction.user.id}\`\n` +
    `**Ticket ID** \`${ticketId}\``
  ));
  info.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

  // Network server membership
  info.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**Servers in Network**\n` +
    (memberNets.length
      ? memberNets.map(n => `› ${n}`).join('\n')
      : '— Not found in any registered network server')
  ));
  info.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));

  // Inquiry
  info.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**Inquiry**\n${inquiry}`
  ));
  info.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large));

  // Footer text
  info.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `-# ${network.name}  ·  Paralix Network  ·  Opened <t:${Math.floor(Date.now() / 1000)}:R>`
  ));

  // FOOTER image (bottom)
  info.addMediaGalleryComponents(
    mediaImage(IMAGES.TICKET_FOOTER, network.name)
  );

  // ── Buttons ──
  const claimBtn = new ButtonBuilder()
    .setCustomId(`ticket_claim:${ticketId}`)
    .setLabel('Claim')
    .setStyle(ButtonStyle.Success)
    .setEmoji(eid(E.members));

  const closeBtn = new ButtonBuilder()
    .setCustomId(`ticket_close_request:${ticketId}`)
    .setLabel('Request Close')
    .setStyle(ButtonStyle.Danger)
    .setEmoji(eid(E.kick));

  const addUserBtn = new ButtonBuilder()
    .setCustomId(`ticket_add_user:${ticketId}`)
    .setLabel('Add User')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(eid(E.member));

  const removeUserBtn = new ButtonBuilder()
    .setCustomId(`ticket_remove_user:${ticketId}`)
    .setLabel('Remove User')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji(eid(E.line));

  const staffPanelBtn = new ButtonBuilder()
    .setCustomId(`ticket_staff_panel:${ticketId}`)
    .setLabel('Staff Panel')
    .setStyle(ButtonStyle.Primary)
    .setEmoji(eid(E.shield));

  const btnRow = new ActionRowBuilder().addComponents(
    claimBtn, closeBtn, addUserBtn, removeUserBtn, staffPanelBtn
  );

  // With IS_COMPONENTS_V2, content field is not allowed — ping via TextDisplay instead
  const pingParts = [`<@${interaction.user.id}>`];
  if (staffRoleId) pingParts.push(`<@&${staffRoleId}>`);
  info.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(pingParts.join(' '))
  );

  await ticketChannel.send({ components: [info, btnRow], flags: CV2 });

  // ── Confirm to user ──
  const confirmC = new ContainerBuilder().setAccentColor(Colors.SUCCESS);
  confirmC.addTextDisplayComponents(new TextDisplayBuilder().setContent('## ✅  Ticket Created'));
  confirmC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  confirmC.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `Your ticket has been opened: <#${ticketChannel.id}>\n**Ticket ID** \`${ticketId}\``
  ));
  confirmC.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  confirmC.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Paralix Network Management'));

  await interaction.editReply({ components: [confirmC], flags: CV2EPH });
}
