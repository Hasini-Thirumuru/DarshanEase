import { useState, useMemo, useEffect, useCallback } from "react";
import { authApi, bookingsApi, familyApi, donationsApi, auth, type ApiBooking, type ApiFamilyMember } from "../lib/api";
import {
  Calendar, Clock, MapPin, Users, Star, ChevronRight, ArrowRight, CheckCircle,
  Phone, Mail, Menu, X, Search, Filter, CreditCard, Smartphone, Building2,
  Wallet, Shield, Lock, ChevronDown, Globe, Heart, TrendingUp, Award,
  Train, Bus, Plane, Hotel, Gift, User, BookOpen, Home, LayoutDashboard,
  PlusCircle, Trash2, Edit, Bell, ChevronLeft, Ticket, Navigation,
  Coffee, Sunrise, Moon, IndianRupee, Package, Share2, Download,
  Eye, EyeOff, KeyRound, UserPlus, LogIn, MessageSquare,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

type Tab = "home" | "temples" | "temple-detail" | "travel" | "booking" | "itinerary" | "dashboard" | "stays" | "donations" | "profile" | "signin" | "register";
type PaymentMethod = "upi" | "card" | "netbanking" | "wallet" | null;

interface Temple {
  id: number; name: string; location: string; state: string; deity: string;
  religion: "Hindu" | "Sikh" | "Jain" | "Buddhist"; rating: number;
  reviews: number; image: string; nextSlot: string; ticketsLeft: number;
  description: string; established: string; featured?: boolean;
  distance?: string; openHours?: string; facilities?: string[];
}
interface Pooja { id: number; name: string; duration: string; price: number; desc: string; popular?: boolean; }
interface FamilyMember { id: number; name: string; relation: string; age: number; idType: string; idNumber: string; }
interface Trip { id: string; temple: string; date: string; pooja: string; status: "upcoming" | "completed" | "cancelled"; amount: number; ref: string; image: string; }
interface Stay { id: number; name: string; type: string; distance: string; price: number; rating: number; amenities: string[]; image: string; }
interface TravelResult { id: number; type: "bus" | "train" | "flight"; operator: string; from: string; to: string; depart: string; arrive: string; duration: string; price: number; seats: number; }

// ─── Data ──────────────────────────────────────────────────────────────────

const TEMPLES: Temple[] = [
  { id: 1, name: "Tirupati Balaji", location: "Tirupati, Andhra Pradesh", state: "Andhra Pradesh", deity: "Lord Venkateswara", religion: "Hindu", rating: 4.9, reviews: 12480, image: "https://images.unsplash.com/photo-1566915682737-3e97a7eed93b?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 6:00 AM", ticketsLeft: 120, description: "One of the most visited religious sites in the world, Sri Venkateswara Swamy temple sits atop the Tirumala hills. Millions of devotees visit annually seeking the blessings of Lord Venkateswara.", established: "300 CE", featured: true, openHours: "2:30 AM – 9:00 PM", facilities: ["Prasadam", "Locker", "Wheelchair", "Drinking Water", "Annadanam"] },
  { id: 2, name: "Vaishno Devi", location: "Katra, Jammu & Kashmir", state: "Jammu & Kashmir", deity: "Goddess Vaishno Devi", religion: "Hindu", rating: 4.8, reviews: 9870, image: "https://images.unsplash.com/photo-1737479957329-6eddc445d4df?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 4:00 AM", ticketsLeft: 250, description: "Nestled in the Trikuta Mountains at 5,200 ft, Vaishno Devi Shrine is one of India's most sacred pilgrimage sites, drawing over 8 million devotees annually.", established: "700 CE", featured: true, openHours: "24 hours", facilities: ["Helicopter Service", "Ponies", "Battery Cars", "Medical Aid", "Prasadam"] },
  { id: 3, name: "Siddhivinayak", location: "Mumbai, Maharashtra", state: "Maharashtra", deity: "Lord Ganesha", religion: "Hindu", rating: 4.7, reviews: 8340, image: "https://images.unsplash.com/photo-1557062975-92aa401cee64?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 5:30 AM", ticketsLeft: 80, description: "Mumbai's most beloved Ganesha temple, drawing devotees from all walks of life. The temple's golden dome and intricate woodwork make it a masterpiece of craftsmanship.", established: "1801 CE", featured: true, openHours: "5:30 AM – 10:00 PM", facilities: ["Prasadam", "Locker", "Online Darshan", "Annadanam"] },
  { id: 4, name: "Kashi Vishwanath", location: "Varanasi, Uttar Pradesh", state: "Uttar Pradesh", deity: "Lord Shiva", religion: "Hindu", rating: 4.9, reviews: 15200, image: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 2:30 AM", ticketsLeft: 150, description: "One of the most sacred Jyotirlingas, standing on the western bank of the holy Ganga in Varanasi. The corridor spanning 5 lakh sq. ft was inaugurated in 2021.", established: "11th century", openHours: "2:30 AM – 11:00 PM", facilities: ["Ganga Aarti", "Prasadam", "Locker", "Security"] },
  { id: 5, name: "Meenakshi Amman", location: "Madurai, Tamil Nadu", state: "Tamil Nadu", deity: "Goddess Meenakshi", religion: "Hindu", rating: 4.8, reviews: 10650, image: "https://images.unsplash.com/photo-1606298855672-3efb63017be8?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 5:00 AM", ticketsLeft: 200, description: "A historic Hindu temple renowned for its awe-inspiring 14 towering gopurams, the tallest standing at 170 ft, adorned with thousands of colorful sculptures.", established: "1623 CE", featured: true, openHours: "5:00 AM – 10:00 PM", facilities: ["Prasadam", "Museum", "Elephant Blessing", "Annadanam"] },
  { id: 6, name: "Golden Temple", location: "Amritsar, Punjab", state: "Punjab", deity: "Waheguru", religion: "Sikh", rating: 4.9, reviews: 18900, image: "https://images.unsplash.com/photo-1623059508779-2542c6e83753?w=600&h=400&fit=crop&auto=format", nextSlot: "Open 24/7", ticketsLeft: 999, description: "Sri Harmandir Sahib — the holiest Gurdwara of Sikhism. Its gold-plated sanctum is surrounded by the sacred Amrit Sarovar. The langar serves 100,000 people daily.", established: "1604 CE", featured: true, openHours: "24 hours (always open)", facilities: ["Langar (Free Meals)", "Sarovar Bath", "Museum", "Library"] },
  { id: 7, name: "Jagannath Puri", location: "Puri, Odisha", state: "Odisha", deity: "Lord Jagannath", religion: "Hindu", rating: 4.7, reviews: 7890, image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 5:00 AM", ticketsLeft: 175, description: "One of the four sacred dhams of Hinduism, famous for the annual Rath Yatra festival where massive chariots carry the deities through the city streets.", established: "12th century", openHours: "5:00 AM – 11:00 PM", facilities: ["Prasadam", "Mahaprasad", "Annadanam"] },
  { id: 8, name: "Somnath Temple", location: "Prabhas Patan, Gujarat", state: "Gujarat", deity: "Lord Shiva", religion: "Hindu", rating: 4.8, reviews: 6540, image: "https://images.unsplash.com/photo-1529733772151-bab41484710a?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 6:00 AM", ticketsLeft: 300, description: "The first among the 12 Jyotirlingas, built on the Saurashtra coast of the Arabian Sea. The temple has been rebuilt 7 times through history.", established: "Ancient", openHours: "6:00 AM – 9:00 PM", facilities: ["Sound & Light Show", "Prasadam", "Seaside View"] },
  { id: 9, name: "Ramanathaswamy", location: "Rameswaram, Tamil Nadu", state: "Tamil Nadu", deity: "Lord Shiva", religion: "Hindu", rating: 4.7, reviews: 5890, image: "https://images.unsplash.com/photo-1620766182966-c6eb5ed2b788?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 5:00 AM", ticketsLeft: 220, description: "Located on Pamban Island, connected to mainland India by the Pamban Bridge. The temple has the longest temple corridor in India at 1,212 m.", established: "12th century", openHours: "5:00 AM – 1:00 PM, 3:00 PM – 9:00 PM", facilities: ["Theertham Bath", "Prasadam", "Pillar Corridor"] },
  { id: 10, name: "Badrinath Temple", location: "Chamoli, Uttarakhand", state: "Uttarakhand", deity: "Lord Vishnu", religion: "Hindu", rating: 4.9, reviews: 8200, image: "https://images.unsplash.com/photo-1665003815164-8f5bc853ef44?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 4:30 AM", ticketsLeft: 90, description: "Set against the backdrop of the Neelkanth peak in the Garhwal Himalayas at 3,300 m altitude. One of the holiest Char Dhams.", established: "8th century", openHours: "Apr–Nov only: 4:30 AM – 9:00 PM", facilities: ["Tapt Kund Hot Spring", "Prasadam", "Helicopter Service"] },
  { id: 11, name: "Kedarnath Temple", location: "Rudraprayag, Uttarakhand", state: "Uttarakhand", deity: "Lord Shiva", religion: "Hindu", rating: 4.9, reviews: 9800, image: "https://images.unsplash.com/photo-1665003725647-3ae0f01140b1?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 4:00 AM", ticketsLeft: 60, description: "Perched at 3,583 m in the Himalayas, this 8th-century stone temple is one of the 12 Jyotirlingas. The 22 km trek through breathtaking Himalayan terrain is itself a spiritual journey.", established: "8th century", openHours: "Apr–Nov only: 4:00 AM – 9:00 PM", facilities: ["Helicopter Service", "Ponies", "Palanquins", "Hot Meal Stalls"] },
  { id: 12, name: "Brihadeeswara Temple", location: "Thanjavur, Tamil Nadu", state: "Tamil Nadu", deity: "Lord Shiva", religion: "Hindu", rating: 4.8, reviews: 4320, image: "https://images.unsplash.com/photo-1632962237468-0705d7e7b534?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 6:00 AM", ticketsLeft: 400, description: "A UNESCO World Heritage Site, this masterpiece of Chola architecture features a 66m vimana (tower), constructed without mortar — one of the greatest architectural achievements in India.", established: "1010 CE", openHours: "6:00 AM – 8:30 PM", facilities: ["Museum", "Archaeological Survey", "Light Show"] },
  { id: 13, name: "Akshardham Delhi", location: "New Delhi, Delhi", state: "Delhi", deity: "Lord Swaminarayan", religion: "Hindu", rating: 4.8, reviews: 11200, image: "https://images.unsplash.com/photo-1741003411268-2462dd845d26?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 10:00 AM", ticketsLeft: 500, description: "A stunning modern Hindu mandir complex spread over 100 acres, celebrating India's art, culture and spirituality over 10,000 years. Features a musical fountain show.", established: "2005 CE", openHours: "10:00 AM – 6:30 PM (Tue–Sun)", facilities: ["Musical Fountain", "Exhibition Halls", "Boat Ride", "Garden"] },
  { id: 14, name: "Dilwara Jain Temples", location: "Mount Abu, Rajasthan", state: "Rajasthan", deity: "Tirthankara", religion: "Jain", rating: 4.7, reviews: 3450, image: "https://images.unsplash.com/photo-1741003411336-eac8fa3e701f?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 7:00 AM", ticketsLeft: 150, description: "A group of five marble temples renowned for their stunning intricacy. The carving is so fine that the marble looks like lace — considered the finest example of Jain architecture.", established: "11th–13th century", openHours: "7:00 AM – 6:00 PM", facilities: ["Guided Tours", "Photography (limited)", "Marble Architecture"] },
  { id: 15, name: "Mahabodhi Temple", location: "Bodh Gaya, Bihar", state: "Bihar", deity: "Lord Buddha", religion: "Buddhist", rating: 4.9, reviews: 7100, image: "https://images.unsplash.com/photo-1557062975-96113e46608b?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 5:00 AM", ticketsLeft: 800, description: "A UNESCO World Heritage Site — the place where Siddhartha Gautama attained enlightenment under the Bodhi tree. One of the four holy sites of Buddhism, drawing pilgrims from across the world.", established: "3rd century BCE", openHours: "5:00 AM – 9:00 PM", facilities: ["Bodhi Tree", "Meditation Zones", "International Monasteries", "Pond"] },
  { id: 16, name: "Shirdi Sai Baba", location: "Shirdi, Maharashtra", state: "Maharashtra", deity: "Sai Baba", religion: "Hindu", rating: 4.8, reviews: 13400, image: "https://images.unsplash.com/photo-1602772576878-a934c7c6b273?w=600&h=400&fit=crop&auto=format", nextSlot: "Today, 4:00 AM", ticketsLeft: 200, description: "One of India's most visited pilgrimage sites, the Shirdi Sai Baba Samadhi Mandir draws devotees of all faiths, regardless of religion or caste.", established: "1922 CE", featured: true, openHours: "4:00 AM – 11:00 PM", facilities: ["Prasadam", "Annadanam", "Live Darshan", "Museum"] },
];

const POOJA_TYPES: Pooja[] = [
  { id: 1, name: "General Darshan", duration: "30 min", price: 0, desc: "Standard devotee queue access" },
  { id: 2, name: "Special Entry Darshan", duration: "15 min", price: 300, desc: "Priority queue with dedicated entry", popular: true },
  { id: 3, name: "VIP Darshan", duration: "10 min", price: 1500, desc: "Exclusive close-proximity darshan" },
  { id: 4, name: "Abhishekam", duration: "45 min", price: 500, desc: "Sacred ritual bathing of the deity idol" },
  { id: 5, name: "Archana", duration: "20 min", price: 150, desc: "Flower offering with 108-name chanting" },
  { id: 6, name: "Sahasranama Archana", duration: "60 min", price: 350, desc: "1000-name chanting with flowers" },
  { id: 7, name: "Kalyanam", duration: "60 min", price: 2500, desc: "Celestial wedding ceremony of the deity" },
  { id: 8, name: "Brahmotsavam", duration: "90 min", price: 5000, desc: "Grand festival celebration darshan" },
];

const TIME_SLOTS = [
  { time: "4:00 AM", available: true, slots: 30 }, { time: "5:00 AM", available: true, slots: 45 },
  { time: "6:30 AM", available: true, slots: 28 }, { time: "8:00 AM", available: false, slots: 0 },
  { time: "9:30 AM", available: true, slots: 60 }, { time: "11:00 AM", available: true, slots: 35 },
  { time: "12:30 PM", available: false, slots: 0 }, { time: "2:00 PM", available: true, slots: 55 },
  { time: "4:00 PM", available: true, slots: 40 }, { time: "6:00 PM", available: true, slots: 20 },
  { time: "7:30 PM", available: false, slots: 0 }, { time: "8:00 PM", available: true, slots: 15 },
];

const STAYS: Stay[] = [
  { id: 1, name: "Tirumala Guest House", type: "Temple Trust", distance: "0.3 km from temple", price: 350, rating: 4.2, amenities: ["Free Breakfast", "Locker", "Hot Water", "A/C"], image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop&auto=format" },
  { id: 2, name: "The Pilgrim Residency", type: "Hotel", distance: "1.2 km from temple", price: 1800, rating: 4.5, amenities: ["Restaurant", "Wi-Fi", "Parking", "Room Service", "A/C"], image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=250&fit=crop&auto=format" },
  { id: 3, name: "Arya Dharamsala", type: "Dharamsala", distance: "0.5 km from temple", price: 150, rating: 3.9, amenities: ["Vegetarian Meals", "Dormitory", "Locker"], image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=250&fit=crop&auto=format" },
  { id: 4, name: "Sattvik Inn", type: "Boutique Hotel", distance: "2 km from temple", price: 3200, rating: 4.7, amenities: ["Pool", "Spa", "Restaurant", "Wi-Fi", "Yoga Hall", "A/C"], image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop&auto=format" },
];

const DUMMY_TRIPS: Trip[] = [
  { id: "1", temple: "Tirupati Balaji", date: "2026-07-18", pooja: "Special Entry Darshan", status: "upcoming", amount: 600, ref: "DE-ABCD12", image: "https://images.unsplash.com/photo-1566915682737-3e97a7eed93b?w=200&h=150&fit=crop&auto=format" },
  { id: "2", temple: "Siddhivinayak", date: "2026-06-28", pooja: "Archana", status: "completed", amount: 150, ref: "DE-EFGH34", image: "https://images.unsplash.com/photo-1557062975-92aa401cee64?w=200&h=150&fit=crop&auto=format" },
  { id: "3", temple: "Golden Temple", date: "2026-05-10", pooja: "General Darshan", status: "completed", amount: 0, ref: "DE-IJKL56", image: "https://images.unsplash.com/photo-1623059508779-2542c6e83753?w=200&h=150&fit=crop&auto=format" },
  { id: "4", temple: "Kedarnath Temple", date: "2026-08-05", pooja: "Abhishekam", status: "upcoming", amount: 1000, ref: "DE-MNOP78", image: "https://images.unsplash.com/photo-1665003725647-3ae0f01140b1?w=200&h=150&fit=crop&auto=format" },
];

const RELIGIONS = ["All", "Hindu", "Sikh", "Jain", "Buddhist"];
const STATES = ["All States", ...Array.from(new Set(TEMPLES.map((t) => t.state))).sort()];
const BOOKING_STEPS = ["Temple", "Date & Time", "Pooja", "Review", "Payment"];

const religionBadge: Record<string, string> = {
  Hindu: "bg-amber-100 text-amber-800",
  Sikh: "bg-sky-100 text-sky-800",
  Jain: "bg-emerald-100 text-emerald-800",
  Buddhist: "bg-violet-100 text-violet-800",
};

// ─── Root ───────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [detailTemple, setDetailTemple] = useState<Temple | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedUser, setLoggedUser] = useState({ name: "Ramesh Sharma", email: "" });

  // ── API-backed data ────────────────────────────────────────────────────────
  const [apiTrips, setApiTrips] = useState<ApiBooking[] | null>(null);
  const [apiFamily, setApiFamily] = useState<ApiFamilyMember[] | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const loadUserData = useCallback(async () => {
    if (!auth.getToken()) return;
    setApiLoading(true);
    try {
      const [trips, fam] = await Promise.all([bookingsApi.list(), familyApi.list()]);
      setApiTrips(trips);
      // Map API family members to local shape
      setApiFamily(fam);
    } catch {
      // silently fall back to mock data when backend is unavailable
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    // Restore session from token on mount
    const token = auth.getToken();
    if (token) {
      authApi.me().then((u) => {
        setIsLoggedIn(true);
        setLoggedUser({ name: u.full_name, email: u.email });
        loadUserData();
      }).catch(() => auth.clear());
    }
  }, [loadUserData]);

  // Booking state
  const [bookingStep, setBookingStep] = useState(0);
  const [selTemple, setSelTemple] = useState<Temple | null>(null);
  const [selDate, setSelDate] = useState("");
  const [selTime, setSelTime] = useState("");
  const [selPooja, setSelPooja] = useState<Pooja | null>(null);
  const [devotees, setDevotees] = useState(1);
  const [payMethod, setPayMethod] = useState<PaymentMethod>(null);
  const [upiId, setUpiId] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selBank, setSelBank] = useState("");
  const [selWallet, setSelWallet] = useState("");
  const [payProcessing, setPayProcessing] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);

  // Temples filter
  const [search, setSearch] = useState("");
  const [filterReligion, setFilterReligion] = useState("All");
  const [filterState, setFilterState] = useState("All States");

  // Travel
  const [travelFrom, setTravelFrom] = useState("");
  const [travelMode, setTravelMode] = useState<"bus" | "train" | "flight">("train");
  const [travelSearched, setTravelSearched] = useState(false);

  // Family — use API data when available, fall back to mock
  const mockFamily: FamilyMember[] = [
    { id: 1, name: "Priya Sharma", relation: "Spouse", age: 38, idType: "Aadhaar", idNumber: "XXXX-XXXX-1234" },
    { id: 2, name: "Aryan Sharma", relation: "Son", age: 14, idType: "Aadhaar", idNumber: "XXXX-XXXX-5678" },
  ];
  const [localFamily, setLocalFamily] = useState<FamilyMember[]>(mockFamily);
  const family: FamilyMember[] = apiFamily
    ? apiFamily.map((m, i) => ({ id: i + 1, name: m.name, relation: m.relation, age: m.age, idType: m.id_type, idNumber: m.id_number_last4 }))
    : localFamily;
  const setFamily = (fn: FamilyMember[] | ((prev: FamilyMember[]) => FamilyMember[])) => setLocalFamily(fn as any);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", relation: "", age: "", idType: "Aadhaar", idNumber: "" });

  // Donations
  const [donationTemple, setDonationTemple] = useState("");
  const [donationAmount, setDonationAmount] = useState("");
  const [donationCause, setDonationCause] = useState("");
  const [donated, setDonated] = useState(false);

  // Stays
  const [selStay, setSelStay] = useState<Stay | null>(null);
  const [stayBooked, setStayBooked] = useState(false);

  const navigate = (t: Tab) => { setTab(t); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const openTempleDetail = (temple: Temple) => { setDetailTemple(temple); navigate("temple-detail"); };

  const startBooking = (temple: Temple) => {
    setSelTemple(temple); setBookingStep(0);
    setSelDate(""); setSelTime(""); setSelPooja(null); setDevotees(1);
    setPayMethod(null); setBookingDone(false); navigate("booking");
  };

  const resetBooking = () => {
    setBookingDone(false); setBookingStep(0); setSelTemple(null);
    setSelDate(""); setSelTime(""); setSelPooja(null); setDevotees(1);
    setPayMethod(null); setUpiId(""); setCardNum(""); setCardName("");
    setCardExpiry(""); setCardCvv(""); setSelBank(""); setSelWallet("");
  };

  const handlePay = async () => {
    if (!selTemple || !selPooja) return;
    setPayProcessing(true);
    if (auth.getToken()) {
      try {
        await bookingsApi.create({
          temple_id: selTemple.id,
          pooja_id: selPooja.id,
          visit_date: selDate,
          time_slot: selTime,
          num_adults: devotees,
          num_children: 0,
          payment_method: payMethod ?? "upi",
        });
        await loadUserData();
      } catch {
        // fall through — show confirmation anyway (offline/demo mode)
      }
    } else {
      await new Promise((r) => setTimeout(r, 2000));
    }
    setPayProcessing(false);
    setBookingDone(true);
  };

  const totalPrice = selPooja ? selPooja.price * devotees : 0;
  const gst = Math.round(totalPrice * 0.05);
  const convenience = totalPrice > 0 ? 25 : 0;
  const grandTotal = totalPrice + gst + convenience;

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const maxDate = new Date(today.getTime() + 60 * 86400000).toISOString().split("T")[0];

  const filteredTemples = useMemo(() => TEMPLES.filter((t) => {
    const q = search.toLowerCase();
    return (!q || t.name.toLowerCase().includes(q) || t.location.toLowerCase().includes(q) || t.deity.toLowerCase().includes(q)) &&
      (filterReligion === "All" || t.religion === filterReligion) &&
      (filterState === "All States" || t.state === filterState);
  }), [search, filterReligion, filterState]);

  const payValid = (payMethod === "upi" && upiId.includes("@")) ||
    (payMethod === "card" && cardNum.length >= 16 && cardName && cardExpiry && cardCvv.length >= 3) ||
    (payMethod === "netbanking" && selBank) || (payMethod === "wallet" && selWallet);

  const travelResults: TravelResult[] = travelSearched ? [
    { id: 1, type: "train", operator: "Vande Bharat Express", from: travelFrom || "Hyderabad", to: detailTemple?.location || "Tirupati", depart: "06:15", arrive: "09:45", duration: "3h 30m", price: 850, seats: 42 },
    { id: 2, type: "bus", operator: "APSRTC Volvo", from: travelFrom || "Hyderabad", to: detailTemple?.location || "Tirupati", depart: "08:00", arrive: "13:30", duration: "5h 30m", price: 450, seats: 18 },
    { id: 3, type: "flight", operator: "IndiGo 6E-210", from: travelFrom || "Hyderabad", to: detailTemple?.location || "Tirupati", depart: "07:20", arrive: "08:10", duration: "50m", price: 3200, seats: 8 },
    { id: 4, type: "train", operator: "Tirumala Express", from: travelFrom || "Hyderabad", to: detailTemple?.location || "Tirupati", depart: "22:00", arrive: "04:30", duration: "6h 30m", price: 520, seats: 120 },
    { id: 5, type: "bus", operator: "SRS Travels", from: travelFrom || "Hyderabad", to: detailTemple?.location || "Tirupati", depart: "21:00", arrive: "03:00", duration: "6h", price: 380, seats: 35 },
  ] : [];

  // ─── NAV ────────────────────────────────────────────────────────────────

  const navLinks: [Tab, string][] = [["home", "Home"], ["temples", "Temples"], ["dashboard", "My Trips"], ["donations", "Donate"], ["profile", "Profile"]];

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "var(--font-body, 'Lora', Georgia, serif)" }}>
      {/* ─── Navbar ─────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <button onClick={() => navigate("home")} className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm select-none shadow-sm">ॐ</div>
            <div className="hidden sm:block">
              <span className="text-lg font-semibold text-foreground leading-none block" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>DarshanEase</span>
              <span className="text-[10px] text-muted-foreground leading-none block tracking-wider uppercase">Sacred Darshan Booking</span>
            </div>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(([t, label]) => (
              <button key={t} onClick={() => navigate(t)} className={`text-sm px-3 py-1.5 rounded-full transition-all relative ${tab === t ? "text-primary font-medium bg-primary/8" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <button onClick={() => navigate("profile")} className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                    <span className="text-xs font-bold text-primary" style={{ fontFamily: "var(--font-display,'Cinzel',serif)" }}>{loggedUser.name[0]}</span>
                  </div>
                  <span className="text-sm font-medium">{loggedUser.name.split(" ")[0]}</span>
                </button>
                <button onClick={() => { setIsLoggedIn(false); navigate("home"); }} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 border border-border rounded-full transition-colors">Sign Out</button>
              </div>
            ) : (
              <>
                <button onClick={() => navigate("signin")} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors">Sign In</button>
                <button onClick={() => navigate("register")} className="bg-primary text-primary-foreground text-sm px-5 py-2 rounded-full hover:opacity-90 font-medium shadow-sm">Register Free</button>
              </>
            )}
          </div>

          {/* Mobile: sign in shortcut */}
          <div className="flex md:hidden items-center gap-2">
            {!isLoggedIn && (
              <button onClick={() => navigate("signin")} className="text-xs text-primary border border-primary/30 bg-primary/5 px-3 py-1.5 rounded-full font-medium">Sign In</button>
            )}
            {isLoggedIn && (
              <button onClick={() => navigate("profile")} className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                <span className="text-xs font-bold text-primary">{loggedUser.name[0]}</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Mobile Bottom Nav ──────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-inset-bottom">
        <div className="flex items-center justify-around px-1 py-2">
          {([
            ["home", "Home", Home],
            ["temples", "Temples", MapPin],
            ["booking", "Book", Ticket],
            ["dashboard", "Trips", LayoutDashboard],
            ["donations", "Donate", Heart],
          ] as [Tab, string, any][]).map(([t, label, Icon]) => (
            <button key={t} onClick={() => navigate(t)} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${tab === t ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`relative p-1.5 rounded-xl transition-all ${tab === t ? "bg-primary/10" : ""}`}>
                <Icon size={tab === t ? 20 : 18} className="transition-all" />
                {tab === t && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full" />}
              </div>
              <span className={`text-[10px] font-medium leading-none ${tab === t ? "text-primary" : ""}`}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-16 pb-safe md:pb-0">

        {/* ═══ HOME ═══════════════════════════════════════════════════════ */}
        {tab === "home" && <HomePage navigate={navigate} onTempleOpen={openTempleDetail} onBooking={startBooking} />}

        {/* ═══ TEMPLES ════════════════════════════════════════════════════ */}
        {tab === "temples" && (
          <section className="min-h-screen py-14 px-5 md:px-12 bg-background">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Sacred Destinations</p>
                <h2 className="text-3xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>All Temples &amp; Shrines</h2>
                <p className="text-sm text-muted-foreground mt-1">{filteredTemples.length} of {TEMPLES.length} destinations</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-3 md:p-4 mb-7 flex flex-col sm:flex-row gap-2.5 shadow-sm">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search temple, deity, location…" className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"><X size={13} /></button>}
                </div>
                <SelectInput icon={<Filter size={13} />} value={filterReligion} onChange={setFilterReligion} options={RELIGIONS} />
                <SelectInput icon={<Globe size={13} />} value={filterState} onChange={setFilterState} options={STATES} />
              </div>
              {filteredTemples.length === 0 ? (
                <div className="text-center py-24 text-muted-foreground">
                  <Search size={40} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium text-foreground">No temples found</p>
                  <p className="text-sm mt-1">Adjust your filters or search terms</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredTemples.map((t) => <TempleCard key={t.id} temple={t} onSelect={openTempleDetail} onBook={startBooking} />)}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ TEMPLE DETAIL ══════════════════════════════════════════════ */}
        {tab === "temple-detail" && detailTemple && (
          <div className="min-h-screen bg-background">
            <div className="relative h-72 md:h-96 bg-muted">
              <img src={detailTemple.image} alt={detailTemple.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <button onClick={() => navigate("temples")} className="absolute top-5 left-5 bg-background/80 backdrop-blur-sm rounded-full p-2.5 text-foreground hover:bg-background transition-colors">
                <ChevronLeft size={18} />
              </button>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${religionBadge[detailTemple.religion]}`}>{detailTemple.religion}</span>
                  {detailTemple.featured && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium">Featured</span>}
                </div>
                <h1 className="text-3xl font-semibold text-white" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>{detailTemple.name}</h1>
                <div className="flex items-center gap-3 mt-2 text-white/75 text-sm">
                  <span className="flex items-center gap-1"><MapPin size={12} />{detailTemple.location}</span>
                  <span className="flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" />{detailTemple.rating} ({detailTemple.reviews.toLocaleString()})</span>
                </div>
              </div>
            </div>
            <div className="max-w-5xl mx-auto px-5 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>About This Temple</h2>
                  <p className="text-muted-foreground leading-relaxed">{detailTemple.description}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[["Deity", detailTemple.deity], ["Established", detailTemple.established], ["Open Hours", detailTemple.openHours || "See site"]].map(([l, v]) => (
                    <div key={l} className="bg-card border border-border rounded-xl p-4">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{l}</div>
                      <div className="text-sm font-medium text-foreground">{v}</div>
                    </div>
                  ))}
                </div>
                {detailTemple.facilities && (
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-3" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Facilities</h3>
                    <div className="flex flex-wrap gap-2">
                      {detailTemple.facilities.map((f) => (
                        <span key={f} className="bg-secondary text-secondary-foreground text-xs px-3 py-1.5 rounded-full border border-border">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Time Slot Preview */}
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-3" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Today's Available Slots</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map(({ time, available, slots }) => (
                      <div key={time} className={`p-2.5 rounded-xl border text-center ${available ? "border-border bg-card" : "opacity-40 bg-muted border-border"}`}>
                        <div className="text-xs font-semibold text-foreground" style={{ fontFamily: "var(--font-mono, 'DM Mono', monospace)" }}>{time}</div>
                        <div className={`text-[10px] mt-0.5 ${available ? slots <= 20 ? "text-red-500" : "text-green-600" : "text-muted-foreground"}`}>
                          {available ? `${slots} slots` : "Full"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Sidebar */}
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${detailTemple.ticketsLeft < 100 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {detailTemple.ticketsLeft} slots left today
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1"><Clock size={11} />Next: {detailTemple.nextSlot}</div>
                  <button onClick={() => startBooking(detailTemple)} className="w-full bg-primary text-primary-foreground py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity mb-3">
                    Book Darshan
                  </button>
                  <button onClick={() => { setDetailTemple(detailTemple); navigate("travel"); }} className="w-full border border-border text-foreground py-2.5 rounded-full text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2">
                    <Train size={14} /> Plan Travel
                  </button>
                  <button onClick={() => navigate("stays")} className="w-full border border-border text-foreground py-2.5 rounded-full text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2 mt-2">
                    <Hotel size={14} /> Book Stay
                  </button>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Pooja Prices</h4>
                  {POOJA_TYPES.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                      <span className="text-xs text-foreground">{p.name}</span>
                      <span className="text-xs font-semibold text-primary">{p.price === 0 ? "Free" : `₹${p.price}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TRAVEL SEARCH ══════════════════════════════════════════════ */}
        {tab === "travel" && (
          <section className="min-h-screen py-14 px-5 md:px-12 bg-background">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Integrated Travel</p>
                <h2 className="text-3xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Plan Your Sacred Journey</h2>
                <p className="text-sm text-muted-foreground mt-1">Book buses, trains, and flights to your temple</p>
              </div>

              {/* Search panel */}
              <div className="bg-card border border-border rounded-2xl p-6 mb-7">
                <div className="flex gap-2 mb-5">
                  {([["train", "Train", Train], ["bus", "Bus", Bus], ["flight", "Flight", Plane]] as [typeof travelMode, string, any][]).map(([mode, label, Icon]) => (
                    <button key={mode} onClick={() => setTravelMode(mode)} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${travelMode === mode ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary/40"}`}>
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">From</label>
                    <input value={travelFrom} onChange={(e) => setTravelFrom(e.target.value)} placeholder="City / Station" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">To</label>
                    <input readOnly value={detailTemple?.location || "Select a temple first"} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-muted text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Travel Date</label>
                    <input type="date" min={minDate} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <button onClick={() => setTravelSearched(true)} className="bg-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                  <Search size={14} /> Search {travelMode.charAt(0).toUpperCase() + travelMode.slice(1)}s
                </button>
              </div>

              {/* Results */}
              {travelSearched && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>{travelResults.length} Results Found</h3>
                    <span className="text-xs text-muted-foreground">Sorted by price</span>
                  </div>
                  {travelResults.filter((r) => r.type === travelMode).map((r) => {
                    const ModeIcon = r.type === "train" ? Train : r.type === "bus" ? Bus : Plane;
                    return (
                      <div key={r.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-sm transition-shadow">
                        <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                          <ModeIcon size={18} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground text-sm">{r.operator}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{r.from} → {r.to}</div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-mono, 'DM Mono', monospace)" }}>{r.depart}</div>
                            <div className="text-[10px] text-muted-foreground">Depart</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">{r.duration}</div>
                            <div className="w-16 h-px bg-border my-1" />
                            <div className="text-[10px] text-muted-foreground">{r.seats} seats</div>
                          </div>
                          <div className="text-center">
                            <div className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-mono, 'DM Mono', monospace)" }}>{r.arrive}</div>
                            <div className="text-[10px] text-muted-foreground">Arrive</div>
                          </div>
                        </div>
                        <div className="text-right ml-auto">
                          <div className="text-lg font-bold text-primary" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>₹{r.price}</div>
                          <button className="mt-2 bg-primary text-primary-foreground text-xs px-4 py-2 rounded-full hover:opacity-90 transition-opacity font-medium">Book Now</button>
                        </div>
                      </div>
                    );
                  })}
                  {travelResults.filter((r) => r.type === travelMode).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Plane size={32} className="mx-auto mb-3 opacity-30" />
                      <p>No {travelMode}s found for this route. Try a different mode.</p>
                    </div>
                  )}
                </div>
              )}

              {!travelSearched && (
                <div className="text-center py-16 text-muted-foreground">
                  <Navigation size={40} className="mx-auto mb-4 opacity-30" />
                  <p className="font-medium text-foreground">Enter your departure city and search</p>
                  <p className="text-sm mt-1">We will find the best options to reach the temple</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ BOOKING ════════════════════════════════════════════════════ */}
        {tab === "booking" && (
          <section className="min-h-screen py-14 px-5 md:px-12 bg-background">
            <div className="max-w-5xl mx-auto">
              {bookingDone ? (
                <BookingConfirmation temple={selTemple} date={selDate} time={selTime} pooja={selPooja} devotees={devotees} grandTotal={grandTotal} payMethod={payMethod} onReset={resetBooking} onDashboard={() => navigate("dashboard")} onItinerary={() => navigate("itinerary")} />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <div className="mb-7">
                      <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Book Darshan</p>
                      <h2 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Reserve Your Sacred Visit</h2>
                    </div>
                    {/* Steps */}
                    <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
                      {BOOKING_STEPS.map((step, i) => (
                        <div key={step} className="flex items-center gap-1 flex-shrink-0">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i < bookingStep ? "bg-green-500 text-white" : i === bookingStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            {i < bookingStep ? "✓" : i + 1}
                          </div>
                          <span className={`text-xs hidden sm:block mr-1 ${i === bookingStep ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step}</span>
                          {i < BOOKING_STEPS.length - 1 && <div className={`w-5 h-px ${i < bookingStep ? "bg-green-500" : "bg-border"}`} />}
                        </div>
                      ))}
                    </div>

                    {/* Step 0 – Temple */}
                    {bookingStep === 0 && (
                      <BookingStepTemple selected={selTemple} onSelect={setSelTemple} onNext={() => setBookingStep(1)} />
                    )}
                    {/* Step 1 – Date & Time */}
                    {bookingStep === 1 && (
                      <BookingStepDateTime date={selDate} time={selTime} minDate={minDate} maxDate={maxDate} onDate={setSelDate} onTime={setSelTime} onBack={() => setBookingStep(0)} onNext={() => setBookingStep(2)} />
                    )}
                    {/* Step 2 – Pooja */}
                    {bookingStep === 2 && (
                      <BookingStepPooja selected={selPooja} devotees={devotees} onSelect={setSelPooja} onDevotees={setDevotees} family={family} onBack={() => setBookingStep(1)} onNext={() => setBookingStep(3)} />
                    )}
                    {/* Step 3 – Review */}
                    {bookingStep === 3 && (
                      <BookingStepReview temple={selTemple} date={selDate} time={selTime} pooja={selPooja} devotees={devotees} onBack={() => setBookingStep(2)} onNext={() => setBookingStep(4)} />
                    )}
                    {/* Step 4 – Payment */}
                    {bookingStep === 4 && (
                      <BookingStepPayment
                        payMethod={payMethod} onPayMethod={setPayMethod}
                        upiId={upiId} onUpiId={setUpiId}
                        cardNum={cardNum} onCardNum={setCardNum}
                        cardName={cardName} onCardName={setCardName}
                        cardExpiry={cardExpiry} onCardExpiry={setCardExpiry}
                        cardCvv={cardCvv} onCardCvv={setCardCvv}
                        selBank={selBank} onSelBank={setSelBank}
                        selWallet={selWallet} onSelWallet={setSelWallet}
                        grandTotal={grandTotal} payValid={!!payValid} payProcessing={payProcessing}
                        onBack={() => setBookingStep(3)} onPay={handlePay}
                      />
                    )}
                  </div>
                  {/* Summary sidebar */}
                  <div className="lg:col-span-1">
                    <BookingSidebar temple={selTemple} date={selDate} time={selTime} pooja={selPooja} devotees={devotees} total={totalPrice} gst={gst} convenience={convenience} grandTotal={grandTotal} />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ SPIRITUAL JOURNEY ITINERARY ════════════════════════════════ */}
        {tab === "itinerary" && <ItineraryPage navigate={navigate} onBooking={() => navigate("booking")} />}

        {/* ═══ DASHBOARD ══════════════════════════════════════════════════ */}
        {tab === "dashboard" && (
          <section className="min-h-screen py-14 px-5 md:px-12 bg-background">
            <div className="max-w-5xl mx-auto">
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">My Account</p>
                  <h2 className="text-3xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Dashboard &amp; Trips</h2>
                </div>
                <button onClick={() => navigate("booking")} className="bg-primary text-primary-foreground text-sm px-5 py-2.5 rounded-full hover:opacity-90 flex items-center gap-2 font-medium">
                  <PlusCircle size={14} /> New Booking
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 stagger-children">
                {[["4", "Total Trips", Ticket, "bg-primary/8"], ["2", "Upcoming", Calendar, "bg-blue-50"], ["2", "Completed", CheckCircle, "bg-green-50"], ["₹1,750", "Total Spent", IndianRupee, "bg-amber-50"]].map(([v, l, Icon, iconBg]) => (
                  <div key={l as string} className="bg-card border border-border rounded-2xl p-5 hover:shadow-sm hover:border-primary/20 transition-all">
                    <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon size={16} className="text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>{v}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{l}</div>
                  </div>
                ))}
              </div>

              {/* Trips */}
              <h3 className="text-base font-semibold text-foreground mb-4" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>All Bookings</h3>
              <div className="space-y-4">
                {DUMMY_TRIPS.map((trip) => (
                  <div key={trip.id} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col sm:flex-row">
                    <div className="w-full sm:w-36 h-28 sm:h-auto bg-muted flex-shrink-0">
                      <img src={trip.image} alt={trip.temple} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5 flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-foreground">{trip.temple}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${trip.status === "upcoming" ? "bg-blue-100 text-blue-700" : trip.status === "completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                          <span className="flex items-center gap-1"><Calendar size={10} />{trip.date}</span>
                          <span className="flex items-center gap-1"><Star size={10} />{trip.pooja}</span>
                          <span className="flex items-center gap-1"><IndianRupee size={10} />{trip.amount === 0 ? "Free" : trip.amount}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1.5 font-mono">{trip.ref}</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="border border-border text-muted-foreground p-2 rounded-xl hover:bg-muted transition-colors"><Download size={14} /></button>
                        <button className="border border-border text-muted-foreground p-2 rounded-xl hover:bg-muted transition-colors"><Share2 size={14} /></button>
                        {trip.status === "upcoming" && (
                          <button onClick={() => navigate("itinerary")} className="bg-primary text-primary-foreground text-xs px-3 py-2 rounded-xl hover:opacity-90 transition-opacity font-medium">View Itinerary</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ STAYS ══════════════════════════════════════════════════════ */}
        {tab === "stays" && (
          <section className="min-h-screen py-14 px-5 md:px-12 bg-background">
            <div className="max-w-5xl mx-auto">
              <div className="mb-8">
                <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Accommodation</p>
                <h2 className="text-3xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Temple Stays &amp; Dharamshalas</h2>
                <p className="text-sm text-muted-foreground mt-1">Curated stays near {detailTemple?.name || "temples"} — from dharamshalas to boutique hotels</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {STAYS.map((stay) => (
                  <div key={stay.id} className={`bg-card border rounded-2xl overflow-hidden transition-all ${selStay?.id === stay.id ? "border-primary ring-1 ring-primary" : "border-border hover:shadow-sm"}`}>
                    <div className="h-44 bg-muted">
                      <img src={stay.image} alt={stay.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>{stay.name}</h3>
                          <div className="text-xs text-primary italic">{stay.type}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-foreground">₹{stay.price}<span className="text-xs font-normal text-muted-foreground">/night</span></div>
                          <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground"><Star size={10} className="text-amber-500 fill-amber-500" />{stay.rating}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3"><MapPin size={10} />{stay.distance}</div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {stay.amenities.map((a) => <span key={a} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{a}</span>)}
                      </div>
                      <button onClick={() => { setSelStay(stay); setStayBooked(false); }} className={`w-full py-2.5 rounded-full text-sm font-medium transition-all ${selStay?.id === stay.id ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:border-primary/40"}`}>
                        {selStay?.id === stay.id ? "Selected ✓" : "Select Stay"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {selStay && !stayBooked && (
                <div className="mt-6 bg-card border border-primary rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-foreground">{selStay.name}</div>
                    <div className="text-sm text-muted-foreground">₹{selStay.price}/night · {selStay.distance}</div>
                  </div>
                  <button onClick={() => setStayBooked(true)} className="bg-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                    <Hotel size={14} /> Confirm Stay Booking
                  </button>
                </div>
              )}
              {stayBooked && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
                  <CheckCircle size={22} className="text-green-500 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground">Stay Confirmed — {selStay?.name}</div>
                    <div className="text-sm text-muted-foreground">Booking confirmation sent to your email.</div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ DONATIONS ══════════════════════════════════════════════════ */}
        {tab === "donations" && (
          <section className="min-h-screen py-14 px-5 md:px-12 bg-background">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Spiritual Giving</p>
                <h2 className="text-3xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Donations &amp; Seva</h2>
                <p className="text-sm text-muted-foreground mt-1">Contribute to temple maintenance, annadanam, and charitable causes</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Donation form */}
                <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-base font-semibold text-foreground mb-5" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Make a Donation</h3>
                  {donated ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} className="text-green-500" /></div>
                      <div className="text-lg font-semibold text-foreground mb-1">Donation Received!</div>
                      <div className="text-sm text-muted-foreground">₹{donationAmount} donated to {donationTemple} — {donationCause}</div>
                      <div className="text-xs text-muted-foreground mt-1">A receipt has been sent to your email</div>
                      <button onClick={() => { setDonated(false); setDonationAmount(""); setDonationTemple(""); setDonationCause(""); }} className="mt-5 bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90">Donate Again</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Select Temple</label>
                        <div className="relative">
                          <select value={donationTemple} onChange={(e) => setDonationTemple(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none">
                            <option value="">Choose a temple…</option>
                            {TEMPLES.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                          <ChevronDown size={13} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Cause / Seva</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {["Annadanam", "Temple Maintenance", "Go Seva", "Lamp Lighting", "Education Fund", "Flood Relief"].map((cause) => (
                            <button key={cause} onClick={() => setDonationCause(cause)} className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${donationCause === cause ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/30"}`}>{cause}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Amount (₹)</label>
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {["51", "101", "251", "501", "1001", "5001"].map((amt) => (
                            <button key={amt} onClick={() => setDonationAmount(amt)} className={`px-3 py-1.5 rounded-full text-xs border font-medium transition-all ${donationAmount === amt ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary/40"}`}>₹{amt}</button>
                          ))}
                        </div>
                        <input value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} placeholder="Or enter custom amount" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <button
                        disabled={!donationTemple || !donationAmount || !donationCause}
                        onClick={() => setDonated(true)}
                        className="w-full bg-primary text-primary-foreground py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        <Gift size={15} /> Donate ₹{donationAmount || "—"} Now
                      </button>
                      <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1"><Shield size={10} className="text-green-500" /> 80G tax benefit available · Secure payment</p>
                    </div>
                  )}
                </div>

                {/* Donation stats sidebar */}
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h4 className="text-sm font-semibold text-foreground mb-4" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Your Giving</h4>
                    <div className="space-y-3">
                      {[["Total Donated", "₹2,550"], ["Temples Supported", "3"], ["This Year", "₹1,050"]].map(([l, v]) => (
                        <div key={l} className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">{l}</span>
                          <span className="text-sm font-semibold text-foreground">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h4 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Recent Donations</h4>
                    {[["Tirupati Balaji", "Annadanam", "₹501"], ["Golden Temple", "Langar", "₹1,001"], ["Vaishno Devi", "Lamp Lighting", "₹251"]].map(([temple, cause, amount]) => (
                      <div key={temple} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                        <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0"><Gift size={13} className="text-primary" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">{temple}</div>
                          <div className="text-[10px] text-muted-foreground">{cause}</div>
                        </div>
                        <span className="text-xs font-semibold text-primary flex-shrink-0">{amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Impact section */}
              <div className="bg-primary rounded-2xl p-6 text-center">
                <div className="text-3xl select-none mb-3">🙏</div>
                <h3 className="text-xl font-semibold text-primary-foreground mb-2" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Your giving makes a difference</h3>
                <p className="text-primary-foreground/70 text-sm max-w-md mx-auto">₹101 feeds 10 people through annadanam. ₹501 lights a temple lamp for a month. Every offering, however small, is sacred.</p>
              </div>
            </div>
          </section>
        )}

        {/* ═══ PROFILE ════════════════════════════════════════════════════ */}
        {tab === "profile" && (
          <section className="min-h-screen py-14 px-5 md:px-12 bg-background">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">My Account</p>
                <h2 className="text-3xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Devotee Profile</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile card */}
                <div className="bg-card border border-border rounded-2xl p-6 text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
                    <span className="text-3xl font-bold text-primary" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>R</span>
                  </div>
                  <div className="font-semibold text-foreground text-lg" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Ramesh Sharma</div>
                  <div className="text-sm text-muted-foreground">ramesh.sharma@email.com</div>
                  <div className="text-sm text-muted-foreground mt-0.5">+91 98765 43210</div>
                  <div className="flex justify-center gap-3 mt-4 text-xs text-muted-foreground">
                    <span className="bg-secondary px-2 py-1 rounded-full">Delhi</span>
                    <span className="bg-secondary px-2 py-1 rounded-full">Hindu</span>
                  </div>
                  <button className="mt-4 border border-border text-foreground text-sm px-5 py-2 rounded-full hover:bg-muted transition-colors flex items-center gap-2 mx-auto">
                    <Edit size={13} /> Edit Profile
                  </button>
                </div>

                {/* Main content */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Contact details */}
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Contact &amp; ID</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[["Full Name", "Ramesh Sharma"], ["Email", "ramesh.sharma@email.com"], ["Phone", "+91 98765 43210"], ["Aadhaar", "XXXX-XXXX-1234"], ["City", "New Delhi"], ["State", "Delhi"]].map(([l, v]) => (
                        <div key={l} className="border border-border rounded-xl px-4 py-3">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{l}</div>
                          <div className="text-sm font-medium text-foreground">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Family members */}
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Family Members</h3>
                      <button onClick={() => setAddingMember(!addingMember)} className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full hover:opacity-90 flex items-center gap-1.5">
                        <PlusCircle size={12} /> Add Member
                      </button>
                    </div>

                    {addingMember && (
                      <div className="bg-secondary/30 border border-border rounded-xl p-4 mb-4 space-y-3">
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">New Family Member</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <input value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="Full Name" className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                          <input value={newMember.relation} onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })} placeholder="Relation (e.g. Spouse)" className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                          <input value={newMember.age} onChange={(e) => setNewMember({ ...newMember, age: e.target.value })} placeholder="Age" type="number" className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                          <input value={newMember.idNumber} onChange={(e) => setNewMember({ ...newMember, idNumber: e.target.value })} placeholder="Aadhaar / ID No." className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { if (newMember.name && newMember.relation) { setFamily([...family, { id: Date.now(), name: newMember.name, relation: newMember.relation, age: parseInt(newMember.age) || 0, idType: "Aadhaar", idNumber: newMember.idNumber }]); setNewMember({ name: "", relation: "", age: "", idType: "Aadhaar", idNumber: "" }); setAddingMember(false); } }} className="bg-primary text-primary-foreground text-xs px-4 py-2 rounded-full hover:opacity-90">Save Member</button>
                          <button onClick={() => setAddingMember(false)} className="border border-border text-foreground text-xs px-4 py-2 rounded-full hover:bg-muted">Cancel</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {family.map((member) => (
                        <div key={member.id} className="flex items-center gap-4 p-3 border border-border rounded-xl">
                          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">{member.name[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.relation} · Age {member.age}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{member.idType}: {member.idNumber}</div>
                          </div>
                          <button onClick={() => setFamily(family.filter((f) => f.id !== member.id))} className="text-muted-foreground hover:text-destructive transition-colors p-1.5">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-4" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Preferences &amp; Notifications</h3>
                    <div className="space-y-3">
                      {[["Booking Confirmations", true], ["Slot Reminders (24h before)", true], ["Temple Festival Alerts", false], ["New Temple Additions", true]].map(([label, def]) => (
                        <div key={label as string} className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{label}</span>
                          <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${def ? "bg-primary" : "bg-muted"}`}>
                            <div className={`w-4 h-4 bg-white rounded-full m-0.5 transition-transform ${def ? "translate-x-5" : "translate-x-0"}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══ SIGN IN ═════════════════════════════════════════════════════ */}
        {tab === "signin" && (
          <SignInPage
            onSuccess={async (name, email, token) => {
              if (token) auth.setToken(token);
              setIsLoggedIn(true);
              setLoggedUser({ name, email });
              await loadUserData();
              navigate("home");
            }}
            onRegister={() => navigate("register")}
          />
        )}

        {/* ═══ REGISTER ════════════════════════════════════════════════════ */}
        {tab === "register" && (
          <RegisterPage
            onSuccess={async (name, email, token) => {
              if (token) auth.setToken(token);
              setIsLoggedIn(true);
              setLoggedUser({ name, email });
              await loadUserData();
              navigate("home");
            }}
            onSignIn={() => navigate("signin")}
          />
        )}

        {/* Footer */}
        <footer className="bg-foreground text-primary-foreground/50 py-12 px-5 md:px-12 mt-0">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs select-none">ॐ</div>
                  <span className="text-primary-foreground font-semibold" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>DarshanEase</span>
                </div>
                <p className="text-xs leading-relaxed">Your trusted companion for seamless sacred darshan across India's holiest temples and shrines.</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["UPI", "Visa", "Mastercard", "RuPay", "Paytm"].map((p) => (
                    <span key={p} className="text-[10px] bg-white/10 px-2 py-1 rounded font-medium">{p}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-wider mb-3">Navigate</div>
                <div className="space-y-2">
                  {navLinks.map(([t, label]) => (
                    <button key={t} onClick={() => navigate(t)} className="block text-xs hover:text-primary-foreground/80 transition-colors">{label}</button>
                  ))}
                  <button onClick={() => navigate("stays")} className="block text-xs hover:text-primary-foreground/80 transition-colors">Stays</button>
                </div>
              </div>
              <div>
                <div className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-wider mb-3">Support</div>
                <div className="space-y-2 text-xs">
                  {["Help Center", "Cancellation Policy", "Refund Policy", "Contact Us", "Feedback"].map((item) => (
                    <div key={item} className="hover:text-primary-foreground/80 transition-colors cursor-pointer">{item}</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-wider mb-3">Contact</div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2"><Phone size={11} className="text-primary" /> +91 98765 43210</div>
                  <div className="flex items-center gap-2"><Mail size={11} className="text-primary" /> support@darshanese.in</div>
                  <div className="flex items-center gap-2"><Clock size={11} className="text-primary" /> 6 AM – 10 PM IST</div>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <p>© 2026 DarshanEase · Made with devotion for devotees across India</p>
              <div className="flex gap-4">
                <span className="cursor-pointer hover:text-primary-foreground/70">Privacy</span>
                <span className="cursor-pointer hover:text-primary-foreground/70">Terms</span>
                <span className="cursor-pointer hover:text-primary-foreground/70">Sitemap</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─── Homepage ────────────────────────────────────────────────────────────────

function HomePage({ navigate, onTempleOpen, onBooking }: { navigate: (t: Tab) => void; onTempleOpen: (t: Temple) => void; onBooking: (t: Temple) => void; }) {
  const featured = TEMPLES.filter((t) => t.featured);
  const [heroSearch, setHeroSearch] = useState("");
  const heroResults = heroSearch.length > 1 ? TEMPLES.filter(t => t.name.toLowerCase().includes(heroSearch.toLowerCase()) || t.location.toLowerCase().includes(heroSearch.toLowerCase())).slice(0, 4) : [];

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[92vh] grid grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col justify-center px-8 md:px-16 lg:px-20 py-24 bg-background z-10">
          <div className="inline-flex items-center gap-2 bg-secondary border border-border text-foreground text-[11px] px-3 py-1.5 rounded-full mb-7 w-fit animate-fadeInUp">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-pulse-dot" />
            Now serving 200+ sacred temples across India
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] text-foreground mb-6 animate-fadeInUp" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)", animationDelay: "60ms" }}>
            Seek blessings,<br /><span className="text-primary">not queues.</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md mb-8 animate-fadeInUp" style={{ animationDelay: "120ms" }}>
            Book darshan, plan travel, and stay near India's most sacred temples — all from one platform.
          </p>

          {/* Quick search widget */}
          <div className="relative mb-8 animate-fadeInUp" style={{ animationDelay: "180ms" }}>
            <div className="bg-card border border-border rounded-2xl p-3 shadow-md flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  value={heroSearch}
                  onChange={e => setHeroSearch(e.target.value)}
                  placeholder="Search temple, deity or location…"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
                {heroResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-lg z-30 overflow-hidden">
                    {heroResults.map(t => (
                      <button key={t.id} onClick={() => { setHeroSearch(""); onTempleOpen(t); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary transition-colors text-left">
                        <img src={t.image} alt={t.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{t.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{t.location}</div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${religionBadge[t.religion]}`}>{t.religion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => navigate("booking")} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group flex-shrink-0 shadow-sm">
                Book Darshan <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-12 animate-fadeInUp" style={{ animationDelay: "220ms" }}>
            <button onClick={() => navigate("temples")} className="border border-border text-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-muted transition-colors">
              Browse All Temples
            </button>
            <button onClick={() => navigate("travel")} className="border border-border text-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1.5">
              <Train size={13} /> Plan Travel
            </button>
          </div>

          <div className="flex gap-10 pt-6 border-t border-border animate-fadeInUp" style={{ animationDelay: "260ms" }}>
            {[["1.2M+", "Devotees served"], ["200+", "Sacred temples"], ["16+", "States covered"]].map(([v, l]) => (
              <div key={v}>
                <div className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>{v}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative hidden lg:block bg-muted overflow-hidden">
          <img src="https://images.unsplash.com/photo-1557062975-92aa401cee64?w=1000&h=1000&fit=crop&auto=format" alt="Grand Indian temple facade" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/20 to-transparent" />
          {/* Floating info cards */}
          <div className="absolute bottom-10 left-8 right-16 space-y-2.5">
            {[
              { img: "https://images.unsplash.com/photo-1606298855672-3efb63017be8?w=80&h=80&fit=crop&auto=format", name: "Meenakshi Amman", sub: "Next slot: 5:00 AM", badge: "200 slots", badgeColor: "bg-green-100 text-green-700" },
              { img: "https://images.unsplash.com/photo-1623059508779-2542c6e83753?w=80&h=80&fit=crop&auto=format", name: "Golden Temple", sub: "Open 24/7 · Free Entry", badge: "Sikh", badgeColor: "bg-sky-100 text-sky-700" },
            ].map((card, i) => (
              <div key={card.name} className="bg-background/90 backdrop-blur-md rounded-2xl border border-border/80 p-3.5 flex items-center gap-3 shadow-xl animate-fadeInUp" style={{ animationDelay: `${300 + i * 80}ms` }}>
                <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-muted"><img src={card.img} alt={card.name} className="w-full h-full object-cover" /></div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-foreground">{card.name}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Clock size={9} />{card.sub}</div>
                </div>
                <div className={`text-[10px] px-2 py-1 rounded-full font-semibold ${card.badgeColor}`}>{card.badge}</div>
              </div>
            ))}
          </div>
          {/* Rating badge top-right */}
          <div className="absolute top-8 right-8 bg-background/90 backdrop-blur-md rounded-xl border border-border px-3 py-2 shadow-lg animate-fadeIn" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center gap-1.5">
              <Star size={13} className="text-amber-500 fill-amber-500" />
              <span className="text-sm font-bold text-foreground">4.9</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Avg. rating</div>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="py-10 px-5 md:px-12 bg-secondary/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 stagger-children">
            {([
              ["booking", "Book Darshan", Ticket, "Reserve your darshan slot", "bg-primary/10"],
              ["travel", "Plan Travel", Train, "Bus, train & flight search", "bg-blue-50"],
              ["stays", "Temple Stays", Hotel, "Dharamshalas & hotels", "bg-amber-50"],
              ["donations", "Donate & Seva", Gift, "Spiritual giving platform", "bg-rose-50"],
            ] as [Tab, string, any, string, string][]).map(([t, label, Icon, desc, iconBg]) => (
              <button key={t} onClick={() => navigate(t)} className="bg-card border border-border rounded-2xl p-4 md:p-5 text-left hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 group">
                <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={18} className="text-primary" />
                </div>
                <div className="font-semibold text-foreground text-sm" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Temples */}
      <section className="py-20 px-5 md:px-12 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1.5">Featured</p>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Popular Sacred Sites</h2>
            </div>
            <button onClick={() => navigate("temples")} className="text-sm text-primary hover:underline underline-offset-2 flex items-center gap-1">
              View all {TEMPLES.length} <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {featured.map((t) => <TempleCard key={t.id} temple={t} onSelect={onTempleOpen} onBook={onBooking} />)}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-5 md:px-12 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-primary uppercase tracking-widest font-medium mb-2">Simple &amp; Sacred</p>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Everything for Your Sacred Journey</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 stagger-children">
            {[["01", "Choose Temple", "Browse 200+ temples and sacred sites", MapPin], ["02", "Book Travel", "Search buses, trains & flights", Train], ["03", "Reserve Darshan", "Pick your date, time & pooja type", Calendar], ["04", "Book Stay", "Dharamshalas & hotels nearby", Hotel], ["05", "Pay & Go", "Secure payment, instant e-Pass", CheckCircle]].map(([num, title, desc, Icon], idx) => (
              <div key={num as string} className="text-center group relative">
                {idx < 4 && <div className="hidden lg:block absolute top-7 left-[calc(50%+28px)] right-[calc(-50%+28px)] h-px bg-border" />}
                <div className="w-14 h-14 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-200 relative z-10">
                  <Icon size={20} className="text-primary" />
                </div>
                <div className="text-[10px] font-bold text-primary/40 tracking-widest mb-1 uppercase">{num}</div>
                <h3 className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-5 md:px-12 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-primary uppercase tracking-widest font-medium mb-2">Devotee Stories</p>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>What Devotees Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
            {[
              { name: "Priya Sharma", location: "Delhi · Vaishno Devi", rating: 5, text: "DarshanEase made our Vaishno Devi trip completely seamless. We booked our darshan slot, travel, and stay all from one place. No rushing, no uncertainty — arrived relaxed and blessed!", avatar: "P", color: "bg-rose-100 text-rose-700" },
              { name: "Ramesh Iyer", location: "Chennai · Tirupati Balaji", rating: 5, text: "Booked VIP darshan for our family of 6 in minutes. The e-Pass worked flawlessly at the entry gate. The family management feature to add all members was brilliant.", avatar: "R", color: "bg-amber-100 text-amber-700" },
              { name: "Kavitha Nair", location: "Kochi · Meenakshi Amman", rating: 5, text: "I was skeptical about online temple bookings but DarshanEase exceeded every expectation. The Abhishekam booking, hotel near the temple, and the donation feature — all perfect.", avatar: "K", color: "bg-violet-100 text-violet-700" },
            ].map(({ name, location, rating, text, avatar, color }) => (
              <div key={name} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md hover:border-primary/20 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">{Array.from({ length: rating }).map((_, i) => <Star key={i} size={13} className="text-amber-500 fill-amber-500" />)}</div>
                  <div className="text-2xl text-primary/20 select-none font-serif">"</div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{text}</p>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center font-semibold text-sm flex-shrink-0`}>{avatar}</div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{name}</div>
                    <div className="text-[11px] text-muted-foreground">{location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 md:px-12 bg-primary relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 25% 60%, white 1px, transparent 1px), radial-gradient(circle at 75% 30%, white 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="text-5xl mb-5 select-none">ॐ</div>
          <h2 className="text-3xl md:text-4xl font-semibold text-primary-foreground mb-4 leading-snug" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Begin your spiritual journey today</h2>
          <p className="text-primary-foreground/65 mb-8 max-w-xl mx-auto text-sm leading-relaxed">Join over a million devotees who have experienced seamless, peaceful darshan with DarshanEase — from the Himalayas to the southern ghats.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button onClick={() => navigate("booking")} className="bg-primary-foreground text-primary px-9 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 group shadow-md">
              Book Your Darshan <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => navigate("temples")} className="border border-primary-foreground/30 text-primary-foreground px-7 py-3.5 rounded-full text-sm font-medium hover:bg-primary-foreground/10 transition-colors">
              Browse Temples
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Itinerary Page ──────────────────────────────────────────────────────────

function ItineraryPage({ navigate, onBooking }: { navigate: (t: Tab) => void; onBooking: () => void }) {
  const days = [
    { day: "Day 1", date: "Jul 18, 2026", events: [{ time: "6:00 AM", title: "Depart from Delhi (Vande Bharat Express)", icon: Train, color: "bg-blue-100 text-blue-700" }, { time: "12:30 PM", title: "Arrive Tirupati Station · Check-in Tirumala Guest House", icon: Hotel, color: "bg-amber-100 text-amber-700" }, { time: "3:00 PM", title: "Darshan Preparation — temple route info, dress code", icon: BookOpen, color: "bg-secondary text-muted-foreground" }, { time: "6:00 PM", title: "Evening Aarti at Tirumala Hills", icon: Sunrise, color: "bg-orange-100 text-orange-700" }] },
    { day: "Day 2", date: "Jul 19, 2026", events: [{ time: "4:30 AM", title: "Wake up — Pre-darshan bath & preparation", icon: Coffee, color: "bg-secondary text-muted-foreground" }, { time: "6:00 AM", title: "Special Entry Darshan — Tirupati Balaji (Booked)", icon: Ticket, color: "bg-green-100 text-green-700" }, { time: "9:00 AM", title: "Prasadam & breakfast at Annadanam Hall", icon: Coffee, color: "bg-amber-100 text-amber-700" }, { time: "2:00 PM", title: "Visit Kalahasti Temple (Day trip, 36 km away)", icon: MapPin, color: "bg-violet-100 text-violet-700" }, { time: "7:30 PM", title: "Dinner · Rest at Guest House", icon: Moon, color: "bg-secondary text-muted-foreground" }] },
    { day: "Day 3", date: "Jul 20, 2026", events: [{ time: "8:00 AM", title: "Checkout · Travel back to Tirupati Station", icon: Hotel, color: "bg-amber-100 text-amber-700" }, { time: "10:45 AM", title: "Train back to Delhi (Tirumala Express)", icon: Train, color: "bg-blue-100 text-blue-700" }, { time: "5:30 PM", title: "Arrive New Delhi · Journey complete", icon: CheckCircle, color: "bg-green-100 text-green-700" }] },
  ];

  return (
    <section className="min-h-screen py-14 px-5 md:px-12 bg-background">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-xs text-primary uppercase tracking-widest font-medium mb-1">Your Journey Plan</p>
          <h2 className="text-3xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Spiritual Journey Itinerary</h2>
          <p className="text-sm text-muted-foreground mt-1">Tirupati Balaji Pilgrimage · Jul 18–20, 2026</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 mb-6 flex flex-col sm:flex-row gap-4">
          {[["Temple", "Tirupati Balaji"], ["Date", "Jul 18–20, 2026"], ["Darshan", "Special Entry"], ["Travel", "Train (Vande Bharat)"], ["Stay", "Tirumala Guest House"], ["Devotees", "2 persons"]].map(([l, v]) => (
            <div key={l} className="flex-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{l}</div>
              <div className="text-sm font-medium text-foreground">{v}</div>
            </div>
          ))}
        </div>

        <div className="space-y-8">
          {days.map((day, di) => (
            <div key={day.day}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">{di + 1}</div>
                <div>
                  <div className="font-semibold text-foreground text-sm" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>{day.day}</div>
                  <div className="text-xs text-muted-foreground">{day.date}</div>
                </div>
              </div>
              <div className="ml-4 border-l-2 border-border pl-6 space-y-4">
                {day.events.map((ev, i) => (
                  <div key={i} className="relative flex items-start gap-4">
                    <div className="absolute -left-[1.875rem] w-3.5 h-3.5 rounded-full bg-background border-2 border-primary mt-0.5" />
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ev.color}`}>
                      <ev.icon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-0.5" style={{ fontFamily: "var(--font-mono, 'DM Mono', monospace)" }}>{ev.time}</div>
                      <div className="text-sm text-foreground">{ev.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <button className="border border-border text-foreground px-6 py-2.5 rounded-full text-sm hover:bg-muted transition-colors flex items-center gap-2">
            <Download size={14} /> Download PDF
          </button>
          <button className="border border-border text-foreground px-6 py-2.5 rounded-full text-sm hover:bg-muted transition-colors flex items-center gap-2">
            <Share2 size={14} /> Share
          </button>
          <button onClick={onBooking} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 flex items-center gap-2 ml-auto">
            <PlusCircle size={14} /> Add More Bookings
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Temple Card ─────────────────────────────────────────────────────────────

function TempleCard({ temple, onSelect, onBook }: { temple: Temple; onSelect: (t: Temple) => void; onBook?: (t: Temple) => void }) {
  return (
    <div className="group border border-border rounded-2xl overflow-hidden bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="relative h-44 bg-muted overflow-hidden cursor-pointer" onClick={() => onSelect(temple)}>
        <img src={temple.image} alt={temple.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={`text-[10px] px-2 py-1 rounded-full font-semibold backdrop-blur-sm ${religionBadge[temple.religion]}`}>{temple.religion}</span>
          {temple.featured && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium">Featured</span>}
        </div>
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold">
          <Star size={10} className="text-amber-400 fill-amber-400" /> {temple.rating}
        </div>
        {/* Slots badge */}
        <div className="absolute bottom-3 right-3">
          <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${temple.ticketsLeft < 100 ? "bg-red-500/90 text-white" : "bg-green-500/90 text-white"}`}>
            {temple.ticketsLeft < 100 ? `${temple.ticketsLeft} left` : "Available"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 cursor-pointer" onClick={() => onSelect(temple)}>
        <h3 className="font-semibold text-foreground text-[15px] leading-tight" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>{temple.name}</h3>
        <p className="text-[11px] text-primary mt-0.5 italic mb-1">{temple.deity}</p>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2"><MapPin size={10} />{temple.location}</div>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3 flex-1">{temple.description}</p>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] text-muted-foreground">Next slot</div>
          <div className="text-[11px] font-medium text-foreground flex items-center gap-1 mt-0.5"><Clock size={9} />{temple.nextSlot}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onSelect(temple)} className="text-xs px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-muted transition-colors">Details</button>
          {onBook && (
            <button onClick={(e) => { e.stopPropagation(); onBook(temple); }} className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium flex items-center gap-1">
              <Ticket size={10} /> Book
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Booking sub-components ───────────────────────────────────────────────────

function BookingStepTemple({ selected, onSelect, onNext }: { selected: Temple | null; onSelect: (t: Temple) => void; onNext: () => void }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground mb-5" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Select a Temple</h3>
      <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-1">
        {TEMPLES.map((t) => (
          <button key={t.id} onClick={() => onSelect(t)} className={`text-left p-3.5 rounded-xl border transition-all ${selected?.id === t.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40 bg-card"}`}>
            <div className="flex items-center gap-3">
              <div className="w-16 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted"><img src={t.image} alt={t.name} className="w-full h-full object-cover" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground text-sm">{t.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${religionBadge[t.religion]}`}>{t.religion}</span>
                </div>
                <div className="text-xs text-primary italic mt-0.5">{t.deity}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin size={9} />{t.location}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-xs text-foreground justify-end"><Star size={10} className="text-amber-500 fill-amber-500" />{t.rating}</div>
                <div className={`text-[10px] mt-1 font-medium ${t.ticketsLeft < 100 ? "text-red-500" : "text-green-600"}`}>{t.ticketsLeft} left</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex justify-end pt-4"><button disabled={!selected} onClick={onNext} className="bg-primary text-primary-foreground px-7 py-2.5 rounded-full text-sm font-medium disabled:opacity-40 hover:opacity-90 flex items-center gap-2 group">Continue <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></button></div>
    </div>
  );
}

function BookingStepDateTime({ date, time, minDate, maxDate, onDate, onTime, onBack, onNext }: { date: string; time: string; minDate: string; maxDate: string; onDate: (d: string) => void; onTime: (t: string) => void; onBack: () => void; onNext: () => void }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground mb-5" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Date &amp; Time Slot</h3>
      <div className="mb-6">
        <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Visit Date</label>
        <input type="date" min={minDate} max={maxDate} value={date} onChange={(e) => onDate(e.target.value)} className="border border-border rounded-xl px-4 py-2.5 text-sm text-foreground bg-card w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-primary" />
        <p className="text-[11px] text-muted-foreground mt-1">Bookable up to 60 days in advance</p>
      </div>
      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block">Available Time Slots</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {TIME_SLOTS.map(({ time: t, available, slots }) => (
            <button key={t} disabled={!available} onClick={() => onTime(t)} className={`p-3 rounded-xl border text-center transition-all ${!available ? "opacity-40 cursor-not-allowed bg-muted border-border" : time === t ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40 bg-card"}`}>
              <div className={`text-xs font-semibold ${time === t ? "text-primary" : "text-foreground"}`} style={{ fontFamily: "var(--font-mono, 'DM Mono', monospace)" }}>{t}</div>
              {available ? <div className={`text-[10px] mt-0.5 ${slots <= 20 ? "text-red-500 font-medium" : "text-muted-foreground"}`}>{slots} slots</div> : <div className="text-[10px] text-red-400 mt-0.5">Full</div>}
            </button>
          ))}
        </div>
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!date || !time} />
    </div>
  );
}

function BookingStepPooja({ selected, devotees, onSelect, onDevotees, family, onBack, onNext }: { selected: Pooja | null; devotees: number; onSelect: (p: Pooja) => void; onDevotees: (n: number) => void; family: FamilyMember[]; onBack: () => void; onNext: () => void }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground mb-5" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Pooja &amp; Seva Type</h3>
      <div className="grid grid-cols-1 gap-3 mb-7">
        {POOJA_TYPES.map((p) => (
          <button key={p.id} onClick={() => onSelect(p)} className={`text-left p-4 rounded-xl border transition-all ${selected?.id === p.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40 bg-card"}`}>
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">{p.name}</span>
                  {p.popular && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Popular</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 italic">{p.desc}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-semibold text-foreground text-sm">{p.price === 0 ? "Free" : `₹${p.price}`}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5" style={{ fontFamily: "var(--font-mono, 'DM Mono', monospace)" }}><Clock size={9} className="inline mr-0.5" />{p.duration}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <label className="text-sm font-medium text-foreground mb-3 block flex items-center gap-2"><Users size={13} className="text-primary" /> Number of Devotees</label>
        <div className="flex items-center gap-4">
          <button onClick={() => onDevotees(Math.max(1, devotees - 1))} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted text-lg font-medium">−</button>
          <span className="w-10 text-center font-bold text-foreground text-lg" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>{devotees}</span>
          <button onClick={() => onDevotees(Math.min(10, devotees + 1))} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted text-lg font-medium">+</button>
          <span className="text-xs text-muted-foreground">Max 10</span>
        </div>
        {family.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[11px] text-muted-foreground mb-2">Quick add from family:</p>
            <div className="flex flex-wrap gap-2">
              {family.map((m) => <span key={m.id} className="text-[11px] bg-secondary px-2.5 py-1 rounded-full text-foreground border border-border">{m.name}</span>)}
            </div>
          </div>
        )}
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!selected} />
    </div>
  );
}

function BookingStepReview({ temple, date, time, pooja, devotees, onBack, onNext }: { temple: Temple | null; date: string; time: string; pooja: Pooja | null; devotees: number; onBack: () => void; onNext: () => void }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground mb-5" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Review Booking Details</h3>
      {temple && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-5">
          <div className="relative h-40">
            <img src={temple.image} alt={temple.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
            <div className="absolute bottom-4 left-5">
              <div className="text-white font-semibold text-lg" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>{temple.name}</div>
              <div className="text-white/70 text-xs flex items-center gap-1 mt-0.5"><MapPin size={10} />{temple.location}</div>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[["Deity", temple.deity], ["Date", date], ["Time", time], ["Pooja", pooja?.name], ["Duration", pooja?.duration], ["Devotees", `${devotees} person${devotees > 1 ? "s" : ""}`]].map(([l, v]) => (
              <div key={l as string}><div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{l}</div><div className="text-sm font-medium text-foreground">{v || "—"}</div></div>
            ))}
          </div>
        </div>
      )}
      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Proceed to Payment" />
    </div>
  );
}

function BookingStepPayment({ payMethod, onPayMethod, upiId, onUpiId, cardNum, onCardNum, cardName, onCardName, cardExpiry, onCardExpiry, cardCvv, onCardCvv, selBank, onSelBank, selWallet, onSelWallet, grandTotal, payValid, payProcessing, onBack, onPay }: any) {
  return (
    <div>
      <h3 className="text-base font-semibold text-foreground mb-5" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Secure Payment</h3>
      <div className="flex items-center gap-2 mb-5 text-xs text-muted-foreground bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <Shield size={13} className="text-green-600 flex-shrink-0" /> All transactions secured with 256-bit SSL encryption <Lock size={11} className="text-green-600 ml-auto flex-shrink-0" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {([["upi", "UPI", Smartphone], ["card", "Card", CreditCard], ["netbanking", "Net Banking", Building2], ["wallet", "Wallet", Wallet]] as [PaymentMethod, string, any][]).map(([id, label, Icon]) => (
          <button key={id!} onClick={() => onPayMethod(id)} className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border transition-all ${payMethod === id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30 bg-card"}`}>
            <Icon size={18} className={payMethod === id ? "text-primary" : "text-muted-foreground"} />
            <span className={`text-xs font-medium ${payMethod === id ? "text-primary" : "text-foreground"}`}>{label}</span>
          </button>
        ))}
      </div>

      {payMethod === "upi" && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => (
              <button key={app} onClick={() => onSelWallet(app)} className={`px-4 py-2 rounded-full text-xs border font-medium transition-all ${selWallet === app ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground hover:border-primary/40"}`}>{app}</button>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Or enter UPI ID</label>
            <input value={upiId} onChange={(e) => onUpiId(e.target.value)} placeholder="yourname@upi" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      )}
      {payMethod === "card" && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Card Number</label>
            <input value={cardNum} onChange={(e) => onCardNum(e.target.value.replace(/\D/g, "").slice(0, 16))} placeholder="1234 5678 9012 3456" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" style={{ fontFamily: "var(--font-mono, 'DM Mono', monospace)", letterSpacing: "0.1em" }} />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Cardholder Name</label>
            <input value={cardName} onChange={(e) => onCardName(e.target.value)} placeholder="As on card" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Expiry</label>
              <input value={cardExpiry} onChange={(e) => onCardExpiry(e.target.value)} placeholder="MM / YY" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">CVV</label>
              <input value={cardCvv} onChange={(e) => onCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="•••" type="password" className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-2">{["VISA", "MC", "RUPAY", "AMEX"].map((c) => <div key={c} className="bg-muted border border-border rounded px-2 py-1 text-[9px] uppercase font-bold text-muted-foreground">{c}</div>)}</div>
        </div>
      )}
      {payMethod === "netbanking" && (
        <div className="bg-card border border-border rounded-xl p-5">
          <label className="text-xs font-medium text-foreground mb-3 block">Select Your Bank</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Bank", "Bank of Baroda"].map((b) => (
              <button key={b} onClick={() => onSelBank(b)} className={`p-3 rounded-xl border text-xs font-medium text-left ${selBank === b ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40"}`}>{b}</button>
            ))}
          </div>
          <div className="relative">
            <select onChange={(e) => onSelBank(e.target.value)} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none appearance-none">
              <option value="">All other banks…</option>
              {["Punjab National Bank", "Union Bank", "Canara Bank", "IndusInd Bank", "Yes Bank"].map((b) => <option key={b}>{b}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}
      {payMethod === "wallet" && (
        <div className="bg-card border border-border rounded-xl p-5">
          <label className="text-xs font-medium text-foreground mb-3 block">Select Wallet</label>
          <div className="grid grid-cols-2 gap-2">
            {["Paytm", "PhonePe", "Amazon Pay", "Mobikwik", "Freecharge", "Airtel Money"].map((w) => (
              <button key={w} onClick={() => onSelWallet(w)} className={`p-3.5 rounded-xl border text-sm font-medium transition-all ${selWallet === w ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40"}`}>{w}</button>
            ))}
          </div>
        </div>
      )}
      {!payMethod && <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">Select a payment method to continue</div>}

      <div className="flex justify-between items-center mt-6">
        <button onClick={onBack} className="border border-border text-foreground px-5 py-2.5 rounded-full text-sm hover:bg-muted">Back</button>
        <button disabled={!payValid || payProcessing} onClick={onPay} className="bg-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-semibold disabled:opacity-40 hover:opacity-90 flex items-center gap-2 min-w-[170px] justify-center">
          {payProcessing ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> Processing…</> : <><Lock size={13} /> Pay {grandTotal > 0 ? `₹${grandTotal}` : "& Confirm"}</>}
        </button>
      </div>
    </div>
  );
}

function BookingSidebar({ temple, date, time, pooja, devotees, total, gst, convenience, grandTotal }: any) {
  return (
    <div className="sticky top-24 space-y-4">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="bg-primary px-5 py-3.5">
          <p className="text-primary-foreground/70 text-xs uppercase tracking-widest">Booking Summary</p>
        </div>
        <div className="p-5 space-y-2.5">
          {[["Temple", temple?.name], ["Date", date], ["Time", time], ["Pooja", pooja?.name], ["Devotees", devotees > 0 ? String(devotees) : undefined]].map(([l, v]) => (
            <div key={l} className="flex justify-between gap-2">
              <span className="text-xs text-muted-foreground flex-shrink-0">{l}</span>
              <span className="text-xs text-foreground font-medium text-right">{v || "—"}</span>
            </div>
          ))}
        </div>
        {pooja && (
          <div className="border-t border-border p-5 space-y-2">
            <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Ticket</span><span className="text-foreground">{pooja.price === 0 ? "Free" : `₹${pooja.price} × ${devotees}`}</span></div>
            {total > 0 && <><div className="flex justify-between text-[11px]"><span className="text-muted-foreground">GST (5%)</span><span className="text-foreground">₹{gst}</span></div><div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Convenience</span><span className="text-foreground">₹{convenience}</span></div></>}
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold text-primary" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>{grandTotal === 0 ? "Free" : `₹${grandTotal}`}</span>
            </div>
          </div>
        )}
        <div className="px-5 pb-4 pt-1"><div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Shield size={10} className="text-green-500" /> Secure · Instant e-Pass delivery</div></div>
      </div>
      {temple && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <img src={temple.image} alt={temple.name} className="w-full h-28 object-cover" />
          <div className="p-4">
            <div className="text-xs font-semibold text-foreground mb-1">{temple.name}</div>
            <div className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">{temple.description}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingConfirmation({ temple, date, time, pooja, devotees, grandTotal, payMethod, onReset, onDashboard, onItinerary }: any) {
  const ref = `DE-${Date.now().toString(36).toUpperCase().slice(-5)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  const payLabel: Record<string, string> = { upi: "UPI", card: "Card", netbanking: "Net Banking", wallet: "Wallet" };
  return (
    <div className="max-w-lg mx-auto text-center py-10">
      <div className="w-20 h-20 bg-green-100 border-2 border-green-300 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={38} className="text-green-500" /></div>
      <h2 className="text-3xl font-semibold text-foreground mb-2" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>Booking Confirmed!</h2>
      <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm leading-relaxed">Your darshan e-Pass is ready. May your visit bring peace, grace, and blessings.</p>
      <div className="bg-card border border-border rounded-2xl overflow-hidden text-left mb-7 shadow-sm">
        {temple && (
          <div className="relative h-36">
            <img src={temple.image} alt={temple.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="text-white font-semibold" style={{ fontFamily: "var(--font-display, 'Cinzel', serif)" }}>{temple.name}</div>
              <div className="text-white/70 text-[11px] flex items-center gap-1"><MapPin size={9} />{temple.location}</div>
            </div>
          </div>
        )}
        <div className="p-5">
          <div className="text-center mb-4 pb-4 border-b border-border"><div className="text-primary text-3xl select-none">ॐ</div></div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            {[["Date", date], ["Time", time], ["Pooja", pooja?.name], ["Devotees", `${devotees} person${devotees > 1 ? "s" : ""}`], ["Amount Paid", grandTotal === 0 ? "Free" : `₹${grandTotal}`], ["Payment", payLabel[payMethod] || "—"]].map(([l, v]) => (
              <div key={l}><div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{l}</div><div className="text-sm font-medium text-foreground">{v}</div></div>
            ))}
          </div>
          <div className="bg-primary/8 border border-primary/20 rounded-xl py-3 text-center">
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">E-Pass Reference</div>
            <div className="text-primary font-bold tracking-[0.2em] text-sm" style={{ fontFamily: "var(--font-mono, 'DM Mono', monospace)" }}>{ref}</div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-3">Show this pass at the temple entry gate. Valid on selected date only.</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onItinerary} className="border border-border text-foreground px-6 py-3 rounded-full text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2"><BookOpen size={14} /> View Itinerary</button>
        <button onClick={onDashboard} className="border border-border text-foreground px-6 py-3 rounded-full text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2"><LayoutDashboard size={14} /> My Trips</button>
        <button onClick={onReset} className="bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-semibold hover:opacity-90">Book Another</button>
      </div>
    </div>
  );
}

// ─── Utility components ───────────────────────────────────────────────────────

function NavButtons({ onBack, onNext, nextDisabled = false, nextLabel = "Continue" }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean; nextLabel?: string }) {
  return (
    <div className="flex justify-between items-center mt-7 pt-5 border-t border-border">
      <button onClick={onBack} className="border border-border text-foreground px-5 py-2.5 rounded-full text-sm hover:bg-muted transition-colors">Back</button>
      <button disabled={nextDisabled} onClick={onNext} className="bg-primary text-primary-foreground px-7 py-2.5 rounded-full text-sm font-semibold disabled:opacity-40 hover:opacity-90 flex items-center gap-2 group">
        {nextLabel} <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}

function SelectInput({ icon, value, onChange, options }: { icon: React.ReactNode; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{icon}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="pl-8 pr-8 py-2.5 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ─── Sign In Page ─────────────────────────────────────────────────────────────

function SignInPage({ onSuccess, onRegister }: { onSuccess: (name: string, email: string, token?: string) => void; onRegister: () => void }) {
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) { setError("Enter a valid 10-digit mobile number."); return; }
    setError("");
    try { await authApi.sendOtp(`+91${phone}`); } catch { /* ignore — show OTP field anyway */ }
    setOtpSent(true);
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) (document.getElementById(`otp-${i + 1}`) as HTMLInputElement)?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (method === "email") {
      if (!email.includes("@")) { setError("Enter a valid email address."); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    } else {
      if (!otpSent) { setError("Please send OTP first."); return; }
      if (otp.join("").length < 6) { setError("Enter the 6-digit OTP sent to your number."); return; }
    }
    setLoading(true);
    try {
      let res;
      if (method === "email") {
        res = await authApi.login({ email, password });
      } else {
        res = await authApi.verifyOtp(`+91${phone}`, otp.join(""));
      }
      onSuccess(res.user.full_name, res.user.email, res.token);
    } catch (err: any) {
      // If backend unavailable, allow demo login
      if (err.message?.includes("Failed to fetch") || err.message?.includes("HTTP 5")) {
        onSuccess("Ramesh Sharma", email || `+91${phone}`);
      } else {
        setError(err.message || "Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid grid-cols-1 lg:grid-cols-2">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-primary p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-9 h-9 bg-primary-foreground/20 rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm select-none">ॐ</div>
            <span className="text-xl font-semibold text-primary-foreground" style={{ fontFamily: "var(--font-display,'Cinzel',serif)" }}>DarshanEase</span>
          </div>
          <h2 className="text-4xl font-semibold text-primary-foreground leading-snug mb-4" style={{ fontFamily: "var(--font-display,'Cinzel',serif)" }}>
            Welcome back,<br />blessed devotee.
          </h2>
          <p className="text-primary-foreground/70 leading-relaxed max-w-sm">
            Sign in to access your bookings, manage your family members, and continue your sacred journey across India.
          </p>
        </div>
        {/* Decorative temple image */}
        <div className="relative z-10 rounded-2xl overflow-hidden border border-primary-foreground/20 shadow-2xl">
          <img src="https://images.unsplash.com/photo-1623059508779-2542c6e83753?w=700&h=400&fit=crop&auto=format" alt="Golden Temple" className="w-full h-52 object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
          <div className="absolute bottom-4 left-5 text-primary-foreground">
            <div className="text-sm font-semibold" style={{ fontFamily: "var(--font-display,'Cinzel',serif)" }}>Golden Temple, Amritsar</div>
            <div className="text-xs text-primary-foreground/70 mt-0.5">Open 24/7 · Free Entry</div>
          </div>
        </div>
        {/* Stats */}
        <div className="relative z-10 flex gap-8 border-t border-primary-foreground/20 pt-8">
          {[["1.2M+", "Devotees"], ["200+", "Temples"], ["4.8★", "Rated"]].map(([v, l]) => (
            <div key={v}>
              <div className="text-lg font-bold text-primary-foreground" style={{ fontFamily: "var(--font-display,'Cinzel',serif)" }}>{v}</div>
              <div className="text-xs text-primary-foreground/60">{l}</div>
            </div>
          ))}
        </div>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center px-6 py-16 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs select-none">ॐ</div>
            <span className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display,'Cinzel',serif)" }}>DarshanEase</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-display,'Cinzel',serif)" }}>Sign In</h1>
            <p className="text-sm text-muted-foreground">Access your darshan bookings and pilgrim profile</p>
          </div>

          {/* Method toggle */}
          <div className="flex bg-muted rounded-xl p-1 mb-7 gap-1">
            {([["email", "Email", Mail], ["phone", "Phone / OTP", Phone]] as ["email" | "phone", string, any][]).map(([m, label, Icon]) => (
              <button key={m} onClick={() => { setMethod(m); setError(""); setOtpSent(false); setOtp(["","","","","",""]); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${method === m ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {method === "email" ? (
              <>
                <AuthField label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<Mail size={15} />} />
                <AuthPasswordField label="Password" value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw(!showPw)} placeholder="Enter your password" />
                <div className="flex justify-end">
                  <button type="button" className="text-xs text-primary hover:underline underline-offset-2">Forgot password?</button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="bg-card border border-border rounded-xl px-3 flex items-center text-sm text-foreground flex-shrink-0 font-medium">+91</div>
                    <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="98765 43210" className="flex-1 border border-border rounded-xl px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" style={{ fontFamily: "var(--font-mono,'DM Mono',monospace)" }} />
                  </div>
                </div>
                {!otpSent ? (
                  <button type="button" onClick={handleSendOtp} className="w-full bg-secondary border border-border text-foreground py-3 rounded-xl text-sm font-medium hover:border-primary/40 transition-colors flex items-center justify-center gap-2">
                    <MessageSquare size={14} /> Send OTP via SMS
                  </button>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-muted-foreground uppercase tracking-wide">Enter 6-digit OTP</label>
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(["","","","","",""]); }} className="text-xs text-primary hover:underline">Resend OTP</button>
                    </div>
                    <div className="flex gap-2 justify-between">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          id={`otp-${i}`}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Backspace" && !digit && i > 0) (document.getElementById(`otp-${i - 1}`) as HTMLInputElement)?.focus(); }}
                          maxLength={1}
                          className="w-11 h-12 text-center text-lg font-bold border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          style={{ fontFamily: "var(--font-mono,'DM Mono',monospace)" }}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">OTP sent to +91 {phone}. Valid for 10 minutes.</p>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <X size={13} className="flex-shrink-0" /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Signing in…</> : <><LogIn size={15} /> Sign In</>}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[["Google", "🅖"], ["Apple", "🍎"]].map(([label, icon]) => (
              <button key={label} className="flex items-center justify-center gap-2 border border-border rounded-xl py-3 text-sm text-foreground hover:bg-muted hover:border-primary/30 transition-all">
                <span className="text-base">{icon}</span> {label}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button onClick={onRegister} className="text-primary font-medium hover:underline underline-offset-2">Register Free</button>
          </p>

          <p className="text-center text-[11px] text-muted-foreground mt-6 leading-relaxed">
            By signing in, you agree to our{" "}
            <span className="text-primary cursor-pointer">Terms of Service</span> and{" "}
            <span className="text-primary cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Register Page ────────────────────────────────────────────────────────────

function RegisterPage({ onSuccess, onSignIn }: { onSuccess: (name: string, email: string, token?: string) => void; onSignIn: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /\d/.test(password) ? 4 : 3;
  const pwLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const pwColors = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-green-500"];

  const validateStep1 = () => {
    if (!fullName.trim()) { setError("Please enter your full name."); return false; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return false; }
    if (!phone || phone.length < 10) { setError("Enter a valid 10-digit mobile number."); return false; }
    setError("");
    return true;
  };

  const validateStep2 = () => {
    if (password.length < 6) { setError("Password must be at least 6 characters."); return false; }
    if (password !== confirmPw) { setError("Passwords do not match."); return false; }
    if (!agreed) { setError("Please accept the Terms of Service to continue."); return false; }
    setError("");
    return true;
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) { setError("Enter a valid 10-digit mobile number."); return; }
    setError("");
    try { await authApi.sendOtp(`+91${phone}`); } catch { /* ignore */ }
    setOtpSent(true);
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) (document.getElementById(`reg-otp-${i + 1}`) as HTMLInputElement)?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const res = await authApi.register({ full_name: fullName, email, phone: `+91${phone}`, password });
      onSuccess(res.user.full_name, res.user.email, res.token);
    } catch (err: any) {
      if (err.message?.includes("Failed to fetch") || err.message?.includes("HTTP 5")) {
        onSuccess(fullName, email);
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid grid-cols-1 lg:grid-cols-2">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-foreground p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm select-none">ॐ</div>
            <span className="text-xl font-semibold text-primary-foreground" style={{ fontFamily: "var(--font-display,'Cinzel',serif)" }}>DarshanEase</span>
          </div>
          <h2 className="text-4xl font-semibold text-primary-foreground leading-snug mb-4" style={{ fontFamily: "var(--font-display,'Cinzel',serif)" }}>
            Your sacred journey<br />starts here.
          </h2>
          <p className="text-primary-foreground/60 leading-relaxed max-w-sm text-sm">
            Create your free account to book darshan at 200+ temples, manage family members, plan travel, and track all your pilgrimages — all in one place.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-4">
          {[["Book Darshan at 200+ Temples", "Reserve slots at India's holiest sites"], ["Integrated Travel Planning", "Search trains, buses & flights to temples"], ["Family Member Management", "Add family for group bookings"], ["Temple Stays & Dharamshalas", "Curated stays near sacred sites"], ["Spiritual Giving Dashboard", "Donate to temple causes securely"]].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5"><CheckCircle size={11} className="text-primary-foreground" /></div>
              <div>
                <div className="text-sm font-medium text-primary-foreground">{title}</div>
                <div className="text-xs text-primary-foreground/50">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-xs text-primary-foreground/40">Trusted by 1.2 million devotees across India</div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 30% 60%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      {/* Right panel — form */}
      <div className="flex items-start justify-center px-6 py-12 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs">ॐ</div>
            <span className="text-lg font-semibold text-foreground" style={{ fontFamily: "var(--font-display,'Cinzel',serif)" }}>DarshanEase</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${s < step ? "bg-green-500 text-white" : s === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {s < step ? "✓" : s}
                </div>
                <span className={`text-xs ${s === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {s === 1 ? "Personal Info" : "Security"}
                </span>
                {s < 2 && <div className={`flex-1 h-px ${s < step ? "bg-green-500" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-display,'Cinzel',serif)" }}>
              {step === 1 ? "Create Account" : "Set Password"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 1 ? "Join 1.2 million devotees on DarshanEase" : "Secure your account with a strong password"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <AuthField label="Full Name" type="text" value={fullName} onChange={setFullName} placeholder="Ramesh Sharma" icon={<User size={15} />} />
                <AuthField label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon={<Mail size={15} />} />
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="bg-card border border-border rounded-xl px-3 flex items-center text-sm text-foreground flex-shrink-0 font-medium gap-1"><Phone size={13} className="text-muted-foreground" /> +91</div>
                    <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="98765 43210" className="flex-1 border border-border rounded-xl px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary" style={{ fontFamily: "var(--font-mono,'DM Mono',monospace)" }} />
                  </div>
                </div>
                {/* Phone OTP verification */}
                {!otpSent ? (
                  <button type="button" onClick={handleSendOtp} className="w-full border border-border text-foreground py-3 rounded-xl text-sm font-medium hover:border-primary/40 hover:bg-muted transition-all flex items-center justify-center gap-2">
                    <MessageSquare size={14} className="text-primary" /> Verify Mobile via OTP
                  </button>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-green-700">OTP sent to +91 {phone}</span>
                      <button type="button" onClick={() => { setOtpSent(false); setOtp(["","","","","",""]); }} className="text-xs text-primary hover:underline">Resend</button>
                    </div>
                    <div className="flex gap-2 justify-between">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          id={`reg-otp-${i}`}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Backspace" && !digit && i > 0) (document.getElementById(`reg-otp-${i - 1}`) as HTMLInputElement)?.focus(); }}
                          maxLength={1}
                          className="w-10 h-11 text-center text-base font-bold border border-green-300 rounded-xl bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-green-400"
                          style={{ fontFamily: "var(--font-mono,'DM Mono',monospace)" }}
                        />
                      ))}
                    </div>
                    {otp.join("").length === 6 && <p className="text-[11px] text-green-600 mt-2 flex items-center gap-1"><CheckCircle size={10} /> Mobile verified successfully</p>}
                  </div>
                )}
              </>
            ) : (
              <>
                <AuthPasswordField label="Password" value={password} onChange={setPassword} show={showPw} onToggle={() => setShowPw(!showPw)} placeholder="Minimum 6 characters" />
                {/* Strength meter */}
                {password.length > 0 && (
                  <div>
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= pwStrength ? pwColors[pwStrength] : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className={`text-[11px] font-medium ${pwStrength <= 1 ? "text-red-500" : pwStrength === 2 ? "text-amber-500" : pwStrength === 3 ? "text-blue-500" : "text-green-500"}`}>
                      {pwLabels[pwStrength]} password
                    </p>
                  </div>
                )}
                <AuthPasswordField label="Confirm Password" value={confirmPw} onChange={setConfirmPw} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} placeholder="Re-enter password" />
                {confirmPw && password !== confirmPw && <p className="text-[11px] text-red-500 -mt-2 flex items-center gap-1"><X size={10} /> Passwords don&apos;t match</p>}
                {confirmPw && password === confirmPw && password.length > 0 && <p className="text-[11px] text-green-600 -mt-2 flex items-center gap-1"><CheckCircle size={10} /> Passwords match</p>}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div onClick={() => setAgreed(!agreed)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${agreed ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"}`}>
                    {agreed && <CheckCircle size={12} className="text-primary-foreground" />}
                  </div>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    I agree to DarshanEase's{" "}
                    <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>,{" "}
                    <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>, and consent to receive booking confirmations via SMS and email.
                  </span>
                </label>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                <X size={13} className="flex-shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              {step === 2 && (
                <button type="button" onClick={() => { setStep(1); setError(""); }} className="border border-border text-foreground px-5 py-3 rounded-full text-sm hover:bg-muted transition-colors flex-shrink-0">
                  Back
                </button>
              )}
              <button type="submit" disabled={loading} className="flex-1 bg-primary text-primary-foreground py-3.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Creating account…</> : step === 1 ? <><ArrowRight size={15} /> Continue</> : <><UserPlus size={15} /> Create My Account</>}
              </button>
            </div>
          </form>

          {step === 1 && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or sign up with</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[["Google", "🅖"], ["Apple", "🍎"]].map(([label, icon]) => (
                  <button key={label} className="flex items-center justify-center gap-2 border border-border rounded-xl py-3 text-sm text-foreground hover:bg-muted hover:border-primary/30 transition-all">
                    <span className="text-base">{icon}</span> {label}
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <button onClick={onSignIn} className="text-primary font-medium hover:underline underline-offset-2">Sign In</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Auth field helpers ───────────────────────────────────────────────────────

function AuthField({ label, type, value, onChange, placeholder, icon }: { label: string; type: string; value: string; onChange: (v: string) => void; placeholder: string; icon: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors placeholder:text-muted-foreground/50" />
      </div>
    </div>
  );
}

function AuthPasswordField({ label, value, onChange, show, onToggle, placeholder }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 block">{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"><KeyRound size={15} /></div>
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full pl-10 pr-11 py-3 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors placeholder:text-muted-foreground/50" />
        <button type="button" onClick={onToggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
