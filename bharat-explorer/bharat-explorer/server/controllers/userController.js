const repo = require('../repositories/travelRepository');
const { db } = require('../config/database');

// GET /api/user/dashboard
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 1. Get spending stats
    const bookings = db.prepare('SELECT * FROM bookings WHERE user_id = ? AND status = "confirmed"').all(userId);
    const totalSpent = bookings.reduce((acc, b) => acc + (b.total_price || 0), 0);
    
    // 2. Get wishlist count
    const wishlist = repo.getWishlist(userId);
    
    // 3. Simple Recommendation Logic
    // Based on user's wishlist categories or city tags, recommend 3 cities they haven't wishlisted
    const wishlistedCityNames = wishlist.items.map(item => item.cityName);
    const allCities = repo.getCities();
    const recommendations = allCities
      .filter(c => !wishlistedCityNames.includes(c.name))
      .slice(0, 3);

    res.json({
      success: true,
      data: {
        stats: {
          totalSpent,
          bookingCount: bookings.length,
          wishlistCount: wishlist.items.length
        },
        recentBookings: bookings.slice(0, 3).map(b => ({
          id: b.id,
          hotelName: b.hotel_name,
          checkIn: b.check_in,
          totalPrice: b.total_price
        })),
        recommendations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard };
