import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { Header } from '@/components/Header'
import { Toaster } from '@/components/ui/toaster'
import { HomePage } from '@/pages/HomePage'
import { BusinessDetailPage } from '@/pages/BusinessDetailPage'
import { FavoritesPage } from '@/pages/FavoritesPage'
import { ProfilePage } from '@/pages/ProfilePage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/business/:id" element={<BusinessDetailPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
