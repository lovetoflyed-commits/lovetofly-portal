'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function PendingVerificationPage() {
    const router = useRouter();
    const [businessData, setBusinessData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get business data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                setBusinessData(user);
            } catch (err) {
                console.error('Error parsing user data:', err);
            }
        }
        setLoading(false);
    }, []);

    const handleResendEmail = async () => {
        try {
            // Call API to resend verification email
            const response = await fetch('/api/auth/resend-verification-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: businessData?.email || localStorage.getItem('businessEmail') || '',
                }),
            });

            if (response.ok) {
                alert('E-mail de verificação reenviado com sucesso!');
            } else {
                alert('Erro ao reenviar e-mail. Tente novamente.');
            }
        } catch (err) {
            console.error('Error resending verification email:', err);
            alert('Erro ao reenviar e-mail.');
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-600 mx-auto mb-4 animate-spin"></div>
                    <p className="text-slate-600">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-2xl">
                    {/* Success Card */}
                    <div className="bg-white border-2 border-green-400 rounded-2xl p-8 md:p-12 shadow-lg text-center">
                        {/* Icon */}
                        <div className="mb-6">
                            <div className="text-6xl">✅</div>
                        </div>

                        {/* Main Message */}
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                            Registroem Processo!
                        </h1>

                        <p className="text-lg text-slate-600 mb-8">
                            Sua empresa foi registrada com sucesso e agora está aguardando verificação.
                        </p>

                        {/* Business Info */}
                        {businessData && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-left">
                                <h3 className="font-bold text-slate-900 mb-4">Dados Cadastrados:</h3>
                                <div className="space-y-3">
                                    {businessData.legalName && (
                                        <div>
                                            <p className="text-sm text-slate-600">Razão Social</p>
                                            <p className="font-semibold text-slate-900">{businessData.legalName}</p>
                                        </div>
                                    )}
                                    {businessData.businessName && (
                                        <div>
                                            <p className="text-sm text-slate-600">Nome Fantasia</p>
                                            <p className="font-semibold text-slate-900">{businessData.businessName}</p>
                                        </div>
                                    )}
                                    {businessData.cnpj && (
                                        <div>
                                            <p className="text-sm text-slate-600">CNPJ</p>
                                            <p className="font-semibold text-slate-900">{businessData.cnpj}</p>
                                        </div>
                                    )}
                                    {businessData.email && (
                                        <div>
                                            <p className="text-sm text-slate-600">Email</p>
                                            <p className="font-semibold text-slate-900">{businessData.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-8">
                            <h3 className="font-bold text-slate-900 mb-4">O Que Acontece Agora?</h3>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                                            1
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-slate-900">Validação Inicial</p>
                                        <p className="text-sm text-slate-600">Seus dados estão sendo validados</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                                            2
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-slate-900">Análise da Empresa</p>
                                        <p className="text-sm text-slate-600">Nosso time analisará sua documentação (1-5 dias)</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                                            3
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-slate-900">Confirmação por Email</p>
                                        <p className="text-sm text-slate-600">Você receberá um e-mail quando aprovado</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white font-bold text-sm">
                                            ✓
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-slate-900">Acesso ao Portal</p>
                                        <p className="text-sm text-slate-600">Comece a publicar vagas de emprego</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Important Info */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
                            <h3 className="font-bold text-amber-900 mb-2">⏱️ Tempo Estimado</h3>
                            <p className="text-amber-800">
                                A verificação geralmente leva de <strong>1 a 5 dias úteis</strong>. Você receberá atualizações por email durante o processo.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                            <button
                                onClick={() => router.push('/')}
                                className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                            >
                                Ir para Início
                            </button>
                            <button
                                onClick={handleResendEmail}
                                className="px-6 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                            >
                                Reenviar Email de Confirmação
                            </button>
                        </div>

                        {/* FAQ */}
                        <div className="bg-slate-50 rounded-xl p-6 text-left border border-slate-200">
                            <h3 className="font-bold text-slate-900 mb-4">Dúvidas Frequentes</h3>
                            <div className="space-y-4">
                                <div>
                                    <details className="cursor-pointer">
                                        <summary className="font-semibold text-slate-900 hover:text-blue-600">
                                            Por que é necessária a verificação?
                                        </summary>
                                        <p className="text-sm text-slate-600 mt-2">
                                            A verificação é importante para garantir que apenas empresas legítimas possam publicar vagas no nosso portal, protegendo nossos usuários.
                                        </p>
                                    </details>
                                </div>

                                <div>
                                    <details className="cursor-pointer">
                                        <summary className="font-semibold text-slate-900 hover:text-blue-600">
                                            Minha empresa foi rejeitada. O que fazer?
                                        </summary>
                                        <p className="text-sm text-slate-600 mt-2">
                                            Se sua empresa foi rejeitada, você receberá um e-mail explicando o motivo. Você pode entrar em contato com nosso suporte para mais informações.
                                        </p>
                                    </details>
                                </div>

                                <div>
                                    <details className="cursor-pointer">
                                        <summary className="font-semibold text-slate-900 hover:text-blue-600">
                                            Posso fazer login agora?
                                        </summary>
                                        <p className="text-sm text-slate-600 mt-2">
                                            Sim! Você pode fazer login agora mesmo, mas poderá publicar vagas apenas após a aprovação da verificação.
                                        </p>
                                    </details>
                                </div>
                            </div>
                        </div>

                        {/* Contact Support */}
                        <div className="mt-8 pt-8 border-t border-slate-200">
                            <p className="text-slate-600 mb-4">
                                Precisa de ajuda? Entre em contato com nosso suporte:
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="mailto:suporte@lovetfly.com"
                                    className="inline-block px-6 py-2 text-blue-600 hover:text-blue-700 font-semibold"
                                >
                                    📧 suporte@lovetofly.com
                                </a>
                                <a
                                    href="tel:+551140000000"
                                    className="inline-block px-6 py-2 text-blue-600 hover:text-blue-700 font-semibold"
                                >
                                    📞 (11) 4000-0000
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-8 text-center text-sm text-slate-600">
                        <p>
                            Acompanhe o status da sua solicitação no seu painel de controle ou aguarde notificação por email.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
