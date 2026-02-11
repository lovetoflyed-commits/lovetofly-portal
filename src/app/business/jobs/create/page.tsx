'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CreateJobPage() {
    const router = useRouter();
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        category: 'Pilot',
        seniority_level: '',
        base_location: '',
        operating_countries: '',
        relocation_assistance: false,
        relocation_amount_usd: '',
        required_certifications: '',
        minimum_flight_hours: '',
        minimum_pic_hours: '',
        minimum_experience_description: '',
        medical_class_required: '',
        visa_sponsorship_available: false,
        type_ratings_required: '',
        languages_required: '',
        type_rating_training_provided: false,
        training_duration_weeks: '',
        training_cost_usd: '',
        aircraft_types: '',
        operation_type: '',
        domestic_international: '',
        etops_required: false,
        rvsm_required: false,
        salary_min_usd: '',
        salary_max_usd: '',
        benefits_description: '',
        signing_bonus_usd: '',
        seniority_pay_scale: '',
        trip_length_avg_days: '',
        reserve_percentage: '',
        schedule_type: '',
        culture_description: '',
        application_method: 'email',
        expected_review_timeline: '',
        contact_email: '',
        contact_recruiter_name: '',
        closes_at: ''
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
    }, [user, router]);

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
        setLoading(true);
        setError('');

        try {
            if (!token) {
                setError('Token de autenticação não encontrado. Por favor, faça login novamente.');
                setLoading(false);
                return;
            }

            const response = await fetch('/api/career/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    relocation_amount_usd: formData.relocation_amount_usd ? parseInt(formData.relocation_amount_usd) : null,
                    minimum_flight_hours: formData.minimum_flight_hours ? parseInt(formData.minimum_flight_hours) : null,
                    minimum_pic_hours: formData.minimum_pic_hours ? parseInt(formData.minimum_pic_hours) : null,
                    training_duration_weeks: formData.training_duration_weeks ? parseInt(formData.training_duration_weeks) : null,
                    training_cost_usd: formData.training_cost_usd ? parseInt(formData.training_cost_usd) : null,
                    salary_min_usd: formData.salary_min_usd ? parseInt(formData.salary_min_usd) : null,
                    salary_max_usd: formData.salary_max_usd ? parseInt(formData.salary_max_usd) : null,
                    signing_bonus_usd: formData.signing_bonus_usd ? parseInt(formData.signing_bonus_usd) : null,
                    trip_length_avg_days: formData.trip_length_avg_days ? parseInt(formData.trip_length_avg_days) : null,
                    reserve_percentage: formData.reserve_percentage ? parseInt(formData.reserve_percentage) : null
                })
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    console.error('Failed to parse error response:', parseError);
                    errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
                }

                console.error('Job creation failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                });

                if (response.status === 401) {
                    setError('Sessão expirada. Por favor, faça login novamente.');
                } else if (response.status === 403) {
                    setError('Acesso negado. Você precisa ser uma empresa verificada.');
                } else if (response.status === 404) {
                    setError(errorData.message || 'Configure seu perfil empresarial primeiro antes de criar vagas.');
                } else {
                    setError(errorData.message || 'Erro ao publicar vaga');
                }
                setLoading(false);
                return;
            }

            const data = await response.json();

            setSuccess(true);
            setTimeout(() => {
                router.push('/business/jobs');
            }, 2000);

        } catch (err: any) {
            console.error('Error creating job:', err);
            setError(err.message || 'Erro ao publicar vaga. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✓</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Vaga Publicada!</h2>
                    <p className="text-gray-600">Redirecionando para gerenciamento de vagas...</p>
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
                        onClick={() => router.back()}
                        className="text-blue-600 hover:text-blue-700 font-medium mb-4"
                    >
                        ← Voltar
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Publicar Nova Vaga</h1>
                    <p className="text-gray-600 mt-2">Preencha os detalhes da vaga de emprego</p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Informações Básicas</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Título da Vaga *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ex: Capitão Boeing 737"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Categoria *
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="Pilot">Piloto</option>
                                        <option value="Maintenance">Manutenção</option>
                                        <option value="Dispatcher">Despachante</option>
                                        <option value="FlightAttendant">Comissário de Voo</option>
                                        <option value="Management">Gestão</option>
                                        <option value="Training">Treinamento</option>
                                        <option value="Other">Outro</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nível de Senioridade
                                    </label>
                                    <select
                                        name="seniority_level"
                                        value={formData.seniority_level}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Entry">Júnior</option>
                                        <option value="Mid">Pleno</option>
                                        <option value="Senior">Sênior</option>
                                        <option value="Lead">Líder</option>
                                        <option value="Management">Gestão</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Localização Base
                                </label>
                                <input
                                    type="text"
                                    name="base_location"
                                    value={formData.base_location}
                                    onChange={handleChange}
                                    placeholder="Ex: São Paulo (GRU)"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Países de Operação
                                </label>
                                <input
                                    type="text"
                                    name="operating_countries"
                                    value={formData.operating_countries}
                                    onChange={handleChange}
                                    placeholder="Ex: Brasil, Argentina, Chile"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Requirements */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Requisitos</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Certificações Requeridas
                                </label>
                                <textarea
                                    name="required_certifications"
                                    value={formData.required_certifications}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Ex: ATPL, Multi-motor, Instrumento"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Horas de Voo Mínimas
                                    </label>
                                    <input
                                        type="number"
                                        name="minimum_flight_hours"
                                        value={formData.minimum_flight_hours}
                                        onChange={handleChange}
                                        placeholder="Ex: 2000"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Horas PIC Mínimas
                                    </label>
                                    <input
                                        type="number"
                                        name="minimum_pic_hours"
                                        value={formData.minimum_pic_hours}
                                        onChange={handleChange}
                                        placeholder="Ex: 1000"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Classe Médica Requerida
                                </label>
                                <select
                                    name="medical_class_required"
                                    value={formData.medical_class_required}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Selecione</option>
                                    <option value="First-class">Primeira Classe</option>
                                    <option value="Second-class">Segunda Classe</option>
                                    <option value="Third-class">Terceira Classe</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type Ratings Requeridos
                                </label>
                                <input
                                    type="text"
                                    name="type_ratings_required"
                                    value={formData.type_ratings_required}
                                    onChange={handleChange}
                                    placeholder="Ex: B737, A320"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Idiomas Requeridos
                                </label>
                                <input
                                    type="text"
                                    name="languages_required"
                                    value={formData.languages_required}
                                    onChange={handleChange}
                                    placeholder="Ex: Português, Inglês (fluente)"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Compensation */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Remuneração</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Salário Mínimo (USD)
                                    </label>
                                    <input
                                        type="number"
                                        name="salary_min_usd"
                                        value={formData.salary_min_usd}
                                        onChange={handleChange}
                                        placeholder="Ex: 8000"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Salário Máximo (USD)
                                    </label>
                                    <input
                                        type="number"
                                        name="salary_max_usd"
                                        value={formData.salary_max_usd}
                                        onChange={handleChange}
                                        placeholder="Ex: 12000"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bônus de Contratação (USD)
                                </label>
                                <input
                                    type="number"
                                    name="signing_bonus_usd"
                                    value={formData.signing_bonus_usd}
                                    onChange={handleChange}
                                    placeholder="Ex: 5000"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Benefícios
                                </label>
                                <textarea
                                    name="benefits_description"
                                    value={formData.benefits_description}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Ex: Plano de saúde, seguro de vida, vale-refeição..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Options */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Opções Adicionais</h2>

                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="relocation_assistance"
                                    checked={formData.relocation_assistance}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Auxílio Relocação Disponível
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="visa_sponsorship_available"
                                    checked={formData.visa_sponsorship_available}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Patrocínio de Visto Disponível
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="type_rating_training_provided"
                                    checked={formData.type_rating_training_provided}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Treinamento de Type Rating Fornecido
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Informações de Contato</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email de Contato
                                </label>
                                <input
                                    type="email"
                                    name="contact_email"
                                    value={formData.contact_email}
                                    onChange={handleChange}
                                    placeholder="recrutamento@empresa.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome do Recrutador
                                </label>
                                <input
                                    type="text"
                                    name="contact_recruiter_name"
                                    value={formData.contact_recruiter_name}
                                    onChange={handleChange}
                                    placeholder="Ex: Maria Silva"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Data de Encerramento
                                </label>
                                <input
                                    type="date"
                                    name="closes_at"
                                    value={formData.closes_at}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Publicando...' : 'Publicar Vaga'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
