import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import CityCard from '../components/CityCard'
import LiveWeatherWidget from '../components/LiveWeatherWidget'
import { FiArrowRight, FiCalendar, FiMapPin, FiSearch, FiShield, FiStar, FiUsers } from 'react-icons/fi'

const quickSearches = ['Luxury Villas', 'Boutique Hotels', 'Heritage Palaces', 'Beachfront Resorts']
const HeroScene = lazy(() => import('../components/HeroScene'))

export default function Home() {
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/cities')
      .then((response) => setCities(response.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  const citiesByState = useMemo(() => {
    return cities.reduce((acc, city) => {
      const state = city.state || 'Other'
      if (!acc[state]) acc[state] = []
      acc[state].push(city)
      return acc
    }, {})
  }, [cities])

  const featuredCity = useMemo(() => cities.find((city) => city.name === 'Udaipur') || cities[0], [cities])

  const handleSearch = (event) => {
    event.preventDefault()
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <div className="bg-[#090d14]">
      <section className="hero-bg relative min-h-[88vh] overflow-hidden">
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#090d14]" />
        <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-4 pb-16 pt-32 sm:px-6 lg:px-8 items-center text-center">
          <div className="max-w-4xl animate-fade-up flex flex-col items-center">
            <div className="mb-6 inline-flex items-center gap-2 text-sm font-semibold tracking-[0.2em] uppercase text-brand-gold-500">
              <span className="h-[1px] w-8 bg-brand-gold-500"></span>
              A World of Elegance
              <span className="h-[1px] w-8 bg-brand-gold-500"></span>
            </div>
            <h1 className="text-5xl font-serif leading-tight text-white md:text-7xl lg:text-8xl drop-shadow-2xl">
              Experience <br /> Luxury Living
            </h1>
            <p className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-slate-200 md:text-xl">
              Discover the world's most exquisite stays, curated for the modern traveler. Unwind in unparalleled elegance and comfort.
            </p>

            <form onSubmit={handleSearch} className="mt-12 w-full max-w-4xl rounded-xl border border-white/10 bg-brand-black/40 p-4 shadow-luxury backdrop-blur-2xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="relative text-left">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-muted">Destination</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold-500" size={18} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Where to next?"
                      className="h-12 w-full rounded-md border-none bg-white/5 pl-11 pr-4 text-white outline-none transition focus:ring-1 focus:ring-brand-gold-500"
                    />
                  </div>
                </div>
                <div className="relative text-left">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-muted">Check-in</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold-500" size={18} />
                    <input type="date" className="h-12 w-full rounded-md border-none bg-white/5 pl-11 pr-4 text-white outline-none transition focus:ring-1 focus:ring-brand-gold-500 [&::-webkit-calendar-picker-indicator]:invert" />
                  </div>
                </div>
                <div className="relative text-left">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-muted">Check-out</label>
                  <div className="relative">
                    <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gold-500" size={18} />
                    <input type="date" className="h-12 w-full rounded-md border-none bg-white/5 pl-11 pr-4 text-white outline-none transition focus:ring-1 focus:ring-brand-gold-500 [&::-webkit-calendar-picker-indicator]:invert" />
                  </div>
                </div>
                <button type="submit" className="btn-primary h-12 w-full">
                  Search
                </button>
              </div>
            </form>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {quickSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(item)}`)}
                  className="rounded-full border border-white/10 bg-black/40 px-5 py-2.5 text-xs font-medium tracking-wide text-brand-muted backdrop-blur transition hover:border-brand-gold-500/50 hover:text-brand-gold-500"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-col md:flex-row items-end gap-6 w-full">
            <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4 w-full">
              {[
                [cities.length, 'Curated cities'],
                ['150+', 'Tourist places'],
                ['100+', 'Hotel stays'],
                ['80+', 'Food picks'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-black/35 p-4 backdrop-blur transition hover:bg-white/5 group">
                  <div className="text-2xl font-black text-amber-300 group-hover:scale-110 transition-transform">{value}</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-200">{label}</div>
                </div>
              ))}
            </div>
            <div className="hidden lg:block shrink-0">
               <LiveWeatherWidget />
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell">
        <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end border-b border-white/10 pb-6">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-brand-gold-500">Destinations</p>
            <h2 className="section-title">Explore by Region</h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => <div key={index} className="skeleton h-80 rounded-lg" />)}
          </div>
        ) : (
          <div className="space-y-16">
            {Object.entries(citiesByState).map(([state, stateCities]) => (
              <div key={state} className="animate-fade-up">
                <div className="mb-8 flex items-center justify-center">
                  <h3 className="text-3xl font-serif italic text-white flex items-center gap-4">
                    <span className="h-[1px] w-12 bg-brand-gold-500/50 block"></span>
                    {state}
                    <span className="h-[1px] w-12 bg-brand-gold-500/50 block"></span>
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {stateCities.map((city) => <CityCard key={city._id} city={city} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-white/5 bg-brand-gray/50">
        <div className="page-shell grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-brand-gold-500">The Signature Collection</p>
            <h2 className="section-title">Elevate your travel experience.</h2>
            <p className="section-subtitle">
              Discover hand-picked luxury accommodations and curated local experiences. Our platform ensures that every aspect of your journey meets the highest standards of elegance and comfort.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {[
                [FiStar, 'Curated Luxury'],
                [FiMapPin, 'Prime Locations'],
              ].map(([Icon, label]) => (
                <div key={label} className="glass-card p-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-gold-500/10">
                    <Icon className="text-brand-gold-500" size={24} />
                  </div>
                  <div className="font-semibold text-white tracking-wide">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {featuredCity && (
            <Link to={`/city/${featuredCity._id}`} className="group relative min-h-[500px] overflow-hidden rounded-xl shadow-luxury">
              <img
                src={featuredCity.coverImage || featuredCity.image || '/fallback-travel.svg'}
                alt={featuredCity.name}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition duration-1000 group-hover:scale-105"
                onError={(event) => {
                  if (!event.currentTarget.src.endsWith('/fallback-travel.svg')) {
                    event.currentTarget.src = '/fallback-travel.svg'
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent" />
              <div className="absolute inset-0 border border-white/10 rounded-xl z-10 pointer-events-none mix-blend-overlay"></div>
              <div className="absolute bottom-0 p-8 z-20">
                <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-brand-gold-500">Featured Destination</div>
                <h3 className="text-4xl font-serif text-white">{featuredCity.name}</h3>
                <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-slate-300">{featuredCity.description}</p>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="page-shell py-20">
        <div className="relative overflow-hidden rounded-xl border border-brand-gold-500/20 bg-brand-gray p-10 text-center shadow-luxury">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-gold-500 via-transparent to-transparent"></div>
          <div className="relative z-10 mx-auto max-w-3xl">
            <h2 className="text-4xl font-serif text-white md:text-5xl">Curate Your Perfect Stay</h2>
            <p className="mt-6 text-lg font-light text-slate-300">Experience the height of elegance. Let our platform guide you to the finest luxury accommodations available.</p>
            <Link to="/search" className="mt-10 inline-flex items-center gap-3 rounded-md bg-brand-gold-500 px-8 py-4 text-sm font-semibold uppercase tracking-wider text-brand-black transition hover:bg-brand-gold-400">
              Start Exploring <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
