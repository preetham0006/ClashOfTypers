"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createRoom, getMyRecentMatches, joinRoom, type MatchHistoryItem } from "../../lib/api/rooms";
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
  const [recentMatches, setRecentMatches] = useState<MatchHistoryItem[]>([]);

  useEffect(() => {
    void hydrateUser();
  }, [hydrateUser]);

  useEffect(() => {
    if (!isHydrating && !user) {
      router.replace("/login");
    }
  }, [isHydrating, router, user]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const authToken: string = token;

    let active = true;

    async function loadRecentMatches() {
      try {
        const response = await getMyRecentMatches(authToken, 5);
        if (active) {
          setRecentMatches(response.matches);
        }
      } catch {
        if (active) {
          setRecentMatches([]);
        }
      }
    }

    void loadRecentMatches();

    return () => {
      active = false;
    };
  }, [token]);

  if (isHydrating || !user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl items-center px-5 py-10 sm:px-8">
        <p className="text-base font-semibold text-amber-100">Loading your village...</p>
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
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-10 sm:px-8">
      <div className="coc-shell coc-enter flex flex-wrap items-start justify-between gap-4 p-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-amber-800">Command Center</p>
          <h1 className="mt-1 text-3xl font-bold text-amber-950">Welcome back, {user.username}</h1>
          <p className="mt-2 text-amber-900">Create a new clash room or jump straight into one with a code.</p>
        </div>
        <button
          className="coc-btn-secondary px-4 py-2 text-sm"
          type="button"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
        >
          Logout
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="coc-card p-6">
          <h2 className="text-xl font-bold text-amber-950">Create Clash Room</h2>
          <p className="mt-2 text-sm text-amber-900">Host a room for up to 10 players and launch battles instantly.</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-bold text-amber-900">
            Duration
            <select
              className="coc-input px-3 py-2"
              value={durationSec}
              onChange={(event) => setDurationSec(Number(event.target.value) as 30 | 60 | 120)}
            >
              <option value={30}>30 sec</option>
              <option value={60}>60 sec</option>
              <option value={120}>120 sec</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold text-amber-900">
            Rounds
            <select
              className="coc-input px-3 py-2"
              value={bestOf}
              onChange={(event) => setBestOf(Number(event.target.value) as 1 | 3 | 5)}
            >
              <option value={1}>Best of 1</option>
              <option value={3}>Best of 3</option>
              <option value={5}>Best of 5</option>
            </select>
          </label>
          </div>

          {createError ? <p className="mt-3 text-sm font-semibold text-red-700">{createError}</p> : null}

          <button className="coc-btn-primary mt-4 px-4 py-2 text-sm disabled:opacity-60" type="button" onClick={handleCreateRoom} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Room"}
          </button>
        </section>

        <section className="coc-card p-6">
          <h2 className="text-xl font-bold text-amber-950">Join Existing Room</h2>
          <p className="mt-2 text-sm text-amber-900">Paste room code or full invite link to join your clan.</p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              className="coc-input w-full px-3 py-2"
              type="text"
              value={joinCodeInput}
              onChange={(event) => setJoinCodeInput(event.target.value)}
              placeholder="Example: AB12CD or full invite link"
            />
            <button className="coc-btn-primary px-4 py-2 text-sm disabled:opacity-60" type="button" onClick={handleJoinRoom} disabled={isJoining}>
              {isJoining ? "Joining..." : "Join"}
            </button>
          </div>

          {joinError ? <p className="mt-3 text-sm font-semibold text-red-700">{joinError}</p> : null}

          <div className="mt-6 rounded-xl border border-amber-300 bg-amber-100/70 p-4 text-sm text-amber-900">
            <p className="font-bold">Account</p>
            <p className="mt-1">Email: {user.email}</p>
            <p>Username: {user.username}</p>
          </div>
        </section>
      </div>

      <section className="coc-card mt-6 p-6">
        <h2 className="text-xl font-bold text-amber-950">Recent Battles</h2>
        {recentMatches.length === 0 ? (
          <p className="mt-2 text-sm text-amber-900">No completed matches yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {recentMatches.map((match) => {
              const topStat = match.rounds[0]?.stats[0];
              const isWinner = match.winnerId === user.id;

              return (
                <li key={match.id} className="rounded-xl border border-amber-300 bg-amber-50/80 px-3 py-3 text-sm text-amber-900">
                  <p className="font-bold text-amber-950">
                    Room {match.room?.code ?? "-"} | {isWinner ? "Won" : "Played"}
                  </p>
                  <p className="mt-1 text-amber-800">
                    {match.endedAt ? new Date(match.endedAt).toLocaleString() : "Completed"}
                  </p>
                  {topStat ? (
                    <p className="mt-1 text-amber-800">
                      Top Score: {topStat.user.username} | WPM {topStat.wpm.toFixed(2)} | Acc {topStat.accuracy.toFixed(2)}%
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
