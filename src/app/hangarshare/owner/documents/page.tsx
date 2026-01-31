'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Document {
  id: number;
  document_type: string;
  document_name: string;
  upload_status: string;
  rejection_reason: string | null;
  uploaded_at: string;
  verified_at: string | null;
  file_path: string;
}

const DOCUMENT_TYPES = [
  { id: 'cnpj_certificate', label: 'Certificado de CNPJ' },
  { id: 'business_license', label: 'Alvará de Funcionamento' },
  { id: 'insurance', label: 'Seguro da Propriedade' },
  { id: 'property_deed', label: 'Documento de Propriedade' },
  { id: 'id_owner', label: 'Identidade do Proprietário' },
  { id: 'bank_account', label: 'Comprovante Bancário' },
];

export default function DocumentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('cnpj_certificate');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadDocuments();
  }, [user, router]);

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/hangarshare/owner/documents', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Erro ao carregar documentos');

      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Selecione um arquivo para fazer upload');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', selectedType);

      const res = await fetch('/api/hangarshare/owner/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao fazer upload');
      }

      setUploadSuccess('✓ Documento enviado com sucesso!');
      setSelectedFile(null);
      setSelectedType('cnpj_certificate');
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Reload documents
      setTimeout(() => {
        loadDocuments();
        setUploadSuccess('');
      }, 1500);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Erro ao fazer upload do documento');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏳ Aguardando Análise' },
      uploaded: { bg: 'bg-blue-100', text: 'text-blue-800', label: '📤 Enviado' },
      verified: { bg: 'bg-green-100', text: 'text-green-800', label: '✓ Verificado' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '✗ Rejeitado' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getDocumentLabel = (typeId: string) => {
    return DOCUMENT_TYPES.find(d => d.id === typeId)?.label || typeId;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Login necessário</h2>
          <p className="text-slate-600 mb-6">Você precisa estar logado para gerenciar documentos.</p>
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
            onClick={() => router.push('/hangarshare/owner/dashboard')}
            className="text-blue-600 hover:text-blue-800 font-bold mb-4"
          >
            ← Voltar ao Dashboard
          </button>
          <h1 className="text-3xl font-black text-blue-900">Verificação de Documentos</h1>
          <p className="text-slate-600 mt-2">
            Envie documentos para que os administradores verifiquem sua identidade e legitimidade
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-blue-900 mb-4">ℹ️ Documentos Necessários</h2>
          <p className="text-slate-700 mb-4">
            Para poder anunciar seus hangares, você precisa fornecer os seguintes documentos:
          </p>
          <ul className="space-y-2 text-slate-700">
            {DOCUMENT_TYPES.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2">
                <span className="text-blue-600 font-bold">•</span>
                {doc.label}
              </li>
            ))}
          </ul>
          <p className="text-sm text-slate-600 mt-4 italic">
            Formatos aceitos: PDF, JPG, PNG (máximo 10MB por arquivo)
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Enviar Novo Documento</h2>

          <div className="space-y-6">
            {/* Document Type Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Tipo de Documento *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DOCUMENT_TYPES.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedType(doc.id)}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      selectedType === doc.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-slate-50 hover:border-blue-300'
                    }`}
                  >
                    <span className="font-bold text-slate-900">{doc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Selecionar Arquivo *
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="font-bold text-slate-900 mb-1">
                    {selectedFile ? selectedFile.name : 'Clique para selecionar arquivo'}
                  </p>
                  <p className="text-sm text-slate-600">ou arraste aqui</p>
                </label>
              </div>
              {selectedFile && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold">⚠️ {uploadError}</p>
              </div>
            )}

            {/* Success Message */}
            {uploadSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold">{uploadSuccess}</p>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="w-full px-6 py-4 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
            >
              {uploading ? 'Enviando...' : '📤 Enviar Documento'}
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Seus Documentos</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mb-2"></div>
              <p className="text-slate-600">Carregando documentos...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              <p className="text-lg mb-2">Nenhum documento enviado ainda</p>
              <p className="text-sm">Envie seus documentos acima para começar o processo de verificação</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {getDocumentLabel(doc.document_type)}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Arquivo: {doc.document_name}
                      </p>
                    </div>
                    {getStatusBadge(doc.upload_status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-slate-600 font-semibold">Enviado em</p>
                      <p className="text-slate-900">
                        {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {doc.verified_at && (
                      <div>
                        <p className="text-slate-600 font-semibold">Verificado em</p>
                        <p className="text-slate-900">
                          {new Date(doc.verified_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>

                  {doc.rejection_reason && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-semibold text-yellow-800 mb-1">Observações do Admin:</p>
                      <p className="text-sm text-yellow-700">{doc.rejection_reason}</p>
                    </div>
                  )}

                  {doc.file_path && (
                    <div className="mt-4">
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                      >
                        🔗 Visualizar Documento
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
