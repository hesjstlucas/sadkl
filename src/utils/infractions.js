import { v4 as uuidv4 } from 'uuid';
import { connectDb, Infraction } from './db.js';

export async function addInfraction(userId, type, reason, moderatorId, networkId) {
  await connectDb();
  const infraction = await Infraction.create({
    id: uuidv4(),
    userId,
    type,
    reason,
    moderatorId,
    networkId,
    timestamp: Date.now(),
    active: true,
  });
  return infraction.toObject();
}

export async function getInfractions(userId) {
  await connectDb();
  return Infraction.find({ userId }).lean();
}

export async function getActiveInfractions(userId) {
  await connectDb();
  return Infraction.find({ userId, active: true }).lean();
}

export async function removeInfraction(userId, infractionId) {
  await connectDb();
  const result = await Infraction.findOneAndUpdate(
    { id: infractionId, userId },
    { active: false },
  );
  return !!result;
}
