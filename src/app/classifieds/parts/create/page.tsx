'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function CreatePartListing() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<number | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    part_number: '',
    manufacturer: '',
    category: 'engine',
    condition: 'serviceable',
    time_since_overhaul: '',
    price: '',
    location_city: '',
    location_state: 'SP',
    description: '',
    compatible_aircraft: '',
    has_certification: false,
    has_logbook: false,
    shipping_available: true,
    return_policy: '',
    status: 'active'
  });

  const categories = [
    { value: 'engine', label: 'Motor' },
    { value: 'propeller', label: 'Hélice' },
    { value: 'instrument', label: 'Instrumento' },
    { value: 'landing-gear', label: 'Trem de Pouso' },
    { value: 'structural', label: 'Estrutural' },
    { value: 'interior', label: 'Interior' }
  ];

  const conditions = [
    { value: 'new', label: 'Novo' },
    { value: 'overhauled', label: 'Revisado' },
    { value: 'serviceable', label: 'Operacional' },
    { value: 'as-is', label: 'No Estado' },
    { value: 'for-parts', label: 'Para Peças' }
  ];

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Você precisa estar logado para criar um anúncio');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        user_id: user.id,
        time_since_overhaul: formData.time_since_overhaul ? parseInt(formData.time_since_overhaul) : null,
        price: parseFloat(formData.price),
        status: 'active'
      };

      const response = await fetch('/api/classifieds/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        setCreatedListingId(result.data.id);
        setStep(4); // Go to photo upload step
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Erro ao criar anúncio:', error);
      alert('Erro ao criar anúncio');
    } finally {
      setSubmitting(false);
    }
  };

  // Image compression
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
          
          const maxWidth = 1200;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
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
                  const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
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

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    
    if (files.length === 0) return;
    
    if (photos.length + files.length > 10) {
      setPhotoError('Máximo de 10 fotos permitidas.');
      return;
    }
    
    setCompressing(true);
    setPhotoError('');
    
    try {
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.size > 200 * 1024) {
            return await compressImage(file, 200);
          }
          return file;
        })
      );
      
      setPhotos([...photos, ...compressedFiles]);
      setPhotoPreviews([...photoPreviews, ...compressedFiles.map(file => URL.createObjectURL(file))]);
    } catch (error) {
      console.error('Error compressing images:', error);
      setPhotoError('Erro ao processar imagens. Tente novamente.');
    } finally {
      setCompressing(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = async () => {
    if (!createdListingId || photos.length === 0) {
      router.push(`/classifieds/parts/${createdListingId}`);
      return;
    }

    try {
      setUploadingPhotos(true);

      for (const photo of photos) {
        const formData = new FormData();
        formData.append('file', photo);

        const response = await fetch(`/api/classifieds/parts/${createdListingId}/upload-photo`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }
      }

      alert('Fotos enviadas com sucesso!');
      router.push(`/classifieds/parts/${createdListingId}`);
    } catch (error: any) {
      console.error('Erro ao enviar fotos:', error);
      alert('Erro ao enviar fotos: ' + error.message);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Anunciar Peça</h1>
                <p className="text-gray-600 mt-1">Preencha os dados para criar seu anúncio</p>
              </div>

              {/* Progress Steps */}
              <div className="mb-8 flex justify-between items-center">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {s}
                    </div>
                    {s < 4 && (
                      <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
                {/* Step 1: Basic Info */}
                {step === 1 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">1. Informações Básicas</h2>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título do Anúncio *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Hélice Sensenich 2 pás"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categoria *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          required
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
                          Condição *
                        </label>
                        <select
                          value={formData.condition}
                          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                          required
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número da Peça
                        </label>
                        <input
                          type="text"
                          value={formData.part_number}
                          onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                          placeholder="Ex: M76EM8-0-60"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fabricante
                        </label>
                        <input
                          type="text"
                          value={formData.manufacturer}
                          onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                          placeholder="Ex: Lycoming"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Price & Location */}
                {step === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">2. Preço e Localização</h2>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preço (R$) *
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="Ex: 12000"
                        min="0"
                        step="0.01"
                        required
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
                          value={formData.location_city}
                          onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                          placeholder="Ex: São Paulo"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado *
                        </label>
                        <select
                          value={formData.location_state}
                          onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
                          required
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
                        Horas desde Revisão (opcional)
                      </label>
                      <input
                        type="number"
                        value={formData.time_since_overhaul}
                        onChange={(e) => setFormData({ ...formData, time_since_overhaul: e.target.value })}
                        placeholder="Ex: 150"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aeronaves Compatíveis
                      </label>
                      <input
                        type="text"
                        value={formData.compatible_aircraft}
                        onChange={(e) => setFormData({ ...formData, compatible_aircraft: e.target.value })}
                        placeholder="Ex: Cessna 172, 182, 206"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Description & Options */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">3. Descrição e Opções</h2>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descreva a peça em detalhes..."
                        rows={5}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Política de Devolução
                      </label>
                      <input
                        type="text"
                        value={formData.return_policy}
                        onChange={(e) => setFormData({ ...formData, return_policy: e.target.value })}
                        placeholder="Ex: 7 dias para devolução sem justificativa"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.has_certification}
                          onChange={(e) => setFormData({ ...formData, has_certification: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">Peça certificada (TSO/PMA)</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.has_logbook}
                          onChange={(e) => setFormData({ ...formData, has_logbook: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">Possui logbook/documentação</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.shipping_available}
                          onChange={(e) => setFormData({ ...formData, shipping_available: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">Envio disponível</span>
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

                {/* Step 4: Photo Upload */}
                {step === 4 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold mb-4">4. Adicionar Fotos (Opcional)</h2>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <p className="text-green-800">
                        ✓ Anúncio criado com sucesso! Agora adicione fotos para aumentar suas chances de venda.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fotos da Peça (máx. 10 fotos, 200KB cada)
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handlePhotoChange}
                        disabled={compressing || photos.length >= 10}
                        className="mb-2 w-full"
                      />
                      <p className="text-xs text-gray-500 mb-2">
                        As imagens serão automaticamente otimizadas para o tamanho ideal.
                      </p>
                      {compressing && (
                        <p className="text-blue-600 text-sm mt-1">⏳ Otimizando imagens...</p>
                      )}
                      {photoError && <p className="text-red-600 text-sm mt-1">⚠️ {photoError}</p>}
                      
                      {/* Photo previews */}
                      <div className="grid grid-cols-5 gap-2 mt-4">
                        {photoPreviews.map((src, idx) => (
                          <div key={idx} className="relative">
                            <img 
                              src={src} 
                              alt={`Foto ${idx+1}`} 
                              className="w-full h-24 object-cover rounded border" 
                            />
                            {photos[idx] && (
                              <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
                                {Math.round(photos[idx].size / 1024)}KB
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      {photos.length === 0 && (
                        <p className="text-gray-500 text-sm mt-2">
                          Nenhuma foto adicionada. Você pode pular esta etapa e adicionar fotos depois.
                        </p>
                      )}
                      {photos.length > 0 && (
                        <p className="text-green-600 text-sm mt-2">
                          {photos.length} foto{photos.length > 1 ? 's' : ''} pronta{photos.length > 1 ? 's' : ''} para envio
                        </p>
                      )}
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                      <p className="text-yellow-800 text-sm">
                        💡 <strong>Dica:</strong> Anúncios com fotos recebem até 5x mais visualizações!
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  {step < 4 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={step === 1}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Voltar
                    </button>
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Próximo
                    </button>
                  ) : step === 3 ? (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? 'Criando...' : 'Criar Anúncio'}
                    </button>
                  ) : (
                    <div className="flex gap-4 w-full">
                      <button
                        type="button"
                        onClick={() => router.push(`/classifieds/parts/${createdListingId}`)}
                        className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Pular e Ver Anúncio
                      </button>
                      <button
                        type="button"
                        onClick={handlePhotoUpload}
                        disabled={uploadingPhotos || photos.length === 0}
                        className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {uploadingPhotos ? 'Enviando...' : `Enviar ${photos.length} Foto${photos.length !== 1 ? 's' : ''}`}
                      </button>
                    </div>
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
