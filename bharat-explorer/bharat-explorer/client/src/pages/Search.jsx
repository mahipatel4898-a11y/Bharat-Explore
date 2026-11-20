import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import CityCard from '../components/CityCard'
import PlaceCard from '../components/PlaceCard'
import HotelCard from '../components/HotelCard'
import FoodCard from '../components/FoodCard'
import { FiSearch, FiX } from 'react-icons/fi'

const tabs = ['All', 'Cities', 'Places', 'Hotels', 'Food']
const smartSuggestions = ['Goa', 'beach', 'historical', 'romantic', 'mountains', 'Gujarati food', 'luxury hotel', 'Udaipur palace']

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const [query, setQuery] = useState(q)
  const [results, setResults] = useState({ cities: [], places: [], hotels: [], foods: [] })
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('All')

  useEffect(() => {
    setQuery(q)
    if (!q.trim()) {
      setResults({ cities: [], places: [], hotels: [], foods: [] })
      setSuggestions([])
      return
    }
    fetchResults(q)
  }, [q])

  const fetchResults = async (searchTerm) => {
    setLoading(true)
    try {
      const { data } = await axios.get(`/api/search?q=${encodeURIComponent(searchTerm)}`)
      setResults(data.data || data.results || { cities: [], places: [], hotels: [], foods: [] })
      setSuggestions(data.suggestions || [])
    } catch {
      setResults({ cities: [], places: [], hotels: [], foods: [] })
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const total = useMemo(
    () => results.cities.length + results.places.length + results.hotels.length + results.foods.length,
    [results],
  )

  const handleSearch = (event) => {
    event.preventDefault()
    if (query.trim()) setParams({ q: query.trim() })
  }

  const shouldShow = (section) => tab === 'All' || tab === section

  return (
    <div className="page-shell">
      <div className="mb-8 rounded-lg border border-white/10 bg-slate-950/60 p-5">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-amber-300">Smart Search</p>
        <h1 className="text-3xl font-black text-white md:text-5xl">Find cities, stays, food, and experiences.</h1>
        <form onSubmit={handleSearch} className="mt-6 flex max-w-3xl flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try Goa, beach, City Palace, dhokla..."
              className="input-field pl-12"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <FiX size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary">Search</button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {(suggestions.length ? suggestions : smartSuggestions).slice(0, 8).map((item) => (
            <button key={item} onClick={() => setParams({ q: item })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:border-amber-300/50 hover:text-white">
              {item}
            </button>
          ))}
        </div>
      </div>

      {q && !loading && (
        <div className="mb-6">
          <h2 className="text-xl font-black text-white">
            {total > 0 ? `${total} results for "${q}"` : `No results found for "${q}"`}
          </h2>
          {total === 0 && <p className="mt-2 text-slate-400">Try categories like beach, historical, mountains, romantic, food, or hotel.</p>}
        </div>
      )}

      {!q && (
        <div className="py-16 text-center">
          <h2 className="text-2xl font-black text-white">Start with a destination or travel mood.</h2>
          <p className="mt-2 text-slate-400">Search understands city names, places, hotel categories, food, and tags.</p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => <div key={index} className="skeleton h-72 rounded-lg" />)}
        </div>
      )}

      {!loading && total > 0 && (
        <>
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
            {tabs.map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${tab === item ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'}`}>
                {item}
              </button>
            ))}
          </div>

          {shouldShow('Cities') && results.cities.length > 0 && (
            <Section title="Cities">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.cities.map((city) => <CityCard key={city._id} city={city} />)}
              </div>
            </Section>
          )}

          {shouldShow('Places') && results.places.length > 0 && (
            <Section title="Tourist Places">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.places.map((place) => <PlaceCard key={place._id} place={place} />)}
              </div>
            </Section>
          )}

          {shouldShow('Hotels') && results.hotels.length > 0 && (
            <Section title="Hotels">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.hotels.map((hotel) => <HotelCard key={hotel._id} hotel={hotel} />)}
              </div>
            </Section>
          )}

          {shouldShow('Food') && results.foods.length > 0 && (
            <Section title="Local Food">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {results.foods.map((food) => <FoodCard key={food._id} food={food} />)}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-xl font-black text-white">{title}</h2>
      {children}
    </section>
  )
}
