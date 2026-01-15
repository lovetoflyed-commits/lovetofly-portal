"use client";
import { useState } from "react";
import { Role, hasPermission, getAssignableRoles } from "../accessControl";

const initialStaff = [
  { id: 1, name: "Edson Assumpcao", role: Role.MASTER },
  { id: 2, name: "Maria Silva", role: Role.OPERATIONS_LEAD },
  { id: 3, name: "João Souza", role: Role.SUPPORT_LEAD },
];

export default function StaffManagementPanel({ currentRole }: { currentRole: Role }) {
  const [staffList, setStaffList] = useState(initialStaff);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newRole, setNewRole] = useState<Role | "">("");

  const assignableRoles = getAssignableRoles(currentRole);

  function handleRoleChange(id: number) {
    if (!newRole) return;
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, role: newRole as Role } : s))
    );
    setSelectedId(null);
    setNewRole("");
  }

  return (
    <section className="mt-8">
      <h2 className="font-bold text-lg mb-2">Equipe</h2>
      <table className="w-full text-left border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Nome</th>
            <th className="p-2">Função</th>
            <th className="p-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.role}</td>
              <td className="p-2">
                {assignableRoles.length > 0 && (
                  selectedId === s.id ? (
                    <>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as Role)}
                        className="border rounded px-2 py-1"
                      >
                        <option value="">Selecione</option>
                        {assignableRoles.map((r: Role) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button
                        className="ml-2 px-2 py-1 bg-blue-500 text-white rounded"
                        onClick={() => handleRoleChange(s.id)}
                        disabled={!newRole}
                      >Salvar</button>
                      <button
                        className="ml-2 px-2 py-1 bg-gray-300 rounded"
                        onClick={() => { setSelectedId(null); setNewRole(""); }}
                      >Cancelar</button>
                    </>
                  ) : (
                    <button
                      className="px-2 py-1 bg-yellow-400 rounded"
                      onClick={() => setSelectedId(s.id)}
                    >Alterar função</button>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2">* Apenas funções abaixo do seu nível podem ser atribuídas.</p>
    </section>
  );
}
