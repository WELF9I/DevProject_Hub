import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from '@tanstack/react-router'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function useAISearch() {
  const [searchResults, setSearchResults] = useState([])
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const search = async (query) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      return
    }

    try {
      // Extract search criteria
      const aiResponse = await axios.post(
        `${API_URL}/api/projects/extract-search-criteria`,
        { prompt: trimmedQuery },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000 
        }
      )

      const searchCriteria = aiResponse.data

      /**
       * @description Search for projects that fit the search criteria
       */
      const projectsResponse = await axios.post(
        `${API_URL}/api/projects/search`,
        searchCriteria,
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000 
        }
      )

      if (!projectsResponse.data?.length) {
        setSearchResults([])
        return
      }

      setSearchResults(projectsResponse.data)
      setError(null)
      navigate({ to: '/' })
    } catch (err) {
      setSearchResults([])
    }
  }

  const clearSearch = () => {
    setSearchResults([])
    setError(null)
  }

  return { 
    search, 
    clearSearch, 
    searchResults, 
    error 
  }
}

