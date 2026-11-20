import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { FiHeart, FiLogOut, FiMap, FiMenu, FiSearch, FiSettings, FiUser, FiX, FiCalendar } from 'react-icons/fi'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { items } = useWishlist()
  const [open, setOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (event) => {
    event.preventDefault()
    if (!search.trim()) return
    navigate(`/search?q=${encodeURIComponent(search.trim())}`)
    setSearch('')
    setOpen(false)
  }

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-brand-black/95 backdrop-blur-xl border-b border-white/5 py-3 shadow-luxury' : 'bg-transparent py-5'}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-none border border-brand-gold-500 bg-transparent text-lg font-serif italic text-brand-gold-500 transition-colors group-hover:bg-brand-gold-500 group-hover:text-brand-black">B</div>
          <div className="leading-tight">
            <div className="text-xl font-serif tracking-widest text-white uppercase">Bharat</div>
            <div className="hidden text-[10px] font-sans font-light tracking-[0.3em] text-brand-gold-500 sm:block uppercase">Signature Collection</div>
          </div>
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 md:flex md:max-w-md ml-auto mr-8">
          <div className="relative w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search experiences..."
              className="h-10 w-full rounded-md border border-white/10 bg-white/5 pl-10 pr-4 text-sm font-light text-white outline-none transition placeholder:text-brand-muted/70 focus:border-brand-gold-500 focus:bg-white/10"
            />
          </div>
        </form>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/trip-planner" className="text-sm font-light uppercase tracking-wider text-brand-muted transition hover:text-brand-gold-500">
            Concierge
          </Link>
          <Link to="/wishlist" className="relative text-sm font-light uppercase tracking-wider text-brand-muted transition hover:text-brand-gold-500 flex items-center gap-1">
            <FiHeart size={14} /> Wishlist
            {items.length > 0 && <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold-500 px-1 text-[9px] font-bold text-brand-black">{items.length}</span>}
          </Link>

          {user ? (
            <div className="relative">
              <button onClick={() => setDropOpen((value) => !value)} className="flex items-center gap-2 px-2 py-1 text-sm font-light uppercase tracking-wider text-white transition hover:text-brand-gold-500">
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-brand-gold-500/50 bg-transparent text-xs font-serif text-brand-gold-500">{user.name?.[0]?.toUpperCase()}</span>
                {user.name?.split(' ')[0]}
              </button>
              {dropOpen && (
                <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-md border border-white/10 bg-brand-black shadow-luxury backdrop-blur-xl">
                  <div className="border-b border-white/5 px-4 py-4 text-sm text-brand-muted">
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="truncate text-xs font-light">{user.email}</div>
                  </div>
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setDropOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-light text-brand-gold-500 transition hover:bg-white/5">
                      <FiSettings size={14} /> Management
                    </Link>
                  )}
                  <Link to="/profile" onClick={() => setDropOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-light text-slate-300 transition hover:bg-white/5 hover:text-brand-gold-500">
                    <FiUser size={14} /> Profile
                  </Link>
                  <Link to="/my-bookings" onClick={() => setDropOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-light text-slate-300 transition hover:bg-white/5 hover:text-brand-gold-500">
                    <FiCalendar size={14} /> Reservations
                  </Link>
                  <button onClick={() => { logout(); setDropOpen(false) }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-light text-red-400 transition hover:bg-white/5">
                    <FiLogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary !px-4 !py-2">Login</Link>
              <Link to="/register" className="btn-primary !px-4 !py-2">Sign Up</Link>
            </div>
          )}
        </div>

        <button onClick={() => setOpen((value) => !value)} className="rounded-md border border-white/10 p-2 text-white md:hidden">
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-brand-black px-4 py-5 md:hidden shadow-luxury">
          <form onSubmit={handleSearch} className="mb-6 flex gap-2">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search destinations..." className="input-field flex-1 !py-3 text-sm font-light" />
            <button type="submit" className="btn-primary !px-5"><FiSearch /></button>
          </form>
          <div className="space-y-1">
            <Link to="/trip-planner" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-light uppercase tracking-widest text-slate-300"><FiMap /> Concierge</Link>
            <Link to="/wishlist" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-light uppercase tracking-widest text-slate-300"><FiHeart /> Wishlist ({items.length})</Link>
            {user ? (
              <>
                {user.role === 'admin' && <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-light uppercase tracking-widest text-brand-gold-500"><FiSettings /> Management</Link>}
                <Link to="/my-bookings" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-light uppercase tracking-widest text-slate-300"><FiCalendar /> Reservations</Link>
                <button onClick={() => { logout(); setOpen(false) }} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-light uppercase tracking-widest text-red-400"><FiLogOut /> Sign Out</button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary !py-3">Sign In</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary !py-3">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
