'use client';

import Link from 'next/link';
import { Building, Mail } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { SiGithub } from '@icons-pack/react-simple-icons';

export function Footer() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  return (
    <footer className="border-t bg-card py-8 text-card-foreground/70">
      <div className="container mx-auto px-4">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:gap-12">
          <div className="max-w-md">
            <div className="mb-4 flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-primary">CivilEngQuiz</span>
            </div>
            <p className="mb-4 text-sm">
              An interactive learning platform designed specifically for undergraduate civil 
              engineering students to practice and improve their knowledge through quizzes, 
              flashcards and multimedia content.
            </p>
            <div className="flex items-center gap-1">
              <Link 
                href="https://github.com" 
                target="_blank" 
                className="rounded-full p-2 text-foreground/70 hover:bg-muted hover:text-primary"
              >
                <SiGithub className="h-5 w-5" />
              </Link>
              <Link 
                href="mailto:contact@civilengquiz.com" 
                className="rounded-full p-2 text-foreground/70 hover:bg-muted hover:text-primary"
              >
                <Mail className="h-5 w-5" />
              </Link>
              <span className="text-xs">© {new Date().getFullYear()} CivilEngQuiz</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="mb-3 text-sm font-medium">Platform</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/subjects" className="hover:text-primary">Subjects</Link>
                </li>
                <li>
                  <Link href="/flashcards" className="hover:text-primary">Flashcards</Link>
                </li>
                <li>
                  <Link href="/media" className="hover:text-primary">Media Resources</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium">Account</h3>
              <ul className="space-y-2 text-sm">
                {isAuthenticated ? (
                  <>
                    <li>
                      <Link href="/profile" className="hover:text-primary">Profile</Link>
                    </li>
                    <li>
                      <Link href="/progress" className="hover:text-primary">My Progress</Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link href="/login" className="hover:text-primary">Login</Link>
                    </li>
                    <li>
                      <Link href="/register" className="hover:text-primary">Register</Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/faq" className="hover:text-primary">FAQ</Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary">Contact Us</Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 