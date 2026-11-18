'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

const BACKEND_ORIGIN = 'http://localhost:8080';

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface CarItem {
  id: number;
  model_name: string;
  year: number;
  price: number;
  transmission: string;
  fuel_type: string;
  mileage: number;
  status: string;
  brand?: { name: string };
  category?: { name: string };
  images?: { id: number; image_url: string; is_primary: boolean }[];
}

interface TestDriveItem {
  id: number;
  car_id: number;
  scheduled_date: string;
  scheduled_time: string;
  notes?: string;
  status: string;
  user?: { name: string; email: string; phone?: string };
  car?: { model_name: string; brand?: { name: string } };
}

interface TransactionItem {
  id: number;
  invoice_number?: string;
  car_id: number;
  payment_method: string;
  final_price?: number;
  car_price?: number;
  tenor_months?: number;
  monthly_installment?: number;
  status: string;
  user?: { name: string; email: string };
  car?: { model_name: string; brand?: { name: string } };
}

interface ConsultationItem {
  id: number;
  car_id?: number;
  subject: string;
  message: string;
  reply?: string;
  status: string;
  user?: { name: string; email: string };
  car?: { model_name: string; brand?: { name: string } };
}

interface PromotionItem {
  id: number;
  code: string;
  title: string;
  description?: string;
  discount_amount: number;
  valid_until: string;
}

function extractArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.data?.cars)) return raw.data.cars;
  return [];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'test-drives' | 'transactions' | 'consultations' | 'cars' | 'promotions'
  >('test-drives');

  const [testDrives, setTestDrives] = useState<TestDriveItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [cars, setCars] = useState<CarItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);

  // Reply input state per consultation ID
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});

  // Form Tambah Mobil Baru
  const [brandId, setBrandId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [modelName, setModelName] = useState<string>('');
  const [year, setYear] = useState<string>('2023');
  const [price, setPrice] = useState<string>('200000000');
  const [condition, setCondition] = useState<string>('used');
  const [mileage, setMileage] = useState<string>('15000');
  const [transmission, setTransmission] = useState<string>('Automatic');
  const [fuelType, setFuelType] = useState<string>('Bensin');
  const [color, setColor] = useState<string>('Hitam');
  const [engineCapacity, setEngineCapacity] = useState<string>('1500');
  const [seatCapacity, setSeatCapacity] = useState<string>('5');
  const [fuelConsumption, setFuelConsumption] = useState<string>('14.5');
  const [description, setDescription] = useState<string>('');

  // Form Buat Promo
  const [promoCode, setPromoCode] = useState('');
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('5000000');
  const [promoValidUntil, setPromoValidUntil] = useState('2026-12-31');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCarId, setUploadingCarId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadDashboardData = async () => {
    try {
      const [tdRes, txRes, consRes, carsRes, brandsRes, catsRes, promoRes] = await Promise.allSettled([
        apiFetch('/sales/test-drives'),
        apiFetch('/sales/transactions'),
        apiFetch('/sales/consultations'),
        apiFetch('/cars?limit=100'),
        apiFetch('/brands'),
        apiFetch('/categories'),
        apiFetch('/promotions'),
      ]);

      if (tdRes.status === 'fulfilled') setTestDrives(extractArray(tdRes.value));
      if (txRes.status === 'fulfilled') setTransactions(extractArray(txRes.value));
      if (consRes.status === 'fulfilled') setConsultations(extractArray(consRes.value));
      if (carsRes.status === 'fulfilled') setCars(extractArray(carsRes.value));
      if (promoRes.status === 'fulfilled') setPromotions(extractArray(promoRes.value));

      if (brandsRes.status === 'fulfilled') {
        const bList = extractArray(brandsRes.value);
        setBrands(bList);
        if (bList.length > 0 && !brandId) setBrandId(String(bList[0].id));
      }

      if (catsRes.status === 'fulfilled') {
        const cList = extractArray(catsRes.value);
        setCategories(cList);
        if (cList.length > 0 && !categoryId) setCategoryId(String(cList[0].id));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');

    if (!token || !rawUser) {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(rawUser);
      if (parsed.role !== 'admin' && parsed.role !== 'sales') {
        alert('Akses ditolak: Halaman ini khusus Admin & Sales.');
        router.push('/');
        return;
      }
      setRole(parsed.role);
    } catch {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, []);

  const handleUpdateTestDrive = async (id: number, status: string) => {
    setFeedback(null);
    try {
      await apiFetch(`/sales/test-drives/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setFeedback({ type: 'success', text: `Status test drive #${id} diubah menjadi ${status}.` });
      await loadDashboardData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal memperbarui status test drive.' });
    }
  };

  const handleUpdateTransaction = async (id: number, status: string) => {
    setFeedback(null);
    try {
      await apiFetch(`/sales/transactions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setFeedback({ type: 'success', text: `Status transaksi #${id} diubah menjadi ${status}.` });
      await loadDashboardData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal memperbarui status transaksi.' });
    }
  };

  const handleReplyConsultation = async (id: number) => {
    const reply = (replyTexts[id] || '').trim();
    if (!reply) return;
    setFeedback(null);

    try {
      await apiFetch(`/sales/consultations/${id}/reply`, {
        method: 'PATCH',
        body: JSON.stringify({ reply }),
      });
      setFeedback({ type: 'success', text: `Balasan konsultasi #${id} berhasil dikirim.` });
      setReplyTexts((prev) => ({ ...prev, [id]: '' }));
      await loadDashboardData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal mengirim balasan.' });
    }
  };

  const handleCreateCar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      await apiFetch('/admin/cars', {
        method: 'POST',
        body: JSON.stringify({
          brand_id: Number(brandId),
          category_id: Number(categoryId),
          model_name: modelName,
          year: Number(year),
          price: Number(price),
          condition,
          mileage: Number(mileage) || 0,
          transmission,
          fuel_type: fuelType,
          color,
          status: 'available',
          engine_capacity: Number(engineCapacity) || 1500,
          seat_capacity: Number(seatCapacity) || 5,
          fuel_consumption: Number(fuelConsumption) || 12.0,
          description,
        }),
      });

      setFeedback({ type: 'success', text: `Unit "${modelName}" berhasil ditambahkan ke katalog!` });
      setModelName('');
      setDescription('');
      await loadDashboardData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal menambahkan unit mobil.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCar = async (id: number, name: string) => {
    if (!confirm(`Hapus unit "${name}" dari katalog showroom?`)) return;
    setFeedback(null);
    try {
      await apiFetch(`/admin/cars/${id}`, { method: 'DELETE' });
      setFeedback({ type: 'success', text: `Unit "${name}" berhasil dihapus.` });
      await loadDashboardData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal menghapus unit mobil.' });
    }
  };

  const handleUploadImages = async (carId: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFeedback(null);
    setUploadingCarId(carId);

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('images', file);
    });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_ORIGIN}/api/v1/admin/cars/${carId}/images`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Gagal mengunggah foto');

      setFeedback({ type: 'success', text: `Foto unit #${carId} berhasil diunggah!` });
      await loadDashboardData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal mengunggah foto.' });
    } finally {
      setUploadingCarId(null);
    }
  };

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      await apiFetch('/admin/promotions', {
        method: 'POST',
        body: JSON.stringify({
          code: promoCode.toUpperCase(),
          title: promoTitle,
          description: promoDesc,
          discount_amount: Number(promoDiscount),
          valid_until: promoValidUntil,
        }),
      });
      setFeedback({ type: 'success', text: `Promo "${promoCode.toUpperCase()}" berhasil dibuat!` });
      setPromoCode('');
      setPromoTitle('');
      setPromoDesc('');
      await loadDashboardData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal membuat promo.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10 bg-[#090b10]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-[0.22em] text-amber-400 font-semibold">
              Showroom Command Center
            </span>
            <h1 className="text-3xl font-bold text-white mt-1">
              Portal Operasional {role === 'admin' ? 'Admin' : 'Sales'}
            </h1>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <div className="px-4 py-2.5 rounded-xl bg-[#10131c] border border-white/10">
              <span className="text-slate-400 block">Test Drive</span>
              <strong className="text-base text-white">{testDrives.length}</strong>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-[#10131c] border border-white/10">
              <span className="text-slate-400 block">Transaksi</span>
              <strong className="text-base text-emerald-400">{transactions.length}</strong>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-[#10131c] border border-white/10">
              <span className="text-slate-400 block">Konsultasi</span>
              <strong className="text-base text-amber-400">{consultations.length}</strong>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-[#10131c] border border-white/10">
              <span className="text-slate-400 block">Total Unit</span>
              <strong className="text-base text-blue-400">{cars.length}</strong>
            </div>
          </div>
        </header>

        {/* Tab Navigasi */}
        <div className="flex flex-wrap gap-2.5 mb-8 border-b border-white/10 pb-4">
          <button
            onClick={() => {
              setActiveTab('test-drives');
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'test-drives'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-[#10131c] text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            Test Drive ({testDrives.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('transactions');
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-[#10131c] text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            Transaksi ({transactions.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('consultations');
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'consultations'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-[#10131c] text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            Konsultasi ({consultations.length})
          </button>

          {role === 'admin' && (
            <>
              <button
                onClick={() => {
                  setActiveTab('cars');
                  setFeedback(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  activeTab === 'cars'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-[#10131c] text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                Stok Mobil ({cars.length})
              </button>

              <button
                onClick={() => {
                  setActiveTab('promotions');
                  setFeedback(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  activeTab === 'promotions'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-[#10131c] text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                Promo ({promotions.length})
              </button>
            </>
          )}
        </div>

        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {loading ? (
          <p className="text-slate-400 animate-pulse text-sm">Memuat data portal...</p>
        ) : (
          <>
            {/* TAB 1: TEST DRIVE */}
            {activeTab === 'test-drives' && (
              <div className="space-y-3">
                {testDrives.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#10131c] border border-white/10 text-center text-slate-400 text-sm">
                    Belum ada pengajuan test drive masuk.
                  </div>
                ) : (
                  testDrives.map((td) => (
                    <div
                      key={td.id}
                      className="p-5 rounded-2xl bg-[#10131c] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm">
                            {td.car?.brand?.name ? `${td.car.brand.name} ` : ''}
                            {td.car?.model_name || `Mobil #${td.car_id}`}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/10 text-amber-300">
                            {td.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Pemohon: <strong>{td.user?.name || 'Customer'}</strong> ({td.user?.email || '-'})
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Jadwal: <strong>{td.scheduled_date}</strong> pukul <strong>{td.scheduled_time}</strong>
                        </p>
                        {td.notes && <p className="text-xs text-slate-500 mt-1">Catatan: {td.notes}</p>}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleUpdateTestDrive(td.id, 'approved')}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateTestDrive(td.id, 'completed')}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                        >
                          Selesai
                        </button>
                        <button
                          onClick={() => handleUpdateTestDrive(td.id, 'rejected')}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: TRANSAKSI */}
            {activeTab === 'transactions' && (
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#10131c] border border-white/10 text-center text-slate-400 text-sm">
                    Belum ada transaksi pemesanan unit.
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-5 rounded-2xl bg-[#10131c] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {tx.invoice_number && (
                            <span className="text-xs font-mono text-amber-400">{tx.invoice_number}</span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/10 text-amber-300">
                            {tx.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-white text-sm mt-1">
                          {tx.car?.brand?.name ? `${tx.car.brand.name} ` : ''}
                          {tx.car?.model_name || `Mobil #${tx.car_id}`}
                        </h3>
                        <p className="text-xs text-slate-300 mt-1">
                          Pembeli: <strong>{tx.user?.name || 'Customer'}</strong> ({tx.user?.email || '-'})
                        </p>
                        <p className="text-xs text-emerald-400 font-semibold mt-1">
                          Total: Rp {Number(tx.final_price || tx.car_price || 0).toLocaleString('id-ID')} •{' '}
                          <span className="uppercase text-slate-300">{tx.payment_method}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleUpdateTransaction(tx.id, 'confirmed')}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                        >
                          Konfirmasi DP/Order
                        </button>
                        <button
                          onClick={() => handleUpdateTransaction(tx.id, 'completed')}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                        >
                          Lunas (Sold)
                        </button>
                        <button
                          onClick={() => handleUpdateTransaction(tx.id, 'cancelled')}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 cursor-pointer"
                        >
                          Batalkan
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: KONSULTASI MASUK */}
            {activeTab === 'consultations' && (
              <div className="space-y-4">
                {consultations.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#10131c] border border-white/10 text-center text-slate-400 text-sm">
                    Belum ada pesan konsultasi dari pembeli.
                  </div>
                ) : (
                  consultations.map((c) => (
                    <div
                      key={c.id}
                      className="p-6 rounded-2xl bg-[#10131c] border border-white/10 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[11px] text-amber-400 font-semibold uppercase">
                            Dari: {c.user?.name || 'Buyer'} ({c.user?.email || '-'})
                            {c.car?.model_name ? ` • Unit: ${c.car.model_name}` : ''}
                          </span>
                          <h3 className="font-bold text-white text-base mt-0.5">{c.subject}</h3>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/10 text-amber-300">
                          {c.reply ? 'replied' : c.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 bg-[#090b10] p-4 rounded-xl border border-white/5">
                        {c.message}
                      </p>

                      {c.reply && (
                        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200">
                          <strong>Balasan Terkirim:</strong> {c.reply}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={replyTexts[c.id] || ''}
                          onChange={(e) =>
                            setReplyTexts((prev) => ({ ...prev, [c.id]: e.target.value }))
                          }
                          placeholder="Tulis balasan untuk pembeli..."
                          className="flex-1 px-4 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleReplyConsultation(c.id)}
                          className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Kirim Balasan
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: KELOLA STOK MOBIL (ADMIN ONLY) */}
            {activeTab === 'cars' && role === 'admin' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <form
                  onSubmit={handleCreateCar}
                  className="lg:col-span-5 rounded-2xl bg-[#10131c] border border-white/10 p-6 h-fit space-y-3.5"
                >
                  <h2 className="text-base font-bold text-white pb-2 border-b border-white/10">
                    Tambah Unit Mobil Baru
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Merek *</label>
                      <select
                        required
                        value={brandId}
                        onChange={(e) => setBrandId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                      >
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Kategori *</label>
                      <select
                        required
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Nama Model Mobil *</label>
                    <input
                      type="text"
                      required
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="Contoh: Toyota Yaris GR Sport"
                      className="w-full px-3 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Tahun *</label>
                      <input
                        type="number"
                        required
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Harga (Rp) *</label>
                      <input
                        type="number"
                        required
                        step={1000000}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Transmisi *</label>
                      <select
                        value={transmission}
                        onChange={(e) => setTransmission(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                      >
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Bahan Bakar *</label>
                      <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                      >
                        <option value="Bensin">Bensin</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Listrik">Listrik</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">KM</label>
                      <input
                        type="number"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Mesin (cc)</label>
                      <input
                        type="number"
                        value={engineCapacity}
                        onChange={(e) => setEngineCapacity(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Kursi</label>
                      <input
                        type="number"
                        value={seatCapacity}
                        onChange={(e) => setSeatCapacity(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Warna</label>
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Kondisi</label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                      >
                        <option value="used">Bekas (Used)</option>
                        <option value="new">Baru (New)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Deskripsi Unit</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Pajak panjang, servis rutin bengkel resmi..."
                      className="w-full px-3 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    {submitting ? 'Menyimpan...' : '+ Simpan Unit Mobil'}
                  </button>
                </form>

                {/* Daftar Stok Mobil */}
                <div className="lg:col-span-7 space-y-3">
                  <h2 className="text-base font-bold text-white">Daftar Inventaris Unit</h2>
                  {cars.map((car) => {
                    const photoCount = car.images?.length || 0;
                    const isUploading = uploadingCarId === car.id;

                    return (
                      <div
                        key={car.id}
                        className="p-4 rounded-2xl bg-[#10131c] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-sm text-white">
                              {car.brand?.name ? `${car.brand.name} ` : ''}
                              {car.model_name} ({car.year})
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase bg-white/10 text-emerald-400">
                              {car.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-slate-300">
                              {photoCount} Foto
                            </span>
                          </div>
                          <p className="text-xs text-amber-400 font-bold mt-1">
                            Rp {Number(car.price).toLocaleString('id-ID')}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {car.transmission} • {car.fuel_type} • {car.mileage?.toLocaleString('id-ID')} km
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <label className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/30 hover:bg-amber-400/25 cursor-pointer">
                            {isUploading ? 'Mengunggah...' : '+ Foto'}
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              disabled={isUploading}
                              className="hidden"
                              onChange={(e) => handleUploadImages(car.id, e.target.files)}
                            />
                          </label>

                          <button
                            onClick={() => handleDeleteCar(car.id, car.model_name)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: KELOLA PROMO (ADMIN ONLY) */}
            {activeTab === 'promotions' && role === 'admin' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <form
                  onSubmit={handleCreatePromotion}
                  className="lg:col-span-5 rounded-2xl bg-[#10131c] border border-white/10 p-6 h-fit space-y-4"
                >
                  <h2 className="text-base font-bold text-white pb-2 border-b border-white/10">
                    Buat Kode Promo Baru
                  </h2>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Kode Promo *</label>
                    <input
                      type="text"
                      required
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: PRESTIGE10JT"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Judul Promo *</label>
                    <input
                      type="text"
                      required
                      value={promoTitle}
                      onChange={(e) => setPromoTitle(e.target.value)}
                      placeholder="Potongan Akhir Tahun Rp 10 Juta"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Nominal Diskon (Rp) *</label>
                      <input
                        type="number"
                        required
                        step={500000}
                        value={promoDiscount}
                        onChange={(e) => setPromoDiscount(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Berlaku Sampai *</label>
                      <input
                        type="date"
                        required
                        value={promoValidUntil}
                        onChange={(e) => setPromoValidUntil(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Deskripsi</label>
                    <textarea
                      rows={2}
                      value={promoDesc}
                      onChange={(e) => setPromoDesc(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    {submitting ? 'Menyimpan...' : '+ Terbitkan Promo'}
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-3">
                  <h2 className="text-base font-bold text-white">Daftar Promo Aktif</h2>
                  {promotions.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-[#10131c] border border-white/10 text-center text-slate-400 text-sm">
                      Belum ada promo aktif.
                    </div>
                  ) : (
                    promotions.map((p) => (
                      <div
                        key={p.id}
                        className="p-5 rounded-2xl bg-[#10131c] border border-white/10 flex items-center justify-between gap-4"
                      >
                        <div>
                          <span className="px-2.5 py-1 rounded bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono text-xs font-bold">
                            {p.code}
                          </span>
                          <h3 className="font-bold text-white text-sm mt-2">{p.title}</h3>
                          <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                            Diskon Rp {Number(p.discount_amount).toLocaleString('id-ID')}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Berlaku hingga: {p.valid_until}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}