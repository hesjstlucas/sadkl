import {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
} from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import { connectDb, Network } from '../../utils/db.js';
import { Colors } from '../../utils/containers.js';
import { E } from '../../utils/emojis.js';

const CV2EPH = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

export async function execute(interaction) {
  await interaction.deferReply({ flags: CV2EPH });
  await connectDb();

  const name           = interaction.options.getString('name');
  const invite         = interaction.options.getString('invite');
  const leaderRaw      = interaction.options.getString('leadership');
  const memberRole     = interaction.options.getRole('member_role');
  const blRole         = interaction.options.getRole('blacklist_role');
  const leadershipRole = interaction.options.getRole('leadership_role');
  const hrRole         = interaction.options.getRole('hr_role');
  const staffRole      = interaction.options.getRole('staff_role');
  const guildId        = interaction.guildId;

  const leadership = leaderRaw.split(',').map(s => s.trim()).filter(Boolean);

  const existing = await Network.findOne({ guildId }).lean();
  if (existing) {
    const c = new ContainerBuilder().setAccentColor(Colors.DANGER);
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.down}  Already Registered`));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `This server is already registered as **${existing.name}**.\nContact a Network Leader to update the configuration.`
    ));
    c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
    c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Paralix Network Management'));
    return interaction.editReply({ components: [c], flags: CV2EPH });
  }

  const id = uuidv4();
  await Network.create({
    id, name, guildId, invite,
    memberRoleId:     memberRole.id,
    blacklistRoleId:  blRole.id,
    communityRoleId:  memberRole.id,
    leadershipRoleId: leadershipRole.id,
    hrRoleId:         hrRole.id,
    staffRoleId:      staffRole.id,
    leadership,
    registeredAt: Date.now(),
    registeredBy: interaction.user.id,
  });

  const c = new ContainerBuilder().setAccentColor(Colors.SUCCESS);
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${E.check}  Server Registered`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**${name}** has been successfully added to the Paralix Network.`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `**Network ID** \`${id}\`\n` +
    `**Invite** ${invite}\n` +
    `**Community Role** <@&${memberRole.id}>\n` +
    `**Blacklist Role** <@&${blRole.id}>\n` +
    `**Leadership Role** <@&${leadershipRole.id}>\n` +
    `**HR Role** <@&${hrRole.id}>\n` +
    `**Staff Role** <@&${staffRole.id}>\n` +
    `**Leadership IDs** ${leadership.map(l => `<@${l}>`).join(', ')}`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Paralix Network Management'));

  return interaction.editReply({ components: [c], flags: CV2EPH });
}
