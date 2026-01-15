'use client';

import React, { useState } from 'react';
import StarRating from './StarRating';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface ReviewListProps {
  listingId: number;
  reviews: any[];
  stats: any;
  onReviewDeleted?: (reviewId: number) => void;
  onReviewUpdated?: (review: any) => void;
}

export default function ReviewList({ 
  listingId,
  reviews = [],
  stats,
  onReviewDeleted,
  onReviewUpdated
}: ReviewListProps) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [sortBy, setSortBy] = useState('recent');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (reviewId: number) => {
    if (!token) return;

    const confirmed = window.confirm('Tem certeza que deseja deletar esta avaliação?');
    if (!confirmed) return;

    setDeletingId(reviewId);
    try {
      const response = await fetch(`/api/hangarshare/reviews/[id]?id=${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        onReviewDeleted?.(reviewId);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Erro ao deletar avaliação');
    } finally {
      setDeletingId(null);
    }
  };

  if (!stats) {
    return null;
  }

  const ratingDistribution = [
    { stars: 5, count: stats.rating_5_count || 0 },
    { stars: 4, count: stats.rating_4_count || 0 },
    { stars: 3, count: stats.rating_3_count || 0 },
    { stars: 2, count: stats.rating_2_count || 0 },
    { stars: 1, count: stats.rating_1_count || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-slate-200 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Avaliações</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-5xl font-black text-blue-600 mb-2">
              {stats.avg_rating || '—'}
            </div>
            <StarRating rating={Math.round(stats.avg_rating || 0)} size="md" />
            <p className="text-sm text-slate-600 mt-2">
              {stats.total_reviews} {stats.total_reviews === 1 ? 'avaliação' : 'avaliações'}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="md:col-span-2 space-y-3">
            {ratingDistribution.map(({ stars, count }) => (
              <div key={stars} className="flex items-center gap-3">
                <div className="flex gap-1 flex-shrink-0">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < stars ? 'fill-yellow-400' : 'fill-slate-300'}`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <div className="flex-1 bg-slate-300 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: stats.total_reviews > 0 
                        ? `${(count / stats.total_reviews) * 100}%` 
                        : '0%'
                    }}
                  />
                </div>
                <span className="text-sm text-slate-600 flex-shrink-0 w-10 text-right">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sorting */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">
            {reviews.length} {reviews.length === 1 ? 'Avaliação' : 'Avaliações'}
          </h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="recent">Mais recentes</option>
            <option value="rating_high">Maiores notas</option>
            <option value="rating_low">Menores notas</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
            <p className="text-slate-600 mb-2">Nenhuma avaliação ainda</p>
            <p className="text-sm text-slate-500">
              Seja o primeiro a avaliar este hangar
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div 
              key={review.id} 
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900">
                      {review.user_name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(review.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>

                {user && user.id === review.user_id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/hangarshare/listing/${listingId}?edit-review=${review.id}`)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingId === review.id}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition disabled:opacity-50"
                    >
                      {deletingId === review.id ? 'Deletando...' : '🗑️ Deletar'}
                    </button>
                  </div>
                )}
              </div>

              {review.comment && (
                <p className="text-slate-700 text-sm leading-relaxed mt-3">
                  {review.comment}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
