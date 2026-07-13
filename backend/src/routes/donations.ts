import { Router, Request, Response } from "express";
import { z } from "zod";
import { pool } from "../lib/db";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth as any);

// GET /api/donations
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const result = await pool.query(
    `SELECT d.*, t.name AS temple_name
     FROM donations d
     JOIN temples t ON d.temple_id = t.id
     WHERE d.user_id = $1 ORDER BY d.created_at DESC`,
    [userId]
  );
  res.json(result.rows);
});

// POST /api/donations
router.post("/", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const schema = z.object({
    temple_id:      z.number().int(),
    cause:          z.string().min(3),
    amount:         z.number().int().min(10),
    payment_method: z.string(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: parsed.error.errors[0].message }); return; }

  const { temple_id, cause, amount, payment_method } = parsed.data;
  const result = await pool.query(
    `INSERT INTO donations (user_id, temple_id, cause, amount, payment_method, status)
     VALUES ($1,$2,$3,$4,$5,'completed') RETURNING *`,
    [userId, temple_id, cause, amount, payment_method]
  );
  res.status(201).json(result.rows[0]);
});

export default router;
