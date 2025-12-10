import { Cinzel } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../providers';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700'] });

export const metadata: Metadata = {
  title: 'VaultWars - Blockchain Scavenger Hunt',
  description: 'Compete in factions to solve steganographic clues and win NFT rewards',
  manifest: '/manifest.json',
  themeColor: '#dc2626',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VaultWars',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'VaultWars',
    'application-name': 'VaultWars',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={cinzel.className}>
        <Providers>{children}</Providers>
        <PWAInstallPrompt />
      </body>
    </html>
  );
}