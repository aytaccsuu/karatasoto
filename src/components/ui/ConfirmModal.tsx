"use client";

import { useEffect } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Sil",
  cancelLabel = "İptal",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 16px",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "absolute", inset: 0,
          backgroundColor: "rgba(15,23,42,0.45)",
          backdropFilter: "blur(2px)",
        }}
      />
      {/* Kart */}
      <div
        style={{
          position: "relative", zIndex: 1,
          backgroundColor: "#fff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
          padding: "24px 24px 20px",
          width: "100%", maxWidth: 360,
          animation: "confirmIn 0.15s ease-out",
        }}
      >
        <style>{`
          @keyframes confirmIn {
            from { opacity:0; transform:scale(0.93) translateY(-10px); }
            to   { opacity:1; transform:scale(1) translateY(0); }
          }
        `}</style>

        {/* İkon + Başlık */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            backgroundColor: danger ? "#fef2f2" : "#eff6ff",
            border: `1px solid ${danger ? "#fecaca" : "#bfdbfe"}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {danger ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{title}</h3>
        </div>

        <p style={{ margin: "0 0 20px 50px", fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>
          {message}
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              color: "#64748b", backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0", cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              color: "#fff",
              backgroundColor: danger ? "#ef4444" : "#4f46e5",
              border: "none", cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
