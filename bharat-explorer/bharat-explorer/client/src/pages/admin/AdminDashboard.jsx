import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { FiTrash2, FiEdit, FiPlus, FiX, FiCheck, FiCalendar, FiCreditCard, FiUsers, FiHome } from 'react-icons/fi'

const TABS = ['Dashboard', 'Bookings', 'Cities', 'Places', 'Hotels', 'Food']

function StatCard({ icon, label, value, color }) {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
      <div>
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-gray-400 text-sm">{label}</div>
      </div>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><FiX size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const TAB_FOR_TYPE = { city: 'Cities', place: 'Places', hotel: 'Hotels', food: 'Food' }

export default function AdminDashboard() {
  const { user, token, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Dashboard')
  const [stats, setStats] = useState({ cities: 0, places: 0, hotels: 0, foods: 0, bookings: 0 })
  const [cities, setCities] = useState([])
  const [places, setPlaces] = useState([])
  const [hotels, setHotels] = useState([])
  const [foods, setFoods] = useState([])
  const [bookings, setBookings] = useState([])
  const [modal, setModal] = useState(null) // { type: 'city'|'place'|'hotel'|'food', data: {} }
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'admin') {
      toast.error('Admin access required')
      navigate('/login', { state: { from: '/admin' } })
      return
    }
    fetchAll()
  }, [user, authLoading, token])

  const fetchAll = async () => {
    if (!token) return
    setLoading(true)
    try {
      const [c, p, h, f] = await Promise.all([
        axios.get('/api/cities'),
        axios.get('/api/places'),
        axios.get('/api/hotels'),
        axios.get('/api/food'),
      ])
      const cd = c.data.data || []
      const pd = p.data.data || []
      const hd = h.data.data || []
      const fd = f.data.data || []
      let bd = []
      try {
        const b = await axios.get('/api/bookings', { headers })
        bd = b.data.data || []
      } catch {
        bd = []
      }
      setCities(cd); setPlaces(pd); setHotels(hd); setFoods(fd); setBookings(bd)
      setStats({ cities: cd.length, places: pd.length, hotels: hd.length, foods: fd.length, bookings: bd.length })
    } catch {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const openAdd = (type) => { setForm({}); setModal({ type, data: null }) }
  const openEdit = (type, data) => {
    setForm({
      ...data,
      cityId: data.cityId?._id || data.cityId || '',
    })
    setModal({ type, data })
  }
  const closeModal = () => { setModal(null); setForm({}) }

  const handleFormChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleDelete = async (type, id) => {
    if (!window.confirm('Delete this item?')) return
    try {
      await axios.delete(`/api/admin/${type}/${id}`, { headers })
      toast.success('Deleted!'); fetchAll()
    } catch { toast.error('Delete failed') }
  }

  const normalizeForm = (type, values) => {
    const payload = { ...values }
    if (type === 'food' && payload.isVeg !== undefined) {
      payload.isVeg = payload.isVeg === true || payload.isVeg === 'true'
    }
    if (type === 'city') {
      payload.description = payload.description || ''
      payload.image = payload.image || '/fallback-travel.svg'
      payload.avgBudget = payload.avgBudget ? Number(payload.avgBudget) : 3000
    }
    if (type === 'place') {
      payload.entryFee = payload.entryFee ? Number(payload.entryFee) : 0
      payload.rating = payload.rating ? Number(payload.rating) : 4
      payload.cityId = payload.cityId ? Number(payload.cityId) : payload.cityId
    }
    if (type === 'hotel') {
      payload.pricePerNight = payload.pricePerNight ? Number(payload.pricePerNight) : 0
      payload.rating = payload.rating ? Number(payload.rating) : 4
      payload.cityId = payload.cityId ? Number(payload.cityId) : payload.cityId
    }
    if (type === 'food') {
      payload.rating = payload.rating ? Number(payload.rating) : 4
      payload.cityId = payload.cityId ? Number(payload.cityId) : payload.cityId
    }
    return payload
  }

  const handleSave = async () => {
    if (!modal) return
    const { type, data } = modal
    const payload = normalizeForm(type, form)
    try {
      if (data?._id) {
        await axios.put(`/api/admin/${type}/${data._id}`, payload, { headers })
        toast.success('Updated!')
      } else {
        await axios.post(`/api/admin/${type}`, payload, { headers })
        toast.success('Created!')
      }
      closeModal(); fetchAll()
    } catch (e) { toast.error(e.response?.data?.message || 'Save failed') }
  }

  const cityOptions = cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)

  const renderForm = () => {
    if (!modal) return null
    const { type } = modal
    const inp = (name, label, type2 = 'text', required = false) => (
      <div key={name}>
        <label className="block text-sm text-gray-300 mb-1">{label}{required && ' *'}</label>
        <input name={name} type={type2} value={form[name] || ''} onChange={handleFormChange}
          className="input-field !py-2 text-sm" required={required}/>
      </div>
    )
    const sel = (name, label, options) => (
      <div key={name}>
        <label className="block text-sm text-gray-300 mb-1">{label}</label>
        <select name={name} value={form[name] || ''} onChange={handleFormChange}
          className="input-field !py-2 text-sm bg-[#1a1a2e]">
          {options}
        </select>
      </div>
    )

    if (type === 'city') return (
      <div className="space-y-3">
        {inp('name', 'City Name', 'text', true)}
        {inp('state', 'State', 'text', true)}
        <div><label className="block text-sm text-gray-300 mb-1">Description</label>
          <textarea name="description" value={form.description || ''} onChange={handleFormChange}
            rows={3} className="input-field !py-2 text-sm resize-none"/></div>
        {inp('image', 'Image URL')}
        {inp('bestSeason', 'Best Season')}
        {inp('avgBudget', 'Avg Budget/Day (Rs)', 'number')}
      </div>
    )
    if (type === 'place') return (
      <div className="space-y-3">
        {inp('name', 'Place Name', 'text', true)}
        {sel('cityId', 'City *', [<option value="">Select City</option>, ...cityOptions])}
        <div><label className="block text-sm text-gray-300 mb-1">Description</label>
          <textarea name="description" value={form.description || ''} onChange={handleFormChange}
            rows={2} className="input-field !py-2 text-sm resize-none"/></div>
        {sel('type', 'Type', ['historical','nature','religious','adventure','beach','cultural'].map(t => <option key={t} value={t}>{t}</option>))}
        {inp('entryFee', 'Entry Fee (Rs)', 'number')}
        {inp('rating', 'Rating (1-5)', 'number')}
        {inp('visitingTime', 'Visiting Time')}
      </div>
    )
    if (type === 'hotel') return (
      <div className="space-y-3">
        {inp('name', 'Hotel Name', 'text', true)}
        {sel('cityId', 'City *', [<option value="">Select City</option>, ...cityOptions])}
        <div><label className="block text-sm text-gray-300 mb-1">Description</label>
          <textarea name="description" value={form.description || ''} onChange={handleFormChange}
            rows={2} className="input-field !py-2 text-sm resize-none"/></div>
        {inp('pricePerNight', 'Price/Night (Rs)', 'number')}
        {inp('rating', 'Rating', 'number')}
        {sel('category', 'Category', ['budget','mid-range','luxury'].map(c => <option key={c} value={c}>{c}</option>))}
        {inp('contact', 'Contact')}
        {inp('address', 'Address')}
      </div>
    )
    if (type === 'food') return (
      <div className="space-y-3">
        {inp('dishName', 'Dish Name', 'text', true)}
        {sel('cityId', 'City *', [<option value="">Select City</option>, ...cityOptions])}
        <div><label className="block text-sm text-gray-300 mb-1">Description</label>
          <textarea name="description" value={form.description || ''} onChange={handleFormChange}
            rows={2} className="input-field !py-2 text-sm resize-none"/></div>
        {inp('restaurantName', 'Restaurant')}
        {inp('address', 'Address')}
        {inp('priceRange', 'Price Range (e.g. Rs 100-Rs 300)')}
        {inp('rating', 'Rating', 'number')}
        {sel('isVeg', 'Veg/Non-Veg', [<option key="true" value="true">Veg</option>, <option key="false" value="false">Non-Veg</option>])}
      </div>
    )
  }

  const TableRow = ({ children }) => (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">{children}</tr>
  )
  const TD = ({ children, className = '' }) => (
    <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>
  )

  if (authLoading || (loading && !cities.length)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          Loading admin panel...
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="relative z-20 flex min-h-[112px] flex-col justify-center rounded-xl border border-white/5 bg-brand-gray/70 px-5 py-6 shadow-luxury backdrop-blur-xl sm:min-h-[128px] sm:px-7 sm:py-8">
        <h1 className="flex flex-wrap items-center gap-2 text-3xl font-black leading-tight text-white sm:text-4xl">Admin Panel</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400 sm:text-base">Manage all content and bookings for Bharat Explorer</p>
      </div>

      {/* Tabs */}
      <div className="relative z-10 mt-5 flex flex-wrap gap-3 overflow-x-auto pb-1 sm:mt-6 sm:flex-nowrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              tab === t ? 'bg-orange-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}>{t}</button>
        ))}
      </div>

      <div className="relative z-0 mt-6 sm:mt-8">
      {/* Dashboard Tab */}
      {tab === 'Dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon="₹" label="Total Revenue" value={`₹${bookings.filter(b => b.status === 'confirmed').reduce((acc, b) => acc + (b.totalPrice || 0), 0).toLocaleString()}`} color="bg-emerald-500/20 text-emerald-400"/>
            <StatCard icon="B" label="Bookings" value={stats.bookings} color="bg-amber-500/20"/>
            <StatCard icon="C" label="Cities" value={stats.cities} color="bg-orange-500/20"/>
            <StatCard icon="P" label="Places" value={stats.places} color="bg-green-500/20"/>
            <StatCard icon="H" label="Hotels" value={stats.hotels} color="bg-blue-500/20"/>
          </div>
          <div className="glass-card p-6">
            <h2 className="text-white font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[['city','C','Add City'],['place','P','Add Place'],['hotel','H','Add Hotel'],['food','F','Add Food']].map(([t, icon, label]) => (
                <button key={t} onClick={() => { openAdd(t); setTab(TAB_FOR_TYPE[t]) }}
                  className="glass-card p-4 text-center hover:border-orange-500/30 transition-all group">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-gray-300 text-sm group-hover:text-white transition-colors">{label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bookings Tab */}
      {tab === 'Bookings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 border-l-4 border-emerald-500">
              <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Total Revenue</div>
              <div className="text-4xl font-black text-white">₹{bookings.filter(b => b.status === 'confirmed').reduce((acc, b) => acc + (b.totalPrice || 0), 0).toLocaleString()}</div>
              <p className="text-emerald-400 text-xs mt-2 font-bold">● Live earnings from confirmed bookings</p>
            </div>
            <div className="glass-card p-6 border-l-4 border-amber-500">
              <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Total Bookings</div>
              <div className="text-4xl font-black text-white">{bookings.length}</div>
              <p className="text-amber-400 text-xs mt-2 font-bold">{bookings.filter(b => b.status === 'confirmed').length} Confirmed · {bookings.filter(b => b.status === 'cancelled').length} Cancelled</p>
            </div>
            <div className="glass-card p-6 border-l-4 border-blue-500">
              <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Avg. Order Value</div>
              <div className="text-4xl font-black text-white">
                ₹{bookings.length > 0 
                  ? Math.round(bookings.filter(b => b.status === 'confirmed').reduce((acc, b) => acc + (b.totalPrice || 0), 0) / (bookings.filter(b => b.status === 'confirmed').length || 1)).toLocaleString() 
                  : 0}
              </div>
              <p className="text-blue-400 text-xs mt-2 font-bold">Average revenue per customer</p>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="text-white font-bold">All User Bookings ({bookings.length})</h2>
            </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/10 text-left">
                {['ID','User ID','Hotel','Check In/Out','Price','Payment','Status'].map(h => <th key={h} className="px-4 py-3 text-xs text-gray-400 font-semibold uppercase">{h}</th>)}
              </tr></thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-10 text-slate-500">No bookings found</td></tr>
                ) : bookings.map(b => (
                  <TableRow key={b._id}>
                    <TD className="text-white font-mono text-[10px]">{b._id}</TD>
                    <TD className="text-gray-300">{b.userId}</TD>
                    <TD className="text-white font-medium">{b.hotelName}</TD>
                    <TD className="text-gray-300 text-xs">
                      <div>{fmtDate(b.checkIn)}</div>
                      <div className="text-slate-500">to {fmtDate(b.checkOut)}</div>
                    </TD>
                    <TD className="text-orange-400 font-bold">Rs {b.totalPrice?.toLocaleString()}</TD>
                    <TD>
                      <div className="text-[10px] uppercase font-bold text-amber-300">{b.paymentMethod}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{b.transactionId}</div>
                    </TD>
                    <TD>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        b.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {b.status} {b.paymentStatus === 'paid' && '· PAID'}
                      </span>
                    </TD>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

      {/* Cities Tab */}
      {tab === 'Cities' && (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-white font-bold">Cities ({cities.length})</h2>
            <button onClick={() => openAdd('city')} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1">
              <FiPlus size={14}/> Add City
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/10 text-left">
                {['City','State','Season','Budget/Day',''].map(h => <th key={h} className="px-4 py-3 text-xs text-gray-400 font-semibold uppercase">{h}</th>)}
              </tr></thead>
              <tbody>
                {cities.map(c => (
                  <TableRow key={c._id}>
                    <TD className="text-white font-medium">{c.name}</TD>
                    <TD className="text-gray-300">{c.state}</TD>
                    <TD className="text-gray-300">{c.bestSeason}</TD>
                    <TD className="text-orange-400">Rs {c.avgBudget?.toLocaleString()}</TD>
                    <TD>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit('city', c)} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg text-blue-400 transition-colors"><FiEdit size={13}/></button>
                        <button onClick={() => handleDelete('city', c._id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 transition-colors"><FiTrash2 size={13}/></button>
                      </div>
                    </TD>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Places Tab */}
      {tab === 'Places' && (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-white font-bold">Places ({places.length})</h2>
            <button onClick={() => openAdd('place')} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1">
              <FiPlus size={14}/> Add Place
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/10 text-left">
                {['Name','Type','Entry Fee','Rating',''].map(h => <th key={h} className="px-4 py-3 text-xs text-gray-400 font-semibold uppercase">{h}</th>)}
              </tr></thead>
              <tbody>
                {places.map(p => (
                  <TableRow key={p._id}>
                    <TD className="text-white font-medium">{p.name}</TD>
                    <TD><span className="badge bg-orange-500/20 text-orange-300 capitalize">{p.type}</span></TD>
                    <TD className="text-gray-300">{p.entryFee === 0 ? 'Free' : `Rs ${p.entryFee}`}</TD>
                    <TD className="text-yellow-400">{p.rating}</TD>
                    <TD>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit('place', p)} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg text-blue-400 transition-colors"><FiEdit size={13}/></button>
                        <button onClick={() => handleDelete('place', p._id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 transition-colors"><FiTrash2 size={13}/></button>
                      </div>
                    </TD>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hotels Tab */}
      {tab === 'Hotels' && (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-white font-bold">Hotels ({hotels.length})</h2>
            <button onClick={() => openAdd('hotel')} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1">
              <FiPlus size={14}/> Add Hotel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/10 text-left">
                {['Name','Category','Price/Night','Rating',''].map(h => <th key={h} className="px-4 py-3 text-xs text-gray-400 font-semibold uppercase">{h}</th>)}
              </tr></thead>
              <tbody>
                {hotels.map(h => (
                  <TableRow key={h._id}>
                    <TD className="text-white font-medium">{h.name}</TD>
                    <TD><span className="badge bg-blue-500/20 text-blue-300 capitalize">{h.category}</span></TD>
                    <TD className="text-orange-400">Rs {h.pricePerNight?.toLocaleString()}</TD>
                    <TD className="text-yellow-400">{h.rating}</TD>
                    <TD>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit('hotel', h)} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg text-blue-400 transition-colors"><FiEdit size={13}/></button>
                        <button onClick={() => handleDelete('hotel', h._id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 transition-colors"><FiTrash2 size={13}/></button>
                      </div>
                    </TD>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Food Tab */}
      {tab === 'Food' && (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-white font-bold">Food Items ({foods.length})</h2>
            <button onClick={() => openAdd('food')} className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1">
              <FiPlus size={14}/> Add Food
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/10 text-left">
                {['Dish','Restaurant','Price','Veg','Rating',''].map(h => <th key={h} className="px-4 py-3 text-xs text-gray-400 font-semibold uppercase">{h}</th>)}
              </tr></thead>
              <tbody>
                {foods.map(f => (
                  <TableRow key={f._id}>
                    <TD className="text-white font-medium">{f.dishName}</TD>
                    <TD className="text-gray-300">{f.restaurantName}</TD>
                    <TD className="text-gray-300">{f.priceRange}</TD>
                    <TD>{f.isVeg ? <span className="text-green-400">Veg</span> : <span className="text-red-400">Non-Veg</span>}</TD>
                    <TD className="text-yellow-400">{f.rating}</TD>
                    <TD>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit('food', f)} className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 rounded-lg text-blue-400 transition-colors"><FiEdit size={13}/></button>
                        <button onClick={() => handleDelete('food', f._id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 transition-colors"><FiTrash2 size={13}/></button>
                      </div>
                    </TD>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </div>

      {/* Modal */}
      {modal && (
        <Modal title={`${modal.data ? 'Edit' : 'Add'} ${modal.type.charAt(0).toUpperCase() + modal.type.slice(1)}`} onClose={closeModal}>
          {renderForm()}
          <div className="flex gap-3 mt-5">
            <button onClick={handleSave} className="btn-primary flex-1 flex items-center justify-center gap-2 !py-3">
              <FiCheck size={16}/> {modal.data ? 'Update' : 'Create'}
            </button>
            <button onClick={closeModal} className="btn-secondary flex-1 !py-3">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
