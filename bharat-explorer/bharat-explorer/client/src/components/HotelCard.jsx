import { Link } from 'react-router-dom'
import { FiHeart, FiMapPin, FiStar, FiWifi } from 'react-icons/fi'
import { useWishlist } from '../context/WishlistContext'

const categoryColors = {
  budget: 'bg-white/5 border border-white/10 text-white',
  'mid-range': 'bg-white/5 border border-white/10 text-white',
  luxury: 'bg-brand-gold-500/10 border border-brand-gold-500/30 text-brand-gold-500',
}

export default function HotelCard({ hotel }) {
  const { addToWishlist, isInWishlist } = useWishlist()
  const inWish = isInWishlist(hotel._id)

  const handleWish = (event) => {
    event.preventDefault()
    addToWishlist({
      itemId: hotel._id,
      type: 'hotel',
      name: hotel.name,
      image: hotel.images?.[0],
      cityName: hotel.cityId?.name,
    })
  }

  return (
    <Link to={`/hotel/${hotel._id}`} className="group premium-card block overflow-hidden rounded-xl border border-white/5 bg-brand-gray transition duration-500 transform-gpu hover:-translate-y-2 hover:rotate-[0.4deg] hover:border-brand-gold-500/30 hover:shadow-luxury-hover">
      <div className="relative h-64 overflow-hidden">
        <img
          src={hotel.images?.[0]}
          alt={hotel.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
          onError={(event) => {
            if (!event.currentTarget.src.endsWith('/fallback-travel.svg')) {
              event.currentTarget.src = '/fallback-travel.svg'
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/20 to-transparent" />
        <button onClick={handleWish} className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition ${inWish ? 'bg-red-500/90 text-white' : 'bg-brand-black/50 text-white hover:bg-brand-gold-500 hover:text-brand-black'}`}>
          <FiHeart size={16} className={inWish ? 'fill-current' : ''} />
        </button>
        <span className={`badge absolute left-4 top-4 px-3 py-1.5 text-[10px] uppercase tracking-widest ${categoryColors[hotel.category] || 'bg-white/10 text-white'}`}>{hotel.category}</span>
        <div className="absolute bottom-4 right-4 rounded-md bg-brand-black/80 px-4 py-2 text-sm font-sans font-light text-brand-gold-500 backdrop-blur-md border border-white/10">
          ₹{hotel.pricePerNight?.toLocaleString('en-IN')} <span className="text-xs font-light text-brand-muted">/night</span>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-2xl font-serif text-white transition group-hover:text-brand-gold-500">{hotel.name}</h3>
          <span className="flex items-center gap-1.5 text-sm font-medium text-brand-gold-500"><FiStar className="fill-current" size={14} /> {hotel.rating?.toFixed(1)}</span>
        </div>
        <p className="mb-5 flex items-center gap-2 text-sm font-light text-brand-muted"><FiMapPin className="text-brand-gold-500" size={14} /> {hotel.address}</p>
        <div className="flex flex-wrap gap-2">
          {hotel.amenities?.slice(0, 3).map((amenity) => (
            <span key={amenity} className="rounded border border-white/5 bg-white/5 px-2.5 py-1 text-xs font-light tracking-wide text-brand-muted">
              {amenity === 'WiFi' && <FiWifi className="mr-1.5 inline text-brand-gold-500" size={12} />}{amenity}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
