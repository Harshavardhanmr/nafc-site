import React, { useState, useEffect, useRef } from "react";
import { db } from "./firebase/config";
import { collection, onSnapshot, query, orderBy, doc } from "firebase/firestore";
import { useAuth, AuthProvider } from "./components/AuthProvider";
import LoginPage from "./components/LoginPage";
import AdminDashboard from "./AdminDashboard";
import LOGO from "./logo";

const HUDDLE_DEFAULT = "/huddle.jpg";

const T_RED    = "#E8002D";
const T_BG     = "#f0eeec";
const T_BG2    = "#e8e6e3";
const T_BG3    = "#dddad6";
const T_GOLD   = "#d97706";
const T_BORDER = "rgba(0,0,0,0.10)";
const T_LIGHT  = "#111111";
const T_MUTED  = "rgba(0,0,0,0.55)";
const T_DARK   = "#0d0d0d";

const PGS = ["Home", "Players", "Fixtures", "Stats", "Gallery"];

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

function MatchModal({ match, onClose }) {
  const isW = match.result === "W", isD = match.result === "D", isUpc = match.result === "upcoming";
  const ac = isUpc ? "#2563eb" : isW ? "#16a34a" : isD ? T_GOLD : T_RED;
  const label = isUpc ? "UPCOMING" : isW ? "WIN" : isD ? "DRAW" : "LOSS";
  const scorers = match.scorers || [];
  const assists = match.assisters || [];
  const summary = match.summary || "";
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(16px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#ffffff", border:`1px solid ${T_BORDER}`, borderTop:`4px solid ${ac}`, borderRadius:20, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto", animation:"fadeUp 0.25s ease", boxShadow:"0 32px 80px rgba(0,0,0,0.35)" }}>
        <div style={{ padding:"18px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${T_BORDER}` }}>
          {/* ── Modal header: result + competition + fmt badge ── */}
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ background:`${ac}15`, border:`1px solid ${ac}40`, borderRadius:6, padding:"3px 12px", fontFamily:"'Bebas Neue',sans-serif", color:ac, fontSize:12, letterSpacing:3 }}>{label}</span>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:10, color:"rgba(0,0,0,0.4)", letterSpacing:2 }}>{match.competition?.toUpperCase()}</span>
            {match.fmt && (
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:10, color:"white", background:"#0033a0", padding:"2px 10px", borderRadius:12, letterSpacing:2 }}>{match.fmt}</span>
            )}
          </div>
          <button onClick={onClose} style={{ background:"rgba(0,0,0,0.06)", border:`1px solid ${T_BORDER}`, color:"#111", width:34, height:34, borderRadius:"50%", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
        </div>
        <div style={{ padding:"24px 20px", textAlign:"center", borderBottom:`1px solid ${T_BORDER}` }}>
          <div style={{ fontSize:10, color:"rgba(0,0,0,0.4)", letterSpacing:2, fontFamily:"'Bebas Neue',sans-serif", marginBottom:18 }}>{match.date}{match.venue ? ` · ${match.venue}` : ""}</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flex:1 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:"rgba(0,0,0,0.05)", border:`1px solid ${T_BORDER}`, display:"flex", alignItems:"center", justifyContent:"center" }}><img src={LOGO} alt="NAFC" style={{ width:30 }} /></div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:"#111", letterSpacing:2 }}>NAFC</div>
            </div>
            {isUpc
              ? <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, color:"#2563eb", letterSpacing:4, padding:"8px 16px", background:"rgba(37,99,235,0.08)", border:"1px solid rgba(37,99,235,0.2)", borderRadius:10 }}>VS</div>
              : <div style={{ display:"flex", alignItems:"center", gap:8, background:`${ac}10`, border:`1px solid ${ac}30`, borderRadius:12, padding:"8px 16px" }}>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:52, color:"#111", lineHeight:1 }}>{match.nafcScore}</span>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:"rgba(0,0,0,0.2)", lineHeight:1 }}>—</span>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:52, color:"rgba(0,0,0,0.4)", lineHeight:1 }}>{match.opponentScore}</span>
                </div>
            }
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flex:1 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:"rgba(0,0,0,0.04)", border:`1px solid ${T_BORDER}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🛡️</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:"rgba(0,0,0,0.6)", letterSpacing:1 }}>{match.opponent}</div>
            </div>
          </div>
        </div>
        <div style={{ padding:"20px" }}>
          {scorers.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:10, letterSpacing:4, color:T_RED, marginBottom:10 }}>⚽ GOAL SCORERS ({scorers.length})</div>
              {scorers.map((s,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", background:"rgba(0,0,0,0.03)", borderRadius:8, border:`1px solid ${T_BORDER}`, marginBottom:5 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(232,0,45,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>⚽</div>
                    <span style={{ fontWeight:600, color:"#111", fontSize:13 }}>{typeof s==="string"?s:s.name}</span>
                  </div>
                  {typeof s==="object"&&s.minute&&<span style={{ fontFamily:"'Bebas Neue',sans-serif", color:"rgba(0,0,0,0.4)", fontSize:12 }}>{s.minute}'</span>}
                </div>
              ))}
            </div>
          )}
          {assists.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:10, letterSpacing:4, color:T_GOLD, marginBottom:10 }}>🅰️ ASSISTS ({assists.length})</div>
              {assists.map((a,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:"rgba(0,0,0,0.03)", borderRadius:8, border:`1px solid ${T_BORDER}`, marginBottom:5 }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(217,119,6,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>🅰️</div>
                  <span style={{ fontWeight:600, color:"#111", fontSize:13 }}>{typeof a==="string"?a:a.name}</span>
                </div>
              ))}
            </div>
          )}
          {summary
            ? <div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:10, letterSpacing:4, color:"rgba(0,0,0,0.35)", marginBottom:8 }}>MATCH SUMMARY</div>
                <p style={{ fontSize:13, color:T_MUTED, lineHeight:1.8, background:"rgba(0,0,0,0.03)", borderRadius:8, padding:"12px 14px", border:`1px solid ${T_BORDER}` }}>{summary}</p>
              </div>
            : (!isUpc && scorers.length===0 && assists.length===0 &&
                <div style={{ textAlign:"center", padding:"16px 0", color:"rgba(0,0,0,0.3)", fontSize:13 }}>No match details yet.</div>)
          }
          {isUpc && <div style={{ textAlign:"center", padding:"14px 0", color:T_MUTED, fontSize:14 }}>This match hasn't been played yet!</div>}
        </div>
      </div>
    </div>
  );
}

function PlayerModal({ player, onClose }) {
  const p = player;
  const pc = POS_COLOR[p.pos] || T_RED;
  const isGK = p.pos === "Goalkeeper";
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(18px)" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T_DARK, borderRadius:22, width:"100%", maxWidth:420, overflow:"hidden", animation:"fadeUp 0.25s ease", boxShadow:"0 40px 100px rgba(0,0,0,0.6)", border:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ position:"relative", height:240, background:"#181818", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${pc},transparent)` }} />
          {p.photoURL
            ? <img src={p.photoURL} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />
            : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", opacity:0.07 }}>
                <svg width="100" height="100" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="28" r="18" fill="white"/><path d="M6 76c0-18.778 15.222-34 34-34s34 15.222 34 34" fill="white"/></svg>
              </div>
          }
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(13,13,13,1) 0%, rgba(13,13,13,0.2) 60%, transparent 100%)" }} />
          <button onClick={onClose} style={{ position:"absolute", top:12, right:12, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          <div style={{ position:"absolute", top:12, left:12, background:pc, borderRadius:5, padding:"3px 12px" }}>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:9, color:"white", letterSpacing:3 }}>{p.pos.toUpperCase()}</span>
          </div>
          <div style={{ position:"absolute", bottom:14, left:16 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:4, marginBottom:2 }}>#{p.jersey}</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:38, color:"#fff", lineHeight:0.9 }}>{p.name}</div>
          </div>
        </div>
        <div style={{ padding:"18px 18px 22px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
            {(isGK
              ? [["SAVES",p.saves,"#60a5fa"],["CLEAN SHT",p.cleanSheets,"#4ade80"],["APPS",p.appearances,"rgba(255,255,255,0.55)"]]
              : [["GOALS",p.goals,T_RED],["ASSISTS",p.assists,"#fbbf24"],["APPS",p.appearances,"rgba(255,255,255,0.55)"]]
            ).map(([l,v,c]) => (
              <div key={l} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"12px 8px", textAlign:"center", borderTop:`2px solid ${c}` }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, color:c, lineHeight:1 }}>{v||0}</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:7, letterSpacing:2, color:"rgba(255,255,255,0.3)", marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {[["POSITION",p.pos],["JERSEY",`#${p.jersey}`],["CLUB","NAFC"],["SEASON","2026"]].map(([l,v]) => (
              <div key={l} style={{ background:"rgba(255,255,255,0.03)", borderRadius:7, padding:"8px 12px", border:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:7, letterSpacing:3, color:"rgba(255,255,255,0.28)", marginBottom:3 }}>{l}</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:13, color:"rgba(255,255,255,0.82)", letterSpacing:1 }}>{v}</div>
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
  const [srch, setSrch] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [plrs, setPlrs] = useState([]);
  const [mtchs, setMtchs] = useState([]);
  const [gal, setGal] = useState([]);
  const [heroURL, setHeroURL] = useState(HUDDLE_DEFAULT);
  const [mobileNav, setMobileNav] = useState(false);
  const heroRef = useRef(null);
  const w = useWindowWidth();
  const isMobile = w < 768;
  const isTablet = w >= 768 && w < 1024;
  const isDesktop = w >= 1024;

  useEffect(() => {
    const uP = onSnapshot(collection(db,"players"), s => setPlrs(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.jersey-b.jersey)));
    const uM = onSnapshot(query(collection(db,"matches"),orderBy("date","desc")), s => setMtchs(s.docs.map(d=>({id:d.id,...d.data()}))));
    const uG = onSnapshot(query(collection(db,"gallery"),orderBy("createdAt","desc")), s => setGal(s.docs.map(d=>({id:d.id,...d.data()}))));
    const uS = onSnapshot(doc(db,"siteSettings","heroImage"), snap => {
      if (snap.exists() && snap.data().url) setHeroURL(snap.data().url);
      else setHeroURL(HUDDLE_DEFAULT);
    });
    return () => { uP(); uM(); uG(); uS(); };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || pg !== "Home" || isMobile) return;
    const onScroll = () => { hero.style.transform = `translateY(${window.scrollY * 0.25}px)`; };
    window.addEventListener("scroll", onScroll, { passive:true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pg, isMobile]);

  if (loading) return (
    <div style={{ height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:T_BG }}>
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

  const go = p => { setPg(p); setSel(null); setSrch(""); setMobileNav(false); window.scrollTo(0,0); };

  // Responsive padding
  const px = isMobile ? "16px" : isTablet ? "28px" : "56px";

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:T_BG, minHeight:"100vh", color:T_LIGHT, fontSize:"15px", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{-webkit-text-size-adjust:100%;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:${T_BG2};}
        ::-webkit-scrollbar-thumb{background:${T_RED};border-radius:2px;}
        .bebas{font-family:'Bebas Neue',sans-serif;letter-spacing:2px;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-24px);}to{opacity:1;transform:translateX(0);}}
        @keyframes slideInRight{from{transform:translateX(100%);}to{transform:translateX(0);}}
        .nav-link{position:relative;cursor:pointer;font-family:'Bebas Neue',sans-serif;letter-spacing:2px;font-size:15px;color:rgba(0,0,0,0.5);transition:color 0.3s;padding:4px 0;}
        .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:2px;background:${T_RED};transition:width 0.3s ease;}
        .nav-link:hover{color:#111;}
        .nav-link:hover::after,.nav-link.active::after{width:100%;}
        .nav-link.active{color:#111;}
        .pcard{position:relative;cursor:pointer;overflow:hidden;border-radius:14px;background:#f7f5f2;border:1px solid rgba(0,0,0,0.10);transition:transform 0.35s cubic-bezier(0.23,1,0.32,1),border-color 0.3s,box-shadow 0.3s;}
        .pcard:hover{transform:translateY(-6px);border-color:rgba(232,0,45,0.5);box-shadow:0 16px 48px rgba(232,0,45,0.13);}
        .pcard:hover .pcard-glow{opacity:1;}
        .pcard-glow{position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(to right,${T_RED},#ff6b6b,${T_RED});opacity:0;transition:opacity 0.3s;}
        .stat-card{background:#fff;border:1px solid rgba(0,0,0,0.07);border-radius:16px;overflow:hidden;transition:border-color 0.3s,transform 0.3s,box-shadow 0.3s;box-shadow:0 2px 12px rgba(0,0,0,0.06);}
        .stat-card:hover{border-color:rgba(232,0,45,0.25);transform:translateY(-3px);box-shadow:0 12px 40px rgba(232,0,45,0.08);}
        .gal-item{break-inside:avoid;margin-bottom:6px;cursor:zoom-in;position:relative;border-radius:6px;overflow:hidden;}
        .gal-item img{width:100%;display:block;transition:transform 0.5s cubic-bezier(0.23,1,0.32,1);}
        .gal-item:hover img{transform:scale(1.05);}
        .gal-item .ov{position:absolute;inset:0;background:linear-gradient(to top,rgba(232,0,45,0.7) 0%,transparent 55%);opacity:0;transition:opacity 0.3s;display:flex;align-items:flex-end;padding:12px;}
        .gal-item:hover .ov{opacity:1;}
        .btn-red{background:${T_RED};color:white;border:none;cursor:pointer;font-family:'Bebas Neue',sans-serif;letter-spacing:3px;transition:all 0.2s;}
        .btn-red:hover{background:#c8002a;box-shadow:0 6px 24px rgba(232,0,45,0.4);transform:translateY(-1px);}
        .btn-outline{background:transparent;color:#111;cursor:pointer;font-family:'Bebas Neue',sans-serif;letter-spacing:3px;border:2px solid rgba(0,0,0,0.3);transition:all 0.2s;}
        .btn-outline:hover{border-color:#111;background:rgba(0,0,0,0.06);}
        .section-label{font-family:'Bebas Neue',sans-serif;letter-spacing:5px;font-size:11px;color:${T_RED};}
        .lb-row{display:flex;justify-content:space-between;align-items:center;padding:10px 8px;border-bottom:1px solid rgba(0,0,0,0.04);cursor:pointer;transition:all 0.2s;border-radius:8px;}
        .lb-row:hover{background:rgba(0,0,0,0.03);}
        .lb-row:last-child{border-bottom:none;}
        .profile-stat-box{background:#f7f5f2;border:1px solid rgba(0,0,0,0.08);border-radius:14px;padding:20px 14px;text-align:center;transition:all 0.25s;box-shadow:0 2px 8px rgba(0,0,0,0.06);}
        .profile-stat-box:hover{background:${T_BG2};border-color:rgba(232,0,45,0.35);transform:translateY(-2px);}
        .fx-timeline-card{background:#fff;border-radius:16px;overflow:hidden;cursor:pointer;transition:all 0.3s cubic-bezier(0.23,1,0.32,1);box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid rgba(0,0,0,0.06);}
        .fx-timeline-card:hover{transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,0.12);}
        .mobile-nav-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:190;backdrop-filter:blur(4px);}
        .mobile-nav-drawer{position:fixed;top:0;right:0;bottom:0;width:280px;background:#fff;z-index:191;padding:24px;display:flex;flex-direction:column;gap:8px;box-shadow:-8px 0 40px rgba(0,0,0,0.15);animation:slideInRight 0.3s ease;}
        .player-profile-grid{display:grid;grid-template-columns:42% 58%;min-height:80vh;}
        @media(max-width:1023px){.player-profile-grid{grid-template-columns:1fr;min-height:auto;}}

        /* ── MOBILE ── */
        @media(max-width:767px){
          .hide-mobile{display:none!important;}
          .stat-grid-4{grid-template-columns:repeat(2,1fr)!important;}
          .stat-grid-3{grid-template-columns:1fr!important;}
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
          .squad-grid{grid-template-columns:repeat(3,1fr)!important;}
          .home-stats-bar{grid-template-columns:1fr 1fr 1fr!important;}
          .footer-grid{grid-template-columns:1fr 1fr!important;}
          .fx-score-font{font-size:44px!important;}
        }

        /* ── DESKTOP ── */
        @media(min-width:1024px){
          .stat-grid-4{grid-template-columns:repeat(4,1fr)!important;}
          .stat-grid-3{grid-template-columns:repeat(3,1fr)!important;}
          .squad-grid{grid-template-columns:repeat(auto-fill,minmax(210px,1fr))!important;}
          .home-stats-bar{grid-template-columns:1fr 1fr 1fr!important;}
          .footer-grid{grid-template-columns:1fr 1fr 1fr!important;}
        }
      `}</style>

      {sLgn && <LoginPage onClose={() => setSLgn(false)} />}
      {selMatch && <MatchModal match={selMatch} onClose={() => setSelMatch(null)} />}
      {selStatPlayer && <PlayerModal player={selStatPlayer} onClose={() => setSelStatPlayer(null)} />}

      {/* Mobile Nav Drawer */}
      {mobileNav && (
        <>
          <div className="mobile-nav-overlay" onClick={() => setMobileNav(false)} />
          <div className="mobile-nav-drawer">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, paddingBottom:16, borderBottom:`2px solid ${T_RED}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <img src={LOGO} alt="NAFC" style={{ width:36 }} />
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:"#111" }}>NAFC</span>
              </div>
              <button onClick={() => setMobileNav(false)} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#111" }}>✕</button>
            </div>
            {PGS.map(p => (
              <button key={p} onClick={() => go(p)} style={{ background:pg===p?T_RED:"transparent", color:pg===p?"#fff":"#111", border:`1px solid ${pg===p?T_RED:"rgba(0,0,0,0.1)"}`, borderRadius:8, padding:"12px 18px", fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:3, cursor:"pointer", textAlign:"left", transition:"all 0.2s" }}>{p}</button>
            ))}
            <div style={{ marginTop:"auto", paddingTop:16, borderTop:"1px solid rgba(0,0,0,0.08)" }}>
              {user ? (
                <>
                  <button onClick={() => { setAVw(true); setMobileNav(false); }} style={{ background:T_GOLD, color:"#fff", border:"none", borderRadius:8, padding:"10px 18px", fontFamily:"'Bebas Neue',sans-serif", fontSize:13, letterSpacing:3, cursor:"pointer", width:"100%", marginBottom:8 }}>DASHBOARD</button>
                  <button onClick={logout} style={{ background:"rgba(0,0,0,0.05)", color:"#111", border:"1px solid rgba(0,0,0,0.1)", borderRadius:8, padding:"10px 18px", fontFamily:"'Bebas Neue',sans-serif", fontSize:13, letterSpacing:3, cursor:"pointer", width:"100%" }}>LOGOUT</button>
                </>
              ) : (
                <button onClick={() => { setSLgn(true); setMobileNav(false); }} style={{ background:T_RED, color:"#fff", border:"none", borderRadius:8, padding:"10px 18px", fontFamily:"'Bebas Neue',sans-serif", fontSize:13, letterSpacing:3, cursor:"pointer", width:"100%" }}>TEAM LOGIN</button>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── NAV ── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, backdropFilter:"blur(24px)", background:"rgba(240,238,236,0.97)", borderBottom:"1px solid rgba(0,0,0,0.08)", boxShadow:"0 2px 16px rgba(0,0,0,0.08)" }}>
        <div style={{ background:`linear-gradient(90deg,${T_RED} 0%,#c00024 100%)`, display:"flex", justifyContent:"space-between", alignItems:"center", padding:`4px ${px}`, fontSize:"9px", letterSpacing:"2px", fontFamily:"'Bebas Neue',sans-serif" }}>
          <span style={{ opacity:0.9, color:"white" }}>NAFC · BENGALURU · EST. 2025</span>
          <div style={{ display:"flex", gap:isMobile?12:20, alignItems:"center" }}>
            <a href="https://www.instagram.com/nafc.blr?igsh=MTJvNzV1cXFyNzRxMA==" target="_blank" rel="noreferrer" style={{ color:"white", textDecoration:"none", display:"flex", alignItems:"center", gap:5, opacity:0.9 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              {!isMobile && "@NAFC.BLR"}
            </a>
            {!isMobile && (user ? (
              <>
                <span onClick={() => setAVw(true)} style={{ cursor:"pointer", color:T_GOLD, fontWeight:600 }}>DASHBOARD</span>
                <span onClick={logout} style={{ cursor:"pointer", color:"white", opacity:0.8 }}>LOGOUT</span>
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
              <div className="bebas" style={{ fontSize:isMobile?17:isTablet?20:22, lineHeight:1, color:"#111" }}>NAFC</div>
              <div style={{ fontSize:7, letterSpacing:4, color:"rgba(0,0,0,0.35)", fontWeight:500 }}>FOOTBALL CLUB</div>
            </div>
          </div>
          {/* Desktop & Tablet links */}
          {!isMobile && (
            <div style={{ display:"flex", gap:isTablet?20:36 }}>
              {PGS.map(p => (
                <span key={p} className={`nav-link ${pg===p?"active":""}`} onClick={() => go(p)} style={{ fontSize:isTablet?13:15 }}>{p}</span>
              ))}
            </div>
          )}
          {isMobile ? (
            <button onClick={() => setMobileNav(true)} style={{ background:"none", border:`1.5px solid rgba(0,0,0,0.2)`, borderRadius:8, padding:"6px 10px", cursor:"pointer", display:"flex", flexDirection:"column", gap:4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width:20, height:2, background:"#111", borderRadius:1 }} />)}
            </button>
          ) : (
            <button onClick={() => go("Players")} className="btn-red bebas" style={{ padding:isTablet?"8px 18px":"9px 24px", fontSize:isTablet?12:13, borderRadius:6 }}>THE SQUAD</button>
          )}
        </div>
      </nav>

      <div style={{ paddingTop: pg==="Home" ? 0 : (isMobile ? 80 : isTablet ? 88 : 96) }}>

        {/* ══════════════ HOME ══════════════ */}
        {pg === "Home" && (
          <div>
            {/* Hero */}
            <div style={{ position:"relative", height:"100vh", minHeight:500, overflow:"hidden" }}>
              <div ref={heroRef} style={{ position:"absolute", inset:0, willChange:"transform", backgroundImage:`url(${heroURL})`, backgroundSize:"cover", backgroundPosition:"center 60%", backgroundRepeat:"no-repeat" }} />
              <div style={{ position:"absolute", inset:0, background: isMobile
                ? "linear-gradient(180deg, rgba(240,238,236,0.82) 0%, rgba(240,238,236,0.55) 50%, rgba(240,238,236,0.92) 100%)"
                : "linear-gradient(100deg, rgba(240,238,236,0.96) 0%, rgba(240,238,236,0.72) 30%, rgba(240,238,236,0.15) 55%, rgba(240,238,236,0.0) 68%)"
              }} />
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"28%", background:`linear-gradient(to top, ${T_BG} 0%, transparent 100%)` }} />
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${T_RED},#ff6b6b,transparent)` }} />
              <div style={{ position:"absolute", bottom: isMobile?"18%":"14%", left:px, right: isMobile ? px : "auto", zIndex:4, animation:"fadeUp 0.9s ease forwards" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                  <div style={{ width:28, height:2, background:T_RED }} />
                  <div className="section-label">BENGALURU · 2026 SEASON</div>
                </div>
                <div className="bebas" style={{ fontSize: isMobile?"clamp(48px,13vw,68px)":isTablet?"clamp(52px,9vw,76px)":"clamp(60px,8vw,96px)", lineHeight:0.85, color:"#111" }}>WE ARE<br /><span style={{ color:T_RED, fontSize:"1.08em" }}>NAFC</span></div>
                <div style={{ width:64, height:3, background:`linear-gradient(90deg,${T_RED},transparent)`, margin:"18px 0" }} />
                <p style={{ color:"rgba(0,0,0,0.6)", fontSize: isMobile?13:15, maxWidth:380, lineHeight:1.9, fontWeight:400 }}>Passion. Brotherhood. The Beautiful Game.<br />Follow our journey through the 2026 season.</p>
                <div style={{ display:"flex", gap:10, marginTop:28, flexWrap:"wrap" }}>
                  <button onClick={() => go("Players")} className="btn-red bebas" style={{ padding: isMobile?"10px 24px":"13px 36px", fontSize:13, borderRadius:6 }}>MEET THE SQUAD</button>
                  <button onClick={() => go("Fixtures")} className="btn-outline bebas" style={{ padding: isMobile?"10px 24px":"13px 36px", fontSize:13, borderRadius:6 }}>FIXTURES</button>
                </div>
              </div>
            </div>

            {/* ── Stats bar — always 3 columns ── */}
            <div style={{ background:"#f7f5f2", borderTop:`3px solid ${T_RED}`, borderBottom:`1px solid rgba(0,0,0,0.08)` }}>
              <div className="home-stats-bar" style={{ maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr 1fr" }}>
                {/* Latest Result */}
                <div style={{ padding: isMobile?"16px":isTablet?"20px 24px":"28px 36px", borderRight:`1px solid rgba(0,0,0,0.07)` }}>
                  <div className="section-label" style={{ marginBottom:10 }}>LATEST RESULT</div>
                  {lastM ? (
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                        <img src={LOGO} alt="NAFC" style={{ width:isMobile?22:28 }} />
                        <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:isMobile?38:isTablet?44:54, color:"#111", lineHeight:1 }}>{lastM.nafcScore}</span>
                          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:isMobile?16:20, color:"rgba(0,0,0,0.2)", margin:"0 3px" }}>—</span>
                          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:isMobile?38:isTablet?44:54, color:"rgba(0,0,0,0.35)", lineHeight:1 }}>{lastM.opponentScore}</span>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                        <span style={{ background:lastM.result==="W"?"rgba(22,163,74,0.12)":lastM.result==="L"?"rgba(232,0,45,0.10)":"rgba(217,119,6,0.10)", color:lastM.result==="W"?"#16a34a":lastM.result==="L"?T_RED:T_GOLD, fontSize:8, letterSpacing:3, padding:"3px 8px", fontFamily:"'Bebas Neue',sans-serif", borderRadius:4 }}>{lastM.result==="W"?"WIN":lastM.result==="L"?"LOSS":"DRAW"}</span>
                        <span style={{ fontSize:10, color:"rgba(0,0,0,0.4)" }}>{lastM.opponent} · {lastM.date}</span>
                      </div>
                    </div>
                  ) : <div style={{ color:"rgba(0,0,0,0.3)", fontSize:13 }}>No matches yet.</div>}
                </div>

                {/* Next Match */}
                <div style={{ padding: isMobile?"16px":isTablet?"20px 24px":"28px 36px", borderRight:`1px solid rgba(0,0,0,0.07)` }}>
                  <div className="section-label" style={{ marginBottom:10 }}>NEXT MATCH</div>
                  {upc[0] ? (
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                        <img src={LOGO} alt="NAFC" style={{ width:isMobile?20:24 }} />
                        <div className="bebas" style={{ fontSize:12, color:"rgba(0,0,0,0.3)" }}>VS</div>
                        <div style={{ fontSize:16 }}>🛡️</div>
                        <div className="bebas" style={{ fontSize:isMobile?14:16, color:"#111" }}>{upc[0].opponent}</div>
                      </div>
                      <div style={{ fontSize:11, color:"rgba(0,0,0,0.45)", lineHeight:1.9 }}>
                        <span style={{ color:T_GOLD, fontWeight:600 }}>{upc[0].date}</span> · {upc[0].competition}
                        {upc[0].venue&&<><br />{upc[0].venue}</>}
                      </div>
                    </div>
                  ) : <div style={{ color:"rgba(0,0,0,0.3)", fontSize:13 }}>No upcoming fixtures.</div>}
                </div>

                {/* Squad Stats */}
                <div style={{ padding: isMobile?"16px":isTablet?"20px 24px":"28px 36px" }}>
                  <div className="section-label" style={{ marginBottom:10 }}>SQUAD STATS</div>
                  <div style={{ display:"flex", gap:isMobile?14:isTablet?18:24 }}>
                    {[["PLAYERS",plrs.length],["GOALS",plrs.reduce((a,p)=>a+(p.goals||0),0)],["GAMES",played.length]].map(([l,v]) => (
                      <div key={l}>
                        <div className="bebas" style={{ fontSize:isMobile?28:isTablet?34:40, color:"#111", lineHeight:1 }}>{v}</div>
                        <div style={{ fontSize:8, letterSpacing:3, color:"rgba(0,0,0,0.35)", marginTop:4 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ PLAYERS LIST ══════════════ */}
        {pg === "Players" && !sel && (
          <div style={{ background:T_BG, minHeight:"100vh", paddingBottom:60 }}>
            {/* Header */}
            <div style={{ background:`linear-gradient(135deg,${T_BG} 0%,${T_BG2} 100%)`, borderBottom:"1px solid rgba(0,0,0,0.08)", padding:`${isMobile?"28px":isTablet?"36px":"50px"} ${px} ${isMobile?"20px":"32px"}`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(0,0,0,0.02) 59px,rgba(0,0,0,0.02) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(0,0,0,0.02) 59px,rgba(0,0,0,0.02) 60px)" }} />
              <div style={{ maxWidth:1200, margin:"0 auto", position:"relative", zIndex:1 }}>
                <div className="section-label" style={{ marginBottom:8 }}>NAFC · 2026</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems: isMobile?"flex-start":"flex-end", flexWrap:"wrap", gap:12 }}>
                  <div className="bebas" style={{ fontSize: isMobile?40:isTablet?52:64, color:"#111", lineHeight:0.88 }}>THE <span style={{ color:T_RED }}>SQUAD</span></div>
                  {/* Position filter */}
                  <div className="pos-filter-bar" style={{ display:"flex", gap:3, background:"rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.08)", padding:3, borderRadius:8, flexWrap:"wrap" }}>
                    {["All","Goalkeeper","Defender","Midfielder","Winger","Forward","Striker"].map(pos => (
                      <button key={pos} onClick={() => setPFltr(pos)} className="bebas" style={{ background:pFltr===pos?T_RED:"transparent", color:pFltr===pos?"#fff":"rgba(0,0,0,0.45)", border:"none", padding: isMobile?"5px 8px":isTablet?"6px 10px":"7px 14px", fontSize:isMobile?9:10, cursor:"pointer", letterSpacing:2, borderRadius:5, transition:"all 0.2s" }}>
                        {pos==="All"?"ALL":pos.slice(0,3).toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ maxWidth:1200, margin:"0 auto", padding:`24px ${px} 0` }}>
              {fPlrs.length === 0
                ? <div style={{ textAlign:"center", padding:60, color:"rgba(0,0,0,0.25)" }}>No players found.</div>
                : <div className="squad-grid" style={{ display:"grid", gap:isMobile?10:14 }}>
                    {fPlrs.map((p,i) => (
                      <div key={p.id} className="pcard" onClick={() => setSel(p)} style={{ animation:`fadeUp 0.4s ${i*0.04}s ease both` }}>
                        <div style={{ height:3, background:`linear-gradient(90deg,${POS_COLOR[p.pos]||T_RED},transparent)` }} />
                        <div style={{ height: isMobile?200:isTablet?240:270, background:"#e8e5e1", position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <div className="bebas" style={{ position:"absolute", bottom:-8, right:-4, fontSize:90, color:"rgba(0,0,0,0.05)", lineHeight:1, userSelect:"none" }}>{p.jersey}</div>
                          {p.photoURL
                            ? <img src={p.photoURL} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />
                            : <svg width="70" height="70" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="28" r="18" fill="rgba(0,0,0,0.12)" /><path d="M6 76c0-18.778 15.222-34 34-34s34 15.222 34 34" fill="rgba(0,0,0,0.08)" /></svg>
                          }
                          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(247,245,242,0.9) 0%, transparent 50%)" }} />
                          <div style={{ position:"absolute", top:10, left:12, background:POS_COLOR[p.pos]||T_RED, borderRadius:4, padding:"2px 8px" }}>
                            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:9, color:"white", letterSpacing:2 }}>{p.pos.slice(0,3).toUpperCase()}</span>
                          </div>
                        </div>
                        <div style={{ padding:"10px 12px 14px", background:"#f7f5f2" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                            <div>
                              <div className="bebas" style={{ fontSize:isMobile?16:isTablet?18:20, color:"#111", letterSpacing:1, lineHeight:1.1 }}>{p.name}</div>
                              <div style={{ fontSize:8, color:"rgba(0,0,0,0.4)", letterSpacing:3, marginTop:3, fontFamily:"'Bebas Neue',sans-serif" }}>{p.pos.toUpperCase()}</div>
                            </div>
                            <div className="bebas" style={{ fontSize:20, color:"rgba(0,0,0,0.10)" }}>#{p.jersey}</div>
                          </div>
                          <div style={{ display:"flex", gap:0, borderTop:"1px solid rgba(0,0,0,0.07)", paddingTop:8 }}>
                            {(p.pos==="Goalkeeper"?[["SVS",p.saves,"#2563eb"],["CS",p.cleanSheets,"#16a34a"]]:[ ["G",p.goals,T_RED],["A",p.assists,T_GOLD]]).concat([["APP",p.appearances,"rgba(0,0,0,0.7)"]]).map(([l,v,c],idx,arr) => (
                              <div key={l} style={{ flex:1, textAlign:"center", borderRight:idx<arr.length-1?"1px solid rgba(0,0,0,0.07)":"none" }}>
                                <div className="bebas" style={{ fontSize:16, color:c||"#111" }}>{v||0}</div>
                                <div style={{ fontSize:7, letterSpacing:2, color:"rgba(0,0,0,0.4)", fontFamily:"'Bebas Neue',sans-serif", marginTop:2 }}>{l}</div>
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
          return (
            <div style={{ background:T_DARK, minHeight:"100vh" }}>
              <div className="player-profile-grid" style={{ position:"relative", overflow: isMobile?"visible":"hidden" }}>
                {/* Left: Info */}
                <div style={{ position:"relative", zIndex:3, display:"flex", flexDirection:"column", justifyContent:"center", padding: isMobile?`76px 18px 36px`:isTablet?`80px 28px 100px`:`96px 48px 120px 56px`, background:"linear-gradient(135deg,#1c1c1e 0%,#222028 60%,#1e1a22 100%)", overflow:"hidden" }}>
                  <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 49px,rgba(255,255,255,0.014) 49px,rgba(255,255,255,0.014) 50px),repeating-linear-gradient(90deg,transparent,transparent 49px,rgba(255,255,255,0.014) 49px,rgba(255,255,255,0.014) 50px)", pointerEvents:"none" }} />
                  <div style={{ position:"absolute", top:"20%", left:"-5%", width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle, ${pc}22 0%, transparent 70%)`, pointerEvents:"none" }} />
                  <div style={{ position:"absolute", top:0, left:0, bottom:0, width:3, background:`linear-gradient(to bottom, ${pc}, ${pc}60, transparent)` }} />
                  <button onClick={() => setSel(null)} className="bebas" style={{ position:"absolute", top:isMobile?72:18, left:isMobile?14:18, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.65)", padding:"7px 18px", fontSize:10, letterSpacing:3, borderRadius:6, cursor:"pointer", zIndex:5 }}>← BACK</button>
                  <div style={{ position:"relative", zIndex:2 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <div style={{ background:pc, borderRadius:5, padding:"3px 12px" }}>
                        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:10, color:"white", letterSpacing:3 }}>{sel.pos.toUpperCase()}</span>
                      </div>
                      <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:3 }}>NAFC · 2026</span>
                    </div>
                    <div className="bebas" style={{ fontSize:isMobile?18:isTablet?20:22, color:pc, letterSpacing:4, lineHeight:1, marginBottom:4 }}>#{sel.jersey}</div>
                    <div className="bebas" style={{ fontSize: isMobile?"clamp(32px,9vw,48px)":isTablet?"clamp(36px,5vw,56px)":"clamp(40px,4vw,64px)", color:"#fff", lineHeight:0.9, letterSpacing:1, marginBottom:14 }}>{sel.name}</div>
                    <div style={{ width:52, height:3, background:`linear-gradient(90deg,${pc},transparent)`, marginBottom:20, borderRadius:2 }} />
                    {isMobile && sel.photoURL && (
                      <div style={{ width:"100%", height:260, borderRadius:14, overflow:"hidden", marginBottom:20, border:`1px solid ${pc}30` }}>
                        <img src={sel.photoURL} alt={sel.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />
                      </div>
                    )}
                    {isMobile && !sel.photoURL && (
                      <div style={{ width:"100%", height:180, borderRadius:14, background:"rgba(255,255,255,0.04)", border:`1px solid rgba(255,255,255,0.08)`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
                        <div style={{ textAlign:"center" }}>
                          <svg width="60" height="60" viewBox="0 0 80 80" fill="none" style={{ opacity:0.15 }}><circle cx="40" cy="28" r="18" fill="white"/><path d="M6 76c0-18.778 15.222-34 34-34s34 15.222 34 34" fill="white"/></svg>
                          <div className="bebas" style={{ fontSize:10, color:"rgba(255,255,255,0.2)", letterSpacing:3, marginTop:8 }}>PHOTO COMING SOON</div>
                        </div>
                      </div>
                    )}
                    <div style={{ display:"flex", gap:0, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, overflow:"hidden" }}>
                      {(isGK
                        ?[["SAVES",sel.saves,"#60a5fa"],["CLEAN SHT",sel.cleanSheets,"#4ade80"]]
                        :[["GOALS",sel.goals,T_RED],["ASSISTS",sel.assists,"#fbbf24"]]
                      ).concat([["APPS",sel.appearances,"rgba(255,255,255,0.6)"]]).map(([l,v,c],idx,arr) => (
                        <div key={l} style={{ flex:1, padding: isMobile?"12px 6px":"16px 10px", textAlign:"center", borderRight:idx<arr.length-1?"1px solid rgba(255,255,255,0.07)":"none", borderTop:`2px solid ${c}` }}>
                          <div className="bebas" style={{ fontSize: isMobile?28:34, color:c, lineHeight:1 }}>{v||0}</div>
                          <div style={{ fontSize:7, letterSpacing:2, color:"rgba(255,255,255,0.4)", fontFamily:"'Bebas Neue',sans-serif", marginTop:4 }}>{l}</div>
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
                        <img src={sel.photoURL} alt={sel.name} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center center", display:"block" }} crossOrigin="anonymous" />
                        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.15) 30%, transparent 55%)" }} />
                        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 55%, rgba(10,10,10,0.5) 100%)" }} />
                      </>
                    ) : (
                      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
                        <svg width="100" height="100" viewBox="0 0 80 80" fill="none" style={{ opacity:0.06 }}><circle cx="40" cy="28" r="18" fill="white"/><path d="M6 76c0-18.778 15.222-34 34-34s34 15.222 34 34" fill="white"/></svg>
                        <div className="bebas" style={{ fontSize:12, color:"rgba(255,255,255,0.18)", letterSpacing:4 }}>PHOTO COMING SOON</div>
                      </div>
                    )}
                    <div style={{ position:"absolute", top:0, left:0, bottom:0, width:100, background:"linear-gradient(135deg, #0a0a0a 0%, #141414 100%)", clipPath:"polygon(0 0, 70% 0, 30% 100%, 0 100%)", zIndex:4, pointerEvents:"none" }} />
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, ${pc} 0%, ${pc}60 40%, transparent 80%)`, zIndex:5 }} />
                  </div>
                )}

                {/* Bottom bar (tablet + desktop) */}
                {!isMobile && (
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:10, background:"rgba(5,5,5,0.88)", backdropFilter:"blur(12px)", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex" }}>
                    {[["POSITION",sel.pos],["JERSEY",`#${sel.jersey}`],["CLUB","NAFC"],["SEASON","2026"]].map(([l,v],i,arr) => (
                      <div key={l} style={{ flex:1, padding: isTablet?"10px 14px":"13px 24px", borderRight:i<arr.length-1?"1px solid rgba(255,255,255,0.06)":"none" }}>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", letterSpacing:3, fontSize:7, color:"rgba(255,255,255,0.28)", marginBottom:3 }}>{l}</div>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", letterSpacing:2, fontSize:isTablet?11:13, color:l==="JERSEY"?pc:"#fff", display:"flex", alignItems:"center", gap:5 }}>
                          {l==="CLUB"&&<img src={LOGO} alt="NAFC" style={{ width:11 }} />}
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile info bar */}
              {isMobile && (
                <div style={{ background:"rgba(5,5,5,0.95)", borderTop:"1px solid rgba(255,255,255,0.06)", display:"grid", gridTemplateColumns:"1fr 1fr" }}>
                  {[["POSITION",sel.pos],["JERSEY",`#${sel.jersey}`],["CLUB","NAFC"],["SEASON","2026"]].map(([l,v],i) => (
                    <div key={l} style={{ padding:"10px 14px", borderRight:i%2===0?"1px solid rgba(255,255,255,0.06)":"none", borderBottom:i<2?"1px solid rgba(255,255,255,0.06)":"none" }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", letterSpacing:3, fontSize:7, color:"rgba(255,255,255,0.3)", marginBottom:3 }}>{l}</div>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", letterSpacing:2, fontSize:12, color:l==="JERSEY"?pc:"#fff" }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats section */}
              <div style={{ background:T_BG, padding: isMobile?`28px ${px} 40px`:`40px ${px} 56px` }}>
                <div style={{ maxWidth:900, margin:"0 auto" }}>
                  <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr 1fr":"repeat(3,1fr)", gap:isMobile?10:14, marginBottom:32 }}>
                    {(isGK
                      ?[["SAVES",sel.saves,"#2563eb","Saves this season"],["CLEAN SHEETS",sel.cleanSheets,"#16a34a","Games without conceding"]]
                      :[["GOALS",sel.goals,T_RED,"Goals this season"],["ASSISTS",sel.assists,T_GOLD,"Assists provided"]]
                    ).concat([["APPEARANCES",sel.appearances,"#111","Games played"]]).map(([l,v,c,desc]) => (
                      <div key={l} className="profile-stat-box" style={{ borderTop:`3px solid ${c}` }}>
                        <div className="bebas" style={{ fontSize: isMobile?38:48, color:c, lineHeight:1, marginBottom:4 }}><StatNum value={v||0} /></div>
                        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:isMobile?9:11, color:"rgba(0,0,0,0.7)", letterSpacing:3, marginBottom:3 }}>{l}</div>
                        <div style={{ fontSize:10, color:"rgba(0,0,0,0.35)" }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                    <div style={{ width:3, height:18, background:T_RED, borderRadius:2 }} />
                    <div className="bebas" style={{ fontSize:14, color:"rgba(0,0,0,0.6)", letterSpacing:3 }}>OTHER SQUAD MEMBERS</div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:`repeat(auto-fill,minmax(${isMobile?"140px":"180px"},1fr))`, gap:8 }}>
                    {plrs.filter(p=>p.id!==sel.id).map(p => (
                      <div key={p.id} onClick={() => { setSel(p); window.scrollTo(0,0); }} style={{ background:"#f7f5f2", border:"1px solid rgba(0,0,0,0.08)", borderRadius:10, padding:"10px 12px", cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", gap:8 }} onMouseEnter={e=>{e.currentTarget.style.borderColor=`${T_RED}60`;e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(0,0,0,0.08)";e.currentTarget.style.transform="none";}}>
                        <div style={{ width:32, height:32, borderRadius:"50%", background:`${POS_COLOR[p.pos]||T_RED}20`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0, border:`2px solid ${POS_COLOR[p.pos]||T_RED}30` }}>
                          {p.photoURL?<img src={p.photoURL} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />:<span className="bebas" style={{ fontSize:10, color:"rgba(0,0,0,0.35)" }}>#{p.jersey}</span>}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:12, color:"#111", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.name}</div>
                          <div style={{ fontSize:8, color:POS_COLOR[p.pos]||T_RED, letterSpacing:2, fontFamily:"'Bebas Neue',sans-serif", marginTop:1 }}>{p.pos.slice(0,3).toUpperCase()} · #{p.jersey}</div>
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
          <div style={{ background:"#f4f3f1", minHeight:"100vh", paddingBottom:60 }}>
            <div style={{ background:T_DARK, padding:`${isMobile?"36px":"52px"} ${px}`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(45deg,transparent,transparent 24px,rgba(255,255,255,0.012) 24px,rgba(255,255,255,0.012) 25px)" }} />
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${T_RED},#ff4060,transparent)` }} />
              <div style={{ maxWidth:900, margin:"0 auto", position:"relative", zIndex:1 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", letterSpacing:5, fontSize:10, color:"rgba(255,255,255,0.28)", marginBottom:8 }}>SCHEDULE · 2026</div>
                <div className="bebas" style={{ fontSize: isMobile?38:isTablet?52:64, color:"#fff", lineHeight:0.85, marginBottom:20 }}>FIXTURES <span style={{ color:T_RED }}>& RESULTS</span></div>
                {played.length > 0 && (
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {[["WINS",wins,"#16a34a","rgba(22,163,74,0.15)"],["DRAWS",draws,T_GOLD,"rgba(217,119,6,0.15)"],["LOSSES",losses,T_RED,"rgba(232,0,45,0.15)"],["PLAYED",played.length,"rgba(255,255,255,0.7)","rgba(255,255,255,0.08)"]].map(([l,v,c,bg]) => (
                      <div key={l} style={{ display:"flex", alignItems:"center", gap:8, background:bg, border:`1px solid ${c}30`, borderRadius:10, padding: isMobile?"6px 12px":"9px 20px" }}>
                        <div className="bebas" style={{ fontSize: isMobile?22:28, color:c, lineHeight:1 }}>{v}</div>
                        <div style={{ fontSize:9, letterSpacing:3, color:"rgba(255,255,255,0.4)", fontFamily:"'Bebas Neue',sans-serif" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ maxWidth:900, margin:"0 auto", padding:`${isMobile?"20px":"32px"} ${px} 0` }}>
              {mtchs.length === 0
                ? <div style={{ textAlign:"center", padding:60, color:"rgba(0,0,0,0.2)" }}>No matches scheduled.</div>
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
                                <div style={{ display:"flex", alignItems:"center", gap:5, background:`${ac}12`, border:`1px solid ${ac}30`, borderRadius:20, padding:"3px 12px" }}>
                                  <div style={{ width:5, height:5, borderRadius:"50%", background:ac, flexShrink:0 }} />
                                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", color:ac, fontSize:10, letterSpacing:3 }}>{rl}</span>
                                </div>
                                {m.competition && (
                                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:9, color:"rgba(0,0,0,0.35)", letterSpacing:2, background:"rgba(0,0,0,0.05)", padding:"3px 10px", borderRadius:20 }}>{m.competition.toUpperCase()}</span>
                                )}
                                {m.fmt && (
                                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:9, color:"white", letterSpacing:2, background:"#0033a0", padding:"3px 10px", borderRadius:20 }}>{m.fmt}</span>
                                )}
                              </div>
                              <span style={{ fontSize:10, color:"rgba(0,0,0,0.38)", fontWeight:500 }}>{m.date}{m.venue ? ` · ${m.venue}` : ""}</span>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap: isMobile?8:14 }}>
                              {/* NAFC */}
                              <div style={{ display:"flex", alignItems:"center", gap: isMobile?6:10, flex:1 }}>
                                <div style={{ width: isMobile?36:44, height: isMobile?36:44, borderRadius:10, background:"rgba(0,0,0,0.04)", border:"1px solid rgba(0,0,0,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                  <img src={LOGO} alt="NAFC" style={{ width: isMobile?22:28 }} />
                                </div>
                                <div>
                                  <div className="bebas" style={{ fontSize: isMobile?16:20, color:"#111", letterSpacing:1, lineHeight:1 }}>NAFC</div>
                                  <div style={{ fontSize:8, color:"rgba(0,0,0,0.3)", letterSpacing:2, fontFamily:"'Bebas Neue',sans-serif", marginTop:2 }}>HOME</div>
                                </div>
                              </div>
                              {/* Score */}
                              <div style={{ textAlign:"center", flexShrink:0 }}>
                                {isUpc ? (
                                  <div style={{ background:"rgba(37,99,235,0.07)", border:"1px solid rgba(37,99,235,0.18)", borderRadius:10, padding: isMobile?"6px 12px":"8px 20px" }}>
                                    <div className="bebas" style={{ fontSize: isMobile?14:18, color:"#2563eb", letterSpacing:4, lineHeight:1 }}>VS</div>
                                    <div style={{ fontSize:8, color:"rgba(0,0,0,0.25)", letterSpacing:2, marginTop:2 }}>TBD</div>
                                  </div>
                                ) : (
                                  <div style={{ display:"flex", alignItems:"center", gap: isMobile?4:8, background:`${ac}08`, border:`1px solid ${ac}18`, borderRadius:12, padding: isMobile?"5px 10px":"7px 16px" }}>
                                    <span className="bebas fx-score-font" style={{ fontSize: isMobile?38:isTablet?48:54, color:"#111", lineHeight:1, minWidth: isMobile?24:32, textAlign:"center" }}>{m.nafcScore}</span>
                                    <span style={{ fontSize: isMobile?14:18, color:"rgba(0,0,0,0.15)", fontWeight:300 }}>—</span>
                                    <span className="bebas fx-score-font" style={{ fontSize: isMobile?38:isTablet?48:54, color:"rgba(0,0,0,0.38)", lineHeight:1, minWidth: isMobile?24:32, textAlign:"center" }}>{m.opponentScore}</span>
                                  </div>
                                )}
                              </div>
                              {/* Opponent */}
                              <div style={{ display:"flex", alignItems:"center", gap: isMobile?6:10, flex:1, justifyContent:"flex-end" }}>
                                <div style={{ textAlign:"right" }}>
                                  <div className="bebas" style={{ fontSize: isMobile?14:18, color:"rgba(0,0,0,0.6)", letterSpacing:1, lineHeight:1 }}>{m.opponent}</div>
                                  <div style={{ fontSize:8, color:"rgba(0,0,0,0.28)", letterSpacing:2, fontFamily:"'Bebas Neue',sans-serif", marginTop:2 }}>AWAY</div>
                                </div>
                                <div style={{ width: isMobile?36:44, height: isMobile?36:44, borderRadius:10, background:"rgba(0,0,0,0.03)", border:"1px solid rgba(0,0,0,0.07)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize: isMobile?18:22 }}>🛡️</div>
                              </div>
                            </div>
                            {/* Scorers */}
                            {!isUpc && m.scorers && m.scorers.length > 0 && (
                              <div style={{ marginTop:12, paddingTop:10, borderTop:"1px solid rgba(0,0,0,0.05)", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                                <span style={{ fontSize:11 }}>⚽</span>
                                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:8, color:"rgba(0,0,0,0.28)", letterSpacing:2 }}>SCORERS</span>
                                {m.scorers.map((s,si) => (
                                  <span key={si} style={{ fontSize:11, color:"rgba(0,0,0,0.55)", fontWeight:600, background:"rgba(0,0,0,0.04)", padding:"3px 10px", borderRadius:16, border:"1px solid rgba(0,0,0,0.06)" }}>
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
          <div style={{ background:T_BG, minHeight:"100vh", paddingBottom:60 }}>
            <div style={{ background:`linear-gradient(135deg,${T_BG} 0%,${T_BG2} 100%)`, borderBottom:"1px solid rgba(0,0,0,0.08)", padding:`${isMobile?"28px":"46px"} ${px} ${isMobile?"20px":"32px"}`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(0,0,0,0.02) 59px,rgba(0,0,0,0.02) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(0,0,0,0.02) 59px,rgba(0,0,0,0.02) 60px)" }} />
              <div style={{ maxWidth:1100, margin:"0 auto", position:"relative", zIndex:1 }}>
                <div className="section-label" style={{ marginBottom:8 }}>SEASON 2026</div>
                <div className="bebas" style={{ fontSize: isMobile?38:isTablet?50:58, color:"#111", lineHeight:0.88 }}>PLAYER <span style={{ color:T_RED }}>STATISTICS</span></div>
                <div style={{ fontSize:10, color:"rgba(0,0,0,0.32)", marginTop:10, letterSpacing:1 }}>↓ Click any player to view their full profile</div>
              </div>
            </div>
            <div style={{ maxWidth:1100, margin:"0 auto", padding:`24px ${px} 0` }}>
              {/* Summary cards */}
              <div className="stat-grid-4" style={{ display:"grid", gap:isMobile?8:12, marginBottom:24 }}>
                {[["TOTAL GOALS",plrs.reduce((a,p)=>a+(p.goals||0),0),T_RED],["TOTAL ASSISTS",plrs.reduce((a,p)=>a+(p.assists||0),0),T_GOLD],["SQUAD SIZE",plrs.length,"#2563eb"],["MATCHES PLAYED",played.length,"#16a34a"]].map(([l,v,c]) => (
                  <div key={l} style={{ background:"#f7f5f2", border:"1px solid rgba(0,0,0,0.08)", padding: isMobile?"14px 12px":"20px 18px", borderTop:`3px solid ${c}`, borderRadius:12 }}>
                    <div className="bebas" style={{ fontSize: isMobile?32:42, color:c, lineHeight:1 }}><StatNum value={v} /></div>
                    <div style={{ fontSize:8, letterSpacing:3, color:"rgba(0,0,0,0.4)", marginTop:5, fontFamily:"'Bebas Neue',sans-serif" }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Leaderboards — always 3 cols on tablet+, single col on mobile */}
              <div className="stat-grid-3" style={{ display:"grid", gap:isMobile?12:14 }}>
                {[{title:"TOP SCORERS",key:"goals",color:T_RED,icon:"⚽"},{title:"TOP ASSISTS",key:"assists",color:T_GOLD,icon:"🅰️"},{title:"APPEARANCES",key:"appearances",color:"#16a34a",icon:"🎽"}].map(board => {
                  const sorted = [...plrs].sort((a,b)=>(b[board.key]||0)-(a[board.key]||0));
                  return (
                    <div key={board.title} className="stat-card">
                      <div style={{ padding:"14px 16px 12px", borderBottom:"1px solid rgba(0,0,0,0.06)", background:"linear-gradient(135deg,#fafafa,#f5f3f0)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div className="bebas" style={{ fontSize:13, color:"#111", letterSpacing:2 }}>{board.title}</div>
                          <div style={{ fontSize:8, color:"rgba(0,0,0,0.3)", letterSpacing:2, fontFamily:"'Bebas Neue',sans-serif", marginTop:1 }}>{sorted.length} PLAYERS</div>
                        </div>
                        <div style={{ fontSize:16 }}>{board.icon}</div>
                      </div>
                      <div style={{ padding:"4px 10px 8px", maxHeight:380, overflowY:"auto" }}>
                        {sorted.map((p,i) => (
                          <div key={p.id} className="lb-row" onClick={() => setSelStatPlayer(p)}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:20, textAlign:"center" }}>
                                <div className="bebas" style={{ fontSize:i===0?15:12, color:i===0?board.color:i<3?"rgba(0,0,0,0.35)":"rgba(0,0,0,0.2)", lineHeight:1 }}>{i+1}</div>
                              </div>
                              <div style={{ width:30, height:30, borderRadius:"50%", background:`${board.color}15`, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", border:`1.5px solid ${i===0?board.color+"40":"transparent"}`, flexShrink:0 }}>
                                {p.photoURL?<img src={p.photoURL} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />:<span className="bebas" style={{ fontSize:9, color:"rgba(0,0,0,0.3)" }}>#{p.jersey}</span>}
                              </div>
                              <div>
                                <div style={{ fontWeight:600, fontSize:12, color:"#111", lineHeight:1.2 }}>{p.name}</div>
                                <div style={{ fontSize:8, letterSpacing:2, color:`${POS_COLOR[p.pos]||T_RED}`, fontFamily:"'Bebas Neue',sans-serif", marginTop:1 }}>{p.pos.slice(0,3).toUpperCase()}</div>
                              </div>
                            </div>
                            <div className="bebas" style={{ fontSize:20, color:i===0?board.color:"rgba(0,0,0,0.4)", lineHeight:1 }}>{p[board.key]||0}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ GALLERY ══════════════ */}
        {pg === "Gallery" && (
          <div style={{ background:T_BG, minHeight:"100vh" }}>
            {lightbox !== null && (
              <div onClick={() => setLightbox(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.93)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", cursor:"zoom-out" }}>
                <button onClick={e=>{e.stopPropagation();setLightbox(ii=>(ii-1+gal.length)%gal.length);}} style={{ position:"absolute", left: isMobile?8:20, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", fontSize:24, width:44, height:44, borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
                <img src={gal[lightbox].url} alt="" onClick={e=>e.stopPropagation()} style={{ maxWidth:"86vw", maxHeight:"86vh", objectFit:"contain", borderRadius:6 }} />
                <button onClick={e=>{e.stopPropagation();setLightbox(ii=>(ii+1)%gal.length);}} style={{ position:"absolute", right: isMobile?8:20, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", fontSize:24, width:44, height:44, borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
                <button onClick={() => setLightbox(null)} style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", fontSize:16, width:40, height:40, borderRadius:"50%", cursor:"pointer" }}>✕</button>
                <div className="bebas" style={{ position:"absolute", bottom:18, left:"50%", transform:"translateX(-50%)", color:"rgba(255,255,255,0.3)", fontSize:12, letterSpacing:4 }}>{lightbox+1} / {gal.length}</div>
              </div>
            )}
            <div style={{ background:`linear-gradient(135deg,${T_BG} 0%,${T_BG2} 100%)`, borderBottom:"1px solid rgba(0,0,0,0.08)", padding:`${isMobile?"28px":"46px"} ${px} ${isMobile?"20px":"32px"}` }}>
              <div style={{ maxWidth:1200, margin:"0 auto" }}>
                <div className="section-label" style={{ marginBottom:8 }}>PHOTOS</div>
                <div className="bebas" style={{ fontSize: isMobile?38:isTablet?50:58, color:"#111", lineHeight:0.88 }}>MATCH <span style={{ color:T_RED }}>GALLERY</span></div>
                {gal.length>0&&<div style={{ fontSize:9, letterSpacing:4, color:"rgba(0,0,0,0.3)", marginTop:8 }}>{gal.length} PHOTOS</div>}
              </div>
            </div>
            <div style={{ padding:`16px ${isMobile?"8px":"12px"} 50px` }}>
              {gal.length===0
                ? <div style={{ textAlign:"center", padding:60, color:"rgba(0,0,0,0.2)" }}><div style={{ fontSize:36, marginBottom:12, opacity:0.3 }}>📸</div>No photos yet.</div>
                : <div style={{ columns: isMobile?"2 140px":isTablet?"3 180px":"4 200px", columnGap:6, maxWidth:1400, margin:"0 auto" }}>
                    {gal.map((g,i) => (
                      <div key={g.id} className="gal-item" onClick={() => setLightbox(i)} style={{ animation:`fadeUp 0.4s ${(i%6)*0.05}s ease both` }}>
                        <img src={g.url} alt="" />
                        <div className="ov"><div className="bebas" style={{ color:"white", fontSize:10, letterSpacing:3 }}>VIEW</div></div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}
      </div>

      {/* ══════════════ FOOTER ══════════════ */}
      <div style={{ background:"#111", borderTop:`3px solid ${T_RED}`, padding: isMobile?`28px ${px} 18px`:`36px ${px} 22px` }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="footer-grid" style={{ display:"grid", gap: isMobile?24:40, paddingBottom:18, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <img src={LOGO} alt="NAFC" style={{ width:34 }} />
                <div>
                  <div className="bebas" style={{ fontSize:17, color:"#fff" }}>NAFC</div>
                  <div style={{ fontSize:7, letterSpacing:4, color:"rgba(255,255,255,0.3)" }}>FOOTBALL CLUB</div>
                </div>
              </div>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.38)", lineHeight:1.8, maxWidth:220 }}>A passion-driven football club based in Bengaluru.</p>
              <div style={{ display:"flex", gap:6, marginTop:12 }}>
                {[["W",wins,"#16a34a"],["D",draws,T_GOLD],["L",losses,T_RED]].map(([l,v,c]) => (
                  <div key={l} style={{ background:`${c}14`, border:`1px solid ${c}28`, borderRadius:6, padding:"3px 10px", textAlign:"center" }}>
                    <div className="bebas" style={{ fontSize:14, color:c }}>{v}</div>
                    <div style={{ fontSize:7, letterSpacing:2, color:"rgba(255,255,255,0.3)", fontFamily:"'Bebas Neue',sans-serif" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="section-label" style={{ marginBottom:12 }}>NAVIGATE</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {PGS.map(p => (
                  <span key={p} onClick={() => go(p)} className="bebas" style={{ color:"rgba(255,255,255,0.32)", cursor:"pointer", fontSize:13, letterSpacing:3, transition:"color 0.2s" }} onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.32)"}>{p}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="section-label" style={{ marginBottom:12 }}>FOLLOW US</div>
              <a href="https://www.instagram.com/nafc.blr?igsh=MTJvNzV1cXFyNzRxMA==" target="_blank" rel="noreferrer" style={{ display:"inline-flex", alignItems:"center", gap:10, color:"#fff", textDecoration:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", padding:"10px 16px", borderRadius:8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                <span className="bebas" style={{ fontSize:12, letterSpacing:3 }}>@NAFC.BLR</span>
              </a>
            </div>
          </div>
          <div style={{ paddingTop:12, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.18)", letterSpacing:2 }}>© 2026 NAFC · BENGALURU</div>
            <div style={{ display:"flex", gap:5, alignItems:"center" }}>
              {[T_RED,"white","#1e40af"].map((c,i) => <div key={i} style={{ width:5, height:5, borderRadius:"50%", background:c }} />)}
            </div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.12)", letterSpacing:1 }}>ALL RIGHTS RESERVED</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppShell /></AuthProvider>;
}