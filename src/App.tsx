/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Home, 
  PlusSquare, 
  LayoutList, 
  AlertTriangle, 
  CheckSquare, 
  Moon, 
  Sun, 
  UserCircle, 
  User, 
  Users,
  Camera, 
  Send, 
  Wrench, 
  X, 
  Edit,
  Trash2,
  Save,
  Image as ImageIcon,
  CheckCircle,
  PlusCircle,
  Download,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Search,
  Archive,
  History,
  Filter,
  Calendar,
  FileText,
  ClipboardList,
  ArrowUpDown,
  ExternalLink,
  Instagram,
  Twitter,
  Globe,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Settings,
  Bell,
  Printer,
  ArrowDown,
  ArrowUp,
  TrendingUp,
  Settings2,
  Clock,
  Menu,
  Table2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Asset, Report, User as UserType, UserRole, Vendor, AssetActivity, ProcurementRecord } from './types';
import { auth, db, googleProvider } from './lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  getDoc, 
  query, 
  onSnapshot, 
  updateDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';

const DigitalClock = React.memo(() => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </p>
  );
});

export default function App() {
  // Application State
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const isAdmin = currentUser?.type === 'Manajemen' || currentUser?.type === 'Superadmin';
  const [loading, setLoading] = useState(true);
  // Language and Theme State
  const [lang, setLang] = useState<'id' | 'en'>(() => (localStorage.getItem('lang') as 'id' | 'en') || 'id');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [showPassword, setShowPassword] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void, confirmText?: string) => {
    setConfirmModal({ show: true, title, message, onConfirm, confirmText });
  };

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  // Memoized Translations
  const t = useMemo(() => ({
    id: {
      title: "SEBELAS COFFEE",
      subtitle: "Manajemen Aset & Emergency",
      login: "Masuk Sekarang",
      register: "Daftar Akun Baru",
      back: "Kembali ke Pilihan",
      email: "Email Address",
      password: "Password",
      name: "Nama Lengkap",
      forgot: "Lupa Password?",
      reset: "Reset Password",
      dashboard: "Dashboard",
      inputAset: "Input Aset",
      inventory: "Inventory",
      catMgmt: "Category Management",
      emergency: "Emergency",
      handling: "Handling",
      users: "Management User",
      logout: "Logout",
      addProcurement: "Tambah Procurement",
      procurementList: "Daftar Procurement",
      hello: "Halo",
      checkStatus: "Cek status aset dan toko Anda hari ini.",
      light: "Terang",
      dark: "Gelap",
      toastSuccessAuth: "Berhasil Masuk!",
      toastSuccessReg: "Registrasi Berhasil!",
      toastErrorProfile: "Profil pengguna tidak ditemukan. Silakan hubungi manajemen.",
      toastErrorEmailUsed: "Email sudah terdaftar. Gunakan email lain.",
      toastErrorWeakPass: "Password minimal 6 karakter.",
      toastErrorInvalid: "Email atau password salah.",
      toastResetSent: "Link reset password telah dikirim ke email Anda!",
      toastResetError: "Tuliskan email Anda terlebih dahulu!",
      timeline: "Timeline",
      regAsset: "Registrasi Aset Baru",
      regAssetSub: "Masukkan detail informasi aset ke dalam sistem database.",
      invTitle: "Inventaris Aset",
      invSub: "Kelola dan monitor seluruh aset outlet Anda.",
      emerTitle: "Laporan Emergency",
      emerSub: "Laporkan kendala aset untuk penanganan maintenance segera.",
      handlingTitle: "Handling & Maintenance",
      handlingSub: "Monitor status perbaikan dan aktivitas pemeliharaan.",
      catMgmtTitle: "Category Management",
      catMgmtSub: "Kelola kategori outlet dan penempatan aset.",
      totalAssets: "Total Aset",
      pendingReports: "Laporan Pending",
      resolvedReports: "Terselesaikan",
      usersTitle: "Manajemen Pengguna",
      usersSub: "Kelola akun pengguna dan hak akses sistem.",
      invList: "Daftar Inventaris",
      invListSub: "Manajemen rincian aset terdaftar yang aktif.",
      dbEmpty: "Database aset kosong.",
      noReports: "Tidak ada laporan aktif.",
      handTitle: "Daftar Penanganan Aset",
      handSub: "Daftar laporan emergency yang sedang dalam antrean perbaikan.",
      solvedBtn: "Penanganan Selesai",
      usersSub2: "Daftar seluruh pengguna yang terdaftar dalam sistem.",
      loadingUsers: "Memuat data pengguna...",
      assetName: "Nama Aset",
      assetCode: "Kode Aset",
      outlet: "Outlet",
      condition: "Kondisi",
      save: "SAVE ASSET",
      prev: "Preview",
      detail: "Detail Aset",
      locCond: "Lokasi & Penempatan",
      verifier: "Verifikator",
      procDt: "Tgl Pengadaan",
      outletPlc: "Pilih Outlet",
      placePlc: "Pilih Penempatan",
      assetPlc: "Pilih Aset",
      issuePlc: "Pilih Jenis Kendala",
      descPlc: "Jelaskan secara detail kerusakan yang terjadi...",
      photoPlc: "Klik untuk Upload Foto",
      sendEmg: "Kirim Laporan & Notifikasi WA",
      assetNameLabel: "Nama Alat/Aset",
      assetCodeLabel: "Kode Aset",
      conditionLabel: "Kondisi",
      placementLabel: "Penempatan Aset",
      outletLabel: "Lokasi Outlet",
      procDateLabel: "Tanggal Pengadaan",
      verifierLabel: "Nama Verifikasi Penerima",
      photoLabel: "Foto Aset",
      newAsset: "Baru",
      usedAsset: "Bekas",
      completed: "Selesai",
      noActivity: "Belum ada laporan aktivitas.",
      username: "Nama Pengguna",
      access: "Hak Akses",
      accountStatus: "Status Akun",
      action: "Action",
      proof: "Bukti",
      assetLoc: "Aset & Lokasi",
      issue: "Kendala",
      reporter: "Pelapor",
      addCategory: "Tambah Kategori",
      catNamePlc: "Nama Kategori Baru...",
      catOutletTitle: "Kategori Lokasi Outlet",
      catPlacementTitle: "Kategori Penempatan Aset",
      catDeleteConfirm: "Hapus kategori ini?",
      catEmpty: "Belum ada kategori ditambahkan.",
      logoutConfirm: "Apakah Anda yakin ingin keluar?",
      deleteUserConfirm: "Hapus pengguna ini? Tindakan ini tidak dapat dibatalkan.",
      assetDeleteConfirm: "Hapus aset ini dari inventaris?",
      history: "Riwayat Perbaikan",
      age: "Usia Aset",
      vendorName: "Nama Vendor",
      compName: "Nama Perusahaan",
      wa: "Nomor Whatsapp",
      socmed: "Sosial Media",
      vendorCat: "Kategori Vendor",
      vendorMgmt: "Vendor Management",
      location: "Location",
      service: "Service",
      procurement: "Procurement",
      search: "Cari Aset...",
      sortBy: "Urutkan",
      dateAsc: "Tanggal (Baru-Lama)",
      dateDesc: "Tanggal (Lama-Baru)",
      exportRange: "Pilih Rentang Tanggal",
    },
    en: {
      title: "SEBELAS COFFEE",
      subtitle: "Asset & Emergency Management",
      login: "Login Now",
      register: "Register New Account",
      back: "Back to Selection",
      email: "Email Address",
      password: "Password",
      name: "Full Name",
      forgot: "Forgot Password?",
      reset: "Reset Password",
      dashboard: "Dashboard",
      inputAset: "Input Asset",
      inventory: "Inventory",
      catMgmt: "Category Management",
      emergency: "Emergency",
      handling: "Handling",
      users: "User Management",
      logout: "Logout",
      addProcurement: "Add Procurement",
      procurementList: "List Procurement",
      hello: "Hello",
      checkStatus: "Check your assets today.",
      light: "Light",
      dark: "Dark",
      toastSuccessAuth: "Login Successful!",
      toastSuccessReg: "Registration Successful!",
      toastErrorProfile: "User profile not found. Please contact management.",
      toastErrorEmailUsed: "Email already registered. Use another email.",
      toastErrorWeakPass: "Password minimum 6 characters.",
      toastErrorInvalid: "Invalid email or password.",
      toastResetSent: "Password reset link sent to your email!",
      toastResetError: "Please enter your email first!",
      timeline: "Timeline",
      regAsset: "Register New Asset",
      regAssetSub: "Enter asset details into the system database.",
      invTitle: "Asset Inventory",
      invSub: "Manage and monitor your assets.",
      emerTitle: "Emergency Report",
      emerSub: "Report asset issues for immediate maintenance handling.",
      handlingTitle: "Handling & Maintenance",
      handlingSub: "Monitor repair status and maintenance activities.",
      catMgmtTitle: "Category Management",
      catMgmtSub: "Manage categories for outlets and asset placements.",
      totalAssets: "Total Assets",
      pendingReports: "Pending Reports",
      resolvedReports: "Resolved",
      usersTitle: "User Management",
      usersSub: "Manage user accounts and system access levels.",
      invList: "Inventory List",
      invListSub: "Management of entries for active registered assets.",
      dbEmpty: "Asset database is empty.",
      noReports: "No active reports.",
      handTitle: "Asset Handling List",
      handSub: "List of emergency reports currently in repair queue.",
      solvedBtn: "Handling Complete",
      usersSub2: "List of all users registered in the system.",
      loadingUsers: "Loading users data...",
      assetName: "Asset Name",
      assetCode: "Asset Code",
      outlet: "Outlet",
      condition: "Condition",
      save: "SAVE ASSET",
      prev: "Preview",
      detail: "Asset Detail",
      locCond: "Location & Placement",
      verifier: "Verifier",
      procDt: "Procurement Date",
      outletPlc: "Select Outlet",
      placePlc: "Select Placement",
      assetPlc: "Select Asset",
      issuePlc: "Select Issue Type",
      descPlc: "Describe the damage in detail...",
      photoPlc: "Click to Upload Photo",
      sendEmg: "Send Report & WA Notification",
      assetNameLabel: "Asset Model/Name",
      assetCodeLabel: "Asset Code",
      conditionLabel: "Condition",
      placementLabel: "Asset Placement",
      outletLabel: "Outlet Location",
      procDateLabel: "Procurement Date",
      verifierLabel: "Receiver Verification Name",
      photoLabel: "Asset Photo",
      newAsset: "New",
      usedAsset: "Used",
      completed: "Completed",
      noActivity: "No activity reports yet.",
      username: "Username",
      access: "Access Level",
      accountStatus: "Account Status",
      action: "Action",
      proof: "Proof",
      assetLoc: "Asset & Location",
      issue: "Issue",
      reporter: "Reporter",
      addCategory: "Add Category",
      catNamePlc: "New category name...",
      catOutletTitle: "Outlet Location Categories",
      catPlacementTitle: "Asset Placement Categories",
      catDeleteConfirm: "Delete this category?",
      catEmpty: "No categories added yet.",
      logoutConfirm: "Are you sure you want to log out?",
      deleteUserConfirm: "Delete this user? This action cannot be undone.",
      assetDeleteConfirm: "Delete this asset from inventory?",
      history: "Repair History",
      age: "Asset Age",
      vendorName: "Vendor Name",
      compName: "Company Name",
      wa: "WhatsApp Number",
      socmed: "Social Media",
      vendorCat: "Vendor Category",
      vendorMgmt: "Vendor Management",
      location: "Location",
      service: "Service",
      procurement: "Procurement",
      search: "Search Assets...",
      sortBy: "Sort By",
      dateAsc: "Date (New-Old)",
      dateDesc: "Date (Old-New)",
      exportRange: "Select Date Range",
    }
  }[lang]), [lang]);

  const [activeTab, setActiveTab] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [inventory, setInventory] = useState<Asset[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);
  const [categoryOutlets, setCategoryOutlets] = useState<{id: string, name: string}[]>([]);
  const [categoryPlacements, setCategoryPlacements] = useState<{id: string, name: string}[]>([]);
  const [categoryVendors, setCategoryVendors] = useState<{id: string, name: string}[]>([]);
  const [categoryOwnerships, setCategoryOwnerships] = useState<{id: string, name: string}[]>([]);
  const [categoryPriorities, setCategoryPriorities] = useState<{id: string, name: string}[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [assetActivities, setAssetActivities] = useState<AssetActivity[]>([]);
  const [procurements, setProcurements] = useState<ProcurementRecord[]>([]);
  const [activeCatSub, setActiveCatSub] = useState<'Service' | 'Procurement'>('Service');
  const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [assetHistoryId, setAssetHistoryId] = useState<string | null>(null);
  
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [dashResolvedRange, setDashResolvedRange] = useState({ start: '', end: '' });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'pdf' | 'csv'>('pdf');

  // Form States
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', role: 'Store Manager' as UserRole });
  const [assetForm, setAssetForm] = useState<Partial<Asset>>({ condition: 'Baru', unit: 'Pcs', quantity: 1, price: undefined });
  const [emergencyForm, setEmergencyForm] = useState<Partial<Report>>({ category: '', priority: '' });
  const [solvingReportId, setSolvingReportId] = useState<string | number | null>(null);
  const [solveForm, setSolveForm] = useState({ verifier: '', desc: '', photo: '' });
  const [procurementForm, setProcurementForm] = useState<Partial<ProcurementRecord>>({ quantity: undefined, pricePerUnit: undefined, totalPrice: 0, photo: '' });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<UserType>>({});
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editAssetForm, setEditAssetForm] = useState<Partial<Asset>>({});

  // Memoized Vendor Categories for dropdowns
  const vendorCategories = useMemo(() => {
    const unique = new Map();
    categoryVendors.forEach(c => {
      if (!unique.has(c.name)) {
        unique.set(c.name, c);
      }
    });
    return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [categoryVendors]);

  // Refs for Image Processing
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const isAdminEmail = user.email?.toLowerCase() === 'fahrizpalderama.design@gmail.com';
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserType;
            if (isAdminEmail && userData.type !== 'Superadmin') {
              const updatedData = { ...userData, type: 'Superadmin' as UserRole };
              await setDoc(doc(db, 'users', user.uid), updatedData);
              setCurrentUser(updatedData);
            } else {
              setCurrentUser(userData);
            }
          } else {
            // If profile missing (could be Google login or incomplete Email registration)
            // We check if provider is google to auto-create, otherwise we wait for handleAuth
            const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
            if (isGoogle || isAdminEmail) {
              const newUser: UserType = {
                uid: user.uid,
                name: user.displayName || 'Super Manajemen',
                email: user.email || '',
                type: isAdminEmail ? 'Superadmin' : 'Store Manager'
              };
              await setDoc(doc(db, 'users', user.uid), newUser);
              setCurrentUser(newUser);
            } else {
              setCurrentUser(null);
            }
          }
        } catch (error) {
          console.error("Auth Listener Profile Error:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Performance Optimized Data ---
  const dashboardStats = useMemo(() => {
    // 1. Assets by Outlet Category and Total Price
    const outletData = categoryOutlets.map(cat => {
      const outletAssets = inventory.filter(a => a.outlet === cat.name);
      const count = outletAssets.length;
      const totalPrice = outletAssets.reduce((sum, asset) => sum + (Number(asset.price) || 0), 0);
      return { name: cat.name, count, totalPrice };
    }).filter(d => d.count > 0);

    // 2. Damage vs Penanganan pie data (Today, 7, 15, 30 days)
    const getReportStats = (days: number) => {
      const now = new Date();
      let cutoff: Date;
      if (days === 0) {
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else {
        cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }
      const filteredReports = reports.filter(r => new Date(r.timestamp) >= cutoff);
      const damageCount = filteredReports.length;
      const resolvedCount = filteredReports.filter(r => r.status === 'resolved').length;
      
      return [
        { name: lang === 'id' ? 'Kerusakan' : 'Damaged', value: damageCount },
        { name: lang === 'id' ? 'Perbaikan' : 'Resolved', value: resolvedCount }
      ];
    };

    // 3. Most frequently reported assets
    const reportCounts: Record<string, {name: string, count: number}> = {};
    reports.forEach(r => {
      const asset = inventory.find(i => i.code === r.code);
      const name = asset ? asset.name : r.name;
      const key = r.code || r.name;
      if (!reportCounts[key]) {
        reportCounts[key] = { name: name, count: 0 };
      }
      reportCounts[key].count++;
    });
    const mostReported = Object.values(reportCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      outletData,
      reportStats0: getReportStats(0),
      reportStats7: getReportStats(7),
      reportStats15: getReportStats(15),
      reportStats30: getReportStats(30),
      mostReported
    };
  }, [inventory, reports, categoryOutlets, lang]);

  const stats = useMemo(() => {
    const resolved = reports.filter(r => r.status === 'resolved');
    const pending = reports.filter(r => r.status === 'pending');
    
    const assetStatsByOutlet = inventory.reduce((acc: Record<string, number>, item) => {
      const outlet = item.outlet || 'Other';
      acc[outlet] = (acc[outlet] || 0) + 1;
      return acc;
    }, {});

    const sortedOutletStats = Object.entries(assetStatsByOutlet)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5);

    const completionRate = reports.length > 0 ? Math.round((resolved.length / reports.length) * 100) : 0;

    return {
      resolved,
      pending,
      totalAssets: inventory.length,
      sortedOutletStats,
      completionRate
    };
  }, [reports, inventory]);

  const chartData = useMemo(() => [
    { name: 'Mon', tasks: 12, spend: 120 },
    { name: 'Tue', tasks: 18, spend: 200 },
    { name: 'Wed', tasks: 15, spend: 150 },
    { name: 'Thu', tasks: 25, spend: 300 },
    { name: 'Fri', tasks: 20, spend: 220 },
    { name: 'Sat', tasks: 30, spend: 400 },
    { name: 'Sun', tasks: 28, spend: 350 },
  ], []);

  // Firestore Listeners
  useEffect(() => {
    if (!currentUser) {
      setInventory([]);
      setReports([]);
      return;
    }

    const qAssets = query(collection(db, 'assets'));
    const unsubscribeAssets = onSnapshot(qAssets, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Asset));
      setInventory(items);
    }, (error) => {
      console.error("Assets Listener Error:", error);
    });

    const qReports = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Report));
      setReports(items);
    }, (error) => {
      console.error("Reports Listener Error:", error);
    });

    let unsubscribeUsers = () => {};
    if (isAdmin) {
      const qUsers = query(collection(db, 'users'));
      unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserType));
        setAllUsers(items);
      }, (error) => {
        console.error("Users Listener Error:", error);
      });
    }

    const qCatOutlets = query(collection(db, 'category_outlets'), orderBy('name'));
    const unsubscribeCatOutlets = onSnapshot(qCatOutlets, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setCategoryOutlets(items);
    }, (error) => {
      console.error("CatOutlets Listener Error:", error);
    });

    const qCatPlacements = query(collection(db, 'category_placements'), orderBy('name'));
    const unsubscribeCatPlacements = onSnapshot(qCatPlacements, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setCategoryPlacements(items);
    }, (error) => {
      console.error("CatPlacements Listener Error:", error);
    });

    const qCatVendors = query(collection(db, 'category_vendors'), orderBy('name'));
    const unsubscribeCatVendors = onSnapshot(qCatVendors, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setCategoryVendors(items);
    }, (error) => {
      console.error("CatVendors Listener Error:", error);
    });

    const qCatOwnerships = query(collection(db, 'category_ownerships'), orderBy('name'));
    const unsubscribeCatOwnerships = onSnapshot(qCatOwnerships, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setCategoryOwnerships(items);
    }, (error) => {
      console.error("CatOwnerships Listener Error:", error);
    });

    const qCatPriorities = query(collection(db, 'category_priorities'), orderBy('name'));
    const unsubscribeCatPriorities = onSnapshot(qCatPriorities, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setCategoryPriorities(items);
    }, (error) => {
      console.error("CatPriorities Listener Error:", error);
    });

    const qVendorsService = query(collection(db, 'vendors_service'));
    const unsubscribeVendorsService = onSnapshot(qVendorsService, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Vendor));
      setVendors(prev => [...prev.filter(v => v.type !== 'Service'), ...items]);
    }, (error) => {
      console.error("VendorsService Listener Error:", error);
    });

    const qVendorsProcurement = query(collection(db, 'vendors_procurement'));
    const unsubscribeVendorsProcurement = onSnapshot(qVendorsProcurement, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Vendor));
      setVendors(prev => [...prev.filter(v => v.type !== 'Procurement'), ...items]);
    }, (error) => {
      console.error("VendorsProcurement Listener Error:", error);
    });

    const unsubscribeActivities = onSnapshot(query(collection(db, 'asset_activities'), orderBy('timestamp', 'desc')), (snapshot) => {
      setAssetActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssetActivity)));
    }, (error) => {
      console.error("Activities Listener Error:", error);
    });

    const unsubscribeProcurements = onSnapshot(query(collection(db, 'procurements'), orderBy('timestamp', 'desc')), (snapshot) => {
      setProcurements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProcurementRecord)));
    }, (error) => {
      console.error("Procurements Listener Error:", error);
    });

    return () => {
      unsubscribeAssets();
      unsubscribeReports();
      unsubscribeUsers();
      unsubscribeCatOutlets();
      unsubscribeCatPlacements();
      unsubscribeCatVendors();
      unsubscribeCatOwnerships();
      unsubscribeCatPriorities();
      unsubscribeVendorsService();
      unsubscribeVendorsProcurement();
      unsubscribeActivities();
      unsubscribeProcurements();
    };
  }, [currentUser]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Inactivity Timeout (15 minutes)
  useEffect(() => {
    if (!currentUser) return;

    let timeoutId: any;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
        showToast(lang === 'id' ? "Sesi berakhir karena tidak ada aktivitas selama 15 menit." : "Session expired due to 15 minutes of inactivity.", true);
      }, 15 * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [currentUser, lang]);

  // Toast Helper
  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };

  // Auth Handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'login') {
        const cred = await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as UserType);
          showToast(t.toastSuccessAuth);
        } else {
          throw new Error(t.toastErrorProfile);
        }
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        const newUser: UserType = {
          uid: user.uid,
          name: authForm.name,
          email: authForm.email,
          type: 'Store Manager'
        };
        await setDoc(doc(db, 'users', user.uid), newUser);
        setCurrentUser(newUser);
        showToast(t.toastSuccessReg);
      }
      setAuthMode(null);
      setAuthForm({ email: '', password: '', name: '', role: 'Store Manager' });
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/email-already-in-use') msg = t.toastErrorEmailUsed;
      if (err.code === 'auth/weak-password') msg = t.toastErrorWeakPass;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = t.toastErrorInvalid;
      showToast(msg, true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast("G-Login Berhasil!");
      setAuthMode(null);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleResetPassword = async (email?: string) => {
    const targetEmail = email || authForm.email;
    if (!targetEmail) {
      showToast(t.toastResetError, true);
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      showToast(t.toastResetSent);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleLogout = async () => {
    openConfirm(t.logout, t.logoutConfirm, async () => {
      await signOut(auth);
      setCurrentUser(null);
      setActiveTab('home');
      setAuthMode(null);
    }, lang === 'id' ? 'Keluar' : 'Logout');
  };

  const logActivity = async (assetCode: string, type: "Created" | "Emergency" | "Resolved" | "Edited", description: string, reportId?: string, photo?: string) => {
    try {
      await addDoc(collection(db, 'asset_activities'), {
        assetCode,
        type,
        description,
        user: currentUser?.name || 'Unknown',
        timestamp: new Date().toISOString(),
        reportId: reportId || null,
        photo: photo || null
      });
    } catch (err) {
      console.error("Activity Logging Error:", err);
    }
  };

  const handleUpdateUserRole = async (uid: string) => {
    try {
      if (!editUserForm.type || !editUserForm.name || !editUserForm.email) {
        showToast("Semua data harus diisi!", true);
        return;
      }
      await updateDoc(doc(db, 'users', uid), { 
        type: editUserForm.type,
        name: editUserForm.name,
        email: editUserForm.email
      });
      showToast("Data pengguna diperbarui!");
      setEditingUserId(null);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (uid === currentUser?.uid) {
      showToast("Anda tidak bisa menghapus akun sendiri!", true);
      return;
    }
    openConfirm(t.usersTitle, t.deleteUserConfirm, async () => {
      try {
        await deleteDoc(doc(db, 'users', uid));
        showToast("Pengguna berhasil dihapus!");
      } catch (err: any) {
        showToast(err.message, true);
      }
    }, lang === 'id' ? 'Hapus' : 'Delete');
  };

  const handleAddCategory = async (type: 'outlet' | 'placement' | 'vendor' | 'ownership' | 'priority', name: string) => {
    if (!name.trim()) return;
    if (!isAdmin) {
      showToast("Hanya Manajemen yang bisa menambah kategori!", true);
      return;
    }
    try {
      const collectionName = type === 'outlet' ? 'category_outlets' : 
                             type === 'placement' ? 'category_placements' : 
                             type === 'vendor' ? 'category_vendors' :
                             type === 'ownership' ? 'category_ownerships' : 'category_priorities';
      await addDoc(collection(db, collectionName), { name });
      showToast("Kategori berhasil ditambahkan!");
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleDeleteCategory = async (type: 'outlet' | 'placement' | 'vendor' | 'ownership' | 'priority', id: string) => {
    if (!isAdmin) {
      showToast("Hanya Manajemen yang bisa menghapus kategori!", true);
      return;
    }
    openConfirm(t.catMgmt, t.catDeleteConfirm, async () => {
      try {
        const collectionName = type === 'outlet' ? 'category_outlets' : 
                               type === 'placement' ? 'category_placements' : 
                               type === 'vendor' ? 'category_vendors' :
                               type === 'ownership' ? 'category_ownerships' : 'category_priorities';
        await deleteDoc(doc(db, collectionName, id));
        showToast("Kategori berhasil dihapus!");
      } catch (err: any) {
        showToast(err.message, true);
      }
    }, lang === 'id' ? 'Hapus' : 'Delete');
  };

  const handleDeleteAsset = async (id: string | number) => {
    if (!isAdmin) {
      showToast("Hanya Manajemen yang bisa menghapus aset!", true);
      return;
    }
    openConfirm(t.inventory, t.assetDeleteConfirm, async () => {
      try {
        // Find asset to get its code for cascading delete
        const asset = inventory.find(i => i.id === id);
        const assetCode = asset?.code;

        // 1. Delete the asset itself
        await deleteDoc(doc(db, 'assets', id as string));

        // 2. Cascading delete for associated reports if assetCode exists
        if (assetCode) {
          const associatedReports = reports.filter(r => r.code === assetCode);
          if (associatedReports.length > 0) {
            const deletePromises = associatedReports.map(r => deleteDoc(doc(db, 'reports', r.id!.toString())));
            await Promise.all(deletePromises);
            console.log(`Deleted ${associatedReports.length} associated reports for asset ${assetCode}`);
          }
        }

        showToast(lang === 'id' ? "Aset dan laporan terkait berhasil dihapus!" : "Asset and associated reports successfully deleted!");
      } catch (err: any) {
        showToast(err.message, true);
      }
    }, lang === 'id' ? 'Hapus' : 'Delete');
  };

  const handleDeleteAllReports = async () => {
    if (!isAdmin) return;
    openConfirm(t.handTitle, lang === 'id' ? "Hapus semua laporan di menu penanganan?" : "Delete all reports in handling menu?", async () => {
      try {
        const pendingReports = reports.filter(r => r.status === 'pending');
        if (pendingReports.length === 0) {
          showToast(lang === 'id' ? "Tidak ada laporan untuk dihapus" : "No reports to delete");
          return;
        }

        const deletePromises = pendingReports.map(r => deleteDoc(doc(db, 'reports', r.id!)));
        await Promise.all(deletePromises);
        showToast(lang === 'id' ? "Semua laporan berhasil dihapus!" : "All reports successfully deleted!");
      } catch (err: any) {
        showToast(err.message, true);
      }
    }, lang === 'id' ? 'Hapus Semua' : 'Delete All');
  };

  // Image Helper
  const handlePhotoUpload = React.useCallback((event: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        // More flexible compression: limit max dimension but maintain aspect ratio
        const MAX_DIM = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        setter(canvas.toDataURL('image/jpeg', 0.7)); // Optimized compression
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  // PDF Export
  // Sort and Filter Inventory
  const filteredInventory = useMemo(() => inventory.filter(item => {
    const query = searchQuery.toLowerCase();
    const val = (item[searchField as keyof Asset] || '').toString().toLowerCase();
    return val.includes(query);
  }).sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  }), [inventory, searchQuery, searchField, sortOrder]);

  const calculateAge = (dateStr: string) => {
    if (!dateStr) return "-";
    const start = new Date(dateStr);
    const now = new Date();
    let diff = now.getTime() - start.getTime();
    
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    diff -= years * (1000 * 60 * 60 * 24 * 365);
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
    diff -= months * (1000 * 60 * 60 * 24 * 30);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (years > 0) return `${years}${lang === 'id' ? 'th' : 'y'} ${months}${lang === 'id' ? 'bln' : 'm'}`;
    if (months > 0) return `${months}${lang === 'id' ? 'bln' : 'm'} ${days}${lang === 'id' ? 'hr' : 'd'}`;
    return `${days}${lang === 'id' ? 'hr' : 'd'}`;
  };

  const exportPDF = () => {
    const docPdf = new jsPDF('l', 'mm', 'a4') as any; // Landscape for more columns
    docPdf.text(lang === 'id' ? "Laporan Riwayat Aset Detail" : "Detailed Asset History Report", 14, 15);

    // 1. Identify activities in range
    let filteredActivities = assetActivities;
    if (dateRange.start && dateRange.end) {
      filteredActivities = assetActivities.filter(activity => {
        const activityDate = activity.timestamp.split('T')[0];
        return activityDate >= dateRange.start && activityDate <= dateRange.end;
      });
    }

    if (filteredActivities.length === 0) {
      showToast(lang === 'id' ? "Tidak ada history aktivitas dalam rentang tanggal tersebut" : "No activity history in that date range", true);
      return;
    }

    // 2. Identify assets that had activities
    const relevantAssetCodes = Array.from(new Set(filteredActivities.map(a => a.assetCode)));
    const assetsToExport = inventory.filter(item => relevantAssetCodes.includes(item.code));

    // 3. Map to table rows
    const tableData = assetsToExport.map((item, index) => {
      const itemActivities = filteredActivities
        .filter(a => a.assetCode === item.code)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const historyStr = itemActivities.map(a => {
        const dateStr = new Date(a.timestamp).toLocaleDateString('id-ID');
        return `[${dateStr}] ${a.type}: ${a.description}`;
      }).join('\n');

      return [
        index + 1,
        item.name,
        item.code,
        item.outlet,
        item.placement,
        item.date,
        calculateAge(item.date),
        item.condition,
        historyStr
      ];
    });

    autoTable(docPdf, {
      head: [[
        'No',
        lang === 'id' ? 'Nama Aset' : 'Asset Name',
        lang === 'id' ? 'Kode Aset' : 'Asset Code',
        'Outlet',
        lang === 'id' ? 'Penempatan' : 'Placement',
        lang === 'id' ? 'Tgl Pengadaan' : 'Procurement Date',
        lang === 'id' ? 'Usia Aset' : 'Asset Age',
        lang === 'id' ? 'Kondisi' : 'Condition',
        lang === 'id' ? 'Semua Riwayat Aset' : 'All Asset History'
      ]],
      body: tableData,
      startY: 20,
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: {
        8: { cellWidth: 80 } // Wider column for history
      },
      headStyles: { fillColor: [100, 80, 60] }
    });

    docPdf.save(`Laporan_Aset_Detail_${dateRange.start || 'All'}_to_${dateRange.end || 'All'}.pdf`);
    showToast("PDF Berhasil Diunduh!");
    setShowExportModal(false);
  };

  // Data Handlers
  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetForm.photo) return showToast("Foto diperlukan!", true);
    
    try {
      const newAsset: Omit<Asset, 'id'> = {
        name: assetForm.name || '',
        code: assetForm.code || '',
        condition: (assetForm.condition as any) || 'Baru',
        placement: assetForm.placement || '',
        outlet: assetForm.outlet || '',
        date: assetForm.date || '',
        verifier: assetForm.verifier || '',
        photo: assetForm.photo || '',
        description: assetForm.description || '',
        price: Number(assetForm.price) || 0,
        category: assetForm.category || '',
        unit: assetForm.unit || 'Pcs',
        quantity: Number(assetForm.quantity) || 1,
        ownership: assetForm.ownership || '',
        priority: assetForm.priority || ''
      };

      await addDoc(collection(db, 'assets'), newAsset);
      
      // Log Activity
      await logActivity(newAsset.code, "Created", "Aset baru ditambahkan ke sistem", undefined, newAsset.photo);

      setAssetForm({ condition: 'Baru', unit: 'Pcs', quantity: 1, price: undefined });
      showToast("Aset Berhasil Disimpan!");
      setActiveTab('inventory');
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleEditAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssetId || !currentUser) return;

    try {
      const original = inventory.find(i => i.id === editingAssetId);
      if (!original) return;

      const updatedAsset: any = {
        name: String(editAssetForm.name || '').trim(),
        code: String(editAssetForm.code || '').trim(),
        condition: (editAssetForm.condition as any) || 'Baru',
        placement: editAssetForm.placement || '',
        outlet: editAssetForm.outlet || '',
        date: editAssetForm.date || new Date().toISOString().split('T')[0],
        verifier: editAssetForm.verifier || '',
        description: editAssetForm.description || '',
        price: isNaN(Number(editAssetForm.price)) ? 0 : Number(editAssetForm.price),
        category: editAssetForm.category || '',
        unit: editAssetForm.unit || '',
        quantity: isNaN(Number(editAssetForm.quantity)) ? 1 : Number(editAssetForm.quantity),
        ownership: editAssetForm.ownership || '',
        priority: editAssetForm.priority || '',
        status: (editAssetForm.status as any) || 'Normal'
      };

      if (!updatedAsset.name || !updatedAsset.code) {
        showToast("Nama dan Kode Aset wajib diisi!", true);
        return;
      }

      await updateDoc(doc(db, 'assets', editingAssetId), updatedAsset);

      // Detect changes for logging
      const changes: string[] = [];
      if (original.name !== updatedAsset.name) changes.push(`Nama: ${original.name} -> ${updatedAsset.name}`);
      if (original.code !== updatedAsset.code) changes.push(`Kode: ${original.code} -> ${updatedAsset.code}`);
      if (original.condition !== updatedAsset.condition) changes.push(`Kondisi: ${original.condition} -> ${updatedAsset.condition}`);
      if (original.placement !== updatedAsset.placement) changes.push(`Penempatan: ${original.placement} -> ${updatedAsset.placement}`);
      if (original.outlet !== updatedAsset.outlet) changes.push(`Outlet: ${original.outlet} -> ${updatedAsset.outlet}`);
      if (original.category !== updatedAsset.category) changes.push(`Kategori: ${original.category} -> ${updatedAsset.category}`);
      if (original.ownership !== updatedAsset.ownership) changes.push(`Kepemilikan: ${original.ownership} -> ${updatedAsset.ownership}`);
      if (original.date !== updatedAsset.date) changes.push(`Tgl Procurement: ${original.date} -> ${updatedAsset.date}`);
      if (original.verifier !== updatedAsset.verifier) changes.push(`Penerima: ${original.verifier} -> ${updatedAsset.verifier}`);
      if (original.status !== updatedAsset.status) changes.push(`Status: ${original.status} -> ${updatedAsset.status}`);

      const changeDesc = changes.length > 0 ? `Perubahan: ${changes.join(', ')}` : "Update informasi aset";
      await logActivity(original.code, "Edited", changeDesc, undefined, updatedAsset.photo);

      showToast("Aset Berhasil Diupdate!");
      setEditingAssetId(null);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleEmergencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyForm.photo) return showToast("Foto bukti diperlukan!", true);
    if (!emergencyForm.category) return showToast("Kategori diperlukan!", true);
    if (!currentUser) return showToast("Silakan login!", true);

    try {
      const asset = inventory.find(i => i.code === emergencyForm.code);
      const report: Omit<Report, 'id'> = {
        outlet: emergencyForm.outlet || '',
        placement: emergencyForm.placement || '',
        name: emergencyForm.name || '',
        code: emergencyForm.code || '',
        issue: emergencyForm.issue || '',
        desc: emergencyForm.desc || '',
        photo: emergencyForm.photo || '',
        reporter: currentUser.name,
        timestamp: new Date().toISOString(),
        category: emergencyForm.category || '',
        priority: emergencyForm.priority || 'Penting',
        status: 'pending'
      };

      const docRef = await addDoc(collection(db, 'reports'), report);
      
      // Log Activity
      await logActivity(report.code, "Emergency", `Laporan kerusakan: ${report.issue}`, docRef.id, report.photo);
      
      // Update Asset Status
      if (asset?.id) {
        await updateDoc(doc(db, 'assets', asset.id.toString()), { status: 'Emergency' });
      }

      const msg = `LAPORAN URGENSI PERBAIKAN\n` +
                  `- Outlet : ${report.outlet}\n` +
                  `- Penempatan : ${report.placement}\n` +
                  `- Nama Aset : ${report.name}\n` +
                  `- Kondisi : ${report.issue}\n` +
                  `- Deskripsi : ${report.desc}\n\n` +
                  `Mohon segera dilakukan pengecekan dan penanganan. Cek informasi detail dan lakukan konfirmasi pada aplikasi Management Asset. Terimakasih`;
      
      try {
        await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: '120363426675868229@g.us',
            message: msg
          })
        });
      } catch (waErr) {
        console.error("Failed to send automatic WhatsApp:", waErr);
      }
      
      setEmergencyForm({});
      showToast("Laporan Terkirim!");
      setActiveTab('handling');
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleSolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solvingReportId) return;
    if (!solveForm.photo) return showToast("Foto bukti selesai diperlukan!", true);

    const item = reports.find(r => r.id === solvingReportId);
    if (!item) return;

    try {
      const solveData = {
        status: 'resolved' as const,
        solverInfo: {
          verifier: solveForm.verifier,
          desc: solveForm.desc,
          photo: solveForm.photo,
          resolvedAt: new Date().toISOString()
        }
      };

      await updateDoc(doc(db, 'reports', solvingReportId.toString()), solveData);
      
      // Log Activity
      await logActivity(item.code, "Resolved", "Perbaikan selesai", solvingReportId.toString(), solveForm.photo);

      // Reset Asset Status back to Normal
      const asset = inventory.find(i => i.code === item.code);
      if (asset?.id) {
        await updateDoc(doc(db, 'assets', asset.id.toString()), { status: 'Normal' });
      }

      const msg = `LAPORAN PENANGANAN PERBAIKAN ASET\n\n` +
                  `- Nama Aset : ${item.name}\n` +
                  `- Outlet : ${item.outlet}\n` +
                  `- Penempatan : ${item.placement}\n` +
                  `- Deskripsi Perbaikan : ${solveForm.desc}\n` +
                  `- Verifikator : ${solveForm.verifier}\n` +
                  `- Waktu Penanganan : ${new Date().toLocaleString('id-ID')}\n\n` +
                  `Mohon Store melakukan pengetesan dan pengecekan ulang pada asset yang telah diperbaiki. Terimakasih`;
      
      try {
        await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: '120363426675868229@g.us',
            message: msg
          })
        });
      } catch (waErr) {
        console.error("Failed to send automatic WhatsApp:", waErr);
      }

      setSolvingReportId(null);
      setSolveForm({ verifier: '', desc: '', photo: '' });
      showToast("Penanganan Selesai!");
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return showToast("Hanya Manajemen!", true);
    
    // Safety check for category
    const vendorType = activeCatSub === 'Service' || activeCatSub === 'Procurement' ? activeCatSub : 'Service';
    
    try {
      const collectionName = vendorType === 'Service' ? 'vendors_service' : 'vendors_procurement';
      const vendorData = {
        name: String(vendorForm.name || '').trim(),
        companyName: String(vendorForm.companyName || '').trim(),
        whatsapp: String(vendorForm.whatsapp || '').trim(),
        socialMedia: String(vendorForm.socialMedia || '').trim(),
        category: String(vendorForm.category || '').trim(),
        description: String(vendorForm.description || '').trim(),
        type: vendorType
      };

      if (editingVendorId) {
        await updateDoc(doc(db, collectionName, editingVendorId), vendorData);
        showToast("Vendor Berhasil Diupdate!");
      } else {
        await addDoc(collection(db, collectionName), vendorData);
        showToast("Vendor Berhasil Ditambahkan!");
      }
      
      setVendorForm({});
      setEditingVendorId(null);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!isAdmin) return showToast("Hanya Manajemen!", true);
    openConfirm("Hapus Vendor", "Yakin hapus data vendor ini?", async () => {
      try {
        const collectionName = activeCatSub === 'Service' ? 'vendors_service' : 'vendors_procurement';
        await deleteDoc(doc(db, collectionName, id));
        showToast("Vendor Berhasil Dihapus!");
      } catch (err: any) {
        showToast(err.message, true);
      }
    }, lang === 'id' ? 'Hapus' : 'Delete');
  };

  const handleProcurementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return showToast("Silakan login!", true);
    if (!procurementForm.photo) return showToast("Foto diperlukan!", true);

    try {
      const newProcurement: Omit<ProcurementRecord, 'id'> = {
        itemName: procurementForm.itemName || '',
        quantity: Number(procurementForm.quantity) || 0,
        unit: procurementForm.unit || '',
        description: procurementForm.description || '',
        category: procurementForm.category || '',
        pricePerUnit: Number(procurementForm.pricePerUnit) || 0,
        outlet: procurementForm.outlet || '',
        procurementVia: procurementForm.procurementVia || '',
        totalPrice: (Number(procurementForm.quantity) || 0) * (Number(procurementForm.pricePerUnit) || 0),
        timestamp: new Date().toISOString(),
        createdBy: currentUser.name,
        photo: procurementForm.photo || ''
      };

      await addDoc(collection(db, 'procurements'), newProcurement);
      setProcurementForm({ quantity: 1, pricePerUnit: 0, totalPrice: 0, photo: '' });
      showToast("Data Pengadaan Berhasil Disimpan!");
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleExportSpreadsheet = async () => {
    // 1. Identify activities in range
    let filteredActivities = assetActivities;
    if (dateRange.start && dateRange.end) {
      filteredActivities = assetActivities.filter(activity => {
        const activityDate = activity.timestamp.split('T')[0];
        return activityDate >= dateRange.start && activityDate <= dateRange.end;
      });
    }

    if (filteredActivities.length === 0) return showToast(lang === 'id' ? "Tidak ada riwayat aktivitas untuk diekspor" : "No activity history to export", true);

    // 2. Identify assets that had activities
    const relevantAssetCodes = Array.from(new Set(filteredActivities.map(a => a.assetCode)));
    const assetsToExport = inventory.filter(item => relevantAssetCodes.includes(item.code));

    const headers = [
      "No",
      lang === 'id' ? "Nama Aset" : "Asset Name",
      lang === 'id' ? "Kode Aset" : "Asset Code",
      "Outlet",
      lang === 'id' ? "Penempatan" : "Placement",
      lang === 'id' ? "Tanggal Pengadaan" : "Procurement Date",
      lang === 'id' ? "Usia Aset" : "Asset Age",
      lang === 'id' ? "Kondisi Aset" : "Asset Condition",
      lang === 'id' ? "Semua Riwayat Aset" : "All Asset History"
    ];

    const rows = assetsToExport.map((item, index) => {
      const itemActivities = filteredActivities
        .filter(a => a.assetCode === item.code)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const historyStr = itemActivities.map(a => {
        const dateStr = new Date(a.timestamp).toLocaleDateString('id-ID');
        return `[${dateStr}] ${a.type}: ${a.description}`;
      }).join(' | '); // Use pipe for CSV readability

      return [
        index + 1,
        `"${item.name}"`,
        `"${item.code}"`,
        `"${item.outlet}"`,
        `"${item.placement}"`,
        `"${item.date}"`,
        `"${calculateAge(item.date)}"`,
        `"${item.condition}"`,
        `"${historyStr}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = `Export_Inventory_${dateRange.start || 'All'}_to_${dateRange.end || 'All'}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
    showToast("Berhasil ekspor Spreadsheet!");
  };

  // Nav Helpers
  const isLocked = (tab: string) => {
    if (!currentUser) return true;
    if (currentUser.type === 'Superadmin') return false;
    
    // Manajemen Restrictions
    if (currentUser.type === 'Manajemen') {
      if (tab === 'users') return true;
      return false;
    }
    
    // Store Manager Restrictions
    if (currentUser.type === 'Store Manager') {
      const allowed = ['home', 'inventory', 'emergency', 'handling'];
      if (!allowed.includes(tab)) return true;
    }

    // Teknis Restrictions
    if (currentUser.type === 'Teknis') {
      if (tab === 'input' || tab === 'procurement' || tab === 'categories' || tab === 'vendors' || tab === 'users') return true;
    }

    return false;
  };

  const renderTabContent = () => {
    switch(activeTab) {
      case 'home':
        return (
          <DashboardView 
            stats={stats}
            chartData={chartData}
            dashResolvedRange={dashResolvedRange}
            dashboardStats={dashboardStats}
            lang={lang}
          />
        );
      case 'input':
        return (
          <InputAssetView 
            t={t}
            lang={lang}
            assetForm={assetForm}
            setAssetForm={setAssetForm}
            categoryPlacements={categoryPlacements}
            categoryOutlets={categoryOutlets}
            categoryOwnerships={categoryOwnerships}
            vendorCategories={vendorCategories}
            handleAssetSubmit={handleAssetSubmit}
            handlePhotoUpload={handlePhotoUpload}
          />
        );
      case 'inventory':
        return (
          <InventoryView 
            t={t}
            lang={lang}
            filteredInventory={filteredInventory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchField={searchField}
            setSearchField={setSearchField}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            setShowExportModal={setShowExportModal}
            setExportMode={setExportMode}
            setAssetHistoryId={setAssetHistoryId}
            handleDeleteAsset={handleDeleteAsset}
            setEditingAssetId={setEditingAssetId}
            setEditAssetForm={setEditAssetForm}
            currentUser={currentUser}
            calculateAge={calculateAge}
            isAdmin={isAdmin}
            setPreviewPhoto={setPreviewPhoto}
          />
        );
      case 'emergency':
        return (
          <EmergencyView 
            t={t}
            lang={lang}
            inventory={inventory}
            emergencyForm={emergencyForm}
            setEmergencyForm={setEmergencyForm}
            handleEmergencySubmit={handleEmergencySubmit}
            handlePhotoUpload={handlePhotoUpload}
            vendorCategories={vendorCategories}
            categoryOutlets={categoryOutlets}
            categoryPlacements={categoryPlacements}
            categoryPriorities={categoryPriorities}
          />
        );
      case 'handling':
        return (
          <HandlingView 
            t={t}
            lang={lang}
            reports={reports}
            setSolvingReportId={setSolvingReportId}
            vendors={vendors}
            currentUser={currentUser}
            isAdmin={isAdmin}
            handleDeleteAllReports={handleDeleteAllReports}
            setPreviewPhoto={setPreviewPhoto}
          />
        );
      case 'users':
        return (
          <UserManagementView 
            t={t}
            allUsers={allUsers}
            editingUserId={editingUserId}
            setEditingUserId={setEditingUserId}
            editUserForm={editUserForm}
            setEditUserForm={setEditUserForm}
            handleUpdateUserRole={handleUpdateUserRole}
            handleDeleteUser={handleDeleteUser}
            currentUser={currentUser}
          />
        );
      case 'procurement':
        return (
          <ProcurementView 
            lang={lang}
            procurementForm={procurementForm}
            setProcurementForm={setProcurementForm}
            handleProcurementSubmit={handleProcurementSubmit}
            handlePhotoUpload={handlePhotoUpload}
            vendorCategories={vendorCategories}
            categoryOutlets={categoryOutlets}
            formatRupiah={formatRupiah}
            t={t}
            procurements={procurements}
            onlyAdd={true}
            setPreviewPhoto={setPreviewPhoto}
          />
        );
      case 'procurement_list':
        return (
          <ProcurementView 
            lang={lang}
            procurementForm={procurementForm}
            setProcurementForm={setProcurementForm}
            handleProcurementSubmit={handleProcurementSubmit}
            handlePhotoUpload={handlePhotoUpload}
            vendorCategories={vendorCategories}
            categoryOutlets={categoryOutlets}
            formatRupiah={formatRupiah}
            t={t}
            procurements={procurements}
            onlyList={true}
            setPreviewPhoto={setPreviewPhoto}
          />
        );
      case 'categories':
        return (
          <CategoryManagementView 
            t={t}
            lang={lang}
            categoryOutlets={categoryOutlets}
            categoryPlacements={categoryPlacements}
            categoryVendors={categoryVendors}
            categoryOwnerships={categoryOwnerships}
            categoryPriorities={categoryPriorities}
            handleCategorySubmit={handleAddCategory}
            handleDeleteCategory={handleDeleteCategory}
          />
        );
      case 'vendors':
        return (
          <VendorManagementView 
            t={t}
            lang={lang}
            activeCatSub={activeCatSub}
            setActiveCatSub={setActiveCatSub}
            vendors={vendors}
            vendorCategories={vendorCategories}
            vendorForm={vendorForm}
            setVendorForm={setVendorForm}
            handleVendorSubmit={handleVendorSubmit}
            handleDeleteVendor={handleDeleteVendor}
            editingVendorId={editingVendorId}
            setEditingVendorId={setEditingVendorId}
            currentUser={currentUser}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#f0f2f9] dark:bg-[#0a0b0e] text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300 font-sans selection:bg-accent-purple selection:text-white flex items-center justify-center p-0 lg:p-6 relative overflow-hidden">
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-sidebar-bg dark:bg-dark-sidebar text-white z-[201] lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 pb-10">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg overflow-hidden p-0.5">
                      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRT3HPi5oJMO5sRj1BwfuBsTVI0YsKJqEGy9w&s" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <h1 className="text-lg font-extrabold tracking-tight leading-tight uppercase italic">{t.title}</h1>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="px-6 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Menu</span>
                    <nav className="mt-2 space-y-1">
                      {[
                        { id: 'home', icon: Home, label: t.dashboard },
                        { id: 'inventory', icon: LayoutList, label: t.inventory },
                        { id: 'procurement', icon: ClipboardList, label: t.addProcurement },
                        { id: 'procurement_list', icon: History, label: t.procurementList },
                        { id: 'emergency', icon: AlertTriangle, label: t.emergency, variant: 'red' },
                        { id: 'handling', icon: CheckSquare, label: t.handling },
                      ].filter(tab => !isLocked(tab.id)).map((tab: any) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-4 px-6 py-3.5 transition-all rounded-2xl ${activeTab === tab.id ? 'bg-gradient-primary text-white shadow-lg shadow-accent-purple/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                        >
                          <tab.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === tab.id ? 'text-white' : tab.variant === 'red' ? 'text-red-400' : 'text-slate-500'}`} />
                          <span className="font-bold text-sm tracking-wide text-left">{tab.label}</span>
                        </button>
                      ))}
                    </nav>
                  </div>

                  {(() => {
                    const mgmtTabs = [
                      { id: 'input', icon: PlusSquare, label: t.inputAset },
                      { id: 'categories', icon: Settings2, label: t.catMgmt },
                      { id: 'vendors', icon: ShieldCheck, label: t.vendorMgmt },
                      ...(currentUser?.type === 'Superadmin' ? [{ id: 'users', icon: Users, label: t.users }] : [])
                    ].filter(tab => !isLocked(tab.id));
                    
                    if (mgmtTabs.length === 0) return null;
                    
                    return (
                      <div>
                        <span className="px-6 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Management</span>
                        <nav className="mt-2 space-y-1">
                          {mgmtTabs.map((tab: any) => (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id);
                                setIsMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-4 px-6 py-3.5 transition-all rounded-2xl ${activeTab === tab.id ? 'bg-gradient-primary text-white shadow-lg shadow-accent-purple/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                            >
                              <tab.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`} />
                              <span className="font-bold text-sm tracking-wide text-left">{tab.label}</span>
                            </button>
                          ))}
                        </nav>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="mt-auto p-8 pt-4 border-t border-white/5 space-y-6">
                <div className="flex items-center gap-3 px-6">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg bg-gradient-primary p-0.5 flex-shrink-0">
                    <div className="w-full h-full bg-dark-sidebar rounded-[14px] p-0.5">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || '')}&background=9b51e0&color=fff`} 
                        alt={currentUser?.name} 
                        className="w-full h-full object-cover rounded-[12px]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white truncate">{currentUser?.name.split(' ').slice(0, 2).join(' ')}</h4>
                    <p className="text-[10px] text-accent-pink truncate font-black uppercase tracking-wider">{currentUser?.type}</p>
                  </div>
                </div>

                <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 text-slate-500 hover:text-red-400 transition-all rounded-2xl hover:bg-white/5">
                  <LogOut className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">{t.logout}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}

        {loading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-white/80 dark:bg-dark-dashboard/80 backdrop-blur-md flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">Menghubungkan ke Database...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!currentUser ? (
        <div className="w-full max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white dark:bg-dark-card p-10 rounded-[48px] shadow-2xl relative z-10 border border-white"
          >
            <div className="text-center mb-10">
              <div className="w-24 h-24 bg-gradient-primary rounded-[32px] flex items-center justify-center shadow-xl shadow-accent-purple/20 mx-auto mb-6 p-1">
                <div className="w-full h-full bg-white dark:bg-dark-card rounded-[24px] flex items-center justify-center p-0.5 backdrop-blur-sm overflow-hidden">
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRT3HPi5oJMO5sRj1BwfuBsTVI0YsKJqEGy9w&s" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t.title}</h1>
              <p className="text-slate-400 text-sm mt-2 font-medium">{t.subtitle}</p>
            </div>

            <div className="absolute top-8 right-8 flex items-center gap-2">
              <button 
                onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
                className="w-10 h-10 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl flex items-center justify-center text-[10px] font-bold text-slate-400 hover:text-accent-purple transition uppercase"
              >
                {lang === 'id' ? 'EN' : 'ID'}
              </button>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-10 h-10 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl flex items-center justify-center text-slate-400 hover:text-accent-purple transition"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            {!authMode ? (
              <div className="space-y-4">
                <button 
                  onClick={() => setAuthMode('login')}
                  className="w-full py-5 bg-gradient-primary text-white rounded-full font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-accent-purple/20 group uppercase text-xs tracking-widest"
                >
                  <LogIn className="w-5 h-5 group-hover:translate-x-1 transition" /> {t.login}
                </button>
                <button 
                  onClick={() => setAuthMode('register')}
                  className="w-full py-5 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-2 border-slate-100 dark:border-white/10 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all group uppercase text-xs tracking-widest shadow-lg shadow-slate-100/50"
                >
                  <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition" /> {t.register}
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-6">
                {authMode === 'register' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">{t.name}</label>
                    <div className="relative">
                      <User className="absolute left-6 top-5 w-4 h-4 text-slate-300 pointer-events-none" />
                      <input 
                        type="text" 
                        placeholder={lang === 'id' ? "Nama lengkap Anda" : "Your full name"}
                        value={authForm.name} 
                        onChange={e => setAuthForm({...authForm, name: e.target.value})} 
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-full text-sm font-semibold outline-none focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" 
                        required 
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">{t.email}</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-5 w-4 h-4 text-slate-300 pointer-events-none" />
                    <input 
                      type="email" 
                      placeholder="email@perusahaan.com"
                      value={authForm.email} 
                      onChange={e => setAuthForm({...authForm, email: e.target.value})} 
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-full text-sm font-semibold outline-none focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">{t.password}</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-5 w-4 h-4 text-slate-300 pointer-events-none" />
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={authForm.password} 
                      onChange={e => setAuthForm({...authForm, password: e.target.value})} 
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-full text-sm font-semibold outline-none focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" 
                      required 
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setAuthMode(null)} className="flex-1 py-5 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-full font-bold uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Batal</button>
                  <button type="submit" className="flex-1 py-5 bg-gradient-primary text-white rounded-full font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-accent-purple/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {authMode === 'login' ? t.login : t.register}
                  </button>
                </div>
                {authMode === 'login' && (
                  <button type="button" onClick={() => handleResetPassword()} className="w-full text-center text-xs font-bold text-slate-400 hover:text-accent-purple transition py-2 tracking-widest uppercase">Lupa Password?</button>
                )}
              </form>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="w-full h-full max-w-[1600px] max-h-[1000px] bg-white dark:bg-[#0a0b0e] lg:rounded-[48px] shadow-2xl overflow-hidden flex relative z-10 border border-white dark:border-white/5">
          <AnimatePresence>
            {confirmModal.show && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-dark-card w-full max-w-sm rounded-[40px] p-10 shadow-2xl border border-white"
                >
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mb-8 mx-auto">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 text-center tracking-tight">{confirmModal.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-10 text-center font-medium">{confirmModal.message}</p>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        confirmModal.onConfirm();
                        setConfirmModal(prev => ({ ...prev, show: false }));
                      }}
                      className={`${confirmModal.confirmText === 'Logout' || confirmModal.title === t.logout ? 'bg-gradient-primary' : 'bg-red-500'} w-full py-4 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition shadow-xl shadow-black/10`}
                    >
                      {confirmModal.confirmText || (lang === 'id' ? 'Ya, Lanjutkan' : 'Yes, Continue')}
                    </button>
                    <button 
                      onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                      className="w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition"
                    >
                      {lang === 'id' ? 'Batal' : 'Cancel'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Decorative background elements inside app windown */}
          <div className="fixed top-[-10%] left-[20%] w-[500px] h-[500px] bg-accent-purple/5 rounded-full blur-[120px] pointer-events-none animate-float" />
          <div className="fixed bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-accent-pink/5 rounded-full blur-[120px] pointer-events-none animate-float" style={{animationDelay: '-5s'}} />
          
          {/* New Sidebar Navigation */}
          <aside className="hidden lg:flex flex-col w-72 bg-sidebar-bg dark:bg-dark-sidebar text-white shadow-2xl overflow-hidden relative z-20">
            <div className="p-8 pb-10">
              <div className="flex items-center gap-3 mb-10 px-2 mt-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden p-0.5">
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRT3HPi5oJMO5sRj1BwfuBsTVI0YsKJqEGy9w&s" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <h1 className="text-xl font-extrabold tracking-tight leading-tight uppercase italic">{t.title}</h1>
              </div>

              <div className="space-y-1 mb-8">
                 <div className="px-6 py-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Menu</span>
                 </div>
                 <nav className="space-y-1">
                  {[
                    { id: 'home', icon: Home, label: t.dashboard },
                    { id: 'inventory', icon: LayoutList, label: t.inventory, count: inventory.length },
                    { id: 'procurement', icon: ClipboardList, label: t.addProcurement },
                    { id: 'procurement_list', icon: History, label: t.procurementList },
                    { id: 'handling', icon: CheckSquare, label: t.handling, count: reports.filter(r => r.status !== 'resolved').length },
                    { id: 'emergency', icon: AlertTriangle, label: t.emergency, variant: 'red' },
                  ].filter(tab => !isLocked(tab.id)).map((tab: any) => {
                    const isActive = activeTab === tab.id;
                    const locked = isLocked(tab.id);
                    
                    return (
                      <button
                        key={tab.id}
                        disabled={locked}
                        onClick={() => {
                          setActiveTab(tab.id);
                          if (tab.id === 'vendors') setActiveCatSub('Service');
                          if (tab.id === 'categories') setActiveCatSub('Location');
                        }}
                        className={`
                          w-full flex items-center gap-4 px-8 py-3.5 transition-all duration-300 group relative
                          ${isActive 
                            ? 'text-white' 
                            : 'text-slate-500 hover:text-white'}
                          ${locked ? 'opacity-30 cursor-not-allowed grayscale' : ''}
                        `}
                      >
                        {isActive && <div className="absolute left-0 w-1.5 h-full bg-gradient-primary rounded-r-full" />}
                        {isActive && <div className="absolute inset-0 bg-gradient-primary opacity-10" />}
                        
                        <tab.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-accent-pink' : tab.variant === 'red' ? 'text-red-400' : 'text-slate-500 group-hover:text-white'}`} />
                        <span className="font-bold text-sm tracking-wide text-left">{tab.label}</span>
                        {tab.count !== undefined && !isActive && (
                          <span className={`ml-auto text-[9px] px-2 py-0.5 rounded-full ${tab.variant === 'red' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/40'}`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-1">
                 {(() => {
                   const mgmtTabs = [
                     { id: 'input', icon: PlusSquare, label: t.inputAset },
                     { id: 'categories', icon: Settings2, label: t.catMgmt },
                     { id: 'vendors', icon: ShieldCheck, label: t.vendorMgmt },
                     ...(isAdmin ? [{ id: 'users', icon: Users, label: t.users }] : [])
                   ].filter(tab => !isLocked(tab.id));

                   if (mgmtTabs.length === 0) return null;

                   return (
                     <>
                       <div className="px-6 py-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Management</span>
                       </div>
                       <nav className="space-y-1">
                        {mgmtTabs.map((tab: any) => {
                          const isActive = activeTab === tab.id;
                          const locked = isLocked(tab.id);
                          
                          return (
                            <button
                              key={tab.id}
                              disabled={locked}
                              onClick={() => {
                                setActiveTab(tab.id);
                                if (tab.id === 'vendors') setActiveCatSub('Service');
                                if (tab.id === 'categories') setActiveCatSub('Location');
                              }}
                              className={`
                                w-full flex items-center gap-4 px-8 py-3.5 transition-all duration-300 group relative
                                ${isActive 
                                  ? 'text-white' 
                                  : 'text-slate-500 hover:text-white'}
                                ${locked ? 'opacity-30 cursor-not-allowed grayscale' : ''}
                              `}
                            >
                              {isActive && <div className="absolute left-0 w-1.5 h-full bg-gradient-primary rounded-r-full" />}
                              {isActive && <div className="absolute inset-0 bg-gradient-primary opacity-10" />}
                              
                              <tab.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-accent-pink' : tab.variant === 'red' ? 'text-red-400' : 'text-slate-500 group-hover:text-white'}`} />
                              <span className="font-bold text-sm tracking-wide text-left">{tab.label}</span>
                            </button>
                          );
                        })}
                      </nav>
                    </>
                   );
                 })()}
              </div>
            </div>

            <div className="mt-auto p-4 px-10 pb-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg bg-gradient-primary p-0.5 flex-shrink-0">
                  <div className="w-full h-full bg-dark-sidebar rounded-[14px] p-0.5">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || '')}&background=9b51e0&color=fff`} 
                      alt={currentUser?.name} 
                      className="w-full h-full object-cover rounded-[12px]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-white truncate">{currentUser?.name.split(' ').slice(0, 2).join(' ')}</h4>
                  <p className="text-[10px] text-accent-pink truncate font-black uppercase tracking-wider">{currentUser?.type}</p>
                </div>
              </div>

              <button 
                 onClick={handleLogout}
                 className="flex items-center gap-4 text-slate-500 hover:text-red-400 transition-colors group"
              >
                 <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition" />
                 <span className="text-xs font-black uppercase tracking-widest">{t.logout}</span>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col bg-dashboard-bg/50 dark:bg-dark-dashboard/50 backdrop-blur-sm relative z-10 overflow-x-hidden md:max-h-screen overflow-y-auto no-scrollbar">
            {/* Nav Header */}
            <header className="flex items-center justify-between p-6 lg:p-8 lg:px-10">
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="lg:hidden w-10 h-10 bg-white dark:bg-dark-card rounded-xl flex items-center justify-center shadow-lg mr-2 text-slate-500"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <div className="hidden sm:block">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-none capitalize">Hello, {currentUser.name.split(' ')[0]} 👋</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{t.checkStatus}</p>
                  </div>
               </div>

               <div className="flex items-center gap-6">
                  <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-white dark:bg-dark-card rounded-full shadow-sm border border-slate-100 dark:border-white/5">
                     <Clock className="w-4 h-4 text-accent-purple" />
                     <DigitalClock />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="p-3 bg-white dark:bg-dark-card rounded-2xl shadow-sm hover:shadow-md transition text-slate-400 hover:text-accent-purple"
                    >
                      {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
                      className="px-4 py-3 bg-white dark:bg-dark-card rounded-2xl shadow-sm hover:shadow-md transition text-[10px] font-extrabold uppercase tracking-widest text-slate-400 hover:text-accent-purple"
                    >
                      {lang === 'id' ? 'EN' : 'ID'}
                    </button>
                  </div>
               </div>
            </header>

            <div className="flex-1 w-full pb-10 px-6 lg:px-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      )}

      {/* History Asset Modal */}
      <AnimatePresence>
        {assetHistoryId && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 px-10 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                <div>
                   <h3 className="font-black text-slate-900 dark:text-white tracking-tight text-lg">Riwayat Aktivitas Aset</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {inventory.find(i => i.id === assetHistoryId || i.code === assetHistoryId)?.name} ({assetHistoryId})
                   </p>
                </div>
                <button onClick={() => setAssetHistoryId(null)} className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-white/10 rounded-2xl transition-colors shadow-sm"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="p-10 max-h-[60vh] overflow-y-auto space-y-6 no-scrollbar">
                    {assetActivities.filter(a => a.assetCode === assetHistoryId).length > 0 ? (
                  assetActivities.filter(a => a.assetCode === assetHistoryId).map((act) => (
                    <div key={act.id || `activity-${act.timestamp}`} className="flex gap-6 items-start relative group">
                       {/* Line indicator logic */}
                       {act.id !== assetActivities.filter(a => a.assetCode === assetHistoryId)[assetActivities.filter(a => a.assetCode === assetHistoryId).length - 1].id && (
                         <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-100 dark:bg-white/5" />
                       )}
                       <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm z-10 ${
                         act.type === 'Created' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' :
                         act.type === 'Emergency' ? 'bg-red-50 text-red-500 dark:bg-red-500/10' :
                         'bg-blue-50 text-blue-500 dark:bg-blue-500/10'
                       }`}>
                          {act.type === 'Created' ? <PlusSquare className="w-5 h-5" /> : 
                           act.type === 'Emergency' ? <AlertTriangle className="w-5 h-5" /> : 
                           <CheckCircle2 className="w-5 h-5" />}
                       </div>
                       <div className="flex-1 pt-1 pb-4">
                          <div className="flex items-center justify-between gap-4 mb-2">
                             <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{act.type}</h4>
                             <span className="text-[10px] font-mono font-bold text-slate-400">{act.timestamp.replace('T', ' ').split('.')[0]}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-bold">{act.description}</p>
                          {act.photo && (
                            <div 
                              onClick={() => setPreviewPhoto(act.photo)}
                              className="mt-3 w-full h-32 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 cursor-zoom-in"
                            >
                               <img src={act.photo} alt="History" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                             <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[8px] font-black">{act.user[0]}</div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{act.user}</span>
                          </div>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
                     <History className="w-12 h-12 text-slate-100 dark:text-white/5" />
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum ada riwayat aktivitas</p>
                  </div>
                )}
              </div>
              <div className="p-8 border-t border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                 <button onClick={() => setAssetHistoryId(null)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-black text-[10px] uppercase tracking-widest">Tutup Riwayat</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Solving Modal */}
      <AnimatePresence>
        {solvingReportId && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-card w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 px-10 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                <div>
                   <h3 className="font-black text-slate-900 dark:text-white tracking-tight text-lg">Penyelesaian Penanganan</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Konfirmasi pengerjaan laporan</p>
                </div>
                <button onClick={() => setSolvingReportId(null)} className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-white/10 rounded-2xl transition-colors shadow-sm"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSolveSubmit} className="p-10 space-y-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Verifikator Penanganan</label>
                  <input type="text" value={solveForm.verifier} onChange={e => setSolveForm({...solveForm, verifier: e.target.value})} className="w-full px-8 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-full outline-none text-sm font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" placeholder="Nama lengkap petugas pengerjaan" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Deskripsi Penanganan</label>
                  <textarea value={solveForm.desc} onChange={e => setSolveForm({...solveForm, desc: e.target.value})} rows={3} className="w-full px-8 py-5 bg-slate-50 dark:bg-white/5 border-none rounded-[32px] outline-none text-sm font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner resize-none" placeholder="Detail tindakan yang telah dilakukan..." required></textarea>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Foto Bukti Selesai</label>
                  <input type="file" id="solvePhotoInput" className="hidden" accept="image/*" onChange={e => handlePhotoUpload(e, (val) => setSolveForm({...solveForm, photo: val}))} />
                  <input type="file" id="solveCameraInput" className="hidden" accept="image/*" capture="environment" onChange={e => handlePhotoUpload(e, (val) => setSolveForm({...solveForm, photo: val}))} />
                  
                  <div className="w-full h-40 border-2 border-dashed border-slate-100 dark:border-white/10 rounded-[32px] overflow-hidden relative bg-slate-50 dark:bg-white/2 transition-all">
                    {solveForm.photo ? (
                      <div className="relative w-full h-full group">
                        <img src={solveForm.photo} alt="Result" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setSolveForm({...solveForm, photo: ''})}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex w-full h-full">
                        <label htmlFor="solvePhotoInput" className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-all group border-r border-slate-100 dark:border-white/5">
                          <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-accent-purple transition-colors" />
                          <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{lang === 'id' ? 'Galeri' : 'Gallery'}</p>
                        </label>
                        <label htmlFor="solveCameraInput" className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-all group">
                          <Camera className="w-6 h-6 text-slate-300 group-hover:text-accent-purple transition-colors" />
                          <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{lang === 'id' ? 'Kamera' : 'Camera'}</p>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setSolvingReportId(null)} className="flex-1 py-5 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Batal</button>
                  <button type="submit" className="flex-1 py-5 bg-gradient-primary text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-accent-purple/20 flex items-center justify-center gap-3 transition-all">
                    <CheckCircle className="w-4 h-4" /> Kirim & Selesai
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export PDF Modal */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-card w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden"
            >
               <div className="p-8 px-10 border-b border-slate-50 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                <div>
                   <h3 className="font-black text-slate-900 dark:text-white tracking-tight text-lg">
                     {exportMode === 'pdf' ? (lang === 'id' ? 'Export ke PDF' : 'Export to PDF') : (lang === 'id' ? 'Export ke CSV' : 'Export to CSV')}
                   </h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                     {exportMode === 'pdf' ? 'Download data inventaris dalam format PDF' : 'Download data inventaris dalam format Spreadsheet CSV'}
                   </p>
                </div>
                <button onClick={() => setShowExportModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-white/10 rounded-2xl transition-colors shadow-sm"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{lang === 'id' ? 'Dari Tanggal' : 'From Date'}</label>
                    <input 
                      type="date" 
                      value={dateRange.start} 
                      onChange={e => setDateRange({...dateRange, start: e.target.value})} 
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{lang === 'id' ? 'Sampai Tanggal' : 'To Date'}</label>
                    <input 
                      type="date" 
                      value={dateRange.end} 
                      onChange={e => setDateRange({...dateRange, end: e.target.value})} 
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" 
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  {exportMode === 'pdf' ? (
                    <button 
                      onClick={exportPDF} 
                      className="w-full py-5 bg-sidebar-bg dark:bg-accent-brown text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-sidebar-bg/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      <Download className="w-4 h-4" /> Download PDF Report
                    </button>
                  ) : (
                    <button 
                      onClick={handleExportSpreadsheet} 
                      className="w-full py-5 bg-emerald-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      <Table2 className="w-4 h-4" /> Download CSV Spreadsheet
                    </button>
                  )}
                  <button 
                    onClick={() => {setDateRange({start: '', end: ''}); setShowExportModal(false);}} 
                    className="w-full py-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    {lang === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Asset Modal */}
      <AnimatePresence>
        {editingAssetId && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingAssetId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-dark-card rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/5"
            >
              <div className="p-8 sm:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent-tan/20 text-accent-brown rounded-2xl flex items-center justify-center">
                      <Edit className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{lang === 'id' ? 'Edit Data Aset' : 'Edit Asset Data'}</h2>
                      <p className="text-xs text-slate-400 font-medium">{lang === 'id' ? 'Update informasi aset untuk perbaikan data.' : 'Update asset information for data correction.'}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingAssetId(null)} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleEditAssetSubmit} className="space-y-6 max-h-[65vh] overflow-y-auto px-1 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.assetName}</label>
                       <input type="text" value={editAssetForm.name || ''} onChange={e => setEditAssetForm({...editAssetForm, name: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all shadow-inner" required />
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.assetCode}</label>
              <input type="text" value={editAssetForm.code || ''} onChange={e => setEditAssetForm({...editAssetForm, code: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all shadow-inner" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.condLabel}</label>
                        <select value={editAssetForm.condition || ''} onChange={e => setEditAssetForm({...editAssetForm, condition: e.target.value as any})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all shadow-inner appearance-none cursor-pointer">
                          <option value="Baru">{lang === 'id' ? 'Baru' : 'New'}</option>
                          <option value="Bekas">{lang === 'id' ? 'Bekas' : 'Used'}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Satuan' : 'Unit'}</label>
                        <input type="text" value={editAssetForm.unit || ''} onChange={e => setEditAssetForm({...editAssetForm, unit: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all shadow-inner" placeholder="Pcs/Unit" required />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Jumlah' : 'Quantity'}</label>
                        <input type="number" value={editAssetForm.quantity || ''} onChange={e => setEditAssetForm({...editAssetForm, quantity: Number(e.target.value)})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all shadow-inner" placeholder="1" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Kategori Aset' : 'Asset Category'}</label>
                      <select value={editAssetForm.category || ''} onChange={e => setEditAssetForm({...editAssetForm, category: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all shadow-inner appearance-none cursor-pointer">
                        <option key="select-category-default" value="">{lang === 'id' ? 'Pilih Kategori' : 'Select Category'}</option>
                        {vendorCategories.map((cat: any) => (
                           <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Kepemilikan Aset' : 'Asset Ownership'}</label>
                      <select value={editAssetForm.ownership || ''} onChange={e => setEditAssetForm({...editAssetForm, ownership: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all shadow-inner appearance-none cursor-pointer">
                        <option key="select-ownership-default" value="">{lang === 'id' ? 'Pilih Kepemilikan' : 'Select Ownership'}</option>
                        {categoryOwnerships.map((cat: any) => (
                           <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.placementLabel}</label>
                       <select value={editAssetForm.placement || ''} onChange={e => setEditAssetForm({...editAssetForm, placement: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all shadow-inner appearance-none cursor-pointer">
                         <option key="select-placement-default" value="">{t.placementPlc}</option>
                         {categoryPlacements.map((cat: any) => (
                           <option key={cat.id} value={cat.name}>{cat.name}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.outletLabel}</label>
                       <select value={editAssetForm.outlet || ''} onChange={e => setEditAssetForm({...editAssetForm, outlet: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all shadow-inner appearance-none cursor-pointer">
                         <option key="select-outlet-default" value="">{t.outletPlc}</option>
                         {categoryOutlets.map((cat: any) => (
                           <option key={cat.id} value={cat.name}>{cat.name}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
                      <select value={editAssetForm.status || 'Normal'} onChange={e => setEditAssetForm({...editAssetForm, status: e.target.value as any})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all shadow-inner appearance-none cursor-pointer">
                        <option value="Normal">Normal</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Harga Aset' : 'Asset Price'}</label>
                      <input type="number" value={editAssetForm.price || ''} onChange={e => setEditAssetForm({...editAssetForm, price: Number(e.target.value)})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all shadow-inner" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Procurement Date' : 'Procurement Date'}</label>
                      <input type="date" value={editAssetForm.date || ''} onChange={e => setEditAssetForm({...editAssetForm, date: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all shadow-inner" required />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Receiver Name' : 'Receiver Name'}</label>
                      <input type="text" value={editAssetForm.verifier || ''} onChange={e => setEditAssetForm({...editAssetForm, verifier: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all shadow-inner" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Deskripsi Aset' : 'Asset Description'}</label>
                    <textarea value={editAssetForm.description || ''} onChange={e => setEditAssetForm({...editAssetForm, description: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all min-h-[100px] resize-none" />
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setEditingAssetId(null)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">
                      {lang === 'id' ? 'Batal' : 'Cancel'}
                    </button>
                    <button type="submit" className="flex-[2] py-4 bg-[#10b981] text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#059669] transition-all shadow-lg shadow-emerald-500/20">
                      {lang === 'id' ? 'Simpan Perubahan' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Photo Preview Modal */}
      <AnimatePresence>
        {previewPhoto && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewPhoto(null)}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full max-h-[90vh] rounded-[40px] overflow-hidden shadow-2xl border border-white/10 group"
            >
              <img src={previewPhoto} alt="Preview Large" className="w-full h-full object-contain bg-black/20" />
              <button 
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md text-white rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all border border-white/20 shadow-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-10 right-10 px-8 py-5 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[200] text-white font-black text-xs uppercase tracking-widest flex items-center gap-4 ${toast.isError ? 'bg-red-500' : 'bg-slate-900 dark:bg-dark-card border border-white/10'}`}
          >
            {!toast.isError && <CheckCircle className="w-5 h-5 text-accent-pink" />}
            {toast.isError && <AlertTriangle className="w-5 h-5 text-white" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// Performance Optimized Views
const DashboardView = React.memo(({ stats, chartData, dashboardStats, lang }: any) => {
  const [range, setRange] = useState<'0' | '7' | '15' | '30'>('15');
  
  const currentReportStats = useMemo(() => {
    switch (range) {
      case '0': return dashboardStats.reportStats0;
      case '7': return dashboardStats.reportStats7;
      case '30': return dashboardStats.reportStats30;
      default: return dashboardStats.reportStats15;
    }
  }, [dashboardStats, range]);

  return (
    <div className="space-y-10 animate-in fade-in transition-all duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Dashboard</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{lang === 'id' ? 'Statistik Manajemen Aset' : 'Asset Management Statistics'}</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/50 dark:bg-white/5 p-2 rounded-2xl border border-slate-100 dark:border-white/5 backdrop-blur-xl">
           <div className="flex items-center gap-3 px-4 border-r border-slate-200 dark:border-white/10">
              <Calendar className="w-4 h-4 text-accent-purple" />
              <DigitalClock />
           </div>
           <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all">
             <RefreshCw className="w-4 h-4 text-slate-400" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 px-4">
        {[
          { label: lang === 'id' ? 'Total Aset' : 'Total Assets', value: stats.totalAssets, icon: Archive, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
          { label: lang === 'id' ? 'Laporan Pending' : 'Pending Reports', value: stats.pending.length, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: lang === 'id' ? 'Terselesaikan' : 'Resolved', value: stats.resolved.length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: lang === 'id' ? 'Penyelesaian' : 'Completion', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'text-accent-pink', bg: 'bg-accent-pink/10' }
        ].map((item, i) => (
          <div key={`dashboard-stat-${i}`} className="bg-white dark:bg-dark-card p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${item.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden`} />
            <div className="flex items-center justify-between relative z-10">
              <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 px-4">
        <div className="bg-white dark:bg-dark-card p-8 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-accent-purple rounded-full" />
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-widest">{lang === 'id' ? 'Aset per Outlet' : 'Assets per Outlet'}</h3>
            </div>
            <Archive className="w-5 h-5 text-slate-300" />
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardStats.outletData} layout="vertical" margin={{ left: 40, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.1} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} width={80} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'white' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#9b51e0" 
                  radius={[0, 10, 10, 0]} 
                  label={{ position: 'right', fill: '#64748b', fontSize: 12, fontWeight: 900 }}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card p-8 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-accent-pink rounded-full" />
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-widest">{lang === 'id' ? 'Stats Kerusakan' : 'Reports Stats'}</h3>
            </div>
            <div className="flex bg-slate-50 dark:bg-white/5 p-1 rounded-xl">
              {(['0', '7', '15', '30'] as const).map(d => (
                <button 
                  key={d}
                  onClick={() => setRange(d)}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${range === d ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >
                  {d === '0' ? (lang === 'id' ? 'HARI INI' : 'TODAY') : `${d}D`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentReportStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={82}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {currentReportStats.map((entry: any, index: number) => (
                    <Cell key={`cell-pie-${index}`} fill={index === 0 ? '#f43f5e' : '#10b981'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-4">
              <p className="text-2xl font-black text-slate-800 dark:text-white">
                {currentReportStats[0]?.value > 0 
                  ? Math.round((currentReportStats[1].value / currentReportStats[0].value) * 100)
                  : 0}%
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{lang === 'id' ? 'Selesai' : 'Resolved'}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            {currentReportStats.map((item: any, idx: number) => (
              <div key={`report-legend-${idx}`} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card p-8 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-widest">{lang === 'id' ? 'Sering Rusak' : 'Top Damaged'}</h3>
            </div>
            <AlertTriangle className="w-5 h-5 text-slate-300" />
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardStats.mostReported} margin={{ top: 10, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[8, 8, 0, 0]}
                  label={{ position: 'top', fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                  barSize={24}
                >
                   {dashboardStats.mostReported.map((_: any, index: number) => {
                     const colors = ['#f59e0b', '#f43f5e', '#a855f7', '#3b82f6', '#10b981'];
                     return <Cell key={`cell-reported-${index}`} fill={colors[index % colors.length]} />;
                   })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {dashboardStats.mostReported.map((item: any, idx: number) => {
               const colors = ['bg-amber-500', 'bg-red-500', 'bg-purple-500', 'bg-blue-500', 'bg-emerald-500'];
               return (
                <div key={`reported-item-${idx}`} className="flex items-center justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-2 truncate">
                    <div className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`} />
                    <span className="text-slate-500 truncate">{item.name}</span>
                  </div>
                  <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-lg shrink-0">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* New Chart: Price Per Outlet */}
        <div className="bg-white dark:bg-dark-card p-8 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-widest">{lang === 'id' ? 'Nilai Aset per Outlet' : 'Asset Value per Outlet'}</h3>
            </div>
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center font-black text-xs">$</div>
          </div>
          <div className="flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={dashboardStats.outletData} margin={{ top: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                 <YAxis hide />
                 <Tooltip 
                   formatter={(value: any) => [`Rp ${value.toLocaleString()}`, lang === 'id' ? 'Total Harga' : 'Total Price']}
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                 />
                 <Bar dataKey="totalPrice" fill="#10b981" radius={[10, 10, 0, 0]} barSize={40}>
                   {dashboardStats.outletData.map((_: any, index: number) => {
                     const colors = ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0'];
                     return <Cell key={`cell-price-${index}`} fill={colors[index % colors.length]} />;
                   })}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
             {dashboardStats.outletData.map((item: any, idx: number) => (
                <div key={`outlet-price-item-${idx}`} className="flex items-center justify-between text-[11px] font-bold">
                   <span className="text-slate-500">{item.name}</span>
                   <span className="text-emerald-500">Rp {item.totalPrice.toLocaleString()}</span>
                </div>
             ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
         <div className="bg-white dark:bg-dark-card p-6 lg:p-6 lg:px-10 rounded-[32px] shadow-sm border border-slate-100 dark:border-white/5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-0">
            <div className="flex flex-wrap items-center gap-4 lg:gap-8">
               <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Efficiency Profile</span>
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tasks Capacity</span>
                  <span className="text-[10px] font-black text-pink-500">85%</span>
                  <ArrowUp className="w-3 h-3 text-pink-500" />
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resolution Speed</span>
                  <span className="text-[10px] font-black text-emerald-500">Very High</span>
                  <RefreshCw className="w-3 h-3 text-emerald-500" />
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Health</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black text-emerald-400">OPTIMAL</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
});

const InputAssetView = React.memo(({ t, lang, assetForm, setAssetForm, categoryPlacements, categoryOutlets, categoryOwnerships, vendorCategories, handleAssetSubmit, handlePhotoUpload }: any) => {
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-dark-card p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
         <div className="w-12 h-12 bg-accent-tan/20 text-accent-brown rounded-2xl flex items-center justify-center">
            <PlusCircle className="w-6 h-6" />
         </div>
         <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.regAsset}</h2>
            <p className="text-xs text-slate-400">{t.regAssetSub}</p>
         </div>
      </div>
      <form onSubmit={handleAssetSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.assetNameLabel}</label>
              <input type="text" value={assetForm.name || ''} onChange={e => setAssetForm({...assetForm, name: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all" placeholder={lang === 'id' ? "Contoh: AC Split 1PK" : "Example: AC Split 1PK"} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.assetCodeLabel}</label>
                <input type="text" value={assetForm.code || ''} onChange={e => setAssetForm({...assetForm, code: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all" placeholder="ID-001" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Satuan' : 'Unit'}</label>
                  <input type="text" value={assetForm.unit || ''} onChange={e => setAssetForm({...assetForm, unit: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all" placeholder="Pcs/Unit" required />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Jumlah' : 'Quantity'}</label>
                  <input type="number" value={assetForm.quantity ?? ''} onChange={e => setAssetForm({...assetForm, quantity: Number(e.target.value)})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all" placeholder="1" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.conditionLabel}</label>
                <select value={assetForm.condition} onChange={e => setAssetForm({...assetForm, condition: e.target.value as any})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all appearance-none cursor-pointer">
                  <option value="Baru" className="dark:bg-[#1a1a2e] dark:text-white">{t.newAsset}</option>
                  <option value="Bekas" className="dark:bg-[#1a1a2e] dark:text-white">{t.usedAsset}</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Kategori' : 'Category'}</label>
              <select value={assetForm.category || ''} onChange={e => setAssetForm({...assetForm, category: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all appearance-none cursor-pointer" required>
                <option key="asset-category-placeholder" value="" className="text-slate-400">{lang === 'id' ? "Pilih Kategori" : "Select Category"}</option>
                {vendorCategories.map((cat: any) => (
                  <option key={cat.id} value={cat.name} className="dark:bg-dark-card dark:text-white">{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Kepemilikan' : 'Ownership'}</label>
              <select value={assetForm.ownership || ''} onChange={e => setAssetForm({...assetForm, ownership: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all appearance-none cursor-pointer" required>
                <option key="asset-ownership-placeholder" value="" className="text-slate-400">{lang === 'id' ? "Pilih Kepemilikan" : "Select Ownership"}</option>
                {categoryOwnerships.map((cat: any) => (
                  <option key={cat.id} value={cat.name} className="dark:bg-dark-card dark:text-white">{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.placementLabel}</label>
              <select value={assetForm.placement || ''} onChange={e => setAssetForm({...assetForm, placement: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all appearance-none cursor-pointer" required>
                <option key="asset-placement-placeholder" value="" className="text-slate-400">{t.placePlc}</option>
                {categoryPlacements.map((cat: any) => (
                  <option key={cat.id} value={cat.name} className="dark:bg-dark-card dark:text-white">{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.outletLabel}</label>
              <select value={assetForm.outlet || ''} onChange={e => setAssetForm({...assetForm, outlet: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all appearance-none cursor-pointer" required>
                <option key="asset-outlet-placeholder" value="" className="text-slate-400">{t.outletPlc}</option>
                {categoryOutlets.map((cat: any) => (
                  <option key={cat.id} value={cat.name} className="dark:bg-dark-card dark:text-white">{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Harga Aset' : 'Asset Price'}</label>
               <div className="relative">
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</div>
                 <input type="number" value={assetForm.price ?? ''} onChange={e => setAssetForm({...assetForm, price: e.target.value === '' ? undefined : Number(e.target.value)})} className="w-full pl-14 pr-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all" placeholder={lang === 'id' ? "Masukkan harga aset" : "Enter asset price"} />
               </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.procDateLabel}</label>
              <input type="date" value={assetForm.date || ''} onChange={e => setAssetForm({...assetForm, date: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all" required />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.verifierLabel}</label>
              <input type="text" value={assetForm.verifier || ''} onChange={e => setAssetForm({...assetForm, verifier: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all" placeholder={lang === 'id' ? "Nama lengkap petugas" : "Petitioner full name"} required />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Deskripsi' : 'Description'}</label>
              <textarea value={assetForm.description || ''} onChange={e => setAssetForm({...assetForm, description: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-accent-tan dark:text-white transition-all min-h-[100px] resize-none" placeholder={lang === 'id' ? "Tambahkan spesifikasi atau catatan tambahan aset..." : "Add asset specification or additional notes..."} />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.photoLabel}</label>
              <input type="file" id="assetPhotoInput" className="hidden" accept="image/*" onChange={e => handlePhotoUpload(e, (val: string) => setAssetForm({...assetForm, photo: val}))} />
              <input type="file" id="assetCameraInput" className="hidden" accept="image/*" capture="environment" onChange={e => handlePhotoUpload(e, (val: string) => setAssetForm({...assetForm, photo: val}))} />
              
              <div className="w-full h-32 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[28px] overflow-hidden relative bg-slate-50/50 dark:bg-white/2 transition-all">
                {assetForm.photo ? (
                  <div className="relative w-full h-full group">
                    <img src={assetForm.photo} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setAssetForm({...assetForm, photo: ''})}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex w-full h-full">
                    <label htmlFor="assetPhotoInput" className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-dashboard-bg dark:hover:bg-white/5 transition-all group border-r border-slate-100 dark:border-white/5">
                      <ImageIcon className="w-6 h-6 text-slate-300 group-hover:text-accent-brown transition-colors" />
                      <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{lang === 'id' ? 'Galeri' : 'Gallery'}</p>
                    </label>
                    <label htmlFor="assetCameraInput" className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-dashboard-bg dark:hover:bg-white/5 transition-all group">
                      <Camera className="w-6 h-6 text-slate-300 group-hover:text-accent-brown transition-colors" />
                      <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{lang === 'id' ? 'Kamera' : 'Camera'}</p>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <button type="submit" className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-5 rounded-[28px] font-bold shadow-xl shadow-emerald-500/20 transition-all transform active:scale-[0.98] mt-4 uppercase text-xs tracking-widest flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {t.save}
        </button>
      </form>
    </div>
  );
});

const InventoryView = React.memo(({ t, lang, filteredInventory, searchQuery, setSearchQuery, searchField, setSearchField, sortOrder, setSortOrder, setShowExportModal, setExportMode, setAssetHistoryId, handleDeleteAsset, setEditingAssetId, setEditAssetForm, currentUser, calculateAge, isAdmin, setPreviewPhoto }: any) => {
  return (
    <div className="bg-white dark:bg-dark-card p-10 rounded-[40px] shadow-2xl shadow-slate-300/50 dark:shadow-none border border-slate-200 dark:border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-accent-brown/10 text-accent-brown dark:text-accent-tan rounded-2xl flex items-center justify-center">
              <LayoutList className="w-6 h-6" />
           </div>
           <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.invList}</h2>
              <p className="text-xs text-slate-400">{t.invListSub}</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setExportMode('pdf');
              setShowExportModal(true);
            }}
            className="flex items-center gap-3 px-6 py-4 bg-sidebar-bg dark:bg-accent-brown text-white rounded-2xl text-xs font-bold hover:bg-accent-brown transition shadow-lg shadow-sidebar-bg/20"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button 
            onClick={() => {
              setExportMode('csv');
              setShowExportModal(true);
            }}
            className="flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20"
          >
            <Table2 className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent-brown transition-colors" />
          <input 
            type="text" 
            placeholder={t.search} 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-dashboard-bg dark:bg-white/5 rounded-2xl outline-none text-xs font-semibold focus:ring-2 focus:ring-accent-tan transition-all"
          />
        </div>
        <select 
          value={searchField} 
          onChange={e => setSearchField(e.target.value)}
          className="px-4 py-3.5 bg-dashboard-bg dark:bg-white/5 rounded-2xl outline-none text-xs font-semibold focus:ring-2 focus:ring-accent-tan transition-all appearance-none cursor-pointer"
        >
          <option value="name" className="dark:bg-dark-card dark:text-white uppercase font-bold text-[10px] tracking-widest">{t.assetName}</option>
          <option value="code" className="dark:bg-dark-card dark:text-white uppercase font-bold text-[10px] tracking-widest">{t.assetCode}</option>
          <option value="verifier" className="dark:bg-dark-card dark:text-white uppercase font-bold text-[10px] tracking-widest">{t.verifier}</option>
          <option value="placement" className="dark:bg-dark-card dark:text-white uppercase font-bold text-[10px] tracking-widest">{lang === 'id' ? 'Penempatan' : 'Placement'}</option>
          <option value="outlet" className="dark:bg-dark-card dark:text-white uppercase font-bold text-[10px] tracking-widest">{t.outlet}</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{t.sortBy}:</label>
          <select 
            value={sortOrder} 
            onChange={e => setSortOrder(e.target.value as any)}
            className="flex-1 px-4 py-3.5 bg-dashboard-bg dark:bg-white/5 rounded-2xl outline-none text-xs font-semibold focus:ring-2 focus:ring-accent-tan transition-all appearance-none cursor-pointer"
          >
            <option value="desc" className="dark:bg-dark-card dark:text-white uppercase font-bold text-[10px] tracking-widest">{t.dateAsc}</option>
            <option value="asc" className="dark:bg-dark-card dark:text-white uppercase font-bold text-[10px] tracking-widest">{t.dateDesc}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
        {filteredInventory.map((item: any) => {
          const statusColor = item.status === 'Emergency' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' : 
                            item.status === 'Maintenance' ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]' : 
                            'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
          
          return (
            <div key={item.id} className="bg-white dark:bg-white/5 rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden group hover:shadow-2xl transition-all duration-500 flex flex-col">
              {/* Image Section */}
              <div 
                onClick={() => setPreviewPhoto(item.photo)}
                className="relative h-56 overflow-hidden cursor-zoom-in"
              >
                <img src={item.photo} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="absolute top-6 right-6">
                   <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl backdrop-blur-md border ${
                     item.status === 'Emergency' ? 'bg-red-500/80 border-red-400 text-white' :
                     item.status === 'Maintenance' ? 'bg-blue-500/80 border-blue-400 text-white' :
                     'bg-emerald-500/80 border-emerald-400 text-white'
                   }`}>
                     <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                     <span className="text-[10px] font-black uppercase tracking-widest">{item.status || 'Normal'}</span>
                   </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest border border-white/20">
                      ID: {item.code}
                    </span>
                    <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">
                       {calculateAge(item.date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="p-8 space-y-6 flex-1">
                <div>
                   <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight mb-2 group-hover:text-accent-brown transition-colors">{item.name}</h3>
                   <div className="flex flex-wrap gap-2">
                     <span className="px-2 py-1 bg-accent-brown/5 dark:bg-accent-brown/20 text-accent-brown dark:text-accent-tan text-[8px] font-black uppercase rounded-md border border-accent-brown/10">{item.category}</span>
                     <span className="px-2 py-1 bg-slate-100 dark:bg-white/5 text-slate-400 text-[8px] font-black uppercase rounded-md border border-slate-200/50 dark:border-white/5">{item.ownership || 'Private'}</span>
                   </div>
                   {item.description && (
                     <p className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2 italic">
                       "{item.description}"
                     </p>
                   )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Outlet</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{item.outlet}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{lang === 'id' ? 'Penempatan' : 'Placement'}</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{item.placement}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{lang === 'id' ? 'Harga' : 'Price'}</p>
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate">Rp {Number(item.price || 0).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{lang === 'id' ? 'Pengadaan' : 'Procured'}</p>
                    <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 truncate">{item.date}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-sidebar-bg flex items-center justify-center text-white text-[10px] font-black uppercase">
                       {item.verifier?.[0] || 'A'}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase leading-none">{item.verifier}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Verifier</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setAssetHistoryId(item.code)}
                      className="w-10 h-10 flex items-center justify-center rounded-2xl bg-dashboard-bg dark:bg-white/5 text-slate-400 hover:text-accent-brown hover:bg-accent-tan transition-all"
                      title={t.history}
                    >
                      <History className="w-4 h-4" />
                    </button>
                    {currentUser?.type === 'Superadmin' && (
                      <button 
                        onClick={() => {
                          setEditingAssetId(item.id);
                          setEditAssetForm(item);
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-accent-tan/20 text-accent-brown hover:bg-accent-tan hover:text-white transition-all"
                        title="Edit Asset"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {currentUser?.type === 'Superadmin' && (
                      <button 
                        onClick={() => handleDeleteAsset(item.id!)} 
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-300 hover:text-red-500 hover:bg-red-100 transition-all"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredInventory.length === 0 && (
          <div className="col-span-full text-center py-24 text-slate-300 font-bold uppercase text-[10px] tracking-widest bg-dashboard-bg/50 dark:bg-white/5 rounded-[40px] border border-dashed border-slate-200 dark:border-white/10">
            {t.dbEmpty}
          </div>
        )}
      </div>
    </div>
  );
});

const EmergencyView = React.memo(({ t, lang, inventory, emergencyForm, setEmergencyForm, handleEmergencySubmit, handlePhotoUpload, vendorCategories, categoryOutlets, categoryPlacements, categoryPriorities }: any) => {
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-dark-card p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
         <div className="w-12 h-12 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
         </div>
         <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.emerTitle}</h2>
            <p className="text-xs text-slate-400">{t.emerSub}</p>
         </div>
      </div>
      <form onSubmit={handleEmergencySubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Nama Outlet */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Nama Outlet' : 'Outlet Name'}</label>
              <select 
                value={emergencyForm.outlet || ''} 
                onChange={e => setEmergencyForm({...emergencyForm, outlet: e.target.value, placement: '', name: '', code: ''})} 
                className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-red-400 dark:text-white transition-all appearance-none cursor-pointer" 
                required
              >
                <option key="emer-outlet-default" value="" className="text-slate-400">{lang === 'id' ? 'Pilih Outlet' : 'Select Outlet'}</option>
                {Array.from(new Set(inventory.map((i: any) => i.outlet))).map((outletName: any) => (
                  <option key={outletName} value={outletName} className="dark:bg-dark-card dark:text-white">{outletName}</option>
                ))}
              </select>
            </div>

            {/* Penempatan */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Penempatan' : 'Placement'}</label>
              <select 
                value={emergencyForm.placement || ''} 
                onChange={e => setEmergencyForm({...emergencyForm, placement: e.target.value, name: '', code: ''})} 
                className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-red-400 dark:text-white transition-all appearance-none cursor-pointer" 
                required
                disabled={!emergencyForm.outlet}
              >
                <option key="emer-placement-default" value="" className="text-slate-400">{lang === 'id' ? 'Pilih Penempatan' : 'Select Placement'}</option>
                {Array.from(new Set(inventory.filter((i: any) => i.outlet === emergencyForm.outlet).map((i: any) => i.placement))).map((pName: any) => (
                  <option key={pName} value={pName} className="dark:bg-dark-card dark:text-white">{pName}</option>
                ))}
              </select>
            </div>

            {/* Nama Aset (Dropdown) */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Nama Aset' : 'Asset Name'}</label>
              <select 
                value={emergencyForm.name || ''} 
                onChange={e => {
                  const asset = inventory.find((i: any) => i.name === e.target.value && i.outlet === emergencyForm.outlet && i.placement === emergencyForm.placement);
                  if (asset) {
                    setEmergencyForm({
                      ...emergencyForm,
                      name: asset.name,
                      code: asset.code
                    });
                  }
                }} 
                className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-red-400 dark:text-white transition-all appearance-none cursor-pointer" 
                required
                disabled={!emergencyForm.placement}
              >
                <option key="emer-asset-default" value="" className="text-slate-400">{lang === 'id' ? 'Pilih Aset' : 'Select Asset'}</option>
                {inventory
                  .filter((i: any) => i.outlet === emergencyForm.outlet && i.placement === emergencyForm.placement)
                  .map((asset: any) => (
                    <option key={asset.id} value={asset.name} className="dark:bg-dark-card dark:text-white">{asset.name}</option>
                  ))
                }
              </select>
            </div>

            {/* Kode Aset (Automatic) */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Kode Aset' : 'Asset Code'}</label>
              <input 
                type="text" 
                value={emergencyForm.code || ''} 
                readOnly
                className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold text-slate-400 dark:text-slate-500 cursor-not-allowed" 
                placeholder={lang === 'id' ? 'Terisi otomatis' : 'Auto-filled'}
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Kendala */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t.issue}</label>
              <select value={emergencyForm.issue || ''} onChange={e => setEmergencyForm({...emergencyForm, issue: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-red-400 dark:text-white transition-all appearance-none cursor-pointer" required>
                <option value="" className="text-slate-400">{t.issuePlc}</option>
                <option value="Kerusakan Total" className="dark:bg-dark-card dark:text-white">{lang === 'id' ? 'Kerusakan Total' : 'Total Damage'}</option>
                <option value="Kerusakan Sebagian" className="dark:bg-dark-card dark:text-white">{lang === 'id' ? 'Kerusakan Sebagian' : 'Partial Damage'}</option>
                <option value="Perlu Perawatan" className="dark:bg-dark-card dark:text-white">{lang === 'id' ? 'Perlu Perawatan' : 'Maintenance Needed'}</option>
              </select>
            </div>

            {/* Kategori Kerusakan */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Kategori Kerusakan' : 'Issue Category'}</label>
              <select value={emergencyForm.category || ''} onChange={e => setEmergencyForm({...emergencyForm, category: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-red-400 dark:text-white transition-all appearance-none cursor-pointer" required>
                <option key="emer-cat-placeholder" value="" className="text-slate-400">{lang === 'id' ? 'Pilih Kategori' : 'Select Category'}</option>
                {vendorCategories.map((cat: any) => <option key={cat.id} value={cat.name} className="dark:bg-dark-card dark:text-white">{cat.name}</option>)}
              </select>
            </div>

            {/* Prioritas Penanganan */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Prioritas Penanganan' : 'Handling Priority'}</label>
              <select value={emergencyForm.priority || ''} onChange={e => setEmergencyForm({...emergencyForm, priority: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-red-400 dark:text-white transition-all appearance-none cursor-pointer" required>
                <option key="emer-priority-placeholder" value="" className="text-slate-400">{lang === 'id' ? 'Pilih Prioritas' : 'Select Priority'}</option>
                {categoryPriorities.map((cat: any) => <option key={cat.id} value={cat.name} className="dark:bg-dark-card dark:text-white">{cat.name}</option>)}
              </select>
            </div>

            {/* Deskripsi Kerusakan */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Deskripsi Kerusakan' : 'Damage Description'}</label>
              <textarea value={emergencyForm.desc || ''} onChange={e => setEmergencyForm({...emergencyForm, desc: e.target.value})} rows={4} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-sm font-semibold focus:ring-2 focus:ring-red-400 dark:text-white transition-all resize-none shadow-sm" placeholder={t.descPlc} required></textarea>
            </div>

            {/* Foto Aset */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{lang === 'id' ? 'Foto Aset' : 'Asset Photo'}</label>
              <input type="file" id="emergencyPhotoInput" className="hidden" accept="image/*" onChange={e => handlePhotoUpload(e, (val: string) => setEmergencyForm({...emergencyForm, photo: val}))} />
              <input type="file" id="emergencyCameraInput" className="hidden" accept="image/*" capture="environment" onChange={e => handlePhotoUpload(e, (val: string) => setEmergencyForm({...emergencyForm, photo: val}))} />
              
              <div className="w-full h-32 border-2 border-dashed border-red-100 dark:border-white/10 rounded-[28px] overflow-hidden relative bg-red-50/10 dark:bg-white/2 transition-all">
                {emergencyForm.photo ? (
                  <div className="relative w-full h-full group">
                    <img src={emergencyForm.photo} alt="Issue" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setEmergencyForm({...emergencyForm, photo: ''})}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex w-full h-full">
                    <label htmlFor="emergencyPhotoInput" className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-red-50 dark:hover:bg-white/5 transition-all group border-r border-red-50 dark:border-white/5">
                      <ImageIcon className="w-6 h-6 text-red-200 group-hover:text-red-400 transition-colors" />
                      <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{lang === 'id' ? 'Galeri' : 'Gallery'}</p>
                    </label>
                    <label htmlFor="emergencyCameraInput" className="flex-1 flex flex-col items-center justify-center cursor-pointer hover:bg-red-50 dark:hover:bg-white/5 transition-all group">
                      <Camera className="w-6 h-6 text-red-200 group-hover:text-red-400 transition-colors" />
                      <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">{lang === 'id' ? 'Kamera' : 'Camera'}</p>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <button 
          type="submit" 
          className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-6 rounded-[32px] font-black shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-1 transition-all duration-300 transform active:scale-[0.98] mt-6 flex items-center justify-center gap-4 uppercase text-[11px] tracking-[0.2em]"
        >
           <Send className="w-5 h-5" /> {t.sendEmg}
        </button>
      </form>
    </div>
  );
});

const HandlingView = React.memo(({ t, lang, reports, setSolvingReportId, vendors, isAdmin, handleDeleteAllReports, setPreviewPhoto }: any) => {
  const pendingReports = reports.filter((r: any) => r.status === 'pending');
  
  const priorityGroups = [
    { label: lang === 'id' ? 'Kritis' : 'Critical', key: 'Kritis', color: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-500/5' },
    { label: lang === 'id' ? 'Penting' : 'Important', key: 'Penting', color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/5' },
    { label: lang === 'id' ? 'Ringan' : 'Light', key: 'Ringan', color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/5' }
  ];

  return (
    <div className="bg-white dark:bg-dark-card p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
           </div>
           <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.handTitle}</h2>
              <p className="text-xs text-slate-400">{t.handSub}</p>
           </div>
        </div>
        {isAdmin && pendingReports.length > 0 && (
          <button 
            onClick={handleDeleteAllReports}
            className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {lang === 'id' ? 'Kosongkan Daftar' : 'Clear List'}
          </button>
        )}
      </div>
      
      {pendingReports.length === 0 ? (
        <div className="text-center py-20 bg-dashboard-bg dark:bg-white/5 rounded-[40px]">
           <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckSquare className="w-8 h-8" />
           </div>
           <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm">{lang === 'id' ? 'Semua Beres!' : 'All Clear!'}</h3>
           <p className="text-xs text-slate-400 mt-2 italic">{lang === 'id' ? 'Tidak ada laporan kerusakan pending.' : 'No pending damage reports.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {priorityGroups.map((group) => {
            const groupReports = pendingReports.filter((r: any) => (r.priority || 'Penting') === group.key || (r.priority === undefined && group.key === 'Penting'));
            
            return (
              <div key={group.key} className={`flex flex-col gap-6 p-6 rounded-[32px] ${group.bg} border border-slate-100 dark:border-white/5`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${group.color} animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.2)]`} />
                    <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">{group.label}</h2>
                  </div>
                  <span className="bg-white dark:bg-white/10 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-400 border border-slate-100 dark:border-white/5">
                    {groupReports.length}
                  </span>
                </div>

                <div className="space-y-6">
                  {groupReports.map((report: any) => {
                    const relevantVendors = vendors.filter((v: any) => v.category === report.category);
                    
                    return (
                      <div key={report.id} className="bg-white dark:bg-white/5 p-6 rounded-3xl space-y-6 shadow-sm hover:shadow-xl transition-all border border-slate-100 dark:border-white/5 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                        
                        <div className="flex justify-between items-start relative z-10">
                          <div 
                            onClick={() => setPreviewPhoto(report.photo)}
                            className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm border-2 border-white dark:border-white/10 group-hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                          >
                            <img src={report.photo} alt="Issue" className="w-full h-full object-cover" />
                          </div>
                          <div className="text-right">
                             <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                               report.issue === 'Kerusakan Total' ? 'bg-red-100 text-red-500 dark:bg-red-500/10' : 'bg-orange-100 text-orange-500 dark:bg-orange-500/10'
                             }`}>
                               {report.issue}
                             </span>
                             <p className="text-[8px] font-mono text-slate-400 mt-2">{new Date(report.timestamp).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>

                        <div className="space-y-4 flex-1 relative z-10">
                          <div>
                            <h4 className="font-extrabold text-slate-800 dark:text-white text-sm leading-tight">{report.name}</h4>
                            <p className="text-[9px] font-black text-accent-brown dark:text-accent-tan uppercase tracking-widest mt-1">
                               {report.code} <span className="text-slate-300 mx-1">•</span> {report.outlet}
                            </p>
                          </div>

                          <div className="p-4 bg-dashboard-bg/50 dark:bg-white/5 rounded-2xl border border-slate-50 dark:border-white/5">
                             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                               <AlertTriangle className="w-2.5 h-2.5 text-red-400" /> Detail
                             </div>
                             <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 italic">"{report.desc}"</p>
                          </div>

                          {relevantVendors.length > 0 && (
                            <div className="space-y-2">
                               {relevantVendors.map((v: any) => (
                                 <a key={v.id} href={`https://wa.me/${v.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-xl hover:bg-emerald-500/10 transition-colors group/vendor">
                                   <div className="text-[9px]">
                                      <p className="font-black text-slate-700 dark:text-emerald-400 uppercase leading-none group-hover/vendor:text-emerald-600 transition-colors">{v.companyName}</p>
                                      <p className="text-slate-400 font-bold uppercase text-[7px] mt-1 italic">{v.name}</p>
                                   </div>
                                   <Phone className="w-3 h-3 text-emerald-500" />
                                 </a>
                               ))}
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => setSolvingReportId(report.id)}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> {lang === 'id' ? 'Tandai Selesai' : 'Mark as Solved'}
                        </button>
                      </div>
                    );
                  })}
                  {groupReports.length === 0 && (
                    <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Kosong</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

const CategoryManagementView = React.memo(({ t, lang, categoryOutlets, categoryPlacements, categoryVendors, categoryOwnerships, categoryPriorities, handleCategorySubmit, handleDeleteCategory }: any) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
         <div className="w-12 h-12 bg-accent-purple/10 text-accent-purple rounded-2xl flex items-center justify-center">
            <Settings2 className="w-6 h-6" />
         </div>
         <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.catMgmtTitle}</h2>
            <p className="text-xs text-slate-400">{t.catMgmtSub}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Outlets */}
        <div className="bg-white dark:bg-dark-card p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm border border-slate-100 dark:border-white/5 space-y-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.catOutletTitle}</h3>
          <form onSubmit={e => { e.preventDefault(); const input = (e.target as any).querySelector('input'); handleCategorySubmit('outlet', input.value); input.value = ''; }} className="flex gap-3">
             <input type="text" className="flex-1 px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" placeholder={t.catNamePlc} required />
             <button type="submit" className="px-6 py-4 bg-gradient-primary text-white rounded-2xl font-extrabold text-[10px] uppercase shadow-lg shadow-accent-purple/20 transition-all hover:scale-105 active:scale-95"><PlusSquare className="w-4 h-4" /></button>
          </form>
          <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar pt-2">
            {categoryOutlets.map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-dashboard-bg dark:bg-white/5 rounded-2xl group transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                <button onClick={() => handleDeleteCategory('outlet', cat.id)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {categoryOutlets.length === 0 && <p className="text-center py-10 text-[10px] text-slate-300 font-bold uppercase tracking-widest">{t.catEmpty}</p>}
          </div>
        </div>

        {/* Placements */}
        <div className="bg-white dark:bg-dark-card p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm border border-slate-100 dark:border-white/5 space-y-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.catPlacementTitle}</h3>
          <form onSubmit={e => { e.preventDefault(); const input = (e.target as any).querySelector('input'); handleCategorySubmit('placement', input.value); input.value = ''; }} className="flex gap-3">
             <input type="text" className="flex-1 px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" placeholder={t.catNamePlc} required />
             <button type="submit" className="px-6 py-4 bg-gradient-primary text-white rounded-2xl font-extrabold text-[10px] uppercase shadow-lg shadow-accent-purple/20 transition-all hover:scale-105 active:scale-95"><PlusSquare className="w-4 h-4" /></button>
          </form>
          <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar pt-2">
            {categoryPlacements.map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-dashboard-bg dark:bg-white/5 rounded-2xl group transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                <button onClick={() => handleDeleteCategory('placement', cat.id)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {categoryPlacements.length === 0 && <p className="text-center py-10 text-[10px] text-slate-300 font-bold uppercase tracking-widest">{t.catEmpty}</p>}
          </div>
        </div>

        {/* Kepemilikan */}
        <div className="bg-white dark:bg-dark-card p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm border border-slate-100 dark:border-white/5 space-y-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{lang === 'id' ? 'Kategori Kepemilikan' : 'Ownership Categories'}</h3>
          <form onSubmit={e => { e.preventDefault(); const input = (e.target as any).querySelector('input'); handleCategorySubmit('ownership', input.value); input.value = ''; }} className="flex gap-3">
             <input type="text" className="flex-1 px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" placeholder={t.catNamePlc} required />
             <button type="submit" className="px-6 py-4 bg-gradient-primary text-white rounded-2xl font-extrabold text-[10px] uppercase shadow-lg shadow-accent-purple/20 transition-all hover:scale-105 active:scale-95"><PlusSquare className="w-4 h-4" /></button>
          </form>
          <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar pt-2">
            {categoryOwnerships.map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-dashboard-bg dark:bg-white/5 rounded-2xl group transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                <button onClick={() => handleDeleteCategory('ownership', cat.id)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {categoryOwnerships.length === 0 && <p className="text-center py-10 text-[10px] text-slate-300 font-bold uppercase tracking-widest">{t.catEmpty}</p>}
          </div>
        </div>

        {/* Prioritas */}
        <div className="bg-white dark:bg-dark-card p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm border border-slate-100 dark:border-white/5 space-y-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{lang === 'id' ? 'Kategori Prioritas' : 'Priority Categories'}</h3>
          <form onSubmit={e => { e.preventDefault(); const input = (e.target as any).querySelector('input'); handleCategorySubmit('priority', input.value); input.value = ''; }} className="flex gap-3">
             <input type="text" className="flex-1 px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" placeholder={t.catNamePlc} required />
             <button type="submit" className="px-6 py-4 bg-gradient-primary text-white rounded-2xl font-extrabold text-[10px] uppercase shadow-lg shadow-accent-purple/20 transition-all hover:scale-105 active:scale-95"><PlusSquare className="w-4 h-4" /></button>
          </form>
          <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar pt-2">
            {categoryPriorities.map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-dashboard-bg dark:bg-white/5 rounded-2xl group transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                <button onClick={() => handleDeleteCategory('priority', cat.id)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {categoryPriorities.length === 0 && <p className="text-center py-10 text-[10px] text-slate-300 font-bold uppercase tracking-widest">{t.catEmpty}</p>}
          </div>
        </div>

        {/* Vendor Categories */}
        <div className="bg-white dark:bg-dark-card p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm border border-slate-100 dark:border-white/5 space-y-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Kategori Vendor</h3>
          <form onSubmit={e => { 
            e.preventDefault(); 
            const input = (e.target as any).querySelector('input'); 
            handleCategorySubmit('vendor', input.value); 
            input.value = ''; 
          }} className="flex gap-3">
             <input type="text" className="flex-1 px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" placeholder={t.catNamePlc} required />
             <button type="submit" className="px-6 py-4 bg-gradient-primary text-white rounded-2xl font-extrabold text-[10px] uppercase shadow-lg shadow-accent-purple/20 transition-all hover:scale-105 active:scale-95"><PlusSquare className="w-4 h-4" /></button>
          </form>
          <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar pt-2">
            {categoryVendors.map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-dashboard-bg dark:bg-white/5 rounded-2xl group transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cat.name}</span>
                <button onClick={() => handleDeleteCategory('vendor', cat.id)} className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {categoryVendors.length === 0 && <p className="text-center py-10 text-[10px] text-slate-300 font-bold uppercase tracking-widest">{t.catEmpty}</p>}
          </div>
        </div>
      </div>
    </div>
  );
});

const UserManagementView = React.memo(({ t, allUsers, editingUserId, setEditingUserId, editUserForm, setEditUserForm, handleUpdateUserRole, handleDeleteUser, currentUser }: any) => {
  return (
    <div className="bg-white dark:bg-dark-card p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-10">
         <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6" />
         </div>
         <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.usersTitle}</h2>
            <p className="text-xs text-slate-400">{t.usersSub}</p>
         </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-white/5">
              <th className="px-6 py-5 whitespace-nowrap">{t.username}</th>
              <th className="px-6 py-5 whitespace-nowrap">{t.email}</th>
              <th className="px-6 py-5 whitespace-nowrap">{t.access}</th>
              <th className="px-6 py-5 text-right whitespace-nowrap">{t.action}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-white/5">
            {allUsers.map((user: any) => (
              <tr key={user.uid} className="hover:bg-dashboard-bg/50 dark:hover:bg-white/5 transition-colors group">
                <td className="px-6 py-5 whitespace-nowrap">
                   {editingUserId === user.uid ? (
                     <div className="flex flex-col gap-1">
                       <input 
                         type="text" 
                         value={editUserForm.name || ''} 
                         onChange={e => setEditUserForm({...editUserForm, name: e.target.value})}
                         className="px-4 py-2 bg-white dark:bg-dark-dashboard rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold outline-none ring-2 ring-transparent focus:ring-accent-purple transition-all"
                         placeholder={t.name}
                       />
                     </div>
                   ) : (
                     <div className="font-bold text-slate-800 dark:text-slate-200">{user.name}</div>
                   )}
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                   {editingUserId === user.uid ? (
                     <input 
                       type="email" 
                       value={editUserForm.email || ''} 
                       onChange={e => setEditUserForm({...editUserForm, email: e.target.value})}
                       className="px-4 py-2 bg-white dark:bg-dark-dashboard rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold outline-none ring-2 ring-transparent focus:ring-accent-purple transition-all"
                       placeholder={t.email}
                     />
                   ) : (
                     <div className="font-medium text-slate-500 dark:text-slate-400 text-xs">{user.email}</div>
                   )}
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                   {editingUserId === user.uid ? (
                     <select 
                       value={editUserForm.type} 
                       onChange={e => setEditUserForm({...editUserForm, type: e.target.value})}
                       className="px-4 py-2 bg-white dark:bg-dark-dashboard rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold outline-none appearance-none cursor-pointer"
                     >
                       {currentUser?.type === 'Superadmin' && <option key="Superadmin" value="Superadmin">Superadmin</option>}
                       <option key="Manajemen" value="Manajemen">Manajemen</option>
                       <option key="Teknis" value="Teknis">Teknis</option>
                       <option key="Store Manager" value="Store Manager">Store Manager</option>
                     </select>
                   ) : (
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                       user.type === 'Superadmin' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' :
                       user.type === 'Manajemen' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/10' :
                       user.type === 'Teknis' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10' :
                       'bg-slate-100 text-slate-600 dark:bg-white/10'
                     }`}>
                       {user.type}
                     </span>
                   )}
                </td>
                <td className="px-6 py-5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    {editingUserId === user.uid ? (
                      <>
                        <button onClick={() => handleUpdateUserRole(user.uid)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setEditingUserId(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                            setEditingUserId(user.uid);
                            setEditUserForm(user);
                          }} 
                          disabled={user.type === 'Superadmin' && currentUser?.type !== 'Superadmin'}
                          className={`p-2 rounded-lg transition-colors ${user.type === 'Superadmin' && currentUser?.type !== 'Superadmin' ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-accent-purple hover:bg-purple-50'}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.uid)} 
                          disabled={user.type === 'Superadmin'}
                          className={`p-2 rounded-lg transition-colors ${user.type === 'Superadmin' ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

const VendorManagementView = React.memo(({ t, lang, activeCatSub, setActiveCatSub, vendors, vendorCategories, vendorForm, setVendorForm, handleVendorSubmit, handleDeleteVendor, editingVendorId, setEditingVendorId, currentUser }: any) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
           </div>
           <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.vendorMgmt}</h2>
              <p className="text-xs text-slate-400">Kelola daftar pihak ketiga untuk layanan & pengadaan.</p>
           </div>
        </div>
        <div className="flex bg-white dark:bg-dark-card p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
           <button onClick={() => setActiveCatSub('Service')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCatSub === 'Service' ? 'bg-gradient-primary text-white shadow-lg shadow-accent-purple/20' : 'text-slate-400 hover:text-slate-600'}`}>{t.service}</button>
           <button onClick={() => setActiveCatSub('Procurement')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCatSub === 'Procurement' ? 'bg-gradient-primary text-white shadow-lg shadow-accent-purple/20' : 'text-slate-400 hover:text-slate-600'}`}>{t.procurement}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-dark-card p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm border border-slate-100 dark:border-white/5 space-y-8 h-fit">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{editingVendorId ? 'Edit Vendor' : 'Register Vendor'}</h3>
          <form onSubmit={handleVendorSubmit} className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">{t.vendorName}</label>
                <input type="text" value={vendorForm.name || ''} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" placeholder="Nama PIC Vendor" required />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">{t.compName}</label>
                <input type="text" value={vendorForm.companyName || ''} onChange={e => setVendorForm({...vendorForm, companyName: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" placeholder="Nama PT/CV Vendor" required />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">{t.wa}</label>
                <input type="text" value={vendorForm.whatsapp || ''} onChange={e => setVendorForm({...vendorForm, whatsapp: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" placeholder="08..." required />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">{t.socmed}</label>
                <input type="text" value={vendorForm.socialMedia || ''} onChange={e => setVendorForm({...vendorForm, socialMedia: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner" placeholder="@instagram / link" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">{t.vendorCat}</label>
                <select value={vendorForm.category || ''} onChange={e => setVendorForm({...vendorForm, category: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all appearance-none cursor-pointer" required>
                   <option key="vendor-cat-placeholder" value="">Pilih Kategori</option>
                   {vendorCategories.map((cat: any) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">{lang === 'id' ? 'Deskripsi' : 'Description'}</label>
                <textarea value={vendorForm.description || ''} onChange={e => setVendorForm({...vendorForm, description: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-purple dark:text-white transition-all shadow-inner resize-none h-24" placeholder={lang === 'id' ? "Info detail vendor..." : "Vendor detail info..."} />
             </div>
             <button type="submit" className="w-full py-5 bg-gradient-primary text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-accent-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {editingVendorId ? 'Update Data Vendor' : 'Simpan Data Vendor'}
             </button>
             {editingVendorId && (
               <button type="button" onClick={() => {setEditingVendorId(null); setVendorForm({});}} className="w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-full text-[10px] font-bold uppercase tracking-widest mt-2 transition-all">Batal Edit</button>
             )}
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6 md:col-span-2">
           {vendors.filter(v => v.type === activeCatSub).map(vendor => (
             <div key={vendor.id} className="bg-white dark:bg-dark-card p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-white/5 space-y-6 group hover:shadow-xl transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-purple/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-accent-purple/10 transition-colors" />
                <div className="flex justify-between items-start relative z-10">
                   <div className="w-12 h-12 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center shadow-md border border-slate-50 dark:border-white/10 group-hover:rotate-6 transition-transform">
                      {activeCatSub === 'Service' ? <Wrench className="w-6 h-6 text-accent-purple" /> : <Archive className="w-6 h-6 text-accent-pink" />}
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => {setEditingVendorId(vendor.id); setVendorForm(vendor);}} className="p-2 text-slate-300 hover:text-accent-purple transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteVendor(vendor.id)} className="p-2 text-slate-300 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
                <div className="relative z-10">
                   <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{vendor.companyName}</h4>
                   <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{vendor.name}</p>
                </div>
                {vendor.description && (
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 line-clamp-2 italic leading-relaxed">
                    "{vendor.description}"
                  </p>
                )}
                <div className="pt-4 space-y-3 relative z-10">
                   <div className="flex items-center gap-3">
                      <Phone className="w-3.5 h-3.5 text-accent-purple" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{vendor.whatsapp}</span>
                   </div>
                   {vendor.socialMedia && (
                     <div className="flex items-center gap-3">
                        <Instagram className="w-3.5 h-3.5 text-accent-pink" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{vendor.socialMedia}</span>
                     </div>
                   )}
                </div>
                <div className="pt-4 border-t border-slate-50 dark:border-white/5 relative z-10">
                   <span className="px-3 py-1.5 bg-accent-purple/5 text-accent-purple rounded-xl text-[9px] font-black uppercase tracking-widest">{vendor.category}</span>
                </div>
             </div>
           ))}
           {vendors.filter(v => v.type === activeCatSub).length === 0 && (
             <div className="col-span-full h-64 bg-slate-50/50 dark:bg-white/2 rounded-[40px] flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/5">
                <Search className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum ada vendor terdaftar</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
});

const ProcurementView = React.memo(({ lang, procurementForm, setProcurementForm, handleProcurementSubmit, handlePhotoUpload, vendorCategories, categoryOutlets, formatRupiah, t, procurements, onlyAdd, onlyList, setPreviewPhoto }: any) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
         <div className="w-12 h-12 bg-accent-pink/10 text-accent-pink rounded-2xl flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
         </div>
         <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{onlyList ? (lang === 'id' ? 'Daftar Pengadaan' : 'Procurement List') : (lang === 'id' ? 'Registrasi Pengadaan' : 'Procurement Registration')}</h2>
            <p className="text-xs text-slate-400">{onlyList ? 'Lihat riwayat pengadaan aset.' : 'Catat setiap pengadaan aset baru ke dalam sistem.'}</p>
         </div>
      </div>

      <div className={`grid grid-cols-1 ${onlyList || onlyAdd ? 'xl:grid-cols-1' : 'xl:grid-cols-3'} gap-8`}>
        {!onlyList && (
           <div className={`bg-white dark:bg-dark-card p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm border border-slate-100 dark:border-white/5 space-y-8 h-fit ${!onlyAdd ? 'lg:sticky lg:top-10' : ''}`}>
             <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Input Procurement</h3>
             <form onSubmit={handleProcurementSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Item Name</label>
                      <input type="text" value={procurementForm.itemName || ''} onChange={e => setProcurementForm({...procurementForm, itemName: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-pink dark:text-white transition-all shadow-inner" placeholder="Nama barang yang dibeli" required />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Qty</label>
                      <input type="number" value={procurementForm.quantity === undefined ? '' : procurementForm.quantity} onChange={e => setProcurementForm({...procurementForm, quantity: e.target.value === '' ? undefined : Number(e.target.value)})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-pink dark:text-white transition-all shadow-inner" required />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Unit</label>
                      <input type="text" value={procurementForm.unit || ''} onChange={e => setProcurementForm({...procurementForm, unit: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-pink dark:text-white transition-all shadow-inner" placeholder="Pcs/Unit" required />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Price / Unit</label>
                     <div className="relative">
                        <span className="absolute left-6 top-4 text-xs font-black text-slate-400">Rp</span>
                        <input type="number" value={procurementForm.pricePerUnit === undefined ? '' : procurementForm.pricePerUnit} onChange={e => setProcurementForm({...procurementForm, pricePerUnit: e.target.value === '' ? undefined : Number(e.target.value)})} className="w-full pl-14 pr-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-pink dark:text-white transition-all shadow-inner" required />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Procured Via</label>
                     <input type="text" value={procurementForm.procurementVia || ''} onChange={e => setProcurementForm({...procurementForm, procurementVia: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-pink dark:text-white transition-all shadow-inner" placeholder="E.g. Tokopedia, Offline Store" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Category</label>
                      <select value={procurementForm.category || ''} onChange={e => setProcurementForm({...procurementForm, category: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-pink dark:text-white transition-all appearance-none cursor-pointer" required>
                         <option key="proc-cat-placeholder" value="">Pilih Kategori</option>
                         {vendorCategories.map((cat: any) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Target Outlet</label>
                      <select value={procurementForm.outlet || ''} onChange={e => setProcurementForm({...procurementForm, outlet: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-pink dark:text-white transition-all appearance-none cursor-pointer" required>
                         <option key="proc-outlet-placeholder" value="">Pilih Outlet</option>
                         {categoryOutlets.map((cat: any) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                      </select>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">{lang === 'id' ? 'Deskripsi/Catatan' : 'Description/Note'}</label>
                   <textarea value={procurementForm.description || ''} onChange={e => setProcurementForm({...procurementForm, description: e.target.value})} className="w-full px-6 py-4 bg-dashboard-bg dark:bg-white/5 border-none rounded-2xl outline-none text-xs font-bold focus:ring-2 focus:ring-accent-pink dark:text-white transition-all shadow-inner h-24 resize-none" placeholder={lang === 'id' ? "Tambahkan detail pengadaan..." : "Add procurement details..."} required />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Photo Note / Receipt</label>
                   <input type="file" id="procPhotoInput" className="hidden" accept="image/*" onChange={e => handlePhotoUpload(e, (val: string) => setProcurementForm({...procurementForm, photo: val}))} />
                   <label htmlFor="procPhotoInput" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-100 dark:border-white/10 rounded-[32px] cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all overflow-hidden relative">
                      {procurementForm.photo ? <img src={procurementForm.photo} alt="Receipt" className="w-full h-full object-cover" /> : <div className="text-center"><Camera className="w-8 h-8 text-slate-200 mx-auto" /><p className="text-[9px] font-black text-slate-300 uppercase mt-2">Upload Nota</p></div>}
                   </label>
                </div>
                <div className="pt-4 bg-accent-pink/5 p-6 rounded-[32px] border border-accent-pink/10">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Submission</p>
                   <h4 className="text-xl font-black text-accent-pink">{formatRupiah((Number(procurementForm.quantity) || 0) * (Number(procurementForm.pricePerUnit) || 0))}</h4>
                </div>
                <button type="submit" className="w-full py-5 bg-gradient-primary text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl shadow-accent-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Submit Procurement</button>
             </form>
           </div>
        )}

        {!onlyAdd && (
           <div className={`${onlyList ? 'col-span-1' : 'md:col-span-2'} space-y-6`}>
              <div className="bg-white dark:bg-dark-card p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm border border-slate-100 dark:border-white/5">
                 <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Procurement History</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                       <thead>
                          <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-white/5">
                             <th className="px-6 py-5 whitespace-nowrap">Nota</th>
                             <th className="px-6 py-5 whitespace-nowrap">Item</th>
                             <th className="px-6 py-5 whitespace-nowrap">Qty/Unit</th>
                             <th className="px-6 py-5 whitespace-nowrap">Price/Unit</th>
                             <th className="px-6 py-5 whitespace-nowrap">Total</th>
                             <th className="px-6 py-5 whitespace-nowrap">Outlet</th>
                             <th className="px-6 py-5 whitespace-nowrap">Date</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                          {procurements.map(p => (
                            <tr key={p.id} className="hover:bg-dashboard-bg/50 dark:hover:bg-white/5 transition-colors group">
                               <td className="px-6 py-5 whitespace-nowrap">
                                  <div 
                                     onClick={() => setPreviewPhoto(p.photo)}
                                     className="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-white dark:border-white/10 group-hover:scale-110 transition-transform cursor-pointer"
                                  >
                                     {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 dark:bg-white/5 flex items-center justify-center"><FileText className="w-4 h-4 text-slate-300" /></div>}
                                  </div>
                               </td>
                               <td className="px-6 py-5 whitespace-nowrap">
                                  <div className="font-black text-slate-800 dark:text-slate-100 text-xs">{p.itemName}</div>
                                  <div className="text-[9px] font-bold text-accent-pink uppercase tracking-widest mt-1">{p.category}</div>
                               </td>
                               <td className="px-6 py-5 whitespace-nowrap font-bold text-slate-500 dark:text-slate-400 text-xs">{p.quantity} {p.unit}</td>
                               <td className="px-6 py-5 whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-400">{formatRupiah(p.pricePerUnit)}</td>
                               <td className="px-6 py-5 whitespace-nowrap font-black text-accent-pink text-xs">{formatRupiah(p.totalPrice)}</td>
                               <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-slate-500 dark:text-slate-400">{p.outlet}</td>
                               <td className="px-6 py-5 whitespace-nowrap text-[10px] font-mono text-slate-400">{p.timestamp.split('T')[0]}</td>
                            </tr>
                          ))}
                          {procurements.length === 0 && (
                            <tr><td colSpan={7} className="text-center py-20 text-[10px] font-black text-slate-300 uppercase tracking-widest">No procurement history</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
});
