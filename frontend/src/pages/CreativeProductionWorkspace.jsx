import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";

const GOLD="#d4af37", GOLD_LIGHT="#fef08a", BG="#030712", PANEL="rgba(15,23,42,0.75)", BORDER="rgba(212,175,55,0.25)";

export default function CreativeProductionWorkspace(){
  const navigate=useNavigate();
  const [command, setCommand]=useState("");
  const [projectId, setProjectId]=useState(localStorage.getItem("garuda_creative_project")||"");
  const [uploads, setUploads]=useState([]); // ingested records
  const [results, setResults]=useState([]);
  const [history, setHistory]=useState([]);
  const [bibles, setBibles]=useState({characters:[],worlds:[],visuals:[]});
  const [status, setStatus]=useState("READY");
  const [statusMsg, setStatusMsg]=useState("");
  const [qc, setQc]=useState(null);
  const fileRef=useRef(null);
  const [dragOver,setDragOver]=useState(false);
  const [previewUrls, setPreviewUrls]=useState([]); // blob URLs for instant upload preview
  const [replicateEnabled, setReplicateEnabled]=useState(false);
  const [replicateLoading, setReplicateLoading]=useState(false);

  // Load history + bibles + replicate flag on mount / project change
  useEffect(()=>{
    fetch(`/api/creative/admin/replicate-status`).then(r=>r.json()).then(j=>{ if(j.success) setReplicateEnabled(j.enabled); }).catch(()=>{});
    if(!projectId) return;
    localStorage.setItem("garuda_creative_project", projectId);
    fetch(`/api/creative/artifacts?projectId=${encodeURIComponent(projectId)}&limit=20`).then(r=>r.json()).then(j=>{
      if(j.success) setHistory(j.artifacts||[]);
    }).catch(()=>{});
    fetch(`/api/creative/bibles?projectId=${encodeURIComponent(projectId)}`).then(r=>r.json()).then(j=>{
      if(j.success) setBibles(j.data||{characters:[],worlds:[],visuals:[]});
    }).catch(()=>{});
    fetch(`/api/creative/library?projectId=${encodeURIComponent(projectId)}`).then(r=>r.json()).then(j=>{
      if(j.success && j.data?.assets) setResults(j.data.assets);
    }).catch(()=>{});
  },[projectId]);
  const toggleReplicate=async()=>{
    setReplicateLoading(true);
    try{
      const r=await fetch(`/api/creative/admin/replicate-toggle`,{method:"POST", headers:{"Content-Type":"application/json", "x-founder-key": localStorage.getItem("garuda_founder_key")||""}, body: JSON.stringify({enable: !replicateEnabled})});
      const j=await r.json();
      if(j.success){ setReplicateEnabled(j.enabled); setStatusMsg(j.message); }
      else setStatusMsg(j.message||"Failed");
    }catch(e){ setStatusMsg(String(e.message)); }
    finally{ setReplicateLoading(false); }
  };

  const handleFiles=async(files)=>{
    if(!files||files.length===0) return;
    // instant blob preview (no wait for ingest)
    const blobs=Array.from(files).map(f=>({ name:f.name, type:f.type, size:f.size, blobUrl: URL.createObjectURL(f) }));
    setPreviewUrls(prev=>[...prev, ...blobs]);
    setStatus("INGESTING"); setStatusMsg(`${files.length} file(s) uploading…`);
    for(let idx=0; idx<files.length; idx++){
      const f=files[idx];
      const fd=new FormData(); fd.append("file", f);
      try{
        const r=await fetch("/api/creative/media/ingest",{method:"POST", body:fd, credentials:"same-origin"});
        const j=await r.json();
        if(j.success){
          // attach permanent publicUrl + keep blob for instant preview
          const enriched={...j, blobUrl: blobs[idx]?.blobUrl, previewUrl: j.publicUrl||j.dataUrl||`/assets/creative/${j.filePath?.split(/[/\\]/).pop()}`};
          setUploads(prev=>[...prev, enriched]);
        } else setStatusMsg(j.message||"Ingest failed");
      }catch(e){ setStatusMsg(String(e.message)); }
    }
    setStatus("READY"); setStatusMsg(`${files.length} ingested — preview below, ready to command GARUDA`);
  };

  const onDrop=(e)=>{ e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); };
  const onPick=(e)=> handleFiles(e.target.files);

  const handleCommand=async()=>{
    const text=command.trim();
    if(text.length<5){ setStatusMsg("Command too short — e.g., 'Is footage ko 60s reel bana'"); return; }
    setStatus("PLANNING"); setStatusMsg("GARUDA classifying intent…");
    try{
      const r=await fetch("/api/creative/intent",{ method:"POST", headers:{"Content-Type":"application/json"}, credentials:"same-origin",
        body: JSON.stringify({ text, projectId: projectId||null, sessionId:"web_"+(projectId||"default") })
      });
      const j=await r.json();
      if(!j.success && j.intent!=="UNKNOWN"){ setStatus("BLOCKED"); setStatusMsg(j.message||"Intent failed"); return; }
      setStatus("PROCESSING"); setStatusMsg(`Intent: ${j.intent} → ${j.mediaType} — executing…`);
      // Normalize any artifact shape so renderer always sees filePath/publicUrl/type
      const pushResult=(art, extra={})=>{
        if(!art) return;
        const normalized={
          ...art, ...extra,
          assetId: art.id || art.assetId || art.storyboardId || art.planId,
          filePath: art.filePath || art.url || art.viewer?.src || extra.viewer?.src || art.downloadUrl,
          publicUrl: art.publicUrl || art.url || art.assetUrl || art.downloadUrl || extra.viewer?.src,
          assetUrl: art.assetUrl || art.url || art.publicUrl,
          type: art.type || extra.viewer?.type || j.mediaType,
          mimetype: art.mimetype || (art.filePath?.endsWith(".mp3")?"audio/mpeg": art.filePath?.endsWith(".wav")?"audio/wav": undefined),
          // carry viewer/storyboard for rendering
          storyboard: art.storyboard || extra.viewer?.storyboard || art.scenes ? art : null,
          scenes: art.scenes || art.storyboard?.scenes || extra.viewer?.storyboard?.scenes,
        };
        setResults(prev=>[normalized, ...prev].slice(0,20));
      };
      if(j.artifact) {
        pushResult(j.artifact, j);
        // If music was just generated and an image/video is uploaded, auto-create beautiful final video (image Ken Burns + music)
        const isAudioResult = j.artifact.type==="AUDIO" || j.mediaType==="AUDIO" || j.artifact.mimetype?.startsWith("audio");
        if(isAudioResult && uploads.length>0){
          const hasMedia = uploads.some(u=> (u.mimetype||"").startsWith("image") || (u.mimetype||"").startsWith("video") || u.filePath?.match(/\.(jpg|jpeg|png|webp|svg|mp4|mov|webm)$/i));
          if(hasMedia){
            setStatusMsg("Music ready — now creating beautiful final video (image + music)…");
            try{
              const mediaInputs = uploads.filter(u=> (u.mimetype||"").startsWith("video") || u.mimetype?.startsWith("image") || u.filePath?.match(/\.(mp4|mov|webm|jpg|jpeg|png|webp|svg)$/i)).map(u=>u.filePath);
              const rr2=await fetch("/api/creative/music-video",{method:"POST", headers:{"Content-Type":"application/json"}, credentials:"same-origin", body: JSON.stringify({ projectId: projectId||null, footagePaths: mediaInputs, audioPath: j.artifact.filePath || j.artifact.url, durationSec:10, style:"cinematic" })});
              const rj2=await rr2.json();
              if(rj2.success && rj2.artifact){ pushResult(rj2.artifact, rj2); setQc(rj2.qc||null); }
            }catch{}
          }
        }
      }
      else if(j.viewer?.storyboard) pushResult({ id: j.viewer.storyboard.storyboardId, type:"STORYBOARD_BLUEPRINT", storyboard: j.viewer.storyboard, filePath: null }, j);
      else if(j.storyboard) pushResult({ id: j.storyboard.storyboardId, type:"STORYBOARD_BLUEPRINT", storyboard: j.storyboard }, j);
      else if(j.asset) pushResult(j.asset, j);
      // Legacy fallback for simple CREATE without artifact
      if(!j.artifact && !j.viewer?.storyboard && (j.intent==="TEXT_TO_IMAGE"||j.intent==="POSTER"||j.intent==="UNKNOWN")){
        const g=await fetch("/api/creative/generate",{method:"POST", headers:{"Content-Type":"application/json"}, credentials:"same-origin", body: JSON.stringify({ prompt:text, projectId:projectId||null })});
        const gj=await g.json();
        if(gj.success){
          const a=gj.asset||gj.storyboard||gj;
          pushResult(a, gj);
          setQc(gj.verification||null);
        }
      }
      // Audio clarification: ask for words, keep input focused
      if(j.needsInput || j.truthStatus==="AWAITING_INPUT" || j.intent==="AUDIO_CLARIFICATION_NEEDED"){
        setStatus("AWAITING_INPUT"); setStatusMsg(j.answer || j.message || "Kuch words / mood batao — jaise 'romantic' ya 'Mere dil...'");
        if(j.proofStage) setQc({ status: j.truthStatus||"AWAITING_INPUT", proof:j.proofStage });
        return;
      }
      // Only show READY if we actually pushed something
      const hasResult = Boolean(j.artifact || j.viewer?.storyboard || j.storyboard || j.asset);
      if(hasResult){
        setStatus("READY"); setStatusMsg(j.answer ? j.answer.slice(0,220) : "Done — result visible below");
      } else {
        setStatus(j.intent==="UNKNOWN" ? "BLOCKED" : "READY");
        setStatusMsg(j.message || j.answer?.slice(0,220) || "No renderable artifact — try 'poster bana do' or upload image/video");
      }
      if(j.proofStage) setQc({ status: j.truthStatus||"VERIFIED", proof:j.proofStage });
      else if(j.truthStatus) setQc({ status: j.truthStatus });
    }catch(e){ setStatus("FAILED"); setStatusMsg(String(e.message)); }
  };

  const handleMusicVideo=async()=>{
    const mediaInputs = uploads.filter(u=> (u.mimetype||"").startsWith("video") || u.mimetype?.startsWith("image") || u.filePath?.match(/\.(mp4|mov|webm|jpg|jpeg|png|webp|svg)$/i)).map(u=>u.filePath);
    const audio = uploads.find(u=> (u.mimetype||"").startsWith("audio"));
    if(mediaInputs.length===0){ setStatusMsg("Upload at least 1 image or video — then music will be invented if not provided"); return; }
    const willInvent = !audio;
    setStatus("ANALYZING"); setStatusMsg(willInvent ? "No audio found — inventing cinematic music + analyzing beats…" : "Analyzing footage + beats…");
    try{
      let beat=null;
      if(audio?.filePath){
        const br=await fetch("/api/creative/media/beat-analyze",{method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ audioPath: audio.filePath })});
        const bj=await br.json(); beat=bj.data;
      }
      setStatus("RENDERING"); setStatusMsg(willInvent ? `Rendering beautiful video — image Ken Burns + invented music (BPM ${beat?.bpm||120})` : `Rendering music video — BPM ${beat?.bpm||120} — via FFmpeg`);
      const rr=await fetch("/api/creative/music-video",{method:"POST", headers:{"Content-Type":"application/json"}, credentials:"same-origin",
        body: JSON.stringify({ projectId: projectId||null, footagePaths: mediaInputs, audioPath: audio?.filePath||null, inventMusic: willInvent, mood: willInvent ? "cinematic" : undefined, durationSec: willInvent ? 10 : 60, style:"cinematic" })
      });
      const rj=await rr.json();
      if(rj.success){
        setResults(prev=>[rj.artifact||rj, ...prev]);
        setQc(rj.qc||null);
        setStatus("READY"); setStatusMsg(`Music video READY — ${rj.artifact?.publicUrl||""}`);
      } else { setStatus("FAILED"); setStatusMsg(rj.message||"Music video failed"); }
    }catch(e){ setStatus("FAILED"); setStatusMsg(String(e.message)); }
  };

  return (
    <main style={{minHeight:"100vh", background:BG, color:"#f8fafc", fontFamily:"sans-serif", padding:"1.2rem"}}>
      <SEOHead title="GARUDA Creative Production OS — Website Command Surface" description="Upload, command, preview, QC, version — sovereign creative production on garudaos.in" canonical="https://www.garudaos.in/creative" />
      <div style={{maxWidth:1200, margin:"0 auto"}}>
        {/* Header */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${BORDER}`, paddingBottom:"0.8rem", marginBottom:"1rem", flexWrap:"wrap", gap:"0.8rem"}}>
          <div>
            <div style={{display:"flex", alignItems:"center", gap:"0.6rem"}}>
              <span style={{color:GOLD, fontSize:"1.2rem"}}>✦</span>
              <span style={{fontSize:"0.75rem", letterSpacing:"0.12em", color:GOLD, fontWeight:800}}>GARUDA CREATIVE PRODUCTION OS · CANONICAL</span>
              <span style={{background:"rgba(16,185,129,0.15)", color:"#34d399", fontSize:"0.65rem", padding:"0.15rem 0.5rem", borderRadius:999, fontWeight:800}}>WEBSITE-FIRST</span>
            </div>
            <h1 style={{margin:"0.2rem 0 0", fontSize:"1.5rem"}}>Creative Workspace</h1>
            <p style={{margin:"0.15rem 0 0", color:"#94a3b8", fontSize:"0.82rem"}}>Upload → Command (“is footage ko reel bana”) → GARUDA agents → QC → Preview. No VS Code needed.</p>
          </div>
          <div style={{display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap"}}>
            <input value={projectId} onChange={e=>setProjectId(e.target.value)} placeholder="Project ID (auto)" style={{background:"rgba(0,0,0,0.5)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:6, color:"#fff", padding:"0.45rem 0.6rem", fontSize:"0.8rem", width:160}} />
            <button onClick={toggleReplicate} disabled={replicateLoading} title="Founder: toggle Replicate paid (~₹60/min)" style={{background: replicateEnabled ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.06)", color: replicateEnabled ? "#d8b4fe" : "#94a3b8", border:`1px solid ${replicateEnabled ? "#a855f7" : "rgba(255,255,255,0.1)"}`, borderRadius:6, padding:"0.4rem 0.7rem", cursor:"pointer", fontSize:"0.75rem", fontWeight:800}}>{replicateLoading ? "…" : replicateEnabled ? "💎 Replicate ON" : "💎 Replicate OFF"}</button>
            <button onClick={()=>navigate("/command-center")} style={{background:"rgba(255,255,255,0.06)", color:"#cbd5e1", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"0.45rem 0.8rem", cursor:"pointer", fontSize:"0.8rem"}}>High Command</button>
            <button onClick={()=>navigate("/founder/access")} style={{background:`linear-gradient(135deg, rgba(212,175,55,0.2), rgba(184,134,11,0.4))`, color:GOLD_LIGHT, border:`1px solid ${GOLD}`, borderRadius:6, padding:"0.45rem 0.8rem", cursor:"pointer", fontSize:"0.8rem", fontWeight:800}}>👑 Kingdom</button>
          </div>
        </div>

        {/* Status Strip */}
        <div style={{background: status==="READY" ? "rgba(16,185,129,0.1)" : status==="FAILED"||status==="BLOCKED" ? "rgba(239,68,68,0.1)" : "rgba(212,175,55,0.12)", border:`1px solid ${status==="READY"?"rgba(16,185,129,0.3)": status==="FAILED"?"rgba(239,68,68,0.3)":"rgba(212,175,55,0.3)"}`, borderRadius:8, padding:"0.6rem 0.9rem", marginBottom:"1rem", fontSize:"0.82rem", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <span><strong style={{color:GOLD}}>{status}</strong> — {statusMsg || "Ready for upload + command"}</span>
          <span style={{fontSize:"0.7rem", color:"#94a3b8"}}>GARUDA agents handle internal complexity</span>
        </div>

        {/* COMMAND — Natural language front door */}
        <div style={{background:PANEL, border:`1px solid ${BORDER}`, borderRadius:12, padding:"1rem", marginBottom:"1rem"}}>
          <div style={{fontSize:"0.78rem", color:GOLD, fontWeight:800, letterSpacing:"0.06em", marginBottom:"0.4rem"}}>COMMAND — Natural language (Hindi / English / Hinglish)</div>
          <div style={{display:"flex", gap:"0.6rem"}}>
            <input value={command} onChange={e=>setCommand(e.target.value)} onKeyDown={e=> e.key==="Enter" && handleCommand()} placeholder='e.g., “Is raw footage ko is song ke beat pe 60 second ka cinematic reel bana” / “Create a premium poster for GARUDA”' style={{flex:1, background:"rgba(0,0,0,0.55)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, color:"#fff", padding:"0.7rem 0.9rem", fontSize:"0.9rem"}} />
            <button onClick={handleCommand} style={{background:`linear-gradient(135deg, #d4af37, #b8860b)`, color:"#000", border:"none", borderRadius:8, padding:"0.7rem 1.1rem", fontWeight:800, cursor:"pointer"}}>Tell GARUDA →</button>
          </div>
          <div style={{fontSize:"0.7rem", color:"#64748b", marginTop:"0.35rem"}}>Routed via <code>creativeIntentRouter</code> → Director/Editor → existing engines. No new brain.</div>
        </div>

        {/* UPLOAD — drag/drop */}
        <div onDragOver={e=>{e.preventDefault(); setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={onDrop} style={{background: dragOver?"rgba(212,175,55,0.08)":PANEL, border:`1px dashed ${dragOver?GOLD:BORDER}`, borderRadius:12, padding:"1rem", marginBottom:"1rem", textAlign:"center"}}>
          <div style={{fontSize:"0.85rem", fontWeight:800, color:GOLD}}>UPLOAD — Images / Videos / Audio (JPG PNG WEBP SVG MP4 MOV WEBM MP3 WAV M4A)</div>
          <p style={{fontSize:"0.78rem", color:"#94a3b8", margin:"0.3rem 0 0.6rem"}}>Drag & drop here or use picker — GARUDA extracts duration, resolution, FPS, audio presence, file size</p>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*,.svg,.webp,.mp4,.mov,.webm,.mp3,.wav,.m4a" style={{display:"none"}} onChange={onPick} />
          <div style={{display:"flex", gap:"0.5rem", justifyContent:"center"}}>
            <button onClick={()=>fileRef.current?.click()} style={{background:"rgba(255,255,255,0.08)", color:"#fff", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"0.55rem 1rem", cursor:"pointer", fontWeight:700}}>📁 Choose Files</button>
            <button onClick={handleMusicVideo} style={{background:"linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.2))", color:"#34d399", border:"1px solid rgba(16,185,129,0.3)", borderRadius:8, padding:"0.55rem 1rem", cursor:"pointer", fontWeight:800}}>🎬 Auto Music Video (footage+song)</button>
          </div>
          {(uploads.length>0 || previewUrls.length>0) && (
            <div style={{marginTop:"0.8rem", display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))", gap:"0.5rem", textAlign:"left"}}>
              {/* instant blob previews */}
              {previewUrls.map((p,i)=>(
                <div key={`pv-${i}`} style={{background:"rgba(0,0,0,0.4)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:8, padding:"0.5rem", fontSize:"0.72rem"}}>
                  <div style={{fontWeight:700, color:GOLD, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{p.name}</div>
                  {p.type?.startsWith("image/") && <img src={p.blobUrl} alt="preview" style={{width:"100%", height:90, objectFit:"cover", borderRadius:6, marginTop:4}} />}
                  {p.type?.startsWith("video/") && <video src={p.blobUrl} muted style={{width:"100%", height:90, objectFit:"cover", borderRadius:6, marginTop:4}} />}
                  {p.type?.startsWith("audio/") && <audio src={p.blobUrl} controls style={{width:"100%", marginTop:4, height:28}} />}
                  <div style={{color:"#94a3b8"}}>{p.type} · {(p.size/1024).toFixed(1)} KB</div>
                </div>
              ))}
              {uploads.map((u,i)=>(
                <div key={`up-${i}`} style={{background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"0.6rem", fontSize:"0.75rem"}}>
                  <div style={{fontWeight:700, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>✓ {u.originalName||u.assetId}</div>
                  <div style={{color:"#94a3b8"}}>{u.mimetype} · {(u.fileSize/1024).toFixed(1)} KB</div>
                  {(u.previewUrl||u.publicUrl) && u.mimetype?.startsWith("image/") && <img src={u.previewUrl||u.publicUrl} alt="ingested" style={{width:"100%", height:90, objectFit:"cover", borderRadius:6, marginTop:4}} />}
                  {(u.previewUrl||u.publicUrl) && u.mimetype?.startsWith("video/") && <video src={u.previewUrl||u.publicUrl} controls muted style={{width:"100%", height:90, objectFit:"cover", borderRadius:6, marginTop:4}} />}
                  <div style={{color:"#64748b", wordBreak:"break-all"}}>{u.filePath?.slice(-40)}</div>
                  {u.sha256 && <div style={{color:"#34d399", fontSize:"0.65rem"}}>SHA {u.sha256.slice(0,12)}…</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RESULTS — preview + QC */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:"1rem", marginBottom:"1rem"}}>
          <div style={{background:PANEL, border:`1px solid ${BORDER}`, borderRadius:12, padding:"1rem"}}>
            <div style={{fontSize:"0.85rem", fontWeight:800, color:GOLD, marginBottom:"0.6rem"}}>RESULTS — Preview / Playback / QC</div>
            {results.length===0 ? <div style={{color:"#64748b", fontSize:"0.85rem", textAlign:"center", padding:"2rem 0"}}>No results yet — upload + command to produce first artifact</div> : (
              <div style={{display:"flex", flexDirection:"column", gap:"0.7rem", maxHeight:520, overflowY:"auto"}}>
                {results.map((r,i)=>{
                  const isVideo = r.publicUrl?.endsWith(".mp4") || r.dataUrl?.endsWith(".mp4") || r.assetUrl?.endsWith(".mp4") || r.mimetype?.startsWith("video") || r.type==="VIDEO" || r.type==="STORYBOARD_BLUEPRINT" && false || r.filePath?.endsWith(".mp4");
                  const isAudio = r.mimetype?.startsWith("audio") || r.type==="AUDIO" || r.filePath?.endsWith(".mp3") || r.filePath?.endsWith(".wav");
                  const src = r.publicUrl || r.dataUrl || r.assetUrl || r.url || r.filePath;
                  const imgSrc = src?.startsWith("/assets")||src?.startsWith("/data")||src?.startsWith("/api") ? src : (src?.startsWith("data/")? "/"+src : src);
                  const isImage = !isVideo && !isAudio && (r.filePath?.match(/\.(svg|png|jpg|jpeg|webp)$/i) || src?.match(/\.(svg|png|jpg|jpeg|webp)$/i) || r.type==="IMAGE" || r.type==="POSTER");
                  const isStoryboard = r.type==="STORYBOARD_BLUEPRINT" || r.storyboard || r.scenes;
                  return (
                    <div key={i} style={{background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"0.7rem"}}>
                      <div style={{fontSize:"0.8rem", fontWeight:700, color:"#fff"}}>{r.assetId||r.id||r.storyboardId||r.planId||`Result ${i+1}`} <span style={{color:"#94a3b8", fontWeight:400}}>· {r.status||r.truthStatus||"READY"}</span></div>
                      {r.filePath && <div style={{fontSize:"0.68rem", color:"#64748b", wordBreak:"break-all"}}>{r.filePath}</div>}
                      {isStoryboard ? (
                        <div style={{marginTop:"0.5rem", background:"rgba(0,0,0,0.6)", borderRadius:6, padding:"0.6rem", maxHeight:220, overflowY:"auto"}}>
                          <div style={{fontSize:"0.75rem", color:GOLD, fontWeight:800, marginBottom:4}}>Storyboard — {(r.scenes||r.storyboard?.scenes||[]).length} scenes</div>
                          {(r.scenes||r.storyboard?.scenes||[]).slice(0,4).map((s,si)=>(
                            <div key={si} style={{fontSize:"0.72rem", color:"#cbd5e1", marginBottom:6, borderLeft:`2px solid ${GOLD}`, paddingLeft:6}}>
                              <div style={{color:"#fff", fontWeight:700}}>Scene {s.sceneNumber||si+1}: {s.title||s.shotType||s.shotPlan?.framing||""}</div>
                              <div>{s.visualDescription||s.subjectDescription||s.visual||s.generativeScenePrompt||""}</div>
                              {s.audioVoiceover && <div style={{color:"#fef08a"}}>VO: {s.audioVoiceover}</div>}
                            </div>
                          ))}
                        </div>
                      ) : isImage && imgSrc ? (
                        <img src={imgSrc} alt="preview" style={{width:"100%", maxHeight:220, objectFit:"contain", background:"#000", borderRadius:6, marginTop:"0.4rem"}} onError={e=>{ e.target.style.display="none"; e.target.nextSibling && (e.target.nextSibling.style.display="block"); }} />
                      ) : null}
                      {!isStoryboard && isImage && <div style={{display:"none", fontSize:"0.7rem", color:"#94a3b8", marginTop:6}}>Preview: <a href={imgSrc} target="_blank" rel="noreferrer" style={{color:GOLD}}>{imgSrc}</a></div>}
                      {isVideo && imgSrc && (
                        <video src={imgSrc} controls style={{width:"100%", maxHeight:200, background:"#000", borderRadius:6, marginTop:"0.4rem"}} />
                      )}
                      {isAudio && imgSrc && (
                        <audio src={imgSrc} controls style={{width:"100%", marginTop:"0.4rem"}} />
                      )}
                      {r.qc && <div style={{fontSize:"0.7rem", color: r.qc.passed?"#34d399":"#f59e0b", marginTop:"0.3rem"}}>QC: {r.qc.status} {r.qc.reason||""}</div>}
                      {(r.beatAnalysis || r.beats) && <div style={{fontSize:"0.68rem", color:"#38bdf8", marginTop:"0.2rem"}}>♫ {r.beatAnalysis?.bpm ? `BPM ${r.beatAnalysis.bpm} · ${r.beatAnalysis.beatCount||r.beats?.length||0} beats · ${r.beatAnalysis.method?.includes("sovereign")?"SOVEREIGN":"PLACEHOLDER"}` : `beats ${r.beats?.length||0}`} {r.beatAnalysis?.probedDurationSec ? `· ${r.beatAnalysis.probedDurationSec}s` : ""}</div>}
                      {r.sha256 && <div style={{fontSize:"0.65rem", color:"#64748b"}}>SHA {String(r.sha256).slice(0,16)}…</div>}
                      <div style={{display:"flex", gap:"0.4rem", marginTop:"0.4rem"}}>
                        {imgSrc && <a href={imgSrc} target="_blank" rel="noreferrer" style={{fontSize:"0.7rem", color:GOLD}}>Open</a>}
                        {imgSrc && <a href={imgSrc} download style={{fontSize:"0.7rem", color:"#38bdf8"}}>Download</a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{background:PANEL, border:`1px solid ${BORDER}`, borderRadius:12, padding:"1rem"}}>
            <div style={{fontSize:"0.85rem", fontWeight:800, color:GOLD, marginBottom:"0.6rem"}}>PROJECT — History / Versions / Bibles</div>
            <div style={{fontSize:"0.78rem", color:"#94a3b8", marginBottom:"0.5rem"}}>Project: <strong style={{color:"#fff"}}>{projectId||"(none — set ID to enable continuity)"}</strong></div>
            <div style={{fontSize:"0.75rem", color:"#64748b", marginBottom:"0.6rem"}}>Bibles: {bibles.characters.length} characters · {bibles.worlds.length} worlds · {bibles.visuals.length} visuals</div>
            {history.length===0 ? <div style={{color:"#64748b", fontSize:"0.8rem"}}>No versions yet</div> : (
              <div style={{display:"flex", flexDirection:"column", gap:"0.4rem", maxHeight:220, overflowY:"auto"}}>
                {history.map((h,i)=>(
                  <div key={i} style={{background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:6, padding:"0.5rem", fontSize:"0.75rem"}}>
                    <div style={{color:"#fff", fontWeight:700}}>{h.artifactId?.slice(0,18)}</div>
                    <div style={{color:"#94a3b8"}}>{h.purpose?.slice(0,60)}</div>
                    <div style={{color:"#64748b", fontSize:"0.65rem"}}>{new Date(h.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{marginTop:"0.8rem", display:"flex", gap:"0.4rem"}}>
              <button onClick={()=> setResults([])} style={{background:"rgba(255,255,255,0.06)", color:"#94a3b8", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"0.4rem 0.7rem", fontSize:"0.75rem", cursor:"pointer"}}>Clear local view</button>
              <button onClick={()=> navigate("/command-center")} style={{background:"rgba(212,175,55,0.12)", color:GOLD, border:`1px solid ${GOLD}`, borderRadius:6, padding:"0.4rem 0.7rem", fontSize:"0.75rem", cursor:"pointer"}}>View High Command →</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
