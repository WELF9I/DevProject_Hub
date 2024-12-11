import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import {AlertDialog,AlertDialogAction,AlertDialogCancel,AlertDialogContent,AlertDialogDescription,AlertDialogFooter,AlertDialogHeader,AlertDialogTitle,} from "./ui/alert-dialog";
import { bookmarkProject, removeBookmark,getBookmarks,addToHistory,deleteSpecificProjectFromHistory } from '../apis/projects';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Star, GitFork, Eye, Bookmark,Trash2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

/**
 @description when the value of an engagement (forks or stars or watchers) is greater than 1000, it will be converted to K
 */
const ValueFormatSwitch = (value) => {
  return value >= 1000 ?`${(value/1000).toFixed(1).replace('.0', '')}K`:value;
};

const ProjectCard = ({ 
  project, 
  onBookmarkToggle, 
  isBookmarkedPage = false,
  isHistoryPage = false,
  onDeleteFromHistory 
  }) => {
  const { user } = useUser();
  const [isBookmarked, setIsBookmarked]=useState(isBookmarkedPage);
  const [lastVisitDate, setLastVisitDate]=useState(project.visitDate ||null);
  const [showUnbookmarkDialog, setShowUnbookmarkDialog]=useState(false);
  const [showDeleteHistoryDialog, setShowDeleteHistoryDialog]=useState(false);

  useEffect(() => {
    const checkBookmarkAndHistoryStatus = async () => {
      if (user) {
        try {
          const bookmarks = await getBookmarks(user.id);
          const bookmarkedProject = bookmarks.find(bookmark => bookmark.id === project.id);
          setIsBookmarked(!!bookmarkedProject);
        } catch (error) {
        }
      }
    };
    checkBookmarkAndHistoryStatus();
  }, [user, project.id]);

  /**
   * 
   @description when user clicks on view project button,it will add the project to the history of visited projects for that user
   */
  const handleViewProject = async () => {
    if (!user) return;

    try {
      await addToHistory(user.id, project.id);
      setLastVisitDate(new Date());
      window.open(project.link, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error('Failed to update project history');
    }
  };

  /**
   * 
   * @description when user clicks on bookmark button,it will bookmark the project
   */

  const handleBookmarkToggle = async () => {
    if (!user) return;
  
    try {
      if (isBookmarked) {
        setShowUnbookmarkDialog(true);
      } else {
        await bookmarkProject(user.id, project.id);
        toast.success("Project added to bookmarks", {
          description: "Check your bookmarks page.",
        });
        setIsBookmarked(true);
        if (onBookmarkToggle) {
          onBookmarkToggle(project.id, true);
        }
      }
    } catch (error) {
      toast.error(`Failed to ${isBookmarked ? 'remove' : 'add'} bookmark`);
    }
  };

  /**
   * @description when user clicks on unbookmark button, it will Unbookmark the project
   */

  const handleUnbookmark = async () => {
    try {
      await removeBookmark(user.id, project.id);
      toast.success('Bookmark removed');
      setIsBookmarked(false);
      setShowUnbookmarkDialog(false);
      if (onBookmarkToggle) {
        onBookmarkToggle(project.id, false);
      }
    } catch (error) {
      toast.error('Failed to remove bookmark');
    }
  };

  /**
   * @description when user clicks on delete button,it will delete the project from history of vidited projects page
   */

  const handleDeleteFromHistory = async () => {
    if (!user) return;
    try {
      await deleteSpecificProjectFromHistory(user.id, project.id);
      toast.success('Project removed from history');
      if (onDeleteFromHistory) {
        onDeleteFromHistory(project.id);}
      setShowDeleteHistoryDialog(false);
    } catch (error) {
      toast.error('Failed to remove project from history');
    }
  };

  if (isBookmarkedPage && !isBookmarked) {
    return null;
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-sm shadow-ml shadow-primary/10">
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Star className="w-4 h-4 mr-1" />
              {ValueFormatSwitch(project.stars)}
            </span>
            <span className="flex items-center">
              <GitFork className="w-4 h-4 mr-1" />
              {ValueFormatSwitch(project.forks)}
            </span>
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {ValueFormatSwitch(project.watchers)}
            </span>
          </div>

          <SignedIn>
            <div className="flex items-center space-x-2">
              {isHistoryPage && (
                 <Button 
                onClick={() => setShowDeleteHistoryDialog(true)}
                variant="ghost" 
                size="icon" 
                className="text-red-500 hover:bg-transparent hover:text-red-600 transition-colors"
                >
                <Trash2 className="h-4 w-4" />
              </Button>
              )}
              <Button 
                onClick={handleBookmarkToggle}
                variant="ghost" 
                size="icon" 
                className="ml-auto"
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </SignedIn>
        </div>
        
        <div className="flex w-full mt-2">
          <SignedIn>
            <Button
              onClick={handleViewProject}
              className="w-full"
            >
              View Project
            </Button>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button className="w-full">
                View Project
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </CardFooter>

      {/* display remove bookmark dialog  */}
      <AlertDialog open={showUnbookmarkDialog} onOpenChange={setShowUnbookmarkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Bookmark</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this project from your bookmarks?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnbookmark}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* display remove from history dialog  */}
      <AlertDialog open={showDeleteHistoryDialog} onOpenChange={setShowDeleteHistoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this project from your history?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFromHistory}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ProjectCard;
