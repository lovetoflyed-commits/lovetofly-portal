'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type ModuleCard = {
  key: string;
  title: string;
  icon: string;
  href: string;
  priority: 'high' | 'normal' | 'low';
  metrics: { label: string; value: number | string }[];
  alert?: string;
  note?: string;
  items?: { label: string; href: string }[];
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    pendingListings: 0,
    totalHangars: 0,
    activeBookings: 0,
    totalUsers: 0,
    newUsersToday: 0,
    totalRevenue: 0,
    totalVisits: 0,
    visitsToday: 0
  });

  useEffect(() => {
    // Require authentication first; non-authenticated users go to login
    if (!user) {
      router.push('/login');
      return;
    }

    // Authenticated but without admin/staff privileges: send to landing
    if (user.role !== 'master' && user.role !== 'admin' && user.role !== 'staff' && user.email !== 'lovetofly.ed@gmail.com') {
      router.push('/');
      return;
    }

    const fetchStats = () => {
      fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
        .catch((err) => console.error('Failed to fetch admin stats:', err));
    };

    // Initial fetch
    fetchStats();

    // Auto-refresh every 30 seconds for live updates
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, [user, router]);

  const modules: ModuleCard[] = [
    {
      key: 'hangarshare',
      title: 'HangarShare',
      icon: '🛫',
      href: '/admin/verifications',
      priority: 'high',
      metrics: [
        { label: 'Solicitações Pendentes', value: stats.pendingVerifications },
        { label: 'Anúncios Pendentes', value: stats.pendingListings }
      ],
      alert: stats.pendingVerifications > 0 ? 'Novos documentos aguardam revisão.' : 'Nenhuma solicitação pendente.',
      note: 'Mantenha aprovações em dia para ativar anúncios.'
    },
    {
      key: 'bookings',
      title: 'Reservas',
      icon: '📅',
      href: '/admin/bookings',
      priority: 'high',
      metrics: [
        { label: 'Ativas', value: stats.activeBookings },
        { label: 'Hoje', value: '—' }
      ],
      alert: 'Atenção a conflitos ou SLAs nas reservas ativas.',
      note: 'Mantenha a agenda atualizada.',
      items: [
        { label: 'Visão Geral', href: '/admin/bookings' },
        { label: 'Calendário', href: '/admin/bookings/calendar' },
        { label: 'Conflitos', href: '/admin/bookings/conflicts' }
      ]
    },
    {
      key: 'listings',
      title: 'Anúncios',
      icon: '🏠',
      href: '/admin/listings',
      priority: 'normal',
      metrics: [
        { label: 'Pendentes', value: stats.pendingListings },
        { label: 'Total', value: stats.totalHangars }
      ],
      alert: 'Monitore anúncios pendentes para ativação.',
      note: 'Mantenha atualizações de status consistentes.',
      items: [
        { label: 'Todos os Anúncios', href: '/admin/listings' },
        { label: 'Aguardando Aprovação', href: '/admin/listings?status=pending' },
        { label: 'Rejeitados', href: '/admin/listings?status=rejected' }
      ]
    },
    {
      key: 'users',
      title: 'Usuários',
      icon: '👥',
      href: '/admin/users',
      priority: 'normal',
      metrics: [
        { label: 'Total de Usuários', value: stats.totalUsers },
        { label: 'Novos Hoje', value: stats.newUsersToday }
      ],
      alert: stats.newUsersToday > 0 ? `${stats.newUsersToday} novos usuários hoje!` : 'Monitore crescimento de usuários.',
      note: 'Dados atualizados em tempo real.',
      items: [
        { label: 'Diretório', href: '/admin/users' },
        { label: 'Acessos & Papéis', href: '/admin/users/access' },
        { label: 'Atividade', href: '/admin/users/activity' }
      ]
    },
    {
      key: 'traffic',
      title: 'Tráfego do Portal',
      icon: '📊',
      href: '/admin/analytics',
      priority: 'normal',
      metrics: [
        { label: 'Visitas Hoje', value: stats.visitsToday },
        { label: 'Total de Visitas', value: stats.totalVisits }
      ],
      alert: stats.visitsToday > 0 ? `Portal ativo com ${stats.visitsToday} visitas hoje.` : 'Aguardando tráfego de visitantes.',
      note: 'Contador iniciado no deploy. Atualização automática.',
      items: [
        { label: 'Visão Geral', href: '/admin/analytics' },
        { label: 'Páginas Populares', href: '/admin/analytics/pages' },
        { label: 'Histórico', href: '/admin/analytics/history' }
      ]
    },
    {
      key: 'moderation',
      title: 'Moderação',
      icon: '🛡️',
      href: '/admin/moderation',
      priority: 'normal',
      metrics: [
        { label: 'Casos Abertos', value: '—' },
        { label: 'Escalações', value: '—' }
      ],
      alert: 'Revise novos relatórios com agilidade.',
      note: 'Mantenha o tratamento de violações consistente.',
      items: [
        { label: 'Fila', href: '/admin/moderation' },
        { label: 'Escalações', href: '/admin/moderation/escalations' },
        { label: 'Políticas', href: '/admin/moderation/policies' }
      ]
    },
    {
      key: 'finance',
      title: 'Finanças',
      icon: '💰',
      href: '/admin/finance',
      priority: 'low',
      metrics: [
        { label: 'Receita Total', value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
        { label: 'Disputas', value: '—' }
      ],
      alert: stats.totalRevenue > 0 ? `Receita acumulada: R$ ${stats.totalRevenue.toLocaleString('pt-BR')}` : 'Revise o cronograma de pagamentos.',
      note: 'Garanta conciliação sempre atualizada.',
      items: [
        { label: 'Pagamentos', href: '/admin/finance/payouts' },
        { label: 'Disputas', href: '/admin/finance/disputes' },
        { label: 'Conciliação', href: '/admin/finance/reconciliation' }
      ]
    },
    {
      key: 'compliance',
      title: 'Conformidade',
      icon: '⚖️',
      href: '/admin/compliance',
      priority: 'low',
      metrics: [
        { label: 'Verificações', value: '—' },
        { label: 'Auditorias', value: '—' }
      ],
      alert: 'Acompanhe documentos com vencimento próximo.',
      note: 'Mantenha registros auditáveis.',
      items: [
        { label: 'KYC/KYB', href: '/admin/compliance' },
        { label: 'Auditorias', href: '/admin/compliance/audits' },
        { label: 'Políticas', href: '/admin/compliance/policies' }
      ]
    },
    {
      key: 'marketing',
      title: 'Marketing',
      icon: '📣',
      href: '/admin/marketing',
      priority: 'low',
      metrics: [
        { label: 'Campanhas', value: '—' },
        { label: 'Leads', value: '—' }
      ],
      alert: 'Destaque o desempenho das campanhas ativas.',
      note: 'Alinhe promoções com capacidade.',
      items: [
        { label: 'Campanhas', href: '/admin/marketing' },
        { label: 'Leads', href: '/admin/marketing/leads' },
        { label: 'Materiais', href: '/admin/marketing/assets' }
      ]
    },
    {
      key: 'reports',
      title: 'Relatórios',
      icon: '📊',
      href: '/admin/reports',
      priority: 'low',
      metrics: [
        { label: 'KPIs', value: '—' },
        { label: 'Exportações', value: '—' }
      ],
      alert: 'Compartilhe os KPIs mais recentes.',
      note: 'Padronize a cadência de exportações.',
      items: [
        { label: 'Painéis', href: '/admin/reports' },
        { label: 'Exportações', href: '/admin/reports/exports' },
        { label: 'Agendamentos', href: '/admin/reports/scheduling' }
      ]
    },
    {
      key: 'system',
      title: 'Saúde do Sistema',
      icon: '🖥️',
      href: '/admin/system',
      priority: 'low',
      metrics: [
        { label: 'Disponibilidade', value: '—' },
        { label: 'Erros', value: '—' }
      ],
      alert: 'Acompanhe erros e latência.',
      note: 'Evidencie incidentes rapidamente.',
      items: [
        { label: 'Status', href: '/admin/system' },
        { label: 'Erros', href: '/admin/system/errors' },
        { label: 'Latência', href: '/admin/system/latency' }
      ]
    }
  ];

  const priorityLabel = (p: 'high' | 'normal' | 'low') => (p === 'high' ? 'Alta' : p === 'normal' ? 'Normal' : 'Baixa');

  // Color coding for metric values:
  // Yellow: Pending items awaiting action
  // Red: Late, overdue, urgent, escalations, disputes, errors
  // Green: Expected metrics, active positive numbers, KPIs
  // Blue: Regular standard data, totals, general info
  const getMetricColorClass = (label: string, value: number | string): string => {
    const labelLower = label.toLowerCase();
    const valueStr = String(value).toLowerCase();

    // Red: Late, overdue, urgent, escalations, disputes, errors, conflicts
    if (labelLower.includes('late') || labelLower.includes('overdue') || 
        labelLower.includes('urgent') || labelLower.includes('escalações') || 
        labelLower.includes('escalations') || labelLower.includes('disputa') || 
        labelLower.includes('disputes') || labelLower.includes('erros') || 
        labelLower.includes('errors') || labelLower.includes('conflito') ||
        labelLower.includes('conflicts')) {
      return 'text-red-600 font-black';
    }

    // Yellow: Pending, awaiting, queue items
    if (labelLower.includes('pendente') || labelLower.includes('pending') || 
        labelLower.includes('aguardando') || labelLower.includes('awaiting') ||
        labelLower.includes('solicitações') || labelLower.includes('casos abertos')) {
      return 'text-yellow-600 font-black';
    }

    // Green: Active, positive metrics, KPIs, availability
    if (labelLower.includes('ativa') || labelLower.includes('active') || 
        labelLower.includes('kpi') || labelLower.includes('disponibilidade') ||
        labelLower.includes('availability') || labelLower.includes('campanhas') ||
        labelLower.includes('campaigns') || labelLower.includes('leads')) {
      return 'text-green-600 font-black';
    }

    // Blue: Standard data, totals, general metrics
    return 'text-blue-600 font-bold';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="flex">
        <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-white border-r border-slate-200 min-h-screen px-4 py-6 gap-3 shadow-sm">
          <div className="px-2 pb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">Módulos</p>
          </div>
          {modules.map((module) => (
            <div key={module.key} className="rounded-lg border border-slate-200 bg-white">
              <Link href={module.href} className="px-3 py-2 flex items-center justify-between text-slate-800 hover:bg-blue-50 hover:text-blue-800 rounded-t-lg transition">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-lg" aria-hidden>{module.icon}</span>
                  {module.title}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-slate-400">{priorityLabel(module.priority)}</span>
              </Link>
              {module.items && (
                <div className="px-2 py-2 border-t border-slate-100 space-y-1">
                  {module.items.map((item) => (
                    <Link
                      key={`${module.key}-${item.href}`}
                      href={item.href}
                      className="flex items-center gap-2 px-2 py-1 text-xs text-slate-600 rounded-md hover:bg-slate-50 hover:text-blue-700 transition"
                    >
                      <span className="text-[10px] text-slate-400" aria-hidden>•</span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </aside>

        <main className="flex-1 px-4 md:px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-blue-900">Painel do Admin Master</h1>
              <p className="text-slate-600 mt-1 text-sm">Acesso completo; sinais críticos visíveis com navegação na barra lateral.</p>
            </div>
            <div className="hidden md:flex items-center gap-3 text-sm text-slate-600">
              <Link 
                href="/" 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold"
              >
                ← Voltar ao Portal
              </Link>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs">Ao vivo</span>
              <span>Informações-chave fixas no topo.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {modules
              .sort((a, b) => (a.priority === 'high' && b.priority !== 'high' ? -1 : 0))
              .map((module) => (
                <div key={module.key} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" aria-hidden>{module.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{module.title}</p>
                              <p className="text-xs text-slate-500">Prioridade: {priorityLabel(module.priority)}</p>
                      </div>
                    </div>
                          <Link href={module.href} className="text-xs font-semibold text-blue-700 hover:text-blue-900">Abrir →</Link>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    {module.metrics.map((metric) => (
                      <div key={`${module.key}-${metric.label}`} className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-500 font-semibold">{metric.label}</p>
                        <p className={`text-2xl ${getMetricColorClass(metric.label, metric.value)}`}>
                          {metric.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-sm space-y-2">
                    {module.alert && (
                      <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        <span aria-hidden>⚠️</span>
                        <p className="leading-snug">{module.alert}</p>
                      </div>
                    )}
                    {module.note && (
                      <div className="flex items-start gap-2 text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                        <span aria-hidden>🗒️</span>
                        <p className="leading-snug">{module.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Mensagens & Notas da Equipe</h2>
              <p className="text-sm text-slate-600 mt-1">Espaço para comunicação da equipe, lembretes e atualizações rápidas.</p>
              <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm text-slate-700">
                Sem mensagens ainda. Adicione notas prioritárias aqui para manter todos alinhados.
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Tarefas / Agenda</h2>
              <p className="text-sm text-slate-600 mt-1">Mantenha tarefas urgentes visíveis; rotacione itens diariamente.</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2"><span className="text-green-600" aria-hidden>•</span>Verificações pendentes para revisar hoje.</li>
                <li className="flex items-start gap-2"><span className="text-blue-600" aria-hidden>•</span>Fazer follow-up de documentos rejeitados com proprietários.</li>
                <li className="flex items-start gap-2"><span className="text-amber-600" aria-hidden>•</span>Verificar prontidão de pagamentos antes do corte.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
