'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { maskCNPJ, isValidCNPJ, maskPhone, maskCEP } from '@/utils/masks';

export default function BusinessRegisterForm({ onSuccess }: { onSuccess: () => void }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);

    const [formData, setFormData] = useState({
        // Legal Information
        cnpj: '',
        legalName: '',
        businessName: '',
        businessType: '',

        // Contact Information
        email: '',
        invitationCode: '',
        password: '',
        confirmPassword: '',
        businessPhone: '',
        businessEmail: '',
        website: '',
        representativeName: '',
        representativeTitle: '',

        // Headquarters Address
        headquartersStreet: '',
        headquartersNumber: '',
        headquartersComplement: '',
        headquartersNeighborhood: '',
        headquartersCity: '',
        headquartersState: '',
        headquartersZip: '',
        headquartersCountry: 'Brasil',

        // Business Details
        companySize: '',
        industry: '',
        description: '',
        establishedYear: '',
        annualHiringVolume: '',

        // Primary Operations
        primaryOperations: [] as string[],

        // Preferences
        newsletter: false,
        terms: false,
    });

    const businessTypes = [
        { value: 'airline', label: 'Companhia Aérea' },
        { value: 'flight_school', label: 'Escola de Aviação' },
        { value: 'maintenance', label: 'Manutenção' },
        { value: 'consulting', label: 'Consultoria' },
        { value: 'aircraft_sales', label: 'Venda/Aluguel de Aeronaves' },
        { value: 'catering', label: 'Catering' },
        { value: 'ground_services', label: 'Serviços de Solo' },
        { value: 'other', label: 'Outro' },
    ];

    const companySizes = [
        { value: 'micro', label: 'Microempresa (1-10)' },
        { value: 'small', label: 'Pequena (11-50)' },
        { value: 'medium', label: 'Média (51-250)' },
        { value: 'large', label: 'Grande (251+)' },
    ];

    const operationOptions = [
        { value: 'passenger_transport', label: 'Transporte de Passageiros' },
        { value: 'cargo', label: 'Carga' },
        { value: 'flight_training', label: 'Treinamento de Voo' },
        { value: 'maintenance_services', label: 'Serviços de Manutenção' },
        { value: 'aircraft_sales', label: 'Venda de Aeronaves' },
        { value: 'other', label: 'Outro' },
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let finalValue = value;

        if (name === 'cnpj') finalValue = maskCNPJ(value);
        if (name === 'businessPhone') finalValue = maskPhone(value);
        if (name === 'headquartersZip') {
            finalValue = maskCEP(value);
            // Auto-fetch when 8 digits are entered (XXXXX-XXX format = 9 chars)
            const cleanedZip = finalValue.replace(/\D/g, '');
            if (cleanedZip.length === 8) {
                setTimeout(() => fetchAddressByCEP(cleanedZip), 300);
            }
        }

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            if (name === 'primaryOperations') {
                setFormData((prev) => ({
                    ...prev,
                    primaryOperations: checked
                        ? [...prev.primaryOperations, value]
                        : prev.primaryOperations.filter((op) => op !== value),
                }));
            } else {
                setFormData((prev) => ({ ...prev, [name]: checked }));
            }
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: finalValue }));
    };

    const fetchAddressByCEP = async (cep: string) => {
        const cleaned = cep.replace(/\D/g, '');
        if (cleaned.length !== 8) return;

        setCepLoading(true);
        try {
            const response = await fetch(`/api/address/cep?code=${cleaned}`);
            if (!response.ok) throw new Error('CEP lookup failed');

            const data = await response.json();
            if (data.error || !data.success) {
                setError('CEP não encontrado.');
                setCepLoading(false);
                return;
            }

            setFormData((prev) => ({
                ...prev,
                headquartersStreet: data.street || prev.headquartersStreet,
                headquartersNeighborhood: data.neighborhood || prev.headquartersNeighborhood,
                headquartersCity: data.city || prev.headquartersCity,
                headquartersState: data.state || prev.headquartersState,
            }));

            setError('');
        } catch (err) {
            setError('Não foi possível buscar o CEP.');
        } finally {
            setCepLoading(false);
        }
    };

    const handleCepBlur = () => {
        const cleanedZip = formData.headquartersZip.replace(/\D/g, '');
        if (cleanedZip.length === 8) {
            fetchAddressByCEP(cleanedZip);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate required fields
        if (!formData.legalName || !formData.businessName || !formData.email || !formData.password) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            setLoading(false);
            return;
        }

        // Validate CNPJ
        const cleanedCNPJ = formData.cnpj.replace(/\D/g, '');
        if (!isValidCNPJ(cleanedCNPJ)) {
            setError('CNPJ inválido.');
            setLoading(false);
            return;
        }

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        // Validate terms
        if (!formData.terms) {
            setError('Você deve aceitar os termos de uso.');
            setLoading(false);
            return;
        }

        try {
            const cleanedFormData = {
                ...formData,
                cnpj: cleanedCNPJ,
                businessPhone: formData.businessPhone.replace(/\D/g, ''),
                headquartersZip: formData.headquartersZip.replace(/\D/g, ''),
                invitationCode: formData.invitationCode.trim() || null,
                userType: 'business',
            };

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanedFormData),
            });

            let data;
            let responseText = '';
            try {
                responseText = await response.text();
                data = responseText ? JSON.parse(responseText) : {};
            } catch (parseErr) {
                console.error('Non-JSON response received:', responseText);
                setError('Erro ao processar resposta do servidor. Por favor, tente novamente.');
                setLoading(false);
                return;
            }

            if (response.ok) {
                // Save user data and redirect
                localStorage.setItem('token', generateMockToken());
                localStorage.setItem('user', JSON.stringify(data.user || cleanedFormData));

                // Redirect to pending verification page
                router.push('/business/pending-verification');
                onSuccess();
            } else {
                setError(data.error || 'Erro ao registrar empresa.');
                console.error('Registration error:', data);
            }
        } catch (err) {
            setError('Erro de conexão. Tente novamente.');
            console.error('Registration error:', err);
        }

        setLoading(false);
    };

    // Helper function - will be replaced when auth API available
    const generateMockToken = () => {
        return 'mock-token-' + Date.now();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Section 1: Legal Entity Information */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                    📋 Informações Legais
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            CNPJ *
                        </label>
                        <input
                            type="text"
                            name="cnpj"
                            required
                            value={formData.cnpj}
                            onChange={handleChange}
                            placeholder="00.000.000/0000-00"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Razão Social *
                        </label>
                        <input
                            type="text"
                            name="legalName"
                            required
                            value={formData.legalName}
                            onChange={handleChange}
                            placeholder="Nome oficial da empresa"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Nome Fantasia *
                        </label>
                        <input
                            type="text"
                            name="businessName"
                            required
                            value={formData.businessName}
                            onChange={handleChange}
                            placeholder="Nome comercial da empresa"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Tipo de Negócio
                        </label>
                        <select
                            name="businessType"
                            value={formData.businessType}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Selecione...</option>
                            {businessTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Section 2: Contact Information */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                    📞 Informações de Contato
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Email Principal *
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="contato@empresa.com.br"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Email da Empresa
                        </label>
                        <input
                            type="email"
                            name="businessEmail"
                            value={formData.businessEmail}
                            onChange={handleChange}
                            placeholder="rh@empresa.com.br"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Código de convite (opcional)
                        </label>
                        <input
                            type="text"
                            name="invitationCode"
                            value={formData.invitationCode}
                            onChange={handleChange}
                            placeholder="LTF-XXXX-XXXX"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Telefone
                        </label>
                        <input
                            type="tel"
                            name="businessPhone"
                            value={formData.businessPhone}
                            onChange={handleChange}
                            placeholder="(11) 3000-0000"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Website
                        </label>
                        <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            placeholder="www.empresa.com.br"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Nome do Representante
                        </label>
                        <input
                            type="text"
                            name="representativeName"
                            value={formData.representativeName}
                            onChange={handleChange}
                            placeholder="Nome completo"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Cargo do Representante
                        </label>
                        <input
                            type="text"
                            name="representativeTitle"
                            value={formData.representativeTitle}
                            onChange={handleChange}
                            placeholder="Ex: Gerente de RH"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Section 3: Headquarters Address */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                    📍 Endereço da Sede
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            CEP *
                        </label>
                        <input
                            type="text"
                            name="headquartersZip"
                            required
                            value={formData.headquartersZip}
                            onChange={handleChange}
                            placeholder="00000-000"
                            disabled={cepLoading}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                        />
                        {cepLoading && <p className="text-xs text-slate-500 mt-1">Buscando CEP...</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Rua *
                        </label>
                        <input
                            type="text"
                            name="headquartersStreet"
                            required
                            value={formData.headquartersStreet}
                            onChange={handleChange}
                            placeholder="Nome da rua"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Número *
                        </label>
                        <input
                            type="text"
                            name="headquartersNumber"
                            required
                            value={formData.headquartersNumber}
                            onChange={handleChange}
                            placeholder="123"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Complemento
                        </label>
                        <input
                            type="text"
                            name="headquartersComplement"
                            value={formData.headquartersComplement}
                            onChange={handleChange}
                            placeholder="Apto, sala, etc"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Bairro
                        </label>
                        <input
                            type="text"
                            name="headquartersNeighborhood"
                            value={formData.headquartersNeighborhood}
                            onChange={handleChange}
                            placeholder="Bairro"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Cidade *
                        </label>
                        <input
                            type="text"
                            name="headquartersCity"
                            required
                            value={formData.headquartersCity}
                            onChange={handleChange}
                            placeholder="Cidade"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Estado *
                        </label>
                        <input
                            type="text"
                            name="headquartersState"
                            required
                            value={formData.headquartersState}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    headquartersState: e.target.value.slice(0, 2).toUpperCase(),
                                }))
                            }
                            placeholder="SP"
                            maxLength={2}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            País
                        </label>
                        <input
                            type="text"
                            name="headquartersCountry"
                            value={formData.headquartersCountry}
                            onChange={handleChange}
                            disabled
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm bg-slate-50 disabled:opacity-75"
                        />
                    </div>
                </div>
            </div>

            {/* Section 4: Business Details */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                    🏢 Informações da Empresa
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Tamanho da Empresa
                        </label>
                        <select
                            name="companySize"
                            value={formData.companySize}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Selecione...</option>
                            {companySizes.map((size) => (
                                <option key={size.value} value={size.value}>
                                    {size.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Setor/Indústria
                        </label>
                        <input
                            type="text"
                            name="industry"
                            value={formData.industry}
                            onChange={handleChange}
                            placeholder="Ex: Aviação Comercial"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Ano de Fundação
                        </label>
                        <input
                            type="number"
                            name="establishedYear"
                            value={formData.establishedYear}
                            onChange={handleChange}
                            placeholder="2020"
                            min="1920"
                            max={new Date().getFullYear()}
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Vagas Anuais Aproximadas
                        </label>
                        <input
                            type="number"
                            name="annualHiringVolume"
                            value={formData.annualHiringVolume}
                            onChange={handleChange}
                            placeholder="10"
                            min="0"
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Descrição da Empresa
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Descreva sua empresa, missão e valores..."
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Máximo de 500 caracteres
                    </p>
                </div>
            </div>

            {/* Section 5: Primary Operations */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                    ✈️ Operações Principais
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {operationOptions.map((option) => (
                        <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="primaryOperations"
                                value={option.value}
                                checked={formData.primaryOperations.includes(option.value)}
                                onChange={handleChange}
                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-slate-700">{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Section 6: Additional Information */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                    🔒 Segurança e Conformidade
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Senha *
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Confirmar Senha *
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                            >
                                {showConfirmPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 7: Consent & Preferences */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                    ✓ Termos e Preferências
                </h3>

                <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="terms"
                            checked={formData.terms}
                            onChange={handleChange}
                            className="w-5 h-5 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700">
                            Aceito os <a href="#" className="text-blue-600 hover:underline">termos de serviço</a> e <a href="#" className="text-blue-600 hover:underline">política de privacidade</a> *
                        </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="newsletter"
                            checked={formData.newsletter}
                            onChange={handleChange}
                            className="w-5 h-5 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700">
                            Desejo receber notícias, updates e ofertas da Love to Fly (opcional)
                        </span>
                    </label>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-bold transition-colors"
                >
                    Voltar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Registrando...' : 'Registrar Empresa'}
                </button>
            </div>

            {/* Footer Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                    <strong>ℹ️ Nota:</strong> Após o registro, sua empresa passará por um processo de verificação. Você receberá um e-mail com as próximas etapas.
                </p>
            </div>
        </form>
    );
}
