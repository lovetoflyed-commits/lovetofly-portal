import './globals.css';
import MainHeader from '@/components/MainHeader';
import { SessionTimeoutWrapper } from '@/components/SessionTimeoutWrapper';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { Metadata } from 'next';

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
        <ErrorBoundary>
          <LanguageProvider>
            <AuthProvider>
              <SessionTimeoutWrapper>
                <MainHeader />
                {children}
              </SessionTimeoutWrapper>
            </AuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
