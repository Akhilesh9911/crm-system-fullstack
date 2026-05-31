import { useEffect, useState } from 'react'
import Modal from '../components/Modal'
import { adminApi } from '../api/services'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, Trash2, Shield, User, RefreshCw } from 'lucide-react'

function UserForm({ onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { role: 'USER' } })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input {...register('name', { required: 'Required' })} className="input-field" placeholder="John Doe" />{errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}</div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" {...register('email', { required: 'Required' })} className="input-field" placeholder="john@example.com" />{errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}</div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Password *</label><input type="password" {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })} className="input-field" placeholder="••••••••" />{errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}</div>
      <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label><select {...register('role')} className="input-field"><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></div>
      <div className="flex justify-end"><button type="submit" disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Create User'}</button></div>
    </form>
  )
}

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.role !== 'ADMIN') { toast.error('Access denied — Admins only'); navigate('/'); return }
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getUsers()
      setUsers(Array.isArray(res?.data?.data) ? res.data.data : [])
    }
    catch { toast.error('Failed to load users') } finally { setLoading(false) }
  }

  const handleCreate = async (data) => {
    setSubmitting(true)
    try { await adminApi.createUser(data); toast.success('User created!'); setModalOpen(false); fetchUsers() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSubmitting(false) }
  }

  const handleRoleChange = async (userId, role) => {
    try { await adminApi.updateRole(userId, role); toast.success('Role updated!'); fetchUsers() }
    catch { toast.error('Failed') }
  }

  const handleDelete = async (u) => {
    if (u.id === user?.id) { toast.error("Can't delete your own account!"); return }
    if (!confirm(`Delete "${u.name}"?`)) return
    try { await adminApi.deleteUser(u.id); toast.success('Deleted'); fetchUsers() } catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1><p className="text-gray-500 text-sm mt-1">Manage team members and permissions</p></div>
          <div className="flex items-center gap-2">
            <button onClick={fetchUsers} className="btn-secondary flex items-center gap-2"><RefreshCw size={15} />Refresh</button>
            <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2"><Plus size={16} />Add User</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"><div className="bg-blue-100 p-2 rounded-lg"><User size={20} className="text-blue-600" /></div><div><p className="text-xs text-gray-500">Total Users</p><p className="text-xl font-bold">{users.length}</p></div></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"><div className="bg-purple-100 p-2 rounded-lg"><Shield size={20} className="text-purple-600" /></div><div><p className="text-xs text-gray-500">Admins</p><p className="text-xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</p></div></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3"><div className="bg-green-100 p-2 rounded-lg"><User size={20} className="text-green-600" /></div><div><p className="text-xs text-gray-500">Regular Users</p><p className="text-xl font-bold">{users.filter(u => u.role === 'USER').length}</p></div></div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Team Members</h2></div>
          {loading ? <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div> : (
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">{u.name?.charAt(0).toUpperCase()}</div><div><p className="font-medium text-gray-900">{u.name}</p>{u.id === user?.id && <p className="text-xs text-blue-500">You</p>}</div></div></td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} disabled={u.id === user?.id}
                        className={`text-xs px-2 py-1 rounded-lg border font-medium ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'} ${u.id === user?.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <option value="USER">USER</option><option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4"><button onClick={() => handleDelete(u)} disabled={u.id === user?.id} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New User">
          <UserForm onSubmit={handleCreate} loading={submitting} />
        </Modal>
    </div>
  )
}
