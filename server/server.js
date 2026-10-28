import express from "express";
import cors from "cors";
import boardingPassRouter from "./routes/boardingpass.routes.js";
import checkinRouter from "./routes/checkin.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "CoU Bus Seat Allocation API", timestamp: new Date().toISOString() });
});

// Group 6 Core Endpoints
app.use("/api/boarding-pass", boardingPassRouter);
app.use("/api/check-in", checkinRouter);

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` CoU Bus Seat Allocation Server running on port ${PORT}`);
  console.log(` Group 6 APIs active at /api/boarding-pass & /api/check-in`);
  console.log(`=================================================`);
});
