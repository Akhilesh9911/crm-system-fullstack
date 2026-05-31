import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Table from '../components/Table'
import Modal from '../components/Modal'
import SearchInput from '../components/SearchInput'
import { contactsApi } from '../api/services'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react'

function ContactForm({ onSubmit, defaultValues, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input {...register('name', { required: 'Required' })} className="input-field" placeholder="Full name" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" {...register('email', { required: 'Required' })} className="input-field" placeholder="email@example.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input {...register('phone')} className="input-field" placeholder="555-0100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
          <input {...register('company')} className="input-field" placeholder="Company name" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input {...register('address')} className="input-field" placeholder="123 Main St, City, State" />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save Contact'}</button>
      </div>
    </form>
  )
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editContact, setEditContact] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const searchTerm = search.trim().toLowerCase()
  const isSearchActive = searchTerm.length > 0
  const isCriticalError = (error) => {
    const status = error?.response?.status
    return status === 401 || status === 403 || (typeof status === 'number' && status >= 500)
  }

  const dedupeByIdentity = (items) => {
    const map = new Map()
    ;(Array.isArray(items) ? items : []).forEach((item) => {
      const key = item?.id ?? item?.email ?? `${item?.name || 'unknown'}-${item?.company || 'n/a'}`
      if (!map.has(key)) map.set(key, item)
    })
    return Array.from(map.values())
  }

  const fetchContacts = useCallback(async (page = 0) => {
    setLoading(true)
    try {
      const params = { page, size: 10 }
      const res = await contactsApi.getAll(params)
      const p = res?.data?.data ?? res?.data
      if (Array.isArray(p)) {
        const uniqueRows = dedupeByIdentity(p)
        console.log('API RESPONSE:', res.data)
        console.log('API RESPONSE LENGTH:', p.length)
        console.log('Contacts unique rows:', uniqueRows)
        setContacts(uniqueRows)
        setPagination({ page: 0, size: uniqueRows.length || 10, totalElements: uniqueRows.length, totalPages: 1 })
      } else {
        const rows = Array.isArray(p?.content) ? p.content : []
        const uniqueRows = dedupeByIdentity(rows)
        console.log('API RESPONSE:', res.data)
        console.log('API RESPONSE LENGTH:', rows.length)
        console.log('Contacts unique rows:', uniqueRows)
        setContacts(uniqueRows)
        setPagination({
          page: Number.isFinite(p?.number) ? p.number : 0,
          size: Number.isFinite(p?.size) ? p.size : 10,
          totalElements: Number.isFinite(p?.totalElements) ? p.totalElements : uniqueRows.length,
          totalPages: Number.isFinite(p?.totalPages) ? p.totalPages : 1,
        })
      }
    } catch (error) {
      if (isCriticalError(error)) toast.error('Failed to load contacts')
      setContacts([])
      setPagination({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
    }
    finally { setLoading(false) }
  }, [])

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts
    return contacts.filter((contact) => {
      const fields = [
        contact.name,
        contact.email,
        contact.company,
        contact.phone,
        contact.address,
      ]
      return fields.some((value) => String(value || '').toLowerCase().includes(searchTerm))
    })
  }, [contacts, searchTerm])

  useEffect(() => {
    console.log('STATE DATA:', contacts)
    console.log('STATE LENGTH:', contacts.length)
  }, [contacts])

  useEffect(() => {
    console.log('RENDERED ROWS LENGTH:', filteredContacts.length)
  }, [filteredContacts])

  const tablePagination = isSearchActive
    ? { page: 0, size: filteredContacts.length || 10, totalElements: filteredContacts.length, totalPages: 1 }
    : pagination

  useEffect(() => {
    fetchContacts(0)
  }, [fetchContacts])

  const handleSave = async (data) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      if (editContact) { await contactsApi.update(editContact.id, data); toast.success('Contact updated') }
      else { await contactsApi.create(data); toast.success('Contact created') }
      setModalOpen(false); setEditContact(null); fetchContacts(pagination.page)
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    finally { submittingRef.current = false; setSubmitting(false) }
  }

  const handleDelete = async (c) => {
    if (!confirm(`Delete "${c.name}"?`)) return
    try { await contactsApi.delete(c.id); toast.success('Deleted'); fetchContacts(pagination.page) }
    catch { toast.error('Delete failed') }
  }

  const columns = [
    { key: 'name', label: 'Name', render: r => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: r => r.phone || '—' },
    { key: 'company', label: 'Company', render: r => r.company || '—' },
    { key: 'address', label: 'Address', render: r => r.address || '—' },
    { key: 'actions', label: 'Actions', width: '100px', render: r => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setEditContact(r); setModalOpen(true) }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={15} /></button>
        <button onClick={() => handleDelete(r)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-500 text-sm mt-1">{isSearchActive ? filteredContacts.length : pagination.totalElements} total contacts</p>
          </div>
          <button onClick={() => { setEditContact(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Contact</button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <SearchInput
            className="flex-1"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, company..."
          />
          <button onClick={() => setSearch('')} className="btn-secondary flex items-center gap-1.5"><RefreshCw size={14} />Reset</button>
        </div>

        <Table
          columns={columns}
          data={filteredContacts}
          loading={loading}
          pagination={tablePagination}
          onPageChange={isSearchActive ? (() => {}) : fetchContacts}
        />

        <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditContact(null) }} title={editContact ? 'Edit Contact' : 'Add New Contact'}>
          <ContactForm onSubmit={handleSave} defaultValues={editContact || {}} loading={submitting} />
        </Modal>
    </div>
  )
}
