import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { supabase } from '../lib/supabase';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student',
    department_id: '',
    is_active: true
  });

  // Fetch users and departments from Supabase
  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, role, department_id, is_active, created_at');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error.message);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error.message);
    }
  };

  const getDepartmentName = (id) => {
    const dept = departments.find(d => d.id === id);
    return dept ? dept.name : '-';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        // Update user
        const updates = {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          department_id: formData.department_id || null,
          is_active: formData.is_active
        };

        if (formData.password) updates.password = formData.password;

        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', editingUser.id);

        if (error) throw error;

        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updates } : u));
      } else {
        // Insert new user
        const { data, error } = await supabase
          .from('users')
          .insert([
            {
              full_name: formData.full_name,
              email: formData.email,
              password: formData.password,
              role: formData.role,
              department_id: formData.department_id || null,
              is_active: formData.is_active
            }
          ])
          .select()
          .single();

        if (error) throw error;

        setUsers([...users, data]);
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving user:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
      department_id: user.department_id || '',
      is_active: user.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      role: 'student',
      department_id: '',
      is_active: true
    });
    setEditingUser(null);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'staff': return 'bg-blue-100 text-blue-700';
      case 'student': return 'bg-teal-100 text-teal-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });



  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              User Management
            </h1>
            <p className="text-gray-500">Manage user accounts, roles, and permissions</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:scale-105 flex items-center gap-2"
            style={{ backgroundColor: '#1A1F36' }}
          >
            <span>➕</span>
            <span>Add New User</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'admin', 'staff', 'student'].map((role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterRole === role 
                      ? 'bg-teal-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">User</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Role</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Department</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Joined</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                          {user.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.full_name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {user.department || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {user.created_at}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-blue-600"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-red-600"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setShowModal(false)}
          >
            <div 
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required={!editingUser}
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="student">Student</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">No Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-500 focus:ring-teal-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">Active account</label>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: '#1A1F36' }}
                  >
                    {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;

