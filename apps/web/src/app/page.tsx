import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-5 py-10 sm:px-8">
      <section className="coc-shell coc-enter grid w-full gap-8 p-6 md:grid-cols-2 md:p-10">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-amber-800">Battle Arena</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-amber-950 sm:text-5xl">ClashOfTypers</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-amber-900 sm:text-lg">
            Build your typing squad, enter custom rooms, and clash in fast rounds where accuracy wins crowns.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="coc-btn-primary px-5 py-3" href="/signup">
              Start Your Village
            </Link>
            <Link className="coc-btn-secondary px-5 py-3" href="/login">
              Enter Existing Account
            </Link>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-amber-900 sm:grid-cols-3">
            <div className="coc-card p-3">
              <p className="font-bold">Private rooms</p>
              <p>Invite friends instantly</p>
            </div>
            <div className="coc-card p-3">
              <p className="font-bold">Live leaderboard</p>
              <p>Track every second</p>
            </div>
            <div className="coc-card p-3">
              <p className="font-bold">Fast matches</p>
              <p>30, 60, or 120 sec</p>
            </div>
          </div>
      </div>

        <div className="coc-card flex flex-col justify-center p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-amber-950">How It Works</h2>
          <ol className="mt-5 space-y-3 text-amber-900">
            <li><span className="font-bold">1.</span> Create an account and open your dashboard.</li>
            <li><span className="font-bold">2.</span> Build a room, choose duration, and share room code.</li>
            <li><span className="font-bold">3.</span> Start the clash and race for top WPM and accuracy.</li>
          </ol>
          <p className="mt-5 text-sm text-amber-800">
            Tip: Accuracy beats raw speed in longer rounds.
          </p>
        </div>
      </section>
    </main>
  );
}
