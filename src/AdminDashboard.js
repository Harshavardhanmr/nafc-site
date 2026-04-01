import { useState, useEffect } from "react";
import { db } from "./firebase/config";
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDoc, query, orderBy, setDoc } from "firebase/firestore";
import LOGO from "./logo";

const CLOUDINARY_CLOUD_NAME = "dzpti3993";
const CLOUDINARY_UPLOAD_PRESET = "nafc_photos";

const uploadToCloudinary = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).secure_url);
      else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
};

function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

export default function AdminDashboard({ onBack }) {
  const [tb, setTb] = useState("sqd");
  const [plrs, setPlrs] = useState([]);
  const [mtchs, setMtchs] = useState([]);
  const [gal, setGal] = useState([]);
  const [ld, setLd] = useState(false);
  const [edP, setEdP] = useState(null);
  const [toast, setToast] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [currentHeroURL, setCurrentHeroURL] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const w = useWindowWidth();
  const isMobile = w < 768;
  const isTablet = w >= 768 && w < 1024;

  const [mF, setMF] = useState({
    op:"", dt:"", vn:"", cp:"Friendly", rs:"W",
    nS:0, oS:0, ap:[], sc:[], sI:"", sG:1
  });

  useEffect(() => {
    const uP = onSnapshot(collection(db,"players"), s => setPlrs(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.jersey-b.jersey)));
    const uM = onSnapshot(query(collection(db,"matches"),orderBy("date","desc")), s => setMtchs(s.docs.map(d=>({id:d.id,...d.data()}))));
    const uG = onSnapshot(query(collection(db,"gallery"),orderBy("createdAt","desc")), s => setGal(s.docs.map(d=>({id:d.id,...d.data()}))));
    const uS = onSnapshot(doc(db,"siteSettings","heroImage"), snap => {
      if (snap.exists() && snap.data().url) setCurrentHeroURL(snap.data().url);
      else setCurrentHeroURL(null);
    });
    return () => { uP(); uM(); uG(); uS(); };
  }, []);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const doUpload = async (file, key, maxMB) => {
    if (!file.type.startsWith("image/")) { showToast("Please select an image file.", "error"); return null; }
    if (file.size > maxMB * 1024 * 1024) { showToast(`Image must be under ${maxMB}MB.`, "error"); return null; }
    setUploadProgress(prev => ({ ...prev, [key]:0 }));
    try {
      const url = await uploadToCloudinary(file, pct => setUploadProgress(prev => ({ ...prev, [key]:pct })));
      return url;
    } catch (err) {
      showToast(`❌ Upload failed: ${err.message}`, "error");
      return null;
    } finally {
      setUploadProgress(prev => { const n={...prev}; delete n[key]; return n; });
    }
  };

  const hPU = async (e, id) => {
    const f = e.target.files[0]; if (!f) return;
    showToast("📤 Uploading player photo...", "info");
    const url = await doUpload(f, `player_${id}`, 20);
    if (url) { await updateDoc(doc(db,"players",id), { photoURL:url }); showToast("✅ Player photo saved!"); }
    e.target.value = "";
  };

  const remP = async (id) => {
    if (window.confirm("Remove photo?")) {
      try { await updateDoc(doc(db,"players",id), { photoURL:null }); showToast("Photo removed."); }
      catch { showToast("Failed to remove photo.", "error"); }
    }
  };

  const hGU = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    showToast("📤 Uploading gallery image...", "info");
    const url = await doUpload(f, "gallery_new", 50);
    if (url) { await addDoc(collection(db,"gallery"), { url, createdAt:new Date().toISOString() }); showToast("✅ Gallery image uploaded!"); }
    e.target.value = "";
  };

  const hHeroUpload = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    showToast("📤 Uploading hero image...", "info");
    const url = await doUpload(f, "hero_image", 50);
    if (url) { await setDoc(doc(db,"siteSettings","heroImage"), { url, updatedAt:new Date().toISOString() }); showToast("✅ Homepage hero image updated!"); }
    e.target.value = "";
  };

  const resetHero = async () => {
    if (window.confirm("Reset hero to default /huddle.jpg?")) {
      await setDoc(doc(db,"siteSettings","heroImage"), { url:null, updatedAt:new Date().toISOString() });
      showToast("Hero reset to default.");
    }
  };

  const del = async (c, id) => {
    if (window.confirm("Delete?")) {
      try { await deleteDoc(doc(db,c,id)); showToast("Deleted."); }
      catch { showToast("Delete failed.", "error"); }
    }
  };

  const delP = async (id) => {
    if (window.confirm("Delete player?")) {
      setLd(true);
      try { await deleteDoc(doc(db,"players",id)); setEdP(null); showToast("Player deleted."); }
      catch { showToast("Delete failed.", "error"); }
      setLd(false);
    }
  };

  const updP = async (e) => {
    e.preventDefault(); setLd(true);
    try {
      if (edP.id) await updateDoc(doc(db,"players",edP.id), edP);
      else await addDoc(collection(db,"players"), edP);
      setEdP(null); showToast("✅ Player saved!");
    } catch (err) { showToast(`❌ Error: ${err.message}`, "error"); }
    setLd(false);
  };

  const oNP = () => setEdP({ name:"", pos:"Midfielder", jersey:0, goals:0, assists:0, appearances:0, cleanSheets:0, saves:0 });

  const addM = async (e) => {
    e.preventDefault(); setLd(true);
    try {
      await addDoc(collection(db,"matches"), { opponent:mF.op, date:mF.dt, venue:mF.vn, competition:mF.cp, result:mF.rs, nafcScore:mF.nS, opponentScore:mF.oS, scorers:mF.sc });
      if (mF.rs !== "upcoming") {
        for (let id of mF.ap) { const r=doc(db,"players",id); const s=await getDoc(r); if (s.exists()) await updateDoc(r,{ appearances:(s.data().appearances||0)+1 }); }
        for (let s of mF.sc) { const r=doc(db,"players",s.id); const p=await getDoc(r); if (p.exists()) await updateDoc(r,{ goals:(p.data().goals||0)+s.goals }); }
      }
      setMF({ op:"", dt:"", vn:"", cp:"Friendly", rs:"W", nS:0, oS:0, ap:[], sc:[], sI:"", sG:1 });
      showToast("✅ Match logged and stats updated!");
    } catch (err) { showToast(`❌ Error: ${err.message}`, "error"); }
    setLd(false);
  };

  const tggA = (id) => setMF(p=>({ ...p, ap:p.ap.includes(id)?p.ap.filter(x=>x!==id):[...p.ap,id] }));
  const addS = () => {
    if (!mF.sI || mF.sG < 1) return;
    const p = plrs.find(x=>x.id===mF.sI);
    setMF(v=>({ ...v, sc:[...v.sc,{ id:p.id, name:p.name, goals:parseInt(v.sG) }], sI:"", sG:1 }));
  };
  const remS = (i) => setMF(v=>({ ...v, sc:v.sc.filter((_,idx)=>idx!==i) }));

  const TC = {
    success:{ bg:"#dcfce7", border:"#166534", text:"#166534" },
    error:  { bg:"#fee2e2", border:"#991b1b", text:"#991b1b" },
    info:   { bg:"#dbeafe", border:"#1d4ed8", text:"#1d4ed8" }
  };
  const heroPct = uploadProgress["hero_image"];

  const TABS = [
    { i:"sqd",  l:"👥 Squad"    },
    { i:"addM", l:"⚔️ Log Match" },
    { i:"mtch", l:"📋 History"  },
    { i:"gal",  l:"📷 Gallery"  },
    { i:"hero", l:"🏠 Hero Photo"},
  ];

  const inp = { padding:"10px 12px", background:"#f8fafc", border:"1px solid #cbd5e1", borderRadius:6, fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" };
  const selectStyle = { ...inp };

  return (
    <div style={{ fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif", fontSize:14, background:"#f1f5f9", minHeight:"100vh", color:"#0f172a" }}>
      <style>{`
        @keyframes slideIn { from { transform:translateX(40px);opacity:0 } to { transform:translateX(0);opacity:1 } }
        @keyframes slideDown { from { transform:translateY(-10px);opacity:0 } to { transform:translateY(0);opacity:1 } }
        * { box-sizing: border-box; }
        input,select,textarea { font-family: inherit; }
        .adm-tab-btn { transition: all 0.2s; }
        .adm-tab-btn:hover { background: #f1f5f9 !important; }
        .squad-card { transition: box-shadow 0.2s; }
        .squad-card:hover { box-shadow: 0 4px 16px rgba(0,51,160,0.12) !important; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:16, right:16, zIndex:9999, background:TC[toast.type].bg, border:`1px solid ${TC[toast.type].border}`, color:TC[toast.type].text, padding:"12px 18px", borderRadius:8, boxShadow:"0 4px 20px rgba(0,0,0,0.15)", fontSize:13, fontWeight:600, maxWidth:360, animation:"slideIn 0.3s ease", zIndex:10000 }}>
          {toast.msg}
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background:"#fff", padding: isMobile?"10px 16px":"12px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"3px solid #0033a0", boxShadow:"0 1px 6px rgba(0,0,0,0.06)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background:"none", border:"1px solid #cbd5e1", borderRadius:6, padding:"6px 10px", cursor:"pointer", display:"flex", flexDirection:"column", gap:3 }}>
              {[0,1,2].map(i=><div key={i} style={{ width:18, height:2, background:"#0033a0", borderRadius:1 }} />)}
            </button>
          )}
          <img src={LOGO} alt="NAFC" style={{ width:isMobile?28:32, height:isMobile?28:32 }}/>
          <div style={{ fontSize:isMobile?16:20, fontWeight:800, color:"#0033a0" }}>ADMIN <span style={{ color:"#CC0000" }}>PORTAL</span></div>
        </div>
        <button onClick={onBack} style={{ background:"#f1f5f9", color:"#334155", border:"1px solid #cbd5e1", padding: isMobile?"5px 10px":"6px 14px", borderRadius:4, cursor:"pointer", fontSize:isMobile?11:12, fontWeight:700 }}>
          {isMobile ? "← SITE" : "EXIT TO SITE"}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:150 }} />
      )}

      <div style={{ maxWidth:1200, margin:"0 auto", padding: isMobile?"0":"20px", display:"flex", gap:20, position:"relative" }}>

        {/* ── SIDEBAR ── */}
        <div style={{
          ...(isMobile ? {
            position:"fixed", top:0, left:0, bottom:0, width:240,
            background:"#fff", zIndex:160, padding:"70px 16px 24px",
            boxShadow:"4px 0 20px rgba(0,0,0,0.12)",
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition:"transform 0.3s ease",
          } : {
            width: isTablet ? 180 : 210,
            flexShrink:0,
            paddingTop:0,
          }),
          display:"flex", flexDirection:"column", gap:6,
        }}>
          {TABS.map(t => (
            <button key={t.i} className="adm-tab-btn" onClick={() => { setTb(t.i); setSidebarOpen(false); }} style={{ background:tb===t.i?"#0033a0":"#fff", color:tb===t.i?"#fff":"#475569", border:tb===t.i?"none":"1px solid #e2e8f0", padding: isMobile?"11px 14px":"10px 14px", textAlign:"left", fontSize:isMobile?14:13, fontWeight:600, borderRadius:7, cursor:"pointer", boxShadow:tb===t.i?"0 2px 8px rgba(0,51,160,0.18)":"none" }}>
              {t.l}
            </button>
          ))}

          <div style={{ marginTop:12, background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8, padding:12, fontSize:10, color:"#166534", lineHeight:1.7 }}>
            <div style={{ fontWeight:800, fontSize:11, marginBottom:4 }}>✅ CLOUDINARY</div>
            <div>Cloud: <strong>dzpti3993</strong></div>
            <div>Preset: <strong>nafc_photos</strong></div>
          </div>
        </div>

        {/* ── MAIN PANEL ── */}
        <div style={{ flex:1, background:"#fff", padding: isMobile?"16px":"24px", borderRadius:10, border:"1px solid #e2e8f0", boxShadow:"0 2px 10px rgba(0,0,0,0.03)", margin: isMobile?"12px":"0", minWidth:0 }}>

          {/* ── MANAGE SQUAD ── */}
          {tb === "sqd" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #e2e8f0", paddingBottom:12, marginBottom:18, gap:10, flexWrap:"wrap" }}>
                <div style={{ fontSize:isMobile?18:22, fontWeight:800, color:"#0033a0" }}>FIRST TEAM ROSTER</div>
                <button onClick={oNP} style={{ background:"#0033a0", color:"#fff", border:"none", padding:"8px 14px", borderRadius:6, fontWeight:700, cursor:"pointer", fontSize:12, whiteSpace:"nowrap" }}>+ ADD PLAYER</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":isTablet?"1fr 1fr":"1fr 1fr", gap:10 }}>
                {plrs.map(p => {
                  const pct = uploadProgress[`player_${p.id}`];
                  return (
                    <div key={p.id} className="squad-card" style={{ background:"#fafbfc", border:"1px solid #e8ecf0", padding:12, borderRadius:10, display:"flex", gap:10, alignItems:"center" }}>
                      {/* Avatar */}
                      <div style={{ width:54, height:54, background:"#f1f5f9", borderRadius:8, overflow:"hidden", display:"flex", justifyContent:"center", alignItems:"center", border:"1px solid #e2e8f0", position:"relative", flexShrink:0 }}>
                        {p.photoURL ? <img src={p.photoURL} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <div style={{ fontSize:26, color:"#cbd5e1" }}>👤</div>}
                        {pct !== undefined && (
                          <div style={{ position:"absolute", inset:0, background:"rgba(0,51,160,0.8)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <div style={{ color:"white", fontSize:12, fontWeight:800 }}>{pct}%</div>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:800, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                        <div style={{ fontSize:10, color:"#CC0000", fontWeight:700, marginTop:2 }}>{p.pos.toUpperCase()} · #{p.jersey}</div>
                        {pct !== undefined && (
                          <div style={{ marginTop:6, background:"#e2e8f0", borderRadius:4, height:4 }}>
                            <div style={{ width:`${pct}%`, height:"100%", background:"#0033a0", borderRadius:4, transition:"width .1s" }}/>
                          </div>
                        )}
                      </div>
                      {/* Actions */}
                      <div style={{ display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}>
                        <label style={{ background:pct!==undefined?"#e2e8f0":"#0033a0", color:pct!==undefined?"#64748b":"white", border:"none", padding:"5px 8px", fontSize:9, fontWeight:700, borderRadius:4, cursor:pct!==undefined?"wait":"pointer", textAlign:"center", whiteSpace:"nowrap", lineHeight:1.4 }}>
                          📷 {p.photoURL?"CHANGE":"UPLOAD"}
                          <input type="file" style={{ display:"none" }} onChange={e=>hPU(e,p.id)} accept="image/*" disabled={pct!==undefined}/>
                        </label>
                        {p.photoURL && pct===undefined && (
                          <button onClick={()=>remP(p.id)} style={{ background:"#fee2e2", color:"#ef4444", border:"1px solid #fca5a5", padding:"4px 6px", fontSize:9, fontWeight:700, borderRadius:4, cursor:"pointer" }}>🗑️ DEL</button>
                        )}
                        <button onClick={()=>setEdP(p)} style={{ background:"#f1f5f9", color:"#0033a0", border:"1px solid #cbd5e1", padding:"4px 6px", fontSize:9, fontWeight:700, borderRadius:4, cursor:"pointer" }}>✏️ EDIT</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── LOG FIXTURE ── */}
          {tb === "addM" && (
            <div>
              <div style={{ fontSize:isMobile?18:22, fontWeight:800, color:"#0033a0", borderBottom:"1px solid #e2e8f0", paddingBottom:12, marginBottom:18 }}>LOG FIXTURE</div>
              <form onSubmit={addM} style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr":"1fr 1fr", gap:10 }}>
                  <input placeholder="Opponent Name" required value={mF.op} onChange={e=>setMF({...mF,op:e.target.value})} style={inp}/>
                  <input type="date" required value={mF.dt} onChange={e=>setMF({...mF,dt:e.target.value})} style={inp}/>
                  <input placeholder="Venue" value={mF.vn} onChange={e=>setMF({...mF,vn:e.target.value})} style={inp}/>
                  <input placeholder="Competition (e.g. Friendly)" value={mF.cp} onChange={e=>setMF({...mF,cp:e.target.value})} style={inp}/>
                </div>

                {/* Result */}
                <div style={{ background:"#f8fafc", padding:14, borderRadius:8, border:"1px solid #e2e8f0" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:10 }}>MATCH RESULT</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, marginBottom:14 }}>
                    {[{v:"W",l:"WIN",c:"#166534"},{v:"L",l:"LOSS",c:"#991b1b"},{v:"D",l:"DRAW",c:"#854d0e"},{v:"upcoming",l:"UPCOMING",c:"#334155"}].map(r => (
                      <div key={r.v} onClick={()=>setMF({...mF,rs:r.v})} style={{ textAlign:"center", padding:"8px 4px", background:mF.rs===r.v?r.c:"#fff", color:mF.rs===r.v?"#fff":"#64748b", border:`1px solid ${mF.rs===r.v?r.c:"#cbd5e1"}`, borderRadius:6, fontSize:isMobile?11:13, fontWeight:700, cursor:"pointer", transition:"all 0.15s" }}>
                        {r.l}
                      </div>
                    ))}
                  </div>
                  {mF.rs !== "upcoming" && (
                    <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                      <div style={{ flex:1, textAlign:"center" }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#64748b", marginBottom:6 }}>NAFC SCORE</div>
                        <input type="number" min="0" required value={mF.nS} onChange={e=>setMF({...mF,nS:parseInt(e.target.value)})} style={{ ...inp, fontSize:22, fontWeight:800, textAlign:"center", border:"1px solid #0033a0" }}/>
                      </div>
                      <div style={{ fontSize:22, fontWeight:800, color:"#94a3b8", marginTop:18 }}>–</div>
                      <div style={{ flex:1, textAlign:"center" }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#64748b", marginBottom:6 }}>OPP SCORE</div>
                        <input type="number" min="0" required value={mF.oS} onChange={e=>setMF({...mF,oS:parseInt(e.target.value)})} style={{ ...inp, fontSize:22, fontWeight:800, textAlign:"center" }}/>
                      </div>
                    </div>
                  )}
                </div>

                {mF.rs !== "upcoming" && (
                  <>
                    {/* Appearances */}
                    <div style={{ background:"#f8fafc", padding:14, borderRadius:8, border:"1px solid #e2e8f0" }}>
                      <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:4 }}>APPEARANCES</div>
                      <div style={{ color:"#64748b", marginBottom:10, fontSize:11 }}>Tap players who played in this match.</div>
                      <div style={{ display:"grid", gridTemplateColumns: isMobile?"1fr 1fr":"repeat(3,1fr)", gap:6 }}>
                        {plrs.map(p => {
                          const s = mF.ap.includes(p.id);
                          return (
                            <div key={p.id} onClick={()=>tggA(p.id)} style={{ background:s?"#0033a0":"#fff", color:s?"#fff":"#475569", border:`1px solid ${s?"#0033a0":"#cbd5e1"}`, padding:"7px 10px", borderRadius:5, cursor:"pointer", display:"flex", justifyContent:"space-between", fontSize:12, fontWeight:600, transition:"all 0.15s" }}>
                              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</span>
                              <span style={{ opacity:s?1:0.4, flexShrink:0, marginLeft:4 }}>#{p.jersey}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Scorers */}
                    <div style={{ background:"#f8fafc", padding:14, borderRadius:8, border:"1px solid #e2e8f0" }}>
                      <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:10 }}>GOAL SCORERS</div>
                      <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap: isMobile?"wrap":"nowrap" }}>
                        <select value={mF.sI} onChange={e=>setMF({...mF,sI:e.target.value})} style={{ ...selectStyle, flex:2, minWidth:0 }}>
                          <option value="">Select Player...</option>
                          {plrs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input type="number" min="1" value={mF.sG} onChange={e=>setMF({...mF,sG:e.target.value})} style={{ ...inp, flex:"0 0 70px", width:70 }} placeholder="Gls"/>
                        <button type="button" onClick={addS} style={{ background:"#CC0000", color:"#fff", border:"none", padding:"0 16px", fontSize:13, fontWeight:700, borderRadius:6, cursor:"pointer", whiteSpace:"nowrap", height:42 }}>ADD</button>
                      </div>
                      {mF.sc.map((s,i) => (
                        <div key={i} style={{ background:"#fff", padding:"8px 12px", border:"1px solid #e2e8f0", borderLeft:"3px solid #CC0000", display:"flex", justifyContent:"space-between", alignItems:"center", borderRadius:5, fontSize:13, fontWeight:600, marginBottom:5 }}>
                          <div>{s.name} <span style={{ color:"#CC0000", marginLeft:8 }}>{s.goals} GOALS</span></div>
                          <button type="button" onClick={()=>remS(i)} style={{ background:"#fee2e2", color:"#ef4444", border:"none", padding:"3px 8px", borderRadius:3, cursor:"pointer", fontWeight:700, fontSize:12 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <button type="submit" disabled={ld} style={{ background:ld?"#94a3b8":"#0033a0", color:"#fff", border:"none", padding:14, fontSize:14, fontWeight:700, borderRadius:8, cursor:ld?"wait":"pointer", transition:"background 0.2s" }}>
                  {ld ? "SAVING..." : "SAVE MATCH & UPDATE STATS"}
                </button>
              </form>
            </div>
          )}

          {/* ── MATCH HISTORY ── */}
          {tb === "mtch" && (
            <div>
              <div style={{ fontSize:isMobile?18:22, fontWeight:800, color:"#0033a0", borderBottom:"1px solid #e2e8f0", paddingBottom:12, marginBottom:18 }}>MATCH HISTORY</div>
              {mtchs.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px 0", color:"#94a3b8" }}>No matches logged yet.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {mtchs.map(m => (
                    <div key={m.id} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", padding: isMobile?"10px 12px":"12px 16px", borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap: isMobile?"wrap":"nowrap" }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:isMobile?13:14, fontWeight:700, color:"#0f172a" }}>NAFC vs {m.opponent}</div>
                        <div style={{ fontSize:11, color:"#64748b", fontWeight:600, marginTop:2 }}>{m.date} · {m.competition} · {m.result !== "upcoming" ? `${m.nafcScore}–${m.opponentScore} (${m.result})` : "Upcoming"}</div>
                      </div>
                      <button onClick={()=>del("matches",m.id)} style={{ background:"#fee2e2", color:"#ef4444", border:"1px solid #fca5a5", padding:"5px 10px", borderRadius:5, fontWeight:700, fontSize:11, cursor:"pointer", flexShrink:0 }}>DELETE</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── GALLERY UPLOAD ── */}
          {tb === "gal" && (
            <div>
              <div style={{ fontSize:isMobile?18:22, fontWeight:800, color:"#0033a0", borderBottom:"1px solid #e2e8f0", paddingBottom:12, marginBottom:6 }}>GALLERY UPLOAD</div>
              <div style={{ fontSize:12, color:"#64748b", marginBottom:16 }}>Via Cloudinary · Max 50MB · JPG / PNG / WEBP</div>

              {uploadProgress["gallery_new"] !== undefined && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#0033a0", marginBottom:5 }}>Uploading... {uploadProgress["gallery_new"]}%</div>
                  <div style={{ background:"#e2e8f0", borderRadius:4, height:7 }}>
                    <div style={{ width:`${uploadProgress["gallery_new"]}%`, height:"100%", background:"#0033a0", borderRadius:4, transition:"width .2s" }}/>
                  </div>
                </div>
              )}

              <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:uploadProgress["gallery_new"]!==undefined?"#94a3b8":"#0033a0", color:"#fff", padding:14, borderRadius:8, fontSize:14, fontWeight:700, cursor:uploadProgress["gallery_new"]!==undefined?"wait":"pointer", marginBottom:20 }}>
                📷 BROWSE & UPLOAD IMAGE
                <input type="file" style={{ display:"none" }} onChange={hGU} accept="image/*" disabled={uploadProgress["gallery_new"]!==undefined}/>
              </label>

              {gal.length === 0 ? (
                <div style={{ textAlign:"center", padding:"36px", color:"#94a3b8", border:"2px dashed #e2e8f0", borderRadius:8 }}>No photos yet.</div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns: isMobile?"repeat(2,1fr)":isTablet?"repeat(3,1fr)":"repeat(4,1fr)", gap:10 }}>
                  {gal.map(g => (
                    <div key={g.id} style={{ position:"relative", borderRadius:8, overflow:"hidden", border:"1px solid #e2e8f0" }}>
                      <img src={g.url} alt="Gallery" style={{ width:"100%", height: isMobile?100:120, objectFit:"cover", display:"block" }}/>
                      <button onClick={()=>del("gallery",g.id)} style={{ position:"absolute", top:5, right:5, background:"rgba(239,68,68,0.9)", color:"#fff", border:"none", padding:"3px 7px", borderRadius:4, fontSize:10, fontWeight:700, cursor:"pointer" }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── HERO PHOTO ── */}
          {tb === "hero" && (
            <div>
              <div style={{ fontSize:isMobile?18:22, fontWeight:800, color:"#0033a0", borderBottom:"1px solid #e2e8f0", paddingBottom:12, marginBottom:8 }}>🏠 HOMEPAGE HERO PHOTO</div>
              <div style={{ fontSize:12, color:"#64748b", marginBottom:20, lineHeight:1.7 }}>
                Replaces the big background photo on the home page. Changes go live instantly.
              </div>

              {/* Current preview */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#334155", marginBottom:10 }}>CURRENT HERO IMAGE</div>
                <div style={{ position:"relative", width:"100%", height: isMobile?180:240, borderRadius:10, overflow:"hidden", background:"#0f172a", border:"2px solid #e2e8f0" }}>
                  <img src={currentHeroURL || "/huddle.jpg"} alt="Current hero" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 75%", opacity:0.85 }}/>
                  <div style={{ position:"absolute", inset:0, background:"linear-gradient(to right, rgba(15,15,15,0.7) 0%, transparent 60%)", display:"flex", alignItems:"flex-end", padding:16 }}>
                    <div>
                      <div style={{ fontFamily:"monospace", fontSize:9, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>
                        {currentHeroURL ? "📡 CUSTOM (Cloudinary)" : "📁 DEFAULT (/huddle.jpg)"}
                      </div>
                      <div style={{ fontSize:16, fontWeight:800, color:"#fff", letterSpacing:2 }}>WE ARE NAFC</div>
                    </div>
                  </div>
                  {heroPct !== undefined && (
                    <div style={{ position:"absolute", inset:0, background:"rgba(0,51,160,0.75)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
                      <div style={{ color:"white", fontSize:22, fontWeight:800 }}>{heroPct}%</div>
                      <div style={{ width:"60%", background:"rgba(255,255,255,0.25)", borderRadius:4, height:8 }}>
                        <div style={{ width:`${heroPct}%`, height:"100%", background:"white", borderRadius:4, transition:"width .2s" }}/>
                      </div>
                      <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11 }}>Uploading to Cloudinary...</div>
                    </div>
                  )}
                </div>
              </div>

              <label style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:heroPct!==undefined?"#94a3b8":"#0033a0", color:"#fff", padding:16, borderRadius:8, fontSize:isMobile?13:15, fontWeight:700, cursor:heroPct!==undefined?"wait":"pointer", marginBottom:14 }}>
                🖼️ UPLOAD NEW HERO PHOTO
                <input type="file" style={{ display:"none" }} onChange={hHeroUpload} accept="image/*" disabled={heroPct!==undefined}/>
              </label>

              <div style={{ background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, padding:14, fontSize:12, color:"#92400e", lineHeight:1.8 }}>
                <div style={{ fontWeight:800, marginBottom:6 }}>💡 TIPS FOR BEST RESULTS</div>
                <div>• Wide landscape photo (1920×1080 or wider)</div>
                <div>• Image crops to <strong>center 75%</strong> vertically</div>
                <div>• Left-side gradient applied automatically for text readability</div>
                <div>• Changes go live instantly for all visitors</div>
              </div>

              {currentHeroURL && (
                <button onClick={resetHero} style={{ marginTop:14, background:"#fee2e2", color:"#ef4444", border:"1px solid #fca5a5", padding:"10px 20px", borderRadius:6, fontWeight:700, fontSize:13, cursor:"pointer", width:"100%" }}>
                  🔄 RESET TO DEFAULT (huddle.jpg)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── EDIT / ADD PLAYER MODAL ── */}
      {edP && (
        <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.75)", backdropFilter:"blur(3px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, padding:16 }}>
          <form onSubmit={updP} style={{ background:"#fff", padding: isMobile?"20px":"28px", width:"100%", maxWidth:440, borderRadius:10, boxShadow:"0 10px 40px rgba(0,0,0,0.2)", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"2px solid #0033a0", paddingBottom:10, marginBottom:18 }}>
              <div style={{ fontSize:isMobile?16:20, fontWeight:800, color:"#0033a0" }}>{edP.id ? "EDIT PLAYER" : "ADD NEW PLAYER"}</div>
              <div style={{ display:"flex", gap:8 }}>
                {edP.id && <button type="button" onClick={()=>delP(edP.id)} style={{ background:"#fee2e2", color:"#ef4444", border:"none", padding:"4px 10px", borderRadius:4, fontSize:11, fontWeight:700, cursor:"pointer" }}>DELETE</button>}
                <button type="button" onClick={()=>setEdP(null)} style={{ background:"#f1f5f9", color:"#64748b", border:"1px solid #cbd5e1", padding:"4px 10px", borderRadius:4, fontSize:11, fontWeight:700, cursor:"pointer" }}>✕</button>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <input value={edP.name} onChange={e=>setEdP({...edP,name:e.target.value})} placeholder="Player Name" required style={inp}/>
              <select value={edP.pos} onChange={e=>setEdP({...edP,pos:e.target.value})} style={selectStyle}>
                {["Goalkeeper","Defender","Midfielder","Winger","Forward","Striker"].map(p=><option key={p} value={p}>{p}</option>)}
              </select>
              <input type="number" value={edP.jersey} onChange={e=>setEdP({...edP,jersey:parseInt(e.target.value)})} placeholder="Jersey #" required style={inp}/>
              <div style={{ borderTop:"1px solid #e2e8f0", paddingTop:14 }}>
                <div style={{ fontWeight:700, fontSize:11, color:"#0033a0", marginBottom:10, letterSpacing:1 }}>STAT OVERRIDE</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[["GOALS","goals"],["ASSISTS","assists"],["APPEARANCES","appearances"],["CLEAN SHEETS","cleanSheets"],["SAVES","saves"]].map(([l,k]) => (
                    <label key={k} style={{ color:"#64748b", fontSize:11, fontWeight:700 }}>{l}
                      <input type="number" min="0" value={edP[k]||0} onChange={e=>setEdP({...edP,[k]:parseInt(e.target.value)})} style={{ ...inp, marginTop:4 }}/>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button type="submit" disabled={ld} style={{ background:ld?"#94a3b8":"#0033a0", color:"#fff", flex:2, padding:12, border:"none", fontSize:14, fontWeight:700, cursor:ld?"wait":"pointer", borderRadius:6 }}>{ld?"SAVING...":"SAVE CHANGES"}</button>
              <button type="button" onClick={()=>setEdP(null)} style={{ background:"#f1f5f9", color:"#475569", border:"1px solid #cbd5e1", flex:1, padding:12, fontSize:14, fontWeight:700, cursor:"pointer", borderRadius:6 }}>CANCEL</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}