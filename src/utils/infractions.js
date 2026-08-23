import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from './db.js';

export async function addInfraction(userId, type, reason, moderatorId, networkId) {
  const db = await getDb();
  if (!db.data.infractions[userId]) db.data.infractions[userId] = [];
  const infraction = {
    id: uuidv4(),
    type,
    reason,
    moderatorId,
    networkId,
    timestamp: Date.now(),
    active: true,
  };
  db.data.infractions[userId].push(infraction);
  await saveDb();
  return infraction;
}

export async function getInfractions(userId) {
  const db = await getDb();
  return db.data.infractions[userId] ?? [];
}

export async function removeInfraction(userId, infractionId) {
  const db = await getDb();
  const list = db.data.infractions[userId] ?? [];
  const target = list.find(i => i.id === infractionId);
  if (!target) return false;
  target.active = false;
  await saveDb();
  return true;
}

export async function getActiveInfractions(userId) {
  const list = await getInfractions(userId);
  return list.filter(i => i.active);
}
