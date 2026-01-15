'use client';

import React, { useState } from 'react';
import StarRating from './StarRating';
import { useAuth } from '@/context/AuthContext';

interface ReviewFormProps {
  listingId: number;
  onReviewSubmitted?: (review: any) => void;
  existingReview?: any;
}

export default function ReviewForm({ 
  listingId, 
  onReviewSubmitted,
  existingReview
}: ReviewFormProps) {
  const { user, token } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !token) {
      setError('Você precisa estar autenticado');
      return;
    }

    if (!rating) {
      setError('Selecione uma nota');
      return;
    }

    if (comment && (comment.length < 10 || comment.length > 500)) {
      setError('Comentário deve ter entre 10 e 500 caracteres');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const method = existingReview ? 'PATCH' : 'POST';
      const url = existingReview 
        ? `/api/hangarshare/reviews/[id]?id=${existingReview.id}`
        : '/api/hangarshare/reviews';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listing_id: listingId,
          rating,
          comment: comment || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao salvar avaliação');
      }

      const data = await response.json();
      onReviewSubmitted?.(data.review);
      
      if (!existingReview) {
        setRating(0);
        setComment('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">
        {existingReview ? '✏️ Editar sua avaliação' : '⭐ Deixe sua avaliação'}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Qual sua nota para este hangar?
        </label>
        <div className="flex gap-2">
          <StarRating 
            rating={rating} 
            onRatingChange={setRating}
            size="lg"
            interactive={true}
          />
          <span className="ml-4 text-2xl font-bold text-slate-900">
            {rating > 0 ? `${rating}.0` : '—'}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2 mt-4 text-xs text-slate-600">
          <div className="text-center">😞 Ruim</div>
          <div className="text-center">😐 OK</div>
          <div className="text-center">😊 Bom</div>
          <div className="text-center">😄 Ótimo</div>
          <div className="text-center">🤩 Excelente</div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Compartilhe sua experiência <span className="text-slate-500">(opcional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Descreva sua experiência com este hangar. Mínimo 10 caracteres..."
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
          maxLength={500}
        />
        <div className="text-xs text-slate-500 mt-2">
          {comment.length}/500 caracteres
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !rating}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Enviando...' : existingReview ? 'Atualizar Avaliação' : 'Enviar Avaliação'}
      </button>
    </form>
  );
}
