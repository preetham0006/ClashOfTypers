import { PrismaClient } from "@prisma/client";
import { emitRoomEvent } from "../socket/socket-state.js";
import { pickRandomParagraph } from "./paragraphs.js";
import { getRoomByCode } from "../rooms/room.service.js";

const prisma = new PrismaClient();

interface ParticipantProgress {
  userId: string;
  username: string;
  typedLength: number;
  correctCharacters: number;
  mistakes: number;
  wpm: number;
  accuracy: number;
}

interface MatchSession {
  roomCode: string;
  roomId: string;
  matchId: string;
  roundId: string;
  paragraph: string;
  durationSec: number;
  countdownRemainingSec: number;
  phase: "countdown" | "running" | "ended";
  startedAtMs: number | null;
  endAtMs: number | null;
  participants: Map<string, { username: string }>;
  progress: Map<string, ParticipantProgress>;
  countdownInterval?: NodeJS.Timeout;
  roundTimeout?: NodeJS.Timeout;
}

const activeSessions = new Map<string, MatchSession>();

function toStandings(session: MatchSession): ParticipantProgress[] {
  return Array.from(session.progress.values()).sort((left, right) => {
    if (right.correctCharacters !== left.correctCharacters) {
      return right.correctCharacters - left.correctCharacters;
    }

    return right.accuracy - left.accuracy;
  });
}

export function getMatchState(roomCode: string) {
  const session = activeSessions.get(roomCode.toUpperCase());

  if (!session) {
    return null;
  }

  return {
    phase: session.phase,
    paragraph: session.paragraph,
    durationSec: session.durationSec,
    countdownRemainingSec: session.countdownRemainingSec,
    startedAtMs: session.startedAtMs,
    endAtMs: session.endAtMs,
    standings: toStandings(session)
  };
}

async function endRound(roomCode: string) {
  const normalizedCode = roomCode.toUpperCase();
  const session = activeSessions.get(normalizedCode);

  if (!session || session.phase === "ended") {
    return;
  }

  session.phase = "ended";
  session.endAtMs = Date.now();

  if (session.countdownInterval) {
    clearInterval(session.countdownInterval);
  }

  if (session.roundTimeout) {
    clearTimeout(session.roundTimeout);
  }

  const standings = toStandings(session);

  await prisma.round.update({
    where: { id: session.roundId },
    data: {
      endedAt: new Date()
    }
  });

  await prisma.playerRoundStat.deleteMany({
    where: { roundId: session.roundId }
  });

  for (const result of standings) {
    await prisma.playerRoundStat.create({
      data: {
        roundId: session.roundId,
        userId: result.userId,
        wpm: result.wpm,
        accuracy: result.accuracy,
        charactersTyped: result.typedLength,
        correctCharacters: result.correctCharacters,
        mistakes: result.mistakes
      }
    });
  }

  const winnerUserId = standings[0]?.userId ?? null;

  await prisma.match.update({
    where: { id: session.matchId },
    data: {
      status: "COMPLETED",
      endedAt: new Date(),
      winnerId: winnerUserId
    }
  });

  emitRoomEvent(normalizedCode, "room:matchEnd", {
    roomCode: normalizedCode,
    winnerUserId,
    standings
  });
}

function beginRound(session: MatchSession) {
  session.phase = "running";
  session.startedAtMs = Date.now();
  session.endAtMs = session.startedAtMs + session.durationSec * 1000;

  emitRoomEvent(session.roomCode, "room:matchStart", {
    roomCode: session.roomCode,
    paragraph: session.paragraph,
    durationSec: session.durationSec,
    startedAtMs: session.startedAtMs,
    endAtMs: session.endAtMs
  });

  session.roundTimeout = setTimeout(() => {
    void endRound(session.roomCode);
  }, session.durationSec * 1000);
}

