'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HangarOwnerRegisterPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [prefilled, setPrefilled] = useState<{ idNumber?: boolean; idCountry?: boolean }>({});
  const [profile, setProfile] = useState<any | null>(null);
  const [documentValidation, setDocumentValidation] = useState<any>(null);
  const [validatingDocs, setValidatingDocs] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    // Identity Verification
    idType: 'rg',
    idNumber: '',
    idCountry: 'Brasil',
    idExpiry: '',
    
    // Hangar Ownership
    ownershipType: 'owner',
    
    // Terms
    termsAccepted: false,
  });

  const [files, setFiles] = useState<{
    idFront: File | null;
    idBack: File | null;
    selfie: File | null;
    ownershipProof: File | null;
  }>({
    idFront: null,
    idBack: null,
    selfie: null,
    ownershipProof: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile', {
          cache: 'no-store',
          headers: user?.id && token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          // Pré-preencher apenas dados existentes (segurança anti-fraude)
          setFormData(prev => ({
            ...prev,
            idNumber: data.cpf ? String(data.cpf) : prev.idNumber,
            idCountry: data.addressCountry ? String(data.addressCountry) : prev.idCountry,
          }));
          // Marcar campos como pré-preenchidos (read-only)
          setPrefilled({
            idNumber: Boolean(data.cpf),
            idCountry: Boolean(data.addressCountry),
          });
        }
      } catch (e) {
        console.error('Erro ao carregar perfil:', e);
        // silent fail - usuário pode preencher manualmente
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleFileChange = (field: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const validateDocumentsBeforeSubmit = async () => {
    if (!files.idFront || !files.selfie) {
      alert('Documentos idFront e selfie são obrigatórios para validação');
      return false;
    }

    setValidatingDocs(true);
    try {
      const formDataToValidate = new FormData();
      formDataToValidate.append('idFront', files.idFront);
      if (files.idBack) {
        formDataToValidate.append('idBack', files.idBack);
      }
      formDataToValidate.append('selfie', files.selfie);

      const response = await fetch('/api/hangarshare/owner/validate-documents', {
        method: 'POST',
        body: formDataToValidate,
      });

      const validation = await response.json();
      setDocumentValidation(validation);

      if (!response.ok || !validation.valid) {
        const issuesText = validation.issues?.join('\n• ') || '';
        const suggestionsText = validation.suggestions?.join('\n• ') || '';

        alert(
          `❌ Documentos rejeitados\n\nProblemas:\n• ${issuesText}\n\nSugestões:\n• ${suggestionsText}`
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro na validação:', error);
      alert('Erro ao validar documentos. Tente novamente.');
      return false;
    } finally {
      setValidatingDocs(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.termsAccepted) {
      alert('Você precisa aceitar o Contrato de Anúncio para continuar.');
      return;
    }

    // Validar documentos antes de enviar
    const docsValid = await validateDocumentsBeforeSubmit();
    if (!docsValid) {
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement file upload and API call
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, String(formData[key as keyof typeof formData]));
      });
      if (user?.id) {
        formDataToSend.append('userId', String(user.id));
      }
      Object.keys(files).forEach(key => {
        const file = files[key as keyof typeof files];
        if (file !== null) {
          formDataToSend.append(key, file);
        }
      });

      // const response = await fetch('/api/hangarshare/owner/register', {
      //   method: 'POST',
      //   body: formDataToSend,
      // });

      alert('✅ Cadastro enviado! Aguarde a verificação da equipe (48-72h).');
      router.push('/hangarshare/owner/dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert('Erro ao enviar cadastro. Tente novamente.');
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
            Você precisa estar logado para se cadastrar como proprietário de hangar.
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
          <h1 className="text-3xl font-black text-blue-900">Cadastro de Proprietário de Hangar</h1>
          <p className="text-slate-600 mt-2">
            Complete o cadastro para começar a anunciar seu hangar
          </p>
          {profile && (
            <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-700">
                Alguns dados foram preenchidos automaticamente do seu perfil.
              </p>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div><span className="font-bold text-blue-900">Nome:</span> {profile.firstName} {profile.lastName}</div>
                <div><span className="font-bold text-blue-900">Email:</span> {profile.email}</div>
                <div><span className="font-bold text-blue-900">CPF:</span> {profile.cpf || '—'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-bold ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
              1. Verificação de Identidade
            </span>
            <span className={`text-sm font-bold ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
              2. Comprovação de Propriedade
            </span>
            <span className={`text-sm font-bold ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
              3. Termos e Confirmação
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Verificação de Identidade</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tipo de Documento
                  </label>
                  <select
                    value={formData.idType}
                    onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="rg">RG</option>
                    <option value="cnh">CNH</option>
                    <option value="passport">Passaporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Número do Documento
                  </label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    readOnly={Boolean(prefilled.idNumber)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">País</label>
                    <input
                      type="text"
                      value={formData.idCountry}
                      onChange={(e) => setFormData({ ...formData, idCountry: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      readOnly={Boolean(prefilled.idCountry)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Data de Validade
                    </label>
                    <input
                      type="date"
                      value={formData.idExpiry}
                      onChange={(e) => setFormData({ ...formData, idExpiry: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-900 mb-3">📸 Upload de Documentos</h3>
                  <p className="text-xs text-blue-800 mb-3 bg-blue-100 p-2 rounded">
                    ⚠️ Nossos sistemas de IA verificarão: legibilidade, autenticidade, correspondência facial e detecção de fraude.
                    Envie documentos reais, legíveis e em boa qualidade.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Frente do Documento
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('idFront', e.target.files?.[0] || null)}
                        className="w-full text-sm"
                        required
                      />
                      {files.idFront && (
                        <p className="text-xs text-green-600 mt-1">✓ {files.idFront.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Verso do Documento
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('idBack', e.target.files?.[0] || null)}
                        className="w-full text-sm"
                      />
                      {files.idBack && <p className="text-xs text-green-600 mt-1">✓ {files.idBack.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Selfie segurando o documento
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange('selfie', e.target.files?.[0] || null)}
                        className="w-full text-sm"
                        required
                      />
                      {files.selfie && (
                        <p className="text-xs text-green-600 mt-1">✓ {files.selfie.name}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        💡 Dica: A selfie deve mostrar seu rosto claramente e o documento de forma legível
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!formData.idNumber || !files.idFront || !files.selfie}
                  className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Comprovação de Propriedade do Hangar</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tipo de Vínculo
                  </label>
                  <select
                    value={formData.ownershipType}
                    onChange={(e) => setFormData({ ...formData, ownershipType: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="owner">Proprietário</option>
                    <option value="leaseholder">Locatário (Arrendatário)</option>
                    <option value="authorized">Autorizado pelo Proprietário</option>
                  </select>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-bold text-amber-900 mb-3">📄 Documentos Necessários</h3>
                  <ul className="text-sm text-slate-700 space-y-2 mb-4">
                    {formData.ownershipType === 'owner' && (
                      <li>• Escritura ou matrícula do imóvel</li>
                    )}
                    {formData.ownershipType === 'leaseholder' && (
                      <li>• Contrato de locação ou arrendamento vigente</li>
                    )}
                    {formData.ownershipType === 'authorized' && (
                      <>
                        <li>• Carta de autorização do proprietário com firma reconhecida</li>
                        <li>• Documento de identidade do proprietário</li>
                      </>
                    )}
                  </ul>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Upload de Comprovante
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange('ownershipProof', e.target.files?.[0] || null)}
                      className="w-full text-sm"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-600">
                    ℹ️ Seus documentos serão analisados pela nossa equipe em até 48-72 horas.
                    Você receberá um e-mail com o resultado da verificação.
                  </p>
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
                  disabled={!files.ownershipProof}
                  className="px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-6">Termos e Confirmação</h2>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 max-h-96 overflow-y-auto mb-6">
                <h3 className="font-bold text-lg text-blue-900 mb-4">Contrato de Anúncio de Hangares</h3>
                <div className="text-sm text-slate-700 space-y-3">
                  <p className="font-bold">IMPORTANTE: LEIA ATENTAMENTE</p>
                  <p>
                    O Love To Fly Portal ("PORTAL") é exclusivamente uma plataforma de intermediação
                    que conecta proprietários de hangares com potenciais locatários.
                  </p>
                  <p className="font-bold text-red-600">
                    O PORTAL NÃO É PARTE da relação locatícia e NÃO SE RESPONSABILIZA por:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Danos materiais ou morais decorrentes do aluguel</li>
                    <li>Acidentes, furtos, roubos ou sinistros com aeronaves</li>
                    <li>Qualidade, segurança ou conformidade do hangar</li>
                    <li>Descumprimento de acordos entre você e o locatário</li>
                  </ul>
                  <p className="font-bold">Você declara que:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>É proprietário legítimo ou possui autorização para alugar o hangar</li>
                    <li>O hangar está conforme normas da ANAC e órgãos competentes</li>
                    <li>Todas as informações fornecidas são verdadeiras</li>
                    <li>Possui alvarás e licenças necessárias</li>
                  </ul>
                  <p className="mt-4">
                    <a href="/hangarshare/contract" target="_blank" className="text-blue-600 underline">
                      Leia o contrato completo aqui
                    </a>
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                    className="mt-1 w-5 h-5"
                  />
                  <span className="text-sm text-slate-700">
                    <strong className="text-blue-900">
                      Li e aceito o Contrato de Anúncio de Hangares
                    </strong>
                    , estou ciente de que o PORTAL não se responsabiliza por danos ou problemas
                    relacionados ao aluguel do hangar, e declaro que todas as informações fornecidas são verdadeiras.
                  </span>
                </label>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-emerald-900 mb-2">✓ Resumo do seu cadastro</h3>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• Documento: {formData.idType.toUpperCase()} - {formData.idNumber}</li>
                  <li>• Vínculo: {formData.ownershipType === 'owner' ? 'Proprietário' : 
                                   formData.ownershipType === 'leaseholder' ? 'Locatário' : 'Autorizado'}</li>
                  <li>• Arquivos enviados: {Object.values(files).filter(Boolean).length} de 4</li>
                </ul>
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
                  disabled={!formData.termsAccepted || loading}
                  className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : '✓ Finalizar Cadastro'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
