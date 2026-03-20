export interface RoomUser {
  id: string;
  username: string;
  email: string;
}

export interface RoomParticipant {
  id: string;
  userId: string;
  joinedAt: string;
  user: RoomUser;
}

export interface Room {
  id: string;
  code: string;
  creatorId: string;
  maxPlayers: number;
  durationSec: number;
  bestOf: number;
  isActive: boolean;
  createdAt: string;
  creator: RoomUser;
  participants: RoomParticipant[];
}

export interface MatchHistoryStat {
  userId: string;
  wpm: number;
  accuracy: number;
  charactersTyped: number;
  correctCharacters: number;
  mistakes: number;
  user: {
    id: string;
    username: string;
  };
}

export interface MatchHistoryRound {
  id: string;
  roundNumber: number;
  startedAt: string | null;
  endedAt: string | null;
  stats: MatchHistoryStat[];
}

export interface MatchHistoryItem {
  id: string;
  winnerId: string | null;
  status: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  room?: {
    id: string;
    code: string;
  };
  rounds: MatchHistoryRound[];
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed");
  }

  return data as T;
}

export function extractRoomCode(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return (parts[parts.length - 1] ?? "").toUpperCase();
  } catch {
    return trimmed.toUpperCase();
  }
}

export async function createRoom(token: string, payload: { durationSec: 30 | 60 | 120; bestOf: 1 | 3 | 5 }) {
  const response = await fetch(`${apiBaseUrl}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  return parseResponse<{ room: Room }>(response);
}

export async function joinRoom(token: string, roomCodeInput: string) {
  const roomCode = extractRoomCode(roomCodeInput);

  const response = await fetch(`${apiBaseUrl}/rooms/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ roomCode })
  });

  return parseResponse<{ room: Room }>(response);
}

export async function getRoom(token: string, roomCode: string) {
  const response = await fetch(`${apiBaseUrl}/rooms/${roomCode}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  return parseResponse<{ room: Room }>(response);
}

export async function leaveRoom(token: string, roomCode: string) {
  const response = await fetch(`${apiBaseUrl}/rooms/${roomCode}/leave`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return parseResponse<{ message: string }>(response);
}

export async function startRoomMatch(token: string, roomCode: string) {
  const response = await fetch(`${apiBaseUrl}/rooms/${roomCode}/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return parseResponse<{
    match: {
      matchId: string;
      roundId: string;
      roomCode: string;
      status: "countdown";
    };
  }>(response);
}

export async function getMyRecentMatches(token: string, limit = 10) {
  const response = await fetch(`${apiBaseUrl}/rooms/me/matches?limit=${limit}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  return parseResponse<{ matches: MatchHistoryItem[] }>(response);
}

export async function getRoomRecentMatches(token: string, roomCode: string, limit = 10) {
  const response = await fetch(`${apiBaseUrl}/rooms/${roomCode}/matches?limit=${limit}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  return parseResponse<{ matches: MatchHistoryItem[] }>(response);
}
