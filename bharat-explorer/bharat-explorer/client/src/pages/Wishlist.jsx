import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { FiHeart, FiTrash2, FiArrowRight, FiStar } from 'react-icons/fi'

export default function Wishlist() {
  const { user, token } = useAuth()
  const { items, removeFromWishlist } = useWishlist()
  const [details, setDetails] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    const fetchDetails = async () => {
      try {
        const res = await axios.get('/api/wishlist', { headers: { Authorization: `Bearer ${token}` } })
        const wishlist = res.data.data?.items || []
        const fetched = await Promise.allSettled(
          wishlist.map(async (item) => {
            const endpoint = item.type === 'place' ? 'places' : item.type === 'hotel' ? 'hotels' : 'food'
            const response = await axios.get(`/api/${endpoint}/${item.itemId}`)
            return { ...response.data.data, _wishlistType: item.type, _wishlistItemId: item.itemId }
          })
        )
        setDetails(fetched.filter((result) => result.status === 'fulfilled').map((result) => result.value))
      } catch {
        setDetails([])
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [token, items.length])

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-red-400/30 bg-red-500/10 text-red-300">
          <FiHeart size={30} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Save Your Favourites</h2>
        <p className="text-gray-400 mb-6">Login to create your personalised wishlist of places, hotels, and food.</p>
        <div className="flex gap-3">
          <Link to="/login" className="btn-primary">Login</Link>
          <Link to="/register" className="btn-secondary">Sign Up</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => <div key={index} className="skeleton h-64 rounded-lg" />)}
        </div>
      </div>
    )
  }

  const typeColors = {
    place: 'bg-green-500/20 text-green-300',
    hotel: 'bg-blue-500/20 text-blue-300',
    food: 'bg-orange-500/20 text-orange-300',
  }
  const typeLabels = { place: 'Place', hotel: 'Hotel', food: 'Food' }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <FiHeart className="text-red-400" /> My Wishlist
          </h1>
          <p className="text-gray-400 mt-1">{details.length} saved item{details.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/" className="btn-secondary text-sm !py-2 !px-4">Browse More</Link>
      </div>

      {details.length === 0 ? (
        <div className="text-center py-24">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300">
            <FiHeart size={34} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Your wishlist is empty</h2>
          <p className="text-gray-400 mb-8">Explore India's top destinations and save your favourites.</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            Explore Cities <FiArrowRight />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {details.map((item) => (
            <div key={`${item._wishlistType}-${item._id}`} className="glass-card overflow-hidden group hover:border-white/20 transition-all">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={item.images?.[0] || item.image || '/fallback-travel.svg'}
                  alt={item.name || item.dishName}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(event) => {
                    if (!event.currentTarget.src.endsWith('/fallback-travel.svg')) {
                      event.currentTarget.src = '/fallback-travel.svg'
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-semibold ${typeColors[item._wishlistType]}`}>
                  {typeLabels[item._wishlistType] || item._wishlistType}
                </div>
                <button
                  onClick={() => removeFromWishlist(item._wishlistItemId)}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-lg flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                  title="Remove from wishlist"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>

              <div className="p-4">
                <h3 className="text-white font-bold text-base mb-1 truncate">{item.name || item.dishName}</h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">{item.description}</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-yellow-400 text-sm">
                    <FiStar size={12} />
                    <span className="font-semibold">{item.rating?.toFixed(1) || '4.0'}</span>
                  </div>
                  {item.pricePerNight && (
                    <span className="text-orange-400 font-bold text-sm">Rs {item.pricePerNight?.toLocaleString()}/night</span>
                  )}
                  {item.entryFee !== undefined && (
                    <span className="text-green-400 text-sm font-medium">
                      {item.entryFee === 0 ? 'Free Entry' : `Rs ${item.entryFee} entry`}
                    </span>
                  )}
                  {item.priceRange && (
                    <span className="text-orange-400 text-sm">{item.priceRange}</span>
                  )}
                </div>
                <Link
                  to={`/${item._wishlistType === 'place' ? 'place' : item._wishlistType === 'hotel' ? 'hotel' : 'food'}/${item._id}`}
                  className="mt-3 flex items-center gap-1 text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
                >
                  View Details <FiArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
