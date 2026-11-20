import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { WishlistProvider } from './context/WishlistContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ChatBot from './components/ChatBot'
import Home from './pages/Home'
import CityDetail from './pages/CityDetail'
import Search from './pages/Search'
import Login from './pages/Login'
import Register from './pages/Register'
import Wishlist from './pages/Wishlist'
import TripPlanner from './pages/TripPlanner'
import PlaceDetail from './pages/PlaceDetail'
import HotelDetail from './pages/HotelDetail'
import FoodDetail from './pages/FoodDetail'
import AdminDashboard from './pages/admin/AdminDashboard'
import MyBookings from './pages/MyBookings'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <div className="min-h-screen flex flex-col bg-[#090d14]">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/city/:id" element={<CityDetail />} />
                <Route path="/place/:id" element={<PlaceDetail />} />
                <Route path="/hotel/:id" element={<HotelDetail />} />
                <Route path="/food/:id" element={<FoodDetail />} />
                <Route path="/search" element={<Search />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/trip-planner" element={<TripPlanner />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </main>
            <Footer />
            <ChatBot />
          </div>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
