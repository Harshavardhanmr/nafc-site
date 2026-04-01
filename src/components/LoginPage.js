import { useState } from "react";
import { auth } from "../firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage({ onClose }) {
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [ld, setLd] = useState(false);

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
    <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
      <div style={{background:"#fff",width:400,padding:40,borderRadius:8,boxShadow:"0 20px 40px rgba(0,0,0,0.3)",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",fontSize:24,cursor:"pointer",color:"#999"}}>×</button>
        <div style={{fontFamily:"'Bebas Neue',serif",fontSize:40,color:"#111",lineHeight:1,marginBottom:8}}>TEAM <span style={{color:"#CC0000"}}>LOGIN</span></div>
        <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#666",marginBottom:24,fontWeight:600}}>Authorized club members only.</div>
        
        {err && <div style={{background:"#fee2e2",color:"#ef4444",padding:"10px",borderRadius:4,fontSize:13,marginBottom:16,fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>{err}</div>}
        
        <form onSubmit={lgn} style={{display:"flex",flexDirection:"column",gap:16,fontFamily:"'Rajdhani',sans-serif"}}>
          <input type="email" placeholder="Email Address" value={e} onChange={ex=>setE(ex.target.value)} required style={{padding:"12px 16px",border:"2px solid #eee",borderRadius:4,fontSize:15,fontWeight:600,outline:"none"}}/>
          <input type="password" placeholder="Password" value={p} onChange={ex=>setP(ex.target.value)} required style={{padding:"12px 16px",border:"2px solid #eee",borderRadius:4,fontSize:15,fontWeight:600,outline:"none"}}/>
          <button type="submit" disabled={ld} style={{background:"#CC0000",color:"#fff",border:"none",padding:"14px",fontSize:16,fontWeight:700,borderRadius:4,cursor:ld?"not-allowed":"pointer",marginTop:8,letterSpacing:".05em"}}>
            {ld ? "AUTHENTICATING..." : "LOGIN TO PORTAL"}
          </button>
        </form>
      </div>
    </div>
  );
}