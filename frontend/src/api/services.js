import api from './axios'

const request = async (fn) => {
  try {
    return await fn()
  } catch (error) {
    const message =
      error?.response?.data?.message || error?.message || 'API request failed'
    const normalized = new Error(message)
    normalized.response = error?.response
    normalized.originalError = error
    throw normalized
  }
}

const withCrud = (resourcePath) => ({
  getAll: (params = {}) => request(() => api.get(resourcePath, { params })),
  getById: (id) => request(() => api.get(`${resourcePath}/${id}`)),
  create: (payload) => request(() => api.post(resourcePath, payload)),
  update: (id, payload) => request(() => api.put(`${resourcePath}/${id}`, payload)),
  delete: (id) => request(() => api.delete(`${resourcePath}/${id}`)),
})

export const authApi = {
  login: (payload) => request(() => api.post('/auth/login', payload)),
  register: (payload) => request(() => api.post('/auth/register', payload)),
  forgotPassword: (payload) => request(() => api.post('/auth/forgot-password', payload)),
  validateResetToken: (payload) => request(() => api.post('/auth/validate-reset-token', payload)),
  resetPassword: (payload) => request(() => api.post('/auth/reset-password', payload)),
}

export const contactsApi = withCrud('/contacts')

export const dealsApi = {
  ...withCrud('/deals'),
  updateStage: (id, stage) => request(() => api.patch(`/deals/${id}/stage`, { stage })),
  getNotes: (dealId) => request(() => api.get(`/deals/${dealId}/notes`)),
  addNote: (dealId, payload) => request(() => api.post(`/deals/${dealId}/notes`, payload)),
  deleteNote: (noteId) => request(() => api.delete(`/deals/notes/${noteId}`)),
}

export const leadsApi = {
  ...withCrud('/leads'),
  convert: (id) => request(() => api.post(`/leads/${id}/convert`)),
}

export const tasksApi = {
  ...withCrud('/tasks'),
  markComplete: (id) => request(() => api.patch(`/tasks/${id}/complete`)),
}

export const activitiesApi = {
  ...withCrud('/activities'),
  getRecent: (limit = 10) =>
    request(() => api.get('/activities', { params: { page: 0, size: limit } })),
}

export const notificationsApi = {
  ...withCrud('/notifications'),
  getUnreadCount: () => request(() => api.get('/notifications/unread-count')),
  markRead: (id) => request(() => api.patch(`/notifications/${id}/read`)),
  markAllRead: () => request(() => api.patch('/notifications/mark-all-read')),
}

export const dashboardApi = {
  getAll: () => request(() => api.get('/dashboard')),
  getById: (id) => request(() => api.get(`/dashboard/${id}`)),
  create: (payload) => request(() => api.post('/dashboard', payload)),
  update: (id, payload) => request(() => api.put(`/dashboard/${id}`, payload)),
  delete: (id) => request(() => api.delete(`/dashboard/${id}`)),
  getSummary: () => request(() => api.get('/dashboard/summary')),
  getDealsByStage: () => request(() => api.get('/dashboard/deals-by-stage')),
  getLeadsByMonth: () => request(() => api.get('/dashboard/leads-by-month')),
  getTasksByPriority: () => request(() => api.get('/dashboard/tasks-by-priority')),
}

export const adminApi = {
  getUsers: () => request(() => api.get('/admin/users')),
  createUser: (payload) => request(() => api.post('/admin/users', payload)),
  updateRole: (id, role) => request(() => api.patch(`/admin/users/${id}/role`, { role })),
  deleteUser: (id) => request(() => api.delete(`/admin/users/${id}`)),
}

export const profileApi = {
  get: () => request(() => api.get('/profile')),
  update: (payload) => request(() => api.put('/profile', payload)),
  changePassword: (payload) => request(() => api.put('/profile/password', payload)),
}

export const searchApi = {
  global: (query) =>
    request(() => api.get('/search/global', { params: { query } })),
}

export default api
