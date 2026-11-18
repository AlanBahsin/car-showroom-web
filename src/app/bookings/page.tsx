'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  car?: {
    model_name: string;
    year: number;
    brand?: { name: string };
  };
}

interface TransactionItem {
  id: number;
  invoice_number?: string;
  car_id: number;
  payment_method: string;
  car_price?: number;
  discount_amount?: number;
  final_price?: number;
  down_payment?: number;
  tenor_months?: number;
  monthly_installment?: number;
  status: string;
  car?: {
    model_name: string;
    year: number;
    price: number;
    brand?: { name: string };
  };
}

function extractArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.cars)) return raw.data.cars;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.cars)) return raw.cars;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

function BookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCarId = searchParams.get('car_id') || '';
  const initialType = searchParams.get('type') === 'order' ? 'order' : 'test-drive';

  const [activeTab, setActiveTab] = useState<'test-drive' | 'order'>(initialType);
  const [cars, setCars] = useState<CarOption[]>([]);
  const [testDrives, setTestDrives] = useState<TestDriveItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  // Form States: Test Drive
  const [selectedCarId, setSelectedCarId] = useState<string>(initialCarId);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('10:00');
  const [notes, setNotes] = useState<string>('');

  // Form States: Pemesanan Unit
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [promoCode, setPromoCode] = useState<string>('');
  const [downPayment, setDownPayment] = useState<string>('50000000');
  const [tenorMonths, setTenorMonths] = useState<number>(36);

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAllData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [carsRes, tdRes, txRes] = await Promise.allSettled([
        apiFetch('/cars'),
        apiFetch('/buyer/test-drives'),
        apiFetch('/buyer/transactions'),
      ]);

      if (carsRes.status === 'fulfilled') {
        const list = extractArray(carsRes.value);
        setCars(
          list.filter(
            (c: CarOption) =>
              !c.status ||
              c.status.toLowerCase() === 'available' ||
              String(c.id) === initialCarId
          )
        );
      }

      if (tdRes.status === 'fulfilled') {
        setTestDrives(extractArray(tdRes.value));
      }

      if (txRes.status === 'fulfilled') {
        setTransactions(extractArray(txRes.value));
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedCarId) {
      setMessage({ type: 'error', text: 'Silakan pilih unit mobil terlebih dahulu.' });
      return;
    }

    setSubmitting(true);
    try {
      if (activeTab === 'test-drive') {
        if (!scheduledDate || !scheduledTime) {
          setMessage({ type: 'error', text: 'Tanggal dan jam test drive wajib diisi.' });
          setSubmitting(false);
          return;
        }

        await apiFetch('/buyer/test-drives', {
          method: 'POST',
          body: JSON.stringify({
            car_id: Number(selectedCarId),
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
            notes,
          }),
        });

        setMessage({ type: 'success', text: 'Jadwal test drive berhasil diajukan!' });
        setNotes('');
      } else {
        const orderPayload: any = {
          car_id: Number(selectedCarId),
          payment_method: paymentMethod,
          promo_code: promoCode.trim(),
        };

        if (paymentMethod === 'credit') {
          orderPayload.down_payment = Number(downPayment) || 0;
          orderPayload.tenor_months = Number(tenorMonths);
        }

        await apiFetch('/buyer/transactions', {
          method: 'POST',
          body: JSON.stringify(orderPayload),
        });

        setMessage({
          type: 'success',
          text: 'Pemesanan unit berhasil dibuat! Status unit otomatis terkunci (booked).',
        });
        setPromoCode('');
      }

      await loadAllData();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Gagal mengirim pengajuan. Periksa kembali isian Anda.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'approved' || s === 'completed' || s === 'confirmed') {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (s === 'rejected' || s === 'cancelled') {
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    }
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  };

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white">Aktivitas & Transaksi Saya</h1>
          <p className="text-slate-400 text-sm mt-1">
            Ajukan jadwal test drive, pemesanan unit mobil (Cash/Kredit), dan pantau status konfirmasi showroom.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Kolom Kiri: Form Pengajuan */}
          <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-6 h-fit">
            {/* Switcher Tab */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('test-drive');
                  setMessage(null);
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'test-drive'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Booking Test Drive
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('order');
                  setMessage(null);
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'order'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Beli / Pesan Unit
              </button>
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg border text-xs ${
                  message.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-red-950/60 border-red-800 text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Pilih Unit Mobil *
                </label>
                <select
                  required
                  value={selectedCarId}
                  onChange={(e) => setSelectedCarId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Pilih Mobil --</option>
                  {cars.map((car) => (
                    <option key={car.id} value={String(car.id)}>
                      {car.brand?.name ? `${car.brand.name} ` : ''}
                      {car.model_name} ({car.year}) - Rp {Number(car.price).toLocaleString('id-ID')}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === 'test-drive' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Tanggal Kunjungan *
                      </label>
                      <input
                        type="date"
                        required
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Jam Kunjungan *
                      </label>
                      <input
                        type="time"
                        required
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Catatan Tambahan (Opsional)
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Saya datang bersama keluarga pukul 10 pagi..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Metode Pembayaran *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'credit')}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="cash">Cash / Tunai Lunas</option>
                      <option value="credit">Kredit / Cicilan Leasing</option>
                    </select>
                  </div>

                  {paymentMethod === 'credit' && (
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Uang Muka / DP (Rp) *
                        </label>
                        <input
                          type="number"
                          required
                          min={5000000}
                          step={5000000}
                          value={downPayment}
                          onChange={(e) => setDownPayment(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Tenor Cicilan *
                        </label>
                        <select
                          value={tenorMonths}
                          onChange={(e) => setTenorMonths(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
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
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Kode Promo (Opsional)
                    </label>
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: HEMAT10JT"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white uppercase focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition cursor-pointer"
              >
                {submitting
                  ? 'Mengirim Pengajuan...'
                  : activeTab === 'test-drive'
                  ? 'Ajukan Jadwal Test Drive'
                  : 'Kirim Pengajuan Pembelian'}
              </button>
            </form>
          </div>

          {/* Kolom Kanan: Riwayat Test Drive & Pemesanan */}
          <div className="lg:col-span-7 space-y-8">
            {loadingData ? (
              <p className="text-slate-400 animate-pulse text-sm">Memuat riwayat aktivitas...</p>
            ) : (
              <>
                {/* Bagian 1: Riwayat Test Drive */}
                <section>
                  <h2 className="text-base font-semibold text-white mb-3">
                    Riwayat Jadwal Test Drive ({testDrives.length})
                  </h2>

                  {testDrives.length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
                      Belum ada pengajuan jadwal test drive.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {testDrives.map((td) => (
                        <div
                          key={td.id}
                          className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <Link
                              href={`/cars/${td.car_id}`}
                              className="font-semibold text-sm text-white hover:text-blue-400"
                            >
                              {td.car?.brand?.name ? `${td.car.brand.name} ` : ''}
                              {td.car?.model_name || `Mobil #${td.car_id}`}
                            </Link>
                            <p className="text-xs text-slate-400 mt-1">
                              Jadwal: <strong className="text-slate-200">{td.scheduled_date}</strong> pukul{' '}
                              <strong className="text-slate-200">{td.scheduled_time} WIB</strong>
                            </p>
                            {td.notes && (
                              <p className="text-xs text-slate-500 mt-1">Catatan: {td.notes}</p>
                            )}
                          </div>

                          <span
                            className={`self-start sm:self-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase border ${statusBadge(
                              td.status
                            )}`}
                          >
                            {td.status || 'pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Bagian 2: Riwayat Transaksi Pembelian */}
                <section>
                  <h2 className="text-base font-semibold text-white mb-3">
                    Riwayat Pemesanan Unit ({transactions.length})
                  </h2>

                  {transactions.length === 0 ? (
                    <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
                      Belum ada riwayat pemesanan unit mobil.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            {tx.invoice_number && (
                              <span className="text-[11px] font-mono text-blue-400 block mb-0.5">
                                {tx.invoice_number}
                              </span>
                            )}
                            <Link
                              href={`/cars/${tx.car_id}`}
                              className="font-semibold text-sm text-white hover:text-blue-400"
                            >
                              {tx.car?.brand?.name ? `${tx.car.brand.name} ` : ''}
                              {tx.car?.model_name || `Mobil #${tx.car_id}`}
                            </Link>
                            <p className="text-xs text-emerald-400 font-semibold mt-1">
                              Total: Rp{' '}
                              {Number(tx.final_price || tx.car_price || tx.car?.price || 0).toLocaleString(
                                'id-ID'
                              )}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5 capitalize">
                              Metode: {tx.payment_method}
                              {tx.payment_method === 'credit' && tx.tenor_months
                                ? ` (${tx.tenor_months} bln • Cicilan Rp ${Number(
                                    tx.monthly_installment || 0
                                  ).toLocaleString('id-ID')}/bln)`
                                : ''}
                            </p>
                          </div>

                          <span
                            className={`self-start sm:self-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase border ${statusBadge(
                              tx.status
                            )}`}
                          >
                            {tx.status || 'pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-6 py-8 max-w-6xl mx-auto">
          <p className="text-slate-400 text-sm">Memuat halaman aktivitas...</p>
        </main>
      }
    >
      <BookingsContent />
    </Suspense>
  );
}