import React, { useState, useEffect, useRef } from "react";
import { db } from "./firebase/config";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";
import { useAuth, AuthProvider } from "./components/AuthProvider";
import LoginPage from "./components/LoginPage";
import AdminDashboard from "./AdminDashboard";
import LOGO from "./logo";

const HUDDLE_DEFAULT = "/huddle.jpg";

const T_RED    = "#E8002D";
const T_GOLD   = "#d97706";

export const THEMES = {
  light: {
    name: "light",
    bg: "#f0eeec",
    bg2: "#e8e6e3",
    cardBg: "#f7f5f2",
    cardBg2: "#ffffff",
    navBg: "rgba(240,238,236,0.96)",
    text: "#111111",
    textMuted: "rgba(0,0,0,0.60)",
    textDim: "rgba(0,0,0,0.38)",
    border: "rgba(0,0,0,0.10)",
    borderLight: "rgba(0,0,0,0.06)",
    hoverBg: "rgba(0,0,0,0.05)",
    inputBg: "#ffffff",
    subtleBg: "#e8e5e1",
    headerGrad: "linear-gradient(135deg, #f0eeec 0%, #e8e6e3 100%)",
    footerBg: "#111111",
    heroGrad: (isMobile) => isMobile
      ? "linear-gradient(180deg, rgba(240,238,236,0.88) 0%, rgba(240,238,236,0.62) 50%, rgba(240,238,236,0.95) 100%)"
      : "linear-gradient(100deg, rgba(240,238,236,0.97) 0%, rgba(240,238,236,0.76) 30%, rgba(240,238,236,0.18) 55%, rgba(240,238,236,0.0) 68%)",
    heroFade: "linear-gradient(to top, #f0eeec 0%, transparent 100%)"
  },
  dark: {
    name: "dark",
    bg: "#09090b",
    bg2: "#141417",
    cardBg: "#18181b",
    cardBg2: "#222226",
    navBg: "rgba(9,9,11,0.96)",
    text: "#f8fafc",
    textMuted: "rgba(255,255,255,0.68)",
    textDim: "rgba(255,255,255,0.40)",
    border: "rgba(255,255,255,0.12)",
    borderLight: "rgba(255,255,255,0.07)",
    hoverBg: "rgba(255,255,255,0.07)",
    inputBg: "#18181b",
    subtleBg: "#1f1f23",
    headerGrad: "linear-gradient(135deg, #09090b 0%, #141417 100%)",
    footerBg: "#09090b",
    heroGrad: (isMobile) => isMobile
      ? "linear-gradient(180deg, rgba(9,9,11,0.90) 0%, rgba(9,9,11,0.68) 50%, rgba(9,9,11,0.98) 100%)"
      : "linear-gradient(100deg, rgba(9,9,11,0.97) 0%, rgba(9,9,11,0.80) 30%, rgba(9,9,11,0.25) 55%, rgba(9,9,11,0.0) 68%)",
    heroFade: "linear-gradient(to top, #09090b 0%, transparent 100%)"
  }
};

const PGS = ["Home", "Players", "Fixtures", "Stats", "Gallery", "News"];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: "tournament-sept-6-2026",
    title: "Sept 6 5-a-Side Tournament — Dual Squad Announcement",
    category: "Tournament",
    date: "2026-09-06",
    badge: "UPCOMING",
    format: "5-a-Side",
    venue: "BFS Bengaluru",
    summary: "NAFC is fielding two competitive squads for the Bangalore 5-a-side championship: Team 1 (NAFC) and Team 2 (ENNE FC / EFC).",
    teams: [
      {
        name: "TEAM 1 — NAFC",
        color: "#E8002D",
        players: [
          { name: "Hafeez", role: "Striker", jersey: 9 },
          { name: "Hruthik", role: "Midfielder", jersey: 10 },
          { name: "Ruddy", role: "Midfielder", jersey: 8 },
          { name: "Dheemanth", role: "Defender", jersey: 30 },
          { name: "Akarsh", role: "Goalkeeper", jersey: 1 },
          { name: "Harsha", role: "Defender", jersey: 6 },
          { name: "Megur", role: "Forward", jersey: 17 }
        ]
      },
      {
        name: "TEAM 2 — ENNE FC (EFC)",
        color: "#2563eb",
        players: [
          { name: "Vignesh", role: "Defender", jersey: 4 },
          { name: "Gopal", role: "Defender", jersey: 3 },
          { name: "Shetty", role: "Midfielder", jersey: 11 },
          { name: "Nithin", role: "Winger", jersey: 14 },
          { name: "Naga", role: "Guest Player", isGuest: true },
          { name: "Danish", role: "Forward" }
        ]
      }
    ],
    content: "NAFC kicks off the September tournament season with two squads in action. Both teams will compete across the group stages and knockouts representing NAFC tactical depth and pace. Stay tuned for live match updates and scorelines throughout the day!",
    createdAt: "2026-09-06T00:00:00.000Z"
  },
  {
    id: "tournament-christ-aug-2026",
    title: "Christ Tournament 9v9 — NAFC Campaign & Squad Roster",
    category: "Tournament",
    date: "2026-08-01",
    badge: "COMPLETED",
    format: "9v9",
    venue: "Christ Academy Bengaluru",
    summary: "NAFC's first official tournament campaign at the Christ 9v9 Tournament featuring 12 squad members across 2 matches.",
    teams: [
      {
        name: "NAFC TOURNAMENT SQUAD (9v9)",
        color: "#E8002D",
        players: [
          { name: "Nithin", role: "Striker", jersey: 14 },
          { name: "Gopal (C)", role: "Defender", jersey: 3 },
          { name: "Harsha Vardhan", role: "Defender", jersey: 6 },
          { name: "Ruddy", role: "Midfielder", jersey: 8 },
          { name: "Hruthik", role: "Midfielder", jersey: 10 },
          { name: "Akarsh", role: "Goalkeeper", jersey: 1 },
          { name: "Danish", role: "Midfielder", jersey: 21 },
          { name: "Dheemanth", role: "Defender", jersey: 30 },
          { name: "Megur", role: "Forward", jersey: 17 },
          { name: "Vignesh", role: "Defender", jersey: 4 },
          { name: "Shetty", role: "Forward", jersey: 11 },
          { name: "Hafeez", role: "Winger", jersey: 9 }
        ]
      }
    ],
    content: "NAFC participated in the prestigious Christ 9v9 Tournament on August 1st and 2nd. Match 1 saw a hard-fought 1–0 victory over BMSC with Hruthik scoring the winning goal, followed by a tough knockout encounter against TFC. A foundational tournament for the squad!",
    createdAt: "2026-08-02T20:00:00.000Z"
  }
];

const POS_COLOR = {
  Goalkeeper: "#2563eb",
  Defender:   "#16a34a",
  Midfielder: "#7c3aed",
  Winger:     "#0891b2",
  Forward:    T_RED,
  Striker:    T_RED,
};

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}
function StatNum({ value }) { const v = useCountUp(value || 0); return <>{v}</>; }

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

