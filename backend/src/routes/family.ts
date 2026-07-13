import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../lib/db";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth as any);

// GET /api/family
router.get("/", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const result = await pool.query(
    `SELECT id, name, relation, age, id_type, id_number_last4, created_at
     FROM family_members WHERE user_id = $1 ORDER BY created_at`,
    [userId]
  );
  res.json(result.rows);
});

// POST /api/family
router.post("/", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const schema = z.object({
    name:      z.string().min(2),
    relation:  z.string().min(2),
    age:       z.number().int().min(0).max(120),
    id_type:   z.string(),
    id_number: z.string().min(4),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: parsed.error.errors[0].message }); return; }

  const { name, relation, age, id_type, id_number } = parsed.data;
  const hash = await bcrypt.hash(id_number, 10);

  const result = await pool.query(
    `INSERT INTO family_members (user_id, name, relation, age, id_type, id_number_hash, id_number_last4)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, name, relation, age, id_type, id_number_last4`,
    [userId, name, relation, age, id_type, hash, `XXXX-XXXX-${id_number.slice(-4)}`]
  );
  res.status(201).json(result.rows[0]);
});

// DELETE /api/family/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const result = await pool.query(
    `DELETE FROM family_members WHERE id = $1 AND user_id = $2 RETURNING id`,
    [req.params.id, userId]
  );
  if (!result.rows.length) { res.status(404).json({ message: "Member not found" }); return; }
  res.json({ success: true });
});

export default router;
