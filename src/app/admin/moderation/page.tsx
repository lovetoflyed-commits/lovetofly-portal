"use client";
import { useAuth } from '@/context/AuthContext';
import { hasPermission, Role } from '../accessControl';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, AlertCircle, Ban, CheckCircle, Eye, FileText, Shield, XCircle, MessageSquare, ShieldAlert, UserX, Clock, ArrowLeft } from 'lucide-react';

interface Listing {
  id: number;
  title: string;
  owner: string;
  status: string;
  created_at: string;
}

interface ContentReport {
  id: number;
  reporter_user_id: number;
  content_type: string;
  content_id: number;
  reason: string;
  details: string;
  status: string;
  reporter_name: string;
  reporter_email: string;
  created_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  last_activity_at: string | null;
  active_warnings: number;
  active_strikes: number;
  suspended_until: string | null;
  is_banned: boolean;
  access_level: string;
}

interface ModerationAction {
  id: number;
  user_id: number;
  action_type: string;
  reason: string;
  severity: string;
  issued_at: string;
  issued_by_name: string;
  suspension_end_date: string | null;
}

interface AllModerationAction {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  action_type: string;
  reason: string;
  severity: string;
  is_active: boolean;
  issued_at: string;
  issued_by_name: string;
  suspension_end_date: string | null;
}

interface BadConductAlert {
  id: number;
  alert_type: string;
  priority: string;
  details: string;
  created_at: string;
  resolved_at: string | null;
}

type TabType = 'content' | 'users' | 'alerts';
type FilterType = 'all' | 'active' | 'warned' | 'suspended' | 'banned';

export default function ModerationPanel() {
  const { user, token } = useAuth();
  const router = useRouter();
  const role = user?.role as Role | undefined;

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('content');

  // Content moderation states
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [reportActionLoading, setReportActionLoading] = useState<number | null>(null);
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'actioned' | 'dismissed'>('pending');

  // User moderation states
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [actionType, setActionType] = useState<'warning' | 'strike' | 'suspend' | 'ban' | 'restore'>('warning');
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
  const [suspensionDays, setSuspensionDays] = useState(7);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [history, setHistory] = useState<ModerationAction[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [allActions, setAllActions] = useState<AllModerationAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState<'all' | 'active' | 'resolved'>('active');

  // Alerts states
  const [alerts, setAlerts] = useState<BadConductAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertPriority, setAlertPriority] = useState<'all' | 'high' | 'critical'>('all');

  useEffect(() => {
    if (activeTab === 'content') {
      fetchListings();
    } else if (activeTab === 'users') {
      if (token) {
        fetchUsers();
        fetchAllActions();
      }
    } else if (activeTab === 'alerts') {
      if (token) {
        fetchAlerts();
      }
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (token) {
      fetchReports();
    }
  }, [token, filterStatus]);

  async function fetchListings() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/listings?status=pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchReports() {
    if (!token) return;
    setReportsLoading(true);
    try {
      const statusParam = filterStatus === 'all' ? '' : `?status=${filterStatus}`;
      const res = await fetch(`/api/admin/moderation/reports${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } finally {
      setReportsLoading(false);
    }
  }

  async function fetchUsers() {
    if (!token) return;
    setUserLoading(true);
    try {
      const res = await fetch('/api/admin/user-moderation/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUserLoading(false);
    }
  }

  async function fetchAllActions() {
    if (!token) return;
    setActionsLoading(true);
    try {
      const res = await fetch('/api/admin/user-moderation/all-actions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllActions(data.actions || []);
      }
    } catch (error) {
      console.error('Error fetching moderation actions:', error);
    } finally {
      setActionsLoading(false);
    }
  }

  async function fetchAlerts() {
    if (!token) return;
    setAlertsLoading(true);
    try {
      const res = await fetch('/api/admin/alerts/bad-conduct', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  }

  useEffect(() => {
    applyFilters();
  }, [users, filter, search]);

  async function handleAction(id: number, action: 'approve' | 'reject') {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchListings();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReportAction(id: number, status: 'reviewed' | 'actioned' | 'dismissed', notes?: string) {
    if (!token) return;
    setReportActionLoading(id);
    try {
      const res = await fetch(`/api/admin/moderation/reports/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, admin_notes: notes, reviewed_by: user?.id }),
      });

      if (res.ok) {
        await fetchReports();
        if (showDetailsModal) {
          setShowDetailsModal(false);
        }
      }
    } finally {
      setReportActionLoading(null);
    }
  }

  function applyFilters() {
    let filtered = [...users];

    // Apply status filter
    if (filter === 'active') {
      filtered = filtered.filter(u => u.access_level === 'active' && !u.is_banned && !u.suspended_until);
    } else if (filter === 'warned') {
      filtered = filtered.filter(u => u.active_warnings > 0 || u.active_strikes > 0);
    } else if (filter === 'suspended') {
      filtered = filtered.filter(u => u.suspended_until !== null);
    } else if (filter === 'banned') {
      filtered = filtered.filter(u => u.is_banned);
    }

    // Apply search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(searchLower) ||
        u.first_name?.toLowerCase().includes(searchLower) ||
        u.last_name?.toLowerCase().includes(searchLower) ||
        u.id.toString().includes(searchLower)
      );
    }

    setFilteredUsers(filtered);
  }

  async function fetchHistory(userId: number) {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/user-moderation/history/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }

  function openActionModal(user: User, action: typeof actionType) {
    setSelectedUser(user);
    setActionType(action);
    setReason('');
    setSeverity('normal');
    setSuspensionDays(7);
    setShowActionModal(true);
  }

  function openHistoryModal(user: User) {
    setSelectedUser(user);
    fetchHistory(user.id);
    setShowHistoryModal(true);
  }

  function openMessageModal(user: User) {
    setSelectedUser(user);
    setMessageContent('');
    setShowMessageModal(true);
  }

  async function submitUserAction() {
    if (!token || !selectedUser) return;
    if (!reason.trim()) {
      alert('Por favor, forneça um motivo para a ação.');
      return;
    }

    setUserActionLoading(true);
    try {
      const res = await fetch('/api/admin/moderation/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          actionType,
          reason,
          severity,
          suspensionDays: actionType === 'suspend' ? suspensionDays : null,
          adminId: user?.id,
        }),
      });

      if (res.ok) {
        alert('Ação de moderação aplicada com sucesso!');
        setShowActionModal(false);
        await fetchUsers();
        await fetchAllActions();
      } else {
        const error = await res.json();
        alert(`Erro: ${error.message || 'Falha ao aplicar ação'}`);
      }
    } catch (error) {
      console.error('Error submitting action:', error);
      alert('Erro ao processar ação de moderação');
    } finally {
      setUserActionLoading(false);
    }
  }

  async function submitMessage() {
    if (!token || !selectedUser || !messageContent.trim()) return;

    setMessageLoading(true);
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientUserId: selectedUser.id,
          module: 'moderation',
          subject: 'Notifica\u00e7\u00e3o da Equipe de Modera\u00e7\u00e3o',
          message: messageContent,
          priority: 'high',
          senderType: 'admin',
          metadata: {
            sent_by_admin: true,
            admin_id: user?.id,
          },
        }),
      });

      if (res.ok) {
        alert('Mensagem enviada com sucesso!');
        setShowMessageModal(false);
        setMessageContent('');
      } else {
        const error = await res.json();
        alert(`Erro: ${error.message || 'Falha ao enviar mensagem'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setMessageLoading(false);
    }
  }

  function getUserStatusBadge(user: User) {
    if (user.is_banned) {
      return <span className="px-2 py-1 bg-red-600 text-white text-xs rounded flex items-center gap-1"><Ban size={12} /> Banido</span>;
    }
    if (user.suspended_until) {
      const suspendedDate = new Date(user.suspended_until);
      if (suspendedDate > new Date()) {
        return <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded flex items-center gap-1"><Clock size={12} /> Suspenso</span>;
      }
    }
    if (user.active_strikes > 0) {
      return <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded flex items-center gap-1"><ShieldAlert size={12} /> {user.active_strikes} Strike(s)</span>;
    }
    if (user.active_warnings > 0) {
      return <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded flex items-center gap-1"><AlertCircle size={12} /> {user.active_warnings} Aviso(s)</span>;
    }
    return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded flex items-center gap-1"><CheckCircle size={12} /> Ativo</span>;
  }

  function openReportDetails(report: ContentReport) {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setShowDetailsModal(true);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded flex items-center gap-1"><AlertTriangle size={12} /> Pendente</span>;
      case 'reviewed':
        return <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded flex items-center gap-1"><Eye size={12} /> Revisado</span>;
      case 'actioned':
        return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded flex items-center gap-1"><CheckCircle size={12} /> Ação Tomada</span>;
      case 'dismissed':
        return <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded flex items-center gap-1"><XCircle size={12} /> Dispensado</span>;
      default:
        return <span className="px-2 py-1 bg-slate-400 text-white text-xs rounded">{status}</span>;
    }
  }

  // Wait for auth to load to prevent hydration mismatch
  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Carregando...</p>
      </div>
    );
  }

  const hasContentAccess = role === Role.MASTER || hasPermission(role, 'manage_content');
  const hasUserAccess = role === Role.MASTER || hasPermission(role, 'manage_system');

  if (!hasContentAccess && !hasUserAccess) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-red-600 p-8">
          <b>Acesso negado &mdash; Sistema de Moderação</b>
          <div className="mt-2 text-slate-700">
            Você não tem permissões para acessar nenhuma seção de moderação.
            <br />
            Caso precise atuar na moderação, solicite permissão ao responsável pelo setor ou ao administrador master.
          </div>
        </div>
        <div className="text-center mt-8">
          <button onClick={() => router.push('/admin')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-800 flex items-center gap-2 mx-auto">
            <ArrowLeft size={20} /> Voltar ao Painel Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-red-900 flex items-center gap-2">
            <Shield size={32} className="text-red-700" />
            Sistema de Moderação
          </h1>
          <p className="text-slate-700 mt-2">Gerencie conteúdo, usuários, denúncias e alertas do sistema.</p>
        </div>
        <button onClick={() => router.push('/admin')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-800 flex items-center gap-2">
          <ArrowLeft size={20} /> Voltar
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md p-2 mb-6 flex gap-2 flex-wrap border-b">
        {hasContentAccess && (
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'content' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
          >
            Moderação de Conteúdo
          </button>
        )}
        {hasUserAccess && (
          <>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
            >
              Moderação de Usuários
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'alerts' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
            >
              Alertas de Má Conduta
            </button>
          </>
        )}
      </div>

      {/* Content Moderation Section */}
      {activeTab === 'content' && (
        <>
          {/* Pending Listings Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText size={20} className="text-slate-600" />
              Anúncios Pendentes para Aprovação
            </h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-slate-600">Carregando anúncios...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-2">ID</th>
                      <th className="p-2">Título</th>
                      <th className="p-2">Proprietário</th>
                      <th className="p-2">Criado em</th>
                      <th className="p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-600">
                          Nenhum anúncio pendente.
                        </td>
                      </tr>
                    )}
                    {listings.map(listing => (
                      <tr key={listing.id} className="border-t hover:bg-slate-50">
                        <td className="p-2">{listing.id}</td>
                        <td className="p-2">{listing.title}</td>
                        <td className="p-2">{listing.owner}</td>
                        <td className="p-2">{new Date(listing.created_at).toLocaleString('pt-BR')}</td>
                        <td className="p-2">
                          <button
                            className="bg-green-600 text-white px-3 py-1 rounded mr-2 hover:bg-green-700 text-sm"
                            disabled={actionLoading === listing.id}
                            onClick={() => handleAction(listing.id, 'approve')}
                          >Aprovar</button>
                          <button
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                            disabled={actionLoading === listing.id}
                            onClick={() => handleAction(listing.id, 'reject')}
                          >Rejeitar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Content Reports Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <AlertTriangle size={20} className="text-yellow-600" />
                Denúncias de Conteúdo
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded text-sm ${filterStatus === 'all' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1 rounded text-sm ${filterStatus === 'pending' ? 'bg-yellow-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                >
                  Pendentes
                </button>
                <button
                  onClick={() => setFilterStatus('reviewed')}
                  className={`px-3 py-1 rounded text-sm ${filterStatus === 'reviewed' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                >
                  Revisadas
                </button>
                <button
                  onClick={() => setFilterStatus('actioned')}
                  className={`px-3 py-1 rounded text-sm ${filterStatus === 'actioned' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                >
                  Ação Tomada
                </button>
                <button
                  onClick={() => setFilterStatus('dismissed')}
                  className={`px-3 py-1 rounded text-sm ${filterStatus === 'dismissed' ? 'bg-gray-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                >
                  Dispensadas
                </button>
              </div>
            </div>

            {reportsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-slate-600">Carregando denúncias...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-2">ID</th>
                      <th className="p-2">Tipo</th>
                      <th className="p-2">Conteúdo</th>
                      <th className="p-2">Motivo</th>
                      <th className="p-2">Reportado por</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Criado em</th>
                      <th className="p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-600">
                          Nenhuma denúncia {filterStatus !== 'all' && `com status "${filterStatus}"`}.
                        </td>
                      </tr>
                    )}
                    {reports.map(report => (
                      <tr key={report.id} className="border-t hover:bg-slate-50">
                        <td className="p-2">{report.id}</td>
                        <td className="p-2">{report.content_type}</td>
                        <td className="p-2">#{report.content_id}</td>
                        <td className="p-2 max-w-xs truncate" title={report.reason}>{report.reason}</td>
                        <td className="p-2">{report.reporter_name || report.reporter_email}</td>
                        <td className="p-2">{getStatusBadge(report.status)}</td>
                        <td className="p-2 text-sm">{new Date(report.created_at).toLocaleString('pt-BR')}</td>
                        <td className="p-2">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-xs"
                              onClick={() => openReportDetails(report)}
                            >
                              <Eye size={14} /> Detalhes
                            </button>
                            {report.status === 'pending' && (
                              <>
                                <button
                                  className="p-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-xs"
                                  disabled={reportActionLoading === report.id}
                                  onClick={() => handleReportAction(report.id, 'reviewed')}
                                >
                                  Revisar
                                </button>
                                <button
                                  className="p-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                  disabled={reportActionLoading === report.id}
                                  onClick={() => handleReportAction(report.id, 'actioned')}
                                >
                                  Ação
                                </button>
                                <button
                                  className="p-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
                                  disabled={reportActionLoading === report.id}
                                  onClick={() => handleReportAction(report.id, 'dismissed')}
                                >
                                  Dispensar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* User Moderation Section */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield size={20} className="text-red-600" />
            Moderação de Usuários
          </h2>

          {/* Filter and Search */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-red-600 text-white' : 'bg-slate-200'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded text-sm ${filter === 'active' ? 'bg-green-600 text-white' : 'bg-slate-200'}`}
            >
              Ativos
            </button>
            <button
              onClick={() => setFilter('warned')}
              className={`px-3 py-1 rounded text-sm ${filter === 'warned' ? 'bg-yellow-600 text-white' : 'bg-slate-200'}`}
            >
              Com Avisos
            </button>
            <button
              onClick={() => setFilter('suspended')}
              className={`px-3 py-1 rounded text-sm ${filter === 'suspended' ? 'bg-orange-600 text-white' : 'bg-slate-200'}`}
            >
              Suspensos
            </button>
            <button
              onClick={() => setFilter('banned')}
              className={`px-3 py-1 rounded text-sm ${filter === 'banned' ? 'bg-red-800 text-white' : 'bg-slate-200'}`}
            >
              Banidos
            </button>
            <input
              type="text"
              placeholder="Buscar por email, nome ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-1 border border-slate-300 rounded"
            />
          </div>

          {/* Users Table */}
          {userLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-slate-600">Carregando usuários...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-2">ID</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Nome</th>
                    <th className="p-2">Avisos</th>
                    <th className="p-2">Strikes</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-600">
                        Nenhum usuário encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t hover:bg-slate-50">
                      <td className="p-2">{user.id}</td>
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">{user.first_name} {user.last_name}</td>
                      <td className="p-2 text-center">
                        {user.active_warnings > 0 && (
                          <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">{user.active_warnings}</span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {user.active_strikes > 0 && (
                          <span className="px-2 py-1 bg-orange-200 text-orange-800 rounded text-xs">{user.active_strikes}</span>
                        )}
                      </td>
                      <td className="p-2">{getUserStatusBadge(user)}</td>
                      <td className="p-2">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            onClick={() => openHistoryModal(user)}
                          >
                            Histórico
                          </button>
                          <button
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            onClick={() => openActionModal(user, 'warning')}
                          >
                            Ação
                          </button>
                          <button
                            className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                            onClick={() => openMessageModal(user)}
                          >
                            Mensagem
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Recent Actions */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3">Ações de Moderação Recentes</h3>
            {actionsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {allActions.length === 0 && (
                  <p className="text-slate-600 text-center py-4">Nenhuma ação de moderação registrada ainda.</p>
                )}
                {allActions.slice(0, 10).map((action) => (
                  <div key={action.id} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <div>
                      <span className="font-medium">{action.user_name}</span> ({action.user_email})
                      <span className="mx-2">•</span>
                      <span className={`px-2 py-1 rounded text-xs ${action.action_type === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                        action.action_type === 'strike' ? 'bg-orange-200 text-orange-800' :
                          action.action_type === 'suspend' ? 'bg-red-200 text-red-800' :
                            action.action_type === 'ban' ? 'bg-red-800 text-white' :
                              'bg-green-200 text-green-800'
                        }`}>{action.action_type.toUpperCase()}</span>
                      <p className="text-sm text-slate-600 mt-1">{action.reason}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div>{new Date(action.issued_at).toLocaleString('pt-BR')}</div>
                      {action.issued_by_name && <div>Por: {action.issued_by_name}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ShieldAlert size={20} className="text-red-600" />
              Alertas de Má Conduta
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setAlertPriority('all')}
                className={`px-3 py-1 rounded text-sm ${alertPriority === 'all' ? 'bg-red-600 text-white' : 'bg-slate-200'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setAlertPriority('high')}
                className={`px-3 py-1 rounded text-sm ${alertPriority === 'high' ? 'bg-orange-600 text-white' : 'bg-slate-200'}`}
              >
                Alta Prioridade
              </button>
              <button
                onClick={() => setAlertPriority('critical')}
                className={`px-3 py-1 rounded text-sm ${alertPriority === 'critical' ? 'bg-red-800 text-white' : 'bg-slate-200'}`}
              >
                Crítico
              </button>
            </div>
          </div>

          {alertsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-2 text-slate-600">Carregando alertas...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.length === 0 && (
                <p className="text-slate-600 text-center py-8">Nenhum alerta de má conduta registrado.</p>
              )}
              {alerts
                .filter(alert => alertPriority === 'all' || alert.priority === alertPriority)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded border-l-4 ${alert.priority === 'critical' ? 'border-red-800 bg-red-50' :
                      alert.priority === 'high' ? 'border-orange-600 bg-orange-50' :
                        'border-yellow-500 bg-yellow-50'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${alert.priority === 'critical' ? 'bg-red-800 text-white' :
                            alert.priority === 'high' ? 'bg-orange-600 text-white' :
                              'bg-yellow-600 text-white'
                            }`}>
                            {alert.priority.toUpperCase()}
                          </span>
                          <span className="font-medium">{alert.alert_type}</span>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">{alert.description}</p>
                        <div className="text-xs text-slate-500">
                          Usuário ID: {alert.user_id} • {new Date(alert.created_at).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        onClick={() => openHistoryModal(alert.user_id)}
                      >
                        Ver Usuário
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Aplicar Ação de Moderação</h2>
            <p className="mb-4">Usuário: <strong>{selectedUser.email}</strong></p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Ação</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="warning">Aviso</option>
                  <option value="strike">Strike</option>
                  <option value="suspend">Suspensão</option>
                  <option value="ban">Banimento</option>
                  <option value="restore">Restaurar Acesso</option>
                </select>
              </div>

              {actionType === 'suspend' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Dias de Suspensão</label>
                  <input
                    type="number"
                    value={suspensionDays}
                    onChange={(e) => setSuspensionDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded"
                    min="1"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Severidade</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="low">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Motivo</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Descreva o motivo da ação..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={submitUserAction}
                  disabled={userActionLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {userActionLoading ? 'Aplicando...' : 'Aplicar Ação'}
                </button>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 bg-slate-300 text-slate-700 px-4 py-2 rounded hover:bg-slate-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Histórico de Moderação</h2>
            <p className="mb-4">Usuário: <strong>{selectedUser.email}</strong></p>

            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Nenhum histórico de moderação encontrado.</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="border rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${item.action_type === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                        item.action_type === 'strike' ? 'bg-orange-200 text-orange-800' :
                          item.action_type === 'suspend' ? 'bg-red-200 text-red-800' :
                            item.action_type === 'ban' ? 'bg-red-800 text-white' :
                              'bg-green-200 text-green-800'
                        }`}>
                        {item.action_type.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(item.issued_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm mb-1"><strong>Motivo:</strong> {item.reason}</p>
                    <p className="text-xs text-slate-600">Severidade: {item.severity}</p>
                    {item.issued_by_name && (
                      <p className="text-xs text-slate-600">Emitido por: {item.issued_by_name}</p>
                    )}
                    {item.suspension_end_date && (
                      <p className="text-xs text-slate-600">
                        Suspensão até: {new Date(item.suspension_end_date).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="mt-6 w-full bg-slate-300 text-slate-700 px-4 py-2 rounded hover:bg-slate-400"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Enviar Mensagem</h2>
            <p className="mb-4">Para: <strong>{selectedUser.email}</strong></p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mensagem</label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Digite sua mensagem..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={submitMessage}
                  disabled={messageLoading}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {messageLoading ? 'Enviando...' : 'Enviar'}
                </button>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 bg-slate-300 text-slate-700 px-4 py-2 rounded hover:bg-slate-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText size={24} className="text-blue-600" />
              Detalhes da Denúncia #{selectedReport.id}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Tipo de Conteúdo</label>
                  <p className="text-slate-900">{selectedReport.content_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">ID do Conteúdo</label>
                  <p className="text-slate-900">#{selectedReport.content_id}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Reportado por</label>
                <p className="text-slate-900">{selectedReport.reporter_name || selectedReport.reporter_email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Motivo</label>
                <p className="text-slate-900">{selectedReport.reason}</p>
              </div>

              {selectedReport.details && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Detalhes Adicionais</label>
                  <p className="text-slate-900 whitespace-pre-wrap">{selectedReport.details}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700">Status Atual</label>
                <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Data de Criação</label>
                <p className="text-slate-900">{new Date(selectedReport.created_at).toLocaleString('pt-BR')}</p>
              </div>

              {selectedReport.reviewed_at && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Revisado em</label>
                  <p className="text-slate-900">{new Date(selectedReport.reviewed_at).toLocaleString('pt-BR')}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notas do Administrador</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  placeholder="Adicione notas sobre a revisão..."
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              {selectedReport.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                    disabled={reportActionLoading === selectedReport.id}
                    onClick={() => handleReportAction(selectedReport.id, 'reviewed', adminNotes)}
                  >
                    Marcar como Revisado
                  </button>
                  <button
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    disabled={reportActionLoading === selectedReport.id}
                    onClick={() => handleReportAction(selectedReport.id, 'actioned', adminNotes)}
                  >
                    Ação Tomada
                  </button>
                  <button
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    disabled={reportActionLoading === selectedReport.id}
                    onClick={() => handleReportAction(selectedReport.id, 'dismissed', adminNotes)}
                  >
                    Dispensar
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDetailsModal(false)}
              className="mt-6 w-full bg-slate-300 text-slate-700 px-4 py-2 rounded hover:bg-slate-400"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="text-center mt-8">
        <button onClick={() => router.push('/admin')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-800">← Voltar ao Painel Admin</button>
      </div>
    </div>
  );
}
