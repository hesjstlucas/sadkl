import { getDb } from './db.js';

/**
 * Returns the registered network for a guild, or null.
 */
export async function getNetwork(guildId) {
  const db = await getDb();
  return Object.values(db.data.networks).find(n => n.guildId === guildId) ?? null;
}

/**
 * Returns ALL networks.
 */
export async function getAllNetworks() {
  const db = await getDb();
  return Object.values(db.data.networks);
}

/**
 * True if the member has Administrator or is in the network's leadership list.
 */
export async function isNetworkLeader(member, network) {
  if (!network) return false;
  if (member.permissions.has('Administrator')) return true;
  return network.leadership.includes(member.id);
}

/**
 * True if the member is a leader in ANY registered network.
 */
export async function isAnyNetworkLeader(member) {
  const db = await getDb();
  if (member.permissions.has('Administrator')) return true;
  for (const net of Object.values(db.data.networks)) {
    if (net.leadership.includes(member.id)) return true;
  }
  return false;
}
