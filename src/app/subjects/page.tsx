'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Subject } from '@/models';

export default function SubjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      // In a real app, fetch subjects from the API
      // For now, use dummy data
      const dummySubjects: Subject[] = [
        {
          id: '1',
          name: 'Structural Analysis',
          description: 'Learn about analyzing structures using various methods.',
          topics: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Fluid Mechanics',
          description: 'Study the behavior of fluids at rest and in motion.',
          topics: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          name: 'Soil Mechanics',
          description: 'Understand the properties and behavior of soils.',
          topics: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '4',
          name: 'Transportation Engineering',
          description: 'Study of planning, design, and operation of transportation systems.',
          topics: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      setSubjects(dummySubjects);
      setIsLoading(false);
    }
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Subjects</h1>
          <p className="text-gray-600">Browse all available subjects</p>
        </div>
        {session?.user?.role === 'admin' && (
          <Button asChild>
            <Link href="/admin/subjects/new">Add New Subject</Link>
          </Button>
        )}
      </div>

      {subjects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No subjects available</h3>
          <p className="mt-2 text-gray-600">Check back later for new content.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="group rounded-lg border bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold group-hover:text-primary">
                {subject.name}
              </h3>
              <p className="text-gray-600">{subject.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 