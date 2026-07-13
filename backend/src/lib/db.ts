import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd ? { rejectUnauthorized: false } : false,
  max: isProd ? 10 : 5,          // max connections in pool
  idleTimeoutMillis: 30_000,     // close idle connections after 30s
  connectionTimeoutMillis: 5_000, // fail fast if DB unreachable
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

// Verify DB connection on startup
pool.query("SELECT 1").then(() => {
  console.log("✅ PostgreSQL connected");
}).catch((err) => {
  console.error("❌ PostgreSQL connection failed:", err.message);
  console.error("   Check DATABASE_URL in your .env file");
});
