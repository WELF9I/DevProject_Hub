import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getHistory, bookmarkProject, removeBookmark, deleteAllUserHistory } from '../apis/projects'
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle} from "../components/ui/alert-dialog";
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import Spinner from '../components/Spinner'
import ErrorState from '../components/ErrorState'
import ProjectCard from '../components/ProjectCard'
export default function HistoryPage() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [bookmarkedProjects, setBookmarkedProjects] = useState([])
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false)

  //fetching all visited projects by that user from the database (history table)
  const { data: historyProjects, isLoading, error } = useQuery({
    queryKey: ['history', user?.id],
    queryFn: () => getHistory(user.id),
    enabled: !!user,
  })
  /**
   @description the user should be signed in to display the bookmark button and could bookmark or unbookmark a project
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

  //delete specific project from history of last visited projects
  const handleDeleteFromHistory = (projectId) => {
    queryClient.setQueryData(['history', user?.id], (oldData) => 
      oldData.filter(project => project.id !== projectId)
    )
  }

    //delete all recent visited projects
  const handleClearAllHistory = async () => {
    if (!user) return;

    try {
      await deleteAllUserHistory(user.id);
      queryClient.setQueryData(['history', user?.id], []);
      toast.success('All history cleared');
      setShowClearHistoryDialog(false);
    } catch (error) {
      toast.error('Failed to clear history');
    }
  }

  if (isLoading) return <Spinner />
  if (error) return <ErrorState />

  return (
    <div className="container mt-30 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Recently Visited Projects</h1>
        {historyProjects?.length > 0 && (
          <Button 
            variant="destructive" 
            onClick={() => setShowClearHistoryDialog(true)}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Clear All History
          </Button>
        )}
      </div>

      {historyProjects?.length === 0 ? (
        <p className="text-center mt-40 text-gray-500">You haven't visited any projects yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {historyProjects?.map(project => (
            <ProjectCard
              key={`${project.id}-${project.visit_date}`}
              project={{...project, visitDate: project.visit_date}}
              onBookmark={toggleBookmark}
              onDeleteFromHistory={handleDeleteFromHistory}
              isHistoryPage={true}
              isBookmarked={bookmarkedProjects.includes(project.id)}
            />
          ))}
        </div>
      )}

      {/* display clear all history dialog  */}
      <AlertDialog open={showClearHistoryDialog} onOpenChange={setShowClearHistoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all your project history? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAllHistory}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}