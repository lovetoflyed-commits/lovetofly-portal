'use client';

import { useState } from 'react';

interface PromoCodeInputProps {
    onCodeApplied?: (code: string, discount: any) => void;
    onCodeRemoved?: () => void;
    subtotal: number;
    disabled?: boolean;
}

export default function PromoCodeInput({
    onCodeApplied,
    onCodeRemoved,
    subtotal,
    disabled = false,
}: PromoCodeInputProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [appliedCode, setAppliedCode] = useState<any>(null);

    const validateCode = async () => {
        if (!code.trim()) {
            setError('Digite um código promocional');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Call the calculation endpoint to validate and get discount
            const response = await fetch('/api/hangarshare/booking/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hangarId: 'temp', // Temporary value for validation only
                    checkIn: new Date().toISOString(),
                    checkOut: new Date(Date.now() + 86400000).toISOString(),
                    promoCode: code.trim(),
                }),
            });

            const data = await response.json();

            if (data.success && data.calculation.discount) {
                setAppliedCode(data.calculation.discount);
                setError(null);
                if (onCodeApplied) {
                    onCodeApplied(code.trim(), data.calculation.discount);
                }
            } else {
                setError('Código promocional inválido, expirado ou já foi usado');
                setAppliedCode(null);
            }
        } catch (err) {
            setError('Erro ao validar código promocional');
            console.error('Promo code validation error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveCode = () => {
        setCode('');
        setAppliedCode(null);
        setError(null);
        if (onCodeRemoved) {
            onCodeRemoved();
        }
    };

    if (appliedCode) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-green-900">✓ Código aplicado com sucesso</p>
                        <p className="text-sm text-green-700 mt-1">
                            Código: <span className="font-mono font-bold">{appliedCode.code}</span>
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                            Desconto:
                            {appliedCode.type === 'percent' ? (
                                <span className="font-bold ml-1">
                                    {appliedCode.value}% (R$ {((subtotal * appliedCode.value) / 100).toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    })})
                                </span>
                            ) : (
                                <span className="font-bold ml-1">
                                    R$ {appliedCode.value?.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    })}
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={handleRemoveCode}
                        className="text-sm text-green-600 hover:text-green-700 font-semibold underline"
                    >
                        Remover
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
                Código Promocional (opcional)
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setError(null);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && !loading && validateCode()}
                    placeholder="Digite seu código (ex: PROMO50, DESCONTO20)"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={disabled || loading}
                />
                <button
                    onClick={validateCode}
                    disabled={disabled || loading || !code.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Validando...' : 'Aplicar'}
                </button>
            </div>
            {error && (
                <p className="text-sm text-red-600 font-semibold">⚠️ {error}</p>
            )}
        </div>
    );
}
