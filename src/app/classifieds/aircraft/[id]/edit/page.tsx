'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PhotoUploadComponent from '@/components/PhotoUploadComponent';

interface Aircraft {
  id: number;
  title: string;
  manufacturer: string;
  model: string;
  year: number;
  registration?: string;
  serial_number?: string;
  category: string;
  total_time?: number;
  engine_time?: number;
  price: number;
  location_city: string;
  location_state: string;
  description?: string;
  avionics?: string;
  interior_condition?: string;
  exterior_condition?: string;
  logs_status?: string;
  damage_history: boolean;
  financing_available: boolean;
  partnership_available: boolean;
  status: string;
}

export default function EditAircraft() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<Partial<Aircraft>>({});

  useEffect(() => {
    fetchAircraft();
  }, [params.id]);

  const fetchAircraft = async () => {
    try {
      const response = await fetch(`/api/classifieds/aircraft/${params.id}`);
      const result = await response.json();

      if (response.ok) {
        setAircraft(result.data);
        setFormData(result.data);
      } else {
        setError('Anúncio não encontrado');
        router.push('/classifieds/aircraft');
      }
    } catch (err) {
      console.error('Erro ao carregar anúncio:', err);
      setError('Erro ao carregar anúncio');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as any;
    const fieldValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData({
      ...formData,
      [name]: fieldValue,
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/classifieds/aircraft/${params.id}/edit`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setSuccess('Anúncio atualizado com sucesso!');
        setAircraft(result.data);
        setTimeout(() => {
          router.push(`/classifieds/aircraft/${params.id}`);
        }, 2000);
      } else {
        setError(result.message || 'Erro ao atualizar anúncio');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <p className="text-gray-600">Carregando...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Editar Anúncio de Aeronave
              </h1>
              <p className="text-gray-600 mt-2">
                Atualize as informações do seu anúncio
              </p>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {success}
              </div>
            )}

            {/* Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Título */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título do Anúncio *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Manufacturer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fabricante *
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo *
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ano *
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Registration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    name="registration"
                    value={formData.registration || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Serial Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Série
                  </label>
                  <input
                    type="text"
                    name="serial_number"
                    value={formData.serial_number || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    name="category"
                    value={formData.category || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    <option value="single_engine">Monomotor</option>
                    <option value="twin_engine">Bimotor</option>
                    <option value="turbine">Turbina</option>
                    <option value="helicopter">Helicóptero</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Total Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo Total (horas)
                  </label>
                  <input
                    type="number"
                    name="total_time"
                    value={formData.total_time || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Engine Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo de Motor (horas)
                  </label>
                  <input
                    type="number"
                    name="engine_time"
                    value={formData.engine_time || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    name="location_city"
                    value={formData.location_city || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <input
                    type="text"
                    name="location_state"
                    value={formData.location_state || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Avionics */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aviônica
                  </label>
                  <textarea
                    name="avionics"
                    value={formData.avionics || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Interior Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condição Interior
                  </label>
                  <select
                    name="interior_condition"
                    value={formData.interior_condition || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    <option value="excellent">Excelente</option>
                    <option value="good">Bom</option>
                    <option value="fair">Razoável</option>
                    <option value="poor">Ruim</option>
                  </select>
                </div>

                {/* Exterior Condition */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condição Exterior
                  </label>
                  <select
                    name="exterior_condition"
                    value={formData.exterior_condition || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    <option value="excellent">Excelente</option>
                    <option value="good">Bom</option>
                    <option value="fair">Razoável</option>
                    <option value="poor">Ruim</option>
                  </select>
                </div>

                {/* Checkboxes */}
                <div className="md:col-span-2 space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="damage_history"
                      checked={formData.damage_history || false}
                      onChange={handleInputChange}
                      className="w-4 h-4 border border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Histórico de danos
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="financing_available"
                      checked={formData.financing_available || false}
                      onChange={handleInputChange}
                      className="w-4 h-4 border border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Financiamento disponível
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="partnership_available"
                      checked={formData.partnership_available || false}
                      onChange={handleInputChange}
                      className="w-4 h-4 border border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Parceria disponível
                    </span>
                  </label>
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="active">Ativo</option>
                    <option value="sold">Vendido</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8 flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    saving
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3 rounded-lg font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>

            {/* Photo Upload */}
            <PhotoUploadComponent
              listingId={parseInt(params.id as string)}
              listingType="aircraft"
              onUploadSuccess={() => {
                setSuccess('Fotos enviadas com sucesso!');
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
