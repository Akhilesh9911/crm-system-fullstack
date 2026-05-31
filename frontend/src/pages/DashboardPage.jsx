import { useEffect, useState } from 'react'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import { dashboardApi, activitiesApi } from '../api/services'
import { Users, Contact, DollarSign, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'

const STAGE_COLORS = { PROSPECTING: '#6b7280', PROPOSAL: '#3b82f6', NEGOTIATION: '#f59e0b', CLOSED_WON: '#10b981', CLOSED_LOST: '#ef4444' }
const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981']

function fmt(v) { return v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '$0' }
function timeAgo(d) {
  if (!d) return ''
  const s = (new Date() - new Date(d)) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [dealsByStage, setDealsByStage] = useState([])
  const [leadsByMonth, setLeadsByMonth] = useState([])
  const [tasksByPriority, setTasksByPriority] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const isCriticalError = (error) => {
    const status = error?.response?.status
    return status === 401 || status === 403 || (typeof status === 'number' && status >= 500)
  }

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, d, l, t, a] = await Promise.all([
          dashboardApi.getSummary(), dashboardApi.getDealsByStage(),
          dashboardApi.getLeadsByMonth(), dashboardApi.getTasksByPriority(),
          activitiesApi.getRecent(10)
        ])
        setSummary(s?.data?.data || {})
        setDealsByStage(Array.isArray(d?.data?.data) ? d.data.data : [])
        setLeadsByMonth(Array.isArray(l?.data?.data) ? l.data.data : [])
        setTasksByPriority(Array.isArray(t?.data?.data) ? t.data.data : [])
        setActivities(Array.isArray(a?.data?.data) ? a.data.data : [])
      } catch (error) {
        if (isCriticalError(error)) {
          const message = error?.response?.data?.message || error?.message || 'Failed to load dashboard'
          toast.error(message)
        }
        setSummary({})
        setDealsByStage([])
        setLeadsByMonth([])
        setTasksByPriority([])
        setActivities([])
      }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your CRM activity</p>
        </div>
        {!summary?.totalLeads && !summary?.totalContacts && !summary?.openDeals && !summary?.pendingTasks && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-500">
            No data available
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Leads"    value={summary?.totalLeads ?? 0}    icon={Users}       color="blue"   />
          <StatCard title="Total Contacts" value={summary?.totalContacts ?? 0} icon={Contact}     color="green"  />
          <StatCard title="Open Deals"     value={summary?.openDeals ?? 0}     icon={DollarSign}  color="orange" subtitle={fmt(summary?.totalDealValue)} />
          <StatCard title="Pending Tasks"  value={summary?.pendingTasks ?? 0}  icon={CheckSquare} color="purple" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Deals by Stage</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dealsByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Deals" radius={[4,4,0,0]}>
                  {dealsByStage.map((e, i) => <Cell key={i} fill={STAGE_COLORS[e.stage] || '#3b82f6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Leads Created (Last 6 Months)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={leadsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="Leads" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Tasks by Priority</h2>
            {tasksByPriority.length === 0 ? <p className="text-gray-400 text-sm text-center py-12">No task data</p> : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={tasksByPriority} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={90}
                    label={({ priority, percent }) => `${priority} ${(percent * 100).toFixed(0)}%`}>
                    {tasksByPriority.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend /><Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
            {activities.length === 0 ? <p className="text-gray-400 text-sm text-center py-12">No activity yet</p> : (
              <ul className="space-y-3">
                {activities.map(a => (
                  <li key={a.id} className="flex items-start gap-3">
                    <Badge value={a.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{a.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.createdBy?.name} · {timeAgo(a.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
    </div>
  )
}
