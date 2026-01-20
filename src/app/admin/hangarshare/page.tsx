'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface HangarShareStats {
  totalUsers: number;
  totalOwners: number;
  totalListings: number;
  activeListings: number;
  pendingListings: number;
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  totalPhotos: number;
  totalFavorites: number;
  totalReviews: number;
  revenueGenerated: number;
  occupancyRate: string;
}

interface HangarOwner {
  id: string;
  user_id: string;
  company_name: string;
  cnpj: string;
  owner_type: string;
  is_verified: boolean;
  verification_status: string;
  cpf?: string;
  first_name: string;
  last_name: string;
  email: string;
  listings_count: number;
}

interface HangarListing {
  id: string;
  owner_id: string;
  title: string;
  location: string;
  location_city: string;
  status: string;
  price: number;
  monthly_price: number;
  company_name: string;
  photos_count: number;
  bookings_count: number;
  created_at: string;
}

interface HangarBooking {
  id: string;
  user_id: string;
  hangar_id: string;
  status: string;
  total_price: number;
  check_in: string;
  check_out: string;
  user_name: string;
  hangar_title: string;
}

export default function HangarShareAdminPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [stats, setStats] = useState<HangarShareStats | null>(null);
  const [owners, setOwners] = useState<HangarOwner[]>([]);
  const [listings, setListings] = useState<HangarListing[]>([]);
  const [bookings, setBookings] = useState<HangarBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'owners' | 'listings' | 'bookings'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'master' && user.role !== 'admin' && user.email !== 'lovetofly.ed@gmail.com')) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, ownersRes, listingsRes, bookingsRes] = await Promise.all([
          fetch('/api/admin/hangarshare/stats'),
          fetch('/api/admin/hangarshare/owners'),
          fetch('/api/admin/hangarshare/listings'),
          fetch('/api/admin/hangarshare/bookings')
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (ownersRes.ok) setOwners(await ownersRes.json());
        if (listingsRes.ok) setListings(await listingsRes.json());
        if (bookingsRes.ok) setBookings(await bookingsRes.json());
      } catch (error) {
        console.error('Error fetching HangarShare data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando dados do HangarShare...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-blue-900 mb-2">HangarShare - Painel Completo</h1>
            <p className="text-slate-600">Gerenciamento integral de hangares, usuários, proprietários e reservas.</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors font-semibold text-sm"
          >
            ← Voltar ao Painel
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border border-slate-200 rounded-lg mb-6 shadow-sm overflow-hidden">
          <div className="flex flex-wrap border-b border-slate-200">
            {(['overview', 'users', 'owners', 'listings', 'bookings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                  activeTab === tab
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab === 'overview' && '📊 Visão Geral'}
                {tab === 'users' && `✓ Verificações Pendentes`}
                {tab === 'owners' && `🏢 Proprietários (${stats?.totalOwners || 0})`}
                {tab === 'listings' && `🏠 Hangares (${stats?.totalListings || 0})`}
                {tab === 'bookings' && `📅 Reservas (${stats?.totalBookings || 0})`}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="text-sm text-slate-500 font-semibold uppercase mb-2">Total de Usuários</div>
                <div className="text-3xl font-black text-blue-700">{stats.totalUsers}</div>
                <div className="text-xs text-slate-400 mt-2">Plataforma completa</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="text-sm text-slate-500 font-semibold uppercase mb-2">Proprietários Registrados</div>
                <div className="text-3xl font-black text-green-700">{stats.totalOwners}</div>
                <div className="text-xs text-slate-400 mt-2">Anunciantes ativos</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="text-sm text-slate-500 font-semibold uppercase mb-2">Anúncios Totais</div>
                <div className="text-3xl font-black text-purple-700">{stats.totalListings}</div>
                <div className="text-xs text-slate-400 mt-2">
                  {stats.activeListings} ativos, {stats.pendingListings} pendentes
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="text-sm text-slate-500 font-semibold uppercase mb-2">Reservas Confirmadas</div>
                <div className="text-3xl font-black text-orange-700">{stats.confirmedBookings}</div>
                <div className="text-xs text-slate-400 mt-2">
                  {stats.completedBookings} concluídas
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="text-sm text-slate-500 font-semibold uppercase mb-2">Fotos Publicadas</div>
                <div className="text-2xl font-black text-slate-700">{stats.totalPhotos}</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="text-sm text-slate-500 font-semibold uppercase mb-2">Receita Gerada</div>
                <div className="text-2xl font-black text-green-600">
                  R$ {stats.revenueGenerated?.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) || '0'}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="text-sm text-slate-500 font-semibold uppercase mb-2">Taxa de Ocupação</div>
                <div className="text-2xl font-black text-blue-600">{stats.occupancyRate}</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-4">Ações Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link
                  href="/admin/verifications?status=pending"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
                >
                  ✓ Verificações Pendentes
                </Link>
                <Link
                  href="/admin/hangarshare/listings/pending"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
                >
                  📝 Anúncios Pendentes
                </Link>
                <Link
                  href="/admin/hangarshare/bookings/conflicts"
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition font-semibold"
                >
                  ⚠️ Conflitos de Reservas
                </Link>
                <Link
                  href="/admin/hangarshare/reports"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-semibold"
                >
                  📊 Relatórios
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Pending Verifications Tab */}
        {activeTab === 'users' && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
              <h2 className="font-bold text-blue-900">Proprietários Aguardando Verificação</h2>
              <p className="text-sm text-blue-700 mt-1">Aprove ou rejeite novos anunciantes</p>
            </div>
            {owners.filter(o => !o.is_verified).length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p className="font-semibold text-green-700">✓ Nenhuma verificação pendente</p>
                <p className="text-sm mt-1">Todos os proprietários foram verificados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Empresa</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Responsável</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">CNPJ</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Anúncios</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {owners.filter(o => !o.is_verified).map((owner) => (
                      <tr key={owner.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 text-sm font-medium">{owner.company_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{owner.first_name} {owner.last_name}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600">{owner.cnpj || '—'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{owner.email}</td>
                        <td className="px-6 py-4 text-sm">{owner.listings_count || 0}</td>
                        <td className="px-6 py-4 text-sm">
                          <Link
                            href={`/admin/hangarshare/users/approve?id=${owner.id}`}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Verificar →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Owners Tab */}
        {activeTab === 'owners' && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Empresa</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Proprietário</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">CNPJ</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {owners.map((owner) => (
                    <tr key={owner.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm font-medium">{owner.company_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{owner.first_name} {owner.last_name}</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">{owner.cnpj || '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          owner.is_verified ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {owner.is_verified ? 'Verificado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/admin/hangarshare/owners/${owner.id}`}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {owners.length === 0 && (
              <div className="p-8 text-center text-slate-500">Nenhum proprietário encontrado</div>
            )}
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Título</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Proprietário</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Localização</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Preço/Mês</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm font-medium">{listing.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{listing.company_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{listing.location_city}</td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        R$ {listing.monthly_price?.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          listing.status === 'active' ? 'bg-green-100 text-green-700' :
                          listing.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {listing.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/admin/hangarshare/listings/${listing.id}`}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {listings.length === 0 && (
              <div className="p-8 text-center text-slate-500">Nenhum anúncio encontrado</div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Usuário</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Hangar</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Check-in</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Check-out</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Valor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm font-medium">{booking.user_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{booking.hangar_title}</td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(booking.check_in).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(booking.check_out).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        R$ {booking.total_price?.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {bookings.length === 0 && (
              <div className="p-8 text-center text-slate-500">Nenhuma reserva encontrada</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
