/**
 * useMessages Hook
 * Manages message state and polling for unread count
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

const POLL_INTERVAL = 30000; // 30 seconds

interface UnreadCountData {
  unreadCount: number;
  byPriority: {
    urgent?: number;
    high?: number;
    normal?: number;
    low?: number;
  };
  hasUrgent: boolean;
}

export function useMessages() {
  const { token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasUrgent, setHasUrgent] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      setHasUrgent(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/messages/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: { data: UnreadCountData } = await response.json();
        setUnreadCount(data.data.unreadCount);
        setHasUrgent(data.data.hasUrgent);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Polling
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [token, fetchUnreadCount]);

  return {
    unreadCount,
    hasUrgent,
    loading,
    refresh: fetchUnreadCount,
  };
}
