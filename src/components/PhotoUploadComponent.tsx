'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface PhotoUploadProps {
  listingId: number;
  listingType: 'aircraft' | 'parts' | 'avionics';
  onUploadSuccess?: (photos: any[]) => void;
}

export default function PhotoUploadComponent({
  listingId,
  listingType,
  onUploadSuccess,
}: PhotoUploadProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const MAX_FILE_SIZE = 200 * 1024; // 200KB
  const MAX_FILES = 10;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccess('');
    
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    const currentTotal = files.length + newFiles.length;

    // Validation
    if (currentTotal > MAX_FILES) {
      setError(`Máximo de ${MAX_FILES} fotos permitidas`);
      return;
    }

    for (const file of newFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Apenas JPEG, PNG e WebP são permitidos');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`Foto muito grande. Máximo: ${MAX_FILE_SIZE / 1024}KB`);
        return;
      }
    }

    // Add files
    setFiles([...files, ...newFiles]);

    // Create previews
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Selecione pelo menos uma foto');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');
    setSuccess('');

    try {
      const uploadedPhotos: any[] = [];
      const token = localStorage.getItem('token');

      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);

        const response = await fetch(
          `/api/classifieds/${listingType}/${listingId}/upload-photo`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || `Erro ao enviar foto ${i + 1}`);
          setUploading(false);
          return;
        }

        const result = await response.json();
        if (result.photo) {
          uploadedPhotos.push(result.photo);
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setUploadedPhotos(uploadedPhotos);
      setSuccess(`${files.length} foto(s) enviada(s) com sucesso!`);
      setFiles([]);
      setPreviews([]);
      setUploadProgress(100);
      
      // Notify parent
      if (onUploadSuccess) {
        onUploadSuccess(uploadedPhotos);
      }

      // Clear success message after 3s
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Erro ao enviar fotos. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📸 Fotos do Anúncio
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Upload Area */}
      <div className="mb-6">
        <label className="block">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            <div className="text-gray-600">
              <p className="text-lg font-medium mb-2">Selecione as fotos</p>
              <p className="text-sm text-gray-500">
                Clique ou arraste fotos aqui (máx {MAX_FILES} fotos, {MAX_FILE_SIZE / 1024}KB cada)
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* File Count */}
      {files.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          {files.length}/{MAX_FILES} fotos selecionadas
        </div>
      )}

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">Pré-visualização</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square"
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={uploading}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              uploading
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {uploading ? `Enviando... (${uploadProgress}%)` : 'Enviar Fotos'}
          </button>
        </div>
      )}

      {/* Uploaded Photos List */}
      {uploadedPhotos.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4">
            Fotos Enviadas ({uploadedPhotos.length})
          </h4>
          <div className="space-y-2">
            {uploadedPhotos.map((photo) => (
              <div
                key={photo.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-gray-200"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {photo.file_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(photo.file_size / 1024).toFixed(1)}KB
                    </p>
                  </div>
                </div>
                {photo.is_primary && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                    Principal
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
