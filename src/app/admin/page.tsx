'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    pendingListings: 0,
    totalHangars: 0,
    activeBookings: 0
  });

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      router.push('/');
      return;
    }
    // TODO: Fetch stats from API
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-blue-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-2">Portal Management & Approvals</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-semibold">Pending Verifications</p>
                <p className="text-3xl font-black text-blue-900 mt-2">{stats.pendingVerifications}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-semibold">Pending Listings</p>
                <p className="text-3xl font-black text-amber-600 mt-2">{stats.pendingListings}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🏠</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-semibold">Total Hangars</p>
                <p className="text-3xl font-black text-green-600 mt-2">{stats.totalHangars}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-semibold">Active Bookings</p>
                <p className="text-3xl font-black text-purple-600 mt-2">{stats.activeBookings}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/verifications">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition cursor-pointer border-2 border-transparent hover:border-blue-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">👤</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-900">Owner Verifications</h3>
                  <p className="text-slate-600">Review document submissions</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Approve or reject hangar owner identity and ownership documents
              </p>
            </div>
          </Link>

          <Link href="/admin/listings">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition cursor-pointer border-2 border-transparent hover:border-amber-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🏠</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-amber-900">Listing Approvals</h3>
                  <p className="text-slate-600">Review hangar listings</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Approve or reject new hangar listings before they go live
              </p>
            </div>
          </Link>

          <Link href="/admin/bookings">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition cursor-pointer border-2 border-transparent hover:border-purple-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">📅</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-900">Booking Management</h3>
                  <p className="text-slate-600">Manage reservations</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                View and manage all hangar bookings and payments
              </p>
            </div>
          </Link>

          <Link href="/admin/users">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition cursor-pointer border-2 border-transparent hover:border-green-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">👥</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-900">User Management</h3>
                  <p className="text-slate-600">Manage portal users</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                View users, assign roles, and manage permissions
              </p>
            </div>
          </Link>
        </div>

        {/* Back to Portal */}
        <div className="mt-8 text-center">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 font-bold"
          >
            ← Back to Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
