const { db, now, bookingShape } = require('../config/database');

// Simulate a transaction ID (in production this comes from payment gateway)
const generateTxnId = () => 'TXN' + Date.now() + Math.random().toString(36).slice(2, 7).toUpperCase();

// POST /api/bookings — create a new booking
const createBooking = (req, res) => {
  try {
    const {
      hotelId, checkIn, checkOut, guests, rooms,
      totalPrice, specialRequests,
      paymentMethod = 'card',
    } = req.body;
    const userId = req.user.id;

    if (!hotelId || !checkIn || !checkOut || !guests || !rooms || !totalPrice) {
      return res.status(400).json({ success: false, message: 'All booking fields are required' });
    }

    // Validate dates
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (isNaN(inDate) || isNaN(outDate) || outDate <= inDate) {
      return res.status(400).json({ success: false, message: 'Invalid check-in / check-out dates' });
    }

    // Get hotel details for denormalised fields
    const hotel = db.prepare('SELECT h.*, c.name AS city_name FROM hotels h LEFT JOIN cities c ON c.id = h.city_id WHERE h.id = ?').get(hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    const images = (() => { try { return JSON.parse(hotel.images); } catch { return []; } })();
    const transactionId = generateTxnId();

    const stmt = db.prepare(`
      INSERT INTO bookings
        (user_id, hotel_id, hotel_name, hotel_image, city_name,
         check_in, check_out, guests, rooms, total_price,
         special_requests, payment_method, payment_status, transaction_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?)
    `);
    const result = stmt.run(
      userId, Number(hotelId),
      hotel.name, images[0] || '',
      hotel.city_name || '',
      checkIn, checkOut,
      Number(guests), Number(rooms),
      Number(totalPrice),
      specialRequests || '',
      paymentMethod,
      transactionId,
      now()
    );

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: bookingShape(booking), message: 'Booking confirmed!' });
  } catch (error) {
    console.error('createBooking error:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
};

// GET /api/bookings/my — get logged-in user's bookings
const getMyBookings = (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ success: true, data: rows.map(bookingShape) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};

// DELETE /api/bookings/:id — cancel a booking (owner only)
const cancelBooking = (req, res) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorised' });
    }
    db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
};

// GET /api/bookings — admin: all bookings
const getAllBookings = (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
    res.json({ success: true, data: rows.map(bookingShape) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};

module.exports = { createBooking, getMyBookings, cancelBooking, getAllBookings };
