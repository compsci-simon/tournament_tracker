import NextAuth from "next-auth/next";
import CredentialsProvider from 'next-auth/providers/credentials'

export default NextAuth({
  session: {
    strategy: 'jwt'
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'example@test.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (credentials?.username == 'simon') {
          return {
            id: '1',
            name: 'simon',
            email: 'simon.steven@hexagon.com',
            image: ''
          }
        }
        return null
      },
    })
  ],
  pages: {
    signIn: '/auth/signin'
  }
})