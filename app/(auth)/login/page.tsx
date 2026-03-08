"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

    router.push("/dashboard");
    router.refresh();
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
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5f9", padding: "16px" }}>
      <div style={{ backgroundColor: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.10)", padding: "40px 36px", width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image
            src="/logo.png"
            alt="Karataş Oto"
            width={180}
            height={90}
            style={{ objectFit: "contain", maxWidth: "100%", height: "auto" }}
            priority
          />
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "8px 0 0", fontWeight: 500 }}>Servis Takip Sistemi</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* E-posta */}
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

          {/* Şifre */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Şifre</label>
              <Link
                href="/forgot-password"
                style={{ fontSize: 12, color: "#4f46e5", textDecoration: "none", fontWeight: 500 }}
              >
                Şifremi Unuttum
              </Link>
            </div>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>

          {/* Giriş Butonu */}
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
              letterSpacing: "0.01em",
              transition: "background-color 0.15s",
            }}
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
