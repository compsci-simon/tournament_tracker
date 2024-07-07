import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
  }
  interface Session {
    user: User & DefaultSession['user']
  }
}