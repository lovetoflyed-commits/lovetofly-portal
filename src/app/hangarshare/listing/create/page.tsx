'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AirportData {
  icao_code: string;
  airport_name: string;
  city: string;
  state: string;
  country: string;
}

interface VerificationStatus {
  hasProfile: boolean;
  isVerified: boolean;
  canCreateListings: boolean;
  statusMessage: string;
  nextAction: string;
  documents?: {
    uploaded: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  uploadUrl?: string;
  setupUrl?: string;
}

export default function HangarListingPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [icaoError, setIcaoError] = useState('');
  const [airportData, setAirportData] = useState<AirportData | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(true);

  const [formData, setFormData] = useState({
    // Hangar Info
    icaoCode: '',
    hangarNumber: '',
    hangarLocationDescription: '',
    hangarSizeSqm: '',
    maxWingspanMeters: '',
    maxLengthMeters: '',
    maxHeightMeters: '',
    
    // Capacity (multiple aircraft spaces)
    totalSpaces: '1',
    availableSpaces: '1',
    spaceDescription: '',
    
    // Pricing
    hourlyRate: '',
    dailyRate: '',
    weeklyRate: '',
    monthlyRate: '',
    
    // Availability
    availableFrom: '',
    availableUntil: '',
    
    // Additional Info
    description: '',
    specialNotes: '',
    acceptsOnlinePayment: true,
    acceptsPaymentOnArrival: true,
    acceptsPaymentOnDeparture: false,
    cancellationPolicy: 'flexible',
  });

  // Imagens do hangar
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState('');
  const [compressing, setCompressing] = useState(false);

