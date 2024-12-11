import React, { createContext, useContext, useEffect, useState } from "react"

// Create a context for the theme
const ThemeContext = createContext()

// Helper function to get system theme
const getSystemTheme = () => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

// Main ThemeProvider component
export function ThemeProvider({ children, defaultTheme = "system", storageKey = "my-app-theme" }) {
  // Initialize theme state
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem(storageKey)
    return savedTheme || defaultTheme
  })

  // Effect to update theme
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")

    let themeToApply = currentTheme

    if (currentTheme === "system") {
      themeToApply = getSystemTheme()
    }

    root.classList.add(themeToApply)
    
    // Save theme to localStorage
    localStorage.setItem(storageKey, currentTheme)
  }, [currentTheme, storageKey])

  // Function to change theme
  const setTheme = (newTheme) => {
    setCurrentTheme(newTheme)
  }

  // Context value
  const contextValue = {
    theme: currentTheme,
    setTheme: setTheme 
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
