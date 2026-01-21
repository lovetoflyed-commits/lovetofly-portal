// Component: Listing Performance Card
// File: src/components/hangarshare-v2/ListingPerformanceCard.tsx
// Purpose: Display individual listing performance metrics

'use client';

import React from 'react';

interface ListingPerformance {
  id: string;
  title: string;
  revenue: number;
  bookings: number;
  occupancy: number;
}

interface ListingPerformanceCardProps {
  listings: ListingPerformance[];
}

export function ListingPerformanceCard({ listings }: ListingPerformanceCardProps) {
  if (!listings || listings.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Hangars</h3>
        <p className="text-gray-600">No listing data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Hangars</h3>
      <div className="space-y-4">
        {listings.map((listing, index) => (
          <div
            key={listing.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{listing.title}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span>{listing.bookings} reservas</span>
                  <span>•</span>
                  <span>{listing.occupancy.toFixed(1)}% ocupação</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                R$ {listing.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500">Receita total</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
