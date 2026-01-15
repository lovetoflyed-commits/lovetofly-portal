"use client";
import { useEffect, useState } from "react";
import { Role, getAssignableRoles, hasPermission } from "./accessControl";

interface User {
  id: number;
  name: string;
  email: string;
  plan?: string;
  role?: Role;
}

export default function UserManagementPanel({ currentRole }: { currentRole: Role }) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  function handleEdit(userId: number) {
    setEditingId(userId);
    const user = users.find(u => u.id === userId);
    setSelectedRole((user?.role as Role) ?? null);
  }

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedRole(e.target.value as Role);
  }

  async function handleSave(userId: number) {
    // TODO: Integrate with backend API to persist role change
    setUsers(users.map(u =>
      u.id === userId
        ? { ...u, role: selectedRole === null ? u.role : selectedRole }
        : u
    ) as User[]);
    setEditingId(null);
    setSelectedRole(null);
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-4">Gestão de Usuários</h2>
      <input
        type="text"
        placeholder="Buscar por nome ou email..."
        className="w-full mb-4 p-2 border rounded"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <table className="w-full text-left border-t">
          <thead>
            <tr>
              <th className="py-2">Nome</th>
              <th>Email</th>
              <th>Plano</th>
              <th>Cargo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="py-2">{user.name}</td>
                <td>{user.email}</td>
                <td>{user.plan || "-"}</td>
                <td>
                  {editingId === user.id ? (
                    <select
                      value={selectedRole ?? user.role}
                      onChange={handleRoleChange}
                      className="border rounded p-1"
                    >
                      {[user.role, ...getAssignableRoles(currentRole)].map(role => (
                        <option key={role} value={role}>{role ? role.replace('_', ' ').toUpperCase() : '-'}</option>
                      ))}
                    </select>
                  ) : (
                    <span>{typeof user.role === 'string' ? user.role.replace('_', ' ').toUpperCase() : '-'}</span>
                  )}
                </td>
                <td>
                  {hasPermission(currentRole, 'manage_system') && currentRole !== user.role && (
                    editingId === user.id ? (
                      <button className="bg-green-600 text-white px-2 py-1 rounded mr-2" onClick={() => handleSave(user.id)}>Salvar</button>
                    ) : (
                      <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => handleEdit(user.id)}>Editar</button>
                    )
                  )}
                  <button className="text-blue-600 hover:underline text-sm ml-2">Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="mt-4 text-sm text-slate-500">* Apenas cargos abaixo do seu podem ser atribuídos. Master pode atribuir qualquer cargo.</div>
    </div>
  );
}
