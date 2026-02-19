'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [status, setStatus] = useState({ loading: false, error: '', success: false });

    const validateForm = () => {
        if (!email || !resetCode || !newPassword || !confirmPassword) {
            return 'Todos os campos são obrigatórios';
        }
        if (resetCode.length !== 6 || !/^\d+$/.test(resetCode)) {
            return 'Código deve ter exatamente 6 dígitos';
        }
        if (newPassword.length < 8) {
            return 'Senha deve ter pelo menos 8 caracteres';
        }
        if (newPassword !== confirmPassword) {
            return 'As senhas não correspondem';
        }
        return '';
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setStatus({ loading: false, error: validationError, success: false });
            return;
        }

        setStatus({ loading: true, error: '', success: false });

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    resetCode,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setStatus({ loading: false, error: data.message || 'Erro ao redefinir senha', success: false });
                return;
            }

            setStatus({ loading: false, error: '', success: true });
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (error) {
            setStatus({ loading: false, error: 'Erro ao conectar com o servidor.', success: false });
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-50" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative z-10"
            >
                <div className="p-8 pb-6 flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 mb-4 shadow-inner">
                        <Lock className="text-blue-500" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Redefinir Senha</h2>
                    <p className="text-slate-500 text-sm mt-2 text-center">
                        Digite o código de redefinição e sua nova senha.
                    </p>
                </div>

                {!status.success ? (
                    <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                E-mail
                            </label>
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                required
                            />
                        </div>

                        {/* Reset Code Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                Código de Redefinição
                            </label>
                            <input
                                type="text"
                                placeholder="000000"
                                value={resetCode}
                                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-center text-2xl tracking-widest"
                                required
                            />
                            <p className="text-xs text-slate-500 ml-1">Recebido por email (6 dígitos)</p>
                        </div>

                        {/* New Password Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                Nova Senha
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Mínimo 8 caracteres"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 px-4 pr-10 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-400"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                Confirmar Senha
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirme sua nova senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2.5 px-4 pr-10 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-400"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {status.error && (
                            <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-3 flex items-center gap-3">
                                <AlertCircle className="text-red-500 shrink-0" size={16} />
                                <p className="text-xs text-red-200">{status.error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status.loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
                        >
                            {status.loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    REDEFINIR SENHA <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <div className="text-center pt-2">
                            <Link href="/login" className="text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1 transition-colors">
                                <ArrowLeft size={12} /> Voltar para Login
                            </Link>
                        </div>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="px-8 pb-8 text-center space-y-4"
                    >
                        <div className="bg-green-900/20 border border-green-900/50 rounded-lg p-4 flex flex-col items-center gap-2">
                            <CheckCircle2 className="text-green-500" size={32} />
                            <h3 className="text-white font-bold">Senha Redefinida!</h3>
                            <p className="text-xs text-slate-400">
                                Sua senha foi redefinida com sucesso. Redirecionando...
                            </p>
                        </div>
                        <Link
                            href="/login"
                            className="block w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors text-sm"
                        >
                            Ir para Login
                        </Link>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
