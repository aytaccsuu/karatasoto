"use client";

import { useRouter, usePathname } from "next/navigation";
import { Bars3Icon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Ana Sayfa",
  "/customers": "Müşteriler",
  "/services": "Servis Kayıtları",
  "/products": "Ürünler / İşçilik",
  "/reports": "Raporlar",
  "/profile": "Profil",
};

interface TopbarProps { onMenuClick: () => void; }

export default function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const title = Object.entries(PAGE_TITLES)
    .find(([k]) => k === pathname || (k !== "/dashboard" && pathname.startsWith(k)))?.[1] ?? "Karatas Oto";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Çıkış yapıldı");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-slate-200 h-12 px-4 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2.5">
        <button onClick={onMenuClick} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
          <Bars3Icon className="w-5 h-5" />
        </button>
        <h1 className="text-[14px] font-semibold text-slate-800 tracking-tight">{title}</h1>
      </div>
      <button onClick={handleLogout} className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500 hover:text-red-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50">
        <ArrowRightOnRectangleIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Çıkış</span>
      </button>
    </header>
  );
}
