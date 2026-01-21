// Component: Recent Bookings Table
// File: src/components/hangarshare-v2/RecentBookingsTable.tsx
// Purpose: Display recent bookings for owner

'use client';

import React from 'react';

interface RecentBooking {
  id: string;
  hangarTitle: string;
  guestName: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: string;
}

interface RecentBookingsTableProps {
  bookings: RecentBooking[];
}

export function RecentBookingsTable({ bookings }: RecentBookingsTableProps) {
  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };

    const labels = {
      confirmed: 'Confirmada',
      active: 'Ativa',
      completed: 'Concluída',
      cancelled: 'Cancelada',
      pending: 'Pendente',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!bookings || bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reservas Recentes</h3>
        <p className="text-gray-600">Nenhuma reserva encontrada</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Reservas Recentes</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">Hangar</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Hóspede</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Check-in</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">Check-out</th>
              <th className="text-right py-3 px-4 font-medium text-gray-600">Valor</th>
              <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4 font-medium text-gray-900">{booking.hangarTitle}</td>
                <td className="py-3 px-4 text-gray-700">{booking.guestName}</td>
                <td className="py-3 px-4 text-gray-600">{formatDate(booking.startDate)}</td>
                <td className="py-3 px-4 text-gray-600">{formatDate(booking.endDate)}</td>
                <td className="text-right py-3 px-4 font-semibold text-gray-900">
                  R$ {booking.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="text-center py-3 px-4">{getStatusBadge(booking.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
