import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { FiUser, FiPackage, FiHeart, FiTrendingUp, FiCreditCard, FiArrowRight, FiSettings, FiLogOut } from 'react-icons/fi'
import CityCard from '../components/CityCard'

export default function Profile() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    
    axios.get('/api/user/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setData(res.data.data))
    .catch((err) => {
      console.error(err);
      toast.error('Failed to load profile data');
    })
    .finally(() => setLoading(false))
  }, [user])

  if (loading) return <div className="page-shell flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" /></div>

  return (
    <div className="page-shell">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl text-slate-950 font-black">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">{user.name}</h1>
            <p className="text-slate-400">{user.email} · {user.role.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={logout} className="btn-secondary !bg-red-500/10 !text-red-400 !border-red-500/20">
            <FiLogOut /> Logout
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-12">
        <StatCard icon={<FiCreditCard />} label="Total Spent" value={`Rs ${data.stats.totalSpent.toLocaleString()}`} color="text-emerald-400" />
        <StatCard icon={<FiPackage />} label="Total Bookings" value={data.stats.bookingCount} color="text-blue-400" />
        <StatCard icon={<FiHeart />} label="Wishlist Items" value={data.stats.wishlistCount} color="text-pink-400" />
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_0.5fr]">
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <FiTrendingUp className="text-amber-400" /> Recommended For You
            </h2>
            <Link to="/" className="text-sm font-bold text-amber-400 hover:underline">View All</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {data.recommendations.length > 0 ? (
              data.recommendations.map(city => (
                <CityCard key={city._id} city={city} />
              ))
            ) : (
              <div className="col-span-2 py-10 text-center border-2 border-dashed border-white/5 rounded-2xl">
                <p className="text-slate-500">Explore more cities to get personalized recommendations!</p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-black text-white mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/my-bookings" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-slate-300 hover:text-white">
                <span className="flex items-center gap-3"><FiPackage /> My Bookings</span>
                <FiArrowRight size={14} />
              </Link>
              <Link to="/wishlist" className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-slate-300 hover:text-white">
                <span className="flex items-center gap-3"><FiHeart /> Wishlist</span>
                <FiArrowRight size={14} />
              </Link>
              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-slate-300 hover:text-white">
                <span className="flex items-center gap-3"><FiSettings /> Account Settings</span>
                <FiArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="glass-card p-6 border-l-4 border-amber-400">
            <h3 className="text-lg font-black text-white mb-2">Bharat Explorer Elite</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              You are a premium member. Enjoy exclusive deals on hotels in Rajasthan and Goa!
            </p>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">Member since 2024</div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="glass-card p-6 flex items-center gap-5">
      <div className={`text-3xl ${color} bg-white/5 h-14 w-14 rounded-2xl flex items-center justify-center`}>{icon}</div>
      <div>
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</div>
      </div>
    </div>
  )
}
