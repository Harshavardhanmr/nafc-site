import { useState, useEffect, useRef } from "react";
import { db, storage } from "../firebase/config";
import {
  collection, addDoc, updateDoc, doc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import LOGO from "../logo";

const POS_COLOR = {
  Striker:"#CC0000",Forward:"#e05500",Midfielder:"#22c55e",
  Winger:"#a855f7",Goalkeeper:"#FFD700",Defender:"#3b82f6"
};

export default function AdminDashboard({ onBack }) {
  const [tab, setTab] = useState("matches");
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  // Match result form
  const [matchForm, setMatchForm] = useState({
    opponent:"", date:"", venue:"", competition:"Friendly",
    nafcScore:"", opponentScore:"", result:"", scorers:[]
  });
  const [scorerRows, setScorerRows] = useState([{name:"", goals:1}]);

  // Upcoming match form (separate)
  const [upcomingForm, setUpcomingForm] = useState({
    opponent:"", date:"", venue:"", competition:"Friendly"
  });

  // Prompt to add result for past upcoming match
  const [resultPrompt, setResultPrompt] = useState(null);
  const [resultForm, setResultForm] = useState({nafcScore:"", opponentScore:"", result:""});
  const [resultScorerRows, setResultScorerRows] = useState([{name:"", goals:1}]);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const photoInputRef = useRef();

  const [editPlayer, setEditPlayer] = useState(null);
  const [editForm, setEditForm] = useState({});

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  useEffect(() => {
    const unsubP = onSnapshot(collection(db,"players"), snap => {
      setPlayers(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.jersey-b.jersey));
    });
    const unsubM = onSnapshot(
      query(collection(db,"matches"), orderBy("date","desc")),
      snap => setMatches(snap.docs.map(d=>({id:d.id,...d.data()})))
    );
    const unsubG = onSnapshot(
      query(collection(db,"gallery"), orderBy("createdAt","desc")),
      snap => setGallery(snap.docs.map(d=>({id:d.id,...d.data()})))
    );
    return () => { unsubP(); unsubM(); unsubG(); };
  }, []);

  // Auto-detect upcoming matches whose date has passed → prompt for result
  const overdueUpcoming = matches.filter(m => {
    if (m.result !== "upcoming") return false;
    const matchDate = new Date(m.date);
    const today = new Date();
    today.setHours(0,0,0,0);
    return matchDate < today;
  });

  // ── Add Match Result ──
  const submitMatch = async () => {
    if (!matchForm.opponent || !matchForm.date) {
      showToast("⚠️ Opponent and date required"); return;
    }
    if (!matchForm.result) {
      showToast("⚠️ Please select a result (Win/Draw/Loss)"); return;
    }
    setLoading(true);
    try {
      const validScorers = scorerRows.filter(r => r.name && r.goals > 0);
      const data = {
        opponent: matchForm.opponent,
        date: matchForm.date,
        venue: matchForm.venue,
        competition: matchForm.competition,
        isUpcoming: false,
        nafcScore: parseInt(matchForm.nafcScore) || 0,
        opponentScore: parseInt(matchForm.opponentScore) || 0,
        result: matchForm.result,   // ← FIX: always set result
        scorers: validScorers,
        updatedAt: serverTimestamp()
      };
      await addDoc(collection(db,"matches"), data);

      // Update player stats
      for (const scorer of validScorers) {
        const player = players.find(p => p.name === scorer.name);
        if (player) {
          await updateDoc(doc(db,"players",player.id), {
            goals: (player.goals||0) + parseInt(scorer.goals),
            appearances: (player.appearances||0) + 1
          });
        }
      }

      setMatchForm({opponent:"",date:"",venue:"",competition:"Friendly",nafcScore:"",opponentScore:"",result:"",scorers:[]});
      setScorerRows([{name:"",goals:1}]);
      showToast("✅ Match result saved!");
    } catch(e) { showToast("❌ Error: "+e.message); }
    setLoading(false);
  };

  // ── Convert upcoming → result ──
  const submitResultForUpcoming = async () => {
    if (!resultForm.result) { showToast("⚠️ Please select a result"); return; }
    setLoading(true);
    try {
      const validScorers = resultScorerRows.filter(r => r.name && r.goals > 0);
      await updateDoc(doc(db,"matches",resultPrompt.id), {
        isUpcoming: false,
        result: resultForm.result,
        nafcScore: parseInt(resultForm.nafcScore)||0,
        opponentScore: parseInt(resultForm.opponentScore)||0,
        scorers: validScorers,
        updatedAt: serverTimestamp()
      });
      // Update player goal stats
      for (const scorer of validScorers) {
        const player = players.find(p => p.name === scorer.name);
        if (player) {
          await updateDoc(doc(db,"players",player.id), {
            goals: (player.goals||0) + parseInt(scorer.goals),
            appearances: (player.appearances||0) + 1
          });
        }
      }
      setResultPrompt(null);
      setResultForm({nafcScore:"",opponentScore:"",result:""});
      setResultScorerRows([{name:"",goals:1}]);
      showToast("✅ Result saved for "+resultPrompt.opponent+"!");
    } catch(e) { showToast("❌ "+e.message); }
    setLoading(false);
  };

  // ── Delete Match ──
  const deleteMatch = async (id) => {
    if (!window.confirm("Delete this match?")) return;
    await deleteDoc(doc(db,"matches",id));
    showToast("🗑️ Match deleted");
  };

  // ── Update Player Stats ──
  const savePlayerEdit = async () => {
    const isGK = editPlayer.pos === "Goalkeeper";
    const updateData = {
      appearances: parseInt(editForm.appearances)||0,
      yellowCards: parseInt(editForm.yellowCards)||0,
      redCards: parseInt(editForm.redCards)||0,
    };
    if (isGK) {
      updateData.saves = parseInt(editForm.saves)||0;
      updateData.cleanSheets = parseInt(editForm.cleanSheets)||0;
    } else {
      updateData.goals = parseInt(editForm.goals)||0;
      updateData.assists = parseInt(editForm.assists)||0;
    }
    await updateDoc(doc(db,"players",editPlayer.id), updateData);
    setEditPlayer(null);
    showToast("✅ Player stats updated!");
  };

  // ── Upload Photos ──
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    let done = 0;
    for (const file of files) {
      try {
        const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        await addDoc(collection(db,"gallery"), {
          url, name: file.name,
          category: "Match Photos",
          storagePath: storageRef.fullPath,
          createdAt: serverTimestamp()
        });
        done++;
        setUploadProgress(Math.round((done/files.length)*100));
      } catch(e) { console.error(e); }
    }
    setUploading(false);
    setUploadProgress(0);
    showToast(`✅ ${done} photo(s) uploaded!`);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const deletePhoto = async (photo) => {
    if (!window.confirm("Delete this photo?")) return;
    try {
      if (photo.storagePath) {
        const storRef = ref(storage, photo.storagePath);
        await deleteObject(storRef);
      }
    } catch(e) {}
    await deleteDoc(doc(db,"gallery",photo.id));
    showToast("🗑️ Photo deleted");
  };

  const S = {
    card: {background:"#FFFFFF",border:"1px solid #E5E7EB",borderRadius:12,padding:20,marginBottom:14,
      boxShadow:"0 1px 4px rgba(0,0,0,0.06)"},
    inp: {width:"100%",background:"#F9FAFB",border:"1px solid #D1D5DB",color:"#111",
      padding:"10px 12px",borderRadius:8,fontFamily:"'Rajdhani',sans-serif",fontSize:13,
      outline:"none",boxSizing:"border-box"},
    label: {fontSize:9,color:"#6B7280",textTransform:"uppercase",letterSpacing:".12em",
      display:"block",marginBottom:4,fontFamily:"'Rajdhani',sans-serif",fontWeight:700},
    btn: {background:"#CC0000",color:"#fff",border:"none",padding:"10px 22px",borderRadius:8,
      fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",
      letterSpacing:".08em"},
    btnGhost: {background:"transparent",color:"#6B7280",border:"1px solid #D1D5DB",padding:"8px 16px",
      borderRadius:8,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"},
    btnBlue: {background:"#1d4ed8",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,
      fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:12,cursor:"pointer"},
  };

  return (
    <div style={{minHeight:"100vh",background:"#F3F4F6",color:"#111",paddingBottom:60}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap');
        .D{font-family:'Bebas Neue',serif} .R{font-family:'Rajdhani',sans-serif}
        input:focus,select:focus,textarea:focus{border-color:#CC0000!important;outline:none}
        input[type=file]{display:none}
        .adm-inp{width:100%;background:#F9FAFB;border:1px solid #D1D5DB;color:#111;
          padding:10px 12px;border-radius:8px;font-family:'Rajdhani',sans-serif;font-size:13px;
          outline:none;box-sizing:border-box;transition:border-color .2s}
        .adm-inp:focus{border-color:#CC0000}
        select.adm-inp option{background:#fff;color:#111}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:20,right:20,zIndex:999,
          background:"#111",border:"1px solid #CC0000",color:"#fff",
          padding:"12px 20px",borderRadius:10,fontSize:13,
          fontFamily:"'Rajdhani',sans-serif",fontWeight:700}}>
          {toast}
        </div>
      )}

      {/* Result Prompt Modal — for overdue upcoming matches */}
      {resultPrompt && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:300,
          display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#fff",border:"2px solid #CC0000",borderRadius:16,
            padding:28,width:"100%",maxWidth:460}}>
            <div className="D" style={{fontSize:24,color:"#CC0000",marginBottom:4}}>
              ⚠️ MATCH DATE PASSED
            </div>
            <div className="R" style={{fontSize:13,color:"#555",marginBottom:16}}>
              NAFC vs <b>{resultPrompt.opponent}</b> · {resultPrompt.date}<br/>
              Please enter the result for this match.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <label style={S.label}>NAFC Score</label>
                <input className="adm-inp" type="number" min="0" placeholder="0"
                  value={resultForm.nafcScore} onChange={e=>setResultForm({...resultForm,nafcScore:e.target.value})}/>
              </div>
              <div>
                <label style={S.label}>Opp Score</label>
                <input className="adm-inp" type="number" min="0" placeholder="0"
                  value={resultForm.opponentScore} onChange={e=>setResultForm({...resultForm,opponentScore:e.target.value})}/>
              </div>
              <div>
                <label style={S.label}>Result</label>
                <select className="adm-inp"
                  value={resultForm.result} onChange={e=>setResultForm({...resultForm,result:e.target.value})}>
                  <option value="">Select...</option>
                  <option value="W">Win</option>
                  <option value="D">Draw</option>
                  <option value="L">Loss</option>
                </select>
              </div>
            </div>
            <div style={{marginBottom:12}}>
              <div className="R" style={{fontSize:10,color:"#FFD700",fontWeight:700,
                background:"#111",display:"inline-block",padding:"2px 8px",borderRadius:4,
                marginBottom:8}}>⚽ Goal Scorers</div>
              {resultScorerRows.map((row,i)=>(
                <div key={i} style={{display:"flex",gap:8,marginBottom:7,alignItems:"center"}}>
                  <select className="adm-inp" style={{flex:2}}
                    value={row.name} onChange={e=>{
                      const rows=[...resultScorerRows]; rows[i].name=e.target.value; setResultScorerRows(rows);
                    }}>
                    <option value="">Select player</option>
                    {players.map(p=><option key={p.id} value={p.name}>{p.name} (#{p.jersey})</option>)}
                  </select>
                  <input className="adm-inp" style={{flex:1,width:60}} type="number" min="1" max="20"
                    value={row.goals}
                    onChange={e=>{
                      const rows=[...resultScorerRows]; rows[i].goals=parseInt(e.target.value)||1; setResultScorerRows(rows);
                    }}/>
                  <button onClick={()=>setResultScorerRows(resultScorerRows.filter((_,j)=>j!==i))}
                    style={{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:6,
                      padding:"8px 12px",cursor:"pointer",fontWeight:700}}>✕</button>
                </div>
              ))}
              <button onClick={()=>setResultScorerRows([...resultScorerRows,{name:"",goals:1}])}
                style={{...S.btnGhost,fontSize:11,marginTop:4}}>+ Add Scorer</button>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={submitResultForUpcoming} disabled={loading}
                style={{...S.btn,flex:1}}>{loading?"SAVING...":"SAVE RESULT →"}</button>
              <button onClick={()=>setResultPrompt(null)} style={{...S.btnGhost,flex:1}}>Skip for now</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #E5E7EB",padding:"0 28px",
        boxShadow:"0 1px 3px rgba(0,0,0,0.07)"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",
          justifyContent:"space-between",height:58}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src={LOGO} alt="NAFC" style={{width:36,height:36,borderRadius:"50%",objectFit:"cover"}}/>
            <div>
              <div className="D" style={{fontSize:18,color:"#CC0000"}}>NAFC ADMIN</div>
              <div className="R" style={{fontSize:9,color:"#9CA3AF",letterSpacing:".15em"}}>FULL CONTROL</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {/* Overdue badge */}
            {overdueUpcoming.length > 0 && (
              <button onClick={()=>setResultPrompt(overdueUpcoming[0])}
                style={{background:"#fef2f2",color:"#CC0000",border:"1px solid #fca5a5",
                  padding:"7px 14px",borderRadius:8,fontFamily:"'Rajdhani',sans-serif",
                  fontWeight:700,fontSize:11,cursor:"pointer"}}>
                ⚠️ {overdueUpcoming.length} Match Result{overdueUpcoming.length>1?"s":""} Needed
              </button>
            )}
            <button onClick={onBack} style={{...S.btnGhost}}>← Back to Site</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 28px"}}>

        {/* Overdue banner */}
        {overdueUpcoming.length > 0 && !resultPrompt && (
          <div style={{background:"#fff7ed",border:"1px solid #fb923c",borderRadius:10,
            padding:"14px 18px",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div className="D" style={{fontSize:18,color:"#ea580c"}}>
                {overdueUpcoming.length} UPCOMING MATCH{overdueUpcoming.length>1?"ES":""} NEED RESULTS
              </div>
              <div className="R" style={{fontSize:11,color:"#9a3412"}}>
                {overdueUpcoming.map(m=>m.opponent).join(", ")} — dates have passed
              </div>
            </div>
            <button onClick={()=>setResultPrompt(overdueUpcoming[0])}
              style={{...S.btn,background:"#ea580c"}}>
              ENTER RESULTS
            </button>
          </div>
        )}

        {/* Tab nav */}
        <div style={{display:"flex",gap:6,marginBottom:24,background:"#fff",
          border:"1px solid #E5E7EB",borderRadius:10,padding:4,
          boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
          {[
            {k:"matches",l:"⚽ Add Match Result"},
            {k:"upcoming",l:"📅 Add Upcoming Match"},
            {k:"players",l:"👥 Player Stats"},
            {k:"gallery",l:"📷 Photos"},
          ].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)}
              style={{flex:1,background:tab===t.k?"#CC0000":"transparent",
                color:tab===t.k?"#fff":"#6B7280",border:"none",padding:"10px 8px",
                borderRadius:7,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,
                fontSize:12,cursor:"pointer",letterSpacing:".06em",transition:"all .2s"}}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ─── TAB: ADD MATCH RESULT ─── */}
        {tab==="matches" && (
          <div>
            <div className="D" style={{fontSize:32,color:"#111",marginBottom:16}}>ADD MATCH RESULT</div>
            <div style={S.card}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div>
                  <label style={S.label}>Opponent *</label>
                  <input className="adm-inp" placeholder="e.g. Eagles FC"
                    value={matchForm.opponent} onChange={e=>setMatchForm({...matchForm,opponent:e.target.value})}/>
                </div>
                <div>
                  <label style={S.label}>Date *</label>
                  <input className="adm-inp" type="date"
                    value={matchForm.date} onChange={e=>setMatchForm({...matchForm,date:e.target.value})}/>
                </div>
                <div>
                  <label style={S.label}>Venue</label>
                  <input className="adm-inp" placeholder="e.g. Local Ground"
                    value={matchForm.venue} onChange={e=>setMatchForm({...matchForm,venue:e.target.value})}/>
                </div>
                <div>
                  <label style={S.label}>Competition</label>
                  <select className="adm-inp"
                    value={matchForm.competition} onChange={e=>setMatchForm({...matchForm,competition:e.target.value})}>
                    <option>Friendly</option>
                    <option>League</option>
                    <option>Cup</option>
                    <option>Tournament</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>NAFC Score</label>
                  <input className="adm-inp" type="number" min="0" placeholder="0"
                    value={matchForm.nafcScore} onChange={e=>setMatchForm({...matchForm,nafcScore:e.target.value})}/>
                </div>
                <div>
                  <label style={S.label}>Opponent Score</label>
                  <input className="adm-inp" type="number" min="0" placeholder="0"
                    value={matchForm.opponentScore} onChange={e=>setMatchForm({...matchForm,opponentScore:e.target.value})}/>
                </div>
                <div>
                  <label style={S.label}>Result *</label>
                  <select className="adm-inp"
                    value={matchForm.result} onChange={e=>setMatchForm({...matchForm,result:e.target.value})}>
                    <option value="">Select...</option>
                    <option value="W">Win</option>
                    <option value="D">Draw</option>
                    <option value="L">Loss</option>
                  </select>
                </div>
              </div>

              <div style={{marginTop:16,marginBottom:16}}>
                <div className="R" style={{fontSize:11,color:"#d97706",fontWeight:700,
                  textTransform:"uppercase",letterSpacing:".12em",marginBottom:10}}>
                  ⚽ Goal Scorers
                </div>
                {scorerRows.map((row,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
                    <select className="adm-inp" style={{flex:2}}
                      value={row.name} onChange={e=>{
                        const rows=[...scorerRows]; rows[i].name=e.target.value; setScorerRows(rows);
                      }}>
                      <option value="">Select player</option>
                      {players.map(p=><option key={p.id} value={p.name}>{p.name} (#{p.jersey})</option>)}
                    </select>
                    <input className="adm-inp" style={{flex:1,width:60}} type="number" min="1" max="20"
                      placeholder="Goals" value={row.goals}
                      onChange={e=>{
                        const rows=[...scorerRows]; rows[i].goals=parseInt(e.target.value)||1; setScorerRows(rows);
                      }}/>
                    <button onClick={()=>setScorerRows(scorerRows.filter((_,j)=>j!==i))}
                      style={{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:6,
                        padding:"8px 12px",cursor:"pointer",fontWeight:700}}>✕</button>
                  </div>
                ))}
                <button onClick={()=>setScorerRows([...scorerRows,{name:"",goals:1}])}
                  style={{...S.btnGhost,fontSize:11,marginTop:4}}>
                  + Add Scorer
                </button>
              </div>

              <button onClick={submitMatch} disabled={loading}
                style={{...S.btn,fontSize:14,padding:"12px 32px"}}>
                {loading ? "SAVING..." : "SAVE MATCH →"}
              </button>
            </div>

            <div className="D" style={{fontSize:24,color:"#111",marginTop:24,marginBottom:12}}>
              PAST MATCHES ({matches.filter(m=>!m.isUpcoming).length})
            </div>
            {matches.filter(m=>!m.isUpcoming).map(m=>(
              <div key={m.id} style={{...S.card,display:"flex",alignItems:"center",
                justifyContent:"space-between",padding:"14px 18px"}}>
                <div>
                  <span className="D" style={{fontSize:18,color:"#111"}}>
                    NAFC {m.nafcScore} – {m.opponentScore} {m.opponent}
                  </span>
                  <span className="R" style={{marginLeft:12,fontSize:11,color:"#9CA3AF"}}>
                    {m.date} · {m.competition}
                  </span>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span className="R" style={{
                    background:m.result==="W"?"#dcfce7":m.result==="L"?"#fee2e2":"#dbeafe",
                    color:m.result==="W"?"#166534":m.result==="L"?"#991b1b":"#1e40af",
                    padding:"3px 10px",borderRadius:5,fontSize:11,fontWeight:700
                  }}>{m.result==="W"?"WIN":m.result==="L"?"LOSS":"DRAW"}</span>
                  <button onClick={()=>deleteMatch(m.id)}
                    style={{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:6,
                      padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── TAB: UPCOMING MATCH ─── */}
        {tab==="upcoming" && (
          <div>
            <div className="D" style={{fontSize:32,color:"#111",marginBottom:16}}>ADD UPCOMING MATCH</div>
            <div style={S.card}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                <div>
                  <label style={S.label}>Opponent *</label>
                  <input className="adm-inp" placeholder="e.g. Tigers FC"
                    value={upcomingForm.opponent} onChange={e=>setUpcomingForm({...upcomingForm,opponent:e.target.value})}/>
                </div>
                <div>
                  <label style={S.label}>Date *</label>
                  <input className="adm-inp" type="date"
                    value={upcomingForm.date} onChange={e=>setUpcomingForm({...upcomingForm,date:e.target.value})}/>
                </div>
                <div>
                  <label style={S.label}>Venue</label>
                  <input className="adm-inp" placeholder="e.g. Local Ground"
                    value={upcomingForm.venue} onChange={e=>setUpcomingForm({...upcomingForm,venue:e.target.value})}/>
                </div>
                <div>
                  <label style={S.label}>Competition</label>
                  <select className="adm-inp"
                    value={upcomingForm.competition} onChange={e=>setUpcomingForm({...upcomingForm,competition:e.target.value})}>
                    <option>Friendly</option><option>League</option>
                    <option>Cup</option><option>Tournament</option>
                  </select>
                </div>
              </div>
              <button onClick={async()=>{
                if(!upcomingForm.opponent||!upcomingForm.date){showToast("⚠️ Fill opponent & date");return;}
                setLoading(true);
                try {
                  await addDoc(collection(db,"matches"),{
                    opponent:upcomingForm.opponent, date:upcomingForm.date,
                    venue:upcomingForm.venue, competition:upcomingForm.competition,
                    isUpcoming:true, result:"upcoming",
                    nafcScore:null, opponentScore:null, scorers:[],
                    createdAt:serverTimestamp()
                  });
                  setUpcomingForm({opponent:"",date:"",venue:"",competition:"Friendly"});
                  showToast("✅ Upcoming match added!");
                } catch(e){showToast("❌ "+e.message);}
                setLoading(false);
              }} disabled={loading} style={{...S.btn,padding:"12px 32px"}}>
                {loading?"SAVING...":"PUBLISH UPCOMING MATCH →"}
              </button>
            </div>

            <div className="D" style={{fontSize:24,color:"#111",marginTop:20,marginBottom:12}}>
              UPCOMING MATCHES ({matches.filter(m=>m.isUpcoming&&m.result==="upcoming").length})
            </div>
            {matches.filter(m=>m.isUpcoming&&m.result==="upcoming").map(m=>{
              const isOverdue = new Date(m.date) < new Date(new Date().setHours(0,0,0,0));
              return (
                <div key={m.id} style={{...S.card,display:"flex",justifyContent:"space-between",
                  alignItems:"center",padding:"14px 18px",
                  border:`1px solid ${isOverdue?"#fb923c":"#E5E7EB"}`}}>
                  <div>
                    <span className="D" style={{fontSize:18,color:"#111"}}>NAFC vs {m.opponent}</span>
                    <span className="R" style={{marginLeft:12,fontSize:11,color:isOverdue?"#ea580c":"#9CA3AF"}}>
                      {m.date} · {m.competition} · {m.venue}
                      {isOverdue && " ⚠️ Date passed!"}
                    </span>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    {isOverdue && (
                      <button onClick={()=>{setResultPrompt(m);}}
                        style={{...S.btnBlue,fontSize:11}}>
                        Enter Result
                      </button>
                    )}
                    <button onClick={()=>deleteMatch(m.id)}
                      style={{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:6,
                        padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:700}}>Delete</button>
                  </div>
                </div>
              );
            })}
            {matches.filter(m=>m.isUpcoming&&m.result==="upcoming").length===0 && (
              <div className="R" style={{color:"#9CA3AF",padding:16}}>No upcoming matches added yet.</div>
            )}
          </div>
        )}

        {/* ─── TAB: PLAYER STATS ─── */}
        {tab==="players" && (
          <div>
            <div className="D" style={{fontSize:32,color:"#111",marginBottom:4}}>PLAYER STATS</div>
            <div className="R" style={{fontSize:12,color:"#9CA3AF",marginBottom:16}}>
              Click Edit to manually update any player's stats. Goalkeepers have different stats (Saves, Clean Sheets).
            </div>

            {editPlayer && (
              <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:200,
                display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
                <div style={{background:"#fff",border:"2px solid #CC0000",borderRadius:16,
                  padding:28,width:"100%",maxWidth:420}}>
                  <div className="D" style={{fontSize:26,color:"#CC0000",marginBottom:4}}>
                    EDIT — {editPlayer.name}
                  </div>
                  <div className="R" style={{fontSize:11,color:"#9CA3AF",marginBottom:16}}>
                    {editPlayer.pos} · #{editPlayer.jersey}
                    {editPlayer.pos==="Goalkeeper" && (
                      <span style={{marginLeft:8,background:"#fef3c7",color:"#92400e",
                        padding:"1px 6px",borderRadius:3,fontSize:10}}>GK STATS</span>
                    )}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                    {(editPlayer.pos === "Goalkeeper"
                      ? [["Saves","saves"],["Clean Sheets","cleanSheets"],
                         ["Appearances","appearances"],["Yellow Cards","yellowCards"],["Red Cards","redCards"]]
                      : [["Goals","goals"],["Assists","assists"],
                         ["Appearances","appearances"],["Yellow Cards","yellowCards"],["Red Cards","redCards"]]
                    ).map(([l,k])=>(
                      <div key={k}>
                        <label style={S.label}>{l}</label>
                        <input className="adm-inp" type="number" min="0"
                          value={editForm[k]??0} onChange={e=>setEditForm({...editForm,[k]:e.target.value})}/>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={savePlayerEdit} style={{...S.btn,flex:1}}>SAVE CHANGES</button>
                    <button onClick={()=>setEditPlayer(null)} style={{...S.btnGhost,flex:1}}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,overflow:"hidden",
              boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
              <div style={{display:"grid",gridTemplateColumns:"44px 1fr 110px 52px 56px 64px 64px 56px 56px 100px",
                background:"#F9FAFB",borderBottom:"1px solid #E5E7EB"}}>
                {["#","Name","Pos","Age","Apps","Goals/Svs","Asst/CS","YC","RC","Edit"].map(h=>(
                  <div key={h} className="R" style={{padding:"10px 10px",fontSize:8,color:"#9CA3AF",
                    textTransform:"uppercase",letterSpacing:".1em",fontWeight:700}}>{h}</div>
                ))}
              </div>
              {players.map((p,i)=>{
                const isGK = p.pos === "Goalkeeper";
                return (
                  <div key={p.id} style={{display:"grid",
                    gridTemplateColumns:"44px 1fr 110px 52px 56px 64px 64px 56px 56px 100px",
                    borderBottom:"1px solid #F3F4F6",background:i%2===0?"transparent":"#FAFAFA",
                    alignItems:"center"}}>
                    <div className="D" style={{padding:"10px",fontSize:18,color:"#d97706"}}>{p.jersey}</div>
                    <div className="R" style={{padding:"10px",fontWeight:700,color:"#111",fontSize:13}}>{p.name}</div>
                    <div className="R" style={{padding:"10px",fontSize:10,color:POS_COLOR[p.pos]||"#666",fontWeight:700}}>{p.pos}</div>
                    <div className="R" style={{padding:"10px",color:"#9CA3AF",fontSize:11}}>{p.age}</div>
                    <div className="D" style={{padding:"10px",color:"#374151",fontSize:18}}>{p.appearances||0}</div>
                    <div className="D" style={{padding:"10px",
                      color:isGK?"#3b82f6":"#CC0000",fontSize:22}}>{isGK?(p.saves||0):(p.goals||0)}</div>
                    <div className="D" style={{padding:"10px",
                      color:isGK?"#22c55e":"#d97706",fontSize:22}}>{isGK?(p.cleanSheets||0):(p.assists||0)}</div>
                    <div className="D" style={{padding:"10px",color:"#f59e0b",fontSize:18}}>{p.yellowCards||0}</div>
                    <div className="D" style={{padding:"10px",color:"#ef4444",fontSize:18}}>{p.redCards||0}</div>
                    <div style={{padding:"8px"}}>
                      <button onClick={()=>{setEditPlayer(p);setEditForm({...p});}}
                        style={{background:"#f0fdf4",color:"#166534",border:"1px solid #bbf7d0",
                          padding:"5px 12px",borderRadius:6,cursor:"pointer",
                          fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:11}}>
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── TAB: GALLERY ─── */}
        {tab==="gallery" && (
          <div>
            <div className="D" style={{fontSize:32,color:"#111",marginBottom:4}}>PHOTO GALLERY</div>
            <div className="R" style={{fontSize:12,color:"#9CA3AF",marginBottom:16}}>
              Upload directly from your phone or laptop. Click the ✕ button to remove any photo.
            </div>

            <div style={{...S.card,textAlign:"center",border:"2px dashed #CC0000",cursor:"pointer",
              background:"#fff9f9"}} onClick={()=>photoInputRef.current?.click()}>
              <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload}/>
              <div style={{fontSize:40,marginBottom:8}}>📷</div>
              <div className="D" style={{fontSize:24,color:"#CC0000",marginBottom:4}}>
                {uploading ? `UPLOADING... ${uploadProgress}%` : "TAP TO UPLOAD PHOTOS"}
              </div>
              <div className="R" style={{fontSize:12,color:"#9CA3AF"}}>
                Select multiple photos at once · Match photos, team photos, anything!
              </div>
              {uploading && (
                <div style={{marginTop:12,background:"#F3F4F6",borderRadius:4,overflow:"hidden",height:6}}>
                  <div style={{width:`${uploadProgress}%`,height:"100%",background:"#CC0000",transition:"width .3s"}}/>
                </div>
              )}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:16}}>
              {gallery.map(photo=>(
                <div key={photo.id} style={{borderRadius:10,overflow:"hidden",position:"relative",
                  border:"1px solid #E5E7EB",background:"#F9FAFB"}}>
                  <img src={photo.url} alt={photo.name}
                    style={{width:"100%",height:140,objectFit:"cover",display:"block"}}/>
                  {/* Remove button — always visible */}
                  <button onClick={()=>deletePhoto(photo)}
                    style={{position:"absolute",top:6,right:6,background:"rgba(220,38,38,0.9)",
                      color:"#fff",border:"none",borderRadius:"50%",width:26,height:26,
                      cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",
                      justifyContent:"center",fontWeight:700,lineHeight:1}}>
                    ✕
                  </button>
                  <div style={{padding:"8px 10px"}}>
                    <span className="R" style={{fontSize:10,color:"#6B7280",overflow:"hidden",
                      textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{photo.name}</span>
                  </div>
                </div>
              ))}
              {gallery.length===0 && (
                <div style={{gridColumn:"1/-1",textAlign:"center",padding:32,color:"#9CA3AF"}}>
                  <div className="R" style={{fontSize:14}}>No photos yet. Upload your first one!</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}