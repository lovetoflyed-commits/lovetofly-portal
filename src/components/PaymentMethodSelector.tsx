'use client';

/**
 * Payment Method Selector Component
 * Allows users to choose between Stripe and PIX payment methods
 */

import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, AlertCircle } from 'lucide-react';

interface PaymentMethodSelectorProps {
    selectedMethod: 'stripe' | 'pix' | null;
    onSelect: (method: 'stripe' | 'pix') => void;
    amount?: string;
    orderId?: string;
    loading?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
    selectedMethod,
    onSelect,
    amount,
    orderId,
    loading = false
}) => {
    const [pixAvailable, setPixAvailable] = useState(true);

    useEffect(() => {
        // Check if PIX is available (if PIX key is configured)
        const checkPIXAvailability = async () => {
            try {
                const response = await fetch('/api/payments/pix/status');
                setPixAvailable(response.ok);
            } catch (err) {
                setPixAvailable(false);
            }
        };

        checkPIXAvailability();
    }, []);

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Escolha a Forma de Pagamento</h2>
                <p className="text-gray-600">Selecione como você deseja pagar pela sua assinatura</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stripe Option */}
                <button
                    onClick={() => onSelect('stripe')}
                    disabled={loading}
                    className={`relative p-6 rounded-lg border-2 transition ${selectedMethod === 'stripe'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-blue-400'
                        }`}
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600 text-white">
                                <CreditCard className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-lg font-semibold text-gray-900">Cartão de Crédito</h3>
                            <p className="text-sm text-gray-600 mt-1">Visa, Mastercard, American Express</p>
                            <p className="text-xs text-gray-500 mt-2">Processado via Stripe</p>
                        </div>
                    </div>
                    {selectedMethod === 'stripe' && (
                        <div className="absolute top-4 right-4 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                </button>

                {/* PIX Option */}
                <button
                    onClick={() => pixAvailable && onSelect('pix')}
                    disabled={loading || !pixAvailable}
                    className={`relative p-6 rounded-lg border-2 transition ${selectedMethod === 'pix'
                            ? 'border-green-600 bg-green-50'
                            : pixAvailable
                                ? 'border-gray-200 bg-white hover:border-green-400'
                                : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-600 text-white">
                                <QrCode className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-lg font-semibold text-gray-900">PIX</h3>
                            <p className="text-sm text-gray-600 mt-1">Instantâneo e sem taxas</p>
                            <p className="text-xs text-gray-500 mt-2">QR Code ou copiar e colar</p>
                            {!pixAvailable && (
                                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Não disponível no momento
                                </p>
                            )}
                        </div>
                    </div>
                    {selectedMethod === 'pix' && pixAvailable && (
                        <div className="absolute top-4 right-4 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                </button>
            </div>

            {/* Info Section */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Informações Importantes</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Seu pagamento é processado de forma segura e criptografada</li>
                            <li>• PIX é instantâneo - sua assinatura é ativada em segundos após o pagamento</li>
                            <li>• Você receberá uma confirmação por email após o pagamento</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Amount Display */}
            {amount && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Valor a pagar:</p>
                    <p className="text-3xl font-bold text-gray-900">{amount}</p>
                </div>
            )}
        </div>
    );
};

export default PaymentMethodSelector;
