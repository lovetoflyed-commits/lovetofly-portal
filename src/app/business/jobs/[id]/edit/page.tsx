'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function EditJobPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = params.id as string;
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (user.user_type !== 'business' && user.role !== 'master' && user.role !== 'admin') {
            router.push('/');
            return;
        }

        fetchJob();
    }, [user, router, jobId]);

    const fetchJob = async () => {
        try {
            const response = await fetch(`/api/career/jobs/${jobId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch job');
            }

            const data = await response.json();
            setFormData({
                ...data.job,
                relocation_amount_usd: data.job.relocation_amount_usd || '',
                minimum_flight_hours: data.job.minimum_flight_hours || '',
                minimum_pic_hours: data.job.minimum_pic_hours || '',
                training_duration_weeks: data.job.training_duration_weeks || '',
                training_cost_usd: data.job.training_cost_usd || '',
                salary_min_usd: data.job.salary_min_usd || '',
                salary_max_usd: data.job.salary_max_usd || '',
                signing_bonus_usd: data.job.signing_bonus_usd || '',
                trip_length_avg_days: data.job.trip_length_avg_days || '',
                reserve_percentage: data.job.reserve_percentage || '',
                closes_at: data.job.closes_at ? data.job.closes_at.split('T')[0] : ''
            });
        } catch (err) {
            console.error('Error fetching job:', err);
            setError('Erro ao carregar vaga');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev: any) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev: any) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const response = await fetch(`/api/career/jobs/${jobId}`, {
                method: 'PATCH',
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao atualizar vaga');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/business/jobs');
            }, 1500);

        } catch (err: any) {
            console.error('Error updating job:', err);
            setError(err.message || 'Erro ao atualizar vaga');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando vaga...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✓</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Vaga Atualizada!</h2>
                    <p className="text-gray-600">Redirecionando...</p>
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
                        onClick={() => router.push('/business/jobs')}
                        className="text-blue-600 hover:text-blue-700 font-medium mb-4"
                    >
                        ← Voltar às Vagas
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Editar Vaga</h1>
                    <p className="text-gray-600 mt-2">Atualize os detalhes da vaga de emprego</p>
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
                                    value={formData.title || ''}
                                    onChange={handleChange}
                                    required
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
                                        value={formData.category || 'Pilot'}
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
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status || 'open'}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="open">Aberta</option>
                                        <option value="closed">Fechada</option>
                                        <option value="filled">Preenchida</option>
                                        <option value="on-hold">Em Espera</option>
                                        <option value="archived">Arquivada</option>
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
                                    value={formData.base_location || ''}
                                    onChange={handleChange}
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
                                    value={formData.required_certifications || ''}
                                    onChange={handleChange}
                                    rows={3}
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
                                        value={formData.minimum_flight_hours || ''}
                                        onChange={handleChange}
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
                                        value={formData.minimum_pic_hours || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
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
                                        value={formData.salary_min_usd || ''}
                                        onChange={handleChange}
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
                                        value={formData.salary_max_usd || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Benefícios
                                </label>
                                <textarea
                                    name="benefits_description"
                                    value={formData.benefits_description || ''}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
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
                                    value={formData.contact_email || ''}
                                    onChange={handleChange}
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
                                    value={formData.closes_at || ''}
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
                            onClick={() => router.push('/business/jobs')}
                            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
