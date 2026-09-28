import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, type Location } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Input } from '@/components/Input';
import { FullScreenSpinner } from '@/components/Spinner';
import { Logo } from '@/components/shell/Logo';
import { useAuth } from './useAuth';

export function LoginPage() {
  const { session, loading, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <FullScreenSpinner />;
  if (session) {
    const from = (location.state as { from?: Location } | null)?.from?.pathname;
    return <Navigate to={from && from !== '/login' ? from : '/leads'} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) setError(result.error);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo className="size-10" />
          <div className="flex flex-col gap-1">
            <h1 className="text-xl">Sign in to Vyxor HQ</h1>
            <p className="text-muted">Founders only.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5"
          noValidate
        >
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={error ? true : undefined}
              autoFocus
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={error ? true : undefined}
            />
          </Field>
          {error && (
            <p role="alert" className="rounded-control bg-danger/10 px-3 py-2 text-danger">
              {error}
            </p>
          )}
          <Button type="submit" variant="primary" loading={submitting} disabled={!email || !password}>
            Sign in
          </Button>
        </form>
      </div>
    </main>
  );
}
