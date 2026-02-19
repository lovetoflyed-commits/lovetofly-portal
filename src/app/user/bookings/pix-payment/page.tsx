'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface PIXPaymentResponse {
    id: number;
    order_id: string;
    amount: {
        cents: number;
        formatted: string;
    };
    brCode: {
        qrCode: string;
        brCode: string;
        txId: string;
        expiresAt: string;
    };
    expires_at: string;
}

interface PaymentStatus {
    id: number;
    order_id: string;
    status: 'pending' | 'completed' | 'expired' | 'failed';
    amount: {
        cents: number;
        formatted: string;
    };
    expires_at: string;
    payment_date: string | null;
}

function BookingPIXPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, token } = useAuth();

    const [bookingId, setBookingId] = useState<string>('');
    const [amount, setAmount] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [payment, setPayment] = useState<PIXPaymentResponse | null>(null);
    const [status, setStatus] = useState<PaymentStatus | null>(null);
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [error, setError] = useState<string>('');

    // Get booking details from URL
    useEffect(() => {
        const bid = searchParams.get('booking_id') || '';
        const amt = searchParams.get('amount') || '0';
        setBookingId(bid);
        setAmount(parseInt(amt, 10));
    }, [searchParams]);

    // Create payment
    const createPayment = async () => {
        if (!bookingId || !amount || !user) {
            setError('Missing booking ID or amount');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/payments/pix/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    orderType: 'hangar_booking',
                    orderId: `booking-${bookingId}`,
                    amountCents: amount,
                    description: `Hangar Booking #${bookingId}`,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create payment');
            }

            const paymentData: PIXPaymentResponse = await response.json();
            setPayment(paymentData);
            setStatus(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create payment');
        } finally {
            setLoading(false);
        }
    };

    // Poll payment status
    useEffect(() => {
        if (!payment) return;

        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/payments/pix/status/${payment.order_id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const statusData: PaymentStatus = await response.json();
                    setStatus(statusData);

                    if (statusData.status === 'completed') {
                        // Booking is auto-confirmed by webhook, redirect to success
                        setTimeout(() => {
                            router.push(`/user/bookings/${bookingId}?payment=success`);
                        }, 2000);
                    } else if (statusData.status === 'expired') {
                        setError('Payment QR code has expired. Please try again.');
                    }
                }
            } catch (err) {
                console.error('[PIX Status Poll] Error:', err);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 2000);

        return () => clearInterval(interval);
    }, [payment, token, router, bookingId]);

    // Countdown timer
    useEffect(() => {
        if (!payment?.expires_at) return;

        const updateTimer = () => {
            const now = new Date();
            const expiry = new Date(payment.expires_at);
            const remaining = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000));
            setTimeLeft(remaining);

            if (remaining === 0) {
                setError('Payment QR code has expired. Please create a new payment.');
            }
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);

        return () => clearInterval(timer);
    }, [payment]);

    const copyToClipboard = () => {
        if (payment?.brCode.brCode) {
            navigator.clipboard.writeText(payment.brCode.brCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
            <div className="max-w-2xl mx-auto px-4">
                {/* Navigation */}
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors flex items-center gap-2"
                    >
                        <span>←</span> Voltar
                    </button>
                    {user?.role === 'master' && (
                        <a
                            href="/admin/pix"
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors"
                        >
                            📊 Painel Admin PIX
                        </a>
                    )}
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Complete Your Booking Payment</h1>
                    <p className="text-gray-600 mt-2">Pay securely with PIX</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {!payment ? (
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Booking ID
                                </label>
                                <input
                                    type="text"
                                    value={bookingId}
                                    onChange={(e) => setBookingId(e.target.value)}
                                    placeholder="e.g., 12345"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount (R$)
                                </label>
                                <input
                                    type="number"
                                    value={amount / 100 || ''}
                                    onChange={(e) => setAmount(Math.ceil(parseFloat(e.target.value) * 100))}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <button
                                onClick={createPayment}
                                disabled={loading || !bookingId || !amount}
                                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                            >
                                {loading ? 'Creating Payment...' : 'Generate QR Code'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Status Display */}
                        {status && (
                            <div
                                className={`p-4 rounded-lg text-center ${status.status === 'completed'
                                    ? 'bg-green-100 text-green-700 border border-green-400'
                                    : status.status === 'expired'
                                        ? 'bg-red-100 text-red-700 border border-red-400'
                                        : 'bg-blue-100 text-blue-700 border border-blue-400'
                                    }`}
                            >
                                {status.status === 'completed' && (
                                    <div>
                                        <p className="font-semibold text-lg">✓ Payment Confirmed</p>
                                        <p className="text-sm mt-1">Your booking is confirmed!</p>
                                    </div>
                                )}
                                {status.status === 'pending' && (
                                    <div>
                                        <p className="font-semibold text-lg">⏳ Waiting for Payment</p>
                                        <p className="text-sm mt-1">Scan the QR code to complete the payment</p>
                                    </div>
                                )}
                                {status.status === 'expired' && (
                                    <div>
                                        <p className="font-semibold text-lg">✗ Payment Expired</p>
                                        <p className="text-sm mt-1">Please create a new payment</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* QR Code Card */}
                        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Scan to Pay</h2>

                            {payment.brCode.qrCode && (
                                <div className="mb-6 flex justify-center">
                                    <Image
                                        src={payment.brCode.qrCode}
                                        alt="PIX QR Code"
                                        width={300}
                                        height={300}
                                        className="w-64 h-64"
                                    />
                                </div>
                            )}

                            <p className="text-sm text-gray-600 mb-4">
                                Amount: <span className="font-bold text-lg text-green-600">{payment.amount.formatted}</span>
                            </p>

                            {timeLeft > 0 && (
                                <p className={`text-sm font-semibold ${timeLeft < 60 ? 'text-red-600' : 'text-gray-600'}`}>
                                    Expires in: {formatTime(timeLeft)}
                                </p>
                            )}
                        </div>

                        {/* Copy-Paste Option */}
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Or copy the PIX code:</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={payment.brCode.brCode}
                                    readOnly
                                    className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm"
                                />
                                <button
                                    onClick={copyToClipboard}
                                    className={`px-4 py-3 font-semibold rounded-lg transition ${copied
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                        }`}
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Paste this code in your banking app if you don't want to scan the QR code
                            </p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <h3 className="font-semibold text-green-800 mb-3">How to Complete Payment</h3>
                            <ol className="text-sm text-green-700 space-y-2 list-decimal list-inside">
                                <li>Open your banking app (Nubank, Itaú, etc.)</li>
                                <li>Select PIX → Scan QR Code (or paste the code)</li>
                                <li>Review the booking details and amount</li>
                                <li>Confirm the payment</li>
                                <li>Your booking will be immediately confirmed</li>
                            </ol>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BookingPIXPayment() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <p className="text-gray-500">Loading...</p>
                </div>
            }
        >
            <BookingPIXPaymentContent />
        </Suspense>
    );
}
