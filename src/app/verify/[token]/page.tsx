'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react';

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = params.token as string;

        if (!token) {
          setStatus('error');
          setMessage('Invalid verification link');
          return;
        }

        const response = await fetch(`/api/verify/${token}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verification successful! You can now log in to your account.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email. The link may have expired or is invalid.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again later.');
      }
    };

    verifyEmail();
  }, [params.token]);

  const handleResendVerification = async () => {
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    setIsResending(true);
    setResendSuccess(false);

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
        setResendSuccess(true);
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setMessage(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="container mx-auto flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-3xl font-bold">Email Verification</h1>

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <div className="mt-6">
              <Button onClick={() => router.push('/login')} className="w-full">
                Continue to Login
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
            {resendSuccess ? (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="resend-email" className="block text-sm font-medium text-gray-700 text-left">
                  Resend verification email
                </label>
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isResending}
                />
                <Button
                  onClick={handleResendVerification}
                  className="w-full"
                  disabled={isResending}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>
              <Button onClick={() => router.push('/register')} variant="outline" className="w-full">
                Return to Registration
              </Button>
              <p className="text-sm text-gray-600">
                Need help?{' '}
                <Link href="/contact" className="text-primary hover:underline">
                  Contact Support
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 