const Room = require('../models/Room');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Create a new room (Admin/Staff only)
const createRoom = async (req, res) => {
  const { roomNumber, type, price } = req.body;

  try {
    const room = await Room.create({ roomNumber, type, price });
    res.status(201).json({ message: 'Room created successfully', room });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all rooms (Available to all users)
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update room status (Admin/Staff only)
const updateRoomStatus = async (req, res) => {
  const { roomId } = req.params;
  const { status } = req.body;

  try {
    const room = await Room.findByIdAndUpdate(roomId, { status }, { new: true });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json({ message: 'Room status updated successfully', room });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Book a room (Staff only)
const bookRoom = async (req, res) => {
  const { guestId, roomId, checkIn, checkOut } = req.body;

  try {
    // Check if the room is available
    const room = await Room.findById(roomId);
    if (!room || room.status !== 'available') {
      return res.status(400).json({ message: 'Room is not available' });
    }

    // Check if the guest exists
    const guest = await User.findById(guestId);
    if (!guest || guest.role !== 'guest') {
      return res.status(400).json({ message: 'Invalid guest' });
    }

    // Calculate total price based on room price and duration of stay
    const duration = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24); // Duration in days
    const totalPrice = room.price * duration;

    // Create a booking
    const booking = await Booking.create({
      guest: guestId,
      room: roomId,
      checkIn,
      checkOut,
      totalPrice,
    });

    // Update room status to "occupied"
    await Room.findByIdAndUpdate(roomId, { status: 'occupied' });

    res.status(201).json({ message: 'Room booked successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check-in a guest (Staff only)
const checkInGuest = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await Booking.findById(bookingId).populate('room guest');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update room status to "occupied"
    await Room.findByIdAndUpdate(booking.room._id, { status: 'occupied' });

    res.status(200).json({ message: 'Guest checked in successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check-out a guest (Staff only)
const checkOutGuest = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await Booking.findById(bookingId).populate('room guest');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update room status to "cleaning"
    await Room.findByIdAndUpdate(booking.room._id, { status: 'cleaning' });

    // Generate invoice (optional)
    const invoice = {
      guest: booking.guest.name,
      room: booking.room.roomNumber,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalPrice: booking.totalPrice,
    };

    res.status(200).json({ message: 'Guest checked out successfully', invoice });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createRoom,
  getAllRooms,
  updateRoomStatus,
  bookRoom,
  checkInGuest,
  checkOutGuest,
};