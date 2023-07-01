import { TRPCError } from "@trpc/server";
import NextAuth from "next-auth/next";
import CredentialsProvider from 'next-auth/providers/credentials'
import { api } from "~/utils/api";
import { prisma } from "~/server/db";
import z from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(12)
})

type ILogin = z.infer<typeof loginSchema>

export default NextAuth({
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
        // const creds = await loginSchema.parseAsync(credentials)
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
          image: user.avatar
        }
      },
    })
  ],
  pages: {
    signIn: '/auth/signin'
  }
})