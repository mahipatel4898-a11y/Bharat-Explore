import { Link } from 'react-router-dom'
import { FiArrowRight, FiCalendar, FiMapPin } from 'react-icons/fi'

export default function CityCard({ city }) {
  return (
    <Link to={`/city/${city._id}`} className="group premium-card block overflow-hidden transform-gpu hover:rotate-[0.4deg]">
      <div className="relative h-72 overflow-hidden">
        <img
          src={city.image}
          alt={city.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
          onError={(event) => {
            if (!event.currentTarget.src.endsWith('/fallback-travel.svg')) {
              event.currentTarget.src = '/fallback-travel.svg'
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/30 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {city.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="badge px-3 py-1.5 text-[10px] uppercase tracking-widest border border-brand-gold-500/30 bg-brand-black/60 text-brand-gold-500 backdrop-blur">{tag}</span>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-light tracking-widest uppercase text-brand-muted">
            <FiMapPin className="text-brand-gold-500" size={14} />
            {city.state}
          </div>
          <h3 className="text-3xl font-serif text-white">{city.name}</h3>
        </div>
      </div>
      <div className="p-6">
        <p className="line-clamp-2 min-h-[44px] text-sm font-light leading-relaxed text-brand-muted">{city.description}</p>
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/5 pt-5">
          <div className="text-sm font-light text-slate-400">
            <div className="flex items-center gap-2"><FiCalendar className="text-brand-gold-500" size={14} /> <span className="text-brand-muted">{city.bestSeason}</span></div>
            <div className="mt-1 font-medium text-brand-gold-500">₹{city.avgBudget?.toLocaleString('en-IN')}<span className="text-xs font-light text-brand-muted">/day</span></div>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-gold-500/30 bg-brand-gold-500/10 text-brand-gold-500 transition-all duration-300 group-hover:bg-brand-gold-500 group-hover:text-brand-black group-hover:shadow-luxury-hover">
            <FiArrowRight />
          </span>
        </div>
      </div>
    </Link>
  )
}
