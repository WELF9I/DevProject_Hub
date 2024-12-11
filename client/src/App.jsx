import { Outlet } from '@tanstack/react-router'
import Header from './components/Header'
import Footer from './components/Footer'

function App() {
  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}

export default App