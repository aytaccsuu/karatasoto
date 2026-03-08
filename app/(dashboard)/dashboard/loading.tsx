export default function DashboardLoading() {
  return (
    <div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .sk { background:#e2e8f0; border-radius:8px; animation:pulse 1.5s ease-in-out infinite; }
      `}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <div className="sk" style={{ width:120, height:22, marginBottom:8 }} />
          <div className="sk" style={{ width:200, height:14 }} />
        </div>
        <div className="sk" style={{ width:110, height:36, borderRadius:8 }} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
        {[...Array(5)].map((_,i) => (
          <div key={i} style={{ backgroundColor:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
            <div className="sk" style={{ width:36, height:36, borderRadius:8, flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div className="sk" style={{ width:"60%", height:10, marginBottom:8 }} />
              <div className="sk" style={{ width:"80%", height:20 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="sk" style={{ width:80, height:10, marginBottom:10 }} />
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {[...Array(4)].map((_,i) => (
          <div key={i} className="sk" style={{ height:42, borderRadius:8 }} />
        ))}
      </div>
    </div>
  );
}
