import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in or create an account to continue
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
