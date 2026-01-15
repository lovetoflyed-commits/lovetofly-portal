'use client';

import { useState } from 'react';

interface Photo {
  id: number;
  photoUrl: string;
  displayOrder: number;
}

interface PhotoGalleryProps {
  photos: Photo[];
  title?: string;
}

export default function PhotoGallery({ photos, title = 'Fotos' }: PhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 6;

  if (!photos || photos.length === 0) {
    return null;
  }

  // Sort by display order
  const sortedPhotos = [...photos].sort((a, b) => a.displayOrder - b.displayOrder);
  const totalPages = Math.ceil(sortedPhotos.length / photosPerPage);
  const startIndex = (currentPage - 1) * photosPerPage;
  const currentPhotos = sortedPhotos.slice(startIndex, startIndex + photosPerPage);

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(startIndex + index);
  };

  const closeLightbox = () => {
    setSelectedPhotoIndex(null);
  };

  const goToPrevious = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < sortedPhotos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!selectedPhotoIndex) return;
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') closeLightbox();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-blue-900 mb-4">
        📷 {title} ({sortedPhotos.length})
      </h3>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {currentPhotos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => openLightbox(index)}
            className="relative group cursor-pointer overflow-hidden rounded-lg"
          >
            <img
              src={photo.photoUrl}
              alt={`Foto ${photo.displayOrder}`}
              className="w-full h-48 object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity rounded-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="bg-white text-blue-900 px-4 py-2 rounded-lg font-bold hover:bg-blue-900 hover:text-white transition-colors">
                🔍 Ampliar
              </button>
            </div>
            {/* Photo number badge */}
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-lg text-xs font-bold">
              {photo.displayOrder}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <div className="text-sm text-slate-600">
            Página {currentPage} de {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima →
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyPress}
          role="button"
          tabIndex={0}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-3xl hover:text-slate-300 transition-colors z-10"
          >
            ✕
          </button>

          {/* Navigation buttons */}
          {selectedPhotoIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:text-slate-300 transition-colors hover:scale-125"
            >
              ‹
            </button>
          )}

          {selectedPhotoIndex < sortedPhotos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl hover:text-slate-300 transition-colors hover:scale-125"
            >
              ›
            </button>
          )}

          {/* Main image */}
          <div
            className="relative max-w-4xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={sortedPhotos[selectedPhotoIndex].photoUrl}
              alt={`Foto ${selectedPhotoIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />

            {/* Photo counter */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm font-bold">
              {selectedPhotoIndex + 1} / {sortedPhotos.length}
            </div>

            {/* Photo info */}
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm">
              Ordem de exibição: {sortedPhotos[selectedPhotoIndex].displayOrder}
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 center text-white text-sm text-center">
            Use ← → para navegar ou ESC para fechar
          </div>
        </div>
      )}
    </div>
  );
}
