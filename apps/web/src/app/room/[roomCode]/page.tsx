"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getRoom, leaveRoom, startRoomMatch, type Room } from "../../../lib/api/rooms";
import { createSocket } from "../../../lib/socket";
import { useAuthStore } from "../../../store/auth.store";

type MatchPhase = "idle" | "countdown" | "running" | "ended";

interface MatchStanding {
  userId: string;
  username: string;
  typedLength: number;
  correctCharacters: number;
  mistakes: number;
  wpm: number;
  accuracy: number;
}

function getTypingStats(paragraph: string, typedText: string) {
  const limitedTyped = typedText.slice(0, paragraph.length);
  let correctCharacters = 0;

  for (let index = 0; index < limitedTyped.length; index += 1) {
    if (limitedTyped[index] === paragraph[index]) {
      correctCharacters += 1;
    }
  }

  return {
    typedLength: limitedTyped.length,
    correctCharacters,
    mistakes: Math.max(0, limitedTyped.length - correctCharacters),
    value: limitedTyped
  };
}

export default function RoomPage() {
  const params = useParams<{ roomCode: string }>();
  const router = useRouter();
  const roomCode = useMemo(() => (params?.roomCode ?? "").toUpperCase(), [params?.roomCode]);
  const { token, user, isHydrating, hydrateUser } = useAuthStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [phase, setPhase] = useState<MatchPhase>("idle");
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const [paragraph, setParagraph] = useState("");
  const [typedText, setTypedText] = useState("");
  const [endAtMs, setEndAtMs] = useState<number | null>(null);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [standings, setStandings] = useState<MatchStanding[]>([]);
  const [winnerUserId, setWinnerUserId] = useState<string | null>(null);
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);

  useEffect(() => {
    void hydrateUser();
  }, [hydrateUser]);

  useEffect(() => {
    if (!isHydrating && !user) {
      router.replace("/login");
    }
  }, [isHydrating, router, user]);

  useEffect(() => {
    if (!token || !roomCode) {
      return;
    }

    const authToken = token;

    let isMounted = true;

    async function loadRoom() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getRoom(authToken, roomCode);
        if (isMounted) {
          setRoom(response.room);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load room");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRoom();

    return () => {
      isMounted = false;
    };
  }, [token, roomCode]);

  useEffect(() => {
    if (!token || !roomCode) {
      return;
    }

    const socket = createSocket(token);
    socketRef.current = socket;

    socket.connect();
    socket.emit("room:subscribe", { roomCode });

    socket.on("room:update", (payload: { room: Room }) => {
      setRoom(payload.room);
    });

    socket.on(
      "room:matchState",
      (payload: {
        phase: "countdown" | "running" | "ended";
        paragraph: string;
        durationSec: number;
        countdownRemainingSec: number;
        startedAtMs: number | null;
        endAtMs: number | null;
        standings: MatchStanding[];
      }) => {
        setPhase(payload.phase);
        setParagraph(payload.paragraph);
        setStandings(payload.standings ?? []);
        setEndAtMs(payload.endAtMs);
        setCountdownSec(payload.phase === "countdown" ? payload.countdownRemainingSec : null);

        if (payload.phase === "running" && payload.endAtMs) {
          setRemainingSec(Math.max(0, Math.ceil((payload.endAtMs - Date.now()) / 1000)));
        } else {
          setRemainingSec(null);
        }

        if (payload.phase !== "running") {
          setTypedText("");
        }
      }
    );

    socket.on("room:matchCountdown", (payload: { secondsRemaining: number }) => {
      setPhase("countdown");
      setCountdownSec(payload.secondsRemaining);
      setWinnerUserId(null);
      setTypedText("");
    });

    socket.on(
      "room:matchStart",
      (payload: { paragraph: string; durationSec: number; startedAtMs: number; endAtMs: number }) => {
        setPhase("running");
        setParagraph(payload.paragraph);
        setCountdownSec(null);
        setStandings([]);
        setWinnerUserId(null);
        setTypedText("");
        setEndAtMs(payload.endAtMs ?? payload.startedAtMs + payload.durationSec * 1000);
        setRemainingSec(payload.durationSec);
      }
    );

    socket.on("room:progress", (payload: { standings: MatchStanding[] }) => {
      setStandings(payload.standings ?? []);
    });

    socket.on("room:matchEnd", (payload: { winnerUserId: string | null; standings: MatchStanding[] }) => {
      setPhase("ended");
      setWinnerUserId(payload.winnerUserId);
      setStandings(payload.standings ?? []);
      setRemainingSec(0);
      setEndAtMs(null);
    });

    return () => {
      socket.emit("room:unsubscribe", { roomCode });
      socket.off("room:update");
      socket.off("room:matchState");
      socket.off("room:matchCountdown");
      socket.off("room:matchStart");
      socket.off("room:progress");
      socket.off("room:matchEnd");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, roomCode]);

  useEffect(() => {
    if (phase !== "running" || !endAtMs) {
      return;
    }

    const interval = setInterval(() => {
      const nextRemaining = Math.max(0, Math.ceil((endAtMs - Date.now()) / 1000));
      setRemainingSec(nextRemaining);
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, [phase, endAtMs]);

  async function handleStartMatch() {
    if (!token) {
      return;
    }

    setError(null);
    setIsStarting(true);

    try {
      await startRoomMatch(token, roomCode);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Failed to start match");
    } finally {
      setIsStarting(false);
    }
  }

  function handleTypingChange(nextValue: string) {
    if (phase !== "running") {
      return;
    }

    const nextStats = getTypingStats(paragraph, nextValue);
    setTypedText(nextStats.value);

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      return;
    }

    socket.emit("room:typingProgress", {
      roomCode,
      typedLength: nextStats.typedLength,
      correctCharacters: nextStats.correctCharacters,
      mistakes: nextStats.mistakes
    });
  }

  async function handleCopyInvite() {
    const inviteUrl = `${window.location.origin}/room/${roomCode}`;
    await navigator.clipboard.writeText(inviteUrl);
  }

  async function handleLeaveRoom() {
    if (!token) {
      return;
    }

    setIsLeaving(true);

    try {
      await leaveRoom(token, roomCode);
      router.replace("/dashboard");
    } catch (leaveError) {
      setError(leaveError instanceof Error ? leaveError.message : "Failed to leave room");
    } finally {
      setIsLeaving(false);
    }
  }

  if (isHydrating || isLoading) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-10">
        <p className="text-slate-600">Loading room...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Room Error</h1>
        <p className="mt-3 text-red-600">{error}</p>
        <button
          className="mt-6 w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          type="button"
          onClick={() => router.replace("/dashboard")}
        >
          Back to Dashboard
        </button>
      </main>
    );
  }

  if (!room) {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Room {room.code}</h1>
          <p className="mt-2 text-slate-600">Hosted by {room.creator.username}</p>
        </div>
        <div className="flex gap-2">
          {user?.id === room.creatorId ? (
            <button
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              type="button"
              onClick={() => {
                void handleStartMatch();
              }}
              disabled={isStarting || phase === "countdown" || phase === "running"}
            >
              {isStarting ? "Starting..." : "Start Match"}
            </button>
          ) : null}
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900"
            type="button"
            onClick={() => {
              void handleCopyInvite();
            }}
          >
            Copy Invite
          </button>
          <button
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            type="button"
            onClick={() => {
              void handleLeaveRoom();
            }}
            disabled={isLeaving}
          >
            {isLeaving ? "Leaving..." : "Leave Room"}
          </button>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
        <p className="mt-3 text-slate-700">Duration: {room.durationSec}s</p>
        <p className="mt-1 text-slate-700">Rounds: Best of {room.bestOf}</p>
        <p className="mt-1 text-slate-700">Players: {room.participants.length} / {room.maxPlayers}</p>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Players</h2>
        <ul className="mt-4 space-y-2">
          {room.participants.map((participant) => (
            <li key={participant.id} className="rounded-md border border-slate-200 px-3 py-2 text-slate-700">
              {participant.user.username}
              {participant.user.id === room.creatorId ? " (Host)" : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Match</h2>
        <p className="mt-3 text-slate-700">
          Status:{" "}
          <span className="font-medium capitalize text-slate-900">
            {phase === "idle" ? "Waiting to start" : phase}
          </span>
        </p>

        {phase === "countdown" && countdownSec !== null ? (
          <p className="mt-2 text-2xl font-bold text-amber-700">Starting in {countdownSec}...</p>
        ) : null}

        {phase === "running" ? (
          <p className="mt-2 text-xl font-semibold text-emerald-700">Time left: {remainingSec ?? 0}s</p>
        ) : null}

        {phase === "ended" && winnerUserId ? (
          <p className="mt-2 text-emerald-700">
            Winner: {winnerUserId === user?.id ? "You" : standings.find((item) => item.userId === winnerUserId)?.username}
          </p>
        ) : null}

        {paragraph ? (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-800">
            {paragraph}
          </div>
        ) : null}

        <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="typing-input">
          Type here
        </label>
        <textarea
          id="typing-input"
          className="mt-2 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 disabled:bg-slate-100"
          value={typedText}
          onChange={(event) => {
            handleTypingChange(event.target.value);
          }}
          placeholder={phase === "running" ? "Start typing the paragraph..." : "Waiting for match to start"}
          disabled={phase !== "running"}
        />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Live Leaderboard</h2>
        {standings.length === 0 ? (
          <p className="mt-3 text-slate-600">No stats yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {standings.map((item, index) => (
              <li
                key={item.userId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2 text-slate-700"
              >
                <span>
                  #{index + 1} {item.username}
                </span>
                <span>
                  WPM {item.wpm} | Acc {item.accuracy}% | Correct {item.correctCharacters} | Mistakes {item.mistakes}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
