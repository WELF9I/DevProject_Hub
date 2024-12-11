import { Link } from '@tanstack/react-router'

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="py-4 backdrop-blur-md shadow-sm mt-4">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <p className="text-sm text-center sm:text-left text-gray-500">
          © {year}  DevProject Hub.
        </p>
        <nav className="flex flex-col sm:flex-row items-center w-full sm:w-auto space-y-2 sm:space-y-0 space-x-0 sm:space-x-4">
          <Link to="/about" className="text-sm text-gray-500 hover:text-gray-700">
            About
          </Link>
          <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700">
            Terms of Service
          </Link>
          <Link to="/help" className="text-sm text-gray-500 hover:text-gray-700">
          Help & Support
          </Link>
        </nav>
      </div>
    </footer>
  )
}
