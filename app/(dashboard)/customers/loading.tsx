export default function CustomersLoading() {
  return (
    <div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .sk { background:#e2e8f0; border-radius:8px; animation:pulse 1.5s ease-in-out infinite; }
      `}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <div className="sk" style={{ width:100, height:22, marginBottom:8 }} />
          <div className="sk" style={{ width:80, height:14 }} />
        </div>
        <div className="sk" style={{ width:120, height:36, borderRadius:8 }} />
      </div>
      <div className="sk" style={{ width:"100%", height:40, marginBottom:16 }} />
      <div style={{ backgroundColor:"#fff", borderRadius:12, border:"1px solid #e2e8f0", overflow:"hidden" }}>
        <div style={{ backgroundColor:"#f8fafc", padding:"10px 16px", borderBottom:"1px solid #e2e8f0", display:"flex", gap:32 }}>
          {["40%","20%","20%","10%"].map((w,i) => (
            <div key={i} className="sk" style={{ width:w, height:10 }} />
          ))}
        </div>
        {[...Array(8)].map((_,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:16, padding:"12px 16px", borderBottom:"1px solid #f1f5f9" }}>
            <div className="sk" style={{ width:28, height:28, borderRadius:"50%", flexShrink:0 }} />
            <div className="sk" style={{ width:"35%", height:13 }} />
            <div className="sk" style={{ width:"20%", height:13, marginLeft:"auto" }} />
            <div className="sk" style={{ width:"15%", height:13 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
