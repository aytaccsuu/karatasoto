export default function QuotesLoading() {
  return (
    <div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .sk { animation: pulse 1.4s ease-in-out infinite; background: #f1f5f9; border-radius: 6px; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div className="sk" style={{ width: 160, height: 22, marginBottom: 6 }} />
          <div className="sk" style={{ width: 70, height: 14 }} />
        </div>
        <div className="sk" style={{ width: 110, height: 34, borderRadius: 8 }} />
      </div>

      {/* Tablo */}
      <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "10px 16px", display: "flex", gap: 32 }}>
          {[90, 140, 80, 80, 70].map((w, i) => (
            <div key={i} className="sk" style={{ width: w, height: 12, borderRadius: 4 }} />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 32, alignItems: "center" }}>
            <div className="sk" style={{ width: 90, height: 14 }} />
            <div className="sk" style={{ width: 140, height: 14 }} />
            <div className="sk" style={{ width: 80, height: 14 }} />
            <div className="sk" style={{ width: 60, height: 22, borderRadius: 6 }} />
            <div className="sk" style={{ width: 70, height: 14 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
