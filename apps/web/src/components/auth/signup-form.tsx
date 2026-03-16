"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signup } from "../../lib/api/auth";
import { useAuthStore } from "../../store/auth.store";

export function SignupForm() {
  const router = useRouter();
  const { user, setAuth, hydrateUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
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
      const response = await signup({
        email: email.trim(),
        username: username.trim(),
        password
      });
      setAuth(response);
      router.replace("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to signup");
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
        <span className="text-sm font-medium text-slate-700">Username</span>
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Choose a username"
          autoComplete="username"
          required
        />
        <span className="text-xs text-slate-500">Use 3-20 characters: letters, numbers, or underscores only.</span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
        />
        <span className="text-xs text-slate-500">Password must be at least 8 characters long.</span>
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-60" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Signup"}
      </button>

      <p className="text-sm text-slate-600">
        Already have an account? <Link className="font-medium text-slate-900 underline" href="/login">Login</Link>
      </p>
    </form>
  );
}
