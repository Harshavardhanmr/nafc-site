import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useAuth } from "../components/AuthContext";
import LOGO from "../logo";

const POS_COLOR = {
  Striker:"#CC0000",Forward:"#e05500",Midfielder:"#22c55e",
  Winger:"#a855f7",Goalkeeper:"#FFD700",Defender:"#3b82f6"
};

export default function PlayerPortal({ onBack }) {
  const { profile } = useAuth();
  const [player, setPlayer] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.playerId) return;
    // Live listen to own player doc
    const unsub = onSnapshot(doc(db,"players",profile.playerId), snap => {
      if (snap.exists()) setPlayer({id:snap.id,...snap.data()});
      setLoading(false);
    });
    return unsub;
  }, [profile]);

  // Fetch matches where this player scored
  useEffect(() => {
    if (!player) return;
    const { onSnapshot: os, collection: col, query: q, orderBy: ob } = require("firebase/firestore");
    // Simple fetch matches
    import("firebase/firestore").then(({ onSnapshot, collection, query, orderBy }) => {
      const unsub = onSnapshot(
        query(collection(db,"matches"), orderBy("date","desc")),
        snap => setMatches(snap.docs.map(d=>({id:d.id,...d.data()})))
      );
    });
  }, [player]);

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#060606",display:"flex",
      alignItems:"center",justifyContent:"center"}}>
      <div style={{color:"#CC0000",fontFamily:"'Bebas Neue',serif",fontSize:28,letterSpacing:".1em"}}>
        LOADING...
      </div>
    </div>
  );

  if (!player) return (
    <div style={{minHeight:"100vh",background:"#060606",display:"flex",
      alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{textAlign:"center",color:"#E0E0E0"}}>
        <div style={{fontSize:32,marginBottom:8}}>⚠️</div>
        <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:14,color:"#555"}}>
          Player profile not found. Contact admin.
        </div>
        <button onClick={onBack} style={{marginTop:16,background:"#CC0000",color:"#fff",
          border:"none",padding:"10px 24px",borderRadius:8,cursor:"pointer",
          fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>Back</button>
      </div>
    </div>
  );

  const myGoals = matches.reduce((sum, m) => {
    const scorer = (m.scorers||[]).find(s=>s.name===player.name);
    return sum + (scorer ? parseInt(scorer.goals)||0 : 0);
  }, 0);

  const stats = [
    {l:"Goals",v:player.goals||0,c:"#CC0000"},
    {l:"Assists",v:player.assists||0,c:"#FFD700"},
    {l:"Appearances",v:player.appearances||0,c:"#3b82f6"},
    {l:"Yellow Cards",v:player.yellowCards||0,c:"#f59e0b"},
    {l:"Red Cards",v:player.redCards||0,c:"#ef4444"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#060606",color:"#E0E0E0",paddingBottom:60}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap');
        .D{font-family:'Bebas Neue',serif} .R{font-family:'Rajdhani',sans-serif}
      `}</style>

      {/* Header */}
      <div style={{background:"#0A0A0A",borderBottom:"1px solid #1A1A1A",padding:"0 24px"}}>
        <div style={{maxWidth:800,margin:"0 auto",display:"flex",alignItems:"center",
          justifyContent:"space-between",height:56}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src={LOGO} alt="NAFC" style={{width:32,height:32,borderRadius:"50%",objectFit:"cover"}}/>
            <div className="D" style={{fontSize:16,color:"#FFD700"}}>MY STATS</div>
          </div>
          <button onClick={onBack} style={{background:"none",border:"1px solid #1A1A1A",color:"#555",
            padding:"7px 14px",borderRadius:7,fontFamily:"'Rajdhani',sans-serif",
            fontWeight:700,fontSize:11,cursor:"pointer"}}>
            ← Back to Site
          </button>
        </div>
      </div>

      <div style={{maxWidth:800,margin:"0 auto",padding:"24px 24px"}}>
        {/* Player hero */}
        <div style={{background:"#0A0A0A",border:`1px solid ${POS_COLOR[player.pos]||"#CC0000"}28`,
          borderRadius:16,padding:"32px 28px",marginBottom:20,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:24,top:"50%",transform:"translateY(-50%)",
            fontSize:120,opacity:.04,fontFamily:"'Bebas Neue',serif"}}>{player.jersey}</div>
          <div className="R" style={{fontSize:9,color:POS_COLOR[player.pos]||"#CC0000",
            textTransform:"uppercase",letterSpacing:".2em",fontWeight:700,marginBottom:4}}>
            {player.pos} · #{player.jersey}
          </div>
          <div className="D" style={{fontSize:56,color:"#fff",lineHeight:.9,marginBottom:14}}>
            {player.name}
          </div>
          <div style={{display:"flex",gap:16}}>
            {[["Age",player.age],["Nationality",player.nationality||"Indian"],["Status","Active"]].map(([l,v])=>(
              <div key={l}>
                <div className="R" style={{fontSize:8,color:"#444",textTransform:"uppercase"}}>{l}</div>
                <div className="R" style={{fontSize:13,color:"#bbb",fontWeight:600}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
          {stats.map(s=>(
            <div key={s.l} style={{background:"#0E0E0E",border:"1px solid #1A1A1A",
              borderRadius:12,padding:"18px 10px",textAlign:"center"}}>
              <div className="D" style={{fontSize:44,color:s.c,lineHeight:1}}>{s.v}</div>
              <div className="R" style={{fontSize:9,color:"#444",textTransform:"uppercase",
                letterSpacing:".08em",marginTop:3}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Matches I scored in */}
        <div style={{background:"#0E0E0E",border:"1px solid #1A1A1A",borderRadius:12,overflow:"hidden"}}>
          <div style={{background:"#080808",borderBottom:"1px solid #141414",padding:"14px 18px"}}>
            <div className="D" style={{fontSize:22,color:"#FFD700"}}>MY GOAL MATCHES</div>
          </div>
          {matches.filter(m=>(m.scorers||[]).some(s=>s.name===player.name)).length === 0 ? (
            <div className="R" style={{padding:24,color:"#333",textAlign:"center",fontSize:13}}>
              No goals recorded yet. Keep going! 💪
            </div>
          ) : matches.filter(m=>(m.scorers||[]).some(s=>s.name===player.name)).map(m=>{
            const scored = (m.scorers||[]).find(s=>s.name===player.name);
            return (
              <div key={m.id} style={{borderBottom:"1px solid #0C0C0C",padding:"12px 18px",
                display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span className="D" style={{fontSize:16,color:"#fff"}}>
                    NAFC {m.nafcScore} – {m.opponentScore} {m.opponent}
                  </span>
                  <span className="R" style={{marginLeft:10,fontSize:11,color:"#555"}}>{m.date}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:16}}>⚽</span>
                  <span className="D" style={{fontSize:22,color:"#CC0000"}}>{scored.goals}</span>
                  <span className="R" style={{fontSize:10,color:"#555"}}>goal{scored.goals>1?"s":""}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="R" style={{marginTop:16,fontSize:11,color:"#333",textAlign:"center"}}>
          Stats are updated by the admin after each match.
          Questions? Contact admin@nafc.in
        </div>
      </div>
    </div>
  );
}
