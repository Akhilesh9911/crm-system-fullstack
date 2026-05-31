import { useEffect, useState } from 'react'
import { profileApi } from '../api/services'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { User, Lock, Save } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const { register: rp, handleSubmit: hp, reset: resetProfile, formState: { errors: pe } } = useForm()
  const { register: rpass, handleSubmit: hpass, reset: resetPass, formState: { errors: passe } } = useForm()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await profileApi.get()
      console.log('Profile API response:', res?.data)
      const profileData = res?.data?.data ?? res?.data ?? null
      setProfile(profileData)
      resetProfile({ name: profileData?.name || '' })
    }
    catch { toast.error('Failed to load profile') } finally { setLoading(false) }
  }

  const onUpdateProfile = async (data) => {
    setSavingProfile(true)
    try { await profileApi.update(data); toast.success('Profile updated!'); fetchProfile() }
    catch (err) { toast.error(err.response?.data?.message || 'Update failed') } finally { setSavingProfile(false) }
  }

  const onChangePassword = async (data) => {
    setSavingPassword(true)
    try { await profileApi.changePassword(data); toast.success('Password changed!'); resetPass() }
    catch (err) { toast.error(err.response?.data?.message || 'Password change failed') } finally { setSavingPassword(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
  if (!profile) return <div className="max-w-2xl mx-auto"><div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500">No profile data available.</div></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1><p className="text-gray-500 text-sm mt-1">Manage your account</p></div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{profile?.name}</h2>
              <p className="text-gray-500 text-sm">{profile?.email}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${profile?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{profile?.role}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4"><User size={16} className="text-blue-600" /><h3 className="font-semibold text-gray-900">Personal Information</h3></div>
          <form onSubmit={hp(onUpdateProfile)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input {...rp('name', { required: 'Name is required' })} className="input-field" />
              {pe.name && <p className="text-red-500 text-xs mt-1">{pe.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (cannot change)</label>
              <input value={profile?.email || ''} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
              <input value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ''} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2"><Save size={15} />{savingProfile ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4"><Lock size={16} className="text-blue-600" /><h3 className="font-semibold text-gray-900">Change Password</h3></div>
          <form onSubmit={hpass(onChangePassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" {...rpass('currentPassword', { required: 'Required' })} className="input-field" placeholder="••••••••" />
              {passe.currentPassword && <p className="text-red-500 text-xs mt-1">{passe.currentPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" {...rpass('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} className="input-field" placeholder="••••••••" />
              {passe.newPassword && <p className="text-red-500 text-xs mt-1">{passe.newPassword.message}</p>}
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={savingPassword} className="btn-primary flex items-center gap-2"><Lock size={15} />{savingPassword ? 'Changing...' : 'Change Password'}</button>
            </div>
          </form>
        </div>
    </div>
  )
}
