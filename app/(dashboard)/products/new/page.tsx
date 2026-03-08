"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", unit_price: "", unit: "adet" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, unit_price: parseFloat(form.unit_price) }),
    });
    if (res.ok) {
      toast.success("Urun eklendi");
      router.push("/products");
    } else {
      const d = await res.json();
      toast.error(d.error || "Hata olustu");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/products" className="text-gray-500 hover:text-gray-700">
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Yeni Urun</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urun Adi *</label>
            <input type="text" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Motor yagi, Balata, vb."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birim Fiyat (TL) *</label>
              <input type="number" step="0.01" min="0" required value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birim</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="adet">adet</option>
                <option value="litre">litre</option>
                <option value="takim">takim</option>
                <option value="saat">saat</option>
                <option value="metre">metre</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <Link href="/products" className="flex-1 text-center border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50">
              Iptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
