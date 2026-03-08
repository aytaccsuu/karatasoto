"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { KeyIcon, UserCircleIcon } from "@heroicons/react/24/outline";

const S = {
  page: { maxWidth: 480 } as React.CSSProperties,
  h1: { fontSize: 18, fontWeight: 700, color: "#0f172a", margin: "0 0 20px", letterSpacing: "-0.01em" } as React.CSSProperties,
  section: { backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: 16 } as React.CSSProperties,
  sectionTitle: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 } as React.CSSProperties,
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 } as React.CSSProperties,
  input: { width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#0f172a", outline: "none", boxSizing: "border-box", backgroundColor: "#fff" } as React.CSSProperties,
  fieldWrap: { marginBottom: 14 } as React.CSSProperties,
  btn: { width: "100%", padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", backgroundColor: "#4f46e5", color: "#fff", marginTop: 4 } as React.CSSProperties,
  spinner: { display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", verticalAlign: "middle", marginRight: 6 } as React.CSSProperties,
};

export default function ProfilePage() {
  const [profileForm, setProfileForm] = useState({ display_name: "", email: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [initialEmail, setInitialEmail] = useState("");

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setProfileForm({
          display_name: user.user_metadata?.display_name || "",
          email: user.email || "",
          phone: user.user_metadata?.phone || "",
        });
        setInitialEmail(user.email || "");
      }
    });
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Güncelleme başarısız");
      } else {
        toast.success("Profil güncellendi");
        if (profileForm.email !== initialEmail) {
          toast("E-posta değişikliği için onay maili gönderildi", { icon: "📧" });
          setInitialEmail(profileForm.email);
        }
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      toast.error("Şifre en az 8 karakter olmalıdır");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }
    setPasswordLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password: passwordForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Şifre değiştirilemedi");
      } else {
        toast.success("Şifre başarıyla değiştirildi");
        setPasswordForm({ newPassword: "", confirmPassword: "" });
      }
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <h1 style={S.h1}>Profil</h1>

      {/* Profil Bilgileri */}
      <div style={S.section}>
        <div style={S.sectionTitle}>
          <UserCircleIcon style={{ width: 18, height: 18, color: "#4f46e5" }} />
          Profil Bilgileri
        </div>
        <form onSubmit={handleProfileSave}>
          <div style={S.fieldWrap}>
            <label style={S.label}>Görünen Ad</label>
            <input
              type="text"
              value={profileForm.display_name}
              onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
              placeholder="Adınız Soyadınız"
              style={S.input}
            />
          </div>
          <div style={S.fieldWrap}>
            <label style={S.label}>E-posta</label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              placeholder="ornek@mail.com"
              style={S.input}
            />
            {profileForm.email !== initialEmail && (
              <p style={{ fontSize: 11, color: "#d97706", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                ⚠ Değişiklik için e-posta onayı gerekir
              </p>
            )}
          </div>
          <div style={S.fieldWrap}>
            <label style={S.label}>Telefon</label>
            <input
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="05XX XXX XX XX"
              style={S.input}
            />
          </div>
          <button type="submit" disabled={profileLoading} style={{ ...S.btn, opacity: profileLoading ? 0.7 : 1 }}>
            {profileLoading && <span style={S.spinner} />}
            {profileLoading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
      </div>

      {/* Şifre Değiştir */}
      <div style={S.section}>
        <div style={S.sectionTitle}>
          <KeyIcon style={{ width: 18, height: 18, color: "#4f46e5" }} />
          Şifre Değiştir
        </div>
        <form onSubmit={handleChangePassword}>
          <div style={S.fieldWrap}>
            <label style={S.label}>Yeni Şifre</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="En az 8 karakter"
              style={S.input}
            />
          </div>
          <div style={S.fieldWrap}>
            <label style={S.label}>Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              required
              minLength={8}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="Şifrenizi tekrar girin"
              style={S.input}
            />
          </div>
          <button type="submit" disabled={passwordLoading} style={{ ...S.btn, opacity: passwordLoading ? 0.7 : 1 }}>
            {passwordLoading && <span style={S.spinner} />}
            {passwordLoading ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
          </button>
        </form>
      </div>
    </div>
  );
}
