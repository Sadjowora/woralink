import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import GuestBanner from './components/GuestBanner';
import SiteFooter from './components/layout/SiteFooter';
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <SiteFooter />
        <GuestBanner />
      </body>
    </html>
  );
}
