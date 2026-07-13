import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../lib/db";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET as string, { expiresIn: "30d" });

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const schema = z.object({
    full_name: z.string().min(2),
    email:     z.string().email(),
    phone:     z.string().min(10),
    password:  z.string().min(6),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: parsed.error.errors[0].message }); return; }

  const { full_name, email, phone, password } = parsed.data;
  const password_hash = await bcrypt.hash(password, 12);

  try {
    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash)
       VALUES ($1,$2,$3,$4) RETURNING id, full_name, email, phone, created_at`,
      [full_name, email, phone, password_hash]
    );
    const user = result.rows[0];
    res.status(201).json({ token: signToken(user.id), user });
  } catch (err: any) {
    if (err.code === "23505") { res.status(409).json({ message: "Email or phone already registered" }); }
    else { console.error(err); res.status(500).json({ message: "Registration failed" }); }
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const schema = z.object({
    email:    z.string().email().optional(),
    phone:    z.string().optional(),
    password: z.string().min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ message: parsed.error.errors[0].message }); return; }

  const { email, phone, password } = parsed.data;
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1 OR phone = $2 LIMIT 1`,
    [email ?? null, phone ?? null]
  );

  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ message: "Invalid credentials" }); return;
  }

  const { password_hash: _pw, ...safeUser } = user;
  res.json({ token: signToken(user.id), user: safeUser });
});

// POST /api/auth/otp/send
router.post("/otp/send", async (req: Request, res: Response) => {
  const { phone } = req.body;
  if (!phone) { res.status(400).json({ message: "Phone required" }); return; }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await pool.query(
    `INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1,$2,NOW() + INTERVAL '10 minutes')`,
    [phone, code]
  );
  console.log(`[DEV] OTP for ${phone}: ${code}`);
  res.json({ message: "OTP sent" });
});

// POST /api/auth/otp/verify
router.post("/otp/verify", async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) { res.status(400).json({ message: "Phone and OTP required" }); return; }

  const result = await pool.query(
    `SELECT * FROM otp_codes WHERE phone=$1 AND code=$2 AND used=FALSE AND expires_at>NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [phone, otp]
  );

  if (!result.rows.length) { res.status(400).json({ message: "Invalid or expired OTP" }); return; }
  await pool.query(`UPDATE otp_codes SET used=TRUE WHERE id=$1`, [result.rows[0].id]);

  const userRes = await pool.query(
    `INSERT INTO users (phone, full_name, phone_verified) VALUES ($1,'Devotee',TRUE)
     ON CONFLICT (phone) DO UPDATE SET phone_verified=TRUE
     RETURNING id, full_name, email, phone, created_at`,
    [phone]
  );
  const user = userRes.rows[0];
  res.json({ token: signToken(user.id), user });
});

// GET /api/auth/me
router.get("/me", requireAuth as any, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId;
  const result = await pool.query(
    `SELECT id, full_name, email, phone, avatar_url, created_at FROM users WHERE id=$1`,
    [userId]
  );
  if (!result.rows.length) { res.status(404).json({ message: "User not found" }); return; }
  res.json(result.rows[0]);
});

export default router;
