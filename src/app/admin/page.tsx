'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

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
  const [activeTab, setActiveTab] = useState<'test-drives' | 'transactions' | 'cars'>('test-drives');

  const [testDrives, setTestDrives] = useState<TestDriveItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [cars, setCars] = useState<CarItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form Tambah Mobil Baru (sesuai struct CreateCarInput)
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

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadDashboardData = async () => {
    try {
      const [tdRes, txRes, carsRes, brandsRes, catsRes] = await Promise.allSettled([
        apiFetch('/sales/test-drives'),
        apiFetch('/sales/transactions'),
        apiFetch('/cars?limit=100'),
        apiFetch('/brands'),
        apiFetch('/categories'),
      ]);

      if (tdRes.status === 'fulfilled') setTestDrives(extractArray(tdRes.value));
      if (txRes.status === 'fulfilled') setTransactions(extractArray(txRes.value));
      if (carsRes.status === 'fulfilled') setCars(extractArray(carsRes.value));

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

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Dashboard Operasional {role === 'admin' ? 'Admin' : 'Sales'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Kelola jadwal test drive, konfirmasi pemesanan unit, dan inventaris stok mobil.
            </p>
          </div>

          {/* Ringkasan Angka */}
          <div className="flex gap-3 text-xs">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block">Test Drive</span>
              <strong className="text-base text-white">{testDrives.length}</strong>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block">Transaksi</span>
              <strong className="text-base text-emerald-400">{transactions.length}</strong>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block">Total Unit</span>
              <strong className="text-base text-blue-400">{cars.length}</strong>
            </div>
          </div>
        </header>

        {/* Tab Navigasi */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-4">
          <button
            onClick={() => {
              setActiveTab('test-drives');
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'test-drives'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Jadwal Test Drive ({testDrives.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('transactions');
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Pemesanan Unit ({transactions.length})
          </button>

          {role === 'admin' && (
            <button
              onClick={() => {
                setActiveTab('cars');
                setFeedback(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'cars'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Kelola Stok Mobil ({cars.length})
            </button>
          )}
        </div>

        {feedback && (
          <div
            className={`mb-6 p-3.5 rounded-xl border text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-red-950/60 border-red-800 text-red-300'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {loading ? (
          <p className="text-slate-400 animate-pulse text-sm">Memuat data dashboard...</p>
        ) : (
          <>
            {/* TAB 1: KELOLA TEST DRIVE */}
            {activeTab === 'test-drives' && (
              <div className="space-y-3">
                {testDrives.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
                    Belum ada pengajuan test drive masuk.
                  </div>
                ) : (
                  testDrives.map((td) => (
                    <div
                      key={td.id}
                      className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white text-sm">
                            {td.car?.brand?.name ? `${td.car.brand.name} ` : ''}
                            {td.car?.model_name || `Mobil #${td.car_id}`}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-amber-400">
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
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateTestDrive(td.id, 'completed')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                        >
                          Selesai
                        </button>
                        <button
                          onClick={() => handleUpdateTestDrive(td.id, 'rejected')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: KELOLA TRANSAKSI */}
            {activeTab === 'transactions' && (
              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
                    Belum ada transaksi pemesanan unit.
                  </div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {tx.invoice_number && (
                            <span className="text-xs font-mono text-blue-400">{tx.invoice_number}</span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-amber-400">
                            {tx.status}
                          </span>
                        </div>
                        <h3 className="font-semibold text-white text-sm mt-1">
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
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                        >
                          Konfirmasi DP/Order
                        </button>
                        <button
                          onClick={() => handleUpdateTransaction(tx.id, 'completed')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                        >
                          Lunas (Sold)
                        </button>
                        <button
                          onClick={() => handleUpdateTransaction(tx.id, 'cancelled')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 cursor-pointer"
                        >
                          Batalkan
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: KELOLA STOK MOBIL (ADMIN ONLY) */}
            {activeTab === 'cars' && role === 'admin' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Tambah Mobil */}
                <form
                  onSubmit={handleCreateCar}
                  className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-6 h-fit space-y-3.5"
                >
                  <h2 className="text-base font-semibold text-white pb-2 border-b border-slate-800">
                    Tambah Unit Mobil Baru
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Merek *</label>
                      <select
                        required
                        value={brandId}
                        onChange={(e) => setBrandId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
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
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
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
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
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
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
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
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Transmisi *</label>
                      <select
                        value={transmission}
                        onChange={(e) => setTransmission(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
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
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
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
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Mesin (cc)</label>
                      <input
                        type="number"
                        value={engineCapacity}
                        onChange={(e) => setEngineCapacity(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Kursi</label>
                      <input
                        type="number"
                        value={seatCapacity}
                        onChange={(e) => setSeatCapacity(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
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
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Kondisi</label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
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
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                  >
                    {submitting ? 'Menyimpan...' : '+ Simpan Unit Mobil'}
                  </button>
                </form>

                {/* Daftar Stok Mobil */}
                <div className="lg:col-span-7 space-y-3">
                  <h2 className="text-base font-semibold text-white">Daftar Inventaris Unit</h2>
                  {cars.map((car) => (
                    <div
                      key={car.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-white">
                            {car.brand?.name ? `${car.brand.name} ` : ''}
                            {car.model_name} ({car.year})
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase bg-slate-800 text-emerald-400">
                            {car.status}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-400 font-semibold mt-1">
                          Rp {Number(car.price).toLocaleString('id-ID')}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {car.transmission} • {car.fuel_type} • {car.mileage?.toLocaleString('id-ID')} km
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteCar(car.id, car.model_name)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}