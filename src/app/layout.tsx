import './globals.css'; // <--- ESSA LINHA É OBRIGATÓRIA
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Portal Love to Fly',
  description: 'O Seu Portal da Aviação Civil',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
