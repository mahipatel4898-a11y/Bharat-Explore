import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  FiCalendar, FiHome, FiUsers, FiMapPin,
  FiXCircle, FiCheckCircle, FiArrowLeft, FiLoader
} from 'react-icons/fi'

const statusColors = {
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/25',
}

const nightsBetween = (checkIn, checkOut) => {
  const diff = (new Date(checkOut) - new Date(checkIn)) / 86400000
  return diff > 0 ? Math.round(diff) : 0
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function MyBookings() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchBookings()
  }, [user])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/bookings/my', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setBookings(res.data.data || [])
    } catch {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return
    setCancelling(id)
    try {
      await axios.put(`/api/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success('Booking cancelled')
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, status: 'cancelled' } : b))
      )
    } catch {
      toast.error('Failed to cancel')
    } finally {
      setCancelling(null)
    }
  }

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <FiLoader className="animate-spin text-amber-400" size={40} />
          <p>Loading your bookings…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
      >
        <FiArrowLeft /> Back
      </button>

      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">My Bookings</h1>
          <p className="mt-1 text-slate-400">{bookings.length} booking{bookings.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/" className="btn-secondary">Explore More Hotels</Link>
      </div>

      {bookings.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              onCancel={handleCancel}
              cancelling={cancelling === booking._id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BookingCard({ booking, onCancel, cancelling }) {
  const nights = nightsBetween(booking.checkIn, booking.checkOut)
  const isConfirmed = booking.status === 'confirmed'

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        {/* Hotel Image */}
        {booking.hotelImage && (
          <div className="sm:w-48 h-40 sm:h-auto flex-shrink-0">
            <img
              src={booking.hotelImage}
              alt={booking.hotelName}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              onError={(event) => {
                if (!event.currentTarget.src.endsWith('/fallback-travel.svg')) {
                  event.currentTarget.src = '/fallback-travel.svg'
                }
              }}
            />
          </div>
        )}

        {/* Details */}
        <div className="flex-1 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">{booking.hotelName}</h2>
              {booking.cityName && (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-400">
                  <FiMapPin size={13} className="text-amber-400" /> {booking.cityName}
                </p>
              )}
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusColors[booking.status] || statusColors.confirmed}`}>
              {booking.status === 'confirmed' ? <><FiCheckCircle className="mr-1 inline" />Confirmed</> : <><FiXCircle className="mr-1 inline" />Cancelled</>}
            </span>
          </div>

          {/* Meta grid */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 text-sm">
            <MetaItem icon={<FiCalendar />} label="Check-in" value={fmtDate(booking.checkIn)} />
            <MetaItem icon={<FiCalendar />} label="Check-out" value={fmtDate(booking.checkOut)} />
            <MetaItem icon={<FiUsers />} label="Guests" value={`${booking.guests} guest${booking.guests > 1 ? 's' : ''}`} />
            <MetaItem icon={<FiHome />} label="Rooms" value={`${booking.rooms} room${booking.rooms > 1 ? 's' : ''} · ${nights} night${nights > 1 ? 's' : ''}`} />
            <div className="rounded-lg bg-white/5 p-2.5 col-span-2 sm:col-span-1">
              <p className="flex items-center gap-1 text-xs text-slate-500 uppercase tracking-tighter font-bold">Payment Method</p>
              <p className="mt-0.5 font-semibold text-amber-300 uppercase">{booking.paymentMethod}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-4 items-center">
            {booking.transactionId && (
              <div className="text-[10px] text-slate-500 font-mono bg-white/5 px-2 py-1 rounded">
                TXN ID: {booking.transactionId}
              </div>
            )}
            {booking.specialRequests && (
              <p className="rounded-lg bg-white/5 px-3 py-1 text-xs text-slate-400 italic">
                "{booking.specialRequests}"
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <span className="text-2xl font-black text-amber-300">
              Rs {booking.totalPrice?.toLocaleString('en-IN')}
              <span className="ml-1 text-sm font-medium text-slate-400">total</span>
            </span>
            {isConfirmed && (
              <button
                onClick={() => onCancel(booking._id)}
                disabled={cancelling}
                className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                <FiXCircle /> {cancelling ? 'Cancelling…' : 'Cancel Booking'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaItem({ icon, label, value }) {
  return (
    <div className="rounded-lg bg-white/5 p-2.5">
      <p className="flex items-center gap-1 text-xs text-slate-500">{icon} {label}</p>
      <p className="mt-0.5 font-semibold text-white">{value}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-24 text-center">
      <div className="mb-4 text-6xl">🏨</div>
      <h3 className="text-xl font-black text-white">No bookings yet</h3>
      <p className="mt-2 text-slate-400">Browse hotels and make your first booking!</p>
      <Link to="/" className="btn-primary mt-6">Explore Hotels</Link>
    </div>
  )
}