  // Compress image to target size (200KB max)
  const compressImage = async (file: File, maxSizeKB: number = 200): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          // Resize if too large (max 1200px width)
          const maxWidth = 1200;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Start with high quality and reduce until under size limit
          let quality = 0.85;
          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }
                
                const sizeKB = blob.size / 1024;
                
                if (sizeKB <= maxSizeKB || quality <= 0.3) {
                  // Create new file from blob
                  const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  // Reduce quality and try again
                  quality -= 0.1;
                  tryCompress();
                }
              },
              'image/jpeg',
              quality
            );
          };
          
          tryCompress();
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  // Preview das imagens selecionadas com compressão
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    
    if (files.length === 0) {
      setPhotoError('Adicione pelo menos uma imagem do hangar.');
      return;
    }
    
    if (files.length > 5) {
      setPhotoError('Máximo de 5 fotos permitidas.');
      return;
    }
    
    setCompressing(true);
    setPhotoError('');
    
    try {
      // Compress all images
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          // Only compress if larger than 200KB
          if (file.size > 200 * 1024) {
            return await compressImage(file, 200);
          }
          return file;
        })
      );
      
      setPhotos(compressedFiles);
      setPhotoPreviews(compressedFiles.map(file => URL.createObjectURL(file)));
    } catch (error) {
      console.error('Error compressing images:', error);
      setPhotoError('Erro ao processar imagens. Tente novamente.');
    } finally {
      setCompressing(false);
    }
  };

  const handleIcaoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    setFormData({ ...formData, icaoCode: code });
    setIcaoError('');
    setAirportData(null);

    if (code.length === 4) {
      try {
        const res = await fetch(`/api/hangarshare/airport/search?icao=${code}`);
        if (res.ok) {
          const data = await res.json();
          setAirportData(data);
        } else {
          setIcaoError('Aeródromo não encontrado');
        }
      } catch (error) {
        console.error('Error:', error);
        setIcaoError('Erro ao buscar aeródromo');
      }
    }
  };

  // Check verification status on mount
  useEffect(() => {
    const checkVerification = async () => {
      if (!user || !token) {
        setCheckingVerification(false);
        return;
      }

      try {
        const res = await fetch('/api/hangarshare/owner/verification-status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setVerificationStatus(data);
        } else {
          console.error('Failed to check verification status');
        }
      } catch (error) {
        console.error('Error checking verification:', error);
      } finally {
        setCheckingVerification(false);
      }
    };

    checkVerification();
  }, [user, token]);

  const handleNext = () => {
    if (step === 1 && !airportData) {
      setIcaoError('Por favor, insira um ICAO válido');
      return;
    }
    if (step === 2 && photos.length === 0) {
      setPhotoError('Adicione pelo menos uma imagem do hangar.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (photos.length === 0) {
      setPhotoError('Adicione pelo menos uma imagem do hangar.');
      setStep(2);
      return;
    }
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Erro: Token de autenticação não encontrado. Faça login novamente.');
        router.push('/login');
        return;
      }

      // Create listing
      const listingRes = await fetch('/api/hangarshare/listing/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          icaoCode: formData.icaoCode,
          hangarNumber: formData.hangarNumber,
          aerodromeName: airportData?.airport_name,
          city: airportData?.city,
          state: airportData?.state,
          hangarSizeSqm: parseFloat(formData.hangarSizeSqm),
          maxWingspanMeters: parseFloat(formData.maxWingspanMeters) || null,
          maxLengthMeters: parseFloat(formData.maxLengthMeters) || null,
          maxHeightMeters: parseFloat(formData.maxHeightMeters) || null,
          totalSpaces: parseInt(formData.totalSpaces) || 1,
          availableSpaces: parseInt(formData.availableSpaces) || 1,
          spaceDescription: formData.spaceDescription || null,
          hourlyRate: parseFloat(formData.hourlyRate) || null,
          dailyRate: parseFloat(formData.dailyRate) || null,
          weeklyRate: parseFloat(formData.weeklyRate) || null,
          monthlyRate: parseFloat(formData.monthlyRate) || null,
          availableFrom: formData.availableFrom,
          availableUntil: formData.availableUntil || null,
          acceptsOnlinePayment: formData.acceptsOnlinePayment,
          acceptsPaymentOnArrival: formData.acceptsPaymentOnArrival,
          acceptsPaymentOnDeparture: formData.acceptsPaymentOnDeparture,
          cancellationPolicy: formData.cancellationPolicy,
          hangarLocationDescription: formData.hangarLocationDescription,
          description: formData.description,
          specialNotes: formData.specialNotes,
        }),
      });

      if (!listingRes.ok) {
        const error = await listingRes.json();
        throw new Error(error.message || 'Erro ao criar anúncio');
      }

      const { listingId } = await listingRes.json();

      // Upload photos one by one
      let photoErrors = 0;
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];
        const photoFormData = new FormData();
        photoFormData.append('file', file);

        try {
          const photoRes = await fetch(
            `/api/hangarshare/listings/${listingId}/upload-photo`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: photoFormData,
            }
          );

          if (!photoRes.ok) {
            console.error(`Erro ao enviar foto ${i + 1}:`, photoRes.statusText);
            photoErrors++;
          }
        } catch (photoError) {
          console.error(`Erro ao enviar foto ${i + 1}:`, photoError);
          photoErrors++;
        }
      }

      if (photoErrors > 0) {
        console.warn(`Falha ao enviar ${photoErrors} de ${photos.length} fotos`);
        // Photos are optional, so we don't fail completely
      }

      // Success
      alert('✓ Hangar anunciado com sucesso! Aguardando aprovação do administrador.');
      router.push('/hangarshare/owner/dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert(`Erro ao anunciar hangar: ${error instanceof Error ? error.message : 'Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Login necessário</h2>
          <p className="text-slate-600 mb-6">
            Você precisa estar logado para anunciar um hangar.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while checking verification
  if (checkingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Verificando status...</p>
        </div>
      </div>
    );
  }

  // Show verification required message
  if (verificationStatus && !verificationStatus.canCreateListings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-4">
          <div className="text-center mb-6">
            {verificationStatus.nextAction === 'upload_documents' && (
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📄</span>
              </div>
            )}
            {verificationStatus.nextAction === 'wait_for_review' && (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⏳</span>
              </div>
            )}
            {verificationStatus.nextAction === 'reupload_documents' && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
            )}
            <h2 className="text-2xl font-bold text-blue-900 mb-2">
              {!verificationStatus.hasProfile ? 'Perfil Necessário' : 'Verificação Necessária'}
            </h2>
            <p className="text-slate-600 text-lg">
              {verificationStatus.statusMessage}
            </p>
          </div>

          {verificationStatus.documents && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-slate-900 mb-4">Status dos Documentos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-green-700">Aprovados</p>
                    <p className="text-slate-600">{verificationStatus.documents.approved} de 3</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <p className="font-semibold text-blue-700">Em Análise</p>
                    <p className="text-slate-600">{verificationStatus.documents.pending}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="font-semibold text-red-700">Rejeitados</p>
                    <p className="text-slate-600">{verificationStatus.documents.rejected}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📤</span>
                  <div>
                    <p className="font-semibold text-slate-700">Enviados</p>
                    <p className="text-slate-600">{verificationStatus.documents.uploaded} de 3</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {verificationStatus.nextAction === 'upload_documents' && (
              <>
                <p className="text-sm text-slate-600">
                  Para criar anúncios de hangares, você precisa enviar os seguintes documentos para verificação:
                </p>
                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 bg-slate-50 p-4 rounded-lg">
                  <li>Documento de identidade (frente)</li>
                  <li>Documento de identidade (verso)</li>
                  <li>Selfie segurando o documento</li>
                </ul>
                <button
                  onClick={() => router.push(verificationStatus.uploadUrl || '/hangarshare/owner/validate-documents')}
                  className="w-full px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
                >
                  Enviar Documentos →
                </button>
              </>
            )}

            {verificationStatus.nextAction === 'wait_for_review' && (
              <>
                <p className="text-sm text-slate-600">
                  Seus documentos foram enviados e estão sendo analisados pela nossa equipe. 
                  Este processo geralmente leva de 24 a 48 horas.
                </p>
                <p className="text-sm text-slate-600">
                  Você receberá um e-mail assim que a análise for concluída.
                </p>
                <button
                  onClick={() => router.push('/hangarshare/owner/dashboard')}
                  className="w-full px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
                >
                  Voltar ao Dashboard
                </button>
              </>
            )}

            {verificationStatus.nextAction === 'reupload_documents' && (
              <>
                <p className="text-sm text-slate-600">
                  Alguns dos seus documentos foram rejeitados. Por favor, revise e envie novos documentos corretos.
                </p>
                <button
                  onClick={() => router.push(verificationStatus.uploadUrl || '/hangarshare/owner/validate-documents')}
                  className="w-full px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
                >
                  Reenviar Documentos →
                </button>
              </>
            )}

            {!verificationStatus.hasProfile && verificationStatus.setupUrl && (
              <button
                onClick={() => router.push(verificationStatus.setupUrl ?? '/hangarshare/owner/setup')}
                className="w-full px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800"
              >
                Completar Cadastro →
              </button>
            )}

            <button
              onClick={() => router.push('/hangarshare')}
              className="w-full px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50"
            >
              ← Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/hangarshare')}
            className="text-blue-600 hover:text-blue-800 font-bold mb-4"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-black text-blue-900">Anunciar Hangar</h1>
          <p className="text-slate-600 mt-2">
            Preencha os dados do seu hangar para começar a receber reservas
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-bold ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
              1. Localização
            </span>
            <span className={`text-sm font-bold ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
              2. Características
            </span>
            <span className={`text-sm font-bold ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
              3. Preços & Disponibilidade
            </span>
            <span className={`text-sm font-bold ${step >= 4 ? 'text-blue-600' : 'text-slate-400'}`}>
              4. Confirmação
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Localização do Hangar</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Código ICAO do Aeródromo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: SBSP, SBCF, SBRJ..."
                    maxLength={4}
                    value={formData.icaoCode}
                    onChange={handleIcaoChange}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono text-lg"
                  />
                  {icaoError && (
                    <p className="text-red-600 text-sm mt-2">⚠️ {icaoError}</p>
                  )}
                </div>

                {airportData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="font-bold text-green-900 mb-4">✓ Aeródromo Encontrado</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600 font-semibold">Nome</p>
                        <p className="text-slate-900">{airportData.airport_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-semibold">ICAO</p>
                        <p className="text-slate-900 font-mono">{airportData.icao_code}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-semibold">Localização</p>
                        <p className="text-slate-900">{airportData.city}, {airportData.state}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 font-semibold">País</p>
                        <p className="text-slate-900">{airportData.country}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-3">ℹ️ Informações do Anunciante</h3>
                  <div className="text-sm text-slate-700 space-y-2">
                    <p><strong>Nome:</strong> {user?.name || 'Não informado'}</p>
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>ID de Usuário:</strong> {user?.id}</p>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 italic">
                    Estes dados são obtidos do seu perfil registrado. Para alterá-los, acesse suas configurações.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!airportData}
                  className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Características do Hangar</h2>
              <div className="space-y-6">
                {/* Upload de imagens */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Fotos do Hangar * (máx. 5 fotos, 200KB cada)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoChange}
                    disabled={compressing}
                    className="mb-2"
                  />
                  <p className="text-xs text-slate-500 mb-2">
                    As imagens serão automaticamente otimizadas para o tamanho ideal.
                  </p>
                  {compressing && (
                    <p className="text-blue-600 text-sm mt-1">⏳ Otimizando imagens...</p>
                  )}
                  {photoError && <p className="text-red-600 text-sm mt-1">⚠️ {photoError}</p>}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {photoPreviews.map((src, idx) => (
                      <div key={idx} className="relative">
                        <img src={src} alt={`Foto ${idx+1}`} className="w-24 h-24 object-cover rounded border" />
                        {photos[idx] && (
                          <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
                            {Math.round(photos[idx].size / 1024)}KB
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Número do Hangar
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 5, A-12, Galpão 3"
                      value={formData.hangarNumber}
                      onChange={(e) => setFormData({ ...formData, hangarNumber: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Tamanho da Área (m²) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="500"
                      value={formData.hangarSizeSqm}
                      onChange={(e) => setFormData({ ...formData, hangarSizeSqm: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Localização dentro do Aeródromo
                  </label>
                  <textarea
                    placeholder="Ex: Próximo à pista 03, setor norte, fácil acesso"
                    value={formData.hangarLocationDescription}
                    onChange={(e) => setFormData({ ...formData, hangarLocationDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="font-bold text-slate-900 mb-3">Dimensões Máximas Aceitas</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Envergadura (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="15.0"
                        value={formData.maxWingspanMeters}
                        onChange={(e) => setFormData({ ...formData, maxWingspanMeters: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Comprimento (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="12.0"
                        value={formData.maxLengthMeters}
                        onChange={(e) => setFormData({ ...formData, maxLengthMeters: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Altura (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="5.0"
                        value={formData.maxHeightMeters}
                        onChange={(e) => setFormData({ ...formData, maxHeightMeters: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Capacity Section - Multiple Aircraft Spaces */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-6">
                  <h4 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                    ✈️ Capacidade do Hangar
                  </h4>
                  <p className="text-sm text-amber-700 mb-4">
                    Se o hangar comporta mais de uma aeronave, informe a capacidade total e quantas vagas estão disponíveis.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Total de Vagas *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        placeholder="1"
                        value={formData.totalSpaces}
                        onChange={(e) => {
                          const total = e.target.value;
                          const available = parseInt(formData.availableSpaces) > parseInt(total) ? total : formData.availableSpaces;
                          setFormData({ ...formData, totalSpaces: total, availableSpaces: available });
                        }}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">Quantas aeronaves cabem no total?</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Vagas Disponíveis *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={formData.totalSpaces || '20'}
                        placeholder="1"
                        value={formData.availableSpaces}
                        onChange={(e) => setFormData({ ...formData, availableSpaces: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">Quantas vagas estão disponíveis para locação?</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Descrição das Vagas (opcional)
                    </label>
                    <textarea
                      placeholder="Ex: 2 vagas para aeronaves de pequeno porte, 1 vaga para aeronave de médio porte..."
                      value={formData.spaceDescription}
                      onChange={(e) => setFormData({ ...formData, spaceDescription: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleNext}
                  disabled={!formData.hangarSizeSqm}
                  className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Preços e Disponibilidade</h2>
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="font-bold text-slate-900 mb-4">Tabela de Preços *</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Preencha pelo menos uma opção de preço (por hora, dia, semana ou mês)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        R$ por Hora
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        R$ por Dia
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.dailyRate}
                        onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        R$ por Semana
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.weeklyRate}
                        onChange={(e) => setFormData({ ...formData, weeklyRate: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        R$ por Mês
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.monthlyRate}
                        onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-4">Disponibilidade *</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Disponível desde
                      </label>
                      <input
                        type="date"
                        value={formData.availableFrom}
                        onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Disponível até
                      </label>
                      <input
                        type="date"
                        value={formData.availableUntil}
                        onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-bold text-amber-900 mb-3">Formas de Pagamento</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.acceptsOnlinePayment}
                        onChange={(e) => setFormData({ ...formData, acceptsOnlinePayment: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700">Pagamento online (cartão/Pix)</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.acceptsPaymentOnArrival}
                        onChange={(e) => setFormData({ ...formData, acceptsPaymentOnArrival: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700">Pagamento na chegada</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.acceptsPaymentOnDeparture}
                        onChange={(e) => setFormData({ ...formData, acceptsPaymentOnDeparture: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-700">Pagamento na saída</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleNext}
                  disabled={!formData.availableFrom || (!formData.hourlyRate && !formData.dailyRate && !formData.weeklyRate && !formData.monthlyRate)}
                  className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Confirmação e Publicação</h2>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-slate-900 mb-4">Resumo do Anúncio</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-semibold">Aeródromo:</span>
                    <span>{airportData?.airport_name} ({formData.icaoCode})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Localização:</span>
                    <span>{airportData?.city}/{airportData?.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Tamanho:</span>
                    <span>{formData.hangarSizeSqm} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Preços:</span>
                    <span>
                      {[formData.hourlyRate && 'Hora', formData.dailyRate && 'Dia', formData.weeklyRate && 'Semana', formData.monthlyRate && 'Mês']
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Disponível:</span>
                    <span>{formData.availableFrom} até {formData.availableUntil || 'sem prazo'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-blue-900 mb-3">✓ Informações do Anunciante</h3>
                <div className="text-sm text-slate-700 space-y-2">
                  <p><strong>Nome:</strong> {user?.name || 'Não informado'}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>ID de Usuário:</strong> {user?.id}</p>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  ✓ Seu anúncio será publicado imediatamente e ficará visível para pilotos e operadores em todo o Brasil.
                </p>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300"
                >
                  ← Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg"
                >
                  {loading ? 'Publicando...' : '✓ Publicar Anúncio'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
