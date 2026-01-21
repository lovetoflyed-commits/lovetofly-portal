'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Wifi, WifiOff, TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import { useRealtimeStats } from '@/hooks/useRealtimeStats';

interface RealtimeMetricsDisplayProps {
  ownerId: string;
  token: string;
  enabled?: boolean;
}

export function RealtimeMetricsDisplay({
  ownerId,
  token,
  enabled = true
}: RealtimeMetricsDisplayProps) {
  const {
    metrics,
    bookingNotifications,
    occupancyChanges,
    isConnected,
    connect,
    disconnect,
    clearNotifications
  } = useRealtimeStats({
    ownerId,
    token,
    autoConnect: enabled
  });

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Update unread count when new notifications arrive
  useEffect(() => {
    setUnreadNotifications(bookingNotifications.length + occupancyChanges.length);
  }, [bookingNotifications, occupancyChanges]);

  const handleClearNotifications = () => {
    clearNotifications();
    setUnreadNotifications(0);
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className={`p-4 rounded-lg border-2 flex items-center justify-between ${
        isConnected 
          ? 'border-green-200 bg-green-50' 
          : 'border-gray-300 bg-gray-50'
      }`}>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <Wifi className="w-5 h-5 text-green-600 animate-pulse" />
              <span className="text-sm font-medium text-green-700">
                Conectado em tempo real
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Desconectado - Tentando reconectar...
              </span>
            </>
          )}
        </div>
        {!isConnected && (
          <button
            onClick={connect}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Reconectar
          </button>
        )}
      </div>

      {/* Live Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Receita em Tempo Real</span>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">
              R$ {metrics.revenueToday?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </p>
            <p className="text-xs text-blue-600 mt-1">Hoje</p>
          </div>

          {/* Bookings Card */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700">Reservas Hoje</span>
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {metrics.bookingsToday || 0}
            </p>
            <p className="text-xs text-purple-600 mt-1">Novas reservas</p>
          </div>

          {/* Occupancy Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700">Ocupação Atual</span>
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900">
              {metrics.occupancyRate?.toFixed(0) || '0'}%
            </p>
            <p className="text-xs text-green-600 mt-1">Dos hangares</p>
          </div>

          {/* Growth Card */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-700">Crescimento</span>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {metrics.growthPercentage?.toFixed(1) || '0'}%
            </p>
            <p className="text-xs text-orange-600 mt-1">Vs. semana anterior</p>
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {unreadNotifications > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900">
                  Notificações em Tempo Real
                </h3>
                <div className="mt-2 space-y-1 text-sm text-amber-800">
                  {bookingNotifications.length > 0 && (
                    <p>
                      • {bookingNotifications.length} nova{bookingNotifications.length !== 1 ? 's' : ''} reserva{bookingNotifications.length !== 1 ? 's' : ''}
                    </p>
                  )}
                  {occupancyChanges.length > 0 && (
                    <p>
                      • {occupancyChanges.length} mudança{occupancyChanges.length !== 1 ? 's' : ''} de ocupação
                    </p>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleClearNotifications}
              className="text-sm px-3 py-1 bg-amber-200 text-amber-900 rounded hover:bg-amber-300 transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      {/* Recent Booking Notifications */}
      {bookingNotifications.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Últimas Reservas</h3>
          <div className="space-y-2">
            {bookingNotifications.slice(0, 5).map((notification, idx) => (
              <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <p className="font-medium text-blue-900">
                  Hangar {notification.hangarNumber}
                </p>
                <p className="text-blue-700">
                  {notification.guestName} • {notification.duration} dias
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  R$ {notification.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Occupancy Changes */}
      {occupancyChanges.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Mudanças de Ocupação</h3>
          <div className="space-y-2">
            {occupancyChanges.slice(0, 3).map((change, idx) => (
              <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                <p className="font-medium text-green-900">
                  Hangar {change.hangarNumber}
                </p>
                <p className={`text-sm ${change.isNowOccupied ? 'text-red-600' : 'text-green-600'}`}>
                  {change.isNowOccupied ? 'Ocupado' : 'Liberado'}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {change.timestamp
                    ? new Date(change.timestamp).toLocaleTimeString('pt-BR')
                    : '–'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 max-h-24 overflow-auto">
          <p>Connection: {isConnected ? 'Active' : 'Inactive'}</p>
          <p>Owner: {ownerId}</p>
          <p>Bookings: {bookingNotifications.length}</p>
          <p>Changes: {occupancyChanges.length}</p>
        </div>
      )}
    </div>
  );
}
