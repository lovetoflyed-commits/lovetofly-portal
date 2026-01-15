'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface ImageUploadProps {
  listingId: number;
  onUploadSuccess?: (imageUrl: string) => void;
}

export function HangarImageUpload({ listingId, onUploadSuccess }: ImageUploadProps) {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!preview) {
      setError('Please select an image');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch(
        `/api/hangarshare/listings/${listingId}/upload-image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setPreview(null);
      onUploadSuccess?.(data.data.imageUrl);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleUpload} className="space-y-4">
        {/* File Input */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="image-input"
          />
          <label htmlFor="image-input" className="cursor-pointer">
            {preview ? (
              <div className="space-y-2">
                <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded" />
                <p className="text-sm text-gray-600">Click to change image</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-3xl">📸</div>
                <div className="text-sm text-gray-600">
                  Click to select image or drag and drop
                </div>
                <div className="text-xs text-gray-500">Max 5MB (JPG, PNG, WebP)</div>
              </div>
            )}
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!preview || uploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
      </form>
    </div>
  );
}
