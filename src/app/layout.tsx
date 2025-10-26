// import '.../styles/globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Svenska Bro App',
  description: 'Field Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  )
}
