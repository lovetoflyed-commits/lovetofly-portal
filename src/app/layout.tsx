import './globals.css';
import MainHeader from '@/components/MainHeader';
import { SessionTimeoutWrapper } from '@/components/SessionTimeoutWrapper';
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Portal Love to Fly',
  description: 'O Seu Portal da Aviação Civil',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <SessionTimeoutWrapper>
            <MainHeader />
            {children}
          </SessionTimeoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
