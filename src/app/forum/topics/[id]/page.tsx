'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { MessageCircle, ThumbsUp } from 'lucide-react';

interface ForumTopicDetail {
  id: string;
  title: string;
  category: string;
  content: string;
  views: number;
  replies_count: number;
  is_pinned?: boolean;
  is_locked?: boolean;
  created_at: string;
  author_name: string | null;
  likes_count: number;
  liked_by_user: boolean;
}

interface ForumReply {
  id: string;
  topic_id: string;
  parent_reply_id: string | null;
  content: string;
  created_at: string;
  author_name: string | null;
  likes_count: number;
  liked_by_user: boolean;
}

export default function ForumTopicPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, user } = useAuth();
  const topicId = useMemo(() => params?.id?.toString() ?? '', [params]);

  const [topic, setTopic] = useState<ForumTopicDetail | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likingTopic, setLikingTopic] = useState(false);
  const [likingReplyId, setLikingReplyId] = useState<string | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyTarget, setReplyTarget] = useState<
    | { type: 'topic' }
    | { type: 'reply'; replyId: string; authorName: string | null }
    | null
  >(null);
  const [moderating, setModerating] = useState(false);

  const isAdmin = user?.role === 'master' || user?.role === 'admin' || user?.role === 'staff';

  const { rootReplies, repliesByParent } = useMemo(() => {
    const grouped: Record<string, ForumReply[]> = {};
    const roots: ForumReply[] = [];
    for (const reply of replies) {
      if (reply.parent_reply_id) {
        grouped[reply.parent_reply_id] = grouped[reply.parent_reply_id] || [];
        grouped[reply.parent_reply_id].push(reply);
      } else {
        roots.push(reply);
      }
    }
    return { rootReplies: roots, repliesByParent: grouped };
  }, [replies]);

  const getCategoryLabel = (value: string) => {
    const map: Record<string, string> = {
      general: 'Outros',
      technical: 'Segurança',
      regulations: 'Regulamentos',
      events: 'Eventos',
      classifieds: 'Classificados',
      questions: 'Estudos',
    };
    return map[value] || value;
  };

  const fetchTopic = async () => {
    if (!topicId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/forum/topics/${topicId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        throw new Error('Erro ao carregar tópico');
      }
      const data = await response.json();
      setTopic(data.topic);
      setReplies(data.replies || []);
    } catch (err) {
      console.error('Error fetching topic:', err);
      setError('Não foi possível carregar este tópico.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopic();
  }, [topicId]);

  const openReplyModal = (target: { type: 'topic' } | { type: 'reply'; replyId: string; authorName: string | null }) => {
    setReplyTarget(target);
    setShowReplyModal(true);
  };

  const closeReplyModal = () => {
    setShowReplyModal(false);
    setReplyTarget(null);
    setReplyContent('');
  };

  const handleSubmitReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      alert('Faça login novamente para responder.');
      return;
    }
    if (!replyContent.trim()) return;

    try {
      setSubmitting(true);
      const parentReplyId = replyTarget?.type === 'reply' ? replyTarget.replyId : null;
      const response = await fetch(`/api/forum/topics/${topicId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: replyContent.trim(), parentReplyId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao publicar resposta');
      }

      closeReplyModal();
      await fetchTopic();
    } catch (err) {
      console.error('Error creating reply:', err);
      alert('Erro ao publicar resposta.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTopicLike = async () => {
    if (!token || !topic) {
      alert('Faça login novamente para curtir.');
      return;
    }
    if (likingTopic) return;

    try {
      setLikingTopic(true);
      const response = await fetch(`/api/forum/topics/${topicId}/likes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao curtir tópico');
      }
      const data = await response.json();
      setTopic({
        ...topic,
        liked_by_user: data.liked,
        likes_count: data.likes_count,
      });
    } catch (err) {
      console.error('Error toggling like:', err);
      alert('Erro ao curtir tópico.');
    } finally {
      setLikingTopic(false);
    }
  };

  const handleModeration = async (action: 'pin' | 'unpin' | 'lock' | 'unlock' | 'delete') => {
    if (!token || !topic) {
      alert('Faça login novamente para moderar.');
      return;
    }
    if (moderating) return;

    if (action === 'delete') {
      const confirmed = window.confirm('Tem certeza que deseja remover este tópico?');
      if (!confirmed) return;
    }

    try {
      setModerating(true);
      const response = await fetch(`/api/admin/forum/topics/${topicId}/moderate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Falha ao moderar tópico');
      }

      const data = await response.json();
      if (data?.topic) {
        setTopic((prev) => (prev ? { ...prev, ...data.topic } : prev));
      }
    } catch (err) {
      console.error('Moderation error:', err);
      alert('Erro ao moderar tópico.');
    } finally {
      setModerating(false);
    }
  };

  const toggleReplyLike = async (replyId: string) => {
    if (!token) {
      alert('Faça login novamente para curtir.');
      return;
    }
    if (likingReplyId) return;

    try {
      setLikingReplyId(replyId);
      const response = await fetch(`/api/forum/replies/${replyId}/likes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao curtir resposta');
      }
      const data = await response.json();
      setReplies((prev) =>
        prev.map((reply) =>
          reply.id === replyId
            ? { ...reply, liked_by_user: data.liked, likes_count: data.likes_count }
            : reply
        )
      );
    } catch (err) {
      console.error('Error toggling reply like:', err);
      alert('Erro ao curtir resposta.');
    } finally {
      setLikingReplyId(null);
    }
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1">
          <div className="bg-white border-b border-gray-200 py-4 px-8">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <Link
                href="/forum"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span className="text-lg">←</span>
                Voltar ao Fórum
              </Link>
              <button
                onClick={() => router.refresh()}
                className="text-sm font-semibold text-gray-500 hover:text-gray-800"
              >
                Atualizar
              </button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto p-8">
            {loading && <p className="text-gray-500">Carregando tópico...</p>}
            {!loading && error && <p className="text-red-600">{error}</p>}

            {!loading && topic && (
              <div className="space-y-8">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                        {getCategoryLabel(topic.category)}
                      </span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {topic.is_pinned && (
                          <span className="inline-flex items-center bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                            📌 Fixado
                          </span>
                        )}
                        {topic.is_locked && (
                          <span className="inline-flex items-center bg-rose-100 text-rose-700 text-xs font-semibold px-3 py-1 rounded-full">
                            🔒 Fechado
                          </span>
                        )}
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 mt-3">{topic.title}</h1>
                      <p className="text-sm text-gray-500 mt-1" suppressHydrationWarning>
                        por <span className="font-semibold text-gray-700">{topic.author_name || 'Usuário'}</span> •{' '}
                        {new Date(topic.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      {isAdmin && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleModeration(topic.is_pinned ? 'unpin' : 'pin')}
                            disabled={moderating}
                            className="px-3 py-2 text-xs font-semibold rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50"
                          >
                            {topic.is_pinned ? 'Desafixar' : 'Fixar'}
                          </button>
                          <button
                            onClick={() => handleModeration(topic.is_locked ? 'unlock' : 'lock')}
                            disabled={moderating}
                            className="px-3 py-2 text-xs font-semibold rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                          >
                            {topic.is_locked ? 'Reabrir' : 'Fechar'}
                          </button>
                          <button
                            onClick={() => handleModeration('delete')}
                            disabled={moderating}
                            className="px-3 py-2 text-xs font-semibold rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                          >
                            Remover
                          </button>
                        </div>
                      )}
                      <button
                        onClick={toggleTopicLike}
                        disabled={likingTopic}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                          topic.liked_by_user
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        <ThumbsUp size={16} />
                        {topic.likes_count || 0}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {topic.content}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-2">
                      <MessageCircle size={16} /> {topic.replies_count} respostas
                    </span>
                    <span>{topic.views} visualizações</span>
                    {topic.is_locked ? (
                      <span className="ml-auto text-rose-600 font-semibold">Tópico fechado para novas respostas</span>
                    ) : (
                      <button
                        onClick={() => openReplyModal({ type: 'topic' })}
                        className="ml-auto inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        <MessageCircle size={16} /> Responder
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">Respostas</h2>
                  {replies.length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-500">
                      Nenhuma resposta ainda.
                    </div>
                  )}
                  {rootReplies.map((reply) => (
                    <div key={reply.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-500" suppressHydrationWarning>
                            <span className="font-semibold text-gray-700">{reply.author_name || 'Usuário'}</span> •{' '}
                            {new Date(reply.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!topic?.is_locked && (
                            <button
                              onClick={() => openReplyModal({ type: 'reply', replyId: reply.id, authorName: reply.author_name })}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                              Responder
                            </button>
                          )}
                          <button
                            onClick={() => toggleReplyLike(reply.id)}
                            disabled={likingReplyId === reply.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                              reply.liked_by_user
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                            }`}
                          >
                            <ThumbsUp size={14} />
                            {reply.likes_count || 0}
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 text-gray-700 whitespace-pre-wrap">
                        {reply.content}
                      </div>

                      {(repliesByParent[reply.id] || []).length > 0 && (
                        <div className="mt-4 space-y-3 border-l-2 border-blue-100 pl-4">
                          {(repliesByParent[reply.id] || []).map((child) => (
                            <div key={child.id} className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-sm text-gray-500" suppressHydrationWarning>
                                    <span className="font-semibold text-gray-700">{child.author_name || 'Usuário'}</span> •{' '}
                                    {new Date(child.created_at).toLocaleString('pt-BR')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openReplyModal({ type: 'reply', replyId: child.id, authorName: child.author_name })}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                  >
                                    Responder
                                  </button>
                                  <button
                                    onClick={() => toggleReplyLike(child.id)}
                                    disabled={likingReplyId === child.id}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                                      child.liked_by_user
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                                    }`}
                                  >
                                    <ThumbsUp size={14} />
                                    {child.likes_count || 0}
                                  </button>
                                </div>
                              </div>
                              <div className="mt-3 text-gray-700 whitespace-pre-wrap">
                                {child.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showReplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {replyTarget?.type === 'reply' ? 'Responder à resposta' : 'Responder ao tópico'}
                </h3>
                {replyTarget?.type === 'reply' && (
                  <p className="text-sm text-gray-500">
                    Respondendo a {replyTarget.authorName || 'Usuário'}
                  </p>
                )}
              </div>
              <button
                onClick={closeReplyModal}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitReply} className="space-y-4 px-6 py-4">
              <textarea
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                rows={6}
                required
                placeholder="Escreva sua resposta..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeReplyModal}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {submitting ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}