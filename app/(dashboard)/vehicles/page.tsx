"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import type { Vehicle } from "@/types";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/vehicles");
    const data = await res.json();
    setVehicles(data.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.plate.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      `${v.customer?.first_name} ${v.customer?.last_name}`.toLowerCase().includes(q)
    );
  });

  async function handleDelete(id: string, plate: string) {
    if (!confirm(`${plate} plakalı aracı silmek istediginize emin misiniz?`)) return;
    const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Arac silindi");
      fetchAll();
    } else {
      toast.error("Silme basarisiz. Servis kaydi olan araclar silinemez.");
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-gray-900">Araclar</h1>
        <Link href="/vehicles/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors w-fit">
          <PlusIcon className="w-4 h-4" />
          Yeni Arac
        </Link>
      </div>

      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Plaka, marka, model veya musteri..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Arac bulunamadi.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Plaka</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Marka/Model</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Musteri</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">KM</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">
                      <Link href={`/vehicles/${v.id}`} className="hover:text-blue-600">{v.plate}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {v.brand} {v.model}{v.year ? ` (${v.year})` : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {v.customer ? (
                        <Link href={`/customers/${v.customer.id}`} className="hover:text-blue-600">
                          {v.customer.first_name} {v.customer.last_name}
                        </Link>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {v.km ? v.km.toLocaleString("tr-TR") : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/vehicles/${v.id}/edit`} className="text-xs text-blue-600 hover:underline">Duzenle</Link>
                        <button onClick={() => handleDelete(v.id, v.plate)} className="text-xs text-red-500 hover:underline">Sil</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
