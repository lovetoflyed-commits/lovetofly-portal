"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AvatarUploader from "@/components/AvatarUploader";
import { maskBrazilianPhone, unmaskPhone } from "@/utils/phoneFormat";

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  cpf: string;
  email: string;
  mobilePhone: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  addressCountry: string;
  aviationRole: string;
  aviationRoleOther: string;
  licencas?: string;
  habilitacoes?: string;
  curso_atual?: string;
  isHangarshareAdvertiser?: boolean;
  avatarUrl?: string | null;
}

export default function EditProfilePage() {
  const { token, updateUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobilePhone: '',
    addressStreet: '',
    addressNumber: '',
    addressComplement: '',
    addressNeighborhood: '',
    addressCity: '',
    addressState: '',
    addressZip: '',
    addressCountry: '',
    aviationRole: '',
    aviationRoleOther: '',
    licencas: '',
    habilitacoes: '',
    curso_atual: ''
  });
  const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const res = await fetch("/api/user/profile", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          mobilePhone: maskBrazilianPhone(data.mobilePhone || ''),
          addressStreet: data.addressStreet || '',
          addressNumber: data.addressNumber || '',
          addressComplement: data.addressComplement || '',
          addressNeighborhood: data.addressNeighborhood || '',
          addressCity: data.addressCity || '',
          addressState: data.addressState || '',
          addressZip: data.addressZip || '',
          addressCountry: data.addressCountry || '',
          aviationRole: data.aviationRole || '',
          aviationRoleOther: data.aviationRoleOther || '',
          licencas: data.licencas || '',
          habilitacoes: data.habilitacoes || '',
          curso_atual: data.curso_atual || ''
        });
      }
      setLoading(false);
    }
    if (token) fetchProfile();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Apply mask for phone input
    if (name === 'mobilePhone') {
      setFormData(prev => ({ ...prev, [name]: maskBrazilianPhone(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    if (!token) {
      setMessage('Sessão expirada. Faça login novamente.');
      return;
    }

    // Simple validation
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const mobilePhone = unmaskPhone(formData.mobilePhone.trim());
    const role = formData.aviationRole.trim();
    const roleOther = formData.aviationRoleOther.trim();
    
    if (!firstName || !lastName) {
      setMessage('Nome e sobrenome são obrigatórios.');
      return;
    }
    
    if (role.length === 0 && roleOther.length === 0) {
      setMessage('Informe sua função na aviação ou outra função.');
      return;
    }

    setSaving(true);
    try {
      // Upload avatar first if there's a pending one
      if (pendingAvatar) {
        const base64 = pendingAvatar.split(',')[1];
        const mime = pendingAvatar.substring(5, pendingAvatar.indexOf(';'));
        const avatarRes = await fetch('/api/user/avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ imageData: base64, mimeType: mime }),
        });
        if (!avatarRes.ok) {
          const err = await avatarRes.json().catch(() => ({}));
          setMessage(err.message || 'Erro ao salvar avatar');
          setSaving(false);
          return;
        }
      }

      // Then update profile fields
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ 
          firstName: firstName || null,
          lastName: lastName || null,
          mobilePhone: mobilePhone || null,
          addressStreet: formData.addressStreet || null,
          addressNumber: formData.addressNumber || null,
          addressComplement: formData.addressComplement || null,
          addressNeighborhood: formData.addressNeighborhood || null,
          addressCity: formData.addressCity || null,
          addressState: formData.addressState || null,
          addressZip: formData.addressZip || null,
          addressCountry: formData.addressCountry || null,
          aviationRole: role || null, 
          aviationRoleOther: roleOther || null,
          licencas: formData.licencas || null,
          habilitacoes: formData.habilitacoes || null,
          curso_atual: formData.curso_atual || null
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessage(err.message || 'Erro ao salvar alterações');
        return;
      }

      const data = await res.json();
      setMessage('✓ Perfil atualizado com sucesso');
      setPendingAvatar(null);

      // Update AuthContext with new user data (especially name for header)
      if (data.data) {
        updateUser({ 
          name: `${data.data.firstName} ${data.data.lastName}`.trim() 
        });
      }

      // Optional redirect after short delay
      setTimeout(() => {
        router.push('/profile');
      }, 1200);
    } catch (error) {
      console.error('Salvar perfil error:', error);
      setMessage('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  const isBlocked = profile.isHangarshareAdvertiser;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Editar Perfil</h1>
        {/* Avatar uploader */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-2">Foto de Perfil</h2>
          <AvatarUploader 
            initialAvatarUrl={pendingAvatar || profile.avatarUrl || null} 
            onPhotoSelected={(dataUrl) => setPendingAvatar(dataUrl)} 
          />
          {pendingAvatar && (
            <div className="mt-2 text-xs text-orange-600 font-bold">
              ⚠️ Nova foto selecionada - clique em "Salvar Alterações" para confirmar
            </div>
          )}
        </div>
        {isBlocked && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 rounded">
            <b>Você é anunciante ativo no HangarShare.</b><br />
            Para alterar dados sensíveis (nome, CPF, contato, endereço), solicite ao administrador do portal.<br />
            <button className="mt-3 px-4 py-2 bg-yellow-400 text-white rounded font-bold hover:bg-yellow-500">Solicitar alteração ao administrador</button>
          </div>
        )}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome</label>
            <input 
              type="text" 
              name="firstName"
              className="w-full border rounded px-3 py-2" 
              value={formData.firstName} 
              onChange={handleChange}
              disabled={isBlocked} 
              readOnly={isBlocked} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Sobrenome</label>
            <input 
              type="text" 
              name="lastName"
              className="w-full border rounded px-3 py-2" 
              value={formData.lastName} 
              onChange={handleChange}
              disabled={isBlocked} 
              readOnly={isBlocked} 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">CPF</label>
            <input type="text" className="w-full border rounded px-3 py-2" defaultValue={profile.cpf} disabled={isBlocked} readOnly={isBlocked} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
            <input type="email" className="w-full border rounded px-3 py-2" defaultValue={profile.email} disabled readOnly />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Telefone</label>
            <input 
              type="text" 
              name="mobilePhone"
              className="w-full border rounded px-3 py-2" 
              value={formData.mobilePhone} 
              onChange={handleChange}
              placeholder="+55(XX)XXXXX-XXXX"
              disabled={isBlocked} 
              readOnly={isBlocked} 
            />
          </div>
          {/* Address Section */}
          <div className="border-t pt-5 mt-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Rua/Avenida</label>
                <input 
                  type="text" 
                  name="addressStreet"
                  className="w-full border rounded px-3 py-2" 
                  value={formData.addressStreet}
                  onChange={handleChange}
                  disabled={isBlocked} 
                  readOnly={isBlocked} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Número</label>
                <input 
                  type="text" 
                  name="addressNumber"
                  className="w-full border rounded px-3 py-2" 
                  value={formData.addressNumber}
                  onChange={handleChange}
                  disabled={isBlocked} 
                  readOnly={isBlocked} 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Complemento</label>
                <input 
                  type="text" 
                  name="addressComplement"
                  className="w-full border rounded px-3 py-2" 
                  value={formData.addressComplement}
                  onChange={handleChange}
                  disabled={isBlocked} 
                  readOnly={isBlocked} 
                  placeholder="Apto, Bloco, etc." 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Bairro</label>
                <input 
                  type="text" 
                  name="addressNeighborhood"
                  className="w-full border rounded px-3 py-2" 
                  value={formData.addressNeighborhood}
                  onChange={handleChange}
                  disabled={isBlocked} 
                  readOnly={isBlocked} 
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cidade</label>
                <input 
                  type="text" 
                  name="addressCity"
                  className="w-full border rounded px-3 py-2" 
                  value={formData.addressCity}
                  onChange={handleChange}
                  disabled={isBlocked} 
                  readOnly={isBlocked} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Estado</label>
                <input 
                  type="text" 
                  name="addressState"
                  className="w-full border rounded px-3 py-2" 
                  value={formData.addressState}
                  onChange={handleChange}
                  disabled={isBlocked} 
                  readOnly={isBlocked} 
                  placeholder="SP" 
                  maxLength={2} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">CEP</label>
                <input 
                  type="text" 
                  name="addressZip"
                  className="w-full border rounded px-3 py-2" 
                  value={formData.addressZip}
                  onChange={handleChange}
                  disabled={isBlocked} 
                  readOnly={isBlocked} 
                  placeholder="12345-678" 
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">País</label>
              <input 
                type="text" 
                name="addressCountry"
                className="w-full border rounded px-3 py-2" 
                value={formData.addressCountry}
                onChange={handleChange}
                disabled={isBlocked} 
                readOnly={isBlocked} 
                placeholder="Brasil" 
              />
            </div>
          </div>
          {/* Campos não sensíveis podem ser editados normalmente */}
          <div className="border-t pt-5 mt-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Informações de Aviação</h3>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Função na Aviação</label>
            <select 
              name="aviationRole"
              className="w-full border rounded px-3 py-2 bg-white" 
              value={formData.aviationRole} 
              onChange={(e) => setFormData(prev => ({ ...prev, aviationRole: e.target.value }))}
            >
              <option value="">Selecione uma função</option>
              <option value="Piloto Privado (PP)">Piloto Privado (PP)</option>
              <option value="Piloto Comercial (PC)">Piloto Comercial (PC)</option>
              <option value="Piloto de Linha Aérea (PLA)">Piloto de Linha Aérea (PLA)</option>
              <option value="Piloto Agrícola (PA)">Piloto Agrícola (PA)</option>
              <option value="Aluno Piloto">Aluno Piloto</option>
              <option value="Comissário de Voo">Comissário de Voo</option>
              <option value="Mecânico de Aeronaves">Mecânico de Aeronaves</option>
              <option value="Despachante Operacional de Voo (DOV)">Despachante Operacional de Voo (DOV)</option>
              <option value="Controlador de Tráfego Aéreo">Controlador de Tráfego Aéreo</option>
              <option value="Proprietário de Aeronave">Proprietário de Aeronave</option>
              <option value="Instrutor de Voo">Instrutor de Voo</option>
              <option value="Engenheiro Aeronáutico">Engenheiro Aeronáutico</option>
              <option value="Gestor de Aviação">Gestor de Aviação</option>
              <option value="Entusiasta da Aviação">Entusiasta da Aviação</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          {formData.aviationRole === 'Outro' && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Especifique a Função</label>
              <input 
                type="text" 
                name="aviationRoleOther"
                className="w-full border rounded px-3 py-2" 
                value={formData.aviationRoleOther} 
                onChange={handleChange}
                placeholder="Digite sua função na aviação"
              />
            </div>
          )}
          
          {/* Qualificações ANAC/RBAC 61 */}
          <div className="border-t pt-5 mt-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Qualificações de Aviação</h3>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Licenças</label>
              <input 
                type="text" 
                name="licencas"
                className="w-full border rounded px-3 py-2" 
                value={formData.licencas} 
                onChange={handleChange}
                placeholder="Ex: PP, PC, ATP"
              />
              <p className="text-xs text-slate-500 mt-1">Digite suas licenças ANAC (PP, PC, ATP, PLA, etc.)</p>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Habilitações</label>
              <input 
                type="text" 
                name="habilitacoes"
                className="w-full border rounded px-3 py-2" 
                value={formData.habilitacoes} 
                onChange={handleChange}
                placeholder="Ex: MLTE, IFR, B737"
              />
              <p className="text-xs text-slate-500 mt-1">Digite suas habilitações (MLTE, IFR, habilitações de tipo, etc.)</p>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Curso Atual</label>
              <input 
                type="text" 
                name="curso_atual"
                className="w-full border rounded px-3 py-2" 
                value={formData.curso_atual} 
                onChange={handleChange}
                placeholder="Ex: Habilitação de Tipo A320"
              />
              <p className="text-xs text-slate-500 mt-1">Curso de aviação que está realizando atualmente (opcional)</p>
            </div>
          </div>
          
          {message && (
            <div className={`mt-4 p-3 rounded text-sm font-bold ${message.startsWith('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <button 
              type="button" 
              onClick={() => router.push('/profile')} 
              className="flex-1 py-3 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300"
              disabled={saving}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50" 
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
