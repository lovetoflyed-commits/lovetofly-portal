"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function AdminBusinessPage() {
  const router = useRouter();
  // State declarations
  const [editContractId, setEditContractId] = React.useState<number | null>(null);
  const [editContractName, setEditContractName] = React.useState<string>('');
  const [deleteContractId, setDeleteContractId] = React.useState<number | null>(null);
  const [editPartnershipId, setEditPartnershipId] = React.useState<number | null>(null);
  const [editPartnershipName, setEditPartnershipName] = React.useState<string>('');
  const [editPartnershipType, setEditPartnershipType] = React.useState<string>('');
  const [deletePartnershipId, setDeletePartnershipId] = React.useState<number | null>(null);
  const [showContractModal, setShowContractModal] = React.useState<boolean>(false);
  const [showPartnershipModal, setShowPartnershipModal] = React.useState<boolean>(false);
  const [contracts, setContracts] = React.useState<any[]>([]);
  const [partnerships, setPartnerships] = React.useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = React.useState<boolean>(true);
  const [loadingPartnerships, setLoadingPartnerships] = React.useState<boolean>(true);
  const [newContractName, setNewContractName] = React.useState<string>('');
  const [newPartnershipName, setNewPartnershipName] = React.useState<string>('');
  const [newPartnershipType, setNewPartnershipType] = React.useState<string>('');

  // Edit contract
  const handleEditContract = async () => {
    if (!editContractName) return;
    const res = await fetch('/api/admin/business/contracts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editContractId, name: editContractName })
    });
    const data = await res.json();
    setContracts(prev => prev.map((c: any) => c.id === editContractId ? data.contract : c));
    setEditContractId(null);
    setEditContractName('');
  };

  // Delete contract
  const handleDeleteContract = async () => {
    const res = await fetch('/api/admin/business/contracts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteContractId })
    });
    if (res.ok) setContracts(prev => prev.filter((c: any) => c.id !== deleteContractId));
    setDeleteContractId(null);
  };

  // Edit partnership
  const handleEditPartnership = async () => {
    if (!editPartnershipName) return;
    const res = await fetch('/api/admin/business/partnerships', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editPartnershipId, name: editPartnershipName, type: editPartnershipType })
    });
    const data = await res.json();
    setPartnerships(prev => prev.map((p: any) => p.id === editPartnershipId ? data.partnership : p));
    setEditPartnershipId(null);
    setEditPartnershipName('');
    setEditPartnershipType('');
  };

  // Delete partnership
  const handleDeletePartnership = async () => {
    const res = await fetch('/api/admin/business/partnerships', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deletePartnershipId })
    });
    if (res.ok) setPartnerships(prev => prev.filter((p: any) => p.id !== deletePartnershipId));
    setDeletePartnershipId(null);
  };

  // Fetch contracts
  React.useEffect(() => {
    fetch('/api/admin/business/contracts')
      .then(res => res.json())
      .then(data => {
        setContracts(data.contracts || []);
        setLoadingContracts(false);
      });
    fetch('/api/admin/business/partnerships')
      .then(res => res.json())
      .then(data => {
        setPartnerships(data.partnerships || []);
        setLoadingPartnerships(false);
      });
  }, []);

  // Add contract
  const handleAddContract = async () => {
    if (!newContractName) return;
    const res = await fetch('/api/admin/business/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newContractName })
    });
    const data = await res.json();
    setContracts([...contracts, data.contract]);
    setShowContractModal(false);
    setNewContractName('');
  };

  // Add partnership
  const handleAddPartnership = async () => {
    if (!newPartnershipName) return;
    const res = await fetch('/api/admin/business/partnerships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPartnershipName, type: newPartnershipType })
    });
    const data = await res.json();
    setPartnerships([...partnerships, data.partnership]);
    setShowPartnershipModal(false);
    setNewPartnershipName('');
    setNewPartnershipType('');
  };
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-black text-yellow-900 mb-4">💼 Business Management</h1>
        <p className="text-slate-700 mb-6">Manage business operations</p>

        {/* Contracts Section */}
        <section className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-2 text-yellow-900">Contracts</h2>
          <p className="text-slate-600 mb-4">Manage and review business contracts with partners, suppliers, and clients.</p>
          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold mb-4" onClick={() => setShowContractModal(true)}>
            Add New Contract
          </button>
          {loadingContracts ? (
            <div className="text-slate-400">Loading contracts...</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {contracts.map(contract => (
                <li key={contract.id} className="py-2 flex justify-between items-center">
                  {editContractId === contract.id ? (
                    <>
                      <input
                        type="text"
                        className="border rounded p-1 mr-2"
                        value={editContractName}
                        onChange={e => setEditContractName(e.target.value)}
                      />
                      <button className="px-2 py-1 bg-green-600 text-white rounded mr-1" onClick={handleEditContract}>Save</button>
                      <button className="px-2 py-1 bg-gray-400 text-white rounded" onClick={() => setEditContractId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span>{contract.name}</span>
                      <span className={`px-2 py-1 rounded text-xs ${contract.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{contract.status}</span>
                      <button className="ml-2 px-2 py-1 bg-yellow-500 text-white rounded" onClick={() => { setEditContractId(contract.id); setEditContractName(contract.name); }}>Edit</button>
                      <button className="ml-2 px-2 py-1 bg-red-600 text-white rounded" onClick={() => setDeleteContractId(contract.id)}>Delete</button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Partnerships Section */}
        <section className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-2 text-yellow-900">Partnerships</h2>
          <p className="text-slate-600 mb-4">View and manage strategic partnerships and collaborations.</p>
          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold mb-4" onClick={() => setShowPartnershipModal(true)}>
            Add New Partnership
          </button>
          {loadingPartnerships ? (
            <div className="text-slate-400">Loading partnerships...</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {partnerships.map(partner => (
                <li key={partner.id} className="py-2 flex justify-between items-center">
                  {editPartnershipId === partner.id ? (
                    <>
                      <input
                        type="text"
                        className="border rounded p-1 mr-2"
                        value={editPartnershipName}
                        onChange={e => setEditPartnershipName(e.target.value)}
                      />
                      <input
                        type="text"
                        className="border rounded p-1 mr-2"
                        value={editPartnershipType}
                        onChange={e => setEditPartnershipType(e.target.value)}
                        placeholder="Type"
                      />
                      <button className="px-2 py-1 bg-green-600 text-white rounded mr-1" onClick={handleEditPartnership}>Save</button>
                      <button className="px-2 py-1 bg-gray-400 text-white rounded" onClick={() => setEditPartnershipId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span>{partner.name}</span>
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">{partner.type}</span>
                      <button className="ml-2 px-2 py-1 bg-yellow-500 text-white rounded" onClick={() => { setEditPartnershipId(partner.id); setEditPartnershipName(partner.name); setEditPartnershipType(partner.type); }}>Edit</button>
                      <button className="ml-2 px-2 py-1 bg-red-600 text-white rounded" onClick={() => setDeletePartnershipId(partner.id)}>Delete</button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
                {/* Delete Contract Modal */}
                {deleteContractId && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
                      <h3 className="text-xl font-bold mb-4 text-red-700">Delete Contract</h3>
                      <p className="mb-4 text-slate-600">Are you sure you want to delete this contract?</p>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold" onClick={handleDeleteContract}>Delete</button>
                        <button className="px-4 py-2 bg-gray-400 text-white rounded-lg font-bold" onClick={() => setDeleteContractId(null)}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Partnership Modal */}
                {deletePartnershipId && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
                      <h3 className="text-xl font-bold mb-4 text-red-700">Delete Partnership</h3>
                      <p className="mb-4 text-slate-600">Are you sure you want to delete this partnership?</p>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold" onClick={handleDeletePartnership}>Delete</button>
                        <button className="px-4 py-2 bg-gray-400 text-white rounded-lg font-bold" onClick={() => setDeletePartnershipId(null)}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
        </section>

        {/* Analytics Section */}
        <section className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-2 text-yellow-900">Analytics</h2>
          <p className="text-slate-600 mb-2">Business performance analytics and insights.</p>
          <div className="w-full h-32 bg-slate-100 rounded flex flex-col items-center justify-center text-slate-700">
            <div className="text-2xl font-bold">Revenue: R$ 120.000</div>
            <div className="text-lg">Active Contracts: {contracts.length}</div>
            <div className="text-lg">Partners: {partnerships.length}</div>
          </div>
        </section>

        {/* Contract Modal */}
        {showContractModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-yellow-900">Add New Contract</h3>
              <input
                type="text"
                className="w-full border rounded p-2 mb-4"
                placeholder="Contract name"
                value={newContractName}
                onChange={e => setNewContractName(e.target.value)}
              />
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-bold" onClick={handleAddContract}>Add</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold" onClick={() => setShowContractModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Partnership Modal */}
        {showPartnershipModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4 text-yellow-900">Add New Partnership</h3>
              <input
                type="text"
                className="w-full border rounded p-2 mb-2"
                placeholder="Partnership name"
                value={newPartnershipName}
                onChange={e => setNewPartnershipName(e.target.value)}
              />
              <input
                type="text"
                className="w-full border rounded p-2 mb-4"
                placeholder="Type (e.g. Technology, Fuel Provider)"
                value={newPartnershipType}
                onChange={e => setNewPartnershipType(e.target.value)}
              />
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-bold" onClick={handleAddPartnership}>Add</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold" onClick={() => setShowPartnershipModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button onClick={() => router.push('/admin')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-800">← Back to Admin Dashboard</button>
        </div>
      </div>
    </div>
  );
}