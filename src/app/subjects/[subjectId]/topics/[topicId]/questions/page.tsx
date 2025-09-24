'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// This page redirects to the new sections-based questions experience
export default function QuestionsRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();

  const subjectId = params.subjectId as string;
  const topicId = params.topicId as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && subjectId && topicId) {
      // Redirect to the new sections-based experience
      router.replace(`/subjects/${subjectId}/topics/${topicId}/sections`);
    }
  }, [status, subjectId, topicId, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to sections...</p>
      </div>
    </div>
  );
}