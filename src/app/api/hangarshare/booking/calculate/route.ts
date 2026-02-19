import { NextRequest, NextResponse } from 'next/server';
import pool from '@/config/db';
import { validatePromoCode, applyDiscount } from '@/utils/codeUtils';

interface BreakdownItem {
  period: string;
  quantity: number;
  rate: number;
  subtotal: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hangarId, checkIn, checkOut, promoCode } = body;

    if (!hangarId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'hangarId, checkIn e checkOut são obrigatórios' },
        { status: 400 }
      );
    }

    // Fetch hangar pricing
    const result = await pool.query(
      `SELECT 
        hourly_rate,
        daily_rate,
        weekly_rate,
        monthly_rate
      FROM hangar_listings
      WHERE id = $1 AND is_available = true`,
      [hangarId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Hangar não encontrado ou inativo' },
        { status: 404 }
      );
    }

    const pricing = result.rows[0];
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Calculate time difference
    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

    if (diffDays <= 0) {
      return NextResponse.json(
        { error: 'A data de saída deve ser posterior à data de entrada' },
        { status: 400 }
      );
    }

    // Smart pricing algorithm - choose the best rate for the customer
    let breakdown: BreakdownItem[] = [];
    let subtotal = 0;
    const comparedTo = '';
    const comparedPrice = 0;

    // Calculate different scenarios
    const scenarios: { name: string; price: number; breakdown: BreakdownItem[] }[] = [];

    // Scenario 1: Only hourly (if available and < 1 day)
    if (pricing.hourly_rate && diffDays < 1) {
      scenarios.push({
        name: `${diffHours} horas`,
        price: pricing.hourly_rate * diffHours,
        breakdown: [
          {
            period: 'hora',
            quantity: diffHours,
            rate: pricing.hourly_rate,
            subtotal: pricing.hourly_rate * diffHours,
          },
        ],
      });
    }

    // Scenario 2: Only daily
    if (pricing.daily_rate) {
      scenarios.push({
        name: `${diffDays} diárias`,
        price: pricing.daily_rate * diffDays,
        breakdown: [
          {
            period: 'diária',
            quantity: diffDays,
            rate: pricing.daily_rate,
            subtotal: pricing.daily_rate * diffDays,
          },
        ],
      });
    }

    // Scenario 3: Weekly + remaining days
    if (pricing.weekly_rate && diffDays >= 7) {
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      const weeklyPrice = pricing.weekly_rate * weeks;
      const remainingPrice = pricing.daily_rate
        ? pricing.daily_rate * remainingDays
        : (pricing.monthly_rate / 30) * remainingDays;

      const weeklyBreakdown: BreakdownItem[] = [
        {
          period: 'semana',
          quantity: weeks,
          rate: pricing.weekly_rate,
          subtotal: weeklyPrice,
        },
      ];

      if (remainingDays > 0) {
        weeklyBreakdown.push({
          period: 'diária',
          quantity: remainingDays,
          rate: pricing.daily_rate || pricing.monthly_rate / 30,
          subtotal: remainingPrice,
        });
      }

      scenarios.push({
        name: weeks === 1 ? '1 semana' : `${weeks} semanas`,
        price: weeklyPrice + remainingPrice,
        breakdown: weeklyBreakdown,
      });
    }

    // Scenario 4: Monthly + remaining days
    if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      const monthlyPrice = pricing.monthly_rate * months;
      const remainingPrice = pricing.daily_rate
        ? pricing.daily_rate * remainingDays
        : (pricing.monthly_rate / 30) * remainingDays;

      const monthlyBreakdown: BreakdownItem[] = [
        {
          period: months === 1 ? 'mês' : 'meses',
          quantity: months,
          rate: pricing.monthly_rate,
          subtotal: monthlyPrice,
        },
      ];

      if (remainingDays > 0) {
        monthlyBreakdown.push({
          period: 'diária',
          quantity: remainingDays,
          rate: pricing.daily_rate || pricing.monthly_rate / 30,
          subtotal: remainingPrice,
        });
      }

      scenarios.push({
        name: months === 1 ? '1 mês' : `${months} meses`,
        price: monthlyPrice + remainingPrice,
        breakdown: monthlyBreakdown,
      });
    }

    // Scenario 5: Only monthly rate (fallback if no daily/weekly)
    if (!pricing.daily_rate && !pricing.weekly_rate) {
      const estimatedPrice = (pricing.monthly_rate / 30) * diffDays;
      scenarios.push({
        name: 'taxa mensal proporcional',
        price: estimatedPrice,
        breakdown: [
          {
            period: 'dias (mensal proporc.)',
            quantity: diffDays,
            rate: pricing.monthly_rate / 30,
            subtotal: estimatedPrice,
          },
        ],
      });
    }

    // Choose the best (cheapest) scenario for the customer
    scenarios.sort((a, b) => a.price - b.price);
    const bestScenario = scenarios[0];

    breakdown = bestScenario.breakdown;
    subtotal = bestScenario.price;

    // Calculate savings compared to second-best option
    let savings = null;
    if (scenarios.length > 1) {
      const secondBest = scenarios[1];
      const savingsAmount = secondBest.price - bestScenario.price;
      if (savingsAmount > 0) {
        savings = {
          comparedTo: secondBest.name,
          amount: savingsAmount,
          percentage: (savingsAmount / secondBest.price) * 100,
        };
      }
    }

    // Calculate fees (5% service fee)
    const fees = subtotal * 0.05;
    const total = subtotal + fees;

    // Validate and apply promo code if provided
    let discountInfo = null;
    let discountAmount = 0;
    let finalSubtotal = subtotal;
    let finalFees = fees;
    let finalTotal = total;

    if (promoCode && promoCode.trim()) {
      const promoInfo = await validatePromoCode(promoCode);
      if (promoInfo) {
        const discountResult = applyDiscount(subtotal, promoInfo);
        discountInfo = {
          code: promoInfo.code,
          description: promoInfo.description,
          discountType: promoInfo.discountType,
          discountValue: promoInfo.discountValue,
        };
        discountAmount = discountResult.discount_amount;
        finalSubtotal = discountResult.final_subtotal;
        // Fees are applied on final subtotal
        finalFees = finalSubtotal * 0.05;
        finalTotal = finalSubtotal + finalFees;
      }
    }

    return NextResponse.json({
      success: true,
      calculation: {
        nights: diffDays,
        days: diffDays,
        hours: diffHours,
        breakdown,
        subtotal,
        discount: discountInfo ? {
          code: discountInfo.code,
          description: discountInfo.description,
          type: discountInfo.discountType,
          value: discountInfo.discountValue,
          amount: discountAmount,
        } : null,
        subtotalAfterDiscount: finalSubtotal,
        fees: finalFees,
        total: finalTotal,
        savings: discountAmount > 0 ? {
          comparedTo: 'preço original',
          amount: discountAmount,
          percentage: parseFloat(((discountAmount / subtotal) * 100).toFixed(2)),
        } : null,
      },
    });
  } catch (error) {
    console.error('Error calculating booking:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular reserva' },
      { status: 500 }
    );
  }
}
