import { useQuery } from '@tanstack/react-query'
import ProjectCard from '../components/ProjectCard'
import ErrorState from '../components/ErrorState'
import { getBookmarks } from '../apis/projects'
import { useUser } from '@clerk/clerk-react'
import Spinner from '../components/Spinner'

export default function BookmarksPage() {
  const { user } = useUser()
  /**
   @description fetch all bookmarks of that user
   */
  const { data: bookmarkedProjects, isLoading, error, refetch } = useQuery({
    queryKey: ['bookmarks', user?.id],
    queryFn: () => getBookmarks(user.id),
    enabled: !!user,
  })
  /**
 * @description ensures the displayed data stays up to date after any changes like adding or removing bookmarks.
 */
const handleRefetch = () => {
  refetch()
}

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <ErrorState />;
  }

  return (
    <div className="container mt-30 py-8">
      <h1 className="text-3xl font-bold mb-6">Bookmarked Projects</h1>
      
      {bookmarkedProjects?.length === 0 ? (
        // inform the user if there is no bookmarks for that user
        <p className="text-center mt-40 text-gray-500">You haven't bookmarked any projects yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarkedProjects?.map(project => {
            return (
              <ProjectCard
                key={project.id}
                project={project}
                onBookmarkToggle={handleRefetch} // refetch when a bookmark is toggled
                isBookmarkedPage={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

