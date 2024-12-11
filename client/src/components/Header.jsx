import { UserButton, useUser } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from './theme-provider';
import { Link } from '@tanstack/react-router';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Moon, Sun, Menu, Home, Compass, Bookmark, History } from 'lucide-react';
import { Button } from './ui/button';
import { DevProject_Hub } from '../constants/icons.js';
import { getProjects} from '../apis/projects';
export default function Header() {
  const { isSignedIn } = useUser();
  const { theme,setTheme} = useTheme();
  const queryClient = useQueryClient();
  const toggleTheme = () => {
    setTheme(theme ==='light'?'dark':'light');
  };

    /**
   * @description prefetching the projects for the explore page while clicking on the explore button using prefetchQuery
   */
  const handleExploreHover = () => {
    queryClient.prefetchQuery({
      queryKey: ['projects'],
      queryFn: getProjects
    });
  };

  const NavigationLinks = () => (
    <nav className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-3">
      <Link to="/" className="block sm:inline">
        <Button 
          variant="ghost" 
          className="w-full sm:w-auto justify-start sm:px-2"
        >
          <span className="hidden sm:hidden">
            <Home className="mr-2 h-4 w-4" />
          </span>
          <span className="text-lg">Home</span>
        </Button>
      </Link>
      <Link to="/explore" onClick={handleExploreHover} className="block sm:inline">
        <Button 
          variant="ghost" 
          className="w-full sm:w-auto justify-start sm:px-2"
        >
          <span className="hidden sm:hidden">
            <Compass className="mr-2 h-4 w-4" />
          </span>
          <span className="text-lg">Explore</span>
        </Button>
      </Link>
      <Link to="/bookmarks"  className="block sm:inline">
        <Button 
          variant="ghost" 
          className="w-full sm:w-auto justify-start sm:px-2"
        >
          <span className="hidden sm:hidden">
            <Bookmark className="mr-2 h-4 w-4" />
          </span>
          <span className="text-lg">Bookmarks</span>
        </Button>
      </Link>
      <Link to="/history" className="block sm:inline">
        <Button 
          variant="ghost" 
          className="w-full sm:w-auto justify-start sm:px-2"
        >
          <span className="hidden sm:hidden">
            <History className="mr-2 h-4 w-4" />
          </span>
          <span className="text-lg">History</span>
        </Button>
      </Link>
    </nav>
  );

  return (
    <header className="sticky top-0 left-0 right-0 py-4 px-4 bg-background/80 backdrop-blur-md shadow-sm z-header">
      <div className="w-full max-w-screen-2xl mx-auto flex items-center justify-between h-16">
        {/*The Title and the logo*/}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center">
            <img 
              src={DevProject_Hub} 
              alt="DevProject Hub" 
              className="h-10 mr-3" 
            />
            <span className="text-2xl font-bold hidden lg:inline text-gray-800 dark:text-gray-200">
              DevProject Hub
            </span>
          </Link>

          {/* Navigation Links for large screens size */}
          <div className="hidden md:flex items-center space-x-3">
            <NavigationLinks />
          </div>
        </div>

        {/* Theme toggle button,clerk user button,burger menu for mobile view */}
        <div className="flex items-center space-x-4">
          {/* Theme togle for large screens size */}
          <Button
            variant="ghost"
            size="lg"
            onClick={toggleTheme}
            className="hidden md:flex"
          >
            {theme === 'light' ? (
              <Moon className="h-6 w-6" />
            ) : (
              <Sun className="h-6 w-6" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Clerk user button for the profile */}
          {isSignedIn && <UserButton appearance={{ elements: { avatarBox: "h-10 w-10" } }} />}

          {/* Mobile menu using sheet component of Shadcn */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <SheetHeader>
                <SheetTitle className="flex items-center">
                  <img 
                    src={DevProject_Hub} 
                    alt="DevProject Hub" 
                    className="h-8 mr-2" 
                  />
                  DevProject Hub
                </SheetTitle>
              </SheetHeader>
              
              {/* Navigation Links for Mobile screens size */}
              <div className="space-y-2 mt-4">
                <NavigationLinks />
              </div>

              {/*  Theme toggle for mobile screens size*/}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                <span>Theme</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                >
                  {theme === 'light' ? (
                    <Moon className="h-[1.2rem] w-[1.2rem]" />
                  ) : (
                    <Sun className="h-[1.2rem] w-[1.2rem]" />
                  )}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

