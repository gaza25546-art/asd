import './globals.css';
import type { Metadata } from 'next';
import { Inter, Oswald } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' });

export const metadata: Metadata = {
  title: 'DVSC | Debreceni Vasutas Sport Club - Official Fan Site',
  description:
    'The ultimate online destination for DVSC supporters. Latest news, fixtures, results, squad, fan community, and club history for Debreceni Vasutas Sport Club.',
  keywords: 'DVSC, Debrecen, Debreceni VSC, Hungarian football, NB I, Loki, fan site',
  openGraph: {
    title: 'DVSC | Debreceni Vasutas Sport Club',
    description: 'The ultimate fan destination for DVSC supporters.',
    type: 'website',
    siteName: 'DVSC Fan Portal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DVSC | Debreceni Vasutas Sport Club',
    description: 'The ultimate fan destination for DVSC supporters.',
  },
  metadataBase: new URL('https://dvsc-fan-portal.example.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${oswald.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="relative min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
