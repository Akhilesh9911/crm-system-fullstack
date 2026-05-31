const variants = {
  NEW: 'bg-blue-100 text-blue-700', CONTACTED: 'bg-yellow-100 text-yellow-700',
  QUALIFIED: 'bg-green-100 text-green-700', LOST: 'bg-red-100 text-red-700',
  PROSPECTING: 'bg-gray-100 text-gray-700', PROPOSAL: 'bg-blue-100 text-blue-700',
  NEGOTIATION: 'bg-orange-100 text-orange-700', CLOSED_WON: 'bg-green-100 text-green-700',
  CLOSED_LOST: 'bg-red-100 text-red-700', HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700', LOW: 'bg-green-100 text-green-700',
  PENDING: 'bg-gray-100 text-gray-700', IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700', CALL: 'bg-purple-100 text-purple-700',
  EMAIL: 'bg-blue-100 text-blue-700', MEETING: 'bg-indigo-100 text-indigo-700',
  NOTE: 'bg-gray-100 text-gray-700',
}

export default function Badge({ value }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[value] || 'bg-gray-100 text-gray-700'}`}>
      {value ? value.replace(/_/g, ' ') : ''}
    </span>
  )
}
