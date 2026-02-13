"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function MainHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const userPlan = user?.plan || 'free';
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  // Hide header on home page if user is not logged in (landing page handles its own navigation)
  if (pathname === '/' && !user) {
    return null;
  }

  return (
    <header className="bg-blue-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* First column: Logo 4cm x 4cm centered */}
        <div
          className="flex items-center justify-center cursor-pointer h-32 min-w-64 w-64"
          onClick={() => router.push("/")}
        >
          <img
            src="/aviation-central-hub-logo.png"
            alt="Aviation Central Hub"
            className="w-full h-full object-contain block"
          />
        </div>
        {/* Second column: Title and Subtitle */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="font-black text-3xl md:text-4xl tracking-wide text-white text-center">Central Hub Aviation</h1>
          <p className="text-sm uppercase tracking-[0.2em] text-white font-semibold mt-1">Sua aviação mais simples, segura e conectada</p>
        </div>
        {/* Third column: Badge image and label */}
        <div className="flex items-start justify-end gap-0 h-32 min-w-64 w-64">
          <div className="text-[10px] leading-tight text-blue-100 font-semibold uppercase tracking-wide text-right -mr-3">
            API integracao
            <br />
            Autorizada pelo:
          </div>
          <img
            src="/DECEA_logo.png"
            alt="DECEA"
            className="w-full h-full object-contain block -ml-1"
          />
        </div>
      </div>
    </header>
  );
}
