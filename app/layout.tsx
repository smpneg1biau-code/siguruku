import type {Metadata, Viewport} from 'next';
import './globals.css'; // Global styles
import { ThemeProvider } from '@/lib/theme/theme-provider';

export const viewport: Viewport = {
  themeColor: '#007AFF',
};

export const metadata: Metadata = {
  title: 'SI-Guruku App',
  description: 'SI-Guruku App',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

