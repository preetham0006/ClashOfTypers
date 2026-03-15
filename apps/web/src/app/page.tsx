import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-5xl font-black tracking-tight text-slate-900">ClashOfTypers</h1>
      <p className="max-w-xl text-lg text-slate-700">
        Create private typing rooms, challenge up to 10 players, and compete in timed rounds.
      </p>
      <div className="flex gap-3">
        <Link className="rounded-md bg-slate-900 px-5 py-3 text-white" href="/login">
          Login
        </Link>
        <Link className="rounded-md border border-slate-900 px-5 py-3 text-slate-900" href="/signup">
          Signup
        </Link>
      </div>
    </main>
  );
}
