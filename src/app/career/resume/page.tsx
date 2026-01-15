'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

interface ResumeData {
  firstName: string;
  lastName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  licenseType: string;
  totalFlightHours: number;
  typeRatings: string;
  englishLevel: string;
  currentPosition: string;
  currentCompany: string;
  yearsOfExperience: string;
}

export default function ResumePreviewPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [resumeData, setResumeData] = useState<ResumeData>({
    firstName: '',
    lastName: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    licenseType: '',
    totalFlightHours: 0,
    typeRatings: '',
    englishLevel: '',
    currentPosition: '',
    currentCompany: '',
    yearsOfExperience: '',
  });

  // Load resume data on mount (from localStorage first, then from API)
  useEffect(() => {
    async function fetchResumeData() {
      // First try to load from localStorage
      const saved = localStorage.getItem('resumeData');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setResumeData(parsed);
          console.log('Loaded resume from localStorage');
          return;
        } catch (e) {
          console.error('Failed to parse saved resume:', e);
        }
      }

      if (!token) {
        console.log('No token, skipping API fetch');
        return;
      }

      try {
        const res = await fetch('/api/career/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.error('Failed to fetch resume data:', res.status);
          return;
        }

        const { userProfile, careerProfile } = await res.json();

        // Populate resume data from both user and career profiles
        if (userProfile || careerProfile) {
          const workExp = careerProfile?.work_experience ? JSON.parse(careerProfile.work_experience) : {};
          const licensesData = careerProfile?.pilot_licenses ? JSON.parse(careerProfile.pilot_licenses) : {};

          setResumeData({
            firstName: userProfile?.firstName || '',
            lastName: userProfile?.lastName || '',
            headline: careerProfile?.professional_summary || '',
            email: userProfile?.email || '',
            phone: userProfile?.mobilePhone || '',
            location: `${userProfile?.addressCity || ''}, ${userProfile?.addressState || ''}`.trim().replace(/^,\s*|\s*,$/g, ''),
            summary: careerProfile?.professional_summary || '',
            licenseType: licensesData.type || '',
            totalFlightHours: careerProfile?.total_flight_hours || 0,
            typeRatings: Array.isArray(licensesData.typeRatings) ? licensesData.typeRatings.join(', ') : (licensesData.typeRatings || ''),
            englishLevel: careerProfile?.medical_class || '',
            currentPosition: workExp.currentPosition || '',
            currentCompany: workExp.currentCompany || '',
            yearsOfExperience: workExp.industryYears || '',
          });
        }
      } catch (error) {
        console.error('Error fetching resume data:', error);
        setMessage('Erro ao carregar dados do currículo');
      } finally {
        setLoading(false);
      }
    }

    fetchResumeData();
  }, [token, router]);

  const handleFieldChange = (field: keyof ResumeData, value: any) => {
    setResumeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('=== SAVE START ===');
    
    setSaving(true);
    setMessage(null);

    try {
      // Save to localStorage only (simple local persistence)
      localStorage.setItem('resumeData', JSON.stringify(resumeData));
      console.log('Saved to localStorage successfully');

      setMessage('✓ Currículo atualizado com sucesso!');
      setIsEditMode(false);

      setTimeout(() => setMessage(null), 3000);
      
      console.log('=== SAVE COMPLETE ===');
      
    } catch (error) {
      console.error('=== SAVE ERROR ===', error);
      setMessage(`Erro: ${error instanceof Error ? error.message : 'Tente novamente'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!token) {
      setMessage('Erro: Token não encontrado');
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/career/profile/delete', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar currículo');
      }

      setMessage('✓ Currículo deletado com sucesso!');
      setTimeout(() => {
        router.push('/career');
      }, 1500);
    } catch (error) {
      console.error('Erro ao deletar currículo:', error);
      setMessage('Erro ao deletar currículo. Tente novamente.');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block mb-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600 font-semibold">Carregando seu currículo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white flex">
      <Sidebar onFeatureClick={() => {}} disabled={false} />
      
      <div className="flex-1 w-full">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900">
              {isEditMode ? '✏️ Editar Currículo' : '📋 Visualizar Currículo'}
            </h1>
            <div className="flex gap-3">
            {!isEditMode ? (
              <>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                >
                  🖨️ Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => alert('Funcionalidade de PDF em desenvolvimento')}
                  className="px-4 py-2 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-800 transition"
                >
                  📥 Baixar PDF
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
                >
                  🗑️ Deletar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => handleSaveChanges(e)}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Salvando...
                    </>
                  ) : (
                    '✓ Salvar Alterações'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition"
                >
                  ✕ Cancelar
                </button>
              </>
            )}
          </div>
        </div>

        {message && (
          <div className={`px-4 py-3 border-t ${
            message.includes('✓') || message.includes('sucesso')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          } font-semibold`}>
            {message}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm">
            <h2 className="text-2xl font-black text-red-600 mb-4">⚠️ Deletar Currículo?</h2>
            <p className="text-slate-700 mb-6 leading-relaxed">
              Tem certeza que deseja deletar seu currículo? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteResume}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Deletando...' : 'Sim, Deletar'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Container */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-8 py-10 print:bg-none print:border-b print:border-slate-300">
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1 space-y-4">
                {isEditMode ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={resumeData.firstName}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        placeholder="Primeiro Nome"
                        className="px-3 py-2 bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-lg text-lg font-bold"
                      />
                      <input
                        type="text"
                        value={resumeData.lastName}
                        onChange={(e) => handleFieldChange('lastName', e.target.value)}
                        placeholder="Sobrenome"
                        className="px-3 py-2 bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-lg text-lg font-bold"
                      />
                    </div>
                    <textarea
                      value={resumeData.headline}
                      onChange={(e) => handleFieldChange('headline', e.target.value)}
                      placeholder="Sua profissão e especialidade"
                      className="w-full px-3 py-2 bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-lg text-lg font-bold"
                      rows={2}
                    />
                  </>
                ) : (
                  <>
                    <h1 className="text-4xl font-black mb-2">
                      {resumeData.firstName} {resumeData.lastName}
                    </h1>
                    <p className="text-xl font-bold text-blue-100">{resumeData.headline}</p>
                  </>
                )}
                <div className={isEditMode ? 'grid grid-cols-1 md:grid-cols-3 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'}>
                  {isEditMode ? (
                    <>
                      <input
                        type="email"
                        value={resumeData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        placeholder="Email"
                        className="px-3 py-2 bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-lg text-sm"
                      />
                      <input
                        type="tel"
                        value={resumeData.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        placeholder="Telefone"
                        className="px-3 py-2 bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        value={resumeData.location}
                        onChange={(e) => handleFieldChange('location', e.target.value)}
                        placeholder="Localização"
                        className="px-3 py-2 bg-white/20 text-white placeholder-white/60 border border-white/30 rounded-lg text-sm"
                      />
                    </>
                  ) : (
                    <>
                      <div>📧 {resumeData.email}</div>
                      <div>📱 {resumeData.phone}</div>
                      <div>📍 {resumeData.location}</div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 print:hidden">
                <div className="w-32 h-32 rounded-lg bg-white/30 flex items-center justify-center text-6xl font-bold">
                  👤
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-8">
            {/* Professional Summary */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-slate-900 pb-3 border-b-2 border-blue-600 flex-1">
                  📝 Resumo Profissional
                </h2>
                {isEditMode && (
                  <button
                    onClick={() => handleFieldChange('summary', '')}
                    className="ml-4 text-red-600 hover:text-red-700 font-bold"
                  >
                    ✕ Remover
                  </button>
                )}
              </div>
              {isEditMode ? (
                <textarea
                  value={resumeData.summary}
                  onChange={(e) => handleFieldChange('summary', e.target.value)}
                  placeholder="Descreva seu resumo profissional..."
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none text-slate-700"
                  rows={4}
                />
              ) : (
                resumeData.summary && (
                  <p className="text-slate-700 leading-relaxed">{resumeData.summary}</p>
                )
              )}
            </section>

            {/* Aviation Qualifications */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-slate-900 pb-3 border-b-2 border-blue-600 flex-1">
                  ✈️ Qualificações de Aviação
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className={isEditMode ? 'bg-blue-50 rounded-lg p-4 border-2 border-blue-300' : 'bg-blue-50 rounded-lg p-4 border border-blue-200'}>
                  <p className="text-xs text-slate-600 font-bold uppercase">Licença</p>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={resumeData.licenseType}
                      onChange={(e) => handleFieldChange('licenseType', e.target.value)}
                      placeholder="Ex: ATPL, CPL"
                      className="w-full px-2 py-1 mt-1 border border-slate-300 rounded text-sm"
                    />
                  ) : (
                    <p className="text-lg font-bold text-slate-900">{resumeData.licenseType}</p>
                  )}
                </div>
                <div className={isEditMode ? 'bg-blue-50 rounded-lg p-4 border-2 border-blue-300' : 'bg-blue-50 rounded-lg p-4 border border-blue-200'}>
                  <p className="text-xs text-slate-600 font-bold uppercase">Horas de Voo</p>
                  {isEditMode ? (
                    <input
                      type="number"
                      value={resumeData.totalFlightHours}
                      onChange={(e) => handleFieldChange('totalFlightHours', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-2 py-1 mt-1 border border-slate-300 rounded text-sm"
                    />
                  ) : (
                    <p className="text-lg font-bold text-slate-900">{resumeData.totalFlightHours.toLocaleString()}</p>
                  )}
                </div>
                <div className={isEditMode ? 'bg-blue-50 rounded-lg p-4 border-2 border-blue-300' : 'bg-blue-50 rounded-lg p-4 border border-blue-200'}>
                  <p className="text-xs text-slate-600 font-bold uppercase">CMA</p>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={resumeData.englishLevel}
                      onChange={(e) => handleFieldChange('englishLevel', e.target.value)}
                      placeholder="Ex: Fluente"
                      className="w-full px-2 py-1 mt-1 border border-slate-300 rounded text-sm"
                    />
                  ) : (
                    <p className="text-lg font-bold text-slate-900">{resumeData.englishLevel}</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-slate-600 font-bold uppercase mb-2">Type Ratings</p>
                {isEditMode ? (
                  <input
                    type="text"
                    value={resumeData.typeRatings}
                    onChange={(e) => handleFieldChange('typeRatings', e.target.value)}
                    placeholder="Ex: B737, A320, A330"
                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                  />
                ) : (
                  <p className="text-slate-900 font-semibold">{resumeData.typeRatings}</p>
                )}
              </div>
            </section>

            {/* Current Position */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-slate-900 pb-3 border-b-2 border-blue-600 flex-1">
                  💼 Experiência Profissional
                </h2>
              </div>
              <div className="bg-slate-50 border-l-4 border-blue-600 p-6 rounded-lg">
                {isEditMode ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={resumeData.currentPosition}
                      onChange={(e) => handleFieldChange('currentPosition', e.target.value)}
                      placeholder="Cargo/Posição"
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none font-bold text-lg"
                    />
                    <input
                      type="text"
                      value={resumeData.currentCompany}
                      onChange={(e) => handleFieldChange('currentCompany', e.target.value)}
                      placeholder="Empresa/Companhia Aérea"
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none font-semibold"
                    />
                    <input
                      type="text"
                      value={resumeData.yearsOfExperience}
                      onChange={(e) => handleFieldChange('yearsOfExperience', e.target.value)}
                      placeholder="Ex: 5 anos, 10+ anos"
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none text-sm"
                    />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{resumeData.currentPosition}</h3>
                      <p className="text-slate-600 font-semibold">{resumeData.currentCompany}</p>
                    </div>
                    <span className="text-sm bg-blue-200 text-blue-900 font-bold px-3 py-1 rounded-full">
                      Atual
                    </span>
                  </div>
                )}
                {resumeData.yearsOfExperience && (
                  <p className="text-sm text-slate-600 mt-2">
                    Experiência: {resumeData.yearsOfExperience}
                  </p>
                )}
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-500 print:text-slate-400">
              <p>Currículo gerado em {new Date().toLocaleDateString('pt-BR')} | Love to Fly Portal</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
