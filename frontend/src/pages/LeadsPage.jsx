import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import SearchInput from '../components/SearchInput'
import { leadsApi } from '../api/services'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, RefreshCw, UserCheck, Pencil, Trash2, Download } from 'lucide-react'

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST']
const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Email', 'Cold Call', 'Other']

function LeadForm({ onSubmit, defaultValues, loading }) {
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select {...register('status')} className="input-field">{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
          <select {...register('source')} className="input-field">
            <option value="">— Select —</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save Lead'}</button>
      </div>
    </form>
  )
}

function exportCsv(data) {
  if (!data.length) { toast.error('No data to export'); return }
  const headers = ['ID','Name','Email','Phone','Company','Status','Source','Assigned To','Created At']
  const rows = data.map(l => [l.id, l.name, l.email, l.phone||'', l.company||'', l.status, l.source||'', l.assignedTo?.name||'', l.createdAt ? new Date(l.createdAt).toLocaleDateString() : ''])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = 'leads_export.csv'; a.click()
  toast.success('CSV exported!')
}

export default function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ status: '', source: '', search: '' })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editLead, setEditLead] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const searchTerm = filters.search.trim().toLowerCase()
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

  const fetchLeads = useCallback(async (page = 0) => {
    setLoading(true)
    try {
      const params = { page, size: 10 }
      if (filters.status) params.status = filters.status
      if (filters.source) params.source = filters.source
      const res = await leadsApi.getAll(params)
      const p = res?.data?.data ?? res?.data
      if (Array.isArray(p)) {
        const uniqueRows = dedupeByIdentity(p)
        console.log('API RESPONSE:', res.data)
        console.log('API RESPONSE LENGTH:', p.length)
        console.log('Leads unique rows:', uniqueRows)
        setLeads(uniqueRows)
        setPagination({ page: 0, size: uniqueRows.length || 10, totalElements: uniqueRows.length, totalPages: 1 })
      } else {
        const rows = Array.isArray(p?.content) ? p.content : []
        const uniqueRows = dedupeByIdentity(rows)
        console.log('API RESPONSE:', res.data)
        console.log('API RESPONSE LENGTH:', rows.length)
        console.log('Leads unique rows:', uniqueRows)
        setLeads(uniqueRows)
        setPagination({
          page: Number.isFinite(p?.number) ? p.number : 0,
          size: Number.isFinite(p?.size) ? p.size : 10,
          totalElements: Number.isFinite(p?.totalElements) ? p.totalElements : uniqueRows.length,
          totalPages: Number.isFinite(p?.totalPages) ? p.totalPages : 1,
        })
      }
    } catch (error) {
      console.error('Leads fetch failed:', error?.response?.status, error?.response?.data, error)
      if (isCriticalError(error)) toast.error('Failed to load leads')
      setLeads([])
      setPagination({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
    }
    finally { setLoading(false) }
  }, [filters.status, filters.source])

  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads
    return leads.filter((lead) => {
      const fields = [
        lead.name,
        lead.email,
        lead.company,
        lead.phone,
        lead.source,
        lead.status,
      ]
      return fields.some((value) => String(value || '').toLowerCase().includes(searchTerm))
    })
  }, [leads, searchTerm])

  useEffect(() => {
    console.log('STATE DATA:', leads)
    console.log('STATE LENGTH:', leads.length)
  }, [leads])

  useEffect(() => {
    console.log('RENDERED ROWS LENGTH:', filteredLeads.length)
  }, [filteredLeads])

  const tablePagination = isSearchActive
    ? { page: 0, size: filteredLeads.length || 10, totalElements: filteredLeads.length, totalPages: 1 }
    : pagination

  useEffect(() => {
    fetchLeads(0)
  }, [fetchLeads])

  const handleSave = async (data) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      if (editLead) { await leadsApi.update(editLead.id, data); toast.success('Lead updated') }
      else { await leadsApi.create(data); toast.success('Lead created') }
      setModalOpen(false); setEditLead(null); fetchLeads(pagination.page)
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    finally { submittingRef.current = false; setSubmitting(false) }
  }

  const handleDelete = async (lead) => {
    if (!confirm(`Delete "${lead.name}"?`)) return
    try { await leadsApi.delete(lead.id); toast.success('Deleted'); fetchLeads(pagination.page) }
    catch { toast.error('Delete failed') }
  }

  const handleConvert = async (lead) => {
    if (!confirm(`Convert "${lead.name}" to Contact?`)) return
    try { await leadsApi.convert(lead.id); toast.success('Converted to contact!'); fetchLeads(pagination.page) }
    catch (err) { toast.error(err.response?.data?.message || 'Conversion failed') }
  }

  const handleExport = async () => {
    try {
      const res = await leadsApi.getAll({ page: 0, size: 1000 })
      const payload = res?.data?.data ?? res?.data
      const exportData = Array.isArray(payload)
        ? payload
        : (payload?.content || [])
      exportCsv(exportData)
    }
    catch { toast.error('Export failed') }
  }

  const columns = [
    { key: 'name', label: 'Name', render: r => <span className="font-medium text-gray-900">{r.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'company', label: 'Company', render: r => r.company || '—' },
    { key: 'status', label: 'Status', render: r => <Badge value={r.status} /> },
    { key: 'source', label: 'Source', render: r => r.source || '—' },
    { key: 'assignedTo', label: 'Assigned To', render: r => r.assignedTo?.name || '—' },
    { key: 'actions', label: 'Actions', width: '130px', render: r => (
      <div className="flex items-center gap-1">
        <button onClick={() => handleConvert(r)} title="Convert" className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><UserCheck size={15} /></button>
        <button onClick={() => { setEditLead(r); setModalOpen(true) }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={15} /></button>
        <button onClick={() => handleDelete(r)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-500 text-sm mt-1">{isSearchActive ? filteredLeads.length : pagination.totalElements} total leads</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2"><Download size={15} />Export CSV</button>
            <button onClick={() => { setEditLead(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Lead</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
          <SearchInput
            className="flex-1 min-w-[200px]"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Search name, email, company..."
          />
          <select className="input-field w-40" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input-field w-40" value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}>
            <option value="">All Sources</option>{SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setFilters({ status: '', source: '', search: '' })} className="btn-secondary flex items-center gap-1.5"><RefreshCw size={14} />Reset</button>
        </div>

        <Table
          columns={columns}
          data={filteredLeads}
          loading={loading}
          pagination={tablePagination}
          onPageChange={isSearchActive ? (() => {}) : fetchLeads}
        />

        <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditLead(null) }} title={editLead ? 'Edit Lead' : 'Add New Lead'}>
          <LeadForm onSubmit={handleSave} defaultValues={editLead || { status: 'NEW' }} loading={submitting} />
        </Modal>
    </div>
  )
}
