'use client';

import React, { useState } from 'react';

interface UserTypeSelectionModalProps {
    isOpen: boolean;
    onSelect: (userType: 'individual' | 'business') => void;
    onCancel: () => void;
}

export default function UserTypeSelectionModal({
    isOpen,
    onSelect,
    onCancel,
}: UserTypeSelectionModalProps) {
    const [selectedType, setSelectedType] = useState<'individual' | 'business' | null>(null);

    if (!isOpen) return null;

    const handleContinue = () => {
        if (selectedType) {
            onSelect(selectedType);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-slate-900 mb-2">
                        Tipo de Cadastro
                    </h2>
                    <p className="text-slate-600 text-lg">
                        Selecione o tipo de conta para se registrar no Love to Fly
                    </p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Individual Option */}
                    <label
                        className={`relative cursor-pointer group transition-all duration-200 ${selectedType === 'individual' ? 'ring-2 ring-blue-600' : 'ring-1 ring-slate-200'
                            } rounded-xl p-6 hover:ring-blue-400`}
                    >
                        <input
                            type="radio"
                            name="userType"
                            value="individual"
                            checked={selectedType === 'individual'}
                            onChange={() => setSelectedType('individual')}
                            className="sr-only"
                        />

                        <div className="flex flex-col items-center text-center">
                            <div className="text-5xl mb-4">👤</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                Pessoa Física
                            </h3>
                            <p className="text-slate-600 text-sm mb-4">
                                Piloto, instrutor, mecânico, estudante ou entusiasta de aviação
                            </p>

                            <ul className="text-sm text-slate-500 text-left space-y-2 mt-4 w-full">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✓</span>
                                    <span>Candidatar-se a vagas</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✓</span>
                                    <span>Criar perfil profissional</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✓</span>
                                    <span>Acessar ferramentas de aviação</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 font-bold">✓</span>
                                    <span>Participar da comunidade</span>
                                </li>
                            </ul>

                            {selectedType === 'individual' && (
                                <div className="mt-4 pt-4 border-t border-blue-200">
                                    <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                        Selecionado
                                    </span>
                                </div>
                            )}
                        </div>
                    </label>

                    {/* Business Option */}
                    <label
                        className={`relative cursor-pointer group transition-all duration-200 ${selectedType === 'business' ? 'ring-2 ring-orange-600' : 'ring-1 ring-slate-200'
                            } rounded-xl p-6 hover:ring-orange-400`}
                    >
                        <input
                            type="radio"
                            name="userType"
                            value="business"
                            checked={selectedType === 'business'}
                            onChange={() => setSelectedType('business')}
                            className="sr-only"
                        />

                        <div className="flex flex-col items-center text-center">
                            <div className="text-5xl mb-4">🏢</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                Pessoa Jurídica
                            </h3>
                            <p className="text-slate-600 text-sm mb-4">
                                Companhia aérea, escola de aviação, manutenção ou empresa do setor
                            </p>

                            <ul className="text-sm text-slate-500 text-left space-y-2 mt-4 w-full">
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-600 font-bold">✓</span>
                                    <span>Publicar vagas de emprego</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-600 font-bold">✓</span>
                                    <span>Acessar painel de contratação</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-600 font-bold">✓</span>
                                    <span>Gerenciar candidatos</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-orange-600 font-bold">✓</span>
                                    <span>Integração com ferramentas</span>
                                </li>
                            </ul>

                            {selectedType === 'business' && (
                                <div className="mt-4 pt-4 border-t border-orange-200">
                                    <span className="inline-block px-4 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                                        Selecionado
                                    </span>
                                </div>
                            )}
                        </div>
                    </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!selectedType}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continuar
                    </button>
                </div>

                {/* Info Text */}
                {!selectedType && (
                    <p className="text-center text-sm text-slate-500 mt-4">
                        Selecione uma opção acima para continuar
                    </p>
                )}
            </div>
        </div>
    );
}
