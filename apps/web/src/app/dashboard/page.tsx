"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "../../store/auth.store";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isHydrating, hydrateUser, logout } = useAuthStore();

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
    </main>
  );
}
