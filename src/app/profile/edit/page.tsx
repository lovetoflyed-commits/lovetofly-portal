"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

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
  isHangarshareAdvertiser?: boolean;
}

export default function EditProfilePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    aviationRole: '',
    aviationRoleOther: ''
  });

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
          aviationRole: data.aviationRole || '',
          aviationRoleOther: data.aviationRoleOther || ''
        });
      }
      setLoading(false);
    }
    if (token) fetchProfile();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  const isBlocked = profile.isHangarshareAdvertiser;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Editar Perfil</h1>
        {isBlocked && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 rounded">
            <b>Você é anunciante ativo no HangarShare.</b><br />
            Para alterar dados sensíveis (nome, CPF, contato, endereço), solicite ao administrador do portal.<br />
            <button className="mt-3 px-4 py-2 bg-yellow-400 text-white rounded font-bold hover:bg-yellow-500">Solicitar alteração ao administrador</button>
          </div>
        )}
        <form className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome</label>
            <input type="text" className="w-full border rounded px-3 py-2" defaultValue={profile.firstName} disabled={isBlocked} readOnly={isBlocked} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Sobrenome</label>
            <input type="text" className="w-full border rounded px-3 py-2" defaultValue={profile.lastName} disabled={isBlocked} readOnly={isBlocked} />
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
            <input type="text" className="w-full border rounded px-3 py-2" defaultValue={profile.mobilePhone} disabled={isBlocked} readOnly={isBlocked} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Endereço</label>
            <input type="text" className="w-full border rounded px-3 py-2" defaultValue={profile.addressStreet} disabled={isBlocked} readOnly={isBlocked} />
          </div>
          {/* Campos não sensíveis podem ser editados normalmente */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Função na Aviação</label>
            <input 
              type="text" 
              name="aviationRole"
              className="w-full border rounded px-3 py-2" 
              value={formData.aviationRole} 
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Outra Função</label>
            <input 
              type="text" 
              name="aviationRoleOther"
              className="w-full border rounded px-3 py-2" 
              value={formData.aviationRoleOther} 
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="mt-6 w-full py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">Salvar Alterações</button>
        </form>
      </div>
    </div>
  );
}
