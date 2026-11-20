import { useState, useMemo } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { FiX, FiCalendar, FiUsers, FiHome, FiCreditCard, FiCheckCircle, FiChevronRight, FiChevronLeft, FiSmartphone, FiGlobe } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit / Debit Card', icon: <FiCreditCard /> },
  { id: 'upi', name: 'UPI (GPay, PhonePe, etc.)', icon: <FiSmartphone /> },
  { id: 'netbanking', name: 'Net Banking', icon: <FiGlobe /> },
]

export default function BookingModal({ hotel, onClose }) {
  const { user, token } = useAuth()
  const today = new Date().toISOString().split('T')[0]

  const [step, setStep] = useState('details') // details, payment, confirmed
  const [form, setForm] = useState({
    checkIn: today,
    checkOut: '',
    guests: 1,
    rooms: 1,
    specialRequests: '',
    paymentMethod: 'card',
  })
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(null)

  const nights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 0
    const diff = (new Date(form.checkOut) - new Date(form.checkIn)) / 86400000
    return diff > 0 ? diff : 0
  }, [form.checkIn, form.checkOut])

  const totalPrice = nights * hotel.pricePerNight * form.rooms

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'guests' || name === 'rooms' ? Number(value) : value }))
  }

  const handleNext = () => {
    if (!nights) return toast.error('Please select valid check-in and check-out dates')
    setStep('payment')
  }

  const handleBack = () => setStep('details')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulated payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    try {
      const res = await axios.post(
        '/api/bookings',
        { hotelId: hotel._id, ...form, totalPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setConfirmed(res.data.data)
      setStep('confirmed')
      toast.success('🎉 Booking & Payment Successful!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Try again.')
      setLoading(false)
    }
  }

  const handleBackdrop = (e) => { if (e.target === e.currentTarget && !loading) onClose() }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f1623] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-6 py-4">
          <h2 className="text-lg font-black text-white">
            {step === 'details' && `Book · ${hotel.name}`}
            {step === 'payment' && `Payment Details`}
            {step === 'confirmed' && `Booking Confirmed`}
          </h2>
          {!loading && (
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition">
              <FiX size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {!user ? (
            <div className="py-8 text-center">
              <p className="mb-4 text-slate-400">Please log in to make a booking.</p>
              <Link to="/login" onClick={onClose} className="btn-primary inline-flex">Login to Book</Link>
            </div>
          ) : step === 'confirmed' ? (
            <ConfirmationView booking={confirmed} onClose={onClose} />
          ) : step === 'payment' ? (
            <div className="space-y-6">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Total Amount:</span>
                  <span className="text-white font-bold">Rs {totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Booking for:</span>
                  <span className="text-white font-semibold">{nights} nights, {form.rooms} room(s)</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Select Payment Method</h3>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setForm(f => ({ ...f, paymentMethod: m.id }))}
                      className={`flex w-full items-center gap-3 rounded-xl border p-4 transition ${
                        form.paymentMethod === m.id
                          ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <span className="font-bold">{m.name}</span>
                      {form.paymentMethod === m.id && <div className="ml-auto h-2 w-2 rounded-full bg-amber-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  disabled={loading}
                  onClick={handleBack}
                  className="btn-secondary flex items-center justify-center gap-2 px-6"
                >
                  <FiChevronLeft /> Back
                </button>
                <button
                  disabled={loading}
                  onClick={handleSubmit}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> Processing Payment...</>
                  ) : (
                    <><FiCheckCircle /> Pay & Confirm Booking</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Price summary */}
              <div className="rounded-xl bg-amber-400/10 border border-amber-400/20 p-4 flex items-center justify-between">
                <span className="text-slate-300 text-sm font-semibold">Rs {hotel.pricePerNight?.toLocaleString('en-IN')} / night</span>
                {nights > 0 && (
                  <span className="text-amber-300 font-black text-lg">
                    Rs {totalPrice.toLocaleString('en-IN')} <span className="text-sm font-medium text-slate-400">total</span>
                  </span>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-400"><FiCalendar /> Check-in</span>
                  <input
                    type="date" name="checkIn" min={today}
                    value={form.checkIn} onChange={handleChange}
                    required className="input-field w-full"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-400"><FiCalendar /> Check-out</span>
                  <input
                    type="date" name="checkOut" min={form.checkIn || today}
                    value={form.checkOut} onChange={handleChange}
                    required className="input-field w-full"
                  />
                </label>
              </div>

              {nights > 0 && (
                <p className="text-center text-sm text-emerald-400 font-semibold">{nights} night{nights > 1 ? 's' : ''} · {form.rooms} room{form.rooms > 1 ? 's' : ''}</p>
              )}

              {/* Guests & Rooms */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-400"><FiUsers /> Guests</span>
                  <input type="number" name="guests" min={1} max={10} value={form.guests} onChange={handleChange} required className="input-field w-full" />
                </label>
                <label className="block">
                  <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-400"><FiHome /> Rooms</span>
                  <input type="number" name="rooms" min={1} max={5} value={form.rooms} onChange={handleChange} required className="input-field w-full" />
                </label>
              </div>

              {/* Special requests */}
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-400">Special Requests (optional)</span>
                <textarea
                  name="specialRequests" value={form.specialRequests} onChange={handleChange}
                  rows={2} placeholder="e.g. early check-in, ground floor room…"
                  className="input-field w-full resize-none"
                />
              </label>

              <button
                type="button"
                onClick={handleNext}
                disabled={!nights}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Continue to Payment <FiChevronRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConfirmationView({ booking, onClose }) {
  return (
    <div className="py-4 text-center space-y-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
        <FiCheckCircle size={36} />
      </div>
      <h3 className="text-2xl font-black text-white">Booking Confirmed!</h3>
      <p className="text-slate-400 text-sm">Your stay at <span className="text-white font-bold">{booking.hotelName}</span> is reserved and paid.</p>

      <div className="rounded-xl bg-white/5 border border-white/10 text-left p-4 space-y-2 text-sm">
        <Row label="Transaction ID" value={booking.transactionId} />
        <Row label="Payment Method" value={booking.paymentMethod?.toUpperCase()} />
        <Row label="Check-in" value={new Date(booking.checkIn).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} />
        <Row label="Check-out" value={new Date(booking.checkOut).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} />
        <Row label="Guests" value={booking.guests} />
        <Row label="Total Paid" value={`Rs ${booking.totalPrice?.toLocaleString('en-IN')}`} highlight />
        <Row label="Status" value="✅ PAID" />
      </div>

      <div className="flex gap-3">
        <Link to="/my-bookings" onClick={onClose} className="btn-secondary flex-1 text-center">View My Bookings</Link>
        <button onClick={onClose} className="btn-primary flex-1">Done</button>
      </div>
    </div>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={highlight ? 'text-amber-300 font-black' : 'text-white font-semibold'}>{value}</span>
    </div>
  )
}
