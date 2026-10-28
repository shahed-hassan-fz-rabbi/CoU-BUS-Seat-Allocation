// Central in-memory store for Group 6 (Boarding Pass & Verification)
// In V1, this provides realistic data for testing and demoing without an external database.

const initialTrips = [
  {
    id: "TRIP-101",
    busNumber: "CoU-BUS-04 (Red Bus)",
    route: "Campus ⇄ Kandirpar",
    direction: "To Campus",
    departureTime: "08:30 AM",
    date: "2026-10-28",
    capacity: 40,
    checkerName: "Rafiqul Islam",
  },
  {
    id: "TRIP-102",
    busNumber: "CoU-BUS-07 (Staff Coaster)",
    route: "Campus ⇄ Kotbari",
    direction: "To Kotbari",
    departureTime: "02:15 PM",
    date: "2026-10-28",
    capacity: 28,
    checkerName: "Abdul Karim",
  }
];

const initialBookings = [
  {
    id: "BK-801",
    tripId: "TRIP-101",
    studentId: "12208019",
    studentName: "Rony Ahmed",
    department: "CSE, 8th Batch",
    seatNumber: "A1",
    bookingRef: "COU-26-801",
    status: "CONFIRMED", // CONFIRMED, BOARDED, NO_SHOW
    boardedAt: null,
    checkedInBy: null,
    checkInMethod: null,
  },
  {
    id: "BK-802",
    tripId: "TRIP-101",
    studentId: "12208020",
    studentName: "Saqib Al Hasan",
    department: "ICT, 9th Batch",
    seatNumber: "A2",
    bookingRef: "COU-26-802",
    status: "CONFIRMED",
    boardedAt: null,
    checkedInBy: null,
    checkInMethod: null,
  },
  {
    id: "BK-803",
    tripId: "TRIP-101",
    studentId: "12208025",
    studentName: "Tanvir Hasan",
    department: "Pharmacy, 7th Batch",
    seatNumber: "B1",
    bookingRef: "COU-26-803",
    status: "CONFIRMED",
    boardedAt: null,
    checkedInBy: null,
    checkInMethod: null,
  },
  {
    id: "BK-804",
    tripId: "TRIP-101",
    studentId: "12208031",
    studentName: "Nayeem Rahman",
    department: "Physics, 8th Batch",
    seatNumber: "B2",
    bookingRef: "COU-26-804",
    status: "CONFIRMED",
    boardedAt: null,
    checkedInBy: null,
    checkInMethod: null,
  },
  {
    id: "BK-805",
    tripId: "TRIP-101",
    studentId: "12208044",
    studentName: "Mehedi Hasan",
    department: "Mathematics, 6th Batch",
    seatNumber: "C1",
    bookingRef: "COU-26-805",
    status: "CONFIRMED",
    boardedAt: null,
    checkedInBy: null,
    checkInMethod: null,
  }
];

class MockStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.trips = JSON.parse(JSON.stringify(initialTrips));
    this.bookings = JSON.parse(JSON.stringify(initialBookings));
  }

  getTrips() {
    return this.trips;
  }

  getTripById(tripId) {
    return this.trips.find((t) => t.id === tripId) || null;
  }

  getAllBookings() {
    return this.bookings;
  }

  getBookingById(bookingId) {
    return this.bookings.find((b) => b.id === bookingId) || null;
  }

  getBookingByRef(bookingRef) {
    return this.bookings.find((b) => b.bookingRef.toLowerCase() === bookingRef.trim().toLowerCase()) || null;
  }

  getRosterForTrip(tripId) {
    return this.bookings.filter((b) => b.tripId === tripId);
  }

  verifyAndCheckIn(bookingId, tripId, checkerName = "Checker Staff", method = "QR_SCAN") {
    const booking = this.getBookingById(bookingId);
    if (!booking) {
      return { success: false, code: "NOT_FOUND", message: "Booking record not found in system." };
    }

    if (booking.tripId !== tripId) {
      return {
        success: false,
        code: "TRIP_MISMATCH",
        message: `Pass is for trip ${booking.tripId}, but active trip is ${tripId}.`,
      };
    }

    if (booking.status === "BOARDED") {
      return {
        success: false,
        code: "ALREADY_BOARDED",
        message: `Already boarded on ${new Date(booking.boardedAt).toLocaleTimeString()} by ${booking.checkedInBy}.`,
        booking,
      };
    }

    booking.status = "BOARDED";
    booking.boardedAt = new Date().toISOString();
    booking.checkedInBy = checkerName;
    booking.checkInMethod = method;

    return {
      success: true,
      code: "SUCCESS",
      message: `Boarding verified for seat ${booking.seatNumber} (${booking.studentName})`,
      booking,
    };
  }

  manualCheckIn(searchQuery, tripId, checkerName = "Checker Staff") {
    const q = searchQuery.trim().toLowerCase();
    const booking = this.bookings.find(
      (b) =>
        b.tripId === tripId &&
        (b.bookingRef.toLowerCase() === q ||
          b.studentId.toLowerCase() === q ||
          b.studentName.toLowerCase().includes(q))
    );

    if (!booking) {
      return { success: false, message: "No matching rider found on this trip roster." };
    }

    return this.verifyAndCheckIn(booking.id, tripId, checkerName, "MANUAL");
  }

  markNoShow(bookingId) {
    const booking = this.getBookingById(bookingId);
    if (booking && booking.status !== "BOARDED") {
      booking.status = "NO_SHOW";
      return true;
    }
    return false;
  }
}

export const store = new MockStore();
