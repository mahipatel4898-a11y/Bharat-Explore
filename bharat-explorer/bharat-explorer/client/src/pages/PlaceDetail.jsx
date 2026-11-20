import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { FiArrowLeft, FiClock, FiHeart, FiMapPin, FiSend, FiStar } from 'react-icons/fi'

export default function PlaceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [place, setPlace] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [placeResponse, reviewResponse] = await Promise.all([
          axios.get(`/api/places/${id}`),
          axios.get(`/api/reviews/${id}`),
        ])
        setPlace(placeResponse.data.data)
        setReviews(reviewResponse.data.data || [])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const toggleWishlist = () => {
    if (isInWishlist(id)) removeFromWishlist(id)
    else addToWishlist({ itemId: id, type: 'place', name: place.name, image: place.images?.[0], cityName: place.cityId?.name })
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
        targetType: 'place',
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
  if (!place) return <div className="py-32 text-center text-slate-400">Place not found</div>

  const wishlisted = isInWishlist(id)

  return (
    <div className="page-shell">
      <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">
        <FiArrowLeft /> Back
      </button>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="relative overflow-hidden rounded-lg border border-white/10">
            <img
              src={place.images?.[0] || '/fallback-travel.svg'}
              alt={place.name}
              decoding="async"
              className="h-[460px] w-full object-cover"
              onError={(event) => {
                if (!event.currentTarget.src.endsWith('/fallback-travel.svg')) {
                  event.currentTarget.src = '/fallback-travel.svg'
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 p-6">
              <span className="badge bg-amber-400 text-slate-950">{place.type}</span>
              <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">{place.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-slate-200"><FiMapPin className="text-amber-300" /> {place.cityId?.name}, {place.cityId?.state}</p>
            </div>
            <button onClick={toggleWishlist} className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-lg backdrop-blur transition ${wishlisted ? 'bg-red-500 text-white' : 'bg-black/45 text-white hover:bg-red-500'}`}>
              <FiHeart className={wishlisted ? 'fill-current' : ''} />
            </button>
          </div>

          <div className="mt-6 glass-card p-6">
            <div className="mb-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-300">
              <span className="rounded-lg bg-white/10 px-3 py-2"><FiStar className="mr-1 inline fill-current text-amber-300" /> {place.rating?.toFixed(1)}</span>
              <span className="rounded-lg bg-white/10 px-3 py-2"><FiClock className="mr-1 inline text-teal-300" /> {place.visitingTime}</span>
              <span className="rounded-lg bg-white/10 px-3 py-2">{place.entryFee === 0 ? 'Free entry' : `Rs ${place.entryFee}`}</span>
            </div>
            <p className="text-lg leading-relaxed text-slate-300">{place.description}</p>
            {place.tips && <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">Travel tip: {place.tips}</p>}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass-card overflow-hidden">
            <iframe
              src={`https://maps.google.com/maps?q=${place.coordinates?.lat},${place.coordinates?.lng}&z=16&output=embed`}
              className="h-72 w-full border-0"
              loading="lazy"
              title={`${place.name} map`}
            />
            <div className="p-4 text-sm text-slate-400">Coordinates: {place.coordinates?.lat?.toFixed(4)}, {place.coordinates?.lng?.toFixed(4)}</div>
          </div>
          <Link to="/trip-planner" state={{ cityId: place.cityId?._id, cityName: place.cityId?.name }} className="btn-primary w-full">Plan around this place</Link>
        </aside>
      </div>

      <section className="mt-8 glass-card p-6">
        <h2 className="mb-5 text-2xl font-black text-white">Reviews ({reviews.length})</h2>
        {user ? (
          <form onSubmit={submitReview} className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button key={rating} type="button" onClick={() => setReviewForm((current) => ({ ...current, rating }))} className={`text-2xl ${reviewForm.rating >= rating ? 'text-amber-300' : 'text-slate-600'}`}>*</button>
              ))}
            </div>
            <textarea value={reviewForm.comment} onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))} rows="3" placeholder="Share your experience..." className="input-field resize-none" />
            <button type="submit" className="btn-primary mt-3"><FiSend /> Submit Review</button>
          </form>
        ) : (
          <div className="mb-6 rounded-lg bg-white/5 p-4 text-center text-sm text-slate-400">
            <Link to="/login" className="font-bold text-amber-300">Login</Link> to write a review.
          </div>
        )}

        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="py-6 text-center text-slate-400">No reviews yet.</p>
          ) : reviews.map((review) => (
            <div key={review._id} className="rounded-lg bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-bold text-white">{review.userName || 'Traveller'}</div>
                  <div className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
                <div className="font-bold text-amber-300">{review.rating}/5</div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{review.comment}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
