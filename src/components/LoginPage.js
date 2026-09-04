import { useState } from "react";
import { auth } from "../firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage({ onClose }) {
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [ld, setLd] = useState(false);

  const isDark = typeof window !== "undefined" && localStorage.getItem("nafc_theme") !== "light";

  const lgn = async (ev) => {
    ev.preventDefault();
    setErr("");
    setLd(true);
    try {
      await signInWithEmailAndPassword(auth, e, p);
      onClose();
    } catch (er) {
      setErr("Invalid email or password");
    }
    setLd(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:999, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", padding:16 }} onClick={onClose}>
      <div style={{ background: isDark ? "#18181b" : "#ffffff", width:"100%", maxWidth:400, padding:"36px 32px", borderRadius:16, border:`1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`, boxShadow:"0 24px 60px rgba(0,0,0,0.4)", position:"relative" }} onClick={ev => ev.stopPropagation()}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", border:`1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`, width:30, height:30, borderRadius:6, fontSize:15, cursor:"pointer", color: isDark ? "#fff" : "#111", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:36, color: isDark ? "#f8fafc" : "#111111", lineHeight:1, marginBottom:6 }}>TEAM <span style={{ color:"#E8002D" }}>LOGIN</span></div>
        <div style={{ fontSize:13, color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)", marginBottom:20 }}>Authorized club members only.</div>
        
        {err && <div style={{ background:"rgba(239,68,68,0.15)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.3)", padding:"10px 14px", borderRadius:8, fontSize:13, marginBottom:16, fontWeight:600 }}>{err}</div>}
        
        <form onSubmit={lgn} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <div style={{ fontSize:10, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:2, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", marginBottom:5 }}>EMAIL ADDRESS</div>
            <input type="email" placeholder="name@nafc.com" value={e} onChange={ex=>setE(ex.target.value)} required style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", background: isDark ? "#222226" : "#f7f5f2", color: isDark ? "#f8fafc" : "#111111", border:`1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`, borderRadius:8, fontSize:14, outline:"none" }}/>
          </div>
          <div>
            <div style={{ fontSize:10, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:2, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", marginBottom:5 }}>PASSWORD</div>
            <input type="password" placeholder="••••••••" value={p} onChange={ex=>setP(ex.target.value)} required style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px", background: isDark ? "#222226" : "#f7f5f2", color: isDark ? "#f8fafc" : "#111111", border:`1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`, borderRadius:8, fontSize:14, outline:"none" }}/>
          </div>
          <button type="submit" disabled={ld} style={{ background:"#E8002D", color:"#fff", border:"none", padding:"13px", fontSize:15, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:3, borderRadius:8, cursor:ld?"not-allowed":"pointer", marginTop:6 }}>
            {ld ? "AUTHENTICATING..." : "LOGIN TO PORTAL"}
          </button>
        </form>
      </div>
    </div>
  );
}