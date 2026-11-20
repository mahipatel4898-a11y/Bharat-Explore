import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import FoodCard from '../components/FoodCard'
import HotelCard from '../components/HotelCard'
import PlaceCard from '../components/PlaceCard'
import WeatherWidget from '../components/WeatherWidget'
import { FiArrowLeft, FiCalendar, FiMapPin, FiNavigation, FiStar } from 'react-icons/fi'

const tabs = ['Overview', 'Places', 'Hotels', 'Food']

export default function CityDetail() {
  const { id } = useParams()
  const [city, setCity] = useState(null)
  const [places, setPlaces] = useState([])
  const [hotels, setHotels] = useState([])
  const [foods, setFoods] = useState([])
  const [activeTab, setActiveTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [weather, setWeather] = useState(null)
  const [hotelSort, setHotelSort] = useState('rating')
  const [placeType, setPlaceType] = useState('')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const guideResponse = await axios.get(`/api/cities/${id}/travel-guide`)
        const guide = guideResponse.data.data || {}
        const cityData = guide.city
        setCity(cityData)
        setPlaces(guide.places || [])
        setHotels(guide.hotels || [])
        setFoods(guide.foods || [])
        
        // Fetch weather once for the city
        if (cityData) {
          const weatherRes = await axios.get(`/api/weather/${cityData.name}`)
          setWeather(weatherRes.data.data)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id])

  const fetchHotels = async (sort) => {
    setHotelSort(sort)
    const { data } = await axios.get(`/api/hotels?city=${id}&sort=${sort}`)
    setHotels(data.data || [])
  }

  const placeTypes = useMemo(() => ['', ...new Set(places.map((place) => place.type))], [places])
  const filteredPlaces = placeType ? places.filter((place) => place.type === placeType) : places

  if (loading) {
    return (
      <div className="page-shell">
        <div className="skeleton mb-8 h-96 rounded-lg" />
        <div className="grid gap-6 md:grid-cols-3">{[...Array(6)].map((_, index) => <div key={index} className="skeleton h-64 rounded-lg" />)}</div>
      </div>
    )
  }

  if (!city) return <div className="py-32 text-center text-slate-400">City not found</div>

  return (
    <div>
      <section className="relative min-h-[440px] overflow-hidden">
        <img
          src={city.coverImage || city.image}
          alt={city.name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            if (!event.currentTarget.src.endsWith('/fallback-travel.svg')) {
              event.currentTarget.src = '/fallback-travel.svg'
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d14] via-black/45 to-black/20" />
        <div className="relative z-10 mx-auto flex min-h-[440px] max-w-7xl flex-col justify-end px-4 pb-10 sm:px-6 lg:px-8">
          <Link to="/" className="mb-10 flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/50">
            <FiArrowLeft /> Back
          </Link>
          <div className="mb-3 flex w-fit items-center gap-2 rounded-lg bg-amber-400 px-3 py-1 text-sm font-black text-slate-950">
            <FiMapPin /> {city.state}
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-black text-white md:text-7xl">{city.name}</h1>
              <p className="mt-4 text-lg leading-relaxed text-slate-200">{city.description}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-200">
                <span className="rounded-lg bg-white/10 px-3 py-2 backdrop-blur"><FiCalendar className="mr-1 inline text-teal-300" /> {city.bestSeason}</span>
                <span className="rounded-lg bg-white/10 px-3 py-2 backdrop-blur">Rs {city.avgBudget?.toLocaleString('en-IN')}/day avg budget</span>
                <span className="rounded-lg bg-white/10 px-3 py-2 backdrop-blur">{places.length} places planned</span>
              </div>
            </div>
            <div className="hidden lg:block pb-1">
              <WeatherWidget city={city.name} initialData={weather} />
            </div>
          </div>
        </div>
      </section>

      <div className="page-shell">
        <div className="mb-8 flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-1 w-fit">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-md px-5 py-2.5 text-sm font-bold transition ${activeTab === tab ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Overview' && (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="glass-card p-6 border-l-4 border-amber-400">
                <h2 className="mb-3 text-2xl font-black text-white">Why visit {city.name}</h2>
                <p className="leading-relaxed text-slate-300">{city.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {city.highlights?.map((highlight) => <span key={highlight} className="badge bg-amber-400/15 text-amber-200 border border-amber-400/20">{highlight}</span>)}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  [places.length, 'Tourist places'],
                  [hotels.length, 'Curated hotels'],
                  [foods.length, 'Food picks'],
                ].map(([value, label]) => (
                  <div key={label} className="glass-card p-5 text-center group hover:bg-white/10 transition-all duration-300">
                    <div className="text-3xl font-black text-amber-300 group-hover:scale-110 transition-transform">{value}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-400">{label}</div>
                  </div>
                ))}
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Atmospheric Insight</h3>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">
                    <FiStar size={16} />
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                   <div className="w-full md:w-auto">
                     <WeatherWidget city={city.name} initialData={weather} />
                   </div>
                   <div className="flex-1 space-y-3">
                     <p className="text-sm text-slate-400 italic">"The best time to experience {city.name} is during <strong>{city.bestSeason}</strong> when the climate is most favorable for exploration and outdoor activities."</p>
                     <div className="flex gap-2">
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-slate-300">#WeatherReady</span>
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-slate-300">#TravelInsights</span>
                     </div>
                   </div>
                </div>
              </div>

              <Link to="/trip-planner" state={{ cityId: id, cityName: city.name }} className="btn-primary w-full py-4 text-lg">
                Start Planning to {city.name} <FiNavigation className="ml-2" />
              </Link>
            </div>

            <div className="space-y-6">
              <div className="glass-card overflow-hidden h-fit border border-white/10">
                <iframe
                  src={`https://maps.google.com/maps?q=${city.coordinates?.lat},${city.coordinates?.lng}&z=12&output=embed`}
                  className="h-[360px] w-full border-0 grayscale opacity-80 contrast-125 transition-all duration-700 hover:grayscale-0 hover:opacity-100"
                  loading="lazy"
                  title={`${city.name} map`}
                />
                <div className="p-4 flex items-center justify-between bg-black/40 backdrop-blur-md">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Live Geographic Context
                  </div>
                  <div className="text-[10px] font-mono text-amber-300/50">
                    {city.coordinates?.lat?.toFixed(4)}° N, {city.coordinates?.lng?.toFixed(4)}° E
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Places' && (
          <div>
            <div className="mb-6 flex flex-wrap gap-2">
              {placeTypes.map((type) => (
                <button key={type || 'all'} onClick={() => setPlaceType(type)} className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition ${placeType === type ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-300 hover:bg-white/15'}`}>
                  {type || 'All'}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPlaces.map((place) => <PlaceCard key={place._id} place={place} />)}
            </div>
          </div>
        )}

        {activeTab === 'Hotels' && (
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-400">Sort by</span>
              {[
                ['rating', 'Rating'],
                ['price_asc', 'Price low to high'],
                ['price_desc', 'Price high to low'],
              ].map(([value, label]) => (
                <button key={value} onClick={() => fetchHotels(value)} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${hotelSort === value ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-300 hover:bg-white/15'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hotels.map((hotel) => <HotelCard key={hotel._id} hotel={hotel} />)}
            </div>
          </div>
        )}

        {activeTab === 'Food' && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {foods.map((food) => <FoodCard key={food._id} food={food} />)}
          </div>
        )}
      </div>
    </div>
  )
}