function MatchModal({ match, onClose, T = THEMES.dark }) {
  const isW = match.result === "W", isD = match.result === "D", isUpc = match.result === "upcoming";
  const ac = isUpc ? "#2563eb" : isW ? "#16a34a" : isD ? T_GOLD : T_RED;
  const label = isUpc ? "UPCOMING" : isW ? "WIN" : isD ? "DRAW" : "LOSS";
  const scorers = match.scorers || [];
  const assists = match.assisters || [];
  const defActions = match.defensiveActions || [];
  const summary = match.summary || "";
  const totalGoals = scorers.reduce((sum, s) => sum + (typeof s === "object" && s.goals ? Number(s.goals) : 1), 0);
  const totalAssists = assists.reduce((sum, a) => sum + (typeof a === "object" && a.assists ? Number(a.assists) : 1), 0);

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.80)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(12px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderTop:`4px solid ${ac}`, borderRadius:20, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto", animation:"fadeUp 0.25s ease", boxShadow:"0 32px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ padding:"18px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${T.borderLight}`, background:T.bg2 }}>
          {/* ── Modal header: result + competition + fmt badge ── */}
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ background:`${ac}15`, border:`1px solid ${ac}40`, borderRadius:6, padding:"4px 12px", fontFamily:"'Bebas Neue',sans-serif", color:ac, fontSize:13, letterSpacing:2.5 }}>{label}</span>
            {match.competition && <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:T.textDim, letterSpacing:2 }}>{match.competition.toUpperCase()}</span>}
            {match.fmt && (
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:"white", background:"#0033a0", padding:"3px 10px", borderRadius:12, letterSpacing:2 }}>{match.fmt}</span>
            )}
          </div>
          <button onClick={onClose} style={{ background:T.hoverBg, border:`1px solid ${T.border}`, color:T.text, width:34, height:34, borderRadius:6, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
        </div>
        <div style={{ padding:"24px 20px", textAlign:"center", borderBottom:`1px solid ${T.borderLight}` }}>
          <div style={{ fontSize:12, color:T.textDim, letterSpacing:2, fontFamily:"'Bebas Neue',sans-serif", marginBottom:18 }}>{match.date}{match.venue ? ` · ${match.venue}` : ""}</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flex:1 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:T.hoverBg, border:`1px solid ${T.borderLight}`, display:"flex", alignItems:"center", justifyContent:"center" }}><img src={LOGO} alt="NAFC" style={{ width:34 }} /></div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:T.text, letterSpacing:2 }}>NAFC</div>
            </div>
            {isUpc
              ? <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:"#2563eb", letterSpacing:4, padding:"8px 18px", background:"rgba(37,99,235,0.08)", border:"1px solid rgba(37,99,235,0.2)", borderRadius:10 }}>VS</div>
              : <div style={{ display:"flex", alignItems:"center", gap:8, background:`${ac}10`, border:`1px solid ${ac}30`, borderRadius:12, padding:"8px 18px" }}>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:54, color:T.text, lineHeight:1 }}>{match.nafcScore}</span>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:T.textDim, lineHeight:1 }}>—</span>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:54, color:T.textMuted, lineHeight:1 }}>{match.opponentScore}</span>
                </div>
            }
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flex:1 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:T.hoverBg, border:`1px solid ${T.borderLight}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🛡️</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:T.textMuted, letterSpacing:1 }}>{match.opponent}</div>
            </div>
          </div>
        </div>
        <div style={{ padding:"20px" }}>
          {scorers.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, letterSpacing:3, color:T_RED, marginBottom:10 }}>⚽ GOALS ({totalGoals})</div>
              {scorers.map((s,i) => {
                const sName = typeof s==="string"?s:s.name;
                const sGoals = typeof s==="object"&&s.goals?s.goals:1;
                const isGuest = typeof s==="object"?(s.isGuest||(s.id&&String(s.id).startsWith("guest_"))||sName.toLowerCase().includes("guest")):sName.toLowerCase().includes("guest");
                return (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:T.bg2, borderRadius:8, border:`1px solid ${T.borderLight}`, marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(232,0,45,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>⚽</div>
                      <span style={{ fontWeight:600, color:T.text, fontSize:14 }}>{sName}</span>
                      {isGuest && <span style={{ background:T.hoverBg, color:T.textMuted, border:`1px solid ${T.border}`, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, letterSpacing:1 }}>GUEST</span>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {sGoals > 1 && (
                        <span style={{ fontFamily:"'Bebas Neue',sans-serif", color:T_RED, background:"rgba(232,0,45,0.1)", border:"1px solid rgba(232,0,45,0.2)", padding:"3px 10px", borderRadius:6, fontSize:12, letterSpacing:1 }}>
                          {sGoals} GOALS
                        </span>
                      )}
                      {typeof s==="object"&&s.minute&&<span style={{ fontFamily:"'Bebas Neue',sans-serif", color:T.textDim, fontSize:13 }}>{s.minute}'</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {assists.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, letterSpacing:3, color:T_GOLD, marginBottom:10 }}>🅰️ ASSISTS ({totalAssists})</div>
              {assists.map((a,i) => {
                const aName = typeof a==="string"?a:a.name;
                const aCount = typeof a==="object"&&a.assists?a.assists:1;
                const isGuest = typeof a==="object"?(a.isGuest||(a.id&&String(a.id).startsWith("guest_"))||aName.toLowerCase().includes("guest")):aName.toLowerCase().includes("guest");
                return (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:T.bg2, borderRadius:8, border:`1px solid ${T.borderLight}`, marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(217,119,6,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>🅰️</div>
                      <span style={{ fontWeight:600, color:T.text, fontSize:14 }}>{aName}</span>
                      {isGuest && <span style={{ background:T.hoverBg, color:T.textMuted, border:`1px solid ${T.border}`, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, letterSpacing:1 }}>GUEST</span>}
                    </div>
                    {aCount > 1 && (
                      <span style={{ fontFamily:"'Bebas Neue',sans-serif", color:T_GOLD, background:"rgba(217,119,6,0.1)", border:"1px solid rgba(217,119,6,0.2)", padding:"3px 10px", borderRadius:6, fontSize:12, letterSpacing:1 }}>
                        {aCount} ASSISTS
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {defActions.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, letterSpacing:3, color:"#2563eb", marginBottom:10 }}>🛡️ DEFENSIVE ACTIONS ({defActions.length})</div>
              {defActions.map((d,i) => {
                const dName = typeof d==="string"?d:d.name;
                const isGuest = typeof d==="object"?(d.isGuest||(d.id&&String(d.id).startsWith("guest_"))||dName.toLowerCase().includes("guest")):dName.toLowerCase().includes("guest");
                const statsArr = [];
                if (d.blocks > 0) statsArr.push(`${d.blocks} BLK`);
                if (d.interceptions > 0) statsArr.push(`${d.interceptions} INT`);
                if (d.clearances > 0) statsArr.push(`${d.clearances} CLR`);
                const statStr = statsArr.join(" · ") || "Defensive Contributor";
                return (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:T.bg2, borderRadius:8, border:`1px solid ${T.borderLight}`, marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(37,99,235,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>🛡️</div>
                      <span style={{ fontWeight:600, color:T.text, fontSize:14 }}>{dName}</span>
                      {isGuest && <span style={{ background:T.hoverBg, color:T.textMuted, border:`1px solid ${T.border}`, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, letterSpacing:1 }}>GUEST</span>}
                    </div>
                    <span style={{ fontFamily:"'Bebas Neue',sans-serif", color:"#2563eb", background:"rgba(37,99,235,0.1)", border:"1px solid rgba(37,99,235,0.2)", padding:"3px 10px", borderRadius:6, fontSize:12, letterSpacing:1 }}>
                      {statStr}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {summary
            ? <div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, letterSpacing:3, color:T.textDim, marginBottom:8 }}>MATCH SUMMARY</div>
                <p style={{ fontSize:14, color:T.textMuted, lineHeight:1.8, background:T.bg2, borderRadius:8, padding:"14px 16px", border:`1px solid ${T.borderLight}` }}>{summary}</p>
              </div>
            : (!isUpc && scorers.length===0 && assists.length===0 && defActions.length===0 &&
                <div style={{ textAlign:"center", padding:"16px 0", color:T.textDim, fontSize:14 }}>No match details yet.</div>)
          }
          {isUpc && <div style={{ textAlign:"center", padding:"14px 0", color:T.textMuted, fontSize:14 }}>This match hasn't been played yet!</div>}
        </div>
      </div>
    </div>
  );
}

function PlayerModal({ player, onClose, T = THEMES.dark }) {
  const p = player;
  const pc = POS_COLOR[p.pos] || T_RED;
  const isGK = p.pos === "Goalkeeper";
  const isDef = p.pos === "Defender";
  const hasDefStats = isDef && ((p.blocks || 0) + (p.interceptions || 0) + (p.clearances || 0) > 0);

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.80)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(12px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.cardBg, borderRadius:20, width:"100%", maxWidth:420, overflow:"hidden", animation:"fadeUp 0.25s ease", boxShadow:"0 30px 80px rgba(0,0,0,0.5)", border:`1px solid ${T.border}` }}>
        <div style={{ position:"relative", height:250, background:T.bg2, overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${pc},transparent)` }} />
          {p.photoURL
            ? <img src={p.photoURL} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />
            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", opacity:0.12 }}>
                <svg width="100" height="100" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="28" r="18" fill={T.text}/><path d="M6 76c0-18.778 15.222-34 34-34s34 15.222 34 34" fill={T.text}/></svg>
              </div>
          }
          <div style={{ position:"absolute", inset:0, background:`linear-gradient(to top, ${T.cardBg} 0%, rgba(0,0,0,0.2) 60%, transparent 100%)` }} />
          <button onClick={onClose} style={{ position:"absolute", top:12, right:12, background:T.hoverBg, border:`1px solid ${T.border}`, color:T.text, width:34, height:34, borderRadius:"50%", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          <div style={{ position:"absolute", top:12, left:12, background:pc, borderRadius:5, padding:"4px 12px" }}>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:"white", letterSpacing:2.5 }}>{p.pos.toUpperCase()}</span>
          </div>
          <div style={{ position:"absolute", bottom:14, left:16 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:12, color:T.textDim, letterSpacing:3, marginBottom:2 }}>#{p.jersey}</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:40, color:T.text, lineHeight:0.9 }}>{p.name}</div>
          </div>
        </div>
        <div style={{ padding:"18px 18px 22px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
            {(isGK
              ? [["SAVES",p.saves,"#60a5fa"],["CLEAN SHT",p.cleanSheets,"#4ade80"],["APPS",p.appearances,T.textMuted]]
              : hasDefStats
              ? [["BLOCKS",p.blocks||0,"#60a5fa"],["INTERCEPT",p.interceptions||0,"#38bdf8"],["CLEARANCES",p.clearances||0,"#4ade80"]]
              : [["GOALS",p.goals,T_RED],["ASSISTS",p.assists,"#fbbf24"],["APPS",p.appearances,T.textMuted]]
            ).map(([l,v,c]) => (
              <div key={l} style={{ background:T.bg2, border:`1px solid ${T.borderLight}`, borderRadius:10, padding:"12px 8px", textAlign:"center", borderTop:`2px solid ${c}` }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, color:c, lineHeight:1 }}>{v||0}</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:10, letterSpacing:2, color:T.textDim, marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
          {hasDefStats && ((p.goals||0) > 0 || (p.assists||0) > 0) && (
            <div style={{ background:T.bg2, border:`1px solid ${T.borderLight}`, borderRadius:8, padding:"8px 12px", marginBottom:12, display:"flex", justifyContent:"space-around", alignItems:"center", fontSize:12, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1.5 }}>
              <span style={{ color:T_RED }}>⚽ {p.goals||0} GOALS</span>
              <span style={{ color:T.borderLight }}>|</span>
              <span style={{ color:T_GOLD }}>🅰️ {p.assists||0} ASSISTS</span>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[["POSITION",p.pos],["JERSEY",`#${p.jersey}`],["CLUB","NAFC"],["APPEARANCES",`${p.appearances||0} APPS`]].map(([l,v]) => (
              <div key={l} style={{ background:T.bg2, borderRadius:8, padding:"10px 14px", border:`1px solid ${T.borderLight}` }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:10, letterSpacing:2.5, color:T.textDim, marginBottom:3 }}>{l}</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:T.textMuted, letterSpacing:1 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const { user, loading, logout } = useAuth();
  const [pg, setPg] = useState("Home");
  const [sLgn, setSLgn] = useState(false);
  const [aVw, setAVw] = useState(false);
  const [sel, setSel] = useState(null);
  const [selMatch, setSelMatch] = useState(null);
  const [selStatPlayer, setSelStatPlayer] = useState(null);
  const [pFltr, setPFltr] = useState("All");
  const [statTab, setStatTab] = useState("season");
  const [selMonth, setSelMonth] = useState("");
  const [srch, setSrch] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [plrs, setPlrs] = useState([]);
  const [mtchs, setMtchs] = useState([]);
  const [gal, setGal] = useState([]);
  const [newsList, setNewsList] = useState(DEFAULT_ANNOUNCEMENTS);
  const [newsFltr, setNewsFltr] = useState("All");
  const [heroURL, setHeroURL] = useState(HUDDLE_DEFAULT);
  const [mobileNav, setMobileNav] = useState(false);
  
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem("nafc_theme") || "dark";
    } catch (e) {
      return "dark";
    }
  });

  const toggleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("nafc_theme", next);
      } catch (e) {}
      return next;
    });
  };

  const T = THEMES[themeMode] || THEMES.dark;

  const heroRef = useRef(null);
  const w = useWindowWidth();
  const isMobile = w < 768;
  const isTablet = w >= 768 && w < 1024;

  useEffect(() => {
    const uP = onSnapshot(collection(db,"players"), s => setPlrs(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.jersey-b.jersey)));
    const uM = onSnapshot(query(collection(db,"matches"),orderBy("date","desc")), s => setMtchs(s.docs.map(d=>({id:d.id,...d.data()}))));
    const uG = onSnapshot(query(collection(db,"gallery"),orderBy("createdAt","desc")), s => setGal(s.docs.map(d=>({id:d.id,...d.data()}))));
    const uS = onSnapshot(doc(db,"siteSettings","heroImage"), snap => {
      if (snap.exists() && snap.data().url) setHeroURL(snap.data().url);
      else setHeroURL(HUDDLE_DEFAULT);
    });
    const uA = onSnapshot(query(collection(db,"announcements"),orderBy("date","desc")), s => {
      if (!s.empty) {
        setNewsList(s.docs.map(d=>({id:d.id,...d.data()})));
      } else {
        setNewsList(DEFAULT_ANNOUNCEMENTS);
      }
    });
    return () => { uP(); uM(); uG(); uS(); uA(); };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || pg !== "Home" || isMobile) return;
    const onScroll = () => { hero.style.transform = `translateY(${window.scrollY * 0.25}px)`; };
    window.addEventListener("scroll", onScroll, { passive:true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pg, isMobile]);

  if (loading) return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:T.bg }}>
      <div style={{ textAlign:"center" }}>
        <img src={LOGO} alt="" style={{ width:60, animation:"spin 1.2s linear infinite" }} />
        <div style={{ color:T_RED, fontFamily:"'Bebas Neue',sans-serif", fontSize:13, letterSpacing:5, marginTop:16 }}>LOADING</div>
      </div>
    </div>
  );
  if (aVw) return <AdminDashboard onBack={() => setAVw(false)} />;

  const td = new Date(); td.setHours(0,0,0,0);
  const upc    = mtchs.filter(m=>m.result==="upcoming"&&new Date(m.date)>=td).sort((a,b)=>a.date>b.date?1:-1);
  const played = mtchs.filter(m=>m.result!=="upcoming");
  const lastM  = played[0];
  const wins   = played.filter(m=>m.result==="W").length;
  const losses = played.filter(m=>m.result==="L").length;
  const draws  = played.filter(m=>m.result==="D").length;
  const fPlrs  = plrs.filter(p=>(pFltr==="All"||p.pos===pFltr)&&p.name.toLowerCase().includes(srch.toLowerCase()));

  // ── Monthly Stats Aggregation ──
  const availableMonths = Array.from(
    new Set(
      played
        .map(m => (m.date ? String(m.date).slice(0, 7) : null))
        .filter(Boolean)
    )
  ).sort((a, b) => b.localeCompare(a));

  const activeMonth = selMonth || (availableMonths[0] || new Date().toISOString().slice(0, 7));

  const getMonthLabel = (ym) => {
    if (!ym) return "";
    const parts = ym.split("-");
    if (parts.length < 2) return ym;
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const d = new Date(year, month, 1);
    return isNaN(d.getTime()) ? ym : d.toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase();
  };

  const monthMatches = played.filter(m => m.date && String(m.date).startsWith(activeMonth));
  const monthWins = monthMatches.filter(m => m.result === "W").length;
  const monthLosses = monthMatches.filter(m => m.result === "L").length;
  const monthDraws = monthMatches.filter(m => m.result === "D").length;
  const monthGoalsCount = monthMatches.reduce((a, m) => a + (Number(m.nafcScore) || 0), 0);

  const playerMonthlyStats = plrs.map(p => {
    let goals = 0;
    let assists = 0;
    let appearances = 0;
    let blocks = 0;
    let interceptions = 0;
    let clearances = 0;

    monthMatches.forEach(m => {
      if ((m.ap && m.ap.includes(p.id)) || (m.appearances && m.appearances.includes(p.id))) {
        appearances += 1;
      } else if (
        (m.scorers && m.scorers.some(s => (typeof s === "object" ? s.id === p.id || s.name === p.name : s === p.name))) ||
        (m.assisters && m.assisters.some(a => (typeof a === "object" ? a.id === p.id || a.name === p.name : a === p.name))) ||
        (m.defensiveActions && m.defensiveActions.some(d => (typeof d === "object" ? d.id === p.id || d.name === p.name : d === p.name)))
      ) {
        appearances += 1;
      }

      if (m.scorers) {
        m.scorers.forEach(s => {
          if (typeof s === "object") {
            if (s.id === p.id || s.name === p.name) {
              goals += Number(s.goals) || 1;
            }
          } else if (s === p.name) {
            goals += 1;
          }
        });
      }

      if (m.assisters) {
        m.assisters.forEach(a => {
          if (typeof a === "object") {
            if (a.id === p.id || a.name === p.name) {
              assists += Number(a.assists) || 1;
            }
          } else if (a === p.name) {
            assists += 1;
          }
        });
      }

      if (m.defensiveActions) {
        m.defensiveActions.forEach(d => {
          if (typeof d === "object") {
            if (d.id === p.id || d.name === p.name) {
              blocks += Number(d.blocks) || 0;
              interceptions += Number(d.interceptions) || 0;
              clearances += Number(d.clearances) || 0;
            }
          }
        });
      }
    });

    const monthDefActions = blocks + interceptions + clearances;

    return {
      ...p,
      monthGoals: goals,
      monthAssists: assists,
      monthBlocks: blocks,
      monthInterceptions: interceptions,
      monthClearances: clearances,
      monthDefActions: monthDefActions,
      monthAppearances: appearances,
      monthContributions: goals + assists,
    };
  });

  const topScorerMonth = [...playerMonthlyStats].sort((a,b) => (b.monthGoals||0) - (a.monthGoals||0))[0];
  const topAssistMonth = [...playerMonthlyStats].sort((a,b) => (b.monthAssists||0) - (a.monthAssists||0))[0];
  const topPerformerMonth = [...playerMonthlyStats]
    .filter(p => (p.monthContributions || 0) > 0 || (p.monthAppearances || 0) > 0)
    .sort((a, b) => (b.monthContributions || 0) - (a.monthContributions || 0) || (b.monthGoals || 0) - (a.monthGoals || 0) || (b.monthAppearances || 0) - (a.monthAppearances || 0))[0];

  const go = p => { setPg(p); setSel(null); setSrch(""); setMobileNav(false); window.scrollTo(0,0); };

  // Responsive padding
  const px = isMobile ? "16px" : isTablet ? "28px" : "56px";

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:T.bg, minHeight:"100vh", color:T.text, fontSize:"15px", overflowX:"hidden", transition:"background 0.25s ease, color 0.25s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{-webkit-text-size-adjust:100%;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:${T.bg2};}
        ::-webkit-scrollbar-thumb{background:${T_RED};border-radius:2px;}
        .bebas{font-family:'Bebas Neue',sans-serif;letter-spacing:2px;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-24px);}to{opacity:1;transform:translateX(0);}}
        @keyframes slideInRight{from{transform:translateX(100%);}to{transform:translateX(0);}}
        .nav-link{position:relative;cursor:pointer;font-family:'Bebas Neue',sans-serif;letter-spacing:2px;font-size:15px;color:${T.textMuted};transition:color 0.3s;padding:4px 0;}
        .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:2px;background:${T_RED};transition:width 0.3s ease;}
        .nav-link:hover{color:${T.text};}
        .nav-link:hover::after,.nav-link.active::after{width:100%;}
        .nav-link.active{color:${T.text};}
        .pcard{position:relative;cursor:pointer;overflow:hidden;border-radius:14px;background:${T.cardBg};border:1px solid ${T.border};transition:transform 0.35s cubic-bezier(0.23,1,0.32,1),border-color 0.3s,box-shadow 0.3s;}
        .pcard:hover{transform:translateY(-6px);border-color:rgba(232,0,45,0.5);box-shadow:0 16px 48px rgba(232,0,45,0.22);}
        .pcard:hover .pcard-glow{opacity:1;}
        .pcard-glow{position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(to right,${T_RED},#ff6b6b,${T_RED});opacity:0;transition:opacity 0.3s;}
        .stat-card{background:${T.cardBg};border:1px solid ${T.border};border-radius:16px;overflow:hidden;transition:border-color 0.3s,transform 0.3s,box-shadow 0.3s;box-shadow:0 2px 12px rgba(0,0,0,0.2);}
        .stat-card:hover{border-color:rgba(232,0,45,0.35);transform:translateY(-3px);box-shadow:0 12px 40px rgba(232,0,45,0.15);}
        .gal-item{break-inside:avoid;margin-bottom:6px;cursor:zoom-in;position:relative;border-radius:6px;overflow:hidden;}
        .gal-item img{width:100%;display:block;transition:transform 0.5s cubic-bezier(0.23,1,0.32,1);}
        .gal-item:hover img{transform:scale(1.05);}
        .gal-item .ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(232,0,45,0.7) 0%,transparent 55%);opacity:0;transition:opacity 0.3s;display:flex;align-items:flex-end;padding:12px;}
        .gal-item:hover .ov{opacity:1;}
        .btn-red{background:${T_RED};color:white;border:none;cursor:pointer;font-family:'Bebas Neue',sans-serif;letter-spacing:3px;transition:all 0.2s;}
        .btn-red:hover{background:#c8002a;box-shadow:0 6px 24px rgba(232,0,45,0.4);transform:translateY(-1px);}
        .btn-outline{background:transparent;color:${T.text};cursor:pointer;font-family:'Bebas Neue',sans-serif;letter-spacing:3px;border:2px solid ${T.border};transition:all 0.2s;}
        .btn-outline:hover{border-color:${T.text};background:${T.hoverBg};}
        .section-label{font-family:'Bebas Neue',sans-serif;letter-spacing:4px;font-size:12px;color:${T_RED};}
        .lb-row{display:flex;justify-content:space-between;align-items:center;padding:10px 8px;border-bottom:1px solid ${T.borderLight};cursor:pointer;transition:all 0.2s;border-radius:8px;}
        .lb-row:hover{background:${T.hoverBg};}
        .lb-row:last-child{border-bottom:none;}
        .profile-stat-box{background:${T.cardBg};border:1px solid ${T.border};border-radius:14px;padding:20px 14px;text-align:center;transition:all 0.25s;box-shadow:0 2px 8px rgba(0,0,0,0.15);}
        .profile-stat-box:hover{background:${T.bg2};border-color:rgba(232,0,45,0.45);transform:translateY(-2px);}
        .fx-timeline-card{background:${T.cardBg};border-radius:16px;overflow:hidden;cursor:pointer;transition:all 0.3s cubic-bezier(0.23,1,0.32,1);box-shadow:0 2px 12px rgba(0,0,0,0.15);border:1px solid ${T.border};}
        .fx-timeline-card:hover{transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,0.25);border-color:${T_RED}60;}
        .mobile-nav-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:190;backdrop-filter:blur(4px);}
        .mobile-nav-drawer{position:fixed;top:0;right:0;bottom:0;width:280px;background:${T.cardBg};border-left:1px solid ${T.border};z-index:191;padding:24px;display:flex;flex-direction:column;gap:8px;box-shadow:-8px 0 40px rgba(0,0,0,0.5);animation:slideInRight 0.3s ease;}
        .player-profile-grid{display:grid;grid-template-columns:42% 58%;min-height:80vh;}
        @media(max-width:1023px){.player-profile-grid{grid-template-columns:1fr;min-height:auto;}}

        /* ── MOBILE ── */
        @media(max-width:767px){
          .hide-mobile{display:none!important;}
          .stat-grid-4{grid-template-columns:repeat(2,1fr)!important;}
          .stat-grid-3{grid-template-columns:1fr!important;}
          .leaderboard-grid-4{display:grid;grid-template-columns:1fr!important;gap:12px;}
          .squad-grid{grid-template-columns:repeat(2,1fr)!important;}
          .home-stats-bar{grid-template-columns:1fr!important;}
          .footer-grid{grid-template-columns:1fr!important;}
          .fx-score-font{font-size:38px!important;}
          .pos-filter-bar{flex-wrap:wrap;}
        }

        /* ── TABLET (iPad) ── */
        @media(min-width:768px) and (max-width:1023px){
          .stat-grid-4{grid-template-columns:repeat(2,1fr)!important;}
          .stat-grid-3{grid-template-columns:repeat(3,1fr)!important;}
          .leaderboard-grid-4{display:grid;grid-template-columns:repeat(2,1fr)!important;gap:14px;}
          .squad-grid{grid-template-columns:repeat(3,1fr)!important;}
          .home-stats-bar{grid-template-columns:1fr 1fr 1fr!important;}
          .footer-grid{grid-template-columns:1fr 1fr!important;}
          .fx-score-font{font-size:44px!important;}
        }

        /* ── DESKTOP ── */
        @media(min-width:1024px){
          .stat-grid-4{grid-template-columns:repeat(4,1fr)!important;}
          .stat-grid-3{grid-template-columns:repeat(3,1fr)!important;}
          .leaderboard-grid-4{display:grid;grid-template-columns:repeat(4,1fr)!important;gap:14px;}
          .squad-grid{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))!important;}
          .home-stats-bar{grid-template-columns:1fr 1fr 1fr!important;}
          .footer-grid{grid-template-columns:1fr 1fr 1fr!important;}
        }
      `}</style>

      {sLgn && <LoginPage onClose={() => setSLgn(false)} />}
      {selMatch && <MatchModal match={selMatch} onClose={() => setSelMatch(null)} T={T} />}
      {selStatPlayer && <PlayerModal player={selStatPlayer} onClose={() => setSelStatPlayer(null)} T={T} />}

      {/* Mobile Nav Drawer */}
      {mobileNav && (
        <>
          <div className="mobile-nav-overlay" onClick={() => setMobileNav(false)} />
          <div className="mobile-nav-drawer">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, paddingBottom:16, borderBottom:`2px solid ${T_RED}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <img src={LOGO} alt="NAFC" style={{ width:36 }} />
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:T.text }}>NAFC</span>
              </div>
              <button onClick={() => setMobileNav(false)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:T.text }}>✕</button>
            </div>
            
            {/* Dark/Light toggle in mobile drawer */}
            <button onClick={toggleTheme} style={{ background:T.bg2, color:T.text, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 16px", fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:2, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <span>APPEARANCE</span>
              <span>{themeMode === "dark" ? "🌙 DARK MODE" : "☀️ LIGHT MODE"}</span>
            </button>

            {PGS.map(p => (
              <button key={p} onClick={() => go(p)} style={{ background:pg===p?T_RED:"transparent", color:pg===p?"#fff":T.text, border:`1px solid ${pg===p?T_RED:T.border}`, borderRadius:8, padding:"12px 18px", fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:3, cursor:"pointer", textAlign:"left", transition:"all 0.2s" }}>{p}</button>
            ))}
            <div style={{ marginTop:"auto", paddingTop:16, borderTop:`1px solid ${T.borderLight}` }}>
              {user ? (
                <>
                  <button onClick={() => { setAVw(true); setMobileNav(false); }} style={{ background:T_GOLD, color:"#fff", border:"none", borderRadius:8, padding:"10px 18px", fontFamily:"'Bebas Neue',sans-serif", fontSize:13, letterSpacing:3, cursor:"pointer", width:"100%", marginBottom:8 }}>DASHBOARD</button>
                  <button onClick={logout} style={{ background:T.hoverBg, color:T.text, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 18px", fontFamily:"'Bebas Neue',sans-serif", fontSize:13, letterSpacing:3, cursor:"pointer", width:"100%" }}>LOGOUT</button>
                </>
              ) : (
                <button onClick={() => { setSLgn(true); setMobileNav(false); }} style={{ background:T_RED, color:"#fff", border:"none", borderRadius:8, padding:"10px 18px", fontFamily:"'Bebas Neue',sans-serif", fontSize:13, letterSpacing:3, cursor:"pointer", width:"100%" }}>TEAM LOGIN</button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── NAV ── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, backdropFilter:"blur(24px)", background:T.navBg, borderBottom:`1px solid ${T.border}`, boxShadow:"0 2px 16px rgba(0,0,0,0.15)" }}>
        <div style={{ background:`linear-gradient(90deg,${T_RED} 0%,#c00024 100%)`, display:"flex", justifyContent:"space-between", alignItems:"center", padding:`5px ${px}`, fontSize:"11px", letterSpacing:"2px", fontFamily:"'Bebas Neue',sans-serif" }}>
          <span style={{ opacity:0.95, color:"white" }}>NAFC · BENGALURU · EST. 2025</span>
          <div style={{ display:"flex", gap:isMobile?12:20, alignItems:"center" }}>
            <a href="https://www.instagram.com/nafc.blr?igsh=MTJvNzV1cXFyNzRxMA==" target="_blank" rel="noreferrer" style={{ color:"white", textDecoration:"none", display:"flex", alignItems:"center", gap:5, opacity:0.95 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            {!isMobile && "@NAFC.BLR"}
          </a>
          {!isMobile && (user ? (
            <>
              <span onClick={() => setAVw(true)} style={{ cursor:"pointer", color:T_GOLD, fontWeight:600 }}>DASHBOARD</span>
              <span onClick={logout} style={{ cursor:"pointer", color:"white", opacity:0.85 }}>LOGOUT</span>
            </>
          ) : (
            <span onClick={() => setSLgn(true)} style={{ cursor:"pointer", color:"white" }}>TEAM LOGIN</span>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:`0 ${px}`, height:isMobile?54:isTablet?60:66 }}>
        <div onClick={() => go("Home")} style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
          <img src={LOGO} alt="NAFC" style={{ width:isMobile?34:isTablet?40:44, height:isMobile?34:isTablet?40:44, objectFit:"contain" }} />
          <div>
            <div className="bebas" style={{ fontSize:isMobile?17:isTablet?20:22, lineHeight:1, color:T.text }}>NAFC</div>
            <div style={{ fontSize:9, letterSpacing:3, color:T.textDim, fontWeight:600 }}>FOOTBALL CLUB</div>
          </div>
        </div>
        {/* Desktop & Tablet links */}
        {!isMobile && (
          <div style={{ display:"flex", gap:isTablet?20:36, alignItems:"center" }}>
            {PGS.map(p => (
              <span key={p} className={`nav-link ${pg===p?"active":""}`} onClick={() => go(p)} style={{ fontSize:isTablet?14:15 }}>{p}</span>
            ))}
          </div>
        )}
        
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Theme Toggle Button */}
          <button onClick={toggleTheme} title={`Switch to ${themeMode === "dark" ? "Light" : "Dark"} Mode`} style={{ background:T.hoverBg, border:`1px solid ${T.border}`, color:T.text, borderRadius:20, padding: isMobile?"5px 10px":"6px 14px", fontFamily:"'Bebas Neue',sans-serif", fontSize:isMobile?11:13, letterSpacing:1.5, cursor:"pointer", display:"flex", alignItems:"center", gap:5, transition:"all 0.2s" }}>
            <span>{themeMode === "dark" ? "☀️" : "🌙"}</span>
            <span className="hide-mobile">{themeMode === "dark" ? "LIGHT" : "DARK"}</span>
          </button>

          {isMobile ? (
            <button onClick={() => setMobileNav(true)} style={{ background:"none", border:`1.5px solid ${T.border}`, borderRadius:8, padding:"6px 10px", cursor:"pointer", display:"flex", flexDirection:"column", gap:4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width:20, height:2, background:T.text, borderRadius:1 }} />)}
            </button>
          ) : (
            <button onClick={() => go("Players")} className="btn-red bebas" style={{ padding:isTablet?"8px 18px":"9px 24px", fontSize:isTablet?13:14, borderRadius:6 }}>THE SQUAD</button>
          )}
        </div>
      </div>
    </nav>

      <div style={{ paddingTop: pg==="Home" ? 0 : (isMobile ? 80 : isTablet ? 88 : 96) }}>

        {/* ══════════════ HOME ══════════════ */}
        {pg === "Home" && (
          <div>
            {/* Hero */}
            <div style={{ position:"relative", height:"100vh", minHeight:500, overflow:"hidden" }}>
              <div ref={heroRef} style={{ position:"absolute", inset:0, willChange:"transform", backgroundImage:`url(${heroURL})`, backgroundSize:"cover", backgroundPosition:"center 60%", backgroundRepeat:"no-repeat" }} />
              <div style={{ position:"absolute", inset:0, background: T.heroGrad(isMobile) }} />
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"28%", background: T.heroFade }} />
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${T_RED},#ff6b6b,transparent)` }} />
              <div style={{ position:"absolute", bottom: isMobile?"18%":"14%", left:px, right: isMobile ? px : "auto", zIndex:4, animation:"fadeUp 0.9s ease forwards" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <div style={{ width:28, height:2, background:T_RED }} />
                  <div className="section-label">BENGALURU · 2026 SEASON</div>
                </div>
                <div className="bebas" style={{ fontSize: isMobile?"clamp(48px,13vw,68px)":isTablet?"clamp(52px,9vw,76px)":"clamp(60px,8vw,96px)", lineHeight:0.85, color:T.text }}>WE ARE<br /><span style={{ color:T_RED, fontSize:"1.08em" }}>NAFC</span></div>
                <div style={{ width:64, height:3, background:`linear-gradient(90deg,${T_RED},transparent)`, margin:"18px 0" }} />
                <p style={{ color:T.textMuted, fontSize: isMobile?13:15, maxWidth:380, lineHeight:1.9, fontWeight:400 }}>Passion. Brotherhood. The Beautiful Game.<br />Follow our journey through the 2026 season.</p>
                <div style={{ display:"flex", gap:10, marginTop:28, flexWrap:"wrap" }}>
                  <button onClick={() => go("Players")} className="btn-red bebas" style={{ padding: isMobile?"10px 24px":"13px 36px", fontSize:13, borderRadius:6 }}>MEET THE SQUAD</button>
                  <button onClick={() => go("Fixtures")} className="btn-outline bebas" style={{ padding: isMobile?"10px 24px":"13px 36px", fontSize:13, borderRadius:6 }}>FIXTURES</button>
                </div>
              </div>
            </div>

            {/* ── Stats bar — always 3 columns ── */}
            <div style={{ background:T.cardBg, borderTop:`3px solid ${T_RED}`, borderBottom:`1px solid ${T.border}` }}>
              <div className="home-stats-bar" style={{ maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr 1fr" }}>
                {/* Latest Result */}
                <div style={{ padding: isMobile?"16px":isTablet?"20px 24px":"28px 36px", borderRight:`1px solid ${T.borderLight}` }}>
                  <div className="section-label" style={{ marginBottom:10 }}>LATEST RESULT</div>
                  {lastM ? (
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                        <img src={LOGO} alt="NAFC" style={{ width:isMobile?22:28 }} />
                        <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:isMobile?38:isTablet?44:54, color:T.text, lineHeight:1 }}>{lastM.nafcScore}</span>
                          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:isMobile?16:20, color:T.textDim, margin:"0 3px" }}>—</span>
                          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:isMobile?38:isTablet?44:54, color:T.textMuted, lineHeight:1 }}>{lastM.opponentScore}</span>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                        <span style={{ background:lastM.result==="W"?"rgba(22,163,74,0.12)":lastM.result==="L"?"rgba(232,0,45,0.10)":"rgba(217,119,6,0.10)", color:lastM.result==="W"?"#16a34a":lastM.result==="L"?T_RED:T_GOLD, fontSize:10, letterSpacing:2, padding:"3px 10px", fontFamily:"'Bebas Neue',sans-serif", borderRadius:4 }}>{lastM.result==="W"?"WIN":lastM.result==="L"?"LOSS":"DRAW"}</span>
                        <span style={{ fontSize:12, color:T.textDim }}>{lastM.opponent} · {lastM.date}</span>
                      </div>
                    </div>
                  ) : <div style={{ color:T.textDim, fontSize:13 }}>No matches yet.</div>}
                </div>

                {/* Next Match */}
                <div style={{ padding: isMobile?"16px":isTablet?"20px 24px":"28px 36px", borderRight:`1px solid ${T.borderLight}` }}>
                  <div className="section-label" style={{ marginBottom:10 }}>NEXT MATCH</div>
                  {upc[0] ? (
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                        <img src={LOGO} alt="NAFC" style={{ width:isMobile?20:24 }} />
                        <div className="bebas" style={{ fontSize:13, color:T.textDim }}>VS</div>
                        <div style={{ fontSize:16 }}>🛡️</div>
                        <div className="bebas" style={{ fontSize:isMobile?15:17, color:T.text }}>{upc[0].opponent}</div>
                      </div>
                      <div style={{ fontSize:12, color:T.textMuted, lineHeight:1.8 }}>
                        <span style={{ color:T_GOLD, fontWeight:600 }}>{upc[0].date}</span> · {upc[0].competition}
                        {upc[0].venue&&<><br />{upc[0].venue}</>}
                      </div>
                    </div>
                  ) : <div style={{ color:T.textDim, fontSize:13 }}>No upcoming fixtures.</div>}
                </div>

                {/* Squad Stats */}
                <div style={{ padding: isMobile?"16px":isTablet?"20px 24px":"28px 36px" }}>
                  <div className="section-label" style={{ marginBottom:10 }}>SQUAD STATS</div>
                  <div style={{ display:"flex", gap:isMobile?14:isTablet?18:24 }}>
                    {[["PLAYERS",plrs.length],["GOALS",plrs.reduce((a,p)=>a+(p.goals||0),0)],["GAMES",played.length]].map(([l,v]) => (
                      <div key={l}>
                        <div className="bebas" style={{ fontSize:isMobile?28:isTablet?34:40, color:T.text, lineHeight:1 }}>{v}</div>
                        <div style={{ fontSize:10, letterSpacing:2, color:T.textDim, marginTop:4, fontFamily:"'Bebas Neue',sans-serif" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Breaking / Tournament Alert Banner ── */}
            <div style={{ maxWidth:1200, margin:"24px auto 0", padding:`0 ${px}` }}>
              <div onClick={() => go("News")} style={{ background: themeMode==="dark"?"linear-gradient(135deg, rgba(232,0,45,0.16) 0%, rgba(37,99,235,0.16) 100%)":"linear-gradient(135deg, rgba(232,0,45,0.08) 0%, rgba(37,99,235,0.08) 100%)", border:`1px solid ${themeMode==="dark"?"rgba(232,0,45,0.4)":"rgba(232,0,45,0.25)"}`, borderRadius:14, padding: isMobile?"14px 16px":"16px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", flexWrap:"wrap", gap:12, transition:"all 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor=T_RED;}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor=themeMode==="dark"?"rgba(232,0,45,0.4)":"rgba(232,0,45,0.25)";}}>
                <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                  <span style={{ background:T_RED, color:"#fff", fontFamily:"'Bebas Neue',sans-serif", fontSize:12, letterSpacing:2, padding:"3px 10px", borderRadius:5 }}>🏆 TOURNAMENT DAY · SEPT 6</span>
                  <span style={{ color:T.text, fontWeight:600, fontSize:isMobile?13:15 }}>5-a-Side Squads Announced: <strong>NAFC</strong> & <strong>ENNE FC (EFC)</strong></span>
                </div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", color:T_RED, fontSize:13, letterSpacing:2, display:"flex", alignItems:"center", gap:4 }}>
                  VIEW SQUADS & LIVE UPDATES →
                </div>
              </div>
            </div>

            {/* ── Challenge NAFC / Contact Us Banner ── */}
            <div style={{ maxWidth:1200, margin:"0 auto", padding:`32px ${px} 48px` }}>
              <div style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderTop:`4px solid ${T_RED}`, borderRadius:16, padding: isMobile?"24px 18px":"32px 36px", display:"flex", flexDirection: isMobile?"column":"row", alignItems: isMobile?"flex-start":"center", justifyContent:"space-between", gap:20, boxShadow:"0 8px 30px rgba(0,0,0,0.08)" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <span style={{ background:"rgba(22,163,74,0.12)", color:"#16a34a", border:"1px solid rgba(22,163,74,0.25)", borderRadius:4, padding:"2px 8px", fontFamily:"'Bebas Neue',sans-serif", fontSize:11, letterSpacing:2 }}>OPEN FOR FIXTURES & TRIALS</span>
                    <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:T.textDim, letterSpacing:2 }}>BENGALURU</span>
                  </div>
                  <div className="bebas" style={{ fontSize: isMobile?28:36, color:T.text, lineHeight:1, marginBottom:8 }}>WANT TO CHALLENGE <span style={{ color:T_RED }}>NAFC?</span></div>
                  <p style={{ color:T.textMuted, fontSize:14, margin:0, maxWidth:580, lineHeight:1.7 }}>
                    Looking to book a 5v5, 7v7, or 11v11 friendly match against NAFC in Bengaluru? Or interested in joining the squad for upcoming trials? Drop us a text on our official Instagram page.
                  </p>
                </div>
                <a href="https://www.instagram.com/nafc.blr?igsh=MTJvNzV1cXFyNzRxMA==" target="_blank" rel="noreferrer" style={{ textDecoration:"none", flexShrink:0, width: isMobile?"100%":"auto" }}>
                  <button className="bebas btn-red" style={{ padding: isMobile?"12px 20px":"14px 28px", fontSize:14, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", width: isMobile?"100%":"auto" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    <span>DROP US A DM (@NAFC.BLR)</span>
                  </button>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ PLAYERS LIST ══════════════ */}
        {pg === "Players" && !sel && (
          <div style={{ background:T.bg, minHeight:"100vh", paddingBottom:60 }}>
            {/* Header */}
            <div style={{ background:T.headerGrad, borderBottom:`1px solid ${T.border}`, padding:`${isMobile?"28px":isTablet?"36px":"50px"} ${px} ${isMobile?"20px":"32px"}`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 59px,${T.borderLight} 59px,${T.borderLight} 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,${T.borderLight} 59px,${T.borderLight} 60px)` }} />
              <div style={{ maxWidth:1200, margin:"0 auto", position:"relative", zIndex:1 }}>
                <div className="section-label" style={{ marginBottom:8 }}>NAFC · 2026</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems: isMobile?"flex-start":"flex-end", flexWrap:"wrap", gap:12 }}>
                  <div className="bebas" style={{ fontSize: isMobile?40:isTablet?52:64, color:T.text, lineHeight:0.88 }}>THE <span style={{ color:T_RED }}>SQUAD</span></div>
                  {/* Position filter */}
                  <div className="pos-filter-bar" style={{ display:"flex", gap:4, background:T.subtleBg, border:`1px solid ${T.border}`, padding:4, borderRadius:8, flexWrap:"wrap" }}>
                    {["All","Goalkeeper","Defender","Midfielder","Winger","Forward","Striker"].map(pos => (
                      <button key={pos} onClick={() => setPFltr(pos)} className="bebas" style={{ background:pFltr===pos?T_RED:"transparent", color:pFltr===pos?"#fff":T.textMuted, border:"none", padding: isMobile?"6px 10px":isTablet?"7px 12px":"8px 16px", fontSize:isMobile?11:12, cursor:"pointer", letterSpacing:2, borderRadius:5, transition:"all 0.2s" }}>
                        {pos==="All"?"ALL":pos.slice(0,3).toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ maxWidth:1200, margin:"0 auto", padding:`24px ${px} 0` }}>
              {fPlrs.length === 0
                ? <div style={{ textAlign:"center", padding:60, color:T.textDim }}>No players found.</div>
                : <div className="squad-grid" style={{ display:"grid", gap:isMobile?10:14 }}>
                    {fPlrs.map((p,i) => (
                      <div key={p.id} className="pcard" onClick={() => setSel(p)} style={{ animation:`fadeUp 0.4s ${i*0.04}s ease both` }}>
                        <div style={{ height:3, background:`linear-gradient(90deg,${POS_COLOR[p.pos]||T_RED},transparent)` }} />
                        <div style={{ height: isMobile?200:isTablet?240:270, background:T.subtleBg, position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <div className="bebas" style={{ position:"absolute", bottom:-8, right:-4, fontSize:90, color:T.textDim, opacity:0.18, lineHeight:1, userSelect:"none" }}>{p.jersey}</div>
                          {p.photoURL
                            ? <img src={p.photoURL} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />
                            : <svg width="70" height="70" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="28" r="18" fill={T.text} opacity="0.15" /><path d="M6 76c0-18.778 15.222-34 34-34s34 15.222 34 34" fill={T.text} opacity="0.10" /></svg>
                          }
                          <div style={{ position:"absolute", inset:0, background:`linear-gradient(to top, ${T.cardBg} 0%, transparent 50%)` }} />
                          <div style={{ position:"absolute", top:10, left:12, background:POS_COLOR[p.pos]||T_RED, borderRadius:4, padding:"3px 10px" }}>
                            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:"white", letterSpacing:2 }}>{p.pos.slice(0,3).toUpperCase()}</span>
                          </div>
                        </div>
                        <div style={{ padding:"12px 14px 16px", background:T.cardBg }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                            <div>
                              <div className="bebas" style={{ fontSize:isMobile?18:isTablet?20:22, color:T.text, letterSpacing:1, lineHeight:1.1 }}>{p.name}</div>
                              <div style={{ fontSize:10, color:T.textDim, letterSpacing:2, marginTop:3, fontFamily:"'Bebas Neue',sans-serif" }}>{p.pos.toUpperCase()}</div>
                            </div>
                            <div className="bebas" style={{ fontSize:22, color:T.textDim }}>#{p.jersey}</div>
                          </div>
                          <div style={{ display:"flex", gap:0, borderTop:`1px solid ${T.borderLight}`, paddingTop:10 }}>
                            {(p.pos==="Goalkeeper"
                              ? [["SVS",p.saves||0,"#2563eb"],["CS",p.cleanSheets||0,"#16a34a"],["APP",p.appearances||0,T.textMuted]]
                              : (p.pos==="Defender" && ((p.blocks||0)+(p.interceptions||0)+(p.clearances||0) > 0))
                              ? [["DEF",(p.blocks||0)+(p.interceptions||0)+(p.clearances||0),"#2563eb"],["G/A",(p.goals||0)+(p.assists||0),T_RED],["APP",p.appearances||0,T.textMuted]]
                              : [["G",p.goals||0,T_RED],["A",p.assists||0,T_GOLD],["APP",p.appearances||0,T.textMuted]]
                            ).map(([l,v,c],idx,arr) => (
                              <div key={l} style={{ flex:1, textAlign:"center", borderRight:idx<arr.length-1?`1px solid ${T.borderLight}`:"none" }}>
                                <div className="bebas" style={{ fontSize:18, color:c||T.text }}>{v||0}</div>
                                <div style={{ fontSize:10, letterSpacing:2, color:T.textDim, fontFamily:"'Bebas Neue',sans-serif", marginTop:2 }}>{l}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="pcard-glow" />
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}

        {/* ══════════════ PLAYER PROFILE ══════════════ */}
        {pg === "Players" && sel && (() => {
          const pc  = POS_COLOR[sel.pos] || T_RED;
          const isGK= sel.pos === "Goalkeeper";
          const isDef = sel.pos === "Defender";
          const hasDefStats = isDef && ((sel.blocks||0)+(sel.interceptions||0)+(sel.clearances||0) > 0);
          return (
            <div style={{ background:T.bg, minHeight:"100vh" }}>
              <div className="player-profile-grid" style={{ position:"relative", overflow: isMobile?"visible":"hidden" }}>
                {/* Left: Info card */}
                <div style={{ position:"relative", zIndex:3, display:"flex", flexDirection:"column", justifyContent:"center", padding: isMobile?`76px 18px 36px`:isTablet?`80px 28px 100px`:`96px 48px 120px 56px`, background:"linear-gradient(135deg,#18181b 0%,#202024 60%,#18181b 100%)", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 49px,rgba(255,255,255,0.014) 49px,rgba(255,255,255,0.014) 50px),repeating-linear-gradient(90deg,transparent,transparent 49px,rgba(255,255,255,0.014) 49px,rgba(255,255,255,0.014) 50px)", pointerEvents:"none" }} />
                  <div style={{ position:"absolute", top:"20%", left:"-5%", width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle, ${pc}22 0%, transparent 70%)`, pointerEvents:"none" }} />
                  <div style={{ position:"absolute", top:0, left:0, bottom:0, width:3, background:`linear-gradient(to bottom, ${pc}, ${pc}60, transparent)` }} />
                  <button onClick={() => setSel(null)} className="bebas" style={{ position:"absolute", top:isMobile?72:18, left:isMobile?14:18, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.75)", padding:"8px 20px", fontSize:12, letterSpacing:2, borderRadius:6, cursor:"pointer", zIndex:5 }}>← BACK</button>
                  <div style={{ position:"relative", zIndex:2 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <div style={{ background:pc, borderRadius:5, padding:"4px 14px" }}>
                        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:"white", letterSpacing:2.5 }}>{sel.pos.toUpperCase()}</span>
                      </div>
                      <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:"rgba(255,255,255,0.5)", letterSpacing:2 }}>NAFC · 2026</span>
                    </div>
                    <div className="bebas" style={{ fontSize:isMobile?20:isTablet?22:24, color:pc, letterSpacing:4, lineHeight:1, marginBottom:4 }}>#{sel.jersey}</div>
                    <div className="bebas" style={{ fontSize: isMobile?"clamp(32px,9vw,48px)":isTablet?"clamp(36px,5vw,56px)":"clamp(40px,4vw,64px)", color:"#fff", lineHeight:0.9, letterSpacing:1, marginBottom:14 }}>{sel.name}</div>
                    <div style={{ width:52, height:3, background:`linear-gradient(90deg,${pc},transparent)`, marginBottom:20, borderRadius:2 }} />
                    {isMobile && sel.photoURL && (
                      <div style={{ width:"100%", height:260, borderRadius:14, overflow:"hidden", marginBottom:20, border:`1px solid ${pc}30` }}>
                        <img src={sel.photoURL} alt={sel.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 35%" }} />
                      </div>
                    )}
                    {isMobile && !sel.photoURL && (
                      <div style={{ width:"100%", height:180, borderRadius:14, background:"rgba(255,255,255,0.04)", border:`1px solid rgba(255,255,255,0.08)`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
                        <div style={{ textAlign:"center" }}>
                          <svg width="60" height="60" viewBox="0 0 80 80" fill="none" style={{ opacity:0.15 }}><circle cx="40" cy="28" r="18" fill="white"/><path d="M6 76c0-18.778 15.222-34 34-34s34 15.222 34 34" fill="white"/></svg>
                          <div className="bebas" style={{ fontSize:11, color:"rgba(255,255,255,0.35)", letterSpacing:3, marginTop:8 }}>PHOTO COMING SOON</div>
                        </div>
                      </div>
                    )}
                    <div style={{ display:"flex", gap:0, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, overflow:"hidden" }}>
                      {(isGK
                        ?[["SAVES",sel.saves,"#60a5fa"],["CLEAN SHT",sel.cleanSheets,"#4ade80"],["APPS",sel.appearances,"rgba(255,255,255,0.7)"]]
                        :hasDefStats
                        ?[["BLOCKS",sel.blocks||0,"#60a5fa"],["INTERCEPT",sel.interceptions||0,"#38bdf8"],["CLEARANCES",sel.clearances||0,"#4ade80"],["APPS",sel.appearances,"rgba(255,255,255,0.7)"]]
                        :[["GOALS",sel.goals,T_RED],["ASSISTS",sel.assists,"#fbbf24"],["APPS",sel.appearances,"rgba(255,255,255,0.7)"]]
                      ).map(([l,v,c],idx,arr) => (
                        <div key={l} style={{ flex:1, padding: isMobile?"12px 6px":"16px 10px", textAlign:"center", borderRight:idx<arr.length-1?"1px solid rgba(255,255,255,0.07)":"none", borderTop:`2px solid ${c}` }}>
                          <div className="bebas" style={{ fontSize: isMobile?30:36, color:c, lineHeight:1 }}>{v||0}</div>
                          <div style={{ fontSize:10, letterSpacing:2, color:"rgba(255,255,255,0.6)", fontFamily:"'Bebas Neue',sans-serif", marginTop:4 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Photo (tablet + desktop) */}
                {!isMobile && (
                  <div style={{ position:"relative", overflow:"hidden", minHeight: isTablet?380:500, background:"#111" }}>
                    {sel.photoURL ? (
                      <>
                        <img src={sel.photoURL} alt={sel.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 35%", display:"block" }} />
                        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.15) 30%, transparent 55%)" }} />
                        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 55%, rgba(10,10,10,0.5) 100%)" }} />
                      </>
                    ) : (
                      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
                        <svg width="100" height="100" viewBox="0 0 80 80" fill="none" style={{ opacity:0.06 }}><circle cx="40" cy="28" r="18" fill="white"/><path d="M6 76c0-18.778 15.222-34 34-34s34 15.222 34 34" fill="white"/></svg>
                        <div className="bebas" style={{ fontSize:13, color:"rgba(255,255,255,0.22)", letterSpacing:4 }}>PHOTO COMING SOON</div>
                      </div>
                    )}
                    <div style={{ position:"absolute", top:0, left:0, bottom:0, width:100, background:"linear-gradient(135deg, #0a0a0a 0%, #141414 100%)", clipPath:"polygon(0 0, 70% 0, 30% 100%, 0 100%)", zIndex:4, pointerEvents:"none" }} />
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, ${pc} 0%, ${pc}60 40%, transparent 80%)`, zIndex:5 }} />
                  </div>
                )}

                {/* Bottom bar (tablet + desktop) */}
                {!isMobile && (
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:10, background:T.cardBg, borderTop:`1px solid ${T.border}`, display:"flex" }}>
                    {[["POSITION",sel.pos],["JERSEY",`#${sel.jersey}`],["CLUB","NAFC"],["SEASON","2026"]].map(([l,v],i,arr) => (
                      <div key={l} style={{ flex:1, padding: isTablet?"12px 16px":"14px 24px", borderRight:i<arr.length-1?`1px solid ${T.borderLight}`:"none" }}>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", letterSpacing:2.5, fontSize:10, color:T.textDim, marginBottom:3 }}>{l}</div>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", letterSpacing:2, fontSize:isTablet?13:15, color:l==="JERSEY"?pc:T.text, display:"flex", alignItems:"center", gap:6 }}>
                          {l==="CLUB"&&<img src={LOGO} alt="NAFC" style={{ width:14 }} />}
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile info bar */}
              {isMobile && (
                <div style={{ background:T.cardBg, borderTop:`1px solid ${T.border}`, display:"grid", gridTemplateColumns:"1fr 1fr" }}>
                  {[["POSITION",sel.pos],["JERSEY",`#${sel.jersey}`],["CLUB","NAFC"],["SEASON","2026"]].map(([l,v],i) => (
                    <div key={l} style={{ padding:"12px 14px", borderRight:i%2===0?`1px solid ${T.borderLight}`:"none", borderBottom:i<2?`1px solid ${T.borderLight}`:"none" }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", letterSpacing:2.5, fontSize:10, color:T.textDim, marginBottom:3 }}>{l}</div>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", letterSpacing:2, fontSize:14, color:l==="JERSEY"?pc:T.text }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats section */}
              <div style={{ background:T.bg, padding: isMobile?`28px ${px} 40px`:`40px ${px} 56px` }}>
                <div style={{ maxWidth:900, margin:"0 auto" }}>
                  <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr 1fr":"repeat(3,1fr)", gap:isMobile?10:14, marginBottom:32 }}>
                    {(isGK
                      ? [["SAVES",sel.saves,"#2563eb","Saves this season"],["CLEAN SHEETS",sel.cleanSheets,"#16a34a","Games without conceding"],["APPEARANCES",sel.appearances,T.text,"Games played"]]
                      : hasDefStats
                      ? [
                          ["BLOCKS",sel.blocks||0,"#2563eb","Crucial shots & passes blocked"],
                          ["INTERCEPTIONS",sel.interceptions||0,"#0ea5e9","Opponent attacks intercepted"],
                          ["CLEARANCES",sel.clearances||0,"#10b981","Dangerous balls cleared"],
                          ["GOALS",sel.goals||0,T_RED,"Goals scored"],
                          ["ASSISTS",sel.assists||0,T_GOLD,"Assists provided"],
                          ["APPEARANCES",sel.appearances||0,T.text,"Matches played"]
                        ]
                      : [["GOALS",sel.goals,T_RED,"Goals this season"],["ASSISTS",sel.assists,T_GOLD,"Assists provided"],["APPEARANCES",sel.appearances,T.text,"Games played"]]
                    ).map(([l,v,c,desc]) => (
                      <div key={l} className="profile-stat-box" style={{ borderTop:`3px solid ${c}` }}>
                        <div className="bebas" style={{ fontSize: isMobile?44:54, color:c, lineHeight:1, marginBottom:4 }}><StatNum value={v||0} /></div>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:isMobile?12:14, color:T.text, letterSpacing:2, marginBottom:4 }}>{l}</div>
                        <div style={{ fontSize:12, color:T.textDim }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                    <div style={{ width:3, height:18, background:T_RED, borderRadius:2 }} />
                    <div className="bebas" style={{ fontSize:16, color:T.text, letterSpacing:2 }}>OTHER SQUAD MEMBERS</div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:`repeat(auto-fill,minmax(${isMobile?"140px":"180px"},1fr))`, gap:8 }}>
                    {plrs.filter(p=>p.id!==sel.id).map(p => (
                      <div key={p.id} onClick={() => { setSel(p); window.scrollTo(0,0); }} style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px", cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", gap:8 }} onMouseEnter={e=>{e.currentTarget.style.borderColor=`${T_RED}60`;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none";}}>
                        <div style={{ width:34, height:34, borderRadius:"50%", background:`${POS_COLOR[p.pos]||T_RED}20`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0, border:`2px solid ${POS_COLOR[p.pos]||T_RED}30` }}>
                          {p.photoURL?<img src={p.photoURL} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />:<span className="bebas" style={{ fontSize:12, color:T.textDim }}>#{p.jersey}</span>}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:14, color:T.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.name}</div>
                          <div style={{ fontSize:10, color:POS_COLOR[p.pos]||T_RED, letterSpacing:2, fontFamily:"'Bebas Neue',sans-serif", marginTop:1 }}>{p.pos.slice(0,3).toUpperCase()} · #{p.jersey}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══════════════ FIXTURES ══════════════ */}
        {pg === "Fixtures" && (
          <div style={{ background:T.bg, minHeight:"100vh", paddingBottom:60 }}>
            <div style={{ background:T.headerGrad, borderBottom:`1px solid ${T.border}`, padding:`${isMobile?"36px":"52px"} ${px}`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, backgroundImage:`repeating-linear-gradient(45deg,transparent,transparent 24px,${T.borderLight} 24px,${T.borderLight} 25px)` }} />
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${T_RED},#ff4060,transparent)` }} />
              <div style={{ maxWidth:900, margin:"0 auto", position:"relative", zIndex:1 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", letterSpacing:3, fontSize:12, color:T.textDim, marginBottom:8 }}>SCHEDULE · 2026</div>
                <div className="bebas" style={{ fontSize: isMobile?38:isTablet?52:64, color:T.text, lineHeight:0.85, marginBottom:20 }}>FIXTURES <span style={{ color:T_RED }}>& RESULTS</span></div>
                {played.length > 0 && (
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {[["WINS",wins,"#16a34a","rgba(22,163,74,0.15)"],["DRAWS",draws,T_GOLD,"rgba(217,119,6,0.15)"],["LOSSES",losses,T_RED,"rgba(232,0,45,0.15)"],["PLAYED",played.length,T.text,T.subtleBg]].map(([l,v,c,bg]) => (
                      <div key={l} style={{ display:"flex", alignItems:"center", gap:8, background:bg, border:`1px solid ${c}30`, borderRadius:10, padding: isMobile?"6px 12px":"9px 20px" }}>
                        <div className="bebas" style={{ fontSize: isMobile?24:30, color:c, lineHeight:1 }}>{v}</div>
                        <div style={{ fontSize:11, letterSpacing:2, color:T.textDim, fontFamily:"'Bebas Neue',sans-serif" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ maxWidth:900, margin:"0 auto", padding:`${isMobile?"20px":"32px"} ${px} 0` }}>
              {mtchs.length === 0
                ? <div style={{ textAlign:"center", padding:60, color:T.textDim }}>No matches scheduled.</div>
                : <div style={{ display:"flex", flexDirection:"column", gap:isMobile?10:14 }}>
                    {mtchs.map((m,i) => {
                      const isW=m.result==="W", isD=m.result==="D", isUpc=m.result==="upcoming";
                      const ac=isUpc?"#2563eb":isW?"#16a34a":isD?T_GOLD:T_RED;
                      const rl=isUpc?"UPCOMING":isW?"WIN":isD?"DRAW":"LOSS";
                      return (
                        <div key={m.id} className="fx-timeline-card" onClick={() => setSelMatch(m)} style={{ animation:`fadeUp 0.3s ${i*0.05}s ease both` }}>
                          <div style={{ height:3, background:`linear-gradient(90deg,${ac},${ac}50,transparent)` }} />
                          <div style={{ padding: isMobile?"14px":"18px 22px" }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:6 }}>
                              {/* ── Result + competition + FMT BADGE ── */}
                              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                                <div style={{ display:"flex", alignItems:"center", gap:5, background:`${ac}12`, border:`1px solid ${ac}30`, borderRadius:20, padding:"4px 12px" }}>
                                  <div style={{ width:5, height:5, borderRadius:"50%", background:ac, flexShrink:0 }} />
                                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", color:ac, fontSize:11, letterSpacing:2 }}>{rl}</span>
                                </div>
                                {m.competition && (
                                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:T.textDim, letterSpacing:1.5, background:T.subtleBg, padding:"4px 12px", borderRadius:20 }}>{m.competition.toUpperCase()}</span>
                                )}
                                {m.fmt && (
                                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:"white", letterSpacing:1.5, background:"#0033a0", padding:"4px 12px", borderRadius:20 }}>{m.fmt}</span>
                                )}
                              </div>
                              <span style={{ fontSize:12, color:T.textDim, fontWeight:500 }}>{m.date}{m.venue ? ` · ${m.venue}` : ""}</span>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap: isMobile?8:14 }}>
                              {/* NAFC */}
                              <div style={{ display:"flex", alignItems:"center", gap: isMobile?6:10, flex:1 }}>
                                <div style={{ width: isMobile?38:46, height: isMobile?38:46, borderRadius:10, background:T.subtleBg, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                  <img src={LOGO} alt="NAFC" style={{ width: isMobile?24:30 }} />
                                </div>
                                <div>
                                  <div className="bebas" style={{ fontSize: isMobile?18:22, color:T.text, letterSpacing:1, lineHeight:1 }}>NAFC</div>
                                  <div style={{ fontSize:10, color:T.textDim, letterSpacing:2, fontFamily:"'Bebas Neue',sans-serif", marginTop:2 }}>HOME</div>
                                </div>
                              </div>
                              {/* Score */}
                              <div style={{ textAlign:"center", flexShrink:0 }}>
                                {isUpc ? (
                                  <div style={{ background:"rgba(37,99,235,0.07)", border:"1px solid rgba(37,99,235,0.18)", borderRadius:10, padding: isMobile?"6px 12px":"8px 20px" }}>
                                    <div className="bebas" style={{ fontSize: isMobile?15:19, color:"#2563eb", letterSpacing:3, lineHeight:1 }}>VS</div>
                                    <div style={{ fontSize:10, color:T.textDim, letterSpacing:2, marginTop:2, fontFamily:"'Bebas Neue',sans-serif" }}>TBD</div>
                                  </div>
                                ) : (
                                  <div style={{ display:"flex", alignItems:"center", gap: isMobile?4:8, background:`${ac}08`, border:`1px solid ${ac}18`, borderRadius:12, padding: isMobile?"5px 10px":"7px 16px" }}>
                                    <span className="bebas fx-score-font" style={{ fontSize: isMobile?38:isTablet?48:54, color:T.text, lineHeight:1, minWidth: isMobile?24:32, textAlign:"center" }}>{m.nafcScore}</span>
                                    <span style={{ fontSize: isMobile?14:18, color:T.textDim, fontWeight:300 }}>—</span>
                                    <span className="bebas fx-score-font" style={{ fontSize: isMobile?38:isTablet?48:54, color:T.textMuted, lineHeight:1, minWidth: isMobile?24:32, textAlign:"center" }}>{m.opponentScore}</span>
                                  </div>
                                )}
                              </div>
                              {/* Opponent */}
                              <div style={{ display:"flex", alignItems:"center", gap: isMobile?6:10, flex:1, justifyContent:"flex-end" }}>
                                <div style={{ textAlign:"right" }}>
                                  <div className="bebas" style={{ fontSize: isMobile?16:20, color:T.textMuted, letterSpacing:1, lineHeight:1 }}>{m.opponent}</div>
                                  <div style={{ fontSize:10, color:T.textDim, letterSpacing:2, fontFamily:"'Bebas Neue',sans-serif", marginTop:2 }}>AWAY</div>
                                </div>
                                <div style={{ width: isMobile?38:46, height: isMobile?38:46, borderRadius:10, background:T.subtleBg, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize: isMobile?20:24 }}>🛡️</div>
                              </div>
                            </div>
                            {/* Scorers */}
                            {!isUpc && m.scorers && m.scorers.length > 0 && (
                              <div style={{ marginTop:12, paddingTop:10, borderTop:`1px solid ${T.borderLight}`, display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                                <span style={{ fontSize:12 }}>⚽</span>
                                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, color:T.textDim, letterSpacing:2 }}>SCORERS</span>
                                {m.scorers.map((s,si) => (
                                  <span key={si} style={{ fontSize:12, color:T.text, fontWeight:600, background:T.subtleBg, padding:"4px 12px", borderRadius:16, border:`1px solid ${T.borderLight}` }}>
                                    {typeof s==="string"?s:s.name}{typeof s==="object"&&s.goals>1?` ×${s.goals}`:""}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          </div>
        )}

        {/* ══════════════ STATS ══════════════ */}
        {pg === "Stats" && (
          <div style={{ background:T.bg, minHeight:"100vh", paddingBottom:60 }}>
            <div style={{ background:T.headerGrad, borderBottom:`1px solid ${T.border}`, padding:`${isMobile?"28px":"46px"} ${px} ${isMobile?"20px":"32px"}`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 59px,${T.borderLight} 59px,${T.borderLight} 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,${T.borderLight} 59px,${T.borderLight} 60px)` }} />
              <div style={{ maxWidth:1100, margin:"0 auto", position:"relative", zIndex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems: isMobile?"flex-start":"flex-end", flexWrap:"wrap", gap:14 }}>
                  <div>
                    <div className="section-label" style={{ marginBottom:8, fontSize:12 }}>{statTab==="season" ? "SEASON 2026" : getMonthLabel(activeMonth)}</div>
                    <div className="bebas" style={{ fontSize: isMobile?42:isTablet?54:62, color:T.text, lineHeight:0.88 }}>PLAYER <span style={{ color:T_RED }}>STATISTICS</span></div>
                    <div style={{ fontSize:12, color:T.textDim, marginTop:10, letterSpacing:1 }}>↓ Click any player to view their full profile</div>
                  </div>
                  {/* Tab switcher */}
                  <div style={{ display:"flex", gap:4, background:T.subtleBg, border:`1px solid ${T.border}`, padding:4, borderRadius:10 }}>
                    <button onClick={() => setStatTab("season")} className="bebas" style={{ background:statTab==="season"?T_RED:"transparent", color:statTab==="season"?"#fff":T.textMuted, border:"none", padding:isMobile?"8px 14px":"10px 22px", fontSize:isMobile?13:15, cursor:"pointer", letterSpacing:2, borderRadius:7, transition:"all 0.2s" }}>
                      🏆 ALL-TIME SEASON
                    </button>
                    <button onClick={() => setStatTab("month")} className="bebas" style={{ background:statTab==="month"?T_RED:"transparent", color:statTab==="month"?"#fff":T.textMuted, border:"none", padding:isMobile?"8px 14px":"10px 22px", fontSize:isMobile?13:15, cursor:"pointer", letterSpacing:2, borderRadius:7, transition:"all 0.2s" }}>
                      📅 MONTHLY LEADERS
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ maxWidth:1100, margin:"0 auto", padding:`24px ${px} 0` }}>
              {statTab === "month" ? (
                <>
                  {/* Month Pills Selector */}
                  {availableMonths.length > 0 && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:22, flexWrap:"wrap" }}>
                      <span className="section-label" style={{ marginRight:4, fontSize:12 }}>SELECT MONTH:</span>
                      {availableMonths.map(ym => (
                        <button key={ym} onClick={() => setSelMonth(ym)} className="bebas" style={{ background:activeMonth===ym?T_RED:T.subtleBg, color:activeMonth===ym?"#fff":T.textMuted, border:`1px solid ${activeMonth===ym?T_RED:T.border}`, padding:"8px 18px", fontSize:isMobile?13:14, letterSpacing:2, borderRadius:8, cursor:"pointer", transition:"all 0.2s" }}>
                          {getMonthLabel(ym)}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Player of the Month Spotlight Banner */}
                  {topPerformerMonth && (topPerformerMonth.monthContributions > 0 || topPerformerMonth.monthAppearances > 0) && (
                    <div style={{ background:"linear-gradient(135deg, #18181b 0%, #27272a 100%)", borderRadius:16, border:"1px solid rgba(255,255,255,0.12)", padding: isMobile?"20px 18px":"24px 32px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16, boxShadow:"0 12px 32px rgba(0,0,0,0.3)", position:"relative", overflow:"hidden" }}>
                      <div style={{ position:"absolute", right:-10, bottom:-20, fontSize:130, fontFamily:"'Bebas Neue',sans-serif", opacity:0.04, color:"#fff", pointerEvents:"none" }}>#{topPerformerMonth.jersey}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:18, zIndex:1 }}>
                        <div style={{ width:isMobile?64:78, height:isMobile?64:78, borderRadius:"50%", background:`${POS_COLOR[topPerformerMonth.pos]||T_RED}20`, border:`2.5px solid ${POS_COLOR[topPerformerMonth.pos]||T_RED}`, overflow:"hidden", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {topPerformerMonth.photoURL ? <img src={topPerformerMonth.photoURL} alt={topPerformerMonth.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 35%" }} /> : <span className="bebas" style={{ fontSize:22, color:"#fff" }}>#{topPerformerMonth.jersey}</span>}
                        </div>
                        <div>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                            <span style={{ background:"#d97706", color:"white", fontFamily:"'Bebas Neue',sans-serif", fontSize:12, letterSpacing:2, padding:"4px 12px", borderRadius:4 }}>⭐ PLAYER OF THE MONTH</span>
                            <span style={{ color:"rgba(255,255,255,0.6)", fontSize:12, letterSpacing:2, fontFamily:"'Bebas Neue',sans-serif" }}>{getMonthLabel(activeMonth)}</span>
                          </div>
                          <div className="bebas" style={{ fontSize:isMobile?28:38, color:"#fff", letterSpacing:1, lineHeight:1 }}>{topPerformerMonth.name}</div>
                          <div style={{ fontSize:13, color:POS_COLOR[topPerformerMonth.pos]||T_RED, letterSpacing:2, fontFamily:"'Bebas Neue',sans-serif", marginTop:4 }}>{topPerformerMonth.pos.toUpperCase()} · #{topPerformerMonth.jersey}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:14, zIndex:1, flexWrap:"wrap" }}>
                        {[["GOALS",topPerformerMonth.monthGoals,T_RED],["ASSISTS",topPerformerMonth.monthAssists,T_GOLD],["MATCHES",topPerformerMonth.monthAppearances,"#3b82f6"]].map(([l,v,c]) => (
                          <div key={l} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 18px", textAlign:"center", minWidth:76 }}>
                            <div className="bebas" style={{ fontSize:isMobile?26:34, color:c, lineHeight:1 }}>{v}</div>
                            <div style={{ fontSize:11, letterSpacing:2, color:"rgba(255,255,255,0.6)", fontFamily:"'Bebas Neue',sans-serif", marginTop:3 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Monthly Summary cards */}
                  <div className="stat-grid-4" style={{ display:"grid", gap:isMobile?10:14, marginBottom:24 }}>
                    {[["MONTHLY RECORD",`${monthWins}W - ${monthDraws}D - ${monthLosses}L`,"#2563eb"],["GOALS SCORED",monthGoalsCount,T_RED],["TOP SCORER",topScorerMonth&&topScorerMonth.monthGoals>0?`${topScorerMonth.name} (${topScorerMonth.monthGoals})`:"—",T_GOLD],["TOP PLAYMAKER",topAssistMonth&&topAssistMonth.monthAssists>0?`${topAssistMonth.name} (${topAssistMonth.monthAssists})`:"—","#16a34a"]].map(([l,v,c]) => (
                      <div key={l} style={{ background:T.cardBg, border:`1px solid ${T.border}`, padding: isMobile?"16px 14px":"22px 20px", borderTop:`3px solid ${c}`, borderRadius:12 }}>
                        <div className="bebas" style={{ fontSize: typeof v==="number"?(isMobile?36:48):(isMobile?22:28), color:c, lineHeight:1.1 }}>
                          {typeof v==="number" ? <StatNum value={v} /> : v}
                        </div>
                        <div style={{ fontSize:12, letterSpacing:2, color:T.textMuted, marginTop:6, fontFamily:"'Bebas Neue',sans-serif" }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Monthly Leaderboards — 4 cols */}
                  <div className="leaderboard-grid-4">
                    {[
                      {
                        title: `TOP SCORERS (${getMonthLabel(activeMonth)})`,
                        color: T_RED,
                        icon: "⚽",
                        emptyMsg: "No goals recorded for this month.",
                        sorted: [...playerMonthlyStats].filter(p => (p.monthGoals || 0) > 0).sort((a,b) => (b.monthGoals||0) - (a.monthGoals||0) || (b.monthAssists||0) - (a.monthAssists||0)),
                        renderValue: p => p.monthGoals || 0,
                        subValue: null
                      },
                      {
                        title: `TOP ASSISTS (${getMonthLabel(activeMonth)})`,
                        color: T_GOLD,
                        icon: "🅰️",
                        emptyMsg: "No assists recorded for this month.",
                        sorted: [...playerMonthlyStats].filter(p => (p.monthAssists || 0) > 0).sort((a,b) => (b.monthAssists||0) - (a.monthAssists||0) || (b.monthGoals||0) - (a.monthGoals||0)),
                        renderValue: p => p.monthAssists || 0,
                        subValue: null
                      },
                      {
                        title: `DEFENSIVE LEADERS (${getMonthLabel(activeMonth)})`,
                        color: "#2563eb",
                        icon: "🛡️",
                        emptyMsg: "No defensive actions recorded for this month.",
                        sorted: [...playerMonthlyStats].filter(p => (p.monthDefActions || 0) > 0).sort((a,b) => (b.monthDefActions||0) - (a.monthDefActions||0) || (b.monthAppearances||0) - (a.monthAppearances||0)),
                        renderValue: p => p.monthDefActions || 0,
                        subValue: p => [p.monthBlocks>0&&`${p.monthBlocks} Blk`, p.monthInterceptions>0&&`${p.monthInterceptions} Int`, p.monthClearances>0&&`${p.monthClearances} Clr`].filter(Boolean).join(" · ") || null
                      },
                      {
                        title: `APPEARANCES (${getMonthLabel(activeMonth)})`,
                        color: "#16a34a",
                        icon: "🎽",
                        emptyMsg: "No appearances recorded for this month.",
                        sorted: [...playerMonthlyStats].filter(p => (p.monthAppearances || 0) > 0).sort((a,b) => (b.monthAppearances||0) - (a.monthAppearances||0) || (b.monthGoals||0) - (a.monthGoals||0)),
                        renderValue: p => p.monthAppearances || 0,
                        subValue: null
                      }
                    ].map(board => (
                      <div key={board.title} className="stat-card">
                        <div style={{ padding:"16px 18px 14px", borderBottom:`1px solid ${T.borderLight}`, background:T.bg2, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <div className="bebas" style={{ fontSize:15, color:T.text, letterSpacing:1.5 }}>{board.title}</div>
                            <div style={{ fontSize:11, color:T.textDim, letterSpacing:2, fontFamily:"'Bebas Neue',sans-serif", marginTop:2 }}>{board.sorted.length} ACTIVE PLAYERS</div>
                          </div>
                          <div style={{ fontSize:18 }}>{board.icon}</div>
                        </div>
                        <div style={{ padding:"6px 12px 10px", maxHeight:400, overflowY:"auto" }}>
                          {board.sorted.length === 0 ? (
                            <div style={{ textAlign:"center", padding:"34px 10px", color:T.textDim, fontSize:13 }}>
                              {board.emptyMsg}
                            </div>
                          ) : board.sorted.map((p,i) => (
                            <div key={p.id} className="lb-row" onClick={() => setSelStatPlayer(p)}>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <div style={{ width:24, textAlign:"center" }}>
                                  <div className="bebas" style={{ fontSize:i===0?18:15, color:i===0?board.color:i<3?T.textMuted:T.textDim, lineHeight:1 }}>{i+1}</div>
                                </div>
                                <div style={{ width:36, height:36, borderRadius:"50%", background:`${board.color}15`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", border:`1.5px solid ${i===0?board.color+"40":"transparent"}`, flexShrink:0 }}>
                                  {p.photoURL?<img src={p.photoURL} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 35%" }} />:<span className="bebas" style={{ fontSize:11, color:T.textDim }}>#{p.jersey}</span>}
                                </div>
                                <div>
                                  <div style={{ fontWeight:600, fontSize:15, color:T.text, lineHeight:1.2 }}>{p.name}</div>
                                  <div style={{ fontSize:11, letterSpacing:2, color:`${POS_COLOR[p.pos]||T_RED}`, fontFamily:"'Bebas Neue',sans-serif", marginTop:2 }}>{p.pos.slice(0,3).toUpperCase()}</div>
                                </div>
                              </div>
                              <div style={{ textAlign:"right" }}>
                                <div className="bebas" style={{ fontSize:26, color:i===0?board.color:T.textMuted, lineHeight:1 }}>{board.renderValue(p)}</div>
                                {board.subValue && board.subValue(p) && (
                                  <div style={{ fontSize:10, color:T.textDim, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1, marginTop:2 }}>{board.subValue(p)}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Season All-Time Summary cards */}
                  <div className="stat-grid-4" style={{ display:"grid", gap:isMobile?10:14, marginBottom:24 }}>
                    {[["TOTAL GOALS",plrs.reduce((a,p)=>a+(p.goals||0),0),T_RED],["TOTAL ASSISTS",plrs.reduce((a,p)=>a+(p.assists||0),0),T_GOLD],["SQUAD SIZE",plrs.length,"#2563eb"],["MATCHES PLAYED",played.length,"#16a34a"]].map(([l,v,c]) => (
                      <div key={l} style={{ background:T.cardBg, border:`1px solid ${T.border}`, padding: isMobile?"16px 14px":"22px 20px", borderTop:`3px solid ${c}`, borderRadius:12 }}>
                        <div className="bebas" style={{ fontSize: isMobile?36:48, color:c, lineHeight:1 }}><StatNum value={v} /></div>
                        <div style={{ fontSize:12, letterSpacing:2, color:T.textMuted, marginTop:6, fontFamily:"'Bebas Neue',sans-serif" }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Season All-Time Leaderboards — 4 cols */}
                  <div className="leaderboard-grid-4">
                    {[
                      {
                        title: "TOP SCORERS",
                        color: T_RED,
                        icon: "⚽",
                        emptyMsg: "No goals recorded yet.",
                        sorted: [...plrs].filter(p => (p.goals || 0) > 0).sort((a,b) => (b.goals||0) - (a.goals||0) || (b.assists||0) - (a.assists||0)),
                        renderValue: p => p.goals || 0,
                        subValue: null
                      },
                      {
                        title: "TOP ASSISTS",
                        color: T_GOLD,
                        icon: "🅰️",
                        emptyMsg: "No assists recorded yet.",
                        sorted: [...plrs].filter(p => (p.assists || 0) > 0).sort((a,b) => (b.assists||0) - (a.assists||0) || (b.goals||0) - (a.goals||0)),
                        renderValue: p => p.assists || 0,
                        subValue: null
                      },
                      {
                        title: "DEFENSIVE LEADERS",
                        color: "#2563eb",
                        icon: "🛡️",
                        emptyMsg: "No defensive actions recorded yet.",
                        sorted: [...plrs].filter(p => ((p.blocks||0) + (p.interceptions||0) + (p.clearances||0)) > 0).sort((a,b) => ((b.blocks||0)+(b.interceptions||0)+(b.clearances||0)) - ((a.blocks||0)+(a.interceptions||0)+(a.clearances||0)) || (b.appearances||0) - (a.appearances||0)),
                        renderValue: p => (p.blocks||0) + (p.interceptions||0) + (p.clearances||0),
                        subValue: p => [p.blocks>0&&`${p.blocks} Blk`, p.interceptions>0&&`${p.interceptions} Int`, p.clearances>0&&`${p.clearances} Clr`].filter(Boolean).join(" · ") || null
                      },
                      {
                        title: "APPEARANCES",
                        color: "#16a34a",
                        icon: "🎽",
                        emptyMsg: "No appearances recorded yet.",
                        sorted: [...plrs].filter(p => (p.appearances || 0) > 0).sort((a,b) => (b.appearances||0) - (a.appearances||0) || (b.goals||0) - (a.goals||0)),
                        renderValue: p => p.appearances || 0,
                        subValue: null
                      }
                    ].map(board => (
                      <div key={board.title} className="stat-card">
                        <div style={{ padding:"16px 18px 14px", borderBottom:`1px solid ${T.borderLight}`, background:T.bg2, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <div className="bebas" style={{ fontSize:15, color:T.text, letterSpacing:1.5 }}>{board.title}</div>
                            <div style={{ fontSize:11, color:T.textDim, letterSpacing:2, fontFamily:"'Bebas Neue',sans-serif", marginTop:2 }}>{board.sorted.length} PLAYERS</div>
                          </div>
                          <div style={{ fontSize:18 }}>{board.icon}</div>
                        </div>
                        <div style={{ padding:"6px 12px 10px", maxHeight:400, overflowY:"auto" }}>
                          {board.sorted.length === 0 ? (
                            <div style={{ textAlign:"center", padding:"34px 10px", color:T.textDim, fontSize:13 }}>
                              {board.emptyMsg}
                            </div>
                          ) : board.sorted.map((p,i) => (
                            <div key={p.id} className="lb-row" onClick={() => setSelStatPlayer(p)}>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <div style={{ width:24, textAlign:"center" }}>
                                  <div className="bebas" style={{ fontSize:i===0?18:15, color:i===0?board.color:i<3?T.textMuted:T.textDim, lineHeight:1 }}>{i+1}</div>
                                </div>
                                <div style={{ width:36, height:36, borderRadius:"50%", background:`${board.color}15`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", border:`1.5px solid ${i===0?board.color+"40":"transparent"}`, flexShrink:0 }}>
                                  {p.photoURL?<img src={p.photoURL} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 35%" }} />:<span className="bebas" style={{ fontSize:11, color:T.textDim }}>#{p.jersey}</span>}
                                </div>
                                <div>
                                  <div style={{ fontWeight:600, fontSize:15, color:T.text, lineHeight:1.2 }}>{p.name}</div>
                                  <div style={{ fontSize:11, letterSpacing:2, color:`${POS_COLOR[p.pos]||T_RED}`, fontFamily:"'Bebas Neue',sans-serif", marginTop:2 }}>{p.pos.slice(0,3).toUpperCase()}</div>
                                </div>
                              </div>
                              <div style={{ textAlign:"right" }}>
                                <div className="bebas" style={{ fontSize:26, color:i===0?board.color:T.textMuted, lineHeight:1 }}>{board.renderValue(p)}</div>
                                {board.subValue && board.subValue(p) && (
                                  <div style={{ fontSize:10, color:T.textDim, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1, marginTop:2 }}>{board.subValue(p)}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ GALLERY ══════════════ */}
        {pg === "Gallery" && (
          <div style={{ background:T.bg, minHeight:"100vh" }}>
            {lightbox !== null && (
              <div onClick={() => setLightbox(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out" }}>
                <button onClick={e=>{e.stopPropagation();setLightbox(ii=>(ii-1+gal.length)%gal.length);}} style={{ position:"absolute", left: isMobile?8:20, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", fontSize:24, width:44, height:44, borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
                <img src={gal[lightbox].url} alt="" onClick={e=>e.stopPropagation()} style={{ maxWidth:"86vw", maxHeight:"86vh", objectFit:"contain", borderRadius:6 }} />
                <button onClick={e=>{e.stopPropagation();setLightbox(ii=>(ii+1)%gal.length);}} style={{ position:"absolute", right: isMobile?8:20, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", fontSize:24, width:44, height:44, borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
                <button onClick={() => setLightbox(null)} style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", fontSize:16, width:40, height:40, borderRadius:"50%", cursor:"pointer" }}>✕</button>
                <div className="bebas" style={{ position:"absolute", bottom:18, left:"50%", transform:"translateX(-50%)", color:"rgba(255,255,255,0.4)", fontSize:13, letterSpacing:4 }}>{lightbox+1} / {gal.length}</div>
              </div>
            )}
            <div style={{ background:T.headerGrad, borderBottom:`1px solid ${T.border}`, padding:`${isMobile?"28px":"46px"} ${px} ${isMobile?"20px":"32px"}` }}>
              <div style={{ maxWidth:1200, margin:"0 auto" }}>
                <div className="section-label" style={{ marginBottom:8 }}>PHOTOS</div>
                <div className="bebas" style={{ fontSize: isMobile?38:isTablet?50:58, color:T.text, lineHeight:0.88 }}>MATCH <span style={{ color:T_RED }}>GALLERY</span></div>
                {gal.length>0&&<div style={{ fontSize:11, letterSpacing:2, color:T.textDim, marginTop:8, fontFamily:"'Bebas Neue',sans-serif" }}>{gal.length} PHOTOS</div>}
              </div>
            </div>
            <div style={{ padding:`16px ${isMobile?"8px":"12px"} 50px` }}>
              {gal.length===0
                ? <div style={{ textAlign:"center", padding:60, color:T.textDim }}><div style={{ fontSize:36, marginBottom:12, opacity:0.3 }}>📸</div>No photos yet.</div>
                : <div style={{ columns: isMobile?"2 140px":isTablet?"3 180px":"4 200px", columnGap:6, maxWidth:1400, margin:"0 auto" }}>
                    {gal.map((g,i) => (
                      <div key={g.id} className="gal-item" onClick={() => setLightbox(i)} style={{ animation:`fadeUp 0.4s ${(i%6)*0.05}s ease both` }}>
                        <img src={g.url} alt="" />
                        <div className="ov"><div className="bebas" style={{ color:"white", fontSize:12, letterSpacing:3 }}>VIEW</div></div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}

        {/* ══════════════ NEWS & TOURNAMENT HUB ══════════════ */}
        {pg === "News" && (
          <div style={{ background:T.bg, minHeight:"100vh", paddingBottom:70 }}>
            <div style={{ background:T.headerGrad, borderBottom:`1px solid ${T.border}`, padding:`${isMobile?"28px":isTablet?"36px":"50px"} ${px} ${isMobile?"20px":"32px"}`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 59px,${T.borderLight} 59px,${T.borderLight} 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,${T.borderLight} 59px,${T.borderLight} 60px)` }} />
              <div style={{ maxWidth:1100, margin:"0 auto", position:"relative", zIndex:1 }}>
                <div className="section-label" style={{ marginBottom:8 }}>CLUB BULLETIN · 2026</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems: isMobile?"flex-start":"flex-end", flexWrap:"wrap", gap:12 }}>
                  <div className="bebas" style={{ fontSize: isMobile?40:isTablet?52:64, color:T.text, lineHeight:0.88 }}>NEWS & <span style={{ color:T_RED }}>TOURNAMENTS</span></div>
                  {/* Category Filter */}
                  <div style={{ display:"flex", gap:4, background:T.subtleBg, border:`1px solid ${T.border}`, padding:4, borderRadius:8, flexWrap:"wrap" }}>
                    {["All","Tournament","Club News","Match Report"].map(cat => (
                      <button key={cat} onClick={() => setNewsFltr(cat)} className="bebas" style={{ background:newsFltr===cat?T_RED:"transparent", color:newsFltr===cat?"#fff":T.textMuted, border:"none", padding: isMobile?"6px 10px":isTablet?"7px 14px":"8px 18px", fontSize:isMobile?11:12, cursor:"pointer", letterSpacing:2, borderRadius:5, transition:"all 0.2s" }}>
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ maxWidth:1100, margin:"0 auto", padding:`28px ${px} 0` }}>
              {newsList.filter(n => newsFltr === "All" || n.category === newsFltr).length === 0 ? (
                <div style={{ textAlign:"center", padding:60, color:T.textDim }}>No announcements in this category yet.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
                  {newsList.filter(n => newsFltr === "All" || n.category === newsFltr).map((item, idx) => {
                    const isTournament = item.category === "Tournament" || (item.teams && item.teams.length > 0);
                    const isLive = item.badge === "LIVE";
                    const isUpc = item.badge === "UPCOMING" || !item.badge;
                    const badgeColor = isLive ? "#16a34a" : isUpc ? "#2563eb" : "#7c3aed";
                    return (
                      <div key={item.id || idx} style={{ background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden", boxShadow:"0 6px 24px rgba(0,0,0,0.06)", animation:`fadeUp 0.35s ${idx*0.08}s ease both` }}>
                        <div style={{ height:4, background: isTournament ? "linear-gradient(90deg, #E8002D 0%, #2563eb 100%)" : `linear-gradient(90deg, ${T_RED}, transparent)` }} />
                        <div style={{ padding: isMobile?"18px 16px":"28px 32px" }}>
                          {/* Card header */}
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10, marginBottom:14 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                              <span style={{ background:`${badgeColor}18`, border:`1px solid ${badgeColor}40`, color:badgeColor, padding:"3px 10px", borderRadius:6, fontFamily:"'Bebas Neue',sans-serif", fontSize:12, letterSpacing:2 }}>
                                {item.badge || "UPCOMING"}
                              </span>
                              {item.category && (
                                <span style={{ background:T.subtleBg, color:T.textDim, padding:"3px 10px", borderRadius:6, fontFamily:"'Bebas Neue',sans-serif", fontSize:11, letterSpacing:2 }}>
                                  {item.category.toUpperCase()}
                                </span>
                              )}
                              {item.format && (
                                <span style={{ background:"#0033a0", color:"#fff", padding:"3px 10px", borderRadius:6, fontFamily:"'Bebas Neue',sans-serif", fontSize:11, letterSpacing:2 }}>
                                  {item.format.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize:12, color:T.textDim, fontWeight:500 }}>
                              {item.date}{item.venue ? ` · ${item.venue}` : ""}
                            </span>
                          </div>

                          {/* Title & Summary */}
                          <div className="bebas" style={{ fontSize: isMobile?24:isTablet?30:36, color:T.text, lineHeight:1.1, marginBottom:10 }}>
                            {item.title}
                          </div>
                          {item.summary && (
                            <p style={{ color:T.textMuted, fontSize: isMobile?13:15, lineHeight:1.7, margin:"0 0 20px" }}>
                              {item.summary}
                            </p>
                          )}

                          {/* Optional Tournament Squad Boards */}
                          {item.teams && item.teams.length > 0 && (
                            <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr", gap:14, margin:"20px 0" }}>
                              {item.teams.map((tm, tIdx) => {
                                const isTeamRed = tm.color === "#E8002D" || tIdx === 0;
                                const squadAccent = isTeamRed ? T_RED : "#2563eb";
                                return (
                                  <div key={tm.name || tIdx} style={{ background: themeMode==="dark" ? (isTeamRed ? "linear-gradient(145deg, rgba(232,0,45,0.08) 0%, rgba(24,24,27,0.9) 100%)" : "linear-gradient(145deg, rgba(37,99,235,0.08) 0%, rgba(24,24,27,0.9) 100%)") : (isTeamRed ? "linear-gradient(145deg, rgba(232,0,45,0.04) 0%, #ffffff 100%)" : "linear-gradient(145deg, rgba(37,99,235,0.04) 0%, #ffffff 100%)"), border:`1px solid ${squadAccent}35`, borderTop:`3px solid ${squadAccent}`, borderRadius:12, padding:"16px 18px" }}>
                                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, borderBottom:`1px solid ${squadAccent}20`, paddingBottom:8 }}>
                                      <div className="bebas" style={{ fontSize:18, color:squadAccent, letterSpacing:2 }}>{tm.name}</div>
                                      <span style={{ fontSize:10, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1.5, background:`${squadAccent}15`, color:squadAccent, padding:"2px 8px", borderRadius:4 }}>
                                        {tm.players ? `${tm.players.length} SQUAD MEMBERS` : "ROSTER"}
                                      </span>
                                    </div>
                                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                      {tm.players && tm.players.map((plyr, pIdx) => (
                                        <div key={plyr.name || pIdx} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 10px", background:T.bg, borderRadius:6, border:`1px solid ${T.borderLight}` }}>
                                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                            <span className="bebas" style={{ fontSize:13, color:T.textDim, width:18, textAlign:"center" }}>{pIdx + 1}.</span>
                                            <span style={{ fontWeight:600, fontSize:14, color:T.text }}>{plyr.name}</span>
                                            {plyr.isGuest && (
                                              <span style={{ background:"rgba(217,119,6,0.15)", color:T_GOLD, border:"1px solid rgba(217,119,6,0.3)", borderRadius:4, padding:"1px 6px", fontSize:9, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1 }}>GUEST ⭐</span>
                                            )}
                                          </div>
                                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                            {plyr.role && <span style={{ fontSize:11, color:T.textDim, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1 }}>{plyr.role.toUpperCase()}</span>}
                                            {plyr.jersey && <span className="bebas" style={{ fontSize:13, color:squadAccent }}>#{plyr.jersey}</span>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Content paragraph */}
                          {item.content && (
                            <div style={{ borderTop:`1px solid ${T.borderLight}`, paddingTop:16, marginTop:16, color:T.textMuted, fontSize:14, lineHeight:1.8 }}>
                              {item.content}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════ FOOTER ══════════════ */}
      <div style={{ background:T.footerBg, borderTop:`3px solid ${T_RED}`, padding: isMobile?`28px ${px} 18px`:`36px ${px} 22px` }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="footer-grid" style={{ display:"grid", gap: isMobile?24:40, paddingBottom:18, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <img src={LOGO} alt="NAFC" style={{ width:36 }} />
                <div>
                  <div className="bebas" style={{ fontSize:18, color:"#fff" }}>NAFC</div>
                  <div style={{ fontSize:9, letterSpacing:3, color:"rgba(255,255,255,0.5)", fontWeight:600 }}>FOOTBALL CLUB</div>
                </div>
              </div>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.8, maxWidth:220 }}>A passion-driven football club based in Bengaluru.</p>
              <div style={{ display:"flex", gap:6, marginTop:12 }}>
                {[["W",wins,"#16a34a"],["D",draws,T_GOLD],["L",losses,T_RED]].map(([l,v,c]) => (
                  <div key={l} style={{ background:`${c}14`, border:`1px solid ${c}28`, borderRadius:6, padding:"4px 12px", textAlign:"center" }}>
                    <div className="bebas" style={{ fontSize:15, color:c }}>{v}</div>
                    <div style={{ fontSize:10, letterSpacing:2, color:"rgba(255,255,255,0.5)", fontFamily:"'Bebas Neue',sans-serif" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="section-label" style={{ marginBottom:12 }}>NAVIGATE</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {PGS.map(p => (
                  <span key={p} onClick={() => go(p)} className="bebas" style={{ color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:14, letterSpacing:3, transition:"color 0.2s" }} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.5)"}>{p}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="section-label" style={{ marginBottom:12 }}>CONTACT & INQUIRIES</div>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.7, margin:"0 0 12px", maxWidth:260 }}>
                Looking to schedule a friendly (5v5/7v7/11v11) or join our upcoming trials? Drop us a text directly on Instagram:
              </p>
              <a href="https://www.instagram.com/nafc.blr?igsh=MTJvNzV1cXFyNzRxMA==" target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:10, color:"#fff", textDecoration:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", padding:"10px 16px", borderRadius:8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                <span className="bebas" style={{ fontSize:13, letterSpacing:3 }}>@NAFC.BLR</span>
              </a>
            </div>
          </div>
          <div style={{ paddingTop:12, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", letterSpacing:2 }}>© 2026 NAFC · BENGALURU</div>
            <div style={{ display:"flex", gap:5, alignItems:"center" }}>
              {[T_RED,"white","#1e40af"].map((c,i) => <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:c }} />)}
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", letterSpacing:1 }}>ALL RIGHTS RESERVED</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppShell /></AuthProvider>;
}