import Head from 'next/head'
import NavBar from './NavBar'
import { useSession } from 'next-auth/react'

export default function PageLayout({
  children
}: {
  children: React.ReactNode
}) {
  useSession({
    required: true
  })

  return (
    <>
      <Head>
        <title>League</title>
        <meta name="description" content="Track your office tournament" />
        <link rel="icon" href="/logo.svg" />
      </Head>
      <main>
        <NavBar />
        {children}
      </main>
    </>
  )
}