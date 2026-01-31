'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string | null;
  action_label?: string | null;
  metadata?: any;
  is_read: boolean;
  created_at: string;
};

type InboxCategory = 'team' | 'traslados' | 'system' | 'all';

const getCategory = (item: NotificationItem): Exclude<InboxCategory, 'all'> => {
  const type = String(item.type || '').toLowerCase();
  if (type.includes('traslado')) return 'traslados';
  if (type.includes('system') || type.includes('admin')) return 'system';
  return 'team';
};

const priorityClass = (priority: NotificationItem['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-700';
    case 'high':
      return 'bg-amber-100 text-amber-700';
    case 'normal':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-slate-100 text-slate-500';
  }
};

const truncateText = (value: string, maxLength: number) => {
  if (!value) return '';
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}…`;
};

export default function AdminInboxPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);
  const [category, setCategory] = useState<InboxCategory>('all');
  const [onlyUnread, setOnlyUnread] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'master' && user.role !== 'admin' && user.role !== 'staff' && user.email !== 'lovetofly.ed@gmail.com') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications/list', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const all = Array.isArray(data.notifications) ? data.notifications : [];
        const messages = all.filter((item: NotificationItem) => item.type !== 'staff_task');
        setNotifications(messages);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, [token]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (onlyUnread && item.is_read) return false;
      if (category === 'all') return true;
      return getCategory(item) === category;
    });
  }, [notifications, category, onlyUnread]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const handleNotificationAction = async (notificationId: number, action: 'read' | 'dismiss') => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/list', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notification_id: notificationId, action }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notificationId
              ? { ...item, is_read: action === 'read' ? true : item.is_read }
              : item
          )
        );
        if (action === 'dismiss') {
          setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
        }
      }
    } catch (error) {
      console.error('Failed to update notification:', error);
    }
  };

  const toggleSelection = (notificationId: number) => {
    setSelectedIds((prev) =>
      prev.includes(notificationId) ? prev.filter((id) => id !== notificationId) : [...prev, notificationId]
    );
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredNotifications.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const bulkUpdate = async (action: 'read' | 'dismiss') => {
    if (selectedIds.length === 0) return;
    await Promise.all(selectedIds.map((id) => handleNotificationAction(id, action)));
    setSelectedIds([]);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-blue-900">Inbox da Equipe</h1>
            <p className="text-sm text-slate-600 mt-1">Mensagens separadas das tarefas para foco e auditoria.</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
              ← Voltar ao Painel
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold">Total</p>
            <p className="text-2xl font-black text-blue-600">{notifications.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold">Não lidas</p>
            <p className="text-2xl font-black text-amber-600">{unreadCount}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold text-slate-500">Categoria</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as InboxCategory)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
              >
                <option value="all">Todas</option>
                <option value="team">Equipe</option>
                <option value="traslados">Traslados</option>
                <option value="system">Sistema</option>
              </select>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={onlyUnread}
                  onChange={(event) => setOnlyUnread(event.target.checked)}
                  className="h-4 w-4"
                />
                Apenas não lidas
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === filteredNotifications.length}
                  onChange={(event) => toggleAll(event.target.checked)}
                  className="h-4 w-4"
                />
                Selecionar tudo
              </label>
              <button
                type="button"
                onClick={() => bulkUpdate('read')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                Marcar lidas
              </button>
              <button
                type="button"
                onClick={() => bulkUpdate('dismiss')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Remover
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="px-6 py-6 text-sm text-slate-500">Nenhuma mensagem encontrada.</div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveNotification(item);
                    setShowModal(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      setActiveNotification(item);
                      setShowModal(true);
                    }
                  }}
                  className="px-6 py-4 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <label className="pt-1" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            event.stopPropagation();
                            toggleSelection(item.id);
                          }}
                          className="h-4 w-4"
                        />
                      </label>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityClass(item.priority)}`}>
                            {item.priority}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                            {item.is_read ? 'Lida' : 'Nova'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{new Date(item.created_at).toLocaleString('pt-BR')}</p>
                        <p className="mt-2 text-sm text-slate-600">{truncateText(item.message, 140)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {!item.is_read && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleNotificationAction(item.id, 'read');
                          }}
                          className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                        >
                          Marcar lida
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleNotificationAction(item.id, 'dismiss');
                        }}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && activeNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Detalhes da mensagem</h3>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setActiveNotification(null);
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Fechar
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-1 font-semibold ${activeNotification.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                  {activeNotification.is_read ? 'Lida' : 'Nova'}
                </span>
                <span className={`rounded-full px-2 py-1 font-semibold ${priorityClass(activeNotification.priority)}`}>
                  Prioridade: {activeNotification.priority}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-500">
                  {new Date(activeNotification.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">{activeNotification.title}</p>
                <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{activeNotification.message}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
              {!activeNotification.is_read && (
                <button
                  type="button"
                  onClick={() => {
                    handleNotificationAction(activeNotification.id, 'read');
                    setActiveNotification((prev) => (prev ? { ...prev, is_read: true } : prev));
                  }}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                >
                  Marcar lida
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  handleNotificationAction(activeNotification.id, 'dismiss');
                  setShowModal(false);
                  setActiveNotification(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
