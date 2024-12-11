import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { getTopProjects, bookmarkProject, removeBookmark } from '../apis/projects'
import ProjectCard from '../components/ProjectCard'
import TagsEngagementChart from '../components/TagsEngagementChart'
import { toast } from 'react-hot-toast'
import { useAISearch } from '../hooks/useAISearch'
import SearchBar from '../components/SearchBar'
import Spinner from '../components/Spinner'
import ErrorState from '../components/ErrorState'

export default function Home() {
  const { user } = useUser()
  const [bookmarkedProjects, setBookmarkedProjects] = useState([])
  // use useAISearch custom hook for AI search service
  const { searchResult, clearSearch, search, error: searchError, isLoading: searchLoading } = useAISearch()

  // fetching top projects
  const { 
    data: projects, 
    isLoading: projectsLoading, 
    error: projectsError 
  } = useQuery({
    queryKey: ['projects'],
    queryFn: getTopProjects,
    keepPreviousData: true
  })

  /**
   * @description the user should be signed in to display the bookmark button and could bookmark or unbookmark a project
   */
  const toggleBookmark = async (projectId) => {
    if (!user) {
      toast.error('Please sign in to bookmark projects')
      return
    }
    try {
      if (bookmarkedProjects.includes(projectId)) {
        await removeBookmark(user.id, projectId)
        setBookmarkedProjects(prev => prev.filter(id => id !== projectId))
        toast.success('Bookmark removed')
      } else {
        await bookmarkProject(user.id, projectId)
        setBookmarkedProjects(prev => [...prev, projectId])
        toast.success('Bookmark added')
      }
    } catch (error) {
      toast.error('Failed to update bookmark')
    }
  }

  if (projectsLoading || searchLoading) return <Spinner />
  if (projectsError) return <ErrorState />

  // determine which projects to display
  const displayedProjects = searchResult ? [searchResult] : projects

  return (
    <div className="container mt-10">
      {/* Title */}
      <div className="flex justify-center mb-12">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-transparent bg-clip-text animate-gradient text-center sm:text-5xl">
          Discover Open-Source Projects
        </h1>
      </div>
      
      {/* Searchbar component here */}
      <div className="mb-20">
        <SearchBar onSearch={search} />
      </div>

      {/* Chart Section */}
      <TagsEngagementChart />

      {/* List of the top projects by engagement or result of AI search */}
      <h2 className="text-2xl font-semibold mb-4 sm:text-xl mt-10">
        {searchResult 
          ? 'AI Search Result' 
          : 'Top Projects'}
      </h2>
      {searchResult && (
        <div className="mb-4 text-sm text-muted-foreground">
          Showing result for your AI search. 
          <button 
            onClick={clearSearch} 
            className="ml-2 text-primary underline"
          >
            Clear Search
          </button>
        </div>
      )}
      {searchError && (
        <div className="mb-4 text-sm text-red-500">
          {searchError}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedProjects?.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onBookmark={toggleBookmark}
            isBookmarked={bookmarkedProjects.includes(project.id)}
          />
        ))}
      </div>
    </div>
  )
}
