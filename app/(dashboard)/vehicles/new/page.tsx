"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import type { Customer } from "@/types";

function NewVehicleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preCustomerId = searchParams.get("customer_id") || "";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_id: preCustomerId,
    plate: "",
    brand: "",
    model: "",
    year: "",
    km: "",
    chassis_number: "",
  });

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then((d) => setCustomers(d.data || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer_id) { toast.error("Musteri secin"); return; }
    setLoading(true);
    const payload = {
      ...form,
      year: form.year ? parseInt(form.year) : undefined,
      km: form.km ? parseInt(form.km) : undefined,
    };
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Hata olustu");
      setLoading(false);
      return;
    }
    toast.success("Arac eklendi");
    router.push(preCustomerId ? `/customers/${preCustomerId}` : `/vehicles/${data.data.id}`);
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/vehicles" className="text-gray-500 hover:text-gray-700">
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Yeni Arac</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Musteri *</label>
            <select required value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Musteri secin...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plaka *</label>
            <input type="text" required value={form.plate}
              onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
              placeholder="34 ABC 123"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marka *</label>
              <input type="text" required value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Toyota"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
              <input type="text" required value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Corolla"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yil</label>
              <input type="number" value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                min="1950" max={new Date().getFullYear() + 1}
                placeholder="2020"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KM</label>
              <input type="number" value={form.km}
                onChange={(e) => setForm({ ...form, km: e.target.value })}
                min="0"
                placeholder="75000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sase Numarasi (opsiyonel)</label>
            <input type="text" value={form.chassis_number}
              onChange={(e) => setForm({ ...form, chassis_number: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <Link href="/vehicles"
              className="flex-1 text-center border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50">
              Iptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewVehiclePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NewVehicleForm />
    </Suspense>
  );
}
