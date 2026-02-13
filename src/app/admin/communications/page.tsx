/**
 * Admin Communications Dashboard
 * /admin/communications
 * 
 * Features:
 * - Send individual messages to users
 * - Broadcast messages to multiple users
 * - View all messages (sent/received)
 * - Statistics dashboard
 * - Message reports management
 * - Advanced filters
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    Send,
    Users,
    MessageSquare,
    TrendingUp,
    AlertTriangle,
    Filter,
    Search,
    Mail,
    BarChart3
} from 'lucide-react';

interface Stats {
    totalMessages: number;
    totalReports: number;
    pendingReports: number;
    todayMessages: number;
}

interface Report {
    id: number;
    message_id: number;
    reporter_user_id: string;
    reporter_name: string;
    reason: string;
    details: string;
    status: string;
    created_at: string;
    message_subject: string;
    message_sender: string;
}

// Page props are passed by Next.js even if not used
interface PageProps {
    params?: Promise<{ [key: string]: string | string[] }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function AdminCommunicationsPage({ params, searchParams }: PageProps) {
    const { user, token } = useAuth();
    const router = useRouter();

    // Suppress hydration warning by using a stable value during SSR
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const [activeTab, setActiveTab] = useState<'send' | 'broadcast' | 'inbox' | 'sent' | 'reports' | 'stats'>('send');
    const [loading, setLoading] = useState(false);

    // Send Individual
    const [recipientEmail, setRecipientEmail] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const [module, setModule] = useState('portal');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('normal');

    // Broadcast
    const [broadcastModule, setBroadcastModule] = useState('all');
    const [broadcastSubject, setBroadcastSubject] = useState('');
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastPriority, setBroadcastPriority] = useState('normal');
    const [broadcastTargetCount, setBroadcastTargetCount] = useState(0);

    // Reports
    const [reports, setReports] = useState<Report[]>([]);
    const [reportsFilter, setReportsFilter] = useState<'all' | 'pending' | 'reviewing' | 'resolved'>('pending');

    // Stats
    const [stats, setStats] = useState<Stats>({
        totalMessages: 0,
        totalReports: 0,
        pendingReports: 0,
        todayMessages: 0,
    });

    // Inbox
    const [inboxMessages, setInboxMessages] = useState<any[]>([]);
    const [inboxFilter, setInboxFilter] = useState<'all' | 'unread' | 'read'>('unread');
    const [inboxArchiveFilter, setInboxArchiveFilter] = useState<'active' | 'archived' | 'all'>('active');
    const [inboxLoading, setInboxLoading] = useState(false);
    const [selectedInboxIds, setSelectedInboxIds] = useState<number[]>([]);

    // Sent
    const [sentMessages, setSentMessages] = useState<any[]>([]);
    const [sentModuleFilter, setSentModuleFilter] = useState('all');
    const [sentPriorityFilter, setSentPriorityFilter] = useState('all');
    const [sentArchiveFilter, setSentArchiveFilter] = useState<'active' | 'archived' | 'all'>('active');
    const [sentLoading, setSentLoading] = useState(false);
    const [selectedSentIds, setSelectedSentIds] = useState<number[]>([]);

    // All messages (admin)
    const [allMessages, setAllMessages] = useState<any[]>([]);
    const [allMessagesLoading, setAllMessagesLoading] = useState(false);
    const [allMessagesTotal, setAllMessagesTotal] = useState(0);
    const [allMessagesPage, setAllMessagesPage] = useState(1);
    const [allMessagesFilters, setAllMessagesFilters] = useState({
        module: 'all',
        status: 'all',
        priority: 'all',
        archive: 'active',
        search: '',
    });

    const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
    const [selectedMessageSource, setSelectedMessageSource] = useState<'inbox' | 'sent' | 'all' | null>(null);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);

    // Check admin access
    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        // Check if user has admin/staff privileges (same as main admin dashboard)
        const hasAdminAccess =
            user.role === 'master' ||
            user.role === 'admin' ||
            user.role === 'staff' ||
            user.email === 'lovetofly.ed@gmail.com';

        if (!hasAdminAccess) {
            router.push('/');
            return;
        }
    }, [user, router]);

    // Fetch recipient by email
    const searchRecipient = async () => {
        if (!recipientEmail.trim() || !token) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/admin/users/search?email=${encodeURIComponent(recipientEmail)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data?.user) {
                    setRecipientId(data.data.user.id);
                    alert(`Usuário encontrado: ${data.data.user.name || data.data.user.email}`);
                } else {
                    alert('Usuário não encontrado');
                    setRecipientId('');
                }
            }
        } catch (error) {
            console.error('Error searching user:', error);
            alert('Erro ao buscar usuário');
        } finally {
            setLoading(false);
        }
    };

    // Send individual message
    const sendMessage = async () => {
        if (!recipientId || !subject.trim() || !message.trim() || !token) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    recipientUserId: recipientId,
                    module,
                    subject,
                    message,
                    priority,
                    metadata: {
                        sent_by: 'admin',
                        sent_from: 'admin_dashboard',
                    },
                }),
            });

            if (response.ok) {
                const result = await response.json();
                alert('Mensagem enviada com sucesso!');

                // Clear form
                setRecipientEmail('');
                setRecipientId('');
                setSubject('');
                setMessage('');

                if (result.data?.contentModified) {
                    alert('Aviso: Alguns conteúdos foram bloqueados por política de segurança.');
                }
            } else {
                const error = await response.json();
                alert(error.message || 'Erro ao enviar mensagem');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Erro ao enviar mensagem');
        } finally {
            setLoading(false);
        }
    };

    // Broadcast message
    const sendBroadcast = async () => {
        console.log('[Broadcast UI] Sending with targetCount:', broadcastTargetCount, 'module:', broadcastModule);

        if (!broadcastSubject.trim() || !broadcastMessage.trim() || !token) {
            alert('Preencha assunto e mensagem');
            return;
        }

        // Ensure we have a valid count
        if (broadcastTargetCount === 0) {
            alert('Nenhum usuário disponível para envio. Verifique o módulo selecionado.');
            return;
        }

        const confirmed = confirm(
            `Confirma envio em massa para ${broadcastTargetCount} usuários?\n\n` +
            `Módulo: ${broadcastModule}\n` +
            `Prioridade: ${broadcastPriority}\n\n` +
            `Esta ação não pode ser desfeita.`
        );

        if (!confirmed) return;

        setLoading(true);
        try {
            const response = await fetch('/api/admin/messages/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    module: broadcastModule === 'all' ? 'portal' : broadcastModule,
                    subject: broadcastSubject,
                    message: broadcastMessage,
                    priority: broadcastPriority,
                    targetFilter: broadcastModule === 'all' ? 'all_users' : `module_${broadcastModule}`,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Broadcast enviado com sucesso para ${result.data?.sentCount || 0} usuários!`);

                // Clear form
                setBroadcastSubject('');
                setBroadcastMessage('');
            } else {
                const error = await response.json();
                alert(error.message || 'Erro ao enviar broadcast');
            }
        } catch (error) {
            console.error('Error sending broadcast:', error);
            alert('Erro ao enviar broadcast');
        } finally {
            setLoading(false);
        }
    };

    // Fetch reports
    const fetchReports = async () => {
        if (!token) return;

        try {
            const response = await fetch(`/api/admin/messages/reports?status=${reportsFilter}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setReports(data.data?.reports || []);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
    };

    // Fetch stats
    const fetchStats = async () => {
        if (!token) return;

        try {
            const response = await fetch('/api/admin/messages/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data.data || stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Fetch inbox messages
    const fetchInbox = async () => {
        if (!token) return;

        setInboxLoading(true);
        try {
            const response = await fetch(`/api/messages/inbox?status=${inboxFilter}&archive=${inboxArchiveFilter}&limit=50`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                cache: 'no-store',
            });

            if (response.ok) {
                const data = await response.json();
                setInboxMessages(data.data?.messages || []);
            } else {
                console.error('Error fetching inbox:', response.status);
            }
        } catch (error) {
            console.error('Error fetching inbox:', error);
        } finally {
            setInboxLoading(false);
        }
    };

    const fetchSent = async () => {
        if (!token) return;

        setSentLoading(true);
        try {
            const moduleParam = sentModuleFilter !== 'all' ? `&module=${sentModuleFilter}` : '';
            const priorityParam = sentPriorityFilter !== 'all' ? `&priority=${sentPriorityFilter}` : '';
            const archiveParam = sentArchiveFilter !== 'all' ? `&archive=${sentArchiveFilter}` : '';
            const response = await fetch(`/api/messages/sent?limit=50${moduleParam}${priorityParam}${archiveParam}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setSentMessages(data.data?.messages || []);
            } else {
                console.error('Error fetching sent:', response.status);
            }
        } catch (error) {
            console.error('Error fetching sent:', error);
        } finally {
            setSentLoading(false);
        }
    };

    const fetchAllMessages = async () => {
        if (!token) return;

        setAllMessagesLoading(true);
        try {
            const params = new URLSearchParams({
                module: allMessagesFilters.module,
                status: allMessagesFilters.status,
                priority: allMessagesFilters.priority,
                archive: allMessagesFilters.archive,
                search: allMessagesFilters.search,
                page: String(allMessagesPage),
                limit: '50',
            });
            const response = await fetch(`/api/admin/messages/all?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAllMessages(data.data?.messages || []);
                setAllMessagesTotal(data.data?.pagination?.total || 0);
            } else {
                console.error('Error fetching all messages:', response.status);
            }
        } catch (error) {
            console.error('Error fetching all messages:', error);
        } finally {
            setAllMessagesLoading(false);
        }
    };

    const markMessageAsRead = async (messageId: number) => {
        if (!token) return;

        try {
            const response = await fetch(`/api/messages/${messageId}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error('Error marking message as read:', response.status, errorBody);
            }
            return response.ok;
        } catch (error) {
            console.error('Error marking message as read:', error);
            return false;
        }
    };

    const performBulkAction = async (scope: 'inbox' | 'sent', action: 'mark_read' | 'mark_unread' | 'archive' | 'unarchive') => {
        if (!token || bulkActionLoading) return;

        const ids = scope === 'inbox' ? selectedInboxIds : selectedSentIds;
        if (ids.length === 0) return;

        setBulkActionLoading(true);
        try {
            const response = await fetch('/api/messages/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ messageIds: ids, action, scope }),
            });

            if (response.ok) {
                if (scope === 'inbox') {
                    setSelectedInboxIds([]);
                    await fetchInbox();
                } else {
                    setSelectedSentIds([]);
                    await fetchSent();
                }
            } else {
                const errorBody = await response.text();
                console.error('Error performing bulk action:', response.status, errorBody);
            }
        } catch (error) {
            console.error('Error performing bulk action:', error);
        } finally {
            setBulkActionLoading(false);
        }
    };

    const archiveOldMessages = async (scope: 'inbox' | 'sent') => {
        if (!token || bulkActionLoading) return;

        setBulkActionLoading(true);
        try {
            const response = await fetch('/api/messages/archive-old', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ scope, days: 30 }),
            });

            if (response.ok) {
                if (scope === 'inbox') {
                    await fetchInbox();
                } else {
                    await fetchSent();
                }
            } else {
                const errorBody = await response.text();
                console.error('Error archiving old messages:', response.status, errorBody);
            }
        } catch (error) {
            console.error('Error archiving old messages:', error);
        } finally {
            setBulkActionLoading(false);
        }
    };

    const toggleInboxSelection = (messageId: number) => {
        setSelectedInboxIds((prev) =>
            prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId]
        );
    };

    const toggleSentSelection = (messageId: number) => {
        setSelectedSentIds((prev) =>
            prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId]
        );
    };

    const toggleSelectAllInbox = () => {
        if (selectedInboxIds.length === inboxMessages.length) {
            setSelectedInboxIds([]);
        } else {
            setSelectedInboxIds(inboxMessages.map((msg) => msg.id));
        }
    };

    const toggleSelectAllSent = () => {
        if (selectedSentIds.length === sentMessages.length) {
            setSelectedSentIds([]);
        } else {
            setSelectedSentIds(sentMessages.map((msg) => msg.id));
        }
    };

    const openInboxMessage = async (message: any) => {
        setSelectedMessage(message);
        setSelectedMessageSource('inbox');

        if (!message.is_read) {
            const updated = await markMessageAsRead(message.id);
            if (updated) {
                if (inboxFilter === 'unread') {
                    setInboxMessages((prev) => prev.filter((item) => item.id !== message.id));
                } else {
                    setInboxMessages((prev) =>
                        prev.map((item) => (item.id === message.id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item))
                    );
                }
                await fetchInbox();
            }
        }
    };

    const openSentMessage = (message: any) => {
        setSelectedMessage(message);
        setSelectedMessageSource('sent');
    };

    const openAllMessage = (message: any) => {
        setSelectedMessage(message);
        setSelectedMessageSource('all');
    };

    useEffect(() => {
        setSelectedInboxIds((prev) => prev.filter((id) => inboxMessages.some((msg) => msg.id === id)));
    }, [inboxMessages]);

    useEffect(() => {
        setSelectedSentIds((prev) => prev.filter((id) => sentMessages.some((msg) => msg.id === id)));
    }, [sentMessages]);

    // Load data based on active tab
    useEffect(() => {
        if (activeTab === 'reports') {
            fetchReports();
        } else if (activeTab === 'stats') {
            fetchStats();
            fetchAllMessages();
        } else if (activeTab === 'inbox') {
            fetchInbox();
        } else if (activeTab === 'sent') {
            fetchSent();
        }
    }, [activeTab, reportsFilter, inboxFilter, inboxArchiveFilter, sentModuleFilter, sentPriorityFilter, sentArchiveFilter, allMessagesFilters, allMessagesPage, token]);

    // Estimate broadcast count
    useEffect(() => {
        console.log('[Broadcast Count] Fetching for module:', broadcastModule, 'hasToken:', !!token);

        if (broadcastModule && token) {
            console.log('[Broadcast Count] Making request to /api/admin/users/count?module=' + broadcastModule);
            fetch(`/api/admin/users/count?module=${broadcastModule}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            })
                .then(res => {
                    console.log('[Broadcast Count] Response status:', res.status);
                    return res.json();
                })
                .then(data => {
                    console.log('[Broadcast Count] Response data:', data);
                    const newCount = data.data?.count || 0;
                    console.log('[Broadcast Count] Setting count to:', newCount);
                    setBroadcastTargetCount(newCount);
                })
                .catch(err => {
                    console.error('[Broadcast Count] Error:', err);
                    setBroadcastTargetCount(0);
                });
        }
    }, [broadcastModule, token]);

    // Render loading state while hydrating or fetching user data
    if (!isMounted || !user) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center py-12">
                        <p className="text-gray-500">Carregando...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Comunicações Administrativas</h1>
                        <p className="text-gray-600">Envie mensagens, gerencie denúncias e visualize estatísticas</p>
                    </div>
                    <button
                        onClick={() => router.push('/admin')}
                        className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                    >
                        Voltar ao Dashboard
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('send')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${activeTab === 'send'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Send className="w-4 h-4" />
                                    Enviar Individual
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab('broadcast')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${activeTab === 'broadcast'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Broadcast
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab('inbox')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${activeTab === 'inbox'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Caixa de Entrada
                                    {stats.todayMessages > 0 && (
                                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                            {inboxMessages.filter(m => !m.is_read).length}
                                        </span>
                                    )}
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab('sent')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${activeTab === 'sent'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Enviadas
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab('reports')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${activeTab === 'reports'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Denúncias
                                    {stats.pendingReports > 0 && (
                                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                            {stats.pendingReports}
                                        </span>
                                    )}
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab('stats')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${activeTab === 'stats'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Estatísticas
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    {/* Send Individual Tab */}
                    {activeTab === 'send' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Enviar Mensagem Individual</h2>

                                {/* Recipient Search */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email do Destinatário *
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            value={recipientEmail}
                                            onChange={(e) => setRecipientEmail(e.target.value)}
                                            placeholder="usuario@exemplo.com"
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <button
                                            onClick={searchRecipient}
                                            disabled={loading || !recipientEmail.trim()}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <Search className="w-4 h-4" />
                                            Buscar
                                        </button>
                                    </div>
                                    {recipientId && (
                                        <p className="mt-2 text-sm text-green-600">✓ Usuário encontrado (ID: {recipientId})</p>
                                    )}
                                </div>

                                {/* Module */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Módulo *
                                    </label>
                                    <select
                                        value={module}
                                        onChange={(e) => setModule(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="portal">Portal</option>
                                        <option value="moderation">Moderação</option>
                                        <option value="support">Suporte</option>
                                        <option value="hangarshare">HangarShare</option>
                                        <option value="career">Carreiras</option>
                                    </select>
                                </div>

                                {/* Priority */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Prioridade
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="low">Baixa</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">Alta</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                </div>

                                {/* Subject */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Assunto *
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Assunto da mensagem"
                                        maxLength={255}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Message */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mensagem *
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Digite sua mensagem..."
                                        rows={8}
                                        maxLength={10000}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">{message.length} / 10000 caracteres</p>
                                </div>

                                {/* Send Button */}
                                <button
                                    onClick={sendMessage}
                                    disabled={loading || !recipientId || !subject.trim() || !message.trim()}
                                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Enviar Mensagem
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Broadcast Tab */}
                    {activeTab === 'broadcast' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Envio em Massa (Broadcast)</h2>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-yellow-800">Atenção</p>
                                            <p className="text-sm text-yellow-700 mt-1">
                                                O envio em massa não pode ser desfeito. Verifique cuidadosamente antes de confirmar.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Target */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Público Alvo *
                                    </label>
                                    <select
                                        value={broadcastModule}
                                        onChange={(e) => setBroadcastModule(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">Todos os usuários ({broadcastTargetCount})</option>
                                        <option value="hangarshare">Usuários HangarShare</option>
                                        <option value="career">Usuários Carreiras</option>
                                    </select>
                                </div>

                                {/* Priority */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Prioridade
                                    </label>
                                    <select
                                        value={broadcastPriority}
                                        onChange={(e) => setBroadcastPriority(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="low">Baixa</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">Alta</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                </div>

                                {/* Subject */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Assunto *
                                    </label>
                                    <input
                                        type="text"
                                        value={broadcastSubject}
                                        onChange={(e) => setBroadcastSubject(e.target.value)}
                                        placeholder="Assunto da mensagem"
                                        maxLength={255}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Message */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mensagem *
                                    </label>
                                    <textarea
                                        value={broadcastMessage}
                                        onChange={(e) => setBroadcastMessage(e.target.value)}
                                        placeholder="Digite sua mensagem..."
                                        rows={8}
                                        maxLength={10000}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">{broadcastMessage.length} / 10000 caracteres</p>
                                </div>

                                {/* Send Broadcast Button */}
                                <button
                                    onClick={sendBroadcast}
                                    disabled={loading || !broadcastSubject.trim() || !broadcastMessage.trim() || broadcastTargetCount === 0}
                                    className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Users className="w-5 h-5" />
                                            Enviar para {broadcastTargetCount} usuários
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Reports Tab */}
                    {activeTab === 'reports' && (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Denúncias de Mensagens</h2>

                            {/* Filter */}
                            <div className="mb-4">
                                <select
                                    value={reportsFilter}
                                    onChange={(e) => setReportsFilter(e.target.value as any)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Todas</option>
                                    <option value="pending">Pendentes</option>
                                    <option value="reviewing">Em Revisão</option>
                                    <option value="resolved">Resolvidas</option>
                                </select>
                            </div>

                            {/* Reports List */}
                            <div className="space-y-4">
                                {reports.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        Nenhuma denúncia encontrada
                                    </div>
                                ) : (
                                    reports.map((report) => (
                                        <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{report.message_subject}</p>
                                                    <p className="text-sm text-gray-600">De: {report.message_sender}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    report.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {report.status}
                                                </span>
                                            </div>

                                            <p className="text-sm text-gray-700 mb-2">
                                                <span className="font-medium">Motivo:</span> {report.reason}
                                            </p>

                                            {report.details && (
                                                <p className="text-sm text-gray-600 mb-2">{report.details}</p>
                                            )}

                                            <p className="text-xs text-gray-500">
                                                Reportado por {report.reporter_name} em {new Date(report.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Inbox Tab */}
                    {activeTab === 'inbox' && (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Caixa de Entrada</h2>

                            {/* Filter */}
                            <div className="mb-4 flex flex-wrap gap-2">
                                <button
                                    onClick={() => setInboxFilter('unread')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${inboxFilter === 'unread'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Não Lidas
                                </button>
                                <button
                                    onClick={() => setInboxFilter('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${inboxFilter === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Todas
                                </button>
                                <button
                                    onClick={() => setInboxFilter('read')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${inboxFilter === 'read'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Lidas
                                </button>
                                <select
                                    value={inboxArchiveFilter}
                                    onChange={(e) => setInboxArchiveFilter(e.target.value as any)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="active">Ativas</option>
                                    <option value="archived">Arquivadas</option>
                                    <option value="all">Todas</option>
                                </select>
                            </div>

                            {inboxMessages.length > 0 && (
                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={selectedInboxIds.length > 0 && selectedInboxIds.length === inboxMessages.length}
                                            onChange={toggleSelectAllInbox}
                                            className="h-4 w-4"
                                        />
                                        Selecionar todas
                                    </label>
                                    <button
                                        onClick={() => performBulkAction('inbox', 'mark_read')}
                                        disabled={selectedInboxIds.length === 0 || bulkActionLoading}
                                        className="px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg disabled:opacity-50"
                                    >
                                        Marcar como lida
                                    </button>
                                    <button
                                        onClick={() => performBulkAction('inbox', 'mark_unread')}
                                        disabled={selectedInboxIds.length === 0 || bulkActionLoading}
                                        className="px-3 py-2 text-xs font-medium bg-gray-700 text-white rounded-lg disabled:opacity-50"
                                    >
                                        Marcar como nao lida
                                    </button>
                                    <button
                                        onClick={() => performBulkAction('inbox', 'archive')}
                                        disabled={selectedInboxIds.length === 0 || bulkActionLoading}
                                        className="px-3 py-2 text-xs font-medium bg-orange-600 text-white rounded-lg disabled:opacity-50"
                                    >
                                        Arquivar
                                    </button>
                                    <button
                                        onClick={() => performBulkAction('inbox', 'unarchive')}
                                        disabled={selectedInboxIds.length === 0 || bulkActionLoading}
                                        className="px-3 py-2 text-xs font-medium bg-gray-600 text-white rounded-lg disabled:opacity-50"
                                    >
                                        Desarquivar
                                    </button>
                                    <button
                                        onClick={() => archiveOldMessages('inbox')}
                                        disabled={bulkActionLoading}
                                        className="px-3 py-2 text-xs font-medium bg-gray-900 text-white rounded-lg disabled:opacity-50"
                                    >
                                        Arquivar 30+ dias
                                    </button>
                                </div>
                            )}

                            {/* Messages List */}
                            {inboxLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-500 mt-4">Carregando mensagens...</p>
                                </div>
                            ) : inboxMessages.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Mail className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-medium">Nenhuma mensagem encontrada</p>
                                    <p className="text-sm mt-2">Sua caixa de entrada está vazia</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {inboxMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`border rounded-lg p-4 hover:shadow-md transition cursor-pointer ${!msg.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                                                }`}
                                            onClick={() => openInboxMessage(msg)}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedInboxIds.includes(msg.id)}
                                                        onChange={() => toggleInboxSelection(msg.id)}
                                                        onClick={(event) => event.stopPropagation()}
                                                        className="h-4 w-4 mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {!msg.is_read && (
                                                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                                            )}
                                                            <p className={`font-semibold ${!msg.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                                {msg.subject}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <span>De: {msg.sender_name || 'Sistema'}</span>
                                                            <span>•</span>
                                                            <span className={`px-2 py-0.5 rounded text-xs ${msg.module === 'portal' ? 'bg-purple-100 text-purple-800' :
                                                                msg.module === 'hangarshare' ? 'bg-blue-100 text-blue-800' :
                                                                    msg.module === 'careers' ? 'bg-green-100 text-green-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {msg.module}
                                                            </span>
                                                            {msg.priority !== 'normal' && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${msg.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                                                        msg.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                                        }`}>
                                                                        {msg.priority}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(msg.sent_at).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 line-clamp-2">
                                                {msg.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sent Tab */}
                    {activeTab === 'sent' && (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mensagens Enviadas</h2>

                            <div className="mb-4 flex flex-wrap gap-2">
                                <select
                                    value={sentModuleFilter}
                                    onChange={(e) => setSentModuleFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="all">Todos os módulos</option>
                                    <option value="portal">Portal</option>
                                    <option value="moderation">Moderação</option>
                                    <option value="support">Suporte</option>
                                    <option value="hangarshare">HangarShare</option>
                                    <option value="career">Carreiras</option>
                                    <option value="marketplace">Marketplace</option>
                                    <option value="logbook">Logbook</option>
                                    <option value="mentorship">Mentoria</option>
                                    <option value="simulator">Simulador</option>
                                    <option value="procedures">Procedimentos</option>
                                    <option value="classifieds">Classificados</option>
                                </select>
                                <select
                                    value={sentPriorityFilter}
                                    onChange={(e) => setSentPriorityFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="all">Todas as prioridades</option>
                                    <option value="low">Baixa</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">Alta</option>
                                    <option value="urgent">Urgente</option>
                                </select>
                                <select
                                    value={sentArchiveFilter}
                                    onChange={(e) => setSentArchiveFilter(e.target.value as any)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="active">Ativas</option>
                                    <option value="archived">Arquivadas</option>
                                    <option value="all">Todas</option>
                                </select>
                            </div>

                            {sentMessages.length > 0 && (
                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={selectedSentIds.length > 0 && selectedSentIds.length === sentMessages.length}
                                            onChange={toggleSelectAllSent}
                                            className="h-4 w-4"
                                        />
                                        Selecionar todas
                                    </label>
                                    <button
                                        onClick={() => performBulkAction('sent', 'archive')}
                                        disabled={selectedSentIds.length === 0 || bulkActionLoading}
                                        className="px-3 py-2 text-xs font-medium bg-orange-600 text-white rounded-lg disabled:opacity-50"
                                    >
                                        Arquivar
                                    </button>
                                    <button
                                        onClick={() => performBulkAction('sent', 'unarchive')}
                                        disabled={selectedSentIds.length === 0 || bulkActionLoading}
                                        className="px-3 py-2 text-xs font-medium bg-gray-600 text-white rounded-lg disabled:opacity-50"
                                    >
                                        Desarquivar
                                    </button>
                                    <button
                                        onClick={() => archiveOldMessages('sent')}
                                        disabled={bulkActionLoading}
                                        className="px-3 py-2 text-xs font-medium bg-gray-900 text-white rounded-lg disabled:opacity-50"
                                    >
                                        Arquivar 30+ dias
                                    </button>
                                </div>
                            )}

                            {sentLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-500 mt-4">Carregando mensagens...</p>
                                </div>
                            ) : sentMessages.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-medium">Nenhuma mensagem enviada</p>
                                    <p className="text-sm mt-2">As mensagens enviadas aparecerão aqui</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sentMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer bg-white border-gray-200"
                                            onClick={() => openSentMessage(msg)}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSentIds.includes(msg.id)}
                                                        onChange={() => toggleSentSelection(msg.id)}
                                                        onClick={(event) => event.stopPropagation()}
                                                        className="h-4 w-4 mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-semibold text-gray-900">{msg.subject}</p>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <span>Para: {msg.recipient_name || 'Sistema'}</span>
                                                            <span>•</span>
                                                            <span className={`px-2 py-0.5 rounded text-xs ${msg.module === 'portal' ? 'bg-purple-100 text-purple-800' :
                                                                msg.module === 'hangarshare' ? 'bg-blue-100 text-blue-800' :
                                                                    msg.module === 'careers' ? 'bg-green-100 text-green-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {msg.module}
                                                            </span>
                                                            {msg.priority !== 'normal' && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${msg.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                                                        msg.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                                        }`}>
                                                                        {msg.priority}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(msg.sent_at).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-700 line-clamp-2">
                                                {msg.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stats Tab */}
                    {activeTab === 'stats' && (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Estatísticas do Sistema</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-blue-50 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <Mail className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <p className="text-3xl font-bold text-blue-900">{stats.totalMessages}</p>
                                    <p className="text-sm text-blue-700 mt-1">Total de Mensagens</p>
                                </div>

                                <div className="bg-green-50 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <TrendingUp className="w-8 h-8 text-green-600" />
                                    </div>
                                    <p className="text-3xl font-bold text-green-900">{stats.todayMessages}</p>
                                    <p className="text-sm text-green-700 mt-1">Mensagens Hoje</p>
                                </div>

                                <div className="bg-red-50 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <AlertTriangle className="w-8 h-8 text-red-600" />
                                    </div>
                                    <p className="text-3xl font-bold text-red-900">{stats.totalReports}</p>
                                    <p className="text-sm text-red-700 mt-1">Total de Denúncias</p>
                                </div>

                                <div className="bg-yellow-50 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <MessageSquare className="w-8 h-8 text-yellow-600" />
                                    </div>
                                    <p className="text-3xl font-bold text-yellow-900">{stats.pendingReports}</p>
                                    <p className="text-sm text-yellow-700 mt-1">Denúncias Pendentes</p>
                                </div>
                            </div>

                            <div className="mt-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-base font-semibold text-gray-900">Todas as Mensagens</h3>
                                    <span className="text-sm text-gray-600">Total: {allMessagesTotal}</span>
                                </div>

                                <div className="mb-4 flex flex-wrap gap-2">
                                    <select
                                        value={allMessagesFilters.module}
                                        onChange={(e) => {
                                            setAllMessagesPage(1);
                                            setAllMessagesFilters((prev) => ({ ...prev, module: e.target.value }));
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    >
                                        <option value="all">Todos os módulos</option>
                                        <option value="portal">Portal</option>
                                        <option value="moderation">Moderação</option>
                                        <option value="support">Suporte</option>
                                        <option value="hangarshare">HangarShare</option>
                                        <option value="career">Carreiras</option>
                                        <option value="marketplace">Marketplace</option>
                                        <option value="logbook">Logbook</option>
                                        <option value="mentorship">Mentoria</option>
                                        <option value="simulator">Simulador</option>
                                        <option value="procedures">Procedimentos</option>
                                        <option value="classifieds">Classificados</option>
                                    </select>
                                    <select
                                        value={allMessagesFilters.status}
                                        onChange={(e) => {
                                            setAllMessagesPage(1);
                                            setAllMessagesFilters((prev) => ({ ...prev, status: e.target.value }));
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    >
                                        <option value="all">Todas</option>
                                        <option value="unread">Não lidas</option>
                                        <option value="read">Lidas</option>
                                    </select>
                                    <select
                                        value={allMessagesFilters.priority}
                                        onChange={(e) => {
                                            setAllMessagesPage(1);
                                            setAllMessagesFilters((prev) => ({ ...prev, priority: e.target.value }));
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    >
                                        <option value="all">Todas as prioridades</option>
                                        <option value="low">Baixa</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">Alta</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                    <select
                                        value={allMessagesFilters.archive}
                                        onChange={(e) => {
                                            setAllMessagesPage(1);
                                            setAllMessagesFilters((prev) => ({ ...prev, archive: e.target.value }));
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    >
                                        <option value="active">Ativas</option>
                                        <option value="archived">Arquivadas</option>
                                        <option value="all">Todas</option>
                                    </select>
                                    <input
                                        value={allMessagesFilters.search}
                                        onChange={(e) => {
                                            setAllMessagesPage(1);
                                            setAllMessagesFilters((prev) => ({ ...prev, search: e.target.value }));
                                        }}
                                        placeholder="Buscar por assunto, mensagem ou nome"
                                        className="flex-1 min-w-[240px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>

                                {allMessagesLoading ? (
                                    <div className="text-center py-10">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="text-gray-500 mt-3">Carregando mensagens...</p>
                                    </div>
                                ) : allMessages.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500">
                                        <Mail className="w-14 h-14 mx-auto mb-3 opacity-30" />
                                        <p className="text-base font-medium">Nenhuma mensagem encontrada</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {allMessages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer bg-white border-gray-200"
                                                onClick={() => openAllMessage(msg)}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {!msg.is_read && (
                                                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                                            )}
                                                            <p className="font-semibold text-gray-900">{msg.subject}</p>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <span>De: {msg.sender_name || msg.sender_email || 'Sistema'}</span>
                                                            <span>•</span>
                                                            <span>Para: {msg.recipient_name || msg.recipient_email || 'Sistema'}</span>
                                                            <span>•</span>
                                                            <span className={`px-2 py-0.5 rounded text-xs ${msg.module === 'portal' ? 'bg-purple-100 text-purple-800' :
                                                                msg.module === 'hangarshare' ? 'bg-blue-100 text-blue-800' :
                                                                    msg.module === 'careers' ? 'bg-green-100 text-green-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {msg.module}
                                                            </span>
                                                            {msg.priority !== 'normal' && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${msg.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                                                        msg.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                                        }`}>
                                                                        {msg.priority}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(msg.sent_at).toLocaleDateString('pt-BR', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-700 line-clamp-2">{msg.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {allMessagesTotal > 50 && (
                                    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                                        <span>
                                            Página {allMessagesPage} de {Math.max(1, Math.ceil(allMessagesTotal / 50))}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setAllMessagesPage((prev) => Math.max(1, prev - 1))}
                                                disabled={allMessagesPage === 1}
                                                className="px-3 py-1 border rounded-lg disabled:opacity-50"
                                            >
                                                Anterior
                                            </button>
                                            <button
                                                onClick={() => setAllMessagesPage((prev) => prev + 1)}
                                                disabled={allMessagesPage >= Math.ceil(allMessagesTotal / 50)}
                                                className="px-3 py-1 border rounded-lg disabled:opacity-50"
                                            >
                                                Próxima
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
                        <div className="border-b px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{selectedMessage.subject}</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {selectedMessageSource === 'sent' ? 'Para' : 'De'}:{' '}
                                    {selectedMessageSource === 'sent'
                                        ? (selectedMessage.recipient_name || selectedMessage.recipient_email || 'Sistema')
                                        : (selectedMessage.sender_name || selectedMessage.sender_email || 'Sistema')}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedMessage(null);
                                    setSelectedMessageSource(null);
                                }}
                                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
                            >
                                Fechar
                            </button>
                        </div>
                        <div className="px-6 py-4 space-y-3">
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{selectedMessage.module}</span>
                                {selectedMessage.priority && selectedMessage.priority !== 'normal' && (
                                    <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800">{selectedMessage.priority}</span>
                                )}
                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                    {new Date(selectedMessage.sent_at).toLocaleString('pt-BR')}
                                </span>
                                {selectedMessageSource !== 'sent' && (
                                    <span className={`px-2 py-0.5 rounded ${selectedMessage.is_read ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {selectedMessage.is_read ? 'Lida' : 'Não lida'}
                                    </span>
                                )}
                            </div>
                            <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                {selectedMessage.message}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
