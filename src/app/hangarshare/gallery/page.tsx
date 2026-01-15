'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Header from '@/components/Header';
import { HangarGallery } from '@/components/HangarGallery';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HangarGalleryPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('hangarshare.gallery.title') || 'Available Hangars'}
          </h1>
          <p className="text-lg text-gray-600">
            {t('hangarshare.gallery.subtitle') ||
              'Browse our complete collection of premium hangar spaces available for aircraft storage and parking.'}
          </p>
        </div>

        {/* Gallery Component */}
        <HangarGallery initialStatus="available" />

        {/* CTA Section */}
        {!user && (
          <div className="mt-16 bg-blue-600 rounded-lg p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Secure Your Hangar Space?</h2>
            <p className="mb-6 text-blue-100">
              Sign up now to book your preferred hangar and manage your aviation needs.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition"
            >
              Sign In / Register
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
