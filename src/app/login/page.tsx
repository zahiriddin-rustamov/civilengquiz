'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Check for registered=true query param to show success message
  const registered = searchParams?.get('registered') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        if (result.error === 'EMAIL_NOT_VERIFIED') {
          setError('Your email has not been verified. Please check your inbox or request a new verification email.');
        } else {
          setError('Invalid email or password');
        }
        setIsLoading(false);
        return;
      }

      // Redirect to dashboard on successful login
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setError('An error occurred during sign in');
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (!email) {
      setError('Please enter your email address to resend verification');
      return;
    }

    setIsResendingVerification(true);

    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationSent(true);
        setError('');
      } else {
        setError(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <div className="container mx-auto flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Log in to your account to continue</p>
        </div>

        {registered && !error && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription>
              Registration successful! Please check your email to verify your account before logging in.
            </AlertDescription>
          </Alert>
        )}

        {verificationSent && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription>
              Verification email has been sent. Please check your inbox and verify your account before logging in.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="border-1 border-red-500">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="w-full">
              <div>{error}</div>
              {error.includes('not been verified') && (
                <div className="mt-3 w-full">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={resendVerificationEmail}
                    disabled={isResendingVerification}
                  >
                    <span className="flex items-center justify-center">
                      {isResendingVerification ? 'Sending...' : 'Resend Verification Email'}
                      {!isResendingVerification && <Mail className="ml-2 h-4 w-4" />}
                    </span>
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="700011111@uaeu.ac.ae"
                required
                className="mt-1"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="text-center text-sm">
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 