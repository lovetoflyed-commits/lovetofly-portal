'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, ThumbsUp, MessageCircle, Eye, Plus, X } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import AuthGuard from '../../components/AuthGuard';
import { useAuth } from '@/context/AuthContext';

interface ForumTopic {
  id: number;
  title: string;
  category: string;
  content: string;
  views: number;
  replies_count: number;
  likes_count?: number;
  created_at: string;
  author_name: string | null;
}

export default function ForumPage() {
  const { token } = useAuth();
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopic, setNewTopic] = useState({
    title: '',
    category: 'regulations',
    content: ''
  });
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    from: '',
    to: '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const getPreview = (text: string) => {
    const cleaned = text?.trim() || '';
    if (!cleaned) return 'Sem conteúdo disponível.';
    return cleaned.length > 180 ? `${cleaned.slice(0, 180)}…` : cleaned;
  };

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

  const categories = [
    {
      value: 'regulations',
      label: 'Regulamentos',
      description: 'Discussões sobre RBAC/RBHA, IS/IAC e conformidade regulatória.',
    },
    {
      value: 'technical',
      label: 'Segurança',
      description: 'Boas práticas operacionais, segurança de voo e prevenção de incidentes.',
    },
    {
      value: 'events',
      label: 'Eventos',
      description: 'Cursos, workshops, feiras e encontros do setor aeronáutico.',
    },
    {
      value: 'classifieds',
      label: 'Classificados',
      description: 'Compra, venda e anúncios relacionados a aeronaves e equipamentos.',
    },
    {
      value: 'questions',
      label: 'Estudos',
      description: 'Dúvidas sobre formação, provas teóricas e progressão de carreira.',
    },
    {
      value: 'general',
      label: 'Outros',
      description: 'Assuntos gerais da comunidade de aviação.',
    },
  ];

  const getCategoryDescription = (value: string) =>
    categories.find((cat) => cat.value === value)?.description || '';

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('limit', '50');
        if (appliedFilters.query.trim()) params.set('q', appliedFilters.query.trim());
        if (appliedFilters.category) params.set('category', appliedFilters.category);
        if (appliedFilters.from) params.set('from', appliedFilters.from);
        if (appliedFilters.to) params.set('to', appliedFilters.to);

        const response = await fetch(`/api/forum/topics?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar tópicos');
        }
        const data = await response.json();
        setTopics(data.topics || []);
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError('Não foi possível carregar os tópicos agora.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [appliedFilters]);

  const handleApplyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    const cleared = { query: '', category: '', from: '', to: '' };
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  const handleSubmitTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('Faça login novamente para publicar.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTopic.title.trim(),
          category: newTopic.category,
          content: newTopic.content.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Erro ao publicar tópico');
      }

      const created = await response.json();
      if (created?.topic?.id) {
        setTopics((prev) => [
          {
            id: created.topic.id,
            title: newTopic.title.trim(),
            category: newTopic.category,
            content: newTopic.content.trim(),
            views: 0,
            replies_count: 0,
            created_at: created.topic.created_at || new Date().toISOString(),
            author_name: null,
          },
          ...prev
        ]);
      }

      setShowNewTopicModal(false);
      setNewTopic({ title: '', category: 'regulations', content: '' });
    } catch (err) {
      console.error('Failed to create topic:', err);
      alert('Erro ao publicar tópico. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1">
          {/* Back Button */}
          <div className="bg-white border-b border-gray-200 py-4 px-8">
            <div className="max-w-6xl mx-auto">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span className="text-lg">←</span>
                Voltar ao Dashboard
              </Link>
            </div>
          </div>

          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Fórum da Comunidade</h1>
                  <p className="text-blue-100">
                    Participe das discussões e tire suas dúvidas com outros pilotos
                  </p>
                </div>
                <button 
                  onClick={() => setShowNewTopicModal(true)}
                  className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg"
                >
                  <Plus size={18} /> Novo Tópico
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-6xl mx-auto p-8">
            {/* Search + Filters */}
            <form
              onSubmit={handleApplyFilters}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700">Buscar</label>
                  <input
                    type="text"
                    value={filters.query}
                    onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                    placeholder="Título, conteúdo ou autor"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    title="Buscar"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Categoria</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    title="Categoria"
                  >
                    <option value="">Todas</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {filters.category && (
                    <p className="mt-2 text-xs text-gray-500">
                      {getCategoryDescription(filters.category)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Período</label>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="date"
                      value={filters.from}
                      onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      title="Periodo inicial"
                    />
                    <input
                      type="date"
                      value={filters.to}
                      onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      title="Periodo final"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                >
                  Aplicar filtros
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200"
                >
                  Limpar
                </button>
              </div>
            </form>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Total de Tópicos</div>
                <div className="text-2xl font-bold text-gray-900">{topics.length}</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Respostas</div>
                <div className="text-2xl font-bold text-gray-900">
                  {topics.reduce((sum, topic) => sum + (topic.replies_count || 0), 0)}
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Membros Ativos</div>
                <div className="text-2xl font-bold text-gray-900">432</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Hoje</div>
                <div className="text-2xl font-bold text-gray-900">28</div>
              </div>
            </div>

            {/* Topics List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Discussões Recentes</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {loading && (
                  <div className="p-6 text-gray-500">Carregando tópicos...</div>
                )}
                {!loading && error && (
                  <div className="p-6 text-red-600">{error}</div>
                )}
                {!loading && !error && topics.length === 0 && (
                  <div className="p-6 text-gray-500">Nenhum tópico encontrado.</div>
                )}
                {topics.map((topic) => (
                  <div key={topic.id} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 flex-shrink-0">
                        {(topic.author_name || 'U')[0]}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <Link
                            href={`/forum/topics/${topic.id}`}
                            className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors"
                          >
                            {topic.title}
                          </Link>
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            {new Date(topic.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {getPreview(topic.content)}
                        </p>

                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                            {getCategoryLabel(topic.category)}
                          </span>
                          <span className="text-sm text-gray-600">
                            por <span className="font-medium text-gray-900">{topic.author_name || 'Usuário'}</span>
                          </span>
                        </div>

                        {/* Metrics */}
                        <div className="flex items-center gap-6 text-gray-500">
                          <div className="flex items-center gap-2 text-sm">
                            <MessageCircle size={16} />
                            <span>{topic.replies_count} respostas</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Eye size={16} />
                            <span>{topic.views} visualizações</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <ThumbsUp size={16} />
                            <span>{topic.likes_count || 0} curtidas</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Topic Modal */}
      {showNewTopicModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Criar Novo Tópico</h2>
              <button 
                onClick={() => setShowNewTopicModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar modal"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitTopic} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="topic-title" className="block text-sm font-semibold text-gray-700 mb-2">
                  Título do Tópico *
                </label>
                <input
                  id="topic-title"
                  type="text"
                  required
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  placeholder="Ex: Dúvida sobre regulamento de Voo VFR Noturno"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="topic-category" className="block text-sm font-semibold text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  id="topic-category"
                  required
                  value={newTopic.category}
                  onChange={(e) => setNewTopic({ ...newTopic, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  {getCategoryDescription(newTopic.category)}
                </p>
              </div>

              {/* Content */}
              <div>
                <label htmlFor="topic-content" className="block text-sm font-semibold text-gray-700 mb-2">
                  Conteúdo *
                </label>
                <textarea
                  id="topic-content"
                  required
                  value={newTopic.content}
                  onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                  placeholder="Descreva sua dúvida ou discussão em detalhes..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTopicModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:bg-gray-300"
                >
                  {submitting ? 'Publicando...' : 'Publicar Tópico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}

