import './globals.css';
import type { Metadata, Viewport } from 'next';
import { inter, montserrat } from '@/lib/fonts';
import AppProviders from '@/components/providers/AppProviders';
import { ThemeProvider } from '@/components/theme-provider';
import RegisterServiceWorker from '@/components/providers/RegisterServiceWorker';


export const metadata: Metadata = {
  metadataBase: new URL('https://www.dolearnn.com'),
  title: 'DoLearnn',
  description:
    'Practice, identify learning gaps, compete, get targeted support and measure progress with DoLearnn.',

  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/icons/apple-touch-icon.png',
  },
  // Opened from the home screen, iPhones show it full screen like an app.
  appleWebApp: {
    capable: true,
    title: 'DoLearnn',
    statusBarStyle: 'default',
  },

  openGraph: {
    images: [
      {
        url: '/logo.png',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    images: ['/logo.png'],
  },
};

// Phones: colour the browser bar to match the page, and let the bottom tab bar
// sit above the home indicator (see env(safe-area-inset-bottom)).
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0c1521' },
  ],
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${montserrat.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppProviders>{children}</AppProviders>
          <RegisterServiceWorker />
        </ThemeProvider>
      </body>
    </html>
  );
}
