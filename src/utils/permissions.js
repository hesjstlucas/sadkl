import { connectDb, Network } from './db.js';

export async function getNetwork(guildId) {
  await connectDb();
  return Network.findOne({ guildId }).lean();
}

export async function getAllNetworks() {
  await connectDb();
  return Network.find().lean();
}

export async function isNetworkLeader(member, network) {
  if (!network) return false;
  if (member.permissions.has('Administrator')) return true;
  // Use the leadership role — no more hardcoded ID list
  if (network.leadershipRoleId && member.roles.cache.has(network.leadershipRoleId)) return true;
  return false;
}

export async function isAnyNetworkLeader(member) {
  await connectDb();
  if (member.permissions.has('Administrator')) return true;
  const networks = await Network.find().lean();
  return networks.some(n => n.leadershipRoleId && member.roles.cache.has(n.leadershipRoleId));
}
