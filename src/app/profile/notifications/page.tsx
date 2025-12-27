'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link: string | null;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const url = filter === 'unread' 
        ? '/api/user/notifications?unreadOnly=true' 
        : '/api/user/notifications';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando notificações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 font-bold mb-4 flex items-center gap-2"
          >
            ← Voltar
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-blue-900">Notificações</h1>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-bold transition ${
                  filter === 'all' 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-white text-slate-600 border border-slate-300'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-bold transition ${
                  filter === 'unread' 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-white text-slate-600 border border-slate-300'
                }`}
              >
                Não Lidas
              </button>
            </div>
          </div>

          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-bold"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <p className="text-slate-600">Nenhuma notificação encontrada</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow border-2 p-6 transition ${
                  getTypeColor(notification.type)
                } ${!notification.read ? 'border-l-4 border-l-blue-600' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                      <h3 className="text-lg font-bold text-slate-900">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          Nova
                        </span>
                      )}
                    </div>
                    
                    <p className="text-slate-700 mb-3">{notification.message}</p>
                    
                    <div className="flex items-center gap-4">
                      <p className="text-xs text-slate-500">
                        {new Date(notification.created_at).toLocaleString('pt-BR')}
                      </p>
                      
                      {notification.link && (
                        <Link
                          href={notification.link}
                          className="text-sm text-blue-600 hover:text-blue-800 font-bold"
                        >
                          Ver detalhes →
                        </Link>
                      )}
                    </div>
                  </div>

                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="ml-4 text-sm text-slate-600 hover:text-blue-600 font-bold"
                    >
                      Marcar como lida
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