export async function startMatch(roomCode: string, requestedByUserId: string) {
  const normalizedCode = roomCode.toUpperCase();
  const room = await getRoomByCode(normalizedCode);

  if (!room) {
    return { error: "Room not found" as const };
  }

  if (room.creatorId !== requestedByUserId) {
    return { error: "Only host can start match" as const };
  }

  if (room.participants.length < 2) {
    return { error: "At least 2 players are required" as const };
  }

  const existing = activeSessions.get(normalizedCode);
  if (existing && existing.phase !== "ended") {
    return { error: "Match already in progress" as const };
  }

  const paragraph = pickRandomParagraph();

  const createdMatch = await prisma.match.create({
    data: {
      roomId: room.id,
      status: "IN_PROGRESS",
      bestOf: room.bestOf,
      durationSec: room.durationSec,
      startedAt: new Date()
    }
  });

  const createdRound = await prisma.round.create({
    data: {
      matchId: createdMatch.id,
      roundNumber: 1,
      paragraph,
      startedAt: new Date()
    }
  });

  const session: MatchSession = {
    roomCode: normalizedCode,
    roomId: room.id,
    matchId: createdMatch.id,
    roundId: createdRound.id,
    paragraph,
    durationSec: room.durationSec,
    countdownRemainingSec: 3,
    phase: "countdown",
    startedAtMs: null,
    endAtMs: null,
    participants: new Map(),
    progress: new Map()
  };

  for (const participant of room.participants) {
    session.participants.set(participant.userId, { username: participant.user.username });
    session.progress.set(participant.userId, {
      userId: participant.userId,
      username: participant.user.username,
      typedLength: 0,
      correctCharacters: 0,
      mistakes: 0,
      wpm: 0,
      accuracy: 100
    });
  }

  activeSessions.set(normalizedCode, session);

  emitRoomEvent(normalizedCode, "room:matchCountdown", {
    roomCode: normalizedCode,
    secondsRemaining: session.countdownRemainingSec
  });

  session.countdownInterval = setInterval(() => {
    const latest = activeSessions.get(normalizedCode);
    if (!latest || latest.phase !== "countdown") {
      return;
    }

    latest.countdownRemainingSec -= 1;

    if (latest.countdownRemainingSec > 0) {
      emitRoomEvent(normalizedCode, "room:matchCountdown", {
        roomCode: normalizedCode,
        secondsRemaining: latest.countdownRemainingSec
      });
      return;
    }

    if (latest.countdownInterval) {
      clearInterval(latest.countdownInterval);
    }

    beginRound(latest);
  }, 1000);

  return {
    matchId: createdMatch.id,
    roundId: createdRound.id,
    roomCode: normalizedCode,
    status: "countdown" as const
  };
}

export function submitTypingProgress(
  roomCode: string,
  userId: string,
  payload: { typedLength: number; correctCharacters: number; mistakes: number }
) {
  const normalizedCode = roomCode.toUpperCase();
  const session = activeSessions.get(normalizedCode);

  if (!session || session.phase !== "running" || !session.startedAtMs) {
    return { error: "No active round" as const };
  }

  const participant = session.participants.get(userId);
  if (!participant) {
    return { error: "User not in active room" as const };
  }

  const maxLength = session.paragraph.length;
  const typedLength = Math.max(0, Math.min(payload.typedLength, maxLength));
  const correctCharacters = Math.max(0, Math.min(payload.correctCharacters, typedLength));
  const mistakes = Math.max(0, Math.min(payload.mistakes, typedLength));

  const elapsedMinutes = Math.max((Date.now() - session.startedAtMs) / 60000, 1 / 120);
  const wpm = Number(((correctCharacters / 5) / elapsedMinutes).toFixed(2));
  const accuracy = typedLength === 0 ? 100 : Number(((correctCharacters / typedLength) * 100).toFixed(2));

  session.progress.set(userId, {
    userId,
    username: participant.username,
    typedLength,
    correctCharacters,
    mistakes,
    wpm,
    accuracy
  });

  const standings = toStandings(session);

  emitRoomEvent(normalizedCode, "room:progress", {
    roomCode: normalizedCode,
    standings
  });

  return { success: true as const };
}
