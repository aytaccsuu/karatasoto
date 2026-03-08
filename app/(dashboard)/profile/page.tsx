"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { KeyIcon } from "@heroicons/react/24/outline";

export default function ProfilePage() {
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (form.newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }

    setLoading(true);
    try {
      // Access token'ı al
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Şifre değiştirilemedi");
      } else {
        toast.success("Şifre başarıyla değiştirildi");
        setForm({ newPassword: "", confirmPassword: "" });
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Profil</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <KeyIcon className="w-5 h-5 text-blue-600" />
          Şifre Değiştir
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yeni Şifre *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="En az 6 karakter"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yeni Şifre (Tekrar) *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Şifrenizi tekrar girin"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
          </button>
        </form>
      </div>
    </div>
  );
}
