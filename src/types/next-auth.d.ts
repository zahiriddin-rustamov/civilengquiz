import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: 'student' | 'admin';
      isVerified: boolean;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'admin';
    isVerified: boolean;
  }

  interface JWT {
    id: string;
    role: 'student' | 'admin';
    isVerified: boolean;
  }
} 