import { useState } from "react";
import { useAuth } from "../components/AuthContext";
import LOGO from "../logo";

export default function LoginPage({ onClose }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      if (onClose) onClose();
    } catch (err) {
      setError(
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
          ? "Wrong email or password. Try again."
          : "Login failed. Check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:1000,
      background:"rgba(0,0,0,0.92)",backdropFilter:"blur(12px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap');
        .D{font-family:'Bebas Neue',serif}
        .R{font-family:'Rajdhani',sans-serif}
        .inp{
          width:100%;background:#0A0A0A;border:1px solid #1E1E1E;
          color:#E0E0E0;padding:12px 16px;border-radius:8px;
          font-family:'Rajdhani',sans-serif;font-size:14px;
          outline:none;transition:border-color .2s;box-sizing:border-box;
        }
        .inp:focus{border-color:#CC0000;}
        .btn-red{
          width:100%;background:#CC0000;color:#fff;border:none;
          padding:14px;border-radius:8px;font-family:'Rajdhani',sans-serif;
          font-size:15px;font-weight:700;letter-spacing:.1em;cursor:pointer;
          transition:background .2s,box-shadow .2s;
        }
        .btn-red:hover{background:#AA0000;box-shadow:0 6px 24px rgba(204,0,0,.4);}
        .btn-red:disabled{background:#4A0000;cursor:not-allowed;}
      `}</style>

      <div style={{
        background:"#0D0D0D",border:"1px solid #1E1E1E",borderRadius:20,
        padding:"40px 36px",width:"100%",maxWidth:400,position:"relative"
      }}>
        {/* Close button */}
        {onClose && (
          <button onClick={onClose} style={{
            position:"absolute",top:16,right:16,background:"none",border:"none",
            color:"#444",fontSize:20,cursor:"pointer",lineHeight:1,padding:4
          }}>✕</button>
        )}

        {/* Logo + Title */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <img src={LOGO} alt="NAFC"
            style={{width:72,height:72,borderRadius:"50%",objectFit:"cover",
              marginBottom:14,boxShadow:"0 0 32px rgba(204,0,0,.3)"}}/>
          <div className="D" style={{fontSize:32,color:"#fff",letterSpacing:".04em"}}>NAFC</div>
          <div className="R" style={{fontSize:11,color:"#FFD700",letterSpacing:".2em",marginTop:2}}>
            PLAYER & ADMIN PORTAL
          </div>
          <div style={{width:40,height:2,background:"#CC0000",margin:"10px auto 0"}}/>
        </div>

        <form onSubmit={handle}>
          <div style={{marginBottom:14}}>
            <label className="R" style={{fontSize:10,color:"#555",textTransform:"uppercase",
              letterSpacing:".15em",display:"block",marginBottom:5}}>
              Email
            </label>
            <input
              className="inp" type="email" placeholder="yourname@nafc.in"
              value={email} onChange={e=>setEmail(e.target.value)} required
            />
          </div>

          <div style={{marginBottom:20,position:"relative"}}>
            <label className="R" style={{fontSize:10,color:"#555",textTransform:"uppercase",
              letterSpacing:".15em",display:"block",marginBottom:5}}>
              Password
            </label>
            <input
              className="inp" type={showPass?"text":"password"} placeholder="••••••••••"
              value={password} onChange={e=>setPassword(e.target.value)} required
              style={{paddingRight:48}}
            />
            <button type="button" onClick={()=>setShowPass(!showPass)}
              style={{position:"absolute",right:12,top:30,background:"none",border:"none",
                color:"#444",cursor:"pointer",fontSize:16,lineHeight:1}}>
              {showPass?"🙈":"👁"}
            </button>
          </div>

          {error && (
            <div className="R" style={{background:"#2D0000",border:"1px solid #7f1d1d",
              color:"#ef4444",padding:"10px 14px",borderRadius:8,fontSize:13,marginBottom:16}}>
              ⚠️ {error}
            </div>
          )}

          <button className="btn-red" type="submit" disabled={loading}>
            {loading ? "LOGGING IN..." : "LOGIN →"}
          </button>
        </form>

        <div className="R" style={{textAlign:"center",marginTop:20,fontSize:11,color:"#333",lineHeight:1.6}}>
          Forgot your password? Contact admin<br/>
          <span style={{color:"#CC0000"}}>admin@nafc.in</span>
        </div>
      </div>
    </div>
  );
}
