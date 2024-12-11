import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './routerTree'
import { Toaster } from './components/ui/sonner'
import { ThemeProvider } from './components/theme-provider'
import ErrorBoundary from './error/ErrorBoundary';

import './index.css'
const queryClient = new QueryClient()
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider 
    publishableKey={CLERK_PUBLISHABLE_KEY}
    appearance={{
      baseTheme: undefined,
      layout: {
        unsafe_disableDevelopmentModeWarnings: true,
      }
    }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <RouterProvider router={router} />
          <Toaster position='top-right'/>
          <ErrorBoundary/>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  </React.StrictMode>,
)