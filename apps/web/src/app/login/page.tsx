import { LoginForm } from "../../components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-5 py-8 sm:px-8">
      <section className="coc-shell coc-enter w-full p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-amber-950 sm:text-4xl">Welcome Back Chief</h1>
        <p className="mt-2 text-amber-900">Sign in to rejoin your typing clan and start battling.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
