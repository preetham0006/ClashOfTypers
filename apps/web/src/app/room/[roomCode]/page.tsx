"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getRoom, leaveRoom, type Room } from "../../../lib/api/rooms";
import { createSocket } from "../../../lib/socket";
import { useAuthStore } from "../../../store/auth.store";

export default function RoomPage() {
  const params = useParams<{ roomCode: string }>();
  const router = useRouter();
  const roomCode = useMemo(() => (params?.roomCode ?? "").toUpperCase(), [params?.roomCode]);
  const { token, user, isHydrating, hydrateUser } = useAuthStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

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

    socket.connect();
    socket.emit("room:subscribe", { roomCode });

    socket.on("room:update", (payload: { room: Room }) => {
      setRoom(payload.room);
    });

    return () => {
      socket.emit("room:unsubscribe", { roomCode });
      socket.off("room:update");
      socket.disconnect();
    };
  }, [token, roomCode]);

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
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
              type="button"
              onClick={() => {
                setError("Start Match will be enabled in Day 4 game flow.");
              }}
            >
              Start Match
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
    </main>
  );
}
