import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import GuestBanner from './components/GuestBanner';
import SiteFooter from './components/layout/SiteFooter';
import PWAUpdatePrompt from './components/pwa/PWAUpdatePrompt';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Woralink',
  description: "Connectez, Collaborez, Prospérez - Votre Réseau d'Affaires en Guinée",
  manifest: '/manifest.json',
  icons: {
    icon: '/woralinkLogo.svg',
    shortcut: '/woralinkLogo.svg',
    apple: '/woralinkLogo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var storedTheme=localStorage.getItem('theme');var systemPrefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=storedTheme==='dark'||(!storedTheme&&systemPrefersDark);if(storedTheme==='light'){isDark=false;}document.documentElement.classList.toggle('dark',isDark);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-50">
        {children}
        <PWAUpdatePrompt />
        <SiteFooter />
        <GuestBanner />
      </body>
    </html>
  );
}
