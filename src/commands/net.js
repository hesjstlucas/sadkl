import {
  SlashCommandBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { execute as executeRegister } from './net/register.js';
import { executeBan }       from './net/ban.js';
import { executeBlacklist } from './net/blacklist.js';
import { executeKick }      from './net/kick.js';
import { executeManage }    from './net/manage.js';
import { executeSp }        from './net/sp.js';
import { executeStaff }     from './net/staff.js';

export const data = new SlashCommandBuilder()
  .setName('net')
  .setDescription('Paralix Network Management')

  // register
  .addSubcommand(sub =>
    sub.setName('register')
       .setDescription('Register this server into the Paralix Network')
       .addStringOption(o => o.setName('name').setDescription('Server display name').setRequired(true))
       .addStringOption(o => o.setName('invite').setDescription('Permanent invite link').setRequired(true))
       .addStringOption(o => o.setName('leadership').setDescription('Leadership user IDs (comma-separated)').setRequired(true))
       .addRoleOption(o => o.setName('member_role').setDescription('Community member role').setRequired(true))
       .addRoleOption(o => o.setName('blacklist_role').setDescription('Blacklist role').setRequired(true))
       .addRoleOption(o => o.setName('leadership_role').setDescription('Leadership role').setRequired(true))
       .addRoleOption(o => o.setName('hr_role').setDescription('Human Resources role').setRequired(true))
       .addRoleOption(o => o.setName('staff_role').setDescription('Staff role').setRequired(true))
  )

  // ban
  .addSubcommand(sub =>
    sub.setName('ban')
       .setDescription('Network-wide ban a user across all servers')
       .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
       .addStringOption(o => o.setName('reason').setDescription('Reason for ban'))
  )

  // blacklist
  .addSubcommand(sub =>
    sub.setName('blacklist')
       .setDescription('Strip all roles (except community member) and apply blacklist role network-wide')
       .addUserOption(o => o.setName('user').setDescription('User to blacklist').setRequired(true))
       .addStringOption(o => o.setName('reason').setDescription('Reason for blacklist'))
  )

  // kick
  .addSubcommand(sub =>
    sub.setName('kick')
       .setDescription('Kick a user from a specific network server')
       .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
       .addStringOption(o => o.setName('reason').setDescription('Reason for kick'))
  )

  // manage
  .addSubcommand(sub =>
    sub.setName('manage')
       .setDescription('View the network dashboard for this server')
  )

  // sp (support panel)
  .addSubcommand(sub =>
    sub.setName('sp')
       .setDescription('Post the network support panel in this channel')
  )

  // staff roster
  .addSubcommand(sub =>
    sub.setName('staff')
       .setDescription('View the staff roster for a network server')
       .addStringOption(o =>
         o.setName('server')
          .setDescription('Server to view (leave blank to pick from a list)')
          .setRequired(false)
       )
  );

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();

  switch (sub) {
    case 'register':  return executeRegister(interaction);
    case 'ban':       return executeBan(interaction);
    case 'blacklist': return executeBlacklist(interaction);
    case 'kick':      return executeKick(interaction);
    case 'manage':    return executeManage(interaction);
    case 'sp':        return executeSp(interaction);
    case 'staff':     return executeStaff(interaction);
  }
}
