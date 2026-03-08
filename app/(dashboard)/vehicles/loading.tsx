export default function VehiclesLoading() {
  return (
    <div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .sk { background:#e2e8f0; border-radius:8px; animation:pulse 1.5s ease-in-out infinite; }
      `}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div className="sk" style={{ width:80, height:22 }} />
        <div className="sk" style={{ width:110, height:36, borderRadius:8 }} />
      </div>
      <div className="sk" style={{ width:"100%", height:40, marginBottom:16 }} />
      <div style={{ backgroundColor:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden" }}>
        <div style={{ backgroundColor:"#f8fafc", padding:"10px 16px", borderBottom:"1px solid #e2e8f0", display:"flex", gap:24 }}>
          {["15%","25%","25%","10%"].map((w,i) => (
            <div key={i} className="sk" style={{ width:w, height:10 }} />
          ))}
        </div>
        {[...Array(8)].map((_,i) => (
          <div key={i} style={{ display:"flex", gap:24, padding:"12px 16px", borderBottom:"1px solid #f1f5f9", alignItems:"center" }}>
            <div className="sk" style={{ width:"15%", height:13, fontWeight:700 }} />
            <div className="sk" style={{ width:"25%", height:13 }} />
            <div className="sk" style={{ width:"25%", height:13 }} />
            <div className="sk" style={{ width:"10%", height:13, marginLeft:"auto" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
