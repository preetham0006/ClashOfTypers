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
        <span className="text-sm font-bold text-amber-900">Username</span>
        <input
          className="coc-input px-3 py-2"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Choose a username"
          autoComplete="username"
          required
        />
        <span className="text-xs text-amber-800">Use 3-20 characters: letters, numbers, or underscores only.</span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold text-amber-900">Password</span>
        <input
          className="coc-input px-3 py-2"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
        />
        <span className="text-xs text-amber-800">Password must be at least 8 characters long.</span>
      </label>

      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}

      <button className="coc-btn-primary px-4 py-2 disabled:opacity-60" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Signup"}
      </button>

      <p className="text-sm text-amber-900">
        Already have an account? <Link className="font-bold underline" href="/login">Login</Link>
      </p>
    </form>
  );
}
