import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import SearchInput from '../components/SearchInput'
import { dealsApi, contactsApi } from '../api/services'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, DollarSign, MessageSquare, Send, X, RefreshCw } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'

const STAGES = ['PROSPECTING', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']
const STAGE_COLORS = { PROSPECTING: 'border-t-gray-400', PROPOSAL: 'border-t-blue-500', NEGOTIATION: 'border-t-yellow-500', CLOSED_WON: 'border-t-green-500', CLOSED_LOST: 'border-t-red-500' }
const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '$0'
const timeAgo = (d) => { if (!d) return ''; const s = (new Date() - new Date(d)) / 1000; if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s/60)}m ago`; return `${Math.floor(s/3600)}h ago` }

function DealCard({ deal, onEdit, onDelete, onNotes, isDragging }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: String(deal.id) })
  const style = transform ? { transform: `translate(${transform.x}px,${transform.y}px)`, opacity: isDragging ? 0.4 : 1 } : {}
  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow select-none">
      <div className="flex items-start justify-between gap-1">
        <p {...listeners} {...attributes} className="text-sm font-semibold text-gray-900 flex-1 cursor-grab truncate">{deal.title}</p>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={() => onNotes(deal)} className="p-1 text-gray-400 hover:text-indigo-600"><MessageSquare size={12} /></button>
          <button onClick={() => onEdit(deal)} className="p-1 text-gray-400 hover:text-blue-600"><Pencil size={12} /></button>
          <button onClick={() => onDelete(deal)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-green-700 font-semibold text-sm"><DollarSign size={12} />{fmt(deal.value)}</div>
      {deal.contact && <p className="mt-1 text-xs text-gray-500 truncate">{deal.contact.name} · {deal.contact.company}</p>}
      {deal.expectedCloseDate && <p className="mt-1 text-xs text-gray-400">Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}</p>}
    </div>
  )
}

function StageColumn({ stage, deals, onEdit, onDelete, onNotes, activeId }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const total = deals.reduce((s, d) => s + (Number(d.value) || 0), 0)
  return (
    <div className="flex-1 min-w-[210px] max-w-[260px]">
      <div className={`bg-white rounded-xl border-t-4 border border-gray-200 ${STAGE_COLORS[stage]} flex flex-col`} style={{ minHeight: 500 }}>
        <div className="px-3 pt-3 pb-2 border-b border-gray-100">
          <div className="flex items-center justify-between"><Badge value={stage} /><span className="text-xs text-gray-400">{deals.length}</span></div>
          <p className="text-xs text-gray-500 mt-1 font-semibold">{fmt(total)}</p>
        </div>
        <div ref={setNodeRef} className={`flex-1 p-2 space-y-2 ${isOver ? 'bg-blue-50' : ''}`}>
          {deals.map(d => <DealCard key={d.id} deal={d} onEdit={onEdit} onDelete={onDelete} onNotes={onNotes} isDragging={String(d.id) === activeId} />)}
          {deals.length === 0 && <div className="h-20 flex items-center justify-center text-xs text-gray-300 border-2 border-dashed border-gray-200 rounded-lg">Drop here</div>}
        </div>
      </div>
    </div>
  )
}

function DealForm({ onSubmit, defaultValues, contacts, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { ...defaultValues, contactId: defaultValues?.contact?.id, stage: defaultValues?.stage || 'PROSPECTING' } })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input {...register('title', { required: 'Required' })} className="input-field" placeholder="Deal title" />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Value ($)</label><input type="number" step="0.01" {...register('value')} className="input-field" placeholder="0.00" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Stage</label><select {...register('stage')} className="input-field">{STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}</select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact</label><select {...register('contactId')} className="input-field"><option value="">— None —</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company||'No company'})</option>)}</select></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Expected Close</label><input type="date" {...register('expectedCloseDate')} className="input-field" /></div>
      </div>
      <div className="flex justify-end"><button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save Deal'}</button></div>
    </form>
  )
}

function NotesPanel({ deal, onClose }) {
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => { fetchNotes() }, [deal.id])
  const fetchNotes = async () => {
    try {
      const r = await dealsApi.getNotes(deal.id)
      const payload = r?.data?.data ?? r?.data
      setNotes(Array.isArray(payload) ? payload : [])
    } catch {}
  }
  const addNote = async () => {
    if (!newNote.trim()) return
    setLoading(true)
    try { await dealsApi.addNote(deal.id, { content: newNote }); setNewNote(''); fetchNotes(); toast.success('Note added!') }
    catch { toast.error('Failed') } finally { setLoading(false) }
  }
  const deleteNote = async (id) => { try { await dealsApi.deleteNote(id); fetchNotes() } catch {} }
  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <div><h3 className="font-semibold text-gray-900">Deal Notes</h3><p className="text-xs text-gray-500 truncate">{deal.title}</p></div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 ? <div className="text-center py-12"><MessageSquare size={32} className="text-gray-300 mx-auto mb-2" /><p className="text-gray-400 text-sm">No notes yet</p></div>
          : notes.map(n => (
            <div key={n.id} className="bg-gray-50 rounded-lg p-3 group">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-800 flex-1">{n.content}</p>
                <button onClick={() => deleteNote(n.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{n.createdBy?.name} · {timeAgo(n.createdAt)}</p>
            </div>
          ))}
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote() } }}
            placeholder="Add a note... (Enter to send)" className="flex-1 input-field resize-none text-sm" rows={2} />
          <button onClick={addNote} disabled={loading || !newNote.trim()} className="btn-primary px-3 self-end disabled:opacity-50"><Send size={16} /></button>
        </div>
      </div>
    </div>
  )
}

export default function DealsPage() {
  const [deals, setDeals] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editDeal, setEditDeal] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [noteDeal, setNoteDeal] = useState(null)
  const [search, setSearch] = useState('')
  const submittingRef = useRef(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const searchTerm = search.trim().toLowerCase()
  const isCriticalError = (error) => {
    const status = error?.response?.status
    return status === 401 || status === 403 || (typeof status === 'number' && status >= 500)
  }

  const dedupeByIdentity = (items) => {
    const map = new Map()
    ;(Array.isArray(items) ? items : []).forEach((item) => {
      const key = item?.id ?? `${item?.title || 'untitled'}-${item?.contact?.id || 'none'}-${item?.stage || 'unknown'}`
      if (!map.has(key)) map.set(key, item)
    })
    return Array.from(map.values())
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dr, cr] = await Promise.all([dealsApi.getAll(), contactsApi.getAll({ size: 100 })])
      const dealsPayload = dr?.data?.data ?? dr?.data
      const contactsPayload = cr?.data?.data ?? cr?.data
      const dealRows = Array.isArray(dealsPayload) ? dealsPayload : (dealsPayload?.content || [])
      const contactRows = Array.isArray(contactsPayload) ? contactsPayload : (contactsPayload?.content || [])
      const uniqueDeals = dedupeByIdentity(dealRows)
      const uniqueContacts = dedupeByIdentity(contactRows)
      console.log('API RESPONSE:', dr.data)
      console.log('API RESPONSE LENGTH:', dealRows.length)
      console.log('Deals unique rows:', uniqueDeals)
      console.log('API RESPONSE (CONTACTS):', cr.data)
      console.log('Contacts unique rows for Deals page:', uniqueContacts)
      setDeals(uniqueDeals)
      setContacts(uniqueContacts)
    } catch (error) {
      if (isCriticalError(error)) toast.error('Failed to load deals')
      setDeals([])
      setContacts([])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredDeals = useMemo(() => {
    if (!searchTerm) return deals
    return deals.filter((deal) => {
      const fields = [
        deal.title,
        deal.stage,
        deal.contact?.name,
        deal.contact?.email,
        deal.contact?.company,
      ]
      return fields.some((value) => String(value || '').toLowerCase().includes(searchTerm))
    })
  }, [deals, searchTerm])

  useEffect(() => {
    console.log('STATE DATA:', deals)
    console.log('STATE LENGTH:', deals.length)
  }, [deals])

  useEffect(() => {
    console.log('RENDERED ROWS LENGTH:', filteredDeals.length)
  }, [filteredDeals])

  const dealsByStage = STAGES.reduce((a, s) => { a[s] = filteredDeals.filter(d => d.stage === s); return a }, {})

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null)
    if (!over) return
    const id = Number(active.id); const newStage = over.id
    const deal = deals.find(d => d.id === id)
    if (!deal || deal.stage === newStage) return
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage: newStage } : d))
    try { await dealsApi.updateStage(id, newStage); toast.success(`Moved to ${newStage.replace(/_/g,' ')}`) }
    catch { toast.error('Failed'); fetchData() }
  }

  const handleSave = async (data) => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      const p = { ...data, contactId: data.contactId ? Number(data.contactId) : null, value: data.value ? Number(data.value) : null }
      if (editDeal) { await dealsApi.update(editDeal.id, p); toast.success('Updated') }
      else { await dealsApi.create(p); toast.success('Created') }
      setModalOpen(false); setEditDeal(null); fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') } finally { submittingRef.current = false; setSubmitting(false) }
  }

  const handleDelete = async (deal) => {
    if (!confirm(`Delete "${deal.title}"?`)) return
    try { await dealsApi.delete(deal.id); toast.success('Deleted'); fetchData() } catch { toast.error('Failed') }
  }

  const activeDeal = activeId ? filteredDeals.find(d => String(d.id) === activeId) : null

  return (
    <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1><p className="text-gray-500 text-sm mt-1">Drag and drop deals between stages</p></div>
          <button onClick={() => { setEditDeal(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Deal</button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <SearchInput
            className="flex-1"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title, contact, company, stage..."
          />
          <button onClick={() => setSearch('')} className="btn-secondary flex items-center gap-1.5"><RefreshCw size={14} />Reset</button>
        </div>

        {loading ? <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div> : (
          filteredDeals.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">No data available</div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({ active }) => setActiveId(active.id)} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {STAGES.map(s => <StageColumn key={s} stage={s} deals={dealsByStage[s]} onEdit={d => { setEditDeal(d); setModalOpen(true) }} onDelete={handleDelete} onNotes={setNoteDeal} activeId={activeId} />)}
              </div>
              <DragOverlay>
                {activeDeal && <div className="bg-white rounded-lg border border-blue-300 p-3 shadow-xl w-56 rotate-2 opacity-90"><p className="text-sm font-semibold">{activeDeal.title}</p><p className="text-sm text-green-700 font-semibold mt-1">{fmt(activeDeal.value)}</p></div>}
              </DragOverlay>
            </DndContext>
          )
        )}
        <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditDeal(null) }} title={editDeal ? 'Edit Deal' : 'Add New Deal'}>
          <DealForm onSubmit={handleSave} defaultValues={editDeal || {}} contacts={contacts} loading={submitting} />
        </Modal>

        {noteDeal && <NotesPanel deal={noteDeal} onClose={() => setNoteDeal(null)} />}
    </div>
  )
}
