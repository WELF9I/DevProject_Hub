import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

const ErrorState = ({ message = "Oops! Something went wrong while fetching the projects."}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-4">
      <Alert variant="destructive" className="max-w-md animate-in fade-in duration-500">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="font-semibold mb-2">We hit a problem!</AlertTitle>
        <AlertDescription className="text-sm">
          {message}
          <div className="mt-4 text-xs">
            Try refreshing the page or come back later.
          </div>
        </AlertDescription>
      </Alert>
      <button 
        onClick={() => window.location.reload()} 
        className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
      >
        Refresh Page
      </button>
    </div>
  );
};


export default ErrorState;