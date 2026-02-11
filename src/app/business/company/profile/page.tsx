'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CompanyProfilePage() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hasCompany, setHasCompany] = useState(false);
    const [companyId, setCompanyId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        legal_name: '',
        company_name: '',
        logo_url: '',
        website: '',
        headquarters_city: '',
        headquarters_country: 'Brasil',
        company_size: '',
        industry: '',
        description: '',
        culture_statement: '',
        annual_hiring_volume: '',
        faa_certificate_number: '',
        insurance_verified: false,
        safety_record_public: false
    });

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (user.user_type !== 'business' && user.role !== 'master' && user.role !== 'admin') {
            router.push('/');
            return;
        }

        fetchCompanyProfile();
    }, [user, router]);

    const fetchCompanyProfile = async () => {
        try {
            if (!token) {
                setError('Token de autenticação não encontrado');
                setLoading(false);
                return;
            }

            const response = await fetch('/api/career/companies', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Company profile fetch failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });

                if (response.status === 401) {
                    setError('Sessão expirada. Por favor, faça login novamente.');
                } else if (response.status === 403) {
                    setError('Acesso negado. Você precisa ser uma empresa verificada.');
                } else {
                    setError(errorData.message || 'Erro ao carregar perfil da empresa');
                }
                setLoading(false);
                return;
            }

            const data = await response.json();

            if (data.companies && data.companies.length > 0) {
                const company = data.companies[0];
                setHasCompany(true);
                setCompanyId(company.id);
                setFormData({
                    legal_name: company.legal_name || '',
                    company_name: company.company_name || '',
                    logo_url: company.logo_url || '',
                    website: company.website || '',
                    headquarters_city: company.headquarters_city || '',
                    headquarters_country: company.headquarters_country || 'Brasil',
                    company_size: company.company_size || '',
                    industry: company.industry || '',
                    description: company.description || '',
                    culture_statement: company.culture_statement || '',
                    annual_hiring_volume: company.annual_hiring_volume ? company.annual_hiring_volume.toString() : '',
                    faa_certificate_number: company.faa_certificate_number || '',
                    insurance_verified: company.insurance_verified || false,
                    safety_record_public: company.safety_record_public || false
                });
            }
        } catch (err) {
            console.error('Error fetching company profile:', err);
            setError('Erro ao carregar perfil da empresa. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const url = hasCompany
                ? `/api/career/companies/${companyId}`
                : '/api/career/companies';

            const method = hasCompany ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    annual_hiring_volume: formData.annual_hiring_volume ? parseInt(formData.annual_hiring_volume) : null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao salvar perfil da empresa');
            }

            setSuccess(hasCompany ? 'Perfil atualizado com sucesso!' : 'Perfil criado com sucesso!');

            if (!hasCompany) {
                setHasCompany(true);
                setCompanyId(data.company.id);
            }

            setTimeout(() => {
                router.push('/business/dashboard');
            }, 2000);

        } catch (err: any) {
            console.error('Error saving company profile:', err);
            setError(err.message || 'Erro ao salvar perfil da empresa');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/business/dashboard')}
                        className="text-blue-600 hover:text-blue-700 font-medium mb-4"
                    >
                        ← Voltar ao Painel
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {hasCompany ? 'Editar Perfil da Empresa' : 'Configurar Perfil da Empresa'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {hasCompany
                            ? 'Atualize as informações da sua empresa'
                            : 'Complete seu perfil para começar a publicar vagas'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <p className="text-green-800">{success}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Informações Básicas</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome Legal da Empresa *
                                </label>
                                <input
                                    type="text"
                                    name="legal_name"
                                    value={formData.legal_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: LATAM Airlines Group S.A."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome Comercial *
                                </label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: LATAM Airlines"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Website
                                    </label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        placeholder="https://www.example.com"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Logo URL
                                    </label>
                                    <input
                                        type="url"
                                        name="logo_url"
                                        value={formData.logo_url}
                                        onChange={handleChange}
                                        placeholder="https://example.com/logo.png"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Cidade da Sede
                                    </label>
                                    <input
                                        type="text"
                                        name="headquarters_city"
                                        value={formData.headquarters_city}
                                        onChange={handleChange}
                                        placeholder="Ex: São Paulo"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        País da Sede
                                    </label>
                                    <input
                                        type="text"
                                        name="headquarters_country"
                                        value={formData.headquarters_country}
                                        onChange={handleChange}
                                        placeholder="Ex: Brasil"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tamanho da Empresa
                                    </label>
                                    <select
                                        name="company_size"
                                        value={formData.company_size}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Selecione</option>
                                        <option value="1-10">1-10 funcionários</option>
                                        <option value="11-50">11-50 funcionários</option>
                                        <option value="51-200">51-200 funcionários</option>
                                        <option value="201-500">201-500 funcionários</option>
                                        <option value="501-1000">501-1000 funcionários</option>
                                        <option value="1001+">1001+ funcionários</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Setor
                                    </label>
                                    <select
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Airline">Companhia Aérea</option>
                                        <option value="Corporate Aviation">Aviação Executiva</option>
                                        <option value="Charter">Charter</option>
                                        <option value="Freight">Carga</option>
                                        <option value="Aircraft Maintenance">Manutenção</option>
                                        <option value="Flight Training">Treinamento de Voo</option>
                                        <option value="Manufacturing">Manufatura</option>
                                        <option value="Other">Outro</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Company Description */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Sobre a Empresa</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição da Empresa
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={5}
                                    placeholder="Descreva sua empresa, o que ela faz, sua história..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cultura e Valores
                                </label>
                                <textarea
                                    name="culture_statement"
                                    value={formData.culture_statement}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Descreva a cultura da empresa, valores, ambiente de trabalho..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Hiring Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Informações de Contratação</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Volume Anual de Contratações
                                </label>
                                <input
                                    type="number"
                                    name="annual_hiring_volume"
                                    value={formData.annual_hiring_volume}
                                    onChange={handleChange}
                                    placeholder="Ex: 50"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-sm text-gray-500 mt-1">Quantas pessoas você contrata por ano em média?</p>
                            </div>
                        </div>
                    </div>

                    {/* Compliance & Safety */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Conformidade e Segurança</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Número do Certificado FAA/ANAC
                                </label>
                                <input
                                    type="text"
                                    name="faa_certificate_number"
                                    value={formData.faa_certificate_number}
                                    onChange={handleChange}
                                    placeholder="Ex: ANAC-12345"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="insurance_verified"
                                    checked={formData.insurance_verified}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Seguro Verificado
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="safety_record_public"
                                    checked={formData.safety_record_public}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Registro de Segurança Público
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.push('/business/dashboard')}
                            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Salvando...' : hasCompany ? 'Salvar Alterações' : 'Criar Perfil'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
