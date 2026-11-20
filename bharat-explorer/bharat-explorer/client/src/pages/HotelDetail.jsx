import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { FiArrowLeft, FiCheck, FiGlobe, FiHeart, FiMapPin, FiPhone, FiSend, FiStar, FiCalendar } from 'react-icons/fi'
import BookingModal from '../components/BookingModal'

export default function HotelDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [hotel, setHotel] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [showBooking, setShowBooking] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [hotelResponse, reviewResponse] = await Promise.all([
          axios.get(`/api/hotels/${id}`),
          axios.get(`/api/reviews/${id}`),
        ])
        setHotel(hotelResponse.data.data)
        setReviews(reviewResponse.data.data || [])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const toggleWishlist = () => {
    if (isInWishlist(id)) removeFromWishlist(id)
    else addToWishlist({ itemId: id, type: 'hotel', name: hotel.name, image: hotel.images?.[0], cityName: hotel.cityId?.name })
  }

  const submitReview = async (event) => {
    event.preventDefault()
    if (!reviewForm.comment.trim()) {
      toast.error('Please write a comment')
      return
    }
    try {
      await axios.post('/api/reviews', {
        targetId: id,
        targetType: 'hotel',
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      }, { headers: { Authorization: `Bearer ${token}` } })
      setReviewForm({ rating: 5, comment: '' })
      const response = await axios.get(`/api/reviews/${id}`)
      setReviews(response.data.data || [])
      toast.success('Review submitted')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review')
    }
  }

  if (loading) return <div className="page-shell"><div className="skeleton h-96 rounded-lg" /></div>
  if (!hotel) return <div className="py-32 text-center text-slate-400">Hotel not found</div>

  const wishlisted = isInWishlist(id)

  return (
    <div className="page-shell">
      <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">
        <FiArrowLeft /> Back
      </button>

      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="relative overflow-hidden rounded-xl border border-white/5 shadow-luxury">
            <img
              src={hotel.images?.[0] || '/fallback-travel.svg'}
              alt={hotel.name}
              decoding="async"
              className="h-[500px] w-full object-cover"
              onError={(event) => {
                if (!event.currentTarget.src.endsWith('/fallback-travel.svg')) {
                  event.currentTarget.src = '/fallback-travel.svg'
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent" />
            <div className="absolute bottom-0 p-8">
              <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-widest text-brand-gold-500">{hotel.category}</span>
              <h1 className="text-4xl font-serif text-white md:text-6xl drop-shadow-lg">{hotel.name}</h1>
              <p className="mt-4 flex items-center gap-2 text-brand-muted font-light"><FiMapPin className="text-brand-gold-500" /> {hotel.address}</p>
            </div>
            <button onClick={toggleWishlist} className={`absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-md transition ${wishlisted ? 'bg-red-500/90 text-white' : 'bg-brand-black/50 text-white hover:bg-brand-gold-500 hover:text-brand-black'}`}>
              <FiHeart className={wishlisted ? 'fill-current' : ''} size={18} />
            </button>
          </div>

          <div className="mt-10 glass-card p-8 border-none bg-transparent shadow-none">
            <div className="mb-8 flex flex-wrap gap-4 text-sm font-light text-brand-muted border-b border-white/10 pb-6">
              <span className="flex items-center gap-2 pr-6 border-r border-white/10"><FiStar className="fill-current text-brand-gold-500" size={16} /> {hotel.rating?.toFixed(1)} Rating</span>
              <span className="flex items-center gap-2 pr-6 border-r border-white/10 text-brand-gold-500">₹{hotel.pricePerNight?.toLocaleString('en-IN')} <span className="text-xs text-brand-muted">/ night</span></span>
              <span className="flex items-center gap-2 capitalize">{hotel.category} Stay</span>
            </div>
            <p className="text-lg font-light leading-relaxed text-slate-300">{hotel.description}</p>

            <div className="mt-10">
              <h3 className="mb-6 text-2xl font-serif text-white">Premium Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hotel.amenities?.map((amenity) => (
                  <span key={amenity} className="flex items-center gap-3 text-sm font-light text-brand-muted">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gold-500/10 text-brand-gold-500">
                      <FiCheck size={12} />
                    </span>
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-8 mt-4 lg:mt-0">
          <div className="glass-card p-8 border border-brand-gold-500/20 bg-brand-black/60 shadow-luxury">
            <div className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Reserve Your Stay</div>
            <div className="mt-3 text-5xl font-serif text-brand-gold-500">₹{hotel.pricePerNight?.toLocaleString('en-IN')}</div>
            <div className="mb-8 text-sm font-light text-brand-muted">per night, taxes included</div>
            <button
              onClick={() => setShowBooking(true)}
              className="btn-primary mb-4 w-full h-14 text-sm tracking-widest"
            >
              <FiCalendar /> Secure Reservation
            </button>
            {hotel.contact && <a href={`tel:${hotel.contact}`} className="btn-secondary mb-3 w-full h-12 border-none bg-white/5"><FiPhone /> Contact Concierge</a>}
            {hotel.website && <a href={hotel.website} target="_blank" rel="noreferrer" className="btn-secondary w-full h-12 border-none bg-white/5"><FiGlobe /> Official Website</a>}
          </div>

          <div className="glass-card overflow-hidden rounded-xl border border-white/5 shadow-luxury">
            <iframe
              src={`https://maps.google.com/maps?q=${hotel.coordinates?.lat},${hotel.coordinates?.lng}&z=16&output=embed`}
              className="h-80 w-full border-0 filter grayscale contrast-125 opacity-80"
              loading="lazy"
              title={`${hotel.name} map`}
            />
            <div className="bg-brand-black p-4 text-center text-xs font-light tracking-widest text-brand-muted uppercase border-t border-white/5">Location Coordinates: {hotel.coordinates?.lat?.toFixed(4)}, {hotel.coordinates?.lng?.toFixed(4)}</div>
          </div>
        </aside>
      </div>

      <section className="mt-16 border-t border-white/10 pt-16">
        <h2 className="mb-10 text-3xl font-serif text-white text-center">Guest Experiences</h2>
        {user ? (
          <form onSubmit={submitReview} className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button key={rating} type="button" onClick={() => setReviewForm((current) => ({ ...current, rating }))} className={`text-2xl ${reviewForm.rating >= rating ? 'text-amber-300' : 'text-slate-600'}`}>*</button>
              ))}
            </div>
            <textarea value={reviewForm.comment} onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))} rows="3" placeholder="How was your stay?" className="input-field resize-none" />
            <button type="submit" className="btn-primary mt-3"><FiSend /> Submit Review</button>
          </form>
        ) : (
          <div className="mb-6 rounded-lg bg-white/5 p-4 text-center text-sm text-slate-400">
            <Link to="/login" className="font-bold text-amber-300">Login</Link> to write a review.
          </div>
        )}

        <div className="space-y-6 max-w-4xl mx-auto">
          {reviews.length === 0 ? (
            <p className="py-10 text-center text-brand-muted font-light italic">Be the first to share your experience at this property.</p>
          ) : reviews.map((review) => (
            <div key={review._id} className="rounded-xl border border-white/5 bg-brand-gray/50 p-8 shadow-luxury">
              <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                <div>
                  <div className="font-serif text-lg text-white">{review.userName || 'Distinguished Guest'}</div>
                  <div className="text-xs font-light tracking-widest uppercase text-brand-muted mt-1">{new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div className="flex items-center gap-1 font-serif text-lg text-brand-gold-500">
                  {review.rating} <FiStar className="fill-current text-brand-gold-500" size={14} />
                </div>
              </div>
              <p className="text-sm font-light leading-relaxed text-slate-300 italic">"{review.comment}"</p>
            </div>
          ))}
        </div>
      </section>

      {showBooking && hotel && (
        <BookingModal hotel={hotel} onClose={() => setShowBooking(false)} />
      )}
    </div>
  )
}
