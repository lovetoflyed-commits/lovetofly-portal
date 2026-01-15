import { useState, useEffect } from 'react';

interface InactiveUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  last_activity_at?: string;
  days_inactive?: number;
  created_at: string;
  plan: string;
  access_level?: string;
}

export default function InactiveUsersMonitoring() {
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [sendingReminder, setSendingReminder] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<string | null>(null);

  useEffect(() => {
    fetchInactiveUsers();
  }, [selectedDays]);

  const fetchInactiveUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/monitoring/inactive?days=${selectedDays}`);
      if (res.ok) {
        const data = await res.json();
        setInactiveUsers(data.inactiveUsers);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const sendReminders = async () => {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user');
      return;
    }

    setSendingReminder(true);
    try {
      // TODO: Call API to send reminders via email
      alert(`Reminders scheduled for ${selectedUsers.size} users`);
      setSelectedUsers(new Set());
      fetchInactiveUsers();
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending reminders');
    } finally {
      setSendingReminder(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading inactive users...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4 text-blue-900">Inactive Users Monitoring</h2>
        
        <div className="flex gap-4 items-center mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Inactive for (days)</label>
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(parseInt(e.target.value))}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          
          <div className="flex-1 text-sm text-slate-600 pt-6">
            Found <span className="font-bold text-lg">{inactiveUsers.length}</span> inactive users
          </div>

          <button
            onClick={sendReminders}
            disabled={selectedUsers.size === 0 || sendingReminder}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Send Reminders ({selectedUsers.size})
          </button>
        </div>
      </div>

      {inactiveUsers.length === 0 ? (
        <div className="text-slate-600 text-center py-8">No inactive users found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border">
            <thead>
              <tr className="bg-blue-50">
                <th className="p-2 w-8">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === inactiveUsers.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(new Set(inactiveUsers.map(u => u.id)));
                      } else {
                        setSelectedUsers(new Set());
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="p-2 text-xs">User</th>
                <th className="p-2 text-xs">Email</th>
                <th className="p-2 text-xs">Last Activity</th>
                <th className="p-2 text-xs">Days Inactive</th>
                <th className="p-2 text-xs">Plan</th>
                <th className="p-2 text-xs">Status</th>
                <th className="p-2 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inactiveUsers.map((u) => (
                <tr key={u.id} className="border-t hover:bg-slate-50">
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(u.id)}
                      onChange={() => toggleUser(u.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="p-2 text-sm font-medium">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="p-2 text-xs text-slate-600">{u.email}</td>
                  <td className="p-2 text-xs">
                    {u.last_activity_at ? (
                      new Date(u.last_activity_at).toLocaleDateString()
                    ) : (
                      <span className="text-red-600 font-bold">Never</span>
                    )}
                  </td>
                  <td className="p-2 text-xs">
                    <span className={`px-2 py-1 rounded font-bold ${
                      (u.days_inactive || 0) > 90 ? 'bg-red-100 text-red-800' :
                      (u.days_inactive || 0) > 60 ? 'bg-orange-100 text-orange-800' :
                      (u.days_inactive || 0) > 30 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {u.days_inactive || '—'}
                    </span>
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      u.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                      u.plan === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{u.plan}</span>
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      u.access_level === 'suspended' ? 'bg-red-100 text-red-800' :
                      u.access_level === 'restricted' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>{u.access_level || 'active'}</span>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => setFeedbackModal(u.id)}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Get Feedback
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-blue-900">Get Feedback</h3>
            <p className="text-sm text-slate-600 mb-4">
              Help us understand why this user has been inactive
            </p>
            
            <div className="space-y-2 mb-4">
              <label className="flex items-center">
                <input type="radio" name="reason" value="busy" className="mr-2" defaultChecked />
                <span className="text-sm">Too busy, will come back later</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="reason" value="features" className="mr-2" />
                <span className="text-sm">Missing important features</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="reason" value="price" className="mr-2" />
                <span className="text-sm">Price too high</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="reason" value="competitor" className="mr-2" />
                <span className="text-sm">Using competitor service</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="reason" value="other" className="mr-2" />
                <span className="text-sm">Other reason</span>
              </label>
            </div>

            <textarea
              placeholder="Additional comments..."
              className="w-full p-2 border rounded mb-4 text-sm"
              rows={3}
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  alert('Feedback sent!');
                  setFeedbackModal(null);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition"
              >
                Send Feedback
              </button>
              <button
                onClick={() => setFeedbackModal(null)}
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
