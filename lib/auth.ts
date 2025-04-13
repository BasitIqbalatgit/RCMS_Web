import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from './db/mongodb';
import User, { UserRole } from './db/models/User';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          await connectDB();
          const user = await User.findOne({ email: credentials.email.toLowerCase() });

          if (!user) {
            throw new Error('No user found with this email');
          }

          if (!user.emailVerified) {
            throw new Error('Please verify your email before logging in');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          } as AuthUser;
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as AuthUser).id;
        token.role = (user as AuthUser).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const res = await fetch('/api/auth/session');
    if (!res.ok) {
      throw new Error(`Failed to fetch session: ${res.status}`);
    }
    const session = await res.json();
    return !!session.user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

export const getUserRole = async (): Promise<UserRole | null> => {
  try {
    const res = await fetch('/api/auth/session');
    if (!res.ok) {
      throw new Error(`Failed to fetch session: ${res.status}`);
    }
    const session = await res.json();
    return session.user?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};