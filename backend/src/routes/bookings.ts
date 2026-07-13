import { Router, Request, Response } from "express";
import { z } from "zod";
import { pool } from "../lib/db";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth as any);

const genRef = () => "DE-" + Math.random().toString(36).toUpperCase().slice(2, 10);

// GET /api/bookings
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const result = await pool.query(
    `SELECT b.*, t.name AS temple_name, t.image_url AS temple_image, p.name AS pooja_name
     FROM bookings b
     JOIN temples t ON b.temple_id = t.id
     JOIN poojas  p ON b.pooja_id  = p.id
     WHERE b.user_id = $1
     ORDER BY b.visit_date DESC`,
    [userId]
  );
  res.json(result.rows);
});

// POST /api/bookings
router.post("/", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const schema = z.object({
    temple_id:         z.number().int(),
    pooja_id:          z.number().int(),
    visit_date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time_slot:         z.string(),
    num_adults:        z.number().int().min(1).max(10),
    num_children:      z.number().int().min(0).max(10).default(0),
    payment_method:    z.string(),
    family_member_ids: z.array(z.string().uuid()).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: parsed.error.errors[0].message }); return; }

  const { temple_id, pooja_id, visit_date, time_slot, num_adults, num_children, payment_method, family_member_ids } = parsed.data;

  const poojaRes = await pool.query(`SELECT price FROM poojas WHERE id = $1`, [pooja_id]);
  if (!poojaRes.rows.length) { res.status(404).json({ message: "Pooja not found" }); return; }

  const amount = poojaRes.rows[0].price * num_adults;
  const gst = Math.round(amount * 0.05);
  const convenience_fee = amount > 0 ? 25 : 0;
  const total_amount = amount + gst + convenience_fee;

  const result = await pool.query(
    `INSERT INTO bookings
       (user_id, temple_id, pooja_id, visit_date, time_slot, num_adults, num_children,
        amount, gst, convenience_fee, total_amount, payment_method, reference, family_member_ids)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [userId, temple_id, pooja_id, visit_date, time_slot, num_adults, num_children,
     amount, gst, convenience_fee, total_amount, payment_method, genRef(), family_member_ids ?? []]
  );

  await pool.query(
    `UPDATE temples SET tickets_left = GREATEST(tickets_left - $1, 0) WHERE id = $2`,
    [num_adults + num_children, temple_id]
  );

  res.status(201).json(result.rows[0]);
});

// GET /api/bookings/:id
router.get("/:id", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const result = await pool.query(
    `SELECT b.*, t.name AS temple_name, t.image_url AS temple_image, p.name AS pooja_name
     FROM bookings b
     JOIN temples t ON b.temple_id = t.id
     JOIN poojas  p ON b.pooja_id  = p.id
     WHERE b.id = $1 AND b.user_id = $2`,
    [req.params.id, userId]
  );
  if (!result.rows.length) { res.status(404).json({ message: "Booking not found" }); return; }
  res.json(result.rows[0]);
});

// PATCH /api/bookings/:id/cancel
router.patch("/:id/cancel", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const result = await pool.query(
    `UPDATE bookings SET status = 'cancelled'
     WHERE id = $1 AND user_id = $2 AND status = 'upcoming' RETURNING *`,
    [req.params.id, userId]
  );
  if (!result.rows.length) { res.status(404).json({ message: "Booking not found or already cancelled" }); return; }
  res.json(result.rows[0]);
});

export default router;
