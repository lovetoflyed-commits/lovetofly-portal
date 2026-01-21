import { useState, useEffect, useRef } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  aviation_role?: string;
  is_hangar_owner?: boolean;
  plan: string;
  created_at: string;
  access_level?: string;
  access_reason?: string;
  active_warnings?: number;
  active_strikes?: number;
  is_banned?: boolean;
  last_activity_at?: string;
  days_inactive?: number;
}

interface ModerationAction {
  actionType: 'warning' | 'strike' | 'suspend' | 'ban' | 'restore';
  severity: 'low' | 'normal' | 'high' | 'critical';
  reason: string;
  suspensionDays?: number;
}

export default function UserManagementPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationData, setModerationData] = useState<ModerationAction>({
    actionType: 'warning',
    severity: 'normal',
    reason: ''
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [editData, setEditData] = useState({ role: '', plan: '' });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const actionType = moderationData.actionType as string;

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(searchQuery && { q: searchQuery }),
        page: page.toString(),
        limit: '20'
      });
      
      const res = await fetch(`/api/admin/users/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleModeration = async () => {
    if (!selectedUser || !moderationData.reason.trim()) {
      alert('Please enter a reason for this action');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/moderation/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          actionType: moderationData.actionType,
          reason: moderationData.reason,
          severity: moderationData.severity,
          suspensionDays: moderationData.suspensionDays,
          adminId: 1 // TODO: Get from auth context
        })
      });

      if (res.ok) {
        alert(`User ${moderationData.actionType} recorded successfully`);
        setShowModerationModal(false);
        setModerationData({ actionType: 'warning', severity: 'normal', reason: '' });
        setSelectedUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error applying moderation action');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('Role updated successfully!');
        setSelectedUser(null);
        fetchUsers();
      } else {
        console.error('API Error:', data);
        alert(`Error updating role: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Network/Parse Error:', error);
      alert(`Error updating role: ${error instanceof Error ? error.message : 'Network error. Please check console for details.'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserUpdate = async (updates: { role?: string; plan?: string }) => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        const updateType = updates.role ? 'Role' : 'Plan';
        alert(`${updateType} updated successfully!`);
        setSelectedUser(null);
        setEditData({ role: '', plan: '' });
        fetchUsers();
      } else {
        console.error('API Error:', data);
        alert(`Error: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error updating user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading users...</div>;
  }

  const getAccessLevelBadge = (level?: string) => {
    const levels: Record<string, { bg: string; text: string; icon: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: '✓' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚠' },
      restricted: { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🚫' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', icon: '⛔' },
      banned: { bg: 'bg-gray-800', text: 'text-white', icon: '🔒' }
    };
    const style = levels[level || 'active'];
    return (
      <span className={`${style.bg} ${style.text} px-2 py-1 rounded text-xs font-bold`}>
        {style.icon} {level || 'active'}
      </span>
    );
  };

  const filteredUsers = users.filter(u => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'banned') return u.is_banned;
    if (filterStatus === 'suspended') return u.access_level === 'suspended';
    if (filterStatus === 'warned') return (u.active_warnings || 0) > 0;
    if (filterStatus === 'inactive') return (u.days_inactive || 0) > 30;
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4 text-green-900">Portal Users Management</h2>
        
        {/* Search Bar */}
        <div className="mb-4 flex gap-2">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Users</option>
            <option value="banned">Banned</option>
            <option value="suspended">Suspended</option>
            <option value="warned">Warned</option>
            <option value="inactive">Inactive (30+ days)</option>
          </select>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-slate-600 text-center py-8">No users found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border">
            <thead>
              <tr className="bg-green-50">
                <th className="p-2 text-xs">Name</th>
                <th className="p-2 text-xs">Email</th>
                <th className="p-2 text-xs">Status</th>
                <th className="p-2 text-xs">Role</th>
                <th className="p-2 text-xs">Moderation</th>
                <th className="p-2 text-xs">Activity</th>
                <th className="p-2 text-xs">Plan</th>
                <th className="p-2 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t hover:bg-slate-50">
                  <td className="p-2 text-sm font-medium">{u.name}</td>
                  <td className="p-2 text-xs text-slate-600">{u.email}</td>
                  <td className="p-2">{getAccessLevelBadge(u.access_level)}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      u.role === 'master' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'admin' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{u.role}</span>
                  </td>
                  <td className="p-2 text-xs">
                    {u.active_warnings! > 0 && <span className="mr-1">⚠ {u.active_warnings}</span>}
                    {u.active_strikes! > 0 && <span className="mr-1">⛔ {u.active_strikes}</span>}
                    {u.is_banned && <span className="mr-1">🔒 Banned</span>}
                    {u.active_warnings === 0 && u.active_strikes === 0 && !u.is_banned && '—'}
                  </td>
                  <td className="p-2 text-xs">
                    {u.last_activity_at ? (
                      <span>{u.days_inactive} days ago</span>
                    ) : (
                      <span className="text-red-600">Never</span>
                    )}
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      u.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                      u.plan === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                      u.plan === 'free' ? 'bg-gray-100 text-gray-800' :
                      u.plan === 'standard' ? 'bg-slate-100 text-slate-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {u.plan ? u.plan.toUpperCase() : 'N/A'}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <a
                        href={`/admin/users/${u.id}`}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        title="View full profile"
                      >
                        Profile
                      </a>
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
                      >
                        Edit
                      </button>
                      {u.access_level && u.access_level !== 'active' ? (
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setModerationData({ actionType: 'restore', severity: 'normal', reason: 'User access restored' });
                            setShowModerationModal(true);
                          }}
                          className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition"
                          title="Restore this user's access"
                        >
                          ↩ Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowModerationModal(true);
                          }}
                          className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition"
                        >
                          Moderate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}

      {/* Edit User Modal */}
      {selectedUser && !showModerationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-green-900">Edit User: {selectedUser.name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Portal Role</label>
                <select
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  defaultValue={selectedUser.role}
                  onChange={e => setEditData({ ...editData, role: e.target.value })}
                  disabled={actionLoading}
                >
                  <option value="">-- Select Role --</option>
                  <option value="user">User (Regular access)</option>
                  <option value="admin">Admin (Management access)</option>
                  <option value="master">Master (Full access)</option>
                </select>
                <div className="mt-1 text-xs text-gray-500">Controls portal permissions</div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Membership Plan</label>
                <select
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={selectedUser.plan}
                  onChange={e => setEditData({ ...editData, plan: e.target.value })}
                  disabled={actionLoading}
                >
                  <option value="">-- Select Plan --</option>
                  <option value="free">FREE - Basic access</option>
                  <option value="standard">STANDARD - Standard features</option>
                  <option value="premium">PREMIUM - Premium features</option>
                  <option value="pro">PRO - Professional features</option>
                </select>
                <div className="mt-1 text-xs text-gray-500">Determines portal features available</div>
              </div>
            </div>

            <div className="text-sm space-y-2 p-3 bg-gray-50 rounded my-4 border">
              <div><span className="font-medium">Current Plan:</span> {selectedUser.plan?.toUpperCase() || 'N/A'}</div>
              <div><span className="font-medium">Current Role:</span> {selectedUser.role}</div>
              <div><span className="font-medium">Aviation Role:</span> {selectedUser.aviation_role || 'Not set'}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (editData.role) handleUserUpdate({ role: editData.role });
                  else if (editData.plan) handleUserUpdate({ plan: editData.plan });
                  else alert('Please select a role or plan to change');
                }}
                disabled={actionLoading || (!editData.role && !editData.plan)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Save Changes'}
              </button>
              <button
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded font-bold hover:bg-slate-300 transition"
                onClick={() => {
                  setSelectedUser(null);
                  setEditData({ role: '', plan: '' });
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      {selectedUser && showModerationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-orange-900">
              {actionType === 'restore' ? 'Restore Access' : 'Moderate User'}: {selectedUser.name}
            </h3>
            
            <div className="space-y-4">
              {actionType !== 'restore' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Action Type</label>
                    <select
                      value={actionType}
                      onChange={e => setModerationData({...moderationData, actionType: e.target.value as any})}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="warning">⚠ Warning</option>
                      <option value="strike">⛔ Strike</option>
                      <option value="suspend">🚫 Suspend</option>
                      <option value="ban">🔒 Ban</option>
                      {selectedUser.access_level && selectedUser.access_level !== 'active' && (
                        <option value="restore">↩ Restore Access</option>
                      )}
                    </select>
                  </div>

                  {actionType !== 'restore' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Severity</label>
                        <select
                          value={moderationData.severity}
                          onChange={e => setModerationData({...moderationData, severity: e.target.value as any})}
                          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>

                      {actionType === 'suspend' && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Suspension Duration (days)</label>
                          <input
                            type="number"
                            min="1"
                            defaultValue={7}
                            onChange={e => setModerationData({...moderationData, suspensionDays: parseInt(e.target.value)})}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {actionType === 'restore' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    ✓ Restoring access will:
                  </p>
                  <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
                    <li>Clear all active warnings and strikes</li>
                    <li>Remove suspension/ban restrictions</li>
                    <li>Set user status to <strong>ACTIVE</strong></li>
                    <li>Record the restoration in audit log</li>
                  </ul>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  {actionType === 'restore' ? 'Notes (optional)' : 'Reason *'}
                </label>
                <textarea
                  value={moderationData.reason}
                  onChange={e => setModerationData({...moderationData, reason: e.target.value})}
                  placeholder={actionType === 'restore' ? 'Explain why access is being restored...' : 'Explain why this action is necessary...'}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleModeration}
                disabled={actionLoading || (actionType !== 'restore' && !moderationData.reason.trim())}
                className={`flex-1 px-4 py-2 ${
                  actionType === 'restore' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                } text-white rounded font-bold transition disabled:opacity-50`}
              >
                {actionLoading ? 'Processing...' : actionType === 'restore' ? 'Restore Access' : 'Apply Action'}
              </button>
              <button
                onClick={() => {
                  setShowModerationModal(false);
                  setSelectedUser(null);
                  setModerationData({ actionType: 'warning', severity: 'normal', reason: '' });
                }}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded font-bold hover:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
