'use client';

import React, { useState } from 'react';
import { maskCEP, maskCPF, maskPhone, isValidCPF } from '@/utils/masks';

export default function IndividualRegisterForm({ onSuccess }: { onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        birthDate: '',
        cpf: '',
        email: '',
        password: '',
        confirmPassword: '',
        mobilePhone: '',
        addressStreet: '',
        addressNumber: '',
        addressComplement: '',
        addressNeighborhood: '',
        addressCity: '',
        addressState: '',
        addressZip: '',
        addressCountry: 'Brasil',
        aviationRole: '',
        aviationRoleOther: '',
        socialMedia: '',
        newsletter: false,
        terms: false,
    });
    const [zipStatus, setZipStatus] = useState('');
    const [zipLoading, setZipLoading] = useState(false);

    const fetchAddressByCEP = async (cep: string) => {
        const cleaned = cep.replace(/\D/g, '');
        if (cleaned.length !== 8) return;

        setZipLoading(true);
        setZipStatus('Buscando CEP...');

        try {
            const response = await fetch(`/api/address/cep?code=${cleaned}`);
            if (!response.ok) throw new Error('CEP lookup failed');

            const data = await response.json();
            if (data.error || !data.success) {
                setZipStatus('CEP não encontrado.');
                return;
            }

            setFormData((prev) => ({
                ...prev,
                addressZip: maskCEP(cleaned),
                addressStreet: data.street || prev.addressStreet,
                addressNeighborhood: data.neighborhood || prev.addressNeighborhood,
                addressCity: data.city || prev.addressCity,
                addressState: data.state || prev.addressState,
            }));

            setZipStatus('Endereço preenchido automaticamente.');
        } catch (err) {
            setZipStatus('Não foi possível buscar o CEP.');
        } finally {
            setZipLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let finalValue = value;
        if (name === 'cpf') finalValue = maskCPF(value);
        if (name === 'addressZip') finalValue = maskCEP(value);
        if (name === 'mobilePhone') finalValue = maskPhone(value);

        if (type === 'checkbox') {
            setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: finalValue }));
        if (name === 'addressZip') {
            const cleanedZip = finalValue.replace(/\D/g, '');
            if (cleanedZip.length === 8) {
                fetchAddressByCEP(cleanedZip);
            } else {
                setZipStatus('');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.terms) {
            setError('Você deve aceitar os termos de uso.');
            setLoading(false);
            return;
        }

        const cleanedCPF = formData.cpf.replace(/\D/g, '');
        if (!isValidCPF(cleanedCPF)) {
            setError('CPF inválido.');
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        try {
            const cleanedFormData = {
                ...formData,
                cpf: cleanedCPF,
                mobilePhone: formData.mobilePhone.replace(/\D/g, ''),
                addressZip: formData.addressZip.replace(/\D/g, ''),
                userType: 'individual',
            };

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanedFormData),
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token || 'mock-token-' + Date.now());
                localStorage.setItem('user', JSON.stringify(data.user || {}));
                onSuccess();
            } else {
                setError(data.error || 'Erro no cadastro.');
            }
        } catch (err) {
            setError('Erro de conexão.');
            console.error('Registration error:', err);
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 text-sm px-3 py-2 rounded">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nome</label>
                    <input
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Seu nome"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sobrenome</label>
                    <input
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Seu sobrenome"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Data de Nascimento</label>
                    <input
                        type="date"
                        name="birthDate"
                        required
                        value={formData.birthDate}
                        onChange={handleChange}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">CPF</label>
                    <input
                        name="cpf"
                        required
                        value={formData.cpf}
                        onChange={handleChange}
                        placeholder="000.000.000-00"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="seu@email.com"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone</label>
                    <input
                        name="mobilePhone"
                        required
                        value={formData.mobilePhone}
                        onChange={handleChange}
                        placeholder="(00) 00000-0000"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Senha</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full rounded border border-slate-300 px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-sm font-semibold"
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Senha</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full rounded border border-slate-300 px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-sm font-semibold"
                        >
                            {showConfirmPassword ? '🙈' : '👁️'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Função na Aviação</label>
                    <select
                        name="aviationRole"
                        required
                        value={formData.aviationRole}
                        onChange={handleChange}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Selecione</option>
                        <option value="student">Estudante</option>
                        <option value="pilot">Piloto</option>
                        <option value="instructor">Instrutor</option>
                        <option value="mechanic">Mecânico</option>
                        <option value="other">Outro</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">CEP</label>
                    <input
                        name="addressZip"
                        required
                        value={formData.addressZip}
                        onChange={handleChange}
                        placeholder="00000-000"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {zipStatus && (
                        <p className="text-xs text-slate-500 mt-1">{zipLoading ? 'Buscando CEP...' : zipStatus}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço</label>
                    <input
                        name="addressStreet"
                        required
                        value={formData.addressStreet}
                        onChange={handleChange}
                        placeholder="Rua/Avenida"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Número</label>
                    <input
                        name="addressNumber"
                        required
                        value={formData.addressNumber}
                        onChange={handleChange}
                        placeholder="123"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Complemento</label>
                    <input
                        name="addressComplement"
                        value={formData.addressComplement}
                        onChange={handleChange}
                        placeholder="Apto, sala, etc (opcional)"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bairro</label>
                    <input
                        name="addressNeighborhood"
                        required
                        value={formData.addressNeighborhood}
                        onChange={handleChange}
                        placeholder="Bairro"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cidade</label>
                    <input
                        name="addressCity"
                        required
                        value={formData.addressCity}
                        onChange={handleChange}
                        placeholder="Cidade"
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                    <input
                        name="addressState"
                        required
                        value={formData.addressState}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                addressState: e.target.value.slice(0, 2).toUpperCase(),
                            }))
                        }
                        placeholder="SP"
                        maxLength={2}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">País</label>
                <input
                    name="addressCountry"
                    value={formData.addressCountry}
                    onChange={handleChange}
                    disabled
                    className="w-full rounded border border-slate-300 px-3 py-2 text-sm bg-slate-50 disabled:opacity-75"
                />
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    name="newsletter"
                    checked={formData.newsletter}
                    onChange={handleChange}
                    className="w-4 h-4"
                />
                <span className="text-xs text-slate-700">Desejo receber notícias e atualizações</span>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    className="w-4 h-4"
                />
                <span className="text-xs text-slate-700">Aceito os termos de uso e política de privacidade</span>
            </div>

            <div className="flex gap-4 pt-2">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="flex-1 py-3 rounded-lg border border-slate-300 text-slate-700 font-bold shadow-md hover:bg-slate-50 transition-colors"
                >
                    Voltar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-lg bg-blue-900 text-white font-bold shadow-md hover:bg-blue-800 disabled:opacity-60 transition-colors"
                >
                    {loading ? 'Cadastrando...' : 'Cadastrar'}
                </button>
            </div>
        </form>
    );
}
