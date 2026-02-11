'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

interface FormData {
  // Profile Photo
  profilePhoto: string | null;
  photoSource: 'portal' | 'upload'; // portal = use existing, upload = new photo
  
  // Personal Information
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  location: string;
  phone: string;
  email: string;
  
  // Aviation Specific
  licenseType: string;
  licenseLevel: string;
  totalFlightHours: string;
  typeRatings: string;
  medicalCertificate: string;
  englishLevel: string;
  
  // Professional Background
  currentPosition: string;
  currentCompany: string;
  startDate: string;
  employmentType: string;
  industry: string;
  
  // Experience
  yearsOfExperience: string;
  previousJobs: PreviousJob[];
  
  // Education
  highestEducation: string;
  specializations: string;
  
  // Skills
  coreSkills: string;
  softSkills: string;
  
  // Languages
  languages: string;
  
  // Additional
  willTravelPercentage: string;
  desiredSalary: string;
  jobType: string;
}

interface PreviousJob {
  id: string;
  companyName: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  referenceContact: string;
  referencePhone: string;
  referenceEmail: string;
  useAsReference: boolean;
}

export default function CareerProfilePage() {
  const router = useRouter();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    profilePhoto: null,
    photoSource: 'portal',
    firstName: '',
    lastName: '',
    headline: '',
    summary: '',
    location: '',
    phone: '',
    email: '',
    licenseType: '',
    licenseLevel: '',
    totalFlightHours: '',
    typeRatings: '',
    medicalCertificate: '',
    englishLevel: '',
    currentPosition: '',
    currentCompany: '',
    startDate: '',
    employmentType: '',
    industry: '',
    yearsOfExperience: '',
    previousJobs: [],
    highestEducation: '',
    specializations: '',
    coreSkills: '',
    softSkills: '',
    languages: '',
    willTravelPercentage: '',
    desiredSalary: '',
    jobType: '',
  });

  // Fetch user and career profile data on component mount
  useEffect(() => {
    async function fetchProfileData() {
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        const res = await fetch('/api/career/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const { userProfile, careerProfile } = await res.json();

        // Auto-fill form with user profile data
        setFormData(prev => ({
          ...prev,
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          email: userProfile.email || '',
          phone: userProfile.mobilePhone || '',
          location: `${userProfile.addressCity || ''}, ${userProfile.addressState || ''}`.trim().replace(/^,\s*|\s*,$/g, ''),
        }));

        // If career profile exists, populate it
        if (careerProfile) {
          const workExp = careerProfile.work_experience ? JSON.parse(careerProfile.work_experience) : {};
          const edu = careerProfile.education ? JSON.parse(careerProfile.education) : {};
          const skillsData = careerProfile.skills ? JSON.parse(careerProfile.skills) : {};
          const langData = careerProfile.languages ? JSON.parse(careerProfile.languages) : [];
          const licensesData = careerProfile.pilot_licenses ? JSON.parse(careerProfile.pilot_licenses) : {};

          setFormData(prev => ({
            ...prev,
            headline: careerProfile.professional_summary || '',
            summary: careerProfile.professional_summary || '',
            licenseType: licensesData.type || '',
            licenseLevel: licensesData.level || '',
            totalFlightHours: careerProfile.total_flight_hours?.toString() || '',
            typeRatings: Array.isArray(licensesData.typeRatings) ? licensesData.typeRatings.join(', ') : '',
            medicalCertificate: careerProfile.medical_class || '',
            currentPosition: workExp.currentPosition || '',
            currentCompany: workExp.currentCompany || '',
            startDate: workExp.startDate || '',
            employmentType: workExp.employmentType || '',
            industry: workExp.industry || '',
            highestEducation: edu.level || '',
            specializations: Array.isArray(edu.specializations) ? edu.specializations.join(', ') : '',
            coreSkills: Array.isArray(skillsData.coreSkills) ? skillsData.coreSkills.join(', ') : '',
            softSkills: Array.isArray(skillsData.softSkills) ? skillsData.softSkills.join(', ') : '',
            languages: Array.isArray(langData) ? langData.join(', ') : '',
            profilePhoto: careerProfile.resume_photo || null,
            photoSource: careerProfile.photo_source || 'portal',
          }));
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setMessage('Erro ao carregar dados do perfil');
        setLoading(false);
      }
    }

    fetchProfileData();
  }, [token, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          profilePhoto: reader.result as string,
          photoSource: 'upload'
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSourceChange = (source: 'portal' | 'upload') => {
    setFormData(prev => ({
      ...prev,
      photoSource: source,
      profilePhoto: source === 'portal' ? null : prev.profilePhoto
    }));
  };

  const handlePreviousJobChange = (id: string, field: keyof PreviousJob, value: any) => {
    setFormData(prev => ({
      ...prev,
      previousJobs: prev.previousJobs.map(job =>
        job.id === id ? { ...job, [field]: value } : job
      )
    }));
  };

  const addPreviousJob = () => {
    const newJob: PreviousJob = {
      id: Date.now().toString(),
      companyName: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      referenceContact: '',
      referencePhone: '',
      referenceEmail: '',
      useAsReference: false,
    };
    setFormData(prev => ({
      ...prev,
      previousJobs: [...prev.previousJobs, newJob]
    }));
  };

  const removePreviousJob = (id: string) => {
    setFormData(prev => ({
      ...prev,
      previousJobs: prev.previousJobs.filter(job => job.id !== id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setMessage('Erro: Token não encontrado');
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/career/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar perfil de carreira');
      }

      const result = await response.json();
      setMessage('✓ Perfil salvo com sucesso!');

      // After successful save, offer to view the resume
      setTimeout(() => {
        const viewResume = confirm('Seu perfil foi salvo! Deseja visualizar seu currículo agora?');
        if (viewResume) {
          window.open('/career/resume', '_blank');
        }
      }, 500);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      setMessage('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', label: '👤 Informações Pessoais' },
    { id: 'aviation', label: '✈️ Qualificações de Aviação' },
    { id: 'experience', label: '💼 Experiência' },
    { id: 'education', label: '🎓 Educação' },
    { id: 'skills', label: '🎯 Competências' },
    { id: 'preferences', label: '⚙️ Preferências' },
  ];

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block mb-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-600 font-semibold">Carregando seu perfil...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/career" className="inline-block mb-6 px-4 py-2 text-blue-700 hover:bg-blue-50 rounded-lg font-bold transition">
            ← Voltar
          </Link>

          {message && (
            <div className={`mb-6 px-4 py-3 rounded-lg font-semibold ${
              message.includes('✓') || message.includes('sucesso')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-10">
              <h1 className="text-4xl font-black text-white mb-2">Construa seu Perfil de Carreira</h1>
              <p className="text-blue-100 text-lg">Complete seu perfil para atrair as melhores oportunidades da aviação</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
              <div className="px-8 flex flex-wrap gap-1 overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 font-bold text-sm transition border-b-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-blue-600 bg-white'
                        : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-8">
              {/* Personal Information */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Informações Pessoais</h2>
                  
                  {/* Profile Photo Section - Simplified */}
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      📸 Foto do Perfil de Carreira
                    </h3>
                    
                    <div className="flex items-center gap-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <div className="flex-1">
                        <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold cursor-pointer transition">
                          📤 Carregar Foto
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </label>
                        {formData.profilePhoto && (
                          <p className="text-xs text-green-600 font-semibold mt-2">✓ Foto carregada</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="usePortalPhoto"
                          checked={formData.photoSource === 'portal'}
                          onChange={(e) => handlePhotoSourceChange(e.target.checked ? 'portal' : 'upload')}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                        <label htmlFor="usePortalPhoto" className="text-sm font-semibold text-slate-700 cursor-pointer">
                          Usar foto do portal
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Nome *</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Seu nome" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Sobrenome *</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Seu sobrenome" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Headline Profissional *</label>
                    <input type="text" name="headline" value={formData.headline} onChange={handleChange} placeholder="Ex: Piloto Comercial | 5.000 horas | Experiência em A320" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    <p className="text-xs text-slate-500 mt-1">120 caracteres máximo - será exibido em sua busca</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Resumo Profissional</label>
                    <textarea name="summary" value={formData.summary} onChange={handleChange} placeholder="Descreva seus pontos fortes, conquistas e objetivos profissionais..." rows={5} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    <p className="text-xs text-slate-500 mt-1">Máximo 2000 caracteres - seja conciso e destacue suas competências principais</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Telefone *</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="(XX) XXXXX-XXXX" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Localização *</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Cidade, Estado" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" title="Localizacao" />
                  </div>
                </div>
              )}

              {/* Aviation Qualifications */}
              {activeTab === 'aviation' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Qualificações de Aviação</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Licença *</label>
                      <select name="licenseType" value={formData.licenseType} onChange={handleChange} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" title="Tipo de licenca">
                        <option value="">Selecione...</option>
                        <option value="PPL">PPL (Piloto Privado)</option>
                        <option value="CPL">CPL (Piloto Comercial)</option>
                        <option value="ATPL">ATPL (Piloto de Linha Aérea)</option>
                        <option value="Instructor">Instrutor de Voo</option>
                        <option value="Examiner">Examinador de Voo</option>
                        <option value="Engineer">Engenheiro de Aviação</option>
                        <option value="Mechanic">Mecânico de Aviação</option>
                        <option value="Dispatcher">Despachante Aéreo</option>
                        <option value="ATC">Controlador de Tráfego Aéreo</option>
                        <option value="Flight_Attendant">Comissário de Bordo</option>
                        <option value="Other">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Nível de Qualificação</label>
                      <select name="licenseLevel" value={formData.licenseLevel} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" title="Nível de qualificação">
                        <option value="">Selecione...</option>
                        <option value="Student">Estudante</option>
                        <option value="Licensed">Licenciado</option>
                        <option value="Experienced">Experiente</option>
                        <option value="Expert">Especialista</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Total de Horas de Voo</label>
                      <input type="number" name="totalFlightHours" value={formData.totalFlightHours} onChange={handleChange} placeholder="Ex: 5000" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" title="Total de horas de voo" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Medical Certificate</label>
                      <select name="medicalCertificate" value={formData.medicalCertificate} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" title="Certificado médico">
                        <option value="">Selecione...</option>
                        <option value="Class1">Classe 1</option>
                        <option value="Class2">Classe 2</option>
                        <option value="Class3">Classe 3</option>
                        <option value="Expired">Expirado</option>
                        <option value="None">Nenhum</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Type Ratings (Qualificações de Tipo)</label>
                    <textarea name="typeRatings" value={formData.typeRatings} onChange={handleChange} placeholder="Ex: B737, A320, B777, ATR72..." rows={3} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    <p className="text-xs text-slate-500 mt-1">Separe os modelos com vírgulas</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nível de Inglês *</label>
                    <select name="englishLevel" value={formData.englishLevel} onChange={handleChange} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" title="Nivel de ingles">
                      <option value="">Selecione...</option>
                      <option value="Basic">Básico</option>
                      <option value="Intermediate">Intermediário</option>
                      <option value="Advanced">Avançado</option>
                      <option value="Fluent">Fluente</option>
                      <option value="Native">Nativo</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Professional Experience */}
              {activeTab === 'experience' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Experiência Profissional</h2>
                  
                  {/* Current Position */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2">
                      💼 Posição Atual
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Cargo/Posição *</label>
                        <input type="text" name="currentPosition" value={formData.currentPosition} onChange={handleChange} placeholder="Ex: Piloto Comercial" required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Empresa</label>
                        <input type="text" name="currentCompany" value={formData.currentCompany} onChange={handleChange} placeholder="Ex: TAP Portugal" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Data de Início</label>
                        <input
                          type="text"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          placeholder="AAAA-MM"
                          inputMode="numeric"
                          pattern="\d{4}-\d{2}"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
                          title="Data de início do cargo atual"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Emprego</label>
                        <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white" title="Tipo de emprego">
                          <option value="">Selecione...</option>
                          <option value="FullTime">Tempo Integral</option>
                          <option value="PartTime">Tempo Parcial</option>
                          <option value="Contract">Contrato</option>
                          <option value="Freelance">Freelancer</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Setor/Indústria</label>
                        <select name="industry" value={formData.industry} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white" title="Setor de atuação">
                          <option value="">Selecione...</option>
                          <option value="Commercial">Aviação Comercial</option>
                          <option value="Corporate">Aviação Executiva</option>
                          <option value="Military">Aviação Militar</option>
                          <option value="Cargo">Cargas Aéreas</option>
                          <option value="Helicopter">Helicópteros</option>
                          <option value="Maintenance">Manutenção/Engenharia</option>
                          <option value="Training">Treinamento</option>
                          <option value="AirTraffic">Controle de Tráfego Aéreo</option>
                          <option value="Airport">Operações Aeroportuárias</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Anos de Experiência *</label>
                        <select name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} required className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white" title="Anos de experiencia">
                          <option value="">Selecione...</option>
                          <option value="0-1">Menos de 1 ano</option>
                          <option value="1-3">1-3 anos</option>
                          <option value="3-5">3-5 anos</option>
                          <option value="5-10">5-10 anos</option>
                          <option value="10+">Mais de 10 anos</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Previous Employment History */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        📋 Histórico de Emprego Anterior
                      </h3>
                      <button
                        type="button"
                        onClick={addPreviousJob}
                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        + Adicionar Emprego Anterior
                      </button>
                    </div>

                    {formData.previousJobs.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                        <p className="text-slate-600 mb-4">Nenhum emprego anterior adicionado</p>
                        <p className="text-xs text-slate-500">Adicione seus empregos anteriores para criar um histórico profissional completo</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {formData.previousJobs.map((job, index) => (
                          <div key={job.id} className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                              <h4 className="text-base font-bold text-slate-900">Emprego #{index + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removePreviousJob(job.id)}
                                className="px-3 py-1 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200 transition text-sm"
                              >
                                ✕ Remover
                              </button>
                            </div>

                            {/* Company and Position Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Empresa *</label>
                                <input
                                  type="text"
                                  value={job.companyName}
                                  onChange={(e) => handlePreviousJobChange(job.id, 'companyName', e.target.value)}
                                  placeholder="Ex: TAP Portugal, LATAM Brasil"
                                  required
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                  title="Nome da empresa"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Cargo/Função *</label>
                                <input
                                  type="text"
                                  value={job.position}
                                  onChange={(e) => handlePreviousJobChange(job.id, 'position', e.target.value)}
                                  placeholder="Ex: Piloto Comercial, Copiloto"
                                  required
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                />
                              </div>
                            </div>

                            {/* Employment Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Data de Início *</label>
                                <input
                                  type="text"
                                  value={job.startDate}
                                  onChange={(e) => handlePreviousJobChange(job.id, 'startDate', e.target.value)}
                                  placeholder="AAAA-MM"
                                  inputMode="numeric"
                                  pattern="\d{4}-\d{2}"
                                  required
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                  title="Data de início do emprego anterior"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Data de Término *</label>
                                <input
                                  type="text"
                                  value={job.endDate}
                                  onChange={(e) => handlePreviousJobChange(job.id, 'endDate', e.target.value)}
                                  placeholder="AAAA-MM"
                                  inputMode="numeric"
                                  pattern="\d{4}-\d{2}"
                                  required
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                  title="Data de término do emprego anterior"
                                />
                              </div>
                            </div>

                            {/* Role Description */}
                            <div className="mt-6">
                              <label className="block text-sm font-bold text-slate-700 mb-2">Descrição do Cargo e Responsabilidades *</label>
                              <textarea
                                value={job.description}
                                onChange={(e) => handlePreviousJobChange(job.id, 'description', e.target.value)}
                                placeholder="Descreva as responsabilidades, realizações, projetos importantes e habilidades utilizadas nesta posição..."
                                required
                                rows={4}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                              />
                              <p className="text-xs text-slate-500 mt-1">Máximo 1000 caracteres</p>
                            </div>

                            {/* Reference Information */}
                            <div className="mt-6 pt-6 border-t border-slate-300">
                              <h5 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                📞 Informações de Referência (opcional)
                              </h5>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">Nome do Contato de Referência</label>
                                  <input
                                    type="text"
                                    value={job.referenceContact}
                                    onChange={(e) => handlePreviousJobChange(job.id, 'referenceContact', e.target.value)}
                                    placeholder="Ex: João Silva (RH Manager)"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">Telefone da Referência</label>
                                  <input
                                    type="tel"
                                    value={job.referencePhone}
                                    onChange={(e) => handlePreviousJobChange(job.id, 'referencePhone', e.target.value)}
                                    placeholder="(XX) XXXXX-XXXX"
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                  />
                                </div>
                              </div>

                              <div className="mt-4">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email da Referência</label>
                                <input
                                  type="email"
                                  value={job.referenceEmail}
                                  onChange={(e) => handlePreviousJobChange(job.id, 'referenceEmail', e.target.value)}
                                  placeholder="contato@empresa.com"
                                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                />
                              </div>

                              <div className="mt-4 flex items-center">
                                <input
                                  type="checkbox"
                                  id={`reference-${job.id}`}
                                  checked={job.useAsReference}
                                  onChange={(e) => handlePreviousJobChange(job.id, 'useAsReference', e.target.checked)}
                                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                                />
                                <label htmlFor={`reference-${job.id}`} className="ml-3 text-sm font-semibold text-slate-700 cursor-pointer">
                                  ✓ Autorizar as empresas a contatar esta referência
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Education */}
              {activeTab === 'education' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Educação e Formação</h2>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nível Educacional Máximo</label>
                    <select name="highestEducation" value={formData.highestEducation} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" title="Nivel educacional maximo">
                      <option value="">Selecione...</option>
                      <option value="HighSchool">Ensino Médio</option>
                      <option value="Associate">Curso Técnico</option>
                      <option value="Bachelor">Graduação</option>
                      <option value="Master">Mestrado</option>
                      <option value="PhD">Doutorado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Especializações e Cursos</label>
                    <textarea name="specializations" value={formData.specializations} onChange={handleChange} placeholder="Ex: MBA em Gestão Aeroportuária, CRM (Crew Resource Management), Safety Management..." rows={4} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    <p className="text-xs text-slate-500 mt-1">Separe os cursos com quebras de linha</p>
                  </div>
                </div>
              )}

              {/* Skills */}
              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Competências Profissionais</h2>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Habilidades Técnicas</label>
                    <textarea name="coreSkills" value={formData.coreSkills} onChange={handleChange} placeholder="Ex: Pilotagem em IFR, Navegação, Procedimentos de Segurança, Operação de Aeronaves, Análise de Performance..." rows={4} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" title="Habilidades tecnicas" />
                    <p className="text-xs text-slate-500 mt-1">Separe as habilidades com vírgulas - máximo 10</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Habilidades Comportamentais (Soft Skills)</label>
                    <textarea name="softSkills" value={formData.softSkills} onChange={handleChange} placeholder="Ex: Liderança, Comunicação, Resolução de Problemas, Trabalho em Equipe, Gestão de Stress..." rows={4} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    <p className="text-xs text-slate-500 mt-1">Separe as habilidades com vírgulas</p>
                  </div>
                </div>
              )}

              {/* Preferences */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Preferências de Trabalho</h2>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Idiomas</label>
                    <textarea name="languages" value={formData.languages} onChange={handleChange} placeholder="Ex: Português (Nativo), Inglês (Fluente), Espanhol (Intermediário)..." rows={3} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" title="Idiomas" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Emprego Desejado</label>
                      <select name="jobType" value={formData.jobType} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" title="Tipo de emprego desejado">
                        <option value="">Selecione...</option>
                        <option value="FullTime">Tempo Integral</option>
                        <option value="PartTime">Tempo Parcial</option>
                        <option value="Contract">Contrato</option>
                        <option value="Freelance">Freelancer</option>
                        <option value="Flexible">Flexível</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Disposição para Viagens</label>
                      <select name="willTravelPercentage" value={formData.willTravelPercentage} onChange={handleChange} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" title="Disposição para viagens">
                        <option value="">Selecione...</option>
                        <option value="0">Não viajo</option>
                        <option value="25">Até 25%</option>
                        <option value="50">Até 50%</option>
                        <option value="75">Até 75%</option>
                        <option value="100">Estou disponível para viagens frequentes</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Salário Desejado (Mensal)</label>
                    <input type="text" name="desiredSalary" value={formData.desiredSalary} onChange={handleChange} placeholder="Ex: R$ 15.000 - R$ 25.000" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                    <p className="text-xs text-slate-500 mt-1">Deixe em branco se preferir negociar</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 mt-10 pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-4 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Salvando...
                    </>
                  ) : (
                    '✓ Salvar Perfil'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/career')}
                  className="px-6 py-4 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
