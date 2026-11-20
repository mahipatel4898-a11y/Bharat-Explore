import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { useWishlist } from '../context/WishlistContext'
import { FiArrowLeft, FiHeart, FiMapPin, FiStar } from 'react-icons/fi'

export default function FoodDetail() {
  const { id } = useParams()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [food, setFood] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`/api/food/${id}`)
      .then((response) => setFood(response.data.data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="page-shell">
        <div className="skeleton h-96 rounded-lg" />
      </div>
    )
  }

  if (!food) return <div className="py-32 text-center text-slate-400">Food place not found</div>

  const wishlisted = isInWishlist(id)
  const toggleWishlist = () => {
    if (wishlisted) removeFromWishlist(id)
    else addToWishlist({ itemId: id, type: 'food', name: food.dishName, image: food.images?.[0], cityName: food.cityId?.name })
  }

  return (
    <div className="page-shell">
      <Link to={-1} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">
        <FiArrowLeft /> Back
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/60">
          <img
            src={food.images?.[0] || '/fallback-travel.svg'}
            alt={food.dishName}
            decoding="async"
            className="h-[420px] w-full object-cover"
            onError={(event) => {
              if (!event.currentTarget.src.endsWith('/fallback-travel.svg')) {
                event.currentTarget.src = '/fallback-travel.svg'
              }
            }}
          />
        </div>

        <div className="glass-card p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className={`badge ${food.isVeg ? 'bg-emerald-400/15 text-emerald-200' : 'bg-rose-400/15 text-rose-200'}`}>{food.isVeg ? 'Vegetarian' : 'Non-vegetarian'}</span>
            {food.mustTry && <span className="badge bg-amber-400/15 text-amber-200">Must try</span>}
          </div>
          <h1 className="text-4xl font-black text-white">{food.dishName}</h1>
          <p className="mt-2 text-lg font-bold text-amber-200">{food.restaurantName}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-300">
            <span className="flex items-center gap-1"><FiStar className="fill-current text-amber-300" /> {food.rating?.toFixed(1)} rating</span>
            <span className="flex items-center gap-1"><FiMapPin className="text-amber-300" /> {food.address}</span>
          </div>
          <p className="mt-5 leading-relaxed text-slate-300">{food.description}</p>
          <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-400">Typical price range</div>
            <div className="mt-1 text-2xl font-black text-emerald-300">{food.priceRange}</div>
          </div>
          <button onClick={toggleWishlist} className="btn-primary mt-6 w-full">
            <FiHeart className={wishlisted ? 'fill-current' : ''} /> {wishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
          </button>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-white/10">
        <iframe
          src={`https://maps.google.com/maps?q=${food.coordinates?.lat},${food.coordinates?.lng}&z=16&output=embed`}
          title={`${food.dishName} map`}
          className="h-80 w-full border-0"
          loading="lazy"
        />
      </div>
    </div>
  )
}
