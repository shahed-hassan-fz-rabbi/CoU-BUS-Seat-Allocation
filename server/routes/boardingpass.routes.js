import { Router } from "express";
import jwt from "jsonwebtoken";
import { store } from "../data/mockStore.js";

const router = Router();
const QR_SECRET = process.env.QR_SECRET || "cou_bus_secret_jwt_sign_key_2026";

// GET /api/boarding-pass/trips - list available trips for testing
router.get("/trips", (req, res) => {
  res.json({ success: true, trips: store.getTrips() });
});

// GET /api/boarding-pass/bookings - list bookings
router.get("/bookings", (req, res) => {
  res.json({ success: true, bookings: store.getAllBookings() });
});

// GET /api/boarding-pass/:bookingId - generate/view digital boarding pass + signed QR token
router.get("/:bookingId", (req, res) => {
  const { bookingId } = req.params;
  const booking = store.getBookingById(bookingId);

  if (!booking) {
    return res.status(404).json({ success: false, message: "Booking not found" });
  }

  const trip = store.getTripById(booking.tripId);

  // FR-G6-02: Cryptographically signed token without PII (only bookingId, tripId, seatNumber, date)
  const tokenPayload = {
    bid: booking.id,
    tid: booking.tripId,
    st: booking.seatNumber,
    dt: trip ? trip.date : "2026-10-28",
    v: 1, // version
  };

  const qrToken = jwt.sign(tokenPayload, QR_SECRET, { expiresIn: "24h" });

  res.json({
    success: true,
    pass: {
      bookingId: booking.id,
      bookingRef: booking.bookingRef,
      studentId: booking.studentId,
      studentName: booking.studentName,
      department: booking.department,
      seatNumber: booking.seatNumber,
      status: booking.status,
      boardedAt: booking.boardedAt,
      trip: trip || {},
      qrToken, // The signed string to be encoded in the QR code
    },
  });
});

export default router;
