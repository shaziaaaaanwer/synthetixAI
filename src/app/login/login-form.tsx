
'use client';

import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'email' | 'google' | null>(null);
  const router = useRouter();

  const getCleanDomain = () => {
    let domain = window.location.hostname;
    // Matches patterns like '6000-' or '3000-' at the start of the hostname.
    const portPrefixRegex = /^\d+-/;
    if (portPrefixRegex.test(domain)) {
        domain = domain.replace(portPrefixRegex, '');
    }
    return domain;
  }

  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    setLoading('email');
    setError(null);
    try {
      if (action === 'signIn') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push('/dashboard');
    } catch (err: any) {
      let errorMessage = err.message;
      if (err.code === 'auth/unauthorized-domain') {
          const cleanDomain = getCleanDomain();
          errorMessage = `This app's domain is not authorized. Please add the base domain "${cleanDomain}" to your Firebase project's authorized domains list.`;
      } else if (err.code === 'auth/invalid-credential') {
          errorMessage = 'The email or password you entered is incorrect. Please check your credentials and try again.';
      }
      setError(errorMessage);
    } finally {
      setLoading(null);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setLoading('google');
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (err: any) {
      let errorMessage = err.message;
      if (err.code === 'auth/unauthorized-domain') {
          const cleanDomain = getCleanDomain();
          errorMessage = `This app's domain is not authorized. Please add the base domain "${cleanDomain}" to your Firebase project's authorized domains list.`;
      }
      setError(errorMessage);
    } finally {
      setLoading(null);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Login</CardTitle>
        <CardDescription>Enter your credentials or use a social provider.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!!loading}
          />
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <div className="flex w-full flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button onClick={() => handleAuthAction('signIn')} className="w-full" disabled={!!loading}>
                {loading === 'email' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign In
            </Button>
            <Button variant="secondary" onClick={() => handleAuthAction('signUp')} className="w-full" disabled={!!loading}>
                Sign Up
            </Button>
        </div>
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={!!loading}>
           {loading === 'google' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
            <svg role="img" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
              <path
                fill="currentColor"
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.73 1.9-4.27 0-7.75-3.5-7.75-7.75s3.48-7.75 7.75-7.75c2.44 0 4.01.96 4.9 1.86l2.76-2.76C19.01 1.76 16.13 0 12.48 0 5.88 0 .04 5.88.04 12.48s5.84 12.48 12.44 12.48c6.92 0 11.7-4.82 11.7-11.96 0-.78-.07-1.54-.2-2.32H12.48z"
              />
            </svg>
           )}
          Google
        </Button>
      </CardFooter>
    </Card>
  );
}

    