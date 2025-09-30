'use client';

import Link from 'next/link';
import { Building, Mail, BookOpen, TrendingUp, LayoutDashboard } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { SiGithub } from '@icons-pack/react-simple-icons';

export function Footer() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  return (
    <footer className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Brand & Description */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building className="h-6 w-6 text-indigo-600" />
              <span className="text-lg font-bold text-gray-900">CivilEngQuiz</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Interactive quiz platform for UAEU Civil Engineering students. Practice with
              quizzes, flashcards, and track your progress.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/subjects"
                  className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Subjects
                </Link>
              </li>
              {isAuthenticated ? (
                <>
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/leaderboard"
                      className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Leaderboard
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      href="/login"
                      className="text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/register"
                      className="text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Support & Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Support & Info</h3>
            <ul className="space-y-2 text-sm mb-4">
              <li>
                <Link
                  href="mailto:202170147@uaeu.ac.ae"
                  className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/zahiriddin-rustamov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  <SiGithub className="w-4 h-4" />
                  GitHub
                </Link>
              </li>
            </ul>
            <p className="text-xs text-gray-500 leading-relaxed">
              Unofficial study tool - not affiliated with UAEU
            </p>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600">
            <p>© {new Date().getFullYear()} Zahiriddin Rustamov</p>
            <p className="text-xs">Built for UAEU Civil Engineering</p>
          </div>
        </div>
      </div>
    </footer>
  );
} 