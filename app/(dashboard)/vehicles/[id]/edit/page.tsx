"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function EditVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    plate: "", brand: "", model: "", year: "", km: "", chassis_number: "",
  });

  useEffect(() => {
    fetch(`/api/vehicles/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const v = d.data;
        setForm({
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          year: v.year?.toString() || "",
          km: v.km?.toString() || "",
          chassis_number: v.chassis_number || "",
        });
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/vehicles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        year: form.year ? parseInt(form.year) : null,
        km: form.km ? parseInt(form.km) : null,
      }),
    });
    if (res.ok) {
      toast.success("Arac guncellendi");
      router.push(`/vehicles/${id}`);
    } else {
      const d = await res.json();
      toast.error(d.error || "Hata olustu");
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/vehicles/${id}`} className="text-gray-500 hover:text-gray-700">
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Araci Duzenle</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plaka *</label>
            <input type="text" required value={form.plate}
              onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marka *</label>
              <input type="text" required value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
              <input type="text" required value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yil</label>
              <input type="number" value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KM</label>
              <input type="number" value={form.km}
                onChange={(e) => setForm({ ...form, km: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sase Numarasi</label>
            <input type="text" value={form.chassis_number}
              onChange={(e) => setForm({ ...form, chassis_number: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Kaydediliyor..." : "Guncelle"}
            </button>
            <Link href={`/vehicles/${id}`}
              className="flex-1 text-center border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50">
              Iptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
