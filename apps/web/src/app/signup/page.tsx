import { SignupForm } from "../../components/auth/signup-form";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="mb-2 text-3xl font-bold text-slate-900">Signup</h1>
      <p className="mb-6 text-slate-600">Create your account and start hosting typing clashes.</p>
      <SignupForm />
    </main>
  );
}
