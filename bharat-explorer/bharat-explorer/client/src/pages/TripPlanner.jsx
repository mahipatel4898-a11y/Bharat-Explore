import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { FiAlertTriangle, FiCheckCircle, FiClock, FiMapPin, FiSend, FiStar } from 'react-icons/fi'

export default function TripPlanner() {
  const location = useLocation()
  const [cities, setCities] = useState([])
  const [form, setForm] = useState({
    cityId: location.state?.cityId || '',
    cityName: location.state?.cityName || '',
    days: 2,
    budget: 8000,
  })
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [chatHistory, setChatHistory] = useState([])

  useEffect(() => {
    axios.get('/api/cities').then((response) => setCities(response.data.data || []))
  }, [])

  const selectCity = (city) => {
    setForm((current) => ({ ...current, cityId: city._id, cityName: city.name, budget: Math.max(city.avgBudget * current.days, current.budget) }))
  }

  const handlePlan = async (event) => {
    event.preventDefault()
    if (!form.cityId) {
      toast.error('Select a city first')
      return
    }
    setLoading(true)
    setPlan(null)
    try {
      const { data } = await axios.post('/api/trip/plan', {
        cityId: form.cityId,
        days: Number(form.days),
        budget: Number(form.budget),
      })
      setPlan(data.plan)
      toast.success('Trip plan generated')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate plan')
    } finally {
      setLoading(false)
    }
  }

  const handleChat = async () => {
    const message = chatMsg.trim()
    if (!message) return
    setChatMsg('')
    setChatHistory((current) => [...current, { from: 'user', text: message }])
    try {
      const { data } = await axios.post('/api/trip/chat', { message })
      setChatHistory((current) => [...current, { from: 'bot', text: data.reply }])
    } catch {
      setChatHistory((current) => [...current, { from: 'bot', text: 'Sorry, I could not process that request.' }])
    }
  }

  return (
    <div className="page-shell">
      <div className="mb-10">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-amber-300">AI Trip Planner</p>
        <h1 className="text-4xl font-black text-white md:text-6xl">Plan a polished India itinerary.</h1>
        <p className="section-subtitle">Choose a city, days, and budget. Bharat Explorer arranges places, hotels, food, entry fees, and local transport into a day-wise plan.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.5fr]">
        <aside className="space-y-6">
          <form onSubmit={handlePlan} className="glass-card p-6">
            <h2 className="mb-5 text-xl font-black text-white">Trip Settings</h2>

            <label className="mb-2 block text-sm font-semibold text-slate-300">Destination</label>
            <div className="mb-5 grid grid-cols-2 gap-2">
              {cities.map((city) => (
                <button key={city._id} type="button" onClick={() => selectCity(city)} className={`rounded-lg px-3 py-3 text-left text-sm font-bold transition ${form.cityId === city._id ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-300 hover:bg-white/15'}`}>
                  {city.name}
                </button>
              ))}
            </div>

            <label className="mb-2 block text-sm font-semibold text-slate-300">Days: <span className="text-amber-300">{form.days}</span></label>
            <input type="range" min="1" max="7" value={form.days} onChange={(event) => setForm((current) => ({ ...current, days: event.target.value }))} className="mb-5 w-full accent-amber-400" />

            <label className="mb-2 block text-sm font-semibold text-slate-300">Budget: <span className="text-amber-300">Rs {Number(form.budget).toLocaleString('en-IN')}</span></label>
            <input type="range" min="2000" max="60000" step="500" value={form.budget} onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))} className="mb-6 w-full accent-amber-400" />

            <button type="submit" disabled={loading || !form.cityId} className="btn-primary w-full">
              {loading ? 'Generating...' : 'Generate itinerary'}
            </button>
          </form>

          <div className="glass-card p-5">
            <h3 className="mb-3 text-lg font-black text-white">Quick Assistant</h3>
            <div className="flex gap-2">
              <input
                value={chatMsg}
                onChange={(event) => setChatMsg(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleChat()}
                placeholder="Ask: best hotels in Goa"
                className="input-field flex-1 !py-2 text-sm"
              />
              <button onClick={handleChat} className="btn-primary !px-4 !py-2"><FiSend /></button>
            </div>
            {chatHistory.length > 0 && (
              <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                {chatHistory.map((message, index) => (
                  <div key={index} className={`rounded-lg px-3 py-2 text-sm ${message.from === 'user' ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-300'}`}>
                    {message.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section>
          {!plan && !loading && (
            <div className="glass-card flex min-h-[520px] flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-amber-400 text-2xl font-black text-slate-950">AI</div>
              <h2 className="text-2xl font-black text-white">Your itinerary appears here</h2>
              <p className="mt-2 max-w-md text-slate-400">Select a city and generate a premium day-wise plan for your project demo.</p>
            </div>
          )}

          {loading && <div className="space-y-4">{[...Array(3)].map((_, index) => <div key={index} className="skeleton h-52 rounded-lg" />)}</div>}

          {plan && (
            <div className="space-y-6 animate-fade-up">
              <div className={`rounded-lg border p-5 ${plan.withinBudget ? 'border-emerald-400/25 bg-emerald-400/10' : 'border-amber-400/25 bg-amber-400/10'}`}>
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex gap-3">
                    {plan.withinBudget ? <FiCheckCircle className="mt-1 text-emerald-300" size={24} /> : <FiAlertTriangle className="mt-1 text-amber-300" size={24} />}
                    <div>
                      <h2 className="text-xl font-black text-white">{form.cityName} - {plan.days} day plan</h2>
                      <p className="mt-1 text-sm text-slate-300">{plan.tips}</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-3xl font-black text-amber-300">Rs {Math.round(plan.estimatedCost?.total || 0).toLocaleString('en-IN')}</div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Estimated total</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ['Hotels', plan.estimatedCost?.hotels],
                  ['Food', plan.estimatedCost?.food],
                  ['Entry fees', plan.estimatedCost?.entry],
                  ['Transport', plan.estimatedCost?.localTransport],
                ].map(([label, value]) => (
                  <div key={label} className="glass-card p-4 text-center">
                    <div className="text-xl font-black text-white">Rs {Math.round(value || 0).toLocaleString('en-IN')}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
                  </div>
                ))}
              </div>

              {plan.itinerary?.map((day) => (
                <div key={day.day} className="glass-card p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-400 text-lg font-black text-slate-950">{day.day}</div>
                    <div>
                      <h3 className="text-xl font-black text-white">{day.title}</h3>
                      {day.flow && <p className="text-sm text-slate-400">{day.flow}</p>}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {day.places?.map((place, index) => (
                      <div key={place._id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="text-sm font-bold text-amber-300">Stop {index + 1}</div>
                            <h4 className="text-lg font-black text-white">{place.name}</h4>
                            <p className="mt-1 text-sm text-slate-400">{place.description}</p>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2 text-xs font-semibold text-slate-300">
                            <span className="rounded-md bg-white/10 px-2 py-1"><FiClock className="mr-1 inline" /> {place.duration}</span>
                            <span className="rounded-md bg-white/10 px-2 py-1"><FiStar className="mr-1 inline text-amber-300" /> {place.rating}</span>
                            <span className="rounded-md bg-white/10 px-2 py-1">{place.entryFee === 0 ? 'Free' : `Rs ${place.entryFee}`}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {day.hotel && (
                      <div className="rounded-lg border border-sky-300/20 bg-sky-300/10 p-4">
                        <div className="text-sm font-bold text-sky-200">Recommended stay</div>
                        <div className="mt-1 font-black text-white">{day.hotel.name}</div>
                        <div className="mt-1 text-sm text-slate-300">Rs {day.hotel.pricePerNight?.toLocaleString('en-IN')}/night - {day.hotel.category}</div>
                      </div>
                    )}
                    {day.food?.length > 0 && (
                      <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
                        <div className="text-sm font-bold text-amber-200">Food picks</div>
                        <div className="mt-2 space-y-1 text-sm text-slate-200">
                          {day.food.map((food) => <div key={food._id}><FiMapPin className="mr-1 inline text-amber-300" /> {food.dishName} at {food.restaurantName}</div>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
