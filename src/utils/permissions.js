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
  return network.leadership.includes(member.id);
}

export async function isAnyNetworkLeader(member) {
  await connectDb();
  if (member.permissions.has('Administrator')) return true;
  const networks = await Network.find().lean();
  return networks.some(n => n.leadership.includes(member.id));
}
