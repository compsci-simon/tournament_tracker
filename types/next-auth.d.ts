import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      role: string
    } & DefaultSession['user']
  }
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
  }
}