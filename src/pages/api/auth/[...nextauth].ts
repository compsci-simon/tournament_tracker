import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth from "next-auth/next";
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from "~/server/db";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt'
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { Email: 'Email', type: 'text', placeholder: 'example@test.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        const user = await prisma.user.findFirst({
          where: {
            email: credentials?.email ?? '',
            password: credentials?.password ?? ''
          }
        })
        if (!user) {
          return null
        }
        return {
          id: user.id,
          name: user.nickName ?? `${user.firstName} ${user.lastName}`,
          email: user.email,
          image: user.avatar,
          role: user.role
        }
      },
    })
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }

      if (trigger === 'update') {
        token.image = session.image
        token.picture = session.image
      }
      return token
    },
    async session({ session, token, user }) {
      session.user.role = token.role === 'admin' ? 'admin' : 'non-admin'
      return session
    },
  },
  secret: 'test',
  jwt: {
    secret: 'test'
  },
  pages: {
    signIn: '/auth/signin'
  }
}

export default NextAuth(authOptions)
