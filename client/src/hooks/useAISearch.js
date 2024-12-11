import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from '@tanstack/react-router'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function useAISearch() {
  const [searchResult, setSearchResult] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const search = async (query) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      // extract search criteria
      const aiResponse = await axios.post(
        `${API_URL}/api/projects/extract-search-criteria`,
        { prompt: trimmedQuery },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000 // 30 seconds timeout
        }
      )
      const searchCriteria = aiResponse.data

      // searching for the most relevant project that fits the search criteria
      const projectResponse = await axios.post(
        `${API_URL}/api/projects/search`,
        searchCriteria,
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000 // 1 minute timeout
        }
      )

      console.log('Project response:', projectResponse.data)

      if (!projectResponse.data) {
        setSearchResult(null)
        setError('No results found')
      } else {
        setSearchResult(projectResponse.data)
        navigate({ to: '/' })
      }
    } catch (err) {
      console.error('Search error:', err)
      if (err.code === 'ECONNABORTED') {
        setError('The search is taking longer than expected. Please try a more specific search query or try again later.')
      } else {
        setError(err.response?.data?.message || 'an error occurred during the search.')
      }
      setSearchResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchResult(null)
    setError(null)
  }

  return { 
    search, 
    clearSearch, 
    searchResult, 
    error,
    isLoading
  }
}

