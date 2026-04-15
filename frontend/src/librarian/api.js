const DEFAULT_API_URL = 'http://localhost:3001/api'

export const LIBRARIAN_API_URL = (
  import.meta.env.VITE_API_URL || DEFAULT_API_URL
).replace(/\/$/, '')
