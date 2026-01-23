'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
// If using types, ensure: npm install --save-dev @types/date-fns (for TS support)
import {
  User,
  LogOut,
  LogIn,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

export interface ActivityFeedItem {
  id: string;
  timestamp: Date;
  actor: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  action: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'other';
  resource: {
    type: 'user' | 'hangar' | 'booking' | 'listing' | 'owner' | 'document';
    id: string;
    name: string;
  };
  description?: string;
  status?: 'success' | 'warning' | 'error';
}

export interface ActivityFeedProps {
  items: ActivityFeedItem[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const actionIcons: Record<ActivityFeedItem['action'], React.ReactNode> = {
  login: <LogIn size={16} className="text-green-600" />,
  logout: <LogOut size={16} className="text-gray-600" />,
  create: <Plus size={16} className="text-blue-600" />,
  update: <Edit size={16} className="text-orange-600" />,
  delete: <Trash2 size={16} className="text-red-600" />,
  approve: <CheckCircle size={16} className="text-green-600" />,
  reject: <AlertCircle size={16} className="text-red-600" />,
  other: <Info size={16} className="text-gray-600" />,
};

const actionLabels: Record<ActivityFeedItem['action'], string> = {
  login: 'Logged in',
  logout: 'Logged out',
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  approve: 'Approved',
  reject: 'Rejected',
  other: 'Activity',
};

/**
 * ActivityFeed Component
 * 
 * Displays real-time audit log of admin actions
 * 
 * @example
 * ```tsx
 * <ActivityFeed
 *   items={auditLogs}
 *   loading={isLoading}
 *   onLoadMore={() => loadMoreLogs()}
 *   hasMore={hasMore}
 * />
 * ```
 */
export function ActivityFeed({
  items,
  loading = false,
  onLoadMore,
  hasMore = false,
}: ActivityFeedProps) {
  if (loading && items.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border border-gray-200 rounded-lg animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <Info size={40} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex gap-4 p-4 rounded-lg border transition-colors ${
            item.status === 'error'
              ? 'bg-red-50 border-red-200'
              : item.status === 'warning'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-white border-gray-200 hover:bg-gray-50'
          }`}
        >
          {/* Actor Avatar */}
          <div className="flex-shrink-0">
            {item.actor.avatar ? (
              <img
                src={item.actor.avatar}
                alt={item.actor.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User size={16} className="text-gray-600" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Action description */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{item.actor.name}</span>
                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                    {actionIcons[item.action]}
                    <span>{actionLabels[item.action]}</span>
                  </div>
                </div>

                {/* Resource info */}
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{item.resource.type}</span>
                  {' — '}
                  <span className="text-gray-600">{item.resource.name}</span>
                </p>

                {/* Custom description */}
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                )}

                {/* Email subtitle */}
                <p className="text-xs text-gray-400 mt-1">{item.actor.email}</p>
              </div>

              {/* Timestamp */}
              <div className="flex-shrink-0 text-right">
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="w-full py-3 px-4 text-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
