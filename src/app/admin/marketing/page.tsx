'use client';
import { useRouter } from 'next/navigation';
export default function AdminMarketingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-black text-pink-900 mb-4">📢 Marketing</h1>
        <p className="text-slate-700 mb-6">Campaigns & outreach</p>
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-2 text-pink-900">Coming soon</h2>
          <ul className="list-disc ml-6 text-slate-600">
            <li>Email</li>
            <li>Ads</li>
            <li>Analytics</li>
          </ul>
        </div>
        <div className="mt-8 text-center">
          <button onClick={() => router.push('/admin')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-800">← Back to Admin Dashboard</button>
        </div>
      </div>
    </div>
  );
}