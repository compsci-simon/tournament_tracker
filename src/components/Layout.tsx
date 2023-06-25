import Head from 'next/head'
import NavBar from './NavBar'

export default function PageLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Head>
        <title>League</title>
        <meta name="description" content="Track your office tournament" />
        <link rel="icon" href="/logo.svg" />
      </Head>
      <main >
        <NavBar />
        {children}
      </main>
    </>
  )
}