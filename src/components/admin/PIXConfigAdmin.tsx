'use client';

/**
 * PIX Configuration Admin Panel
 * Manage PIX keys and settings
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X, AlertCircle, Loader } from 'lucide-react';

interface PIXKey {
    id: number;
    pix_key: string;
    pix_key_type: string;
    bank_name: string;
    account_holder_name: string;
    is_active: boolean;
    created_at: string;
}

export const PIXConfigAdmin: React.FC = () => {
    const [pixKeys, setPixKeys] = useState<PIXKey[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingKeyId, setEditingKeyId] = useState<number | null>(null);
    const [newKey, setNewKey] = useState({
        pix_key: '',
        pix_key_type: 'cpf' as const,
        bank_name: '',
        account_holder_name: ''
    });

    // Fetch PIX keys
    const fetchPIXKeys = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/pix/keys', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch PIX keys');

            const data = await response.json();
            setPixKeys(data.data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Add or update PIX key
    const handleSaveKey = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newKey.pix_key || !newKey.account_holder_name) {
            setError('Please fill all required fields');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(
                editingKeyId ? `/api/admin/pix/keys/${editingKeyId}` : '/api/admin/pix/keys',
                {
                    method: editingKeyId ? 'PATCH' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(newKey)
                });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create PIX key');
            }

            setNewKey({
                pix_key: '',
                pix_key_type: 'cpf',
                bank_name: '',
                account_holder_name: ''
            });
            setEditingKeyId(null);
            setShowForm(false);
            setError(null);
            await fetchPIXKeys();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditKey = (key: PIXKey) => {
        setNewKey({
            pix_key: key.pix_key,
            pix_key_type: key.pix_key_type as any,
            bank_name: key.bank_name || '',
            account_holder_name: key.account_holder_name
        });
        setEditingKeyId(key.id);
        setShowForm(true);
        setError(null);
    };

    // Delete PIX key
    const handleDeleteKey = async (keyId: number) => {
        if (!confirm('Are you sure you want to delete this PIX key?')) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/pix/keys/${keyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete PIX key');
            }

            await fetchPIXKeys();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Toggle key active status
    const handleToggleActive = async (keyId: number, currentStatus: boolean) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/pix/keys/${keyId}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to update PIX key');

            await fetchPIXKeys();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPIXKeys();
    }, []);

    const pixKeyTypeLabels = {
        cpf: 'CPF',
        cnpj: 'CNPJ',
        email: 'Email',
        phone: 'Phone',
        random_key: 'Random Key'
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg">
                {/* Header */}
                <div className="border-b border-gray-200 p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">PIX Configuration</h1>
                            <p className="text-gray-600 mt-1">Manage your PIX merchant keys and settings</p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <Plus className="h-4 w-4" />
                            Add PIX Key
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-red-900">Error</h3>
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {/* Add Key Form */}
                {showForm && (
                    <form onSubmit={handleSaveKey} className="p-6 border-b border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    PIX Key Type
                                </label>
                                <select
                                    value={newKey.pix_key_type}
                                    onChange={(e) =>
                                        setNewKey({ ...newKey, pix_key_type: e.target.value as any })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="cpf">CPF</option>
                                    <option value="cnpj">CNPJ</option>
                                    <option value="email">Email</option>
                                    <option value="phone">Phone</option>
                                    <option value="random_key">Random Key</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    PIX Key *
                                </label>
                                <input
                                    type="text"
                                    value={newKey.pix_key}
                                    onChange={(e) =>
                                        setNewKey({ ...newKey, pix_key: e.target.value })
                                    }
                                    placeholder="Enter your PIX key"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Account Holder Name *
                                </label>
                                <input
                                    type="text"
                                    value={newKey.account_holder_name}
                                    onChange={(e) =>
                                        setNewKey({ ...newKey, account_holder_name: e.target.value })
                                    }
                                    placeholder="Enter account holder name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    value={newKey.bank_name}
                                    onChange={(e) =>
                                        setNewKey({ ...newKey, bank_name: e.target.value })
                                    }
                                    placeholder="e.g., Banco do Brasil"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                            >
                                {loading ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                ) : editingKeyId ? (
                                    'Update PIX Key'
                                ) : (
                                    'Save PIX Key'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingKeyId(null);
                                    setNewKey({
                                        pix_key: '',
                                        pix_key_type: 'cpf',
                                        bank_name: '',
                                        account_holder_name: ''
                                    });
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* PIX Keys List */}
                <div className="p-6">
                    {loading && !showForm ? (
                        <div className="flex justify-center py-8">
                            <Loader className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : pixKeys.length > 0 ? (
                        <div className="space-y-4">
                            {pixKeys.map((key) => (
                                <div
                                    key={key.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-gray-900">
                                                    {key.account_holder_name}
                                                </h3>
                                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                                    {pixKeyTypeLabels[key.pix_key_type as keyof typeof pixKeyTypeLabels]}
                                                </span>
                                                {key.is_active && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded flex items-center gap-1">
                                                        <Check className="h-3 w-3" /> Active
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p>
                                                    <span className="font-medium">PIX Key:</span> {key.pix_key}
                                                </p>
                                                {key.bank_name && (
                                                    <p>
                                                        <span className="font-medium">Bank:</span> {key.bank_name}
                                                    </p>
                                                )}
                                                <p className="text-gray-500 text-xs">
                                                    Created: {new Date(key.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => handleEditKey(key)}
                                                disabled={loading}
                                                className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                                                title="Edit"
                                            >
                                                <span className="text-xs font-semibold">Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(key.id, key.is_active)}
                                                disabled={loading}
                                                className={`p-2 rounded-lg transition ${key.is_active
                                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                                title={key.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                {key.is_active ? (
                                                    <Check className="h-4 w-4" />
                                                ) : (
                                                    <X className="h-4 w-4" />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => handleDeleteKey(key.id)}
                                                disabled={loading}
                                                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 mb-4">No PIX keys configured yet</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Add Your First PIX Key
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PIXConfigAdmin;
