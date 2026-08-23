import mongoose from 'mongoose';

// ─── Connection ────────────────────────────────────────────────────────────
let connected = false;

export async function connectDb() {
  if (connected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  connected = true;
  console.log('[DB] Connected to MongoDB');
}

// ─── Schemas ───────────────────────────────────────────────────────────────

const networkSchema = new mongoose.Schema({
  id:               { type: String, required: true, unique: true },
  name:             String,
  guildId:          String,
  invite:           String,
  memberRoleId:     String,
  blacklistRoleId:  String,
  communityRoleId:  String,
  leadershipRoleId: String,
  hrRoleId:         String,
  staffRoleId:      String,
  networkLeaderRoleId:    String,
  generalStaffRoleId:     String,
  iaStaffRoleId:          String,
  managementStaffRoleId:  String,
  serverLeaderRoleId:     String,
  leadership:       [String],
  registeredAt:     Number,
  registeredBy:     String,
}, { strict: false });

const infractionSchema = new mongoose.Schema({
  id:          { type: String, required: true, unique: true },
  userId:      String,
  type:        String,
  reason:      String,
  moderatorId: String,
  networkId:   String,
  timestamp:   Number,
  active:      Boolean,
});

const ticketSchema = new mongoose.Schema({
  id:               { type: String, required: true, unique: true },
  channelId:        String,
  guildId:          String,
  userId:           String,
  type:             String,
  networkId:        String,
  inquiry:          String,
  status:           String,
  claimedBy:        String,
  createdAt:        Number,
  closeRequestedAt: Number,
  closedAt:         Number,
});

// ─── Models ────────────────────────────────────────────────────────────────
export const Network    = mongoose.models.Network    || mongoose.model('Network',    networkSchema);
export const Infraction = mongoose.models.Infraction || mongoose.model('Infraction', infractionSchema);
export const Ticket     = mongoose.models.Ticket     || mongoose.model('Ticket',     ticketSchema);

// ─── Helper wrappers (drop-in replacements for old getDb/saveDb) ───────────

/**
 * Returns a plain object shaped like the old db.data so existing code
 * calling getDb() still works with minimal changes.
 * For new code, import the models directly.
 */
export async function getDb() {
  await connectDb();
  return {
    data: {
      networks:    await Network.find().lean().then(docs => Object.fromEntries(docs.map(d => [d.id, d]))),
      infractions: await Infraction.find().lean().then(docs => {
        const map = {};
        for (const d of docs) {
          if (!map[d.userId]) map[d.userId] = [];
          map[d.userId].push(d);
        }
        return map;
      }),
      tickets: await Ticket.find().lean().then(docs => Object.fromEntries(docs.map(d => [d.id, d]))),
    },
  };
}

/** No-op — writes happen immediately via mongoose methods in the helpers below */
export async function saveDb() {}
