import {
  createPkBattle,
  getActivePkBattleForRoom,
  getPkBattleById,
  respondToPkBattle,
} from "../api/pkBattleApi";
import { isSameUser } from "./relationshipService";

const firstDefined = (...values) => values.find((v) => v !== undefined && v !== null);

/** Normalizes whatever shape the backend returns for a PK battle (create,
 *  respond, active-card and by-id all return "a battle") into one consistent
 *  object the UI can rely on, regardless of exact backend field naming. */
export const normalizePkBattle = (data) => {
  const raw = data?.data ?? data?.battle ?? data;
  if (!raw || typeof raw !== "object") return null;

  const id = firstDefined(raw.id, raw.battleId, raw.pkBattleId);
  if (id == null) return null;

  const teamAMemberIds = Array.isArray(raw.teamAMemberIds)
    ? raw.teamAMemberIds.map(String)
    : [];
  const teamBMemberIds = Array.isArray(raw.teamBMemberIds)
    ? raw.teamBMemberIds.map(String)
    : [];

  return {
    id: String(id),
    roomId: raw.roomId != null ? String(raw.roomId) : null,
    status: String(raw.status ?? raw.state ?? "PENDING").toUpperCase(),
    hostAId: firstDefined(raw.hostAId, raw.hostId, raw.creatorId, raw.ownerId) ?? null,
    hostBId: firstDefined(raw.hostBId, raw.opponentHostId, raw.opponentId) ?? null,
    hostAName: firstDefined(raw.hostAName, raw.hostName, raw.creatorName) ?? null,
    hostBName: firstDefined(raw.hostBName, raw.opponentHostName, raw.opponentName) ?? null,
    hostAAvatar: firstDefined(raw.hostAAvatar, raw.hostAvatar) ?? null,
    hostBAvatar: firstDefined(raw.hostBAvatar, raw.opponentAvatar) ?? null,
    teamAMemberIds,
    teamBMemberIds,
    teamAScore: Number(firstDefined(raw.teamAScore, raw.scoreA, raw.hostAScore, 0)) || 0,
    teamBScore: Number(firstDefined(raw.teamBScore, raw.scoreB, raw.hostBScore, 0)) || 0,
    durationSeconds: Number(firstDefined(raw.durationSeconds, raw.duration, 0)) || 0,
    startedAt: raw.startedAt ?? raw.startAt ?? null,
    endsAt: raw.endsAt ?? raw.endAt ?? null,
    winner: raw.winner ?? raw.winnerTeam ?? null,
    raw,
  };
};

/** Room owner starts a PK challenge against another host in the room. */
export const startPkBattle = async ({ roomId, opponentHostId, durationMinutes, teamAMemberIds }) => {
  const data = await createPkBattle({
    roomId,
    opponentHostId,
    durationSeconds: Math.max(1, Math.round(Number(durationMinutes) * 60)),
    teamAMemberIds,
  });
  return normalizePkBattle(data);
};

/** The challenged host accepts (optionally naming teammates) or rejects. */
export const respondPkBattle = async (battleId, accepted, teamBMemberIds) => {
  const data = await respondToPkBattle(battleId, { accepted, teamBMemberIds });
  return normalizePkBattle(data);
};

/** The room's current pending/live PK card, or null if there isn't one. */
export const loadActivePkBattle = async (roomId) => {
  try {
    const data = await getActivePkBattleForRoom(roomId);
    return normalizePkBattle(data);
  } catch (err) {
    if (err?.status === 404) return null;
    throw err;
  }
};

export const loadPkBattle = async (battleId) => normalizePkBattle(await getPkBattleById(battleId));

export const isPkBattlePending = (battle) => battle?.status === "PENDING";
export const isPkBattleLive = (battle) => battle?.status === "LIVE";
export const isPkBattleOver = (battle) =>
  battle?.status === "COMPLETED" ||
  battle?.status === "DRAW" ||
  battle?.status === "CANCELLED" ||
  battle?.status === "REJECTED";

/** Where does `myUserId` stand relative to this battle? Drives which UI
 *  (accept/reject prompt vs. waiting banner vs. live scoreboard) to show. */
export const getPkBattleRole = (battle, myUserId) => {
  if (!battle || myUserId == null) return "bystander";
  if (isSameUser(battle.hostAId, myUserId)) return "hostA";
  if (isSameUser(battle.hostBId, myUserId)) return "hostB";
  if (battle.teamAMemberIds.some((id) => isSameUser(id, myUserId))) return "teamA";
  if (battle.teamBMemberIds.some((id) => isSameUser(id, myUserId))) return "teamB";
  return "bystander";
};
