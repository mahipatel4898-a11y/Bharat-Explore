import { useState, useEffect } from 'react'
import axios from 'axios'
import { FiSun, FiCloud, FiCloudRain, FiWind, FiDroplet, FiZap, FiNavigation } from 'react-icons/fi'

const conditionConfig = {
  Sunny: { icon: <FiSun />, color: 'from-amber-400 to-orange-600', glow: 'shadow-amber-500/20' },
  Clear: { icon: <FiSun />, color: 'from-blue-400 to-indigo-600', glow: 'shadow-blue-500/20' },
  Cloudy: { icon: <FiCloud />, color: 'from-slate-400 to-slate-600', glow: 'shadow-slate-500/20' },
  'Partly Cloudy': { icon: <FiCloud />, color: 'from-blue-300 to-slate-500', glow: 'shadow-blue-400/20' },
  Rain: { icon: <FiCloudRain />, color: 'from-blue-500 to-indigo-800', glow: 'shadow-indigo-500/20' },
  Mist: { icon: <FiCloud />, color: 'from-teal-300 to-slate-500', glow: 'shadow-teal-500/20' },
  Thunderstorm: { icon: <FiZap />, color: 'from-purple-500 to-indigo-900', glow: 'shadow-purple-500/20' },
}

export default function WeatherWidget({ city, initialData }) {
  const [weather, setWeather] = useState(initialData)
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    if (initialData) {
      setWeather(initialData)
      setLoading(false)
      return
    }
    if (!city) return
    setLoading(true)
    axios.get(`/api/weather/${city}`)
      .then(res => setWeather(res.data.data))
      .catch(() => setWeather(null))
      .finally(() => setLoading(false))
  }, [city, initialData])

  if (loading) return (
    <div className="h-32 w-48 animate-pulse rounded-2xl bg-white/5 border border-white/10" />
  )
  
  if (!weather) return null

  const config = conditionConfig[weather.condition] || conditionConfig.Clear
  const high = weather.high
  const low = weather.low
  const feelsLike = weather.feelsLike

  return (
    <div className={`group relative min-w-[200px] overflow-hidden rounded-2xl border border-white/20 bg-white/5 p-5 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:bg-white/10 ${config.glow} shadow-2xl`}>
      {/* Decorative background glow */}
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${config.color} opacity-20 blur-3xl transition-all duration-700 group-hover:opacity-40 group-hover:scale-125`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              <FiNavigation className="text-[8px]" /> {city}
            </span>
            <div className="mt-1 flex items-baseline">
              <h2 className="text-5xl font-black tracking-tighter text-white">
                {weather.temp}
                <span className="text-2xl font-light text-white/60 ml-0.5">°</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[11px] font-bold text-white/70">{weather.condition}</p>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <p className="text-[10px] font-medium text-white/40 italic">Feels {feelsLike}°</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className={`rounded-xl bg-gradient-to-br ${config.color} p-2.5 text-2xl text-white shadow-lg shadow-black/20 transition-transform duration-500 group-hover:rotate-12`}>
              {config.icon}
            </div>
            <div className="flex flex-col items-center text-[9px] font-black text-white/30 uppercase">
              <span>H:{high}°</span>
              <span>L:{low}°</span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/20 text-blue-400">
              <FiDroplet size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold uppercase tracking-wider text-white/30">Humidity</span>
              <span className="text-[11px] font-black text-white">{weather.humidity}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400">
              <FiWind size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold uppercase tracking-wider text-white/30">Wind</span>
              <span className="text-[11px] font-black text-white">{weather.wind} <span className="text-[8px] font-medium opacity-50">km/h</span></span>
            </div>
          </div>
        </div>
      </div>

      {weather.isMock && (
        <div className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-amber-500/10 py-1 border border-amber-500/20 transition-colors group-hover:bg-amber-500/20">
          <span className="h-1 w-1 animate-pulse rounded-full bg-amber-500" />
          <span className="text-[8px] font-black uppercase tracking-widest text-amber-500/80">Live Demo</span>
        </div>
      )}
    </div>
  )
}
