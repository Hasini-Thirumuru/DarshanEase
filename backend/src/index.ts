import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes      from "./routes/auth";
import templesRoutes   from "./routes/temples";
import bookingsRoutes  from "./routes/bookings";
import familyRoutes    from "./routes/family";
import donationsRoutes from "./routes/donations";

dotenv.config();

const app  = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

// ── CORS ─────────────────────────────────────────────────────────────────────
// Accepts an explicit origin, a comma-separated list, or a wildcard (*).
const rawOrigin = process.env.FRONTEND_URL ?? "http://localhost:5173";
const allowedOrigins = rawOrigin === "*"
  ? true
  : rawOrigin.split(",").map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                // server-to-server / curl
    if (allowedOrigins === true) return cb(null, true); // wildcard
    if ((allowedOrigins as string[]).includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "darshanease-api", env: process.env.NODE_ENV });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/temples",    templesRoutes);
app.use("/api/bookings",   bookingsRoutes);
app.use("/api/family",     familyRoutes);
app.use("/api/donations",  donationsRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.message);
  res.status(500).json({ message: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ DarshanEase API → http://localhost:${PORT}  [${process.env.NODE_ENV ?? "development"}]`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = () => {
  console.log("Shutting down gracefully…");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT",  shutdown);
