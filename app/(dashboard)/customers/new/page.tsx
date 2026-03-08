"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("Ad ve soyad zorunludur");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Hata olustu");
      setLoading(false);
      return;
    }
    toast.success("Musteri eklendi");
    router.push(`/customers/${data.data.id}`);
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/customers" className="text-gray-500 hover:text-gray-700">
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Yeni Musteri</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soyad *</label>
              <input
                type="text"
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon (opsiyonel)
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="05xx xxx xx xx"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <Link
              href="/customers"
              className="flex-1 text-center border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Iptal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
