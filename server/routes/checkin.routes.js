import { Router } from "express";
import jwt from "jsonwebtoken";
import { store } from "../data/mockStore.js";

const router = Router();
const QR_SECRET = process.env.QR_SECRET || "cou_bus_secret_jwt_sign_key_2026";

// POST /api/check-in/verify - verify scanned QR code token
router.post("/verify", (req, res) => {
  const { qrToken, tripId, checkerName = "Checker Staff" } = req.body;

  if (!qrToken || !tripId) {
    return res.status(400).json({
      success: false,
      code: "INVALID_REQUEST",
      message: "Both qrToken and active tripId are required.",
    });
  }

  // 1. Verify token cryptographic signature
  let decoded;
  try {
    decoded = jwt.verify(qrToken, QR_SECRET);
  } catch (err) {
    return res.status(400).json({
      success: false,
      code: "FORGED_OR_EXPIRED_QR",
      message: "Invalid or expired QR code pass.",
    });
  }

  // 2. Validate trip and booking
  const { bid, tid } = decoded;
  const result = store.verifyAndCheckIn(bid, tripId, checkerName, "QR_SCAN");

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// POST /api/check-in/manual - fallback manual check-in by roll / name / bookingRef
router.post("/manual", (req, res) => {
  const { query, tripId, checkerName = "Checker Staff" } = req.body;

  if (!query || !tripId) {
    return res.status(400).json({
      success: false,
      message: "Search query and tripId are required.",
    });
  }

  const result = store.manualCheckIn(query, tripId, checkerName);
  if (!result.success) {
    return res.status(404).json(result);
  }

  res.json(result);
});

// GET /api/check-in/roster/:tripId - fetch live passenger manifest
router.get("/roster/:tripId", (req, res) => {
  const { tripId } = req.params;
  const trip = store.getTripById(tripId);

  if (!trip) {
    return res.status(404).json({ success: false, message: "Trip not found" });
  }

  const roster = store.getRosterForTrip(tripId);
  const boardedCount = roster.filter((r) => r.status === "BOARDED").length;
  const totalCount = roster.length;

  res.json({
    success: true,
    trip,
    stats: {
      total: totalCount,
      boarded: boardedCount,
      notBoarded: totalCount - boardedCount,
    },
    roster,
  });
});

// POST /api/check-in/sync-batch - offline queued scans reconciliation (FR-G6-08)
router.post("/sync-batch", (req, res) => {
  const { items, tripId, checkerName = "Checker Staff" } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: "Items must be an array" });
  }

  const results = items.map((item) => {
    try {
      const decoded = jwt.verify(item.qrToken, QR_SECRET);
      const res = store.verifyAndCheckIn(decoded.bid, tripId, checkerName, "OFFLINE_SYNC");
      return { token: item.qrToken, success: res.success, message: res.message, booking: res.booking };
    } catch (err) {
      return { token: item.qrToken, success: false, message: "Token verification failed on sync" };
    }
  });

  res.json({ success: true, processed: results.length, details: results });
});

// POST /api/check-in/reset - reset in-memory data for clean demos
router.post("/reset", (req, res) => {
  store.reset();
  res.json({ success: true, message: "Mock store successfully reset to default initial state." });
});

export default router;
