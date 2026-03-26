import { SignupForm } from "../../components/auth/signup-form";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-5 py-8 sm:px-8">
      <section className="coc-shell coc-enter w-full p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-amber-950 sm:text-4xl">Train a New Warrior</h1>
        <p className="mt-2 text-amber-900">Create your account to host rooms and invite friends to clash.</p>
        <div className="mt-6">
          <SignupForm />
        </div>
      </section>
    </main>
  );
}
