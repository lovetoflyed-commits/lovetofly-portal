// Component: Revenue Forecast Card
// File: src/components/hangarshare-v2/RevenueForecastCard.tsx
// Purpose: Display projected revenue based on current trends

'use client';

import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface RevenueForecastCardProps {
  projectedMonthlyRevenue: number;
  projectedAnnualRevenue: number;
  confidence: number;
  currentMonthlyRevenue?: number;
}

export function RevenueForecastCard({
  projectedMonthlyRevenue,
  projectedAnnualRevenue,
  confidence,
  currentMonthlyRevenue,
}: RevenueForecastCardProps) {
  const confidencePercent = Math.round(confidence * 100);
  const confidenceColor =
    confidencePercent >= 80 ? 'text-green-600' : confidencePercent >= 60 ? 'text-yellow-600' : 'text-orange-600';

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={20} />
            Projeção de Receita
          </h3>
          <p className="text-sm text-gray-600 mt-1">Baseado em tendências atuais</p>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className={confidenceColor} />
          <span className={`text-sm font-semibold ${confidenceColor}`}>{confidencePercent}% confiança</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Monthly Projection */}
        <div className="bg-white rounded-lg p-4">
          <p className="text-gray-600 text-sm font-medium mb-1">Mês (projetado)</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(projectedMonthlyRevenue)}
          </p>
          {currentMonthlyRevenue && (
            <p className="text-xs text-gray-500 mt-2">
              Atual: {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(currentMonthlyRevenue)}
            </p>
          )}
        </div>

        {/* Annual Projection */}
        <div className="bg-white rounded-lg p-4">
          <p className="text-gray-600 text-sm font-medium mb-1">Ano (projetado)</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(projectedAnnualRevenue)}
          </p>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="bg-white rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-700">Confiança da Projeção</p>
          <span className={`text-xs font-bold ${confidenceColor}`}>{confidencePercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              confidencePercent >= 80
                ? 'bg-green-500'
                : confidencePercent >= 60
                  ? 'bg-yellow-500'
                  : 'bg-orange-500'
            }`}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-600 mt-4 text-center">
        ℹ️ Projeção baseada nos últimos 30 dias de atividade
      </p>
    </div>
  );
}
