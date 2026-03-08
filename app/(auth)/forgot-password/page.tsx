"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error("E-posta gönderilemedi: " + error.message);
      setLoading(false);
      return;
    }

    setSent(true);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    color: "#1e293b",
    backgroundColor: "#fff",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9", padding: "16px" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.10)", padding: "40px 36px", width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Image
            src="/logo.png"
            alt="Karataş Oto"
            width={160}
            height={80}
            style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }}
            priority
          />
        </div>

        {sent ? (
          /* Başarı mesajı */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12, lineHeight: 1 }}>📧</div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b", margin: "0 0 10px" }}>
              E-posta Gönderildi
            </h2>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
              <strong style={{ color: "#1e293b" }}>{email}</strong> adresine şifre
              sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu (ve spam
              klasörünü) kontrol edin.
            </p>
            <Link
              href="/login"
              style={{ fontSize: 13, color: "#4f46e5", textDecoration: "none", fontWeight: 600 }}
            >
              ← Giriş sayfasına dön
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>
                Şifremi Unuttum
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
                  E-posta
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  placeholder="ornek@email.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  backgroundColor: loading ? "#a5b4fc" : "#4f46e5",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 0",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </button>

              <div style={{ textAlign: "center" }}>
                <Link
                  href="/login"
                  style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}
                >
                  ← Giriş sayfasına dön
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
