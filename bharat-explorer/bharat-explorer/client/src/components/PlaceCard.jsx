import { Link } from 'react-router-dom'
import { FiClock, FiHeart, FiMapPin, FiStar } from 'react-icons/fi'
import { useWishlist } from '../context/WishlistContext'

const typeColors = {
  historical: 'bg-amber-400/15 text-amber-200',
  nature: 'bg-emerald-400/15 text-emerald-200',
  religious: 'bg-violet-400/15 text-violet-200',
  adventure: 'bg-rose-400/15 text-rose-200',
  beach: 'bg-sky-400/15 text-sky-200',
  cultural: 'bg-fuchsia-400/15 text-fuchsia-200',
  wildlife: 'bg-lime-400/15 text-lime-200',
}

export default function PlaceCard({ place }) {
  const { addToWishlist, isInWishlist } = useWishlist()
  const inWish = isInWishlist(place._id)

  const handleWish = (event) => {
    event.preventDefault()
    addToWishlist({
      itemId: place._id,
      type: 'place',
      name: place.name,
      image: place.images?.[0],
      cityName: place.cityId?.name,
    })
  }

  return (
    <Link to={`/place/${place._id}`} className="group premium-card block overflow-hidden transform-gpu hover:rotate-[0.4deg]">
      <div className="relative h-52 overflow-hidden">
        <img
          src={place.images?.[0]}
          alt={place.name}
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
        <button onClick={handleWish} className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg backdrop-blur transition ${inWish ? 'bg-red-500 text-white' : 'bg-black/45 text-white hover:bg-red-500'}`}>
          <FiHeart size={15} className={inWish ? 'fill-current' : ''} />
        </button>
        <span className={`badge absolute left-3 top-3 ${typeColors[place.type] || 'bg-white/10 text-white'}`}>{place.type}</span>
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="text-lg font-black leading-tight text-white transition group-hover:text-amber-200">{place.name}</h3>
          <div className="flex items-center gap-1 rounded-md bg-amber-400 px-2 py-1 text-xs font-black text-slate-950">
            <FiStar size={12} className="fill-current" /> {place.rating?.toFixed(1)}
          </div>
        </div>
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <FiMapPin size={13} className="text-amber-300" /> {place.cityId?.name}
        </div>
        <p className="line-clamp-2 min-h-[44px] text-sm leading-relaxed text-slate-300">{place.description}</p>
        <div className="mt-4 flex items-center justify-between gap-4 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1"><FiClock className="text-teal-300" /> {place.duration || place.visitingTime}</span>
          <span className="text-emerald-300">{place.entryFee === 0 ? 'Free entry' : `Rs ${place.entryFee}`}</span>
        </div>
      </div>
    </Link>
  )
}
