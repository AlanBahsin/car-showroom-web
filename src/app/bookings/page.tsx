'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface CarOption {
  id: number;
  model_name: string;
  year: number;
  price: number;
  status: string;
  brand?: { name: string };
}

interface TestDriveItem {
  id: number;
  car_id: number;
  scheduled_date: string;
  scheduled_time: string;
  notes?: string;
  status: string;
  car?: { model_name: string; brand?: { name: string } };
}

interface TransactionItem {
  id: number;
  invoice_number?: string;
  car_id: number;
  payment_method: string;
  car_price?: number;
  final_price?: number;
  down_payment?: number;
  tenor_months?: number;
  monthly_installment?: number;
  status: string;
  car?: { model_name: string; brand?: { name: string } };
}

interface ConsultationItem {
  id: number;
  car_id?: number;
  subject: string;
  message: string;
  reply?: string;
  status: string;
  created_at?: string;
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

function BookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCarId = searchParams.get('car_id') || '';
  const initialType = searchParams.get('type');

  const [activeTab, setActiveTab] = useState<'test-drive' | 'order' | 'consultation'>(
    initialType === 'order' ? 'order' : 'test-drive'
  );

  const [cars, setCars] = useState<CarOption[]>([]);
  const [testDrives, setTestDrives] = useState<TestDriveItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);

  // Form Test Drive
  const [tdCarId, setTdCarId] = useState(initialCarId);
  const [tdDate, setTdDate] = useState('');
  const [tdTime, setTdTime] = useState('10:00');
  const [tdNotes, setTdNotes] = useState('');

  // Form Order / Pembelian
  const [orderCarId, setOrderCarId] = useState(initialCarId);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [downPayment, setDownPayment] = useState<number>(50000000);
  const [tenorMonths, setTenorMonths] = useState<number>(36);
  const [promoCode, setPromoCode] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Form Konsultasi Sales
  const [consCarId, setConsCarId] = useState(initialCarId);
  const [consSubject, setConsSubject] = useState('');
  const [consMessage, setConsMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAllData = async () => {
    try {
      const [carsRes, tdRes, txRes, consRes, promoRes] = await Promise.allSettled([
        apiFetch('/cars?limit=50'),
        apiFetch('/buyer/test-drives'),
        apiFetch('/buyer/transactions'),
        apiFetch('/buyer/consultations'),
        apiFetch('/promotions'),
      ]);

      if (carsRes.status === 'fulfilled') {
        const list = extractArray(carsRes.value);
        setCars(list);
        if (!tdCarId && list.length > 0) setTdCarId(String(list[0].id));
        if (!orderCarId && list.length > 0) setOrderCarId(String(list[0].id));
      }

      if (tdRes.status === 'fulfilled') setTestDrives(extractArray(tdRes.value));
      if (txRes.status === 'fulfilled') setTransactions(extractArray(txRes.value));
      if (consRes.status === 'fulfilled') setConsultations(extractArray(consRes.value));
      if (promoRes.status === 'fulfilled') setPromotions(extractArray(promoRes.value));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadAllData();
  }, []);

  const handleBookTestDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      await apiFetch('/buyer/test-drives', {
        method: 'POST',
        body: JSON.stringify({
          car_id: Number(tdCarId),
          scheduled_date: tdDate,
          scheduled_time: tdTime,
          notes: tdNotes,
        }),
      });

      setFeedback({ type: 'success', text: 'Jadwal test drive berhasil diajukan!' });
      setTdNotes('');
      await loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal mengajukan test drive.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      const payload: any = {
        car_id: Number(orderCarId),
        payment_method: paymentMethod,
        promo_code: promoCode.trim(),
        notes: orderNotes,
      };

      if (paymentMethod === 'credit') {
        payload.down_payment = Number(downPayment);
        payload.tenor_months = Number(tenorMonths);
      }

      await apiFetch('/buyer/transactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setFeedback({ type: 'success', text: 'Pemesanan unit berhasil dibuat! Tim sales akan segera memproses.' });
      setOrderNotes('');
      setPromoCode('');
      await loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal membuat pemesanan unit.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      await apiFetch('/buyer/consultations', {
        method: 'POST',
        body: JSON.stringify({
          car_id: consCarId ? Number(consCarId) : null,
          subject: consSubject,
          message: consMessage,
        }),
      });

      setFeedback({ type: 'success', text: 'Pertanyaan konsultasi terkirim ke tim Sales!' });
      setConsSubject('');
      setConsMessage('');
      await loadAllData();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Gagal mengirim konsultasi.' });
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const s = status?.toLowerCase() || 'pending';
    if (s === 'approved' || s === 'confirmed' || s === 'completed' || s === 'replied') {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30';
    }
    if (s === 'rejected' || s === 'cancelled') {
      return 'bg-red-500/15 text-red-300 border-red-400/30';
    }
    return 'bg-amber-500/15 text-amber-300 border-amber-400/30';
  };

  return (
    <main className="min-h-screen px-6 py-10 bg-[#090b10]">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <span className="text-[11px] uppercase tracking-[0.22em] text-amber-400 font-semibold">
            Client Portal
          </span>
          <h1 className="text-3xl font-bold text-white mt-1">Aktivitas & Layanan Pembeli</h1>
          <p className="text-slate-400 text-sm mt-1">
            Kelola jadwal test drive, transaksi pembelian unit, dan konsultasi langsung bersama konsultan sales.
          </p>
        </header>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => {
              setActiveTab('test-drive');
              setFeedback(null);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'test-drive'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-[#10131c] text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            Test Drive ({testDrives.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('order');
              setFeedback(null);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'order'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-[#10131c] text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            Pemesanan Unit ({transactions.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('consultation');
              setFeedback(null);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'consultation'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-[#10131c] text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            Konsultasi Sales ({consultations.length})
          </button>
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

        {/* TAB 1: TEST DRIVE */}
        {activeTab === 'test-drive' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleBookTestDrive}
              className="lg:col-span-5 rounded-2xl bg-[#10131c] border border-white/10 p-6 space-y-4 h-fit"
            >
              <h2 className="text-base font-bold text-white pb-3 border-b border-white/10">
                Ajukan Jadwal Test Drive
              </h2>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Pilih Unit Mobil</label>
                <select
                  required
                  value={tdCarId}
                  onChange={(e) => setTdCarId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white"
                >
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brand?.name ? `${c.brand.name} ` : ''}
                      {c.model_name} ({c.year})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={tdDate}
                    onChange={(e) => setTdDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1.5">Jam Kunjungan</label>
                  <input
                    type="time"
                    required
                    value={tdTime}
                    onChange={(e) => setTdTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Catatan Tambahan</label>
                <textarea
                  rows={3}
                  value={tdNotes}
                  onChange={(e) => setTdNotes(e.target.value)}
                  placeholder="Contoh: Ingin mencoba rute jalan tol sekitar showroom..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                {submitting ? 'Mengirim...' : 'Booking Test Drive'}
              </button>
            </form>

            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-base font-bold text-white">Riwayat Test Drive Anda</h2>
              {loading ? (
                <p className="text-slate-400 text-sm animate-pulse">Memuat riwayat...</p>
              ) : testDrives.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#10131c] border border-white/10 text-center text-slate-400 text-sm">
                  Belum ada pengajuan test drive.
                </div>
              ) : (
                testDrives.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-[#10131c] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        {item.car?.brand?.name ? `${item.car.brand.name} ` : ''}
                        {item.car?.model_name || `Unit #${item.car_id}`}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Jadwal: <strong className="text-slate-200">{item.scheduled_date}</strong> pukul{' '}
                        <strong className="text-slate-200">{item.scheduled_time}</strong>
                      </p>
                      {item.notes && <p className="text-xs text-slate-500 mt-1">Catatan: {item.notes}</p>}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase border w-fit ${statusBadge(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PEMESANAN UNIT */}
        {activeTab === 'order' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleCreateOrder}
              className="lg:col-span-5 rounded-2xl bg-[#10131c] border border-white/10 p-6 space-y-4 h-fit"
            >
              <h2 className="text-base font-bold text-white pb-3 border-b border-white/10">
                Formulir Pemesanan Unit
              </h2>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Pilih Mobil</label>
                <select
                  required
                  value={orderCarId}
                  onChange={(e) => setOrderCarId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white"
                >
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brand?.name ? `${c.brand.name} ` : ''}
                      {c.model_name} - Rp {Number(c.price).toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2.5 rounded-xl text-xs font-bold uppercase border transition cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                        : 'bg-[#090b10] border-white/10 text-slate-400'
                    }`}
                  >
                    Tunai (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit')}
                    className={`py-2.5 rounded-xl text-xs font-bold uppercase border transition cursor-pointer ${
                      paymentMethod === 'credit'
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                        : 'bg-[#090b10] border-white/10 text-slate-400'
                    }`}
                  >
                    Kredit (Leasing)
                  </button>
                </div>
              </div>

              {paymentMethod === 'credit' && (
                <div className="p-4 rounded-xl bg-[#090b10] border border-white/10 space-y-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Uang Muka / DP (Rp)</label>
                    <input
                      type="number"
                      min={10000000}
                      step={5000000}
                      required
                      value={downPayment}
                      onChange={(e) => setDownPayment(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#10131c] border border-white/10 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Tenor Cicilan</label>
                    <select
                      value={tenorMonths}
                      onChange={(e) => setTenorMonths(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#10131c] border border-white/10 text-sm text-white"
                    >
                      <option value={12}>12 Bulan (1 Tahun)</option>
                      <option value={24}>24 Bulan (2 Tahun)</option>
                      <option value={36}>36 Bulan (3 Tahun)</option>
                      <option value={48}>48 Bulan (4 Tahun)</option>
                      <option value={60}>60 Bulan (5 Tahun)</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Kode Promo (Opsional)</label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode promo showroom"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white uppercase"
                />
                {promotions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {promotions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPromoCode(p.code)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-400/30 text-[11px] text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                      >
                        Pakai <strong>{p.code}</strong> (-Rp{' '}
                        {Number(p.discount_amount).toLocaleString('id-ID')})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Catatan Pemesanan</label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Catatan pengiriman atau permintaan STNK..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                {submitting ? 'Memproses...' : 'Konfirmasi Pemesanan Unit'}
              </button>
            </form>

            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-base font-bold text-white">Daftar Transaksi & Invoice</h2>
              {loading ? (
                <p className="text-slate-400 text-sm animate-pulse">Memuat transaksi...</p>
              ) : transactions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#10131c] border border-white/10 text-center text-slate-400 text-sm">
                  Belum ada transaksi pemesanan unit.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-5 rounded-2xl bg-[#10131c] border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-amber-400">
                        {tx.invoice_number || `TRX-#${tx.id}`}
                      </span>
                      <span
                        className={`px-3 py-0.5 rounded-full text-[11px] font-bold uppercase border ${statusBadge(
                          tx.status
                        )}`}
                      >
                        {tx.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base">
                      {tx.car?.brand?.name ? `${tx.car.brand.name} ` : ''}
                      {tx.car?.model_name || `Mobil #${tx.car_id}`}
                    </h3>

                    <div className="text-xs text-slate-400 flex flex-wrap gap-x-6 gap-y-1 pt-1">
                      <span>
                        Metode: <strong className="text-slate-200 uppercase">{tx.payment_method}</strong>
                      </span>
                      <span>
                        Total Harga:{' '}
                        <strong className="text-amber-400">
                          Rp {Number(tx.final_price || tx.car_price || 0).toLocaleString('id-ID')}
                        </strong>
                      </span>
                      {tx.payment_method === 'credit' && tx.monthly_installment && (
                        <span>
                          Cicilan:{' '}
                          <strong className="text-slate-200">
                            Rp {Number(tx.monthly_installment).toLocaleString('id-ID')}/bln ({tx.tenor_months} bln)
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: KONSULTASI SALES */}
        {activeTab === 'consultation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleCreateConsultation}
              className="lg:col-span-5 rounded-2xl bg-[#10131c] border border-white/10 p-6 space-y-4 h-fit"
            >
              <h2 className="text-base font-bold text-white pb-3 border-b border-white/10">
                Tanya Konsultan Sales
              </h2>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">
                  Unit Terkait (Opsional)
                </label>
                <select
                  value={consCarId}
                  onChange={(e) => setConsCarId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white"
                >
                  <option value="">-- Pertanyaan Umum Showroom --</option>
                  {cars.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brand?.name ? `${c.brand.name} ` : ''}
                      {c.model_name} ({c.year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Subjek Pertanyaan *</label>
                <input
                  type="text"
                  required
                  value={consSubject}
                  onChange={(e) => setConsSubject(e.target.value)}
                  placeholder="Contoh: Tanya simulasi tukar tambah / riwayat servis"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Detail Pertanyaan *</label>
                <textarea
                  rows={4}
                  required
                  value={consMessage}
                  onChange={(e) => setConsMessage(e.target.value)}
                  placeholder="Tuliskan pertanyaan Anda untuk tim sales kami..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                {submitting ? 'Mengirim...' : 'Kirim Pertanyaan'}
              </button>
            </form>

            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-base font-bold text-white">Riwayat Konsultasi & Balasan</h2>
              {loading ? (
                <p className="text-slate-400 text-sm animate-pulse">Memuat konsultasi...</p>
              ) : consultations.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#10131c] border border-white/10 text-center text-slate-400 text-sm">
                  Belum ada riwayat konsultasi. Silakan kirim pertanyaan pertama Anda.
                </div>
              ) : (
                consultations.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-[#10131c] border border-white/10 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] text-amber-400 font-semibold uppercase">
                          {c.car?.model_name
                            ? `${c.car.brand?.name || ''} ${c.car.model_name}`
                            : 'Konsultasi Umum'}
                        </span>
                        <h3 className="font-bold text-white text-sm mt-0.5">{c.subject}</h3>
                      </div>
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusBadge(
                          c.status
                        )}`}
                      >
                        {c.reply ? 'Dibalas' : c.status || 'Menunggu'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-[#090b10] p-3.5 rounded-xl border border-white/5">
                      {c.message}
                    </p>

                    {c.reply ? (
                      <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                          Balasan Tim Sales:
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">{c.reply}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">
                        Menunggu tanggapan dari konsultan sales...
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen px-6 py-10 max-w-6xl mx-auto text-slate-400 text-sm">
          Memuat halaman layanan...
        </div>
      }
    >
      <BookingsContent />
    </Suspense>
  );
}