'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Download, Loader } from 'lucide-react';

interface ImportError {
  row: number;
  message: string;
}

interface ImportWarning {
  row: number;
  message: string;
}

interface ImportResult {
  success: number;
  errors: ImportError[];
  warnings: ImportWarning[];
}

interface LogbookImportProps {
  onClose: () => void;
  onImportComplete: () => void;
  token: string | null;
}

export default function LogbookImport({ onClose, onImportComplete, token }: LogbookImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    // Check file type
    const validExtensions = ['.xlsx', '.xls', '.xlt', '.csv'];
    const fileExtension = selectedFile.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      setError('Tipo de arquivo inválido. Use .xlsx, .xls, .xlt ou .csv');
      return;
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file || !token) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/logbook/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        
        // If any records were successfully imported, trigger refresh
        if (data.success > 0) {
          setTimeout(() => {
            onImportComplete();
          }, 1000);
        }
      } else {
        setError(data.message || 'Erro ao processar arquivo');
      }
    } catch (err) {
      console.error('Import error:', err);
      setError('Erro ao enviar arquivo. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/logbook/template');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_logbook.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Erro ao baixar template');
      }
    } catch (err) {
      console.error('Template download error:', err);
      alert('Erro ao baixar template');
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Importar Registros de Voo</h2>
            <p className="text-sm text-gray-600 mt-1">Carregue seus dados em Excel ou CSV</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Instruções</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Baixe o template de exemplo para ver o formato correto</li>
              <li>Campos obrigatórios: Data do Voo, Matrícula, Tempo Diurno ou Noturno</li>
              <li>Datas aceitas: DD/MM/AAAA ou AAAA-MM-DD</li>
              <li>Horas aceitas: HH:MM ou formato decimal (ex: 2.5 = 2:30)</li>
              <li>Códigos ICAO devem ter 4 letras (ex: SBMT, SBJD)</li>
              <li>Registros duplicados (mesma data e aeronave) serão ignorados</li>
            </ul>
          </div>

          {/* Template Download */}
          <div className="flex justify-center">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Download size={18} />
              Baixar Template de Exemplo
            </button>
          </div>

          {/* File Upload Area */}
          {!result && (
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {!file ? (
                  <>
                    <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-gray-700 font-semibold mb-2">
                      Arraste e solte seu arquivo aqui
                    </p>
                    <p className="text-gray-500 text-sm mb-4">ou</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Selecionar Arquivo
                    </button>
                    <p className="text-gray-500 text-xs mt-4">
                      Formatos aceitos: .xlsx, .xls, .xlt, .csv (máx. 10MB)
                    </p>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="text-green-600" size={32} />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="ml-4 text-red-600 hover:text-red-800"
                      aria-label="Remover arquivo"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.xlt,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {file && !error && (
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={isUploading}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader className="animate-spin" size={18} />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Importar Registros
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Success Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                  <div>
                    <p className="font-semibold text-green-900">
                      Importação Concluída
                    </p>
                    <p className="text-green-800 text-sm">
                      {result.success} registro(s) importado(s) com sucesso
                    </p>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Avisos ({result.warnings.length})
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.warnings.map((warning, idx) => (
                      <p key={idx} className="text-sm text-yellow-800">
                        Linha {warning.row}: {warning.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Erros ({result.errors.length})
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((error, idx) => (
                      <p key={idx} className="text-sm text-red-800">
                        Linha {error.row}: {error.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Importar Mais Arquivos
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Concluir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
