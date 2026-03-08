"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Kayıtlı e-postayı doldur
  useEffect(() => {
    try {
      const saved = localStorage.getItem("rememberEmail");
      if (saved) { setEmail(saved); setRememberMe(true); }
    } catch { /* private mode */ }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("E-posta veya şifre hatalı.");
      setLoading(false);
      return;
    }
    try {
      if (rememberMe) { localStorage.setItem("rememberEmail", email); }
      else             { localStorage.removeItem("rememberEmail"); }
    } catch { /* ignore */ }
    router.push("/dashboard");
    router.refresh();
  }

  const inp: React.CSSProperties = {
    width: "100%", border: "1px solid #d1d5db", borderRadius: 8,
    padding: "9px 12px", fontSize: 14, outline: "none",
    boxSizing: "border-box", color: "#1e293b", backgroundColor: "#fff",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9", padding: 16 }}>
      <div style={{ backgroundColor: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.10)", padding: "40px 36px", width: "100%", maxWidth: 400 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image src="/logo.png" alt="Karataş Oto" width={180} height={90}
            style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }} priority />
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "8px 0 0", fontWeight: 500 }}>Servis Takip Sistemi</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5 }}>E-posta</label>
            <input type="email" required autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={inp} placeholder="ornek@email.com" />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Şifre</label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: "#4f46e5", textDecoration: "none", fontWeight: 500 }}>
                Şifremi Unuttum
              </Link>
            </div>
            <input type="password" required autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={inp} placeholder="••••••••" />
          </div>

          {/* Beni Hatırla */}
          <div
            onClick={() => setRememberMe((r) => !r)}
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 4,
              border: rememberMe ? "2px solid #4f46e5" : "2px solid #d1d5db",
              backgroundColor: rememberMe ? "#4f46e5" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s",
            }}>
              {rememberMe && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: 13, color: "#4b5563", fontWeight: 500 }}>Beni Hatırla</span>
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", backgroundColor: loading ? "#a5b4fc" : "#4f46e5",
            color: "#fff", border: "none", borderRadius: 10, padding: "11px 0",
            fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            marginTop: 4, letterSpacing: "0.01em",
          }}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
