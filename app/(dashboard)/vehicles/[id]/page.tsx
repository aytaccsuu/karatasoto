"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import { formatCurrency, formatDate, PAYMENT_TYPE_LABELS } from "@/lib/utils";
import type { Vehicle, ServiceRecord } from "@/types";

interface VehicleDetail extends Vehicle {
  service_records?: ServiceRecord[];
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vehicles/${id}`)
      .then((r) => r.json())
      .then((d) => { setVehicle(d.data); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!vehicle) return <div>Arac bulunamadi.</div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/vehicles" className="text-gray-500 hover:text-gray-700">
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{vehicle.plate}</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
            <div><span className="text-gray-500">Marka:</span> <span className="font-medium">{vehicle.brand}</span></div>
            <div><span className="text-gray-500">Model:</span> <span className="font-medium">{vehicle.model}</span></div>
            <div><span className="text-gray-500">Yil:</span> <span className="font-medium">{vehicle.year || "-"}</span></div>
            <div><span className="text-gray-500">KM:</span> <span className="font-medium">{vehicle.km?.toLocaleString("tr-TR") || "-"}</span></div>
            <div><span className="text-gray-500">Musteri:</span>{" "}
              {vehicle.customer ? (
                <Link href={`/customers/${vehicle.customer.id}`} className="font-medium text-blue-600 hover:underline">
                  {vehicle.customer.first_name} {vehicle.customer.last_name}
                </Link>
              ) : "-"}
            </div>
            {vehicle.chassis_number && (
              <div className="col-span-2"><span className="text-gray-500">Sase:</span> <span className="font-medium text-xs">{vehicle.chassis_number}</span></div>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/services/new?vehicle_id=${id}`}
              className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
              <PlusIcon className="w-4 h-4" /> Servis
            </Link>
            <Link href={`/vehicles/${id}/edit`}
              className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50">
              Duzenle
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Servis Gecmisi</h2>
        {!vehicle.service_records?.length ? (
          <p className="text-sm text-gray-500">Henuz servis kaydi yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-gray-600 font-medium">Tarih</th>
                  <th className="text-right pb-2 text-gray-600 font-medium">Toplam</th>
                  <th className="text-left pb-2 text-gray-600 font-medium pl-3">Odeme</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vehicle.service_records.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2">{formatDate(s.service_date)}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(s.grand_total)}</td>
                    <td className="py-2 pl-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.payment_type === "veresiye" ? "bg-red-100 text-red-700" :
                        s.payment_type === "nakit" ? "bg-green-100 text-green-700" :
                        "bg-blue-100 text-blue-700"}`}>
                        {PAYMENT_TYPE_LABELS[s.payment_type]}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <Link href={`/services/${s.id}`} className="text-xs text-blue-600 hover:underline">Detay</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
