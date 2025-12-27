'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AdvertiserProfile {
  id: string;
  userId: string;
  companyName: string;
  email: string;
  phone: string;
  cnpj: string;
  bankCode: string;
  bankAgency: string;
  bankAccount: string;
  isActive: boolean;
  totalHangars: number;
  totalBookings: number;
  totalRevenue: number;
  createdAt: string;
}

interface Listing {
  id: string;
  icao: string;
  hangarNumber: string;
  sizeM2: number;
  hourlyRate: number;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  bookingType: 'Reembolsável' | 'Não reembolsável';
  status: string;
  bookings: number;
  revenue: number;
  rating: number;
}

export default function AdvertiserDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<AdvertiserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportFormat, setReportFormat] = useState<'table' | 'pdf'>('table');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      // Load advertiser profile
      const profileRes = await fetch('/api/hangarshare/owners');
      if (profileRes.ok) {
        const owners = await profileRes.json();
        const userProfile = owners.find((o: AdvertiserProfile) => o.userId === String(user?.id));
        setProfile(userProfile || null);
      }

      // Busca real das listagens do proprietário
      if (user?.id) {
        const listingsRes = await fetch(`/api/hangarshare/owner/listings?userId=${user.id}`);
        if (listingsRes.ok) {
          const data = await listingsRes.json();
          setListings(data.listings || []);
        } else {
          setListings([]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = useCallback(async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('RELATÓRIO DE ANUNCIANTE', 14, 22);
    
    // Header info
    doc.setFontSize(11);
    doc.text(`Data do Relatório: ${new Date().toLocaleDateString('pt-BR')}`, 14, 35);
    doc.text(`Anunciante: ${profile?.companyName}`, 14, 42);
    doc.text(`CNPJ: ${profile?.cnpj}`, 14, 49);
    
    // Summary section
    doc.setFontSize(13);
    doc.text('RESUMO EXECUTIVO', 14, 65);
    doc.setFontSize(10);
    
    const summaryData = [
      ['Métrica', 'Valor'],
      ['Total de Hangares', profile?.totalHangars?.toString() || '0'],
      ['Total de Reservas', profile?.totalBookings?.toString() || '0'],
      ['Receita Total', `R$ ${profile?.totalRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`],
      ['Data de Inscrição', new Date(profile?.createdAt || '').toLocaleDateString('pt-BR')],
    ];

    (doc as any).autoTable({
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: 75,
      margin: { left: 14, right: 14 },
    });

    // Listings section
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.text('DETALHES DOS HANGARES', 14, finalY);

    const listingsData = [
      ['ICAO', 'Nº Hangar', 'Tamanho (m²)', 'Preço/Dia', 'Reservas', 'Tipo', 'Status', 'Avaliação'],
      ...listings.map((listing) => [
        listing.icao,
        listing.hangarNumber,
        listing.sizeM2.toString(),
        `R$ ${listing.dailyRate.toLocaleString('pt-BR')}`,
        listing.bookings.toString(),
        listing.bookingType,
        listing.status,
        `⭐ ${listing.rating.toFixed(1)}`,
      ]),
    ];

    (doc as any).autoTable({
      head: [listingsData[0]],
      body: listingsData.slice(1),
      startY: finalY + 7,
      margin: { left: 14, right: 14 },
    });

    // Footer
    finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('LoveToFly - HangarShare™', 14, finalY);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, finalY + 5);

    // Save PDF
    doc.save(`relatorio-anunciante-${profile?.id}-${new Date().getTime()}.pdf`);
    setShowReport(false);
  }, [profile?.id]);

  const exportCSV = () => {
    const headers = ['ICAO', 'Nº Hangar', 'Tamanho (m²)', 'Preço/Hora', 'Preço/Dia', 'Preço/Semana', 'Preço/Mês', 'Reservas', 'Receita', 'Tipo', 'Avaliação'];
    const rows = listings.map((listing) => [
      listing.icao,
      listing.hangarNumber,
      listing.sizeM2.toString(),
      `R$ ${listing.hourlyRate.toFixed(2)}`,
      `R$ ${listing.dailyRate.toFixed(2)}`,
      `R$ ${listing.weeklyRate.toFixed(2)}`,
      `R$ ${listing.monthlyRate.toFixed(2)}`,
      listing.bookings.toString(),
      `R$ ${listing.revenue.toFixed(2)}`,
      listing.bookingType,
      listing.rating.toFixed(1),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hangares-${new Date().getTime()}.csv`);
    link.click();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-700">Carregando...</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-700">Carregando seu painel...</h1>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => router.push('/hangarshare')}
            className="text-blue-600 hover:text-blue-800 font-bold mb-8"
          >
            ← Voltar
          </button>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Perfil não encontrado</h2>
            <p className="text-slate-600 mb-6">
              Você ainda não é anunciante. Crie um perfil para começar a anunciar hangares.
            </p>
            <button
              onClick={() => router.push('/hangarshare/owner/register')}
              className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
            >
              Criar Perfil de Anunciante
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/hangarshare')}
            className="text-blue-600 hover:text-blue-800 font-bold mb-4"
          >
            ← Voltar
          </button>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-black text-blue-900">Painel de Anunciante</h1>
              <p className="text-slate-600 mt-2">{profile.companyName}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/hangarshare/owner/bookings')}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
              >
                📋 Reservas
              </button>
              <button
                onClick={() => router.push('/hangarshare/owner/analytics')}
                className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700"
              >
                📈 Análises
              </button>
              <button
                onClick={() => setShowReport(true)}
                className="px-6 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700"
              >
                📊 Relatório
              </button>
              <button
                onClick={() => router.push('/hangarshare/listing/create')}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
              >
                ➕ Novo Anúncio
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-500 text-sm font-bold">HANGARES ATIVOS</p>
            <p className="text-3xl font-black text-blue-900 mt-2">{profile.totalHangars}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-500 text-sm font-bold">TOTAL DE RESERVAS</p>
            <p className="text-3xl font-black text-green-600 mt-2">{profile.totalBookings}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-500 text-sm font-bold">RECEITA TOTAL</p>
            <p className="text-2xl font-black text-orange-600 mt-2">
              R$ {profile.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-500 text-sm font-bold">MEMBRO DESDE</p>
            <p className="text-sm font-bold text-slate-700 mt-2">
              {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-blue-900 mb-6">Informações da Conta</h2>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-bold text-slate-600 mb-1">Razão Social</p>
              <p className="text-lg font-bold text-slate-900">{profile.companyName}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-600 mb-1">CNPJ</p>
              <p className="text-lg font-bold text-slate-900">{profile.cnpj}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-600 mb-1">Email</p>
              <p className="text-lg font-bold text-slate-900">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-600 mb-1">Telefone</p>
              <p className="text-lg font-bold text-slate-900">{profile.phone}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-600 mb-1">Conta Bancária</p>
              <p className="text-lg font-bold text-slate-900 font-mono">
                Agência {profile.bankAgency} - Conta {profile.bankAccount}
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-600 mb-1">Status</p>
              <span className={`inline-block px-4 py-1 rounded-full font-bold text-sm ${
                profile.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {profile.isActive ? '✓ Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 border-b border-slate-200">
            <h2 className="text-xl font-bold text-blue-900">Meus Hangares</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-slate-700">ICAO</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700">Hangar</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700">Tamanho</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700">Preço/Dia</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700">Reservas</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700">Receita</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700">Tipo</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700">Avaliação</th>
                  <th className="px-6 py-4 text-left font-bold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-center font-bold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing, idx) => (
                  <tr key={listing.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-6 py-4 font-bold text-blue-600">{listing.icao}</td>
                    <td className="px-6 py-4 text-slate-900">{listing.hangarNumber}</td>
                    <td className="px-6 py-4 text-slate-900">{listing.sizeM2} m²</td>
                    <td className="px-6 py-4 text-slate-900">
                      R$ {listing.dailyRate.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-slate-900">{listing.bookings}</td>
                    <td className="px-6 py-4 text-green-600 font-bold">
                      R$ {listing.revenue.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        listing.bookingType === 'Não reembolsável'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {listing.bookingType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-amber-600 font-bold">
                      ⭐ {listing.rating.toFixed(1)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 font-bold text-sm">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Gerar Relatório</h2>
            
            <div className="space-y-4 mb-8">
              <button
                onClick={generatePDF}
                className="w-full px-6 py-4 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 flex items-center justify-center gap-3"
              >
                <span>📄 PDF</span>
              </button>
              
              <button
                onClick={exportCSV}
                className="w-full px-6 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center justify-center gap-3"
              >
                <span>📊 Planilha (CSV)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="w-full px-6 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-3"
              >
                <span>🖨️ Imprimir</span>
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-700">
                <strong>ℹ️ O relatório incluirá:</strong>
              </p>
              <ul className="text-sm text-slate-600 mt-3 space-y-1 ml-4">
                <li>✓ Informações da empresa</li>
                <li>✓ Resumo de hangares</li>
                <li>✓ Detalhes de reservas</li>
                <li>✓ Dados de receita</li>
                <li>✓ Avaliações dos clientes</li>
              </ul>
            </div>

            <button
              onClick={() => setShowReport(false)}
              className="w-full px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
