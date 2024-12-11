import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getProjects, bookmarkProject, removeBookmark } from '../apis/projects'
import ProjectCard from '../components/ProjectCard'
import { Input } from '../components/ui/input'
import { useUser } from '@clerk/clerk-react'
import { toast } from 'react-hot-toast'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from "../lib/utils"
import { Button } from "../components/ui/button"
import {Command,CommandEmpty,CommandGroup,CommandInput,CommandItem,CommandList,} from "../components/ui/command"
import {Popover,PopoverContent,PopoverTrigger,} from "../components/ui/popover"
import { languages } from '../constants/languages';
import Spinner from '../components/Spinner'
import ErrorState from '../components/ErrorState'

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("All")
  const [bookmarkedProjects, setBookmarkedProjects] = useState([])
  const [open, setOpen] = useState(false)
  const { user } = useUser()
  const queryClient = useQueryClient()
  /**
   * @description check if prefetched data from Home page exists,else refetching if no prefetched data
   */
  const prefetchedProjects = queryClient.getQueryData(['projects'])
  const { 
    data: projects, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    initialData: prefetchedProjects,
    staleTime: 5 * 60 * 1000,
    retry: 2
  })
  const [filteredProjects, setFilteredProjects] = useState([])

  /**
   * @description filtering data even by typing the project title or use the combobox to search by tag
   */
  useEffect(() => {
    if (projects) {
      setFilteredProjects(projects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesLanguage = selectedLanguage === "All" || project.tags.includes(selectedLanguage)
        return matchesSearch && matchesLanguage
      }))
    }
  }, [projects, searchQuery, selectedLanguage])

  /**
   * 
   @description user should be signed in to bookmark or remove a bookmark
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

  if (isLoading) return <Spinner />
  if (error) return <ErrorState />

  return (
    <div className="container mt-30 py-8">
      <h1 className="text-3xl font-bold mb-6">Explore Projects</h1>
      <div className="flex flex-col md:flex-row gap-4 mb-8">

        {/* search by project title */}
        <Input
          placeholder="Search projects by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:w-1/2"
        />

        {/* implement combobox for searching by tag */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[200px] justify-between"
                >
              {selectedLanguage
                ? languages.find((language) => language.value === selectedLanguage)?.label
                : "Select language..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search language..." className="h-9" />
              <CommandList>
                <CommandEmpty>No language found.</CommandEmpty>
                <CommandGroup>
                  {languages.map((language) => (
                    <CommandItem
                      key={language.value}
                      value={language.value}
                      onSelect={(currentValue) => {
                        setSelectedLanguage(currentValue === selectedLanguage ? "All" : currentValue)
                        setOpen(false)
                      }}
                    >
                      {language.label}
                      <Check
                        className={cn("ml-auto h-4 w-4", selectedLanguage === language.value ? "opacity-100" : "opacity-0")}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* filtered project(s) displayed here */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects?.map(project => (
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

