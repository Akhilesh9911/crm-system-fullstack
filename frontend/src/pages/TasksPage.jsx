import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Table from '../components/Table'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import SearchInput from '../components/SearchInput'
import { tasksApi } from '../api/services'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, RefreshCw, CheckCircle2, Pencil, Trash2, AlertCircle } from 'lucide-react'

const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW']
const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED']
const RELATED_TYPES = ['LEAD', 'CONTACT', 'DEAL']

function TaskForm({ onSubmit, defaultValues, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input {...register('title', { required: 'Required' })} className="input-field" placeholder="Task title" />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea {...register('description')} className="input-field" rows={3} placeholder="Task details..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" {...register('dueDate')} className="input-field" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label><select {...register('priority')} className="input-field">{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select {...register('status')} className="input-field">{STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}</select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Related To</label><select {...register('relatedToType')} className="input-field"><option value="">— None —</option>{RELATED_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Related ID</label><input type="number" {...register('relatedToId')} className="input-field" placeholder="e.g. 1" /></div>
      </div>
      <div className="flex justify-end"><button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save Task'}</button></div>
    </form>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const searchTerm = filters.search.trim().toLowerCase()
  const isSearchActive = searchTerm.length > 0

  const fetchTasks = useCallback(async (page = 0) => {
    setLoading(true)
    try {
      const params = { page, size: 10 }
      if (filters.status) params.status = filters.status
      if (filters.priority) params.priority = filters.priority
      const res = await tasksApi.getAll(params)
      const p = res?.data?.data ?? res?.data
      if (Array.isArray(p)) {
        setTasks(p)
        setPagination({ page: 0, size: p.length || 10, totalElements: p.length, totalPages: 1 })
      } else {
        const rows = Array.isArray(p?.content) ? p.content : []
        setTasks(rows)
        setPagination({
          page: Number.isFinite(p?.number) ? p.number : 0,
          size: Number.isFinite(p?.size) ? p.size : 10,
          totalElements: Number.isFinite(p?.totalElements) ? p.totalElements : rows.length,
          totalPages: Number.isFinite(p?.totalPages) ? p.totalPages : 1,
        })
      }
    } catch { toast.error('Failed to load tasks') } finally { setLoading(false) }
  }, [filters])

  const filteredTasks = useMemo(() => {
    if (!searchTerm) return tasks
    return tasks.filter((task) => {
      const fields = [
        task.title,
        task.description,
        task.status,
        task.priority,
        task.relatedToType,
        task.assignedTo?.name,
      ]
      return fields.some((value) => String(value || '').toLowerCase().includes(searchTerm))
    })
  }, [tasks, searchTerm])

  const tablePagination = isSearchActive
    ? { page: 0, size: filteredTasks.length || 10, totalElements: filteredTasks.length, totalPages: 1 }
    : pagination

  useEffect(() => {
    fetchTasks(0)
  }, [fetchTasks])

  const handleSave = async (data) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      const payload = { ...data, relatedToId: data.relatedToId ? Number(data.relatedToId) : null, relatedToType: data.relatedToType || null }
      if (editTask) { await tasksApi.update(editTask.id, payload); toast.success('Updated') }
      else { await tasksApi.create(payload); toast.success('Created') }
      setModalOpen(false); setEditTask(null); fetchTasks(pagination.page)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { submittingRef.current = false; setSubmitting(false) }
  }

  const handleDelete = async (task) => {
    if (!confirm(`Delete "${task.title}"?`)) return
    try { await tasksApi.delete(task.id); toast.success('Deleted'); fetchTasks(pagination.page) } catch { toast.error('Failed') }
  }

  const handleComplete = async (task) => {
    try { await tasksApi.markComplete(task.id); toast.success('Marked complete!'); fetchTasks(pagination.page) } catch { toast.error('Failed') }
  }

  const columns = [
    { key: 'title', label: 'Title', render: r => (
      <div className="flex items-center gap-2">
        {r.overdue && <AlertCircle size={14} className="text-red-500 flex-shrink-0" />}
        <span className={`font-medium ${r.overdue ? 'text-red-700' : 'text-gray-900'}`}>{r.title}</span>
      </div>
    )},
    { key: 'priority', label: 'Priority', render: r => <Badge value={r.priority} /> },
    { key: 'status', label: 'Status', render: r => <Badge value={r.status} /> },
    { key: 'dueDate', label: 'Due Date', render: r => r.dueDate ? <span className={r.overdue ? 'text-red-600 font-medium' : ''}>{new Date(r.dueDate).toLocaleDateString()}{r.overdue ? ' (Overdue)' : ''}</span> : '—' },
    { key: 'relatedTo', label: 'Related To', render: r => r.relatedToType ? `${r.relatedToType} #${r.relatedToId}` : '—' },
    { key: 'assignedTo', label: 'Assigned To', render: r => r.assignedTo?.name || '—' },
    { key: 'actions', label: 'Actions', width: '120px', render: r => (
      <div className="flex items-center gap-1">
        {r.status !== 'COMPLETED' && <button onClick={() => handleComplete(r)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle2 size={15} /></button>}
        <button onClick={() => { setEditTask(r); setModalOpen(true) }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={15} /></button>
        <button onClick={() => handleDelete(r)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
      </div>
    )},
  ]

  return (
    <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Tasks</h1><p className="text-gray-500 text-sm mt-1">{isSearchActive ? filteredTasks.length : pagination.totalElements} total tasks</p></div>
          <button onClick={() => { setEditTask(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Task</button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
          <SearchInput
            className="flex-1 min-w-[200px]"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Search title, description, assignee..."
          />
          <select className="input-field w-44" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Statuses</option>{STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
          <select className="input-field w-40" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priorities</option>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={() => setFilters({ status: '', priority: '', search: '' })} className="btn-secondary flex items-center gap-1.5"><RefreshCw size={14} />Reset</button>
        </div>

        <Table
          columns={columns}
          data={filteredTasks}
          loading={loading}
          pagination={tablePagination}
          onPageChange={isSearchActive ? (() => {}) : fetchTasks}
        />

        <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditTask(null) }} title={editTask ? 'Edit Task' : 'Add New Task'}>
          <TaskForm onSubmit={handleSave} defaultValues={editTask || { priority: 'MEDIUM', status: 'PENDING' }} loading={submitting} />
        </Modal>
    </div>
  )
}
