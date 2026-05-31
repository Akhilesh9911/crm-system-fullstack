import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationsApi, searchApi } from '../api/services'
import SearchInput from './SearchInput'
import { useEffect, useState, useRef } from 'react'
import { LayoutDashboard, Users, Contact, DollarSign, CheckSquare, LogOut, Building2, Bell, Shield, User, X, ChevronRight } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads',     label: 'Leads',     icon: Users },
  { to: '/contacts',  label: 'Contacts',  icon: Contact },
  { to: '/deals',     label: 'Deals',     icon: DollarSign },
  { to: '/tasks',     label: 'Tasks',     icon: CheckSquare },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef(null)
  const notifRef = useRef(null)
  const showNotificationsRef = useRef(showNotifications)

  useEffect(() => {
    showNotificationsRef.current = showNotifications
  }, [showNotifications])

  useEffect(() => {
    fetchUnreadCount()
    fetchNotificationsQuietly()
    const interval = setInterval(() => {
      fetchUnreadCount()
      fetchNotificationsQuietly()
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchQuery.trim().length >= 2) doSearch()
      else setSearchResults(null)
    }, 400)
    return () => clearTimeout(delay)
  }, [searchQuery])

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationsApi.getUnreadCount()
      const payload = res?.data?.data ?? res?.data ?? {}
      setUnreadCount(payload?.count ?? 0)
    } catch {
      setUnreadCount(0)
    }
  }

  const fetchNotificationsQuietly = async () => {
    try {
      const res = await notificationsApi.getAll()
      const payload = res?.data?.data ?? res?.data ?? []
      const list = Array.isArray(payload) ? payload.slice(0, 8) : []
      setNotifications(list)
    } catch {
      // silently fail
    }
  }

  const doSearch = async () => {
    try { const res = await searchApi.global(searchQuery); setSearchResults(res.data.data); setShowSearch(true) } catch {}
  }

  const handleBell = async () => {
    if (!showNotifications) {
      setLoadingNotifications(true)
      try {
        const res = await notificationsApi.getAll()
        const payload = res?.data?.data ?? res?.data ?? []
        const nextNotifications = Array.isArray(payload) ? payload.slice(0, 8) : []
        setNotifications(nextNotifications)
        await notificationsApi.markAllRead()
        setUnreadCount(0)
      } catch {
        setNotifications([])
      } finally {
        setLoadingNotifications(false)
      }
    }
    setShowNotifications(!showNotifications)
  }

  const timeAgo = (d) => {
    if (!d) return ''
    const s = (new Date() - new Date(d)) / 1000
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s/60)}m ago`
    if (s < 86400) return `${Math.floor(s/3600)}h ago`
    return `${Math.floor(s/86400)}d ago`
  }

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="bg-blue-600 p-2 rounded-lg"><Building2 size={20} /></div>
        <span className="text-lg font-bold">CRM System</span>
      </div>

      {/* Global Search */}
      <div className="px-4 py-3 border-b border-gray-700 relative" ref={searchRef}>
        <SearchInput
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => searchResults && setShowSearch(true)}
          placeholder="Search everything..."
          inputClassName="bg-gray-800 border-gray-700 text-white text-sm pr-8 placeholder-gray-500 focus:ring-1"
          iconClassName="text-gray-500"
          rightSlot={searchQuery ? (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults(null) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X size={12} />
            </button>
          ) : null}
        />

        {showSearch && searchResults && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
            {searchResults.totalResults === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">No results found</p>
            ) : (
              <>
                {searchResults.leads?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 px-3 pt-3 pb-1 uppercase tracking-wide">Leads</p>
                    {searchResults.leads.map(l => (
                      <button key={l.id} onClick={() => { navigate('/leads'); setShowSearch(false); setSearchQuery('') }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between">
                        <div><p className="text-sm font-medium text-gray-900">{l.name}</p><p className="text-xs text-gray-400">{l.company}</p></div>
                        <ChevronRight size={14} className="text-gray-300" />
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.contacts?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 px-3 pt-3 pb-1 uppercase tracking-wide">Contacts</p>
                    {searchResults.contacts.map(c => (
                      <button key={c.id} onClick={() => { navigate('/contacts'); setShowSearch(false); setSearchQuery('') }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between">
                        <div><p className="text-sm font-medium text-gray-900">{c.name}</p><p className="text-xs text-gray-400">{c.email}</p></div>
                        <ChevronRight size={14} className="text-gray-300" />
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.deals?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 px-3 pt-3 pb-1 uppercase tracking-wide">Deals</p>
                    {searchResults.deals.map(d => (
                      <button key={d.id} onClick={() => { navigate('/deals'); setShowSearch(false); setSearchQuery('') }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{d.title}</p>
                        <ChevronRight size={14} className="text-gray-300" />
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.tasks?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 px-3 pt-3 pb-1 uppercase tracking-wide">Tasks</p>
                    {searchResults.tasks.map(t => (
                      <button key={t.id} onClick={() => { navigate('/tasks'); setShowSearch(false); setSearchQuery('') }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{t.title}</p>
                        <ChevronRight size={14} className="text-gray-300" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navClass}><Icon size={18} />{label}</NavLink>
        ))}
        {user?.role === 'ADMIN' && (
          <NavLink to="/admin" className={navClass}><Shield size={18} />Admin Panel</NavLink>
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-4 py-4 border-t border-gray-700 space-y-1">
        {/* Bell */}
        <div className="relative" ref={notifRef}>
          <button onClick={handleBell} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <div className="relative">
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </div>
            Notifications
            {unreadCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-72 overflow-y-auto">
              <div className="px-3 py-2 border-b border-gray-100"><p className="text-sm font-semibold text-gray-900">Notifications</p></div>
              {loadingNotifications ? (
                <p className="text-center text-gray-400 text-sm py-6">Loading notifications...</p>
              ) : notifications.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">No notifications</p>
              ) : notifications.map(n => (
                <div key={n.id} className={`px-3 py-2.5 border-b border-gray-50 ${!n.read ? 'bg-blue-50' : ''}`}>
                  <p className="text-xs text-gray-800">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <NavLink to="/profile" className={navClass}><User size={18} />Profile</NavLink>

        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role}</p>
          </div>
        </div>

        <button onClick={() => { logout(); navigate('/login') }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
          <LogOut size={18} />Logout
        </button>
      </div>
    </aside>
  )
}