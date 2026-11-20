import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'

const WishlistContext = createContext()
export const useWishlist = () => useContext(WishlistContext)

export function WishlistProvider({ children }) {
  const { token } = useAuth()
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!token) {
      setItems([])
      return
    }

    axios.get('/api/wishlist', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setItems(response.data.data?.items || []))
      .catch(() => setItems([]))
  }, [token])

  const addToWishlist = async (item) => {
    if (!token) {
      toast.error('Please login to save to wishlist')
      return
    }

    try {
      const { data } = await axios.post('/api/wishlist/add', item, { headers: { Authorization: `Bearer ${token}` } })
      setItems(data.data.items)
      toast.success('Added to wishlist')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Already in wishlist')
    }
  }

  const removeFromWishlist = async (itemId) => {
    try {
      const { data } = await axios.delete(`/api/wishlist/remove/${itemId}`, { headers: { Authorization: `Bearer ${token}` } })
      setItems(data.data.items)
      toast.success('Removed from wishlist')
    } catch {
      toast.error('Error removing item')
    }
  }

  const isInWishlist = (id) => items.some((item) => item.itemId === id || item.itemId?.toString() === id?.toString())

  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}
