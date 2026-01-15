'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  priority: string;
  action_url?: string;
  action_label?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationPanel() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/notifications/list', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unread_count || 0);
        }
      } catch (e) {
        console.error('Error fetching notifications:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 sec
    return () => clearInterval(interval);
  }, [token]);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await fetch('/api/notifications/list', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notification_id: notificationId, action: 'read' }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  const handleDismiss = async (notificationId: number) => {
    try {
      await fetch('/api/notifications/list', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notification_id: notificationId, action: 'dismiss' }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (e) {
      console.error('Error dismissing notification:', e);
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-700 text-sm">
        ✓ Nenhuma notificação no momento
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`border rounded-lg p-4 transition-all ${
            notif.priority === 'urgent'
              ? 'bg-red-50 border-red-300'
              : notif.priority === 'high'
              ? 'bg-orange-50 border-orange-300'
              : 'bg-yellow-50 border-yellow-300'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="font-bold text-sm mb-1">
                {notif.priority === 'urgent' && '🚨 '}
                {notif.priority === 'high' && '⚠️ '}
                {notif.priority === 'normal' && 'ℹ️ '}
                {notif.title}
              </h4>
              <p className="text-sm text-gray-700 mb-2">{notif.message}</p>
              {notif.action_url && notif.action_label && (
                <a
                  href={notif.action_url}
                  className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 transition"
                >
                  {notif.action_label}
                </a>
              )}
            </div>
            <div className="flex gap-2">
              {!notif.is_read && (
                <button
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="text-xs px-2 py-1 bg-white rounded border hover:bg-gray-100 transition"
                  title="Mark as read"
                >
                  ✓
                </button>
              )}
              <button
                onClick={() => handleDismiss(notif.id)}
                className="text-xs px-2 py-1 bg-white rounded border hover:bg-gray-100 transition"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
