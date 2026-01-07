'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function CreateAvionicsListing() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    manufacturer: '',
    model: '',
    category: 'gps',
    condition: 'excellent',
    software_version: '',
    tso_certified: false,
    panel_mount: true,
    price: '',
    location_city: '',
    location_state: 'SP',
    description: '',
    compatible_aircraft: '',
    includes_installation: false,
    warranty_remaining: '',
    status: 'draft'
  });

  const categories = [
    { value: 'gps', label: 'GPS' },
    { value: 'radio', label: 'Rádio' },
    { value: 'transponder', label: 'Transponder' },
    { value: 'autopilot', label: 'Piloto Automático' },
    { value: 'adsb', label: 'ADS-B' },
    { value: 'portable', label: 'Portátil' }
  ];

  const conditions = [
    { value: 'new', label: 'Novo' },
    { value: 'excellent', label: 'Excelente' },
    { value: 'good', label: 'Bom' },
    { value: 'fair', label: 'Razoável' },
    { value: 'parts', label: 'Para Peças' }
  ];

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const nextStep = () => {
    if (step === 1) {
      if (!formData.title || !formData.manufacturer || !formData.category) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
      }
    } else if (step === 2) {
      if (!formData.price || !formData.location_city) {
        alert('Por favor, preencha preço e cidade');
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(Math.max(1, step - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description) {
      alert('Por favor, preencha a descrição');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/classifieds/avionics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          user_id: user?.id
        })
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/classifieds/avionics/${result.data.id}?success=true`);
      } else {
        alert(result.message || 'Erro ao criar anúncio');
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      alert('Erro ao criar anúncio');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Anunciar Equipamento Aviônico</h1>

              {/* Progress */}
              <div className="mb-8 flex gap-4 justify-center">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      s <= step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {s}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8">
                {/* Step 1 */}
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Informações Básicas</h2>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título do Anúncio *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Garmin GNS 430W WAAS"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fabricante *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Garmin"
                          value={formData.manufacturer}
                          onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Modelo
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: GNS 430W"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categoria *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Condição
                        </label>
                        <select
                          value={formData.condition}
                          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {conditions.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Preço e Localização</h2>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preço (R$) *
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cidade *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: São Paulo"
                          value={formData.location_city}
                          onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado
                        </label>
                        <select
                          value={formData.location_state}
                          onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {brazilianStates.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Versão de Software
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 5.0.1"
                        value={formData.software_version}
                        onChange={(e) => setFormData({ ...formData, software_version: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.tso_certified}
                          onChange={(e) => setFormData({ ...formData, tso_certified: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">TSO Certificado</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.panel_mount}
                          onChange={(e) => setFormData({ ...formData, panel_mount: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">Montagem em Painel (Não marcado = Portátil)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Descrição e Detalhes</h2>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição Completa *
                      </label>
                      <textarea
                        rows={6}
                        placeholder="Descreva o equipamento, histórico, especificações, etc..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aeronaves Compatíveis
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Cessna 172, Piper PA-28, etc"
                        value={formData.compatible_aircraft}
                        onChange={(e) => setFormData({ ...formData, compatible_aircraft: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Garantia Remanescente
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 12 meses, até 2026, sem garantia"
                        value={formData.warranty_remaining}
                        onChange={(e) => setFormData({ ...formData, warranty_remaining: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.includes_installation}
                          onChange={(e) => setFormData({ ...formData, includes_installation: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">Instalação incluída</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status do Anúncio
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="draft">Rascunho (não publicado)</option>
                        <option value="active">Ativo (publicar imediatamente)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={step === 1}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Voltar
                  </button>

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Próximo
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? 'Criando...' : 'Criar Anúncio'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
