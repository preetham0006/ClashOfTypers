"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createRoom, joinRoom } from "../../lib/api/rooms";
import { useAuthStore } from "../../store/auth.store";

export default function DashboardPage() {
  const router = useRouter();
  const { token, user, isHydrating, hydrateUser, logout } = useAuthStore();
  const [durationSec, setDurationSec] = useState<30 | 60 | 120>(60);
  const [bestOf, setBestOf] = useState<1 | 3 | 5>(3);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    void hydrateUser();
  }, [hydrateUser]);

  useEffect(() => {
    if (!isHydrating && !user) {
      router.replace("/login");
    }
  }, [isHydrating, router, user]);

  if (isHydrating || !user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-10">
        <p className="text-slate-600">Loading your dashboard...</p>
      </main>
    );
  }

  async function handleCreateRoom() {
    if (!token) {
      setCreateError("Session expired. Please login again.");
      return;
    }

    setCreateError(null);
    setIsCreating(true);

    try {
      const response = await createRoom(token, { durationSec, bestOf });
      router.push(`/room/${response.room.code}`);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleJoinRoom() {
    if (!token) {
      setJoinError("Session expired. Please login again.");
      return;
    }

    setJoinError(null);
    setIsJoining(true);

    try {
      const response = await joinRoom(token, joinCodeInput);
      router.push(`/room/${response.room.code}`);
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : "Failed to join room");
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-600">Welcome back, {user.username}. Room creation and match history come next.</p>
        </div>
        <button
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900"
          type="button"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          Logout
        </button>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Account</h2>
        <p className="mt-3 text-slate-700">Email: {user.email}</p>
        <p className="mt-1 text-slate-700">Username: {user.username}</p>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Create Room</h2>
        <p className="mt-2 text-sm text-slate-600">Host a room for up to 10 players.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Duration
            <select
              className="rounded-md border border-slate-300 px-3 py-2 text-slate-900"
              value={durationSec}
              onChange={(event) => setDurationSec(Number(event.target.value) as 30 | 60 | 120)}
            >
              <option value={30}>30 sec</option>
              <option value={60}>60 sec</option>
              <option value={120}>120 sec</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Rounds
            <select
              className="rounded-md border border-slate-300 px-3 py-2 text-slate-900"
              value={bestOf}
              onChange={(event) => setBestOf(Number(event.target.value) as 1 | 3 | 5)}
            >
              <option value={1}>Best of 1</option>
              <option value={3}>Best of 3</option>
              <option value={5}>Best of 5</option>
            </select>
          </label>
        </div>

        {createError ? <p className="mt-3 text-sm text-red-600">{createError}</p> : null}

        <button
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          type="button"
          onClick={handleCreateRoom}
          disabled={isCreating}
        >
          {isCreating ? "Creating..." : "Create Room"}
        </button>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Join Room</h2>
        <p className="mt-2 text-sm text-slate-600">Paste a room code or invite URL.</p>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
            type="text"
            value={joinCodeInput}
            onChange={(event) => setJoinCodeInput(event.target.value)}
            placeholder="Example: AB12CD or full invite link"
          />
          <button
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            type="button"
            onClick={handleJoinRoom}
            disabled={isJoining}
          >
            {isJoining ? "Joining..." : "Join Room"}
          </button>
        </div>

        {joinError ? <p className="mt-3 text-sm text-red-600">{joinError}</p> : null}
      </section>
    </main>
  );
}
