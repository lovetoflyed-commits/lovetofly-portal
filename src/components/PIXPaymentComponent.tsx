'use client';

/**
 * PIX Payment Component
 * Displays QR code for payment and handles payment status
 */

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Copy, Loader, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface PIXPaymentData {
    paymentId: number;
    brCode: string;
    qrCodeUrl: string;
    amount: string;
    expiresAt: string;
    pixKey: {
        key: string;
        type: string;
        bankName?: string;
        accountHolder?: string;
    } | null;
}

interface PIXPaymentComponentProps {
    orderId: string;
    orderType: string;
    amountCents: number;
    description?: string;
    onPaymentComplete?: (paymentId: number, transactionId: string) => void;
    onPaymentExpired?: (paymentId: number) => void;
    autoRefresh?: boolean;
    refreshInterval?: number; // milliseconds
}

export const PIXPaymentComponent: React.FC<PIXPaymentComponentProps> = ({
    orderId,
    orderType,
    amountCents,
    description,
    onPaymentComplete,
    onPaymentExpired,
    autoRefresh = true,
    refreshInterval = 8000 // Check every 8 seconds
}) => {
    const [paymentData, setPaymentData] = useState<PIXPaymentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'expired'>('pending');
    const [copied, setCopied] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [manualTransactionId, setManualTransactionId] = useState('');
    const [manualConfirmLoading, setManualConfirmLoading] = useState(false);
    const [manualConfirmError, setManualConfirmError] = useState<string | null>(null);

    // Generate PIX payment QR code
    const generatePayment = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

            const response = await fetch('/api/payments/pix', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    orderId,
                    orderType,
                    amountCents,
                    description
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to generate PIX payment');
            }

            const data = await response.json();
            setPaymentData(data.data);
            setPaymentStatus('pending');

            // Calculate time remaining
            const expiresAt = new Date(data.data.expiresAt);
            const now = new Date();
            const remaining = Math.max(0, expiresAt.getTime() - now.getTime());
            setTimeRemaining(remaining);
        } catch (err: any) {
            setError(err.message);
            console.error('Error generating PIX payment:', err);
        } finally {
            setLoading(false);
        }
    };

    // Check payment status
    const checkPaymentStatus = async () => {
        if (!paymentData) return;

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

            const response = await fetch(`/api/payments/pix?paymentId=${paymentData.paymentId}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                }
            });

            if (!response.ok) return;

            const data = await response.json();
            const newStatus = data.data.status;

            if (newStatus === 'completed' && paymentStatus !== 'completed') {
                setPaymentStatus('completed');
                onPaymentComplete?.(paymentData.paymentId, data.data.transactionId);
            } else if (newStatus === 'expired' && paymentStatus !== 'expired') {
                setPaymentStatus('expired');
                onPaymentExpired?.(paymentData.paymentId);
            }
        } catch (err) {
            console.error('Error checking payment status:', err);
        }
    };

    const confirmPaymentManually = async () => {
        if (!paymentData || !manualTransactionId.trim()) {
            setManualConfirmError('Informe o ID da transacao para confirmar.');
            return;
        }

        try {
            setManualConfirmLoading(true);
            setManualConfirmError(null);

            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const response = await fetch('/api/payments/pix/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    paymentId: paymentData.paymentId,
                    transactionId: manualTransactionId.trim(),
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload?.error || 'Falha ao confirmar pagamento PIX.');
            }

            setPaymentStatus('completed');
            onPaymentComplete?.(paymentData.paymentId, manualTransactionId.trim());
        } catch (err: any) {
            setManualConfirmError(err.message || 'Falha ao confirmar pagamento PIX.');
        } finally {
            setManualConfirmLoading(false);
        }
    };

    // Copy BRCode to clipboard
    const copyBRCode = async () => {
        if (paymentData?.brCode) {
            try {
                await navigator.clipboard.writeText(paymentData.brCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Error copying BRCode:', err);
            }
        }
    };

    // Initialize payment on mount
    useEffect(() => {
        generatePayment();
    }, [orderId, orderType, amountCents]);

    // Auto-refresh payment status
    useEffect(() => {
        if (!autoRefresh || paymentStatus !== 'pending') return;

        const interval = setInterval(() => {
            checkPaymentStatus();
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, paymentStatus, paymentData]);

    // Update time remaining
    useEffect(() => {
        if (!paymentData || paymentStatus !== 'pending') return;

        const interval = setInterval(() => {
            const expiresAt = new Date(paymentData.expiresAt);
            const now = new Date();
            const remaining = Math.max(0, expiresAt.getTime() - now.getTime());

            setTimeRemaining(remaining);

            if (remaining <= 0) {
                setPaymentStatus('expired');
                onPaymentExpired?.(paymentData.paymentId);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [paymentData, paymentStatus]);

    const formatTimeRemaining = (ms: number) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                <Loader className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600">Gerando código PIX...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-8 w-8 text-red-600 mb-4" />
                <p className="text-red-600 text-center">{error}</p>
                <button
                    onClick={generatePayment}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    if (paymentStatus === 'completed') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">Pagamento Confirmado</h3>
                <p className="text-green-600 text-center">
                    Seu pagamento foi recebido com sucesso. Obrigado!
                </p>
            </div>
        );
    }

    if (paymentStatus === 'expired') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-amber-50 rounded-lg border border-amber-200">
                <Clock className="h-8 w-8 text-amber-600 mb-4" />
                <p className="text-amber-600 text-center mb-4">Este código PIX expirou</p>
                <button
                    onClick={generatePayment}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                >
                    Gerar Novo Código
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                    <h2 className="text-2xl font-bold mb-2">Pague com PIX</h2>
                    <p className="text-blue-100">Rápido, seguro e sem taxas</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Amount */}
                    <div className="text-center">
                        <p className="text-gray-600 text-sm mb-2">Valor a pagar</p>
                        <p className="text-3xl font-bold text-gray-900">{paymentData?.amount}</p>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center bg-gray-50 p-4 rounded-lg border border-gray-200">
                        {paymentData?.qrCodeUrl && (
                            <div className="relative">
                                <Image
                                    src={paymentData.qrCodeUrl}
                                    alt="PIX QR Code"
                                    width={250}
                                    height={250}
                                    priority
                                    className="border-2 border-gray-300 rounded-lg"
                                />
                            </div>
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Como pagar:</h3>
                        <ol className="text-sm text-blue-800 space-y-1">
                            <li>1. Escaneie o código QR com seu app bancário</li>
                            <li>2. Ou copie o código abaixo</li>
                            <li>3. Confirme os dados do recebedor</li>
                            <li>4. Complete a transação</li>
                        </ol>
                    </div>

                    {/* BRCode (for manual entry) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Código PIX (copiar e colar):</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={paymentData?.brCode || ''}
                                readOnly
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono bg-gray-50 text-gray-700"
                            />
                            <button
                                onClick={copyBRCode}
                                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${copied
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                <Copy className="h-4 w-4" />
                                {copied ? 'Copiado!' : 'Copiar'}
                            </button>
                        </div>
                    </div>

                    {/* PIX Key Details */}
                    {paymentData?.pixKey && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
                            <h4 className="font-semibold text-gray-900 mb-2">Dados do Recebedor:</h4>
                            <div className="space-y-1 text-gray-700">
                                <p><span className="font-medium">Chave PIX:</span> {paymentData.pixKey.key}</p>
                                <p><span className="font-medium">Tipo:</span> {paymentData.pixKey.type.toUpperCase()}</p>
                                {paymentData.pixKey.accountHolder && (
                                    <p><span className="font-medium">Titular:</span> {paymentData.pixKey.accountHolder}</p>
                                )}
                                {paymentData.pixKey.bankName && (
                                    <p><span className="font-medium">Banco:</span> {paymentData.pixKey.bankName}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Timer */}
                    {timeRemaining !== null && (
                        <div className="flex items-center justify-center gap-2 text-sm font-medium">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className={timeRemaining < 60000 ? 'text-red-600' : 'text-gray-600'}>
                                Código expira em: {formatTimeRemaining(timeRemaining)}
                            </span>
                        </div>
                    )}

                    {/* Manual Confirmation */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-amber-900">Pagamento feito e nao confirmado?</h4>
                        <p className="text-xs text-amber-700">
                            Cole o ID da transacao exibido no comprovante do seu banco.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={manualTransactionId}
                                onChange={(e) => setManualTransactionId(e.target.value)}
                                placeholder="ID da transacao"
                                className="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white text-gray-700"
                            />
                            <button
                                onClick={confirmPaymentManually}
                                disabled={manualConfirmLoading}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:bg-amber-300"
                            >
                                {manualConfirmLoading ? 'Confirmando...' : 'Confirmar'}
                            </button>
                        </div>
                        {manualConfirmError && (
                            <p className="text-xs text-red-600">{manualConfirmError}</p>
                        )}
                    </div>

                    {/* Info */}
                    <div className="text-xs text-gray-500 text-center p-3 bg-gray-50 rounded-lg">
                        <p>O pagamento é processado automaticamente. Você receberá uma confirmação assim que o banco processar a transação.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PIXPaymentComponent;
