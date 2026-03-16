"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { login } from "../../lib/api/auth";
import { useAuthStore } from "../../store/auth.store";

export function LoginForm() {
  const router = useRouter();
  const { user, setAuth, hydrateUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void hydrateUser();
  }, [hydrateUser]);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await login({ email: email.trim(), password });
      setAuth(response);
      router.replace("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to login");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-60" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>

      <p className="text-sm text-slate-600">
        Need an account? <Link className="font-medium text-slate-900 underline" href="/signup">Create one</Link>
      </p>
    </form>
  );
}
