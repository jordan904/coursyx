import type { Metadata } from 'next'
import { Instrument_Serif, DM_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { validateEnv } from '@/lib/env'
import './globals.css'

if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE !== 'phase-production-build') {
  validateEnv()
}

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-heading',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Coursyx — AI Course Builder for Skool',
  description:
    'Turn any PDF, YouTube video, URL, or text into a complete Skool Classroom with modules, quizzes, video scripts, and cover images — ready to paste in under two minutes.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
  openGraph: {
    title: 'Coursyx — AI Course Builder for Skool',
    description:
      'The only Skool-native course generator. Upload anything, get a complete course with quizzes, video scripts, and AI cover images.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#161A1F',
              color: '#E8E3D5',
              border: '1px solid #2A2E35',
            },
          }}
        />
      </body>
    </html>
  )
}
