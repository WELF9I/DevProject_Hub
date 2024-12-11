import App from './App'
import Help from './pages/Help'
import History from './pages/History'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Bookmarks from './pages/Bookmarks'



import {createRouter,createRoute, createRootRoute} from '@tanstack/react-router'

export const rootRoute=createRootRoute({
  component: App,
})

// route for the home page
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
})

// route for the explore page
const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/explore',
  component: Explore,
})

// route for the bookmarks page
const bookmarksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bookmarks',
  component: Bookmarks,
})

// route for the history page
const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: History,
})
// route for the help and support page
const helpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/help',
  component: Help,
})

// this is the main router that contains all the routes
export const router = createRouter({ 
  routeTree: rootRoute.addChildren([homeRoute,exploreRoute,bookmarksRoute,historyRoute,helpRoute])
})