import { Link } from 'react-router-dom'
import { FiHeart, FiMapPin, FiStar } from 'react-icons/fi'
import { useWishlist } from '../context/WishlistContext'

export default function FoodCard({ food }) {
  const { addToWishlist, isInWishlist } = useWishlist()
  const inWish = isInWishlist(food._id)

  const handleWish = (event) => {
    event.preventDefault()
    addToWishlist({
      itemId: food._id,
      type: 'food',
      name: food.dishName,
      image: food.images?.[0],
      cityName: food.cityId?.name,
    })
  }

  return (
    <Link to={`/food/${food._id}`} className="group premium-card block overflow-hidden transform-gpu hover:rotate-[0.4deg]">
      <div className="relative h-48 overflow-hidden">
        <img
          src={food.images?.[0]}
          alt={food.dishName}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          onError={(event) => {
            if (!event.currentTarget.src.endsWith('/fallback-travel.svg')) {
              event.currentTarget.src = '/fallback-travel.svg'
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className={`badge ${food.isVeg ? 'bg-emerald-400/15 text-emerald-200' : 'bg-rose-400/15 text-rose-200'}`}>{food.isVeg ? 'Veg' : 'Non-veg'}</span>
          {food.mustTry && <span className="badge bg-amber-400/15 text-amber-200">Must try</span>}
        </div>
        <button onClick={handleWish} className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg backdrop-blur transition ${inWish ? 'bg-red-500 text-white' : 'bg-black/45 text-white hover:bg-red-500'}`}>
          <FiHeart size={15} className={inWish ? 'fill-current' : ''} />
        </button>
      </div>
      <div className="p-5">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="text-lg font-black leading-tight text-white transition group-hover:text-amber-200">{food.dishName}</h3>
          <span className="flex items-center gap-1 text-sm font-bold text-amber-300"><FiStar className="fill-current" size={14} /> {food.rating?.toFixed(1)}</span>
        </div>
        <p className="text-sm font-bold text-amber-200">{food.restaurantName}</p>
        <p className="mt-2 line-clamp-2 min-h-[44px] text-sm leading-relaxed text-slate-300">{food.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1 text-slate-400"><FiMapPin className="text-amber-300" /> {food.address?.split(',')[0]}</span>
          <span className="text-emerald-300">{food.priceRange}</span>
        </div>
      </div>
    </Link>
  )
}
