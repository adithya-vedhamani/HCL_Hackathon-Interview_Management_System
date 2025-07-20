import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Eye, 
  EyeOff, 
  Edit3, 
  Save, 
  X, 
  Plus,
  Trash2,
  Shield,
  UserCheck,
  Key,
  Calendar,
  Zap
} from 'lucide-react';
import { adminAPI } from '../services/api';

const AdminDetails = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });
  const [showNewAdminForm, setShowNewAdminForm] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', password: '' });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAll();
      setAdmins(response.data);
    } catch (err) {
      setError('Failed to fetch admin details');
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin) => {
    setEditingId(admin.id);
    setEditForm({ username: admin.username, password: '' });
  };

  const handleSave = async (adminId) => {
    try {
      if (!editForm.username.trim()) {
        setError('Username is required');
        return;
      }

      const updateData = { username: editForm.username };
      if (editForm.password.trim()) {
        updateData.password = editForm.password;
      }

      await adminAPI.update(adminId, updateData);
      setEditingId(null);
      setEditForm({ username: '', password: '' });
      fetchAdmins();
    } catch (err) {
      setError('Failed to update admin');
      console.error('Error updating admin:', err);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ username: '', password: '' });
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) {
      return;
    }

    try {
      await adminAPI.delete(adminId);
      fetchAdmins();
    } catch (err) {
      setError('Failed to delete admin');
      console.error('Error deleting admin:', err);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      if (!newAdmin.username.trim() || !newAdmin.password.trim()) {
        setError('Username and password are required');
        return;
      }

      await adminAPI.create(newAdmin);
      setNewAdmin({ username: '', password: '' });
      setShowNewAdminForm(false);
      fetchAdmins();
    } catch (err) {
      setError('Failed to create admin');
      console.error('Error creating admin:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading Admin Details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Admin Management</h1>
                  <p className="text-purple-100 mt-1">Manage all admin users and their access permissions</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="flex items-center px-6 py-3 text-sm font-semibold text-purple-700 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {showPasswords ? 'Hide' : 'Show'} Passwords
                </button>
                <button
                  onClick={() => setShowNewAdminForm(true)}
                  className="flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-red-100 rounded-xl">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-lg font-semibold text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all duration-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Enhanced New Admin Form */}
        {showNewAdminForm && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Plus className="h-6 w-6 mr-3 text-emerald-600" />
                Add New Admin
              </h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    👤 Username
                  </label>
                  <input
                    type="text"
                    value={newAdmin.username}
                    onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-gray-50 hover:bg-white"
                    placeholder="Enter admin username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🔐 Password
                  </label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 bg-gray-50 hover:bg-white"
                    placeholder="Enter secure password"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => {
                    setShowNewAdminForm(false);
                    setNewAdmin({ username: '', password: '' });
                  }}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAdmin}
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Create Admin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Admin List */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-8 py-6 border-b border-purple-100">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="h-6 w-6 mr-3 text-purple-600" />
              Admin Users ({admins.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gradient-to-r from-purple-50 to-blue-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>🆔 ID</span>
                    </div>
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>👤 Username</span>
                    </div>
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>🔐 Password</span>
                    </div>
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center space-x-2">
                      <span>📅 Created At</span>
                    </div>
                  </th>
                  <th className="px-8 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center justify-end space-x-2">
                      <span>⚡ Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-sm">#{admin.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      {editingId === admin.id ? (
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                        />
                      ) : (
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                            <UserCheck className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-lg font-semibold text-gray-900">{admin.username}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      {editingId === admin.id ? (
                        <input
                          type="password"
                          value={editForm.password}
                          onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                          placeholder="Leave blank to keep current"
                          className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                        />
                      ) : (
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4">
                            <Key className="h-5 w-5 text-white" />
                          </div>
                          <span className="font-mono text-lg">
                            {showPasswords ? admin.password_hash : '••••••••'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-medium text-gray-900">
                          {new Date(admin.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right">
                      {editingId === admin.id ? (
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleSave(admin.id)}
                            className="p-3 text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            title="Save Changes"
                          >
                            <Save className="h-5 w-5" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-3 text-white bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                            title="Cancel"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleEdit(admin)}
                            className="p-3 text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            title="Edit Admin"
                          >
                            <Edit3 className="h-5 w-5" />
                          </button>
                          {admins.length > 1 && (
                            <button
                              onClick={() => handleDelete(admin.id)}
                              className="p-3 text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                              title="Delete Admin"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
              <div className="flex items-center">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-green-100">Total Admins</p>
                  <p className="text-3xl font-bold text-white">{admins.length}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
              <div className="flex items-center">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-blue-100">Active Sessions</p>
                  <p className="text-3xl font-bold text-white">1</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
              <div className="flex items-center">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-purple-100">Last Updated</p>
                  <p className="text-3xl font-bold text-white">
                    {admins.length > 0 ? new Date(admins[0].created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDetails; 