import { LoginForm } from "../../components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">Login</h1>
      <p className="mb-6 text-slate-600">Sign in to create rooms and join typing battles.</p>
      <LoginForm />
    </main>
  );
}
