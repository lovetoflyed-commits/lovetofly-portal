'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface OwnerPayment {
  listing_id: number;
  hangar_number: string;
  aerodrome_name: string;
  is_paid: boolean;
  paid_amount: number;
  paid_currency: string;
  paid_at: string;
  payment_status: string;
  created_at: string;
}

interface OwnerData {
  owner: {
    id: number;
    name: string;
    email: string;
    plan: string;
    membership_status: string;
    membership_expires_at: string;
  };
  summary: {
    total_listings: number;
    paid_listings: number;
    pending_listings: number;
    total_revenue: number;
  };
  payments: OwnerPayment[];
  transactions: any[];
}

export default function OwnerPaymentsPage() {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [data, setData] = useState<OwnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      router.push('/login');
      return;
    }

    fetchOwnerData();
  }, [user?.id]);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hangarshare/owner/${user?.id}/payments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load payment data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments & Revenue</h1>
          <p className="text-gray-600">Manage your hangar listings and track financial performance</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
            {error}
          </div>
        ) : data ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Listings */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 mb-2">Total Listings</div>
                <div className="text-3xl font-bold text-gray-900">{data.summary.total_listings}</div>
              </div>

              {/* Paid Listings */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 mb-2">Paid Listings</div>
                <div className="text-3xl font-bold text-green-600">{data.summary.paid_listings}</div>
              </div>

              {/* Pending Listings */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 mb-2">Pending Payment</div>
                <div className="text-3xl font-bold text-yellow-600">{data.summary.pending_listings}</div>
              </div>

              {/* Total Revenue */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 mb-2">Total Revenue</div>
                <div className="text-3xl font-bold text-blue-600">
                  R$ {data.summary.total_revenue.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>

            {/* Membership Status */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Membership Status</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Plan</div>
                  <div className="text-lg font-bold text-gray-900 capitalize">
                    {data.owner.plan || 'Free'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className={`text-lg font-bold capitalize ${
                    data.owner.membership_status === 'active'
                      ? 'text-green-600'
                      : 'text-yellow-600'
                  }`}>
                    {data.owner.membership_status || 'Inactive'}
                  </div>
                </div>
                {data.owner.membership_expires_at && (
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600">Expires</div>
                    <div className="text-lg font-bold text-gray-900">
                      {new Date(data.owner.membership_expires_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Listing Payments</h2>
              </div>

              {data.payments.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No payments yet. List your hangars to start earning.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Hangar
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Aerodrome
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.payments.map((payment) => (
                        <tr key={payment.listing_id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {payment.hangar_number}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {payment.aerodrome_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-center font-bold text-blue-600">
                            {payment.is_paid
                              ? `R$ ${payment.paid_amount.toLocaleString('pt-BR')}`
                              : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-center">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                payment.is_paid
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {payment.is_paid ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {payment.paid_at
                              ? new Date(payment.paid_at).toLocaleDateString('pt-BR')
                              : new Date(payment.created_at).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
