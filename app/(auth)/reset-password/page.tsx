"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setSessionError("Geçersiz veya süresi dolmuş bağlantı.");
      setChecking(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setSessionError("Bağlantı geçersiz veya süresi dolmuş. Yeni bir sıfırlama talebi oluşturun.");
      }
      setChecking(false);
    });
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error("Şifre güncellenemedi: " + error.message);
      setLoading(false);
      return;
    }

    toast.success("Şifreniz başarıyla güncellendi!");
    router.push("/dashboard");
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

  if (checking) {
    return (
      <div style={{ textAlign: "center", color: "#64748b", fontSize: 14, padding: "20px 0" }}>
        <div style={{ display: "inline-block", width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: 12 }}>Doğrulanıyor...</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12, lineHeight: 1 }}>⚠️</div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 8px" }}>
          Bağlantı Geçersiz
        </h2>
        <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 20, lineHeight: 1.5 }}>
          {sessionError}
        </p>
        <Link
          href="/forgot-password"
          style={{ fontSize: 13, color: "#4f46e5", textDecoration: "none", fontWeight: 600 }}
        >
          Yeni Sıfırlama Bağlantısı İste
        </Link>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 6px" }}>
          Yeni Şifre Belirle
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
          Hesabınız için yeni bir şifre oluşturun.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
            Yeni Şifre
          </label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="En az 6 karakter"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>
            Şifreyi Onayla
          </label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
            placeholder="Şifreyi tekrar girin"
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
            marginTop: 4,
          }}
        >
          {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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

        <Suspense fallback={
          <div style={{ textAlign: "center", color: "#64748b", fontSize: 14, padding: "20px 0" }}>
            Yükleniyor...
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
