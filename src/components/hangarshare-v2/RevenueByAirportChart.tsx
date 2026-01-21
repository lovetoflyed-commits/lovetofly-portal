// Component: Revenue by Airport Chart
// File: src/components/hangarshare-v2/RevenueByAirportChart.tsx
// Purpose: Bar chart showing revenue distribution by airport

'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueByAirportData {
  airport: string;
  revenue: number;
  bookings: number;
  occupancy: number;
}

interface RevenueByAirportChartProps {
  data: RevenueByAirportData[];
}

const formatCurrency = (value: number | undefined) => {
  if (value === undefined) return 'N/A';
  return `$${(value / 1000).toFixed(1)}K`;
};

export function RevenueByAirportChart({ data }: RevenueByAirportChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Airport</h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No airport data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Revenue by Airport</h3>
        <p className="text-sm text-gray-600">Top 10 airports by revenue</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="airport"
            angle={-45}
            textAnchor="end"
            height={100}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            formatter={(value: number | undefined) => {
              if (value === undefined) return 'N/A';
              return `$${value.toLocaleString()}`;
            }}
            labelFormatter={(label) => `Airport: ${label}`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          />
          <Legend />
          <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-600">Airport</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Revenue</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Bookings</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
              >
                <td className="py-2 px-3 font-medium text-gray-900">{row.airport}</td>
                <td className="text-right py-2 px-3 text-gray-900">
                  ${row.revenue.toLocaleString()}
                </td>
                <td className="text-right py-2 px-3 text-gray-600">{row.bookings}</td>
                <td className="text-right py-2 px-3 text-gray-600">{row.occupancy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
