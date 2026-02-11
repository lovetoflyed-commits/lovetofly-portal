'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BusinessRegisterForm from '@/components/BusinessRegisterForm';

export default function BusinessRegisterPage() {
    const router = useRouter();

    const handleSuccess = () => {
        // Redirect to pending verification page after successful registration
        router.push('/business/pending-verification');
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8">
                <div className="mx-auto max-w-4xl">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => router.back()}
                            className="mb-4 text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-2"
                        >
                            ← Voltar
                        </button>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                            📋 Registre sua Empresa
                        </h1>
                        <p className="text-slate-600 text-lg">
                            Preencha os dados da sua empresa para criar uma conta e começar a publicar vagas de emprego.
                        </p>
                    </div>

                    {/* Steps Indicator */}
                    <div className="mb-8 p-4 bg-white border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 text-center">
                                <div className="flex items-center justify-center mb-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                        1
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-slate-900">Informações</p>
                            </div>
                            <div className="flex-1 h-1 bg-slate-200 mx-2"></div>
                            <div className="flex-1 text-center">
                                <div className="flex items-center justify-center mb-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm">
                                        2
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-slate-600">Verificação</p>
                            </div>
                            <div className="flex-1 h-1 bg-slate-200 mx-2"></div>
                            <div className="flex-1 text-center">
                                <div className="flex items-center justify-center mb-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm">
                                        3
                                    </div>
                                </div>
                                <p className="text-sm font-semibold text-slate-600">Pronto!</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
                        <BusinessRegisterForm onSuccess={handleSuccess} />
                    </div>

                    {/* Info Section */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="text-2xl mb-2">🔐</div>
                            <h3 className="font-bold text-slate-900 mb-1">Seus dados são seguros</h3>
                            <p className="text-sm text-slate-600">
                                Utilizamos criptografia e os melhores padrões de segurança.
                            </p>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="text-2xl mb-2">✓</div>
                            <h3 className="font-bold text-slate-900 mb-1">Verificação rápida</h3>
                            <p className="text-sm text-slate-600">
                                Seu CNPJ será validado e sua empresa verificada em até 5 dias.
                            </p>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <div className="text-2xl mb-2">💼</div>
                            <h3 className="font-bold text-slate-900 mb-1">Acesso imediato</h3>
                            <p className="text-sm text-slate-600">
                                Comece a publicar vagas assim que sua empresa for aprovada.
                            </p>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Dúvidas?</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-slate-900 text-sm">Qual é o prazo de verificação?</h3>
                                <p className="text-sm text-slate-600 mt-1">
                                    Usualmente a verificação leva de 1 a 5 dias úteis. Você receberá um e-mail quando sua empresa for aprovada.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 text-sm">Posso editar os dados depois?</h3>
                                <p className="text-sm text-slate-600 mt-1">
                                    Sim! Após a verificação, você poderá acessar seu perfil e editar a maioria das informações.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 text-sm">Como faço para publicar vagas?</h3>
                                <p className="text-sm text-slate-600 mt-1">
                                    Após a aprovação, acesse sua área de empresa e clique em "Publicar Vaga" para começar.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
