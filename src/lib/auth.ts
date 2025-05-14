import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { compare } from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise) as any, // Type cast to fix adapter incompatibility
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login", // Custom error page to handle custom errors
  },
  providers: [
    // Only use Credentials provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const client = await clientPromise;
          const db = client.db();
          const user = await db.collection("users").findOne({ email: credentials.email });

          if (!user) {
            return null;
          }

          // Check if email is verified
          if (user.isVerified === false) {
            console.log("EMAIL_NOT_VERIFIED");
            throw new Error("EMAIL_NOT_VERIFIED");
          }

          const passwordMatch = await compare(credentials.password, user.password);

          if (!passwordMatch) {
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role || "student",
            isVerified: user.isVerified,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          // This error will be passed to the client
          if (error instanceof Error && error.message === "EMAIL_NOT_VERIFIED") {
            throw new Error("EMAIL_NOT_VERIFIED");
          }
          return null;
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'student';
        token.isVerified = Boolean(user.isVerified);
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string;
        // Use type assertions to avoid TypeScript errors
        (session.user as any).role = token.role as string;
        (session.user as any).isVerified = Boolean(token.isVerified);
      }
      return session;
    }
  },
}; 