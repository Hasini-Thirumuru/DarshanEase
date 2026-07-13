import { Router, Request, Response } from "express";
import { pool } from "../lib/db";

const router = Router();

// GET /api/temples
router.get("/", async (req: Request, res: Response) => {
  const { religion, state, search } = req.query;
  const conditions: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (religion && religion !== "All") {
    conditions.push(`religion = $${i++}`);
    values.push(religion);
  }
  if (state && state !== "All States") {
    conditions.push(`state = $${i++}`);
    values.push(state);
  }
  if (search) {
    conditions.push(`(name ILIKE $${i} OR location ILIKE $${i} OR deity ILIKE $${i})`);
    values.push(`%${search}%`);
    i++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query(
    `SELECT * FROM temples ${where} ORDER BY featured DESC, rating DESC`,
    values
  );
  res.json(result.rows);
});

// GET /api/temples/:id
router.get("/:id", async (req: Request, res: Response) => {
  const result = await pool.query(`SELECT * FROM temples WHERE id = $1`, [req.params.id]);
  if (!result.rows.length) { res.status(404).json({ message: "Temple not found" }); return; }
  res.json(result.rows[0]);
});

// GET /api/temples/:id/poojas
router.get("/:id/poojas", async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT * FROM poojas WHERE temple_id = $1 ORDER BY price ASC`,
    [req.params.id]
  );
  res.json(result.rows);
});

// GET /api/temples/:id/slots?date=YYYY-MM-DD
router.get("/:id/slots", async (req: Request, res: Response) => {
  const { date } = req.query;
  if (!date) { res.status(400).json({ message: "date query param required" }); return; }

  // Generate default slots if none exist for this date
  const existing = await pool.query(
    `SELECT slot_time, capacity, booked FROM time_slots WHERE temple_id = $1 AND slot_date = $2`,
    [req.params.id, date]
  );

  if (existing.rows.length) {
    res.json(existing.rows.map((r) => ({ slot: r.slot_time, available: r.capacity - r.booked })));
    return;
  }

  // Return default static slots
  const defaultSlots = [
    "4:00 AM","5:00 AM","6:30 AM","8:00 AM",
    "9:30 AM","11:00 AM","2:00 PM","4:00 PM","6:00 PM","8:00 PM",
  ].map((slot) => ({ slot, available: Math.floor(Math.random() * 60) + 5 }));

  res.json(defaultSlots);
});

export default router;
