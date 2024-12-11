import {Component} from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }
  
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
  
    componentDidCatch(error, errorInfo) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  
    render() {
      if (this.state.hasError) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-red-50 to-white p-8">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h2>
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        );
      }
  
      return this.props.children;
    }
  }

  export default ErrorBoundary;