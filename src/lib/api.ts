// ─── DarshanEase API Client ───────────────────────────────────────────────────
// In dev: Vite proxies /api → http://localhost:3001 (no env var needed)
// In production: set VITE_API_URL=https://your-api.onrender.com/api in Vercel

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

// ─── Token management ────────────────────────────────────────────────────────

export const auth = {
  getToken: () => localStorage.getItem("darshan_token"),
  setToken: (t: string) => localStorage.setItem("darshan_token", t),
  clear: () => localStorage.removeItem("darshan_token"),
};

// ─── Base fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = auth.getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  created_at: string;
}

export interface ApiTemple {
  id: number;
  name: string;
  location: string;
  state: string;
  deity: string;
  religion: "Hindu" | "Sikh" | "Jain" | "Buddhist";
  rating: number;
  reviews: number;
  image_url: string;
  next_slot: string;
  tickets_left: number;
  description: string;
  established: string;
  featured: boolean;
  open_hours: string;
  facilities: string[];
}

export interface ApiPooja {
  id: number;
  temple_id: number;
  name: string;
  duration: string;
  price: number;
  description: string;
  popular: boolean;
}

export interface ApiBooking {
  id: string;
  user_id: string;
  temple_id: number;
  temple_name: string;
  temple_image: string;
  pooja_id: number;
  pooja_name: string;
  visit_date: string;
  time_slot: string;
  num_adults: number;
  num_children: number;
  amount: number;
  gst: number;
  convenience_fee: number;
  total_amount: number;
  status: "upcoming" | "completed" | "cancelled";
  reference: string;
  payment_method: string;
  family_member_ids: string[];
  created_at: string;
}

export interface ApiFamilyMember {
  id: string;
  user_id: string;
  name: string;
  relation: string;
  age: number;
  id_type: string;
  id_number_last4: string;
}

export interface ApiDonation {
  id: string;
  user_id: string;
  temple_id: number;
  temple_name: string;
  cause: string;
  amount: number;
  status: "completed" | "pending";
  created_at: string;
}

export interface LoginResponse {
  token: string;
  user: ApiUser;
}

export interface RegisterResponse {
  token: string;
  user: ApiUser;
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export const authApi = {
  login: (body: { email?: string; phone?: string; password?: string; otp?: string }) =>
    request<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  register: (body: { full_name: string; email: string; phone: string; password: string }) =>
    request<RegisterResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  me: () => request<ApiUser>("/auth/me"),

  sendOtp: (phone: string) =>
    request<{ message: string }>("/auth/otp/send", { method: "POST", body: JSON.stringify({ phone }) }),

  verifyOtp: (phone: string, otp: string) =>
    request<LoginResponse>("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phone, otp }) }),
};

// ─── Temples endpoints ────────────────────────────────────────────────────────

export const templesApi = {
  list: (params?: { religion?: string; state?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<ApiTemple[]>(`/temples${q ? `?${q}` : ""}`);
  },

  get: (id: number) => request<ApiTemple>(`/temples/${id}`),

  poojas: (templeId: number) => request<ApiPooja[]>(`/temples/${templeId}/poojas`),

  slots: (templeId: number, date: string) =>
    request<{ slot: string; available: number }[]>(`/temples/${templeId}/slots?date=${date}`),
};

// ─── Bookings endpoints ───────────────────────────────────────────────────────

export const bookingsApi = {
  list: () => request<ApiBooking[]>("/bookings"),

  create: (body: {
    temple_id: number;
    pooja_id: number;
    visit_date: string;
    time_slot: string;
    num_adults: number;
    num_children: number;
    payment_method: string;
    family_member_ids?: string[];
  }) => request<ApiBooking>("/bookings", { method: "POST", body: JSON.stringify(body) }),

  get: (id: string) => request<ApiBooking>(`/bookings/${id}`),

  cancel: (id: string) =>
    request<ApiBooking>(`/bookings/${id}/cancel`, { method: "PATCH" }),
};

// ─── Family endpoints ─────────────────────────────────────────────────────────

export const familyApi = {
  list: () => request<ApiFamilyMember[]>("/family"),

  add: (body: { name: string; relation: string; age: number; id_type: string; id_number: string }) =>
    request<ApiFamilyMember>("/family", { method: "POST", body: JSON.stringify(body) }),

  remove: (id: string) => request<{ success: boolean }>(`/family/${id}`, { method: "DELETE" }),
};

// ─── Donations endpoints ──────────────────────────────────────────────────────

export const donationsApi = {
  list: () => request<ApiDonation[]>("/donations"),

  create: (body: { temple_id: number; cause: string; amount: number; payment_method: string }) =>
    request<ApiDonation>("/donations", { method: "POST", body: JSON.stringify(body) }),
};
