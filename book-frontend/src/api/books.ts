const API_BASE = '/api'

export const bookApi = {
  async getBooks(page = 1, limit = 20) {
    const response = await fetch(`${API_BASE}/books?page=${page}&limit=${limit}`)
    return response.json()
  },
  
  async searchBooks(keyword: string) {
    const response = await fetch(`${API_BASE}/books/search?q=${encodeURIComponent(keyword)}`)
    return response.json()
  },
  
  async getBookById(id: string) {
    const response = await fetch(`${API_BASE}/books/${id}`)
    return response.json()
  }
}