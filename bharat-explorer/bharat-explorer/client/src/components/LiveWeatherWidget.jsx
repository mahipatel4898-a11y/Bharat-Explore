import { useState, useEffect } from 'react'
import axios from 'axios'
import { FiSun, FiCloud, FiCloudRain, FiWind, FiDroplet, FiZap, FiNavigation, FiMapPin } from 'react-icons/fi'

const conditionConfig = {
  Clear: { icon: <FiSun />, color: 'from-amber-400 to-orange-600', glow: 'shadow-amber-500/20' },
  'Partly Cloudy': { icon: <FiCloud />, color: 'from-blue-300 to-slate-500', glow: 'shadow-blue-400/20' },
  Cloudy: { icon: <FiCloud />, color: 'from-slate-400 to-slate-600', glow: 'shadow-slate-500/20' },
  Rain: { icon: <FiCloudRain />, color: 'from-blue-500 to-indigo-800', glow: 'shadow-indigo-500/20' },
  Mist: { icon: <FiCloud />, color: 'from-teal-300 to-slate-500', glow: 'shadow-teal-500/20' },
  Thunderstorm: { icon: <FiZap />, color: 'from-purple-500 to-indigo-900', glow: 'shadow-purple-500/20' },
}

export default function LiveWeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await axios.get(`/api/weather?lat=${latitude}&lng=${longitude}`)
          setWeather(res.data.data)
        } catch (err) {
          setError('Failed to fetch weather')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('Location access denied')
        setLoading(false)
      }
    )
  }, [])

  if (loading) return (
    <div className="h-32 w-full max-w-[280px] animate-pulse rounded-2xl bg-white/5 border border-white/10" />
  )
  
  if (error || !weather) return null

  const config = conditionConfig[weather.condition] || conditionConfig.Clear

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-white/20 bg-black/40 p-5 backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] ${config.glow} shadow-2xl w-full max-w-[280px]`}>
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${config.color} opacity-20 blur-3xl transition-all duration-700 group-hover:opacity-40 group-hover:scale-125`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-teal-400">
              <FiMapPin className="animate-bounce" /> {weather.location}
            </span>
            <div className="mt-1 flex items-baseline">
              <h2 className="text-4xl font-black tracking-tighter text-white">
                {weather.temp}
                <span className="text-2xl font-light text-white/60 ml-0.5">°</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[11px] font-bold text-white/70">{weather.condition}</p>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <p className="text-[10px] font-medium text-white/40 italic">Feels {weather.feelsLike}°</p>
            </div>
          </div>
          
          <div className={`rounded-xl bg-gradient-to-br ${config.color} p-2.5 text-2xl text-white shadow-lg shadow-black/20`}>
            {config.icon}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10">
            <FiDroplet size={14} className="text-blue-400" />
            <div className="flex flex-col">
              <span className="text-[8px] font-bold uppercase tracking-wider text-white/30">Humidity</span>
              <span className="text-[10px] font-black text-white">{weather.humidity}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10">
            <FiWind size={14} className="text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[8px] font-bold uppercase tracking-wider text-white/30">Wind</span>
              <span className="text-[10px] font-black text-white">{weather.wind} <span className="text-[7px] opacity-50">km/h</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
