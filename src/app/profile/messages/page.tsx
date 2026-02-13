/**
 * Messages Page - User Inbox
 * /profile/messages
 * 
 * Features:
 * - Hybrid inbox (all messages + filter by module)
 * - Filter by status (unread/read/all)
 * - Filter by priority
 * - Message viewing with reply modal
 * - Unread counter badge
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { MessageCircle, Filter, Inbox, Send, AlertCircle, Clock, CheckCircle, ArrowLeft } from 'lucide-react';

interface Message {
    id: number;
    uuid: string;
    sender_user_id: string;
    sender_name: string;
    sender_photo: string;
    sender_type: string;
    recipient_user_id?: string;
    recipient_name?: string;
    recipient_photo?: string;
    module: string;
    subject: string;
    message: string;
    priority: string;
    is_read: boolean;
    read_at: string | null;
    parent_message_id: number | null;
    thread_id: string;
    sent_at: string;
    related_entity_type: string | null;
    related_entity_id: string | null;
}

interface PaginatedResponse {
    messages: Message[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function MessagesPage() {
    const { token } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'archived'>('inbox');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    // Filters
    const [filterModule, setFilterModule] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [unreadCount, setUnreadCount] = useState(0);

    // Bulk actions
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);

    // Module options
    const modules = [
        { value: 'all', label: 'Todos os módulos' },
        { value: 'hangarshare', label: 'HangarShare' },
        { value: 'career', label: 'Carreiras' },
        { value: 'moderation', label: 'Moderação' },
        { value: 'portal', label: 'Portal' },
        { value: 'support', label: 'Suporte' },
    ];

    const priorities = [
        { value: 'all', label: 'Todas as prioridades' },
        { value: 'urgent', label: 'Urgente' },
        { value: 'high', label: 'Alta' },
        { value: 'normal', label: 'Normal' },
        { value: 'low', label: 'Baixa' },
    ];

    // Fetch messages
    const fetchMessages = async () => {
        if (!token) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
                status: filterStatus,
            });

            if (filterModule !== 'all') params.append('module', filterModule);
            if (filterPriority !== 'all') params.append('priority', filterPriority);

            // Handle archived tab
            if (activeTab === 'archived') {
                params.set('archive', 'archived');
            } else {
                params.set('archive', 'active');
            }

            const endpoint = activeTab === 'sent' ? '/api/messages/sent' : '/api/messages/inbox';
            const response = await fetch(`${endpoint}?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data: { data: PaginatedResponse } = await response.json();
                setMessages(data.data.messages);
                setTotalPages(data.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        if (!token) return;

        try {
            const response = await fetch('/api/messages/unread-count', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // Mark as read
    const markAsRead = async (messageId: number) => {
        if (!token) return;

        try {
            const response = await fetch(`/api/messages/${messageId}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                // Update local state
                setMessages(prev => prev.map(msg =>
                    msg.id === messageId ? { ...msg, is_read: true, read_at: new Date().toISOString() } : msg
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    // Toggle individual selection
    const toggleSelection = (messageId: number) => {
        setSelectedIds((prev) =>
            prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId]
        );
    };

    // Toggle select all
    const toggleSelectAll = () => {
        if (selectedIds.length === messages.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(messages.map((msg) => msg.id));
        }
    };

    // Perform bulk action
    const performBulkAction = async (action: 'mark_read' | 'mark_unread' | 'archive' | 'unarchive') => {
        if (!token || bulkActionLoading || selectedIds.length === 0) return;

        const scopeForApi = activeTab === 'sent' ? 'sent' : 'inbox';

        setBulkActionLoading(true);
        try {
            const response = await fetch('/api/messages/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    messageIds: selectedIds,
                    action,
                    scope: scopeForApi,
                }),
            });

            if (response.ok) {
                setSelectedIds([]);
                await fetchMessages();
                if (activeTab === 'inbox') {
                    await fetchUnreadCount();
                }
            } else {
                const errorBody = await response.text();
                console.error('Error performing bulk action:', response.status, errorBody);
                alert('Erro ao executar ação em massa');
            }
        } catch (error) {
            console.error('Error performing bulk action:', error);
            alert('Erro ao executar ação em massa');
        } finally {
            setBulkActionLoading(false);
        }
    };

    // Send reply
    const sendReply = async () => {
        if (!token || !selectedMessage || !replyText.trim()) return;

        setSendingReply(true);
        try {
            const response = await fetch(`/api/messages/${selectedMessage.id}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: replyText,
                }),
            });

            if (response.ok) {
                const result = await response.json();

                // Show success notification
                if (result.data?.contentModified) {
                    alert('Resposta enviada! Alguns conteúdos foram bloqueados por política de segurança.');
                } else {
                    alert('Resposta enviada com sucesso!');
                }

                setReplyText('');
                setReplyModalOpen(false);
                fetchMessages();
            } else {
                const error = await response.json();
                alert(error.message || 'Erro ao enviar resposta');
            }
        } catch (error) {
            console.error('Error sending reply:', error);
            alert('Erro ao enviar resposta');
        } finally {
            setSendingReply(false);
        }
    };

    // Open message
    const openMessage = (message: Message) => {
        setSelectedMessage(message);
        // Only mark as read if viewing received messages (inbox)
        if (activeTab === 'inbox' && !message.is_read) {
            markAsRead(message.id);
        }
    };

    // Effects
    useEffect(() => {
        fetchMessages();
        if (activeTab === 'inbox') {
            fetchUnreadCount();
        }
        // Clear selections when changing tabs or filters
        setSelectedIds([]);
    }, [token, activeTab, filterModule, filterStatus, filterPriority, currentPage]);

    // Priority badge color
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'normal': return 'bg-blue-100 text-blue-800';
            case 'low': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Module badge color
    const getModuleColor = (module: string) => {
        switch (module) {
            case 'hangarshare': return 'bg-purple-100 text-purple-800';
            case 'career': return 'bg-green-100 text-green-800';
            case 'moderation': return 'bg-red-100 text-red-800';
            case 'portal': return 'bg-blue-100 text-blue-800';
            case 'support': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Faça login para acessar suas mensagens</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/profile')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                                title="Voltar ao perfil"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-600" />
                            </button>
                            <MessageCircle className="w-8 h-8 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
                                <p className="text-sm text-gray-600">
                                    {activeTab === 'inbox' && unreadCount > 0 ? `${unreadCount} não lidas` :
                                        activeTab === 'inbox' ? 'Nenhuma mensagem não lida' :
                                            activeTab === 'archived' ? 'Mensagens arquivadas' :
                                                'Mensagens enviadas'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-gray-200">
                        <button
                            onClick={() => {
                                setActiveTab('inbox');
                                setCurrentPage(1);
                            }}
                            className={`px-4 py-2 font-medium transition-colors relative ${activeTab === 'inbox'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Inbox className="w-4 h-4" />
                                Recebidas
                                {unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('sent');
                                setCurrentPage(1);
                            }}
                            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'sent'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Send className="w-4 h-4" />
                                Enviadas
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('archived');
                                setCurrentPage(1);
                            }}
                            className={`px-4 py-2 font-medium transition-colors ${activeTab === 'archived'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Arquivadas
                            </div>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Filtros:</span>
                        </div>

                        <select
                            value={filterModule}
                            onChange={(e) => { setFilterModule(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            {modules.map(mod => (
                                <option key={mod.value} value={mod.value}>{mod.label}</option>
                            ))}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todas</option>
                            <option value="unread">Não lidas</option>
                            <option value="read">Lidas</option>
                        </select>

                        <select
                            value={filterPriority}
                            onChange={(e) => { setFilterPriority(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            {priorities.map(pri => (
                                <option key={pri.value} value={pri.value}>{pri.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Bulk Actions */}
                {messages.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length > 0 && selectedIds.length === messages.length}
                                    onChange={toggleSelectAll}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                Selecionar todas ({messages.length})
                            </label>

                            {selectedIds.length > 0 && (
                                <>
                                    <span className="text-sm text-gray-600">|
                                        <span className="font-semibold ml-1">{selectedIds.length}</span> selecionada{selectedIds.length > 1 ? 's' : ''}
                                    </span>

                                    {activeTab === 'inbox' && (
                                        <>
                                            <button
                                                onClick={() => performBulkAction('mark_read')}
                                                disabled={bulkActionLoading}
                                                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                                            >
                                                Marcar como lida
                                            </button>
                                            <button
                                                onClick={() => performBulkAction('mark_unread')}
                                                disabled={bulkActionLoading}
                                                className="px-3 py-1.5 text-xs font-medium bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
                                            >
                                                Marcar como não lida
                                            </button>
                                        </>
                                    )}

                                    {activeTab !== 'archived' ? (
                                        <button
                                            onClick={() => performBulkAction('archive')}
                                            disabled={bulkActionLoading}
                                            className="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition"
                                        >
                                            Arquivar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => performBulkAction('unarchive')}
                                            disabled={bulkActionLoading}
                                            className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                                        >
                                            Desarquivar
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setSelectedIds([])}
                                        disabled={bulkActionLoading}
                                        className="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
                                    >
                                        Limpar seleção
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Messages List */}
                <div className="bg-white rounded-lg shadow-sm">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Carregando mensagens...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="p-8 text-center">
                            <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600">Nenhuma mensagem encontrada</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {messages.map((message) => {
                                const displayName = activeTab === 'inbox' ? message.sender_name : message.recipient_name;
                                const displayPhoto = activeTab === 'inbox' ? message.sender_photo : message.recipient_photo;

                                return (
                                    <div
                                        key={message.id}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition ${!message.is_read && activeTab === 'inbox' ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Checkbox */}
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(message.id)}
                                                onChange={() => toggleSelection(message.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-4 w-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />

                                            {/* Avatar */}
                                            <div className="flex-shrink-0" onClick={() => openMessage(message)}>
                                                {displayPhoto ? (
                                                    <img
                                                        src={displayPhoto}
                                                        alt={displayName || 'Usuário'}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span className="text-blue-600 font-semibold">
                                                            {(displayName || 'U').charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0" onClick={() => openMessage(message)}>
                                                <div className="flex items-start justify-between mb-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-semibold text-gray-900">
                                                            {activeTab === 'inbox' ? displayName : `Para: ${displayName || 'Destinatário'}`}
                                                        </p>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getModuleColor(message.module)}`}>
                                                            {message.module}
                                                        </span>
                                                        {message.priority !== 'normal' && (
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(message.priority)}`}>
                                                                {message.priority}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <Clock className="w-4 h-4" />
                                                        {new Date(message.sent_at).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                </div>

                                                <p className={`text-sm mb-2 ${!message.is_read && activeTab === 'inbox' ? 'font-semibold text-gray-900' : 'text-gray-700'
                                                    }`}>
                                                    {message.subject}
                                                </p>

                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {message.message}
                                                </p>

                                                {!message.is_read && activeTab === 'inbox' && (
                                                    <div className="mt-2 flex items-center gap-1 text-blue-600 text-xs font-medium">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Não lida
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="text-sm text-gray-600">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                </div>

                {/* Message Detail Modal */}
                {selectedMessage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedMessage.subject}</h2>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getModuleColor(selectedMessage.module)}`}>
                                                {selectedMessage.module}
                                            </span>
                                            {selectedMessage.priority !== 'normal' && (
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(selectedMessage.priority)}`}>
                                                    {selectedMessage.priority}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedMessage(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    {(() => {
                                        const displayName = activeTab === 'inbox'
                                            ? selectedMessage.sender_name
                                            : selectedMessage.recipient_name || 'Destinatário';
                                        const displayPhoto = activeTab === 'inbox'
                                            ? selectedMessage.sender_photo
                                            : selectedMessage.recipient_photo;

                                        return (
                                            <>
                                                {displayPhoto ? (
                                                    <img
                                                        src={displayPhoto}
                                                        alt={displayName}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span className="text-blue-600 font-semibold">
                                                            {displayName.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {activeTab === 'inbox' ? displayName : `Para: ${displayName}`}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(selectedMessage.sent_at).toLocaleString('pt-BR')}
                                                    </p>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="prose max-w-none">
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    {activeTab === 'inbox' && (
                                        <button
                                            onClick={() => setReplyModalOpen(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                        >
                                            <Send className="w-4 h-4" />
                                            Responder
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedMessage(null)}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reply Modal */}
                {replyModalOpen && selectedMessage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-bold text-gray-900">Responder Mensagem</h3>
                                <p className="text-sm text-gray-600 mt-1">Re: {selectedMessage.subject}</p>
                            </div>

                            <div className="p-6">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Digite sua resposta..."
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />

                                <div className="mt-4 flex gap-3 justify-end">
                                    <button
                                        onClick={() => { setReplyModalOpen(false); setReplyText(''); }}
                                        disabled={sendingReply}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={sendReply}
                                        disabled={sendingReply || !replyText.trim()}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {sendingReply ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Enviar Resposta
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
