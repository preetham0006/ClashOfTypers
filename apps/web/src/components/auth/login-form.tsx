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
    <form className="coc-card flex flex-col gap-4 p-6" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold text-amber-900">Email</span>
        <input
          className="coc-input px-3 py-2"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold text-amber-900">Password</span>
        <input
          className="coc-input px-3 py-2"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
      </label>

      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

      <button className="coc-btn-primary px-4 py-2 disabled:opacity-60" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>

      <p className="text-sm text-amber-900">
        Need an account? <Link className="font-bold underline" href="/signup">Create one</Link>
      </p>
    </form>
  );
}
