import {
  ALLPRO_ROLE,
  APP_VERSION,
  AUTO_REFRESH,
  AuthScreen,
  BillingReport,
  BottomSheet,
  ConfirmModal,
  DARK,
  DEMO_INV,
  DEMO_MODE,
  DaysBadge,
  ErrBox,
  HomeScreen,
  INACTIVITY_DAYS,
  InfoBox,
  LIGHT,
  LOW_BATTERY_PCT,
  MAX_REC_SECONDS,
  ManagerDash,
  MySends,
  OUTCOMES,
  OnboardingScreen,
  OutcomeBadge,
  QCFeed,
  QC_ROLE,
  ROLE_COLORS,
  SALES_ROLES,
  SONIC_DEALERS,
  SentLog,
  ShareComposer,
  SONIC_LOGO,
  SonicBadge,
  SuccessBox,
  TERMS_VERSION,
  TYPE_COLORS,
  TermsScreen,
  ThemeBtn,
  Toast,
  UploaderChip,
  VIDEO_TYPES,
  VT_COLORS,
  VTypeBadge,
  VideoThumb,
  WORKER_URL,
  _db,
  addAudit,
  backBtn,
  card,
  clearSession,
  fmtDate,
  fmtDaysAgo,
  fmtMiles,
  fmtPrice,
  fmtSize,
  fmtTime,
  getAudit,
  getCache,
  getGS,
  getSession,
  getUsers,
  hdr,
  inp,
  isAllPro,
  isManager,
  isQC,
  faceIdAvailable,
  getFaceIdEmail,
  registerFaceId,
  clearFaceId,
  lbl,
  pbtn,
  px2,
  randId,
  rootStyle,
  saveSession,
  saveUsers,
  setCache
} from './vaultCore.jsx';

// ─── Shot List (All-Pro) ───────────────────────────────────────────────────────
function ShotList(p) {
  var th=p.th; var inventory=p.inventory; var videos=p.videos; var user=p.user;
  var [checked,setChecked]=useState({});
  var [assessed,setAssessed]=useState({});

  var needsVideo=inventory.filter(function(v){
    return !(videos[v.vin]||[]).some(function(x){return x.videoType==="Official"&&!x.isDemo;});
  });
  var doneToday=inventory.filter(function(v){
    return (videos[v.vin]||[]).some(function(x){return x.videoType==="Official"&&!x.isDemo&&x.uploader===user.name&&new Date(x.date).toDateString()===new Date().toDateString();});
  });

  var totalNeeds=needsVideo.length;
  var doneCount=doneToday.length;
  var pct=totalNeeds>0?Math.round(doneCount/(doneCount+totalNeeds)*100):100;

  return <div style={rootStyle(th)}>
    <style>{getGS(th)}</style>
    <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
      <button onClick={p.onClose} style={backBtn(th)}>←</button>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:800,color:th.text,letterSpacing:2}}>SHOT LIST</div>
        <div style={{fontSize:9,color:"#ff6b35",letterSpacing:1,textTransform:"uppercase"}}>{p.dealerName} · Today</div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{fontSize:18,fontWeight:800,color:"#ff6b35",fontFamily:"'Barlow Condensed',sans-serif"}}>{doneCount}/{doneCount+totalNeeds}</div>
        <div style={{fontSize:9,color:th.muted}}>done</div>
      </div>
    </div>
    {/* Progress */}
    <div style={{background:th.panel,borderBottom:"1px solid "+th.border,padding:"10px 16px",flexShrink:0}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:11,color:th.muted}}>Today's progress</span>
        <span style={{fontSize:11,color:"#00d97e",fontWeight:700}}>{pct}%</span>
      </div>
      <div style={{height:6,background:th.border,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:pct+"%",background:"#00d97e",borderRadius:3,transition:"width 0.4s ease"}}/>
      </div>
      <div style={{display:"flex",gap:16,marginTop:8}}>
        <div style={{fontSize:11,color:"#00d97e"}}>✓ {doneCount} shot today</div>
        <div style={{fontSize:11,color:"#ff6b35"}}>● {totalNeeds} remaining</div>
        <div style={{fontSize:11,color:th.muted}}>⊙ {Object.keys(assessed).length} assessed</div>
      </div>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:12}}>
      {needsVideo.length===0?(
        <div style={{textAlign:"center",padding:"60px 20px",color:th.faint}}>
          <div style={{fontSize:44,marginBottom:10}}>🎉</div>
          <div style={{fontSize:16,fontWeight:700,color:th.text,marginBottom:6}}>All caught up!</div>
          <div>Every car has an Official video</div>
        </div>
      ):needsVideo.map(function(v){
        var isDone=checked[v.vin];
        var isAssessed=assessed[v.vin];
        return <div key={v.vin} style={{...card(th),padding:"11px 13px",marginBottom:8,opacity:isDone?0.5:1,border:"1px solid "+(isDone?"#00d97e44":isAssessed?"#4da6ff33":th.border)}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={function(){setChecked(function(prev){var n=Object.assign({},prev);if(n[v.vin])delete n[v.vin];else n[v.vin]=true;return n;});}} style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(isDone?"#00d97e":"#e8313a"),background:isDone?"#00d97e":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#fff",fontSize:14}}>
              {isDone?"✓":""}
            </button>
            <div style={{flex:1}} onClick={function(){if(p.onSelectVehicle)p.onSelectVehicle(v.vin);}}>
              <div style={{fontSize:13,fontWeight:600,color:th.text}}>{v.year} {v.make} {v.model}</div>
              <div style={{display:"flex",gap:6,marginTop:2}}>
                <span style={{fontSize:10,color:th.muted,fontFamily:"monospace"}}>#{v.stock}</span>
                <span style={{fontSize:10,color:TYPE_COLORS[v.type]||"#888"}}>{v.type}</span>
                <DaysBadge days={v.daysOnLot||0}/>
                {isAssessed&&<span style={{fontSize:9,color:"#4da6ff"}}>⊙ assessed</span>}
              </div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {!isAssessed&&!isDone&&<button onClick={function(){setAssessed(function(prev){var n=Object.assign({},prev);n[v.vin]=true;return n;});}} style={{padding:"4px 8px",background:"#4da6ff18",border:"1px solid #4da6ff33",color:"#4da6ff",borderRadius:5,cursor:"pointer",fontSize:9,fontFamily:"'Barlow',sans-serif",fontWeight:700,whiteSpace:"nowrap"}}>Assessed</button>}
              <button onClick={function(){if(p.onSelectVehicle)p.onSelectVehicle(v.vin);}} style={{padding:"4px 10px",background:"#ff6b3518",border:"1px solid #ff6b3533",color:"#ff6b35",borderRadius:5,cursor:"pointer",fontSize:9,fontFamily:"'Barlow',sans-serif",fontWeight:700}}>Shoot →</button>
            </div>
          </div>
        </div>;
      })}
      {doneToday.length>0&&<div>
        <div style={{fontSize:10,color:th.faint,letterSpacing:1,textTransform:"uppercase",margin:"12px 2px 8px"}}>Shot today ({doneToday.length})</div>
        {doneToday.map(function(v){
          return <div key={v.vin} style={{...card(th),padding:"10px 13px",marginBottom:6,opacity:0.6}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"#00d97e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#0a0c10",flexShrink:0}}>✓</div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:th.text}}>{v.year} {v.make} {v.model}</div>
                <div style={{fontSize:10,color:th.muted}}>#{v.stock}</div>
              </div>
            </div>
          </div>;
        })}
      </div>}
    </div>
  </div>;
}

// ─── Camera Screen ─────────────────────────────────────────────────────────────
function CameraScreen(p) {
  var th=p.th; var vehicle=p.vehicle;
  var videoRef=useRef(null); var mediaRef=useRef(null); var streamRef=useRef(null);
  var chunksRef=useRef([]); var timerRef=useRef(null); var batteryRef=useRef(null);
  var [recording,setRecording]=useState(false);
  var [paused,setPaused]=useState(false);
  var [elapsed,setElapsed]=useState(0);
  var [countdown,setCountdown]=useState(0);
  var [facing,setFacing]=useState("environment");
  var [muted,setMuted]=useState(isAllPro(p.user));
  var [torch,setTorch]=useState(false);
  var [grid,setGrid]=useState(false);
  var [videoType,setVT]=useState(p.defaultType||"Official");
  var [err,setErr]=useState("");
  var [blob,setBlob]=useState(null);
  var [duration,setDuration]=useState(0);
  var [audioLevel,setAudioLevel]=useState(0);
  var [battery,setBattery]=useState(null);
  var [showTypeMenu,setShowTypeMenu]=useState(false);
  var audioCtxRef=useRef(null); var analyserRef=useRef(null); var animRef=useRef(null);

  useEffect(function(){
    startCamera();
    if(navigator.getBattery)navigator.getBattery().then(function(b){setBattery(b);});
    return cleanup;
  },[facing]);

  function cleanup(){
    if(streamRef.current)streamRef.current.getTracks().forEach(function(t){t.stop();});
    if(timerRef.current)clearInterval(timerRef.current);
    if(animRef.current)cancelAnimationFrame(animRef.current);
    if(audioCtxRef.current)audioCtxRef.current.close();
  }

  function startCamera(){
    cleanup();
    navigator.mediaDevices.getUserMedia({
      video:{facingMode:facing,width:{ideal:1920},height:{ideal:1080}},
      audio:true
    }).then(function(stream){
      streamRef.current=stream;
      if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play();}
      // Audio analyser
      try{
        var ctx=new AudioContext(); audioCtxRef.current=ctx;
        var src=ctx.createMediaStreamSource(stream);
        var analyser=ctx.createAnalyser(); analyser.fftSize=256; analyserRef.current=analyser;
        src.connect(analyser);
        function updateLevel(){
          var data=new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(data);
          var avg=data.reduce(function(a,b){return a+b;},0)/data.length;
          setAudioLevel(Math.min(100,avg*2));
          animRef.current=requestAnimationFrame(updateLevel);
        }
        updateLevel();
      }catch(e){}
    }).catch(function(e){setErr("Camera access denied. Please allow camera permissions.");});
  }

  function startCountdown(){
    if(!_db.recordingConsentAckDone){
      if(!window.confirm("Reminder: this recording may capture the customer or nearby conversations. Please make sure they're aware before you start.\n\nThis message will not appear again.")){return;}
      _db.recordingConsentAckDone=true;
      addAudit({type:"consent_ack",user:p.user.email});
    }
    if(battery&&battery.level*100<LOW_BATTERY_PCT&&!window.confirm("Battery is at "+Math.round(battery.level*100)+"%. Continue recording?"))return;
    setCountdown(3);
    var c=3;
    var iv=setInterval(function(){
      c--;
      if(c===0){clearInterval(iv);setCountdown(0);doStartRecord();}
      else setCountdown(c);
    },1000);
  }

  function doStartRecord(){
    chunksRef.current=[];
    var opts=MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")?{mimeType:"video/mp4;codecs=avc1"}:
              MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?{mimeType:"video/webm;codecs=vp9"}:{};
    var mr=new MediaRecorder(streamRef.current,opts);
    mediaRef.current=mr;
    mr.ondataavailable=function(e){if(e.data.size>0)chunksRef.current.push(e.data);};
    mr.onstop=function(){
      var b=new Blob(chunksRef.current,{type:mr.mimeType||"video/webm"});
      setBlob(b); setDuration(elapsed);
    };
    // Mute audio tracks if muted
    streamRef.current.getAudioTracks().forEach(function(t){t.enabled=!muted;});
    mr.start(1000); setRecording(true); setPaused(false);
    var s=0; timerRef.current=setInterval(function(){
      s++; setElapsed(s);
      if(s>=MAX_REC_SECONDS){doStop();}
    },1000);
    // Screen wake lock
    if(navigator.wakeLock)navigator.wakeLock.request("screen").catch(function(){});
  }

  function doPause(){
    if(!mediaRef.current)return;
    mediaRef.current.pause(); clearInterval(timerRef.current); setPaused(true);
  }
  function doResume(){
    if(!mediaRef.current)return;
    mediaRef.current.resume();
    timerRef.current=setInterval(function(){
      setElapsed(function(s){
        var ns=s+1;
        if(ns>=MAX_REC_SECONDS)doStop();
        return ns;
      });
    },1000);
    setPaused(false);
  }
  function doStop(){
    if(!mediaRef.current)return;
    clearInterval(timerRef.current);
    mediaRef.current.stop(); setRecording(false); setPaused(false);
  }
  function toggleTorch(){
    if(!streamRef.current)return;
    var track=streamRef.current.getVideoTracks()[0];
    if(!track||!track.applyConstraints)return;
    var nv=!torch;
    track.applyConstraints({advanced:[{torch:nv}]}).then(function(){setTorch(nv);}).catch(function(){});
  }
  function discardAndClose(){
    setBlob(null); setElapsed(0); setRecording(false);
    cleanup(); p.onClose();
  }

  // Review / save screen
  if(blob){
    var url=URL.createObjectURL(blob);
    var sizeMB=(blob.size/1e6).toFixed(1);
    return <div style={rootStyle(th)}>
      <style>{getGS(th)}</style>
      <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
        <button onClick={function(){setBlob(null);setElapsed(0);}} style={backBtn(th)}>←</button>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:700,color:th.text}}>Review Recording</div>
          <div style={{fontSize:11,color:th.muted}}>{fmtTime(duration)} · {sizeMB} MB · {videoType}</div>
        </div>
      </div>
      <video src={url} controls playsInline style={{flex:1,width:"100%",background:"#000",objectFit:"contain"}}/>
      <div style={{padding:"12px 16px 32px",background:th.panel,borderTop:"1px solid "+th.border}}>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          {VIDEO_TYPES.map(function(vt){
            return <button key={vt} onClick={function(){setVT(vt);}} style={{flex:1,padding:"8px 0",background:videoType===vt?VT_COLORS[vt]+"18":"transparent",border:"1px solid "+(videoType===vt?VT_COLORS[vt]+"55":th.border),borderRadius:7,color:videoType===vt?VT_COLORS[vt]:th.muted,fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700}}>{vt==="Official"?"★ ":""}{vt}</button>;
          })}
        </div>
        {duration<30&&<div style={{background:"#ffd70012",border:"1px solid #ffd70033",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:12,color:"#ffd700"}}>⚠ Recording is under 30 seconds — consider re-shooting for a full walkaround.</div>}
        <div style={{display:"flex",gap:10}}>
          <button onClick={discardAndClose} style={{flex:1,padding:13,borderRadius:10,border:"1px solid #e8313a44",background:"#e8313a12",color:"#e8313a",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>🗑 Discard</button>
          <button onClick={function(){
            var vid={id:randId(),name:(vehicle?(vehicle.year+"-"+vehicle.make+"-"+vehicle.model).replace(/\s+/g,"-"):"video")+"-"+new Date().toISOString().slice(0,10),videoType:videoType,blob:blob,date:new Date().toISOString(),uploader:p.user.name,role:p.user.role,dealerName:p.user.dealerName,size:blob.size,duration:duration,notes:"",qcStatus:"pending"};
            URL.revokeObjectURL(url); cleanup(); p.onSave(vid);
          }} style={{flex:2,padding:13,borderRadius:10,border:"none",background:"#00d97e",color:"#0a0c10",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>💾 Save Video</button>
        </div>
      </div>
    </div>;
  }

  return <div style={{height:"100vh",background:"#000",display:"flex",flexDirection:"column",fontFamily:"'Barlow',sans-serif",position:"relative",overflow:"hidden"}}>
    <style>{getGS(th)}</style>
    {err&&<div style={{position:"absolute",inset:0,background:th.bg,zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:32}}>
      <div style={{fontSize:44}}>📷</div>
      <ErrBox msg={err}/>
      <button onClick={p.onClose} style={pbtn()}>Close</button>
    </div>}

    <video ref={videoRef} autoPlay muted playsInline style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>

    {/* Grid overlay */}
    {grid&&<div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
      {[33,66].map(function(pct){return <div key={"h"+pct} style={{position:"absolute",left:0,right:0,top:pct+"%",height:1,background:"rgba(255,255,255,0.25)"}}/>;} )}
      {[33,66].map(function(pct){return <div key={"v"+pct} style={{position:"absolute",top:0,bottom:0,left:pct+"%",width:1,background:"rgba(255,255,255,0.25)"}}/>;} )}
    </div>}

    {/* Countdown overlay */}
    {countdown>0&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:5}}>
      <div style={{fontSize:120,fontWeight:800,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",animation:"pulse 1s ease infinite"}}>{countdown}</div>
    </div>}

    {/* Top controls */}
    <div style={{position:"absolute",top:0,left:0,right:0,padding:"48px 16px 12px",background:"linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)",display:"flex",alignItems:"center",gap:10,zIndex:2}}>
      <button onClick={discardAndClose} style={{background:"rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",width:36,height:36,borderRadius:"50%",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      {recording&&<div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(232,49,58,0.9)",padding:"5px 12px",borderRadius:20,flex:1}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:"#fff",animation:paused?"none":"pulse 1s ease infinite"}}/>
        <span style={{color:"#fff",fontSize:13,fontWeight:700}}>{paused?"PAUSED":("REC "+fmtTime(elapsed))}</span>
        <span style={{fontSize:10,color:"rgba(255,255,255,0.7)",marginLeft:"auto"}}>{MAX_REC_SECONDS-elapsed}s left</span>
      </div>}
      {!recording&&<button onClick={function(){setShowTypeMenu(function(s){return !s;});}} style={{background:"rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",padding:"6px 12px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif",flex:1,textAlign:"left"}}>
        {videoType==="Official"?"★ ":""}{videoType} ▾
      </button>}
      {battery&&battery.level*100<LOW_BATTERY_PCT&&<div style={{background:"rgba(232,49,58,0.9)",padding:"4px 8px",borderRadius:8,fontSize:11,color:"#fff",fontWeight:700}}>🔋{Math.round(battery.level*100)}%</div>}
    </div>

    {/* Video type picker */}
    {showTypeMenu&&<div style={{position:"absolute",top:100,left:16,background:"rgba(0,0,0,0.92)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:10,overflow:"hidden",zIndex:5}}>
      {VIDEO_TYPES.map(function(vt){
        return <div key={vt} onClick={function(){setVT(vt);setShowTypeMenu(false);}} style={{padding:"11px 20px",color:videoType===vt?(VT_COLORS[vt]||"#fff"):"#aaa",fontWeight:videoType===vt?700:400,fontSize:13,cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.1)",fontFamily:"'Barlow',sans-serif"}}>
          {vt==="Official"?"★ ":""}{vt}
        </div>;
      })}
    </div>}

    {/* Side controls */}
    <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",gap:10,zIndex:2}}>
      {[
        {icon:muted?"🔇":"🎙",action:function(){setMuted(function(m){return !m;});},active:muted,label:"Mute"},
        {icon:"🔦",action:toggleTorch,active:torch,label:"Torch"},
        {icon:"⊞",action:function(){setGrid(function(g){return !g;});},active:grid,label:"Grid"},
        {icon:"🔄",action:function(){setFacing(function(f){return f==="environment"?"user":"environment";});},active:false,label:"Flip"},
      ].map(function(btn){
        return <button key={btn.label} onClick={btn.action} style={{width:42,height:42,borderRadius:"50%",background:btn.active?"rgba(255,255,255,0.3)":"rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.2)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}} title={btn.label}>{btn.icon}</button>;
      })}
    </div>

    {/* Audio level meter */}
    {recording&&!paused&&<div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",display:"flex",flexDirection:"column-reverse",gap:2,zIndex:2}}>
      {Array.from({length:10}).map(function(_,i){
        var active=(i/10)*100<audioLevel;
        return <div key={i} style={{width:4,height:16,borderRadius:2,background:active?(i>7?"#e8313a":i>4?"#ffd700":"#00d97e"):"rgba(255,255,255,0.1)"}}/>;
      })}
    </div>}

    {/* Bottom controls */}
    <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"12px 24px 48px",background:"linear-gradient(to top, rgba(0,0,0,0.8), transparent)",display:"flex",alignItems:"center",justifyContent:"center",gap:24,zIndex:2}}>
      {recording?(<>
        <button onClick={paused?doResume:doPause} style={{width:50,height:50,borderRadius:"50%",background:"rgba(255,255,255,0.15)",border:"2px solid #fff",cursor:"pointer",fontSize:18,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {paused?"▶":"⏸"}
        </button>
        <button onClick={doStop} style={{width:72,height:72,borderRadius:"50%",background:"transparent",border:"4px solid #fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:28,height:28,borderRadius:5,background:"#e8313a"}}/>
        </button>
        <div style={{width:50,height:50}}/>
      </>):(
        countdown>0?<div style={{width:72,height:72,borderRadius:"50%",background:"#e8313a",border:"4px solid #fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"#fff",fontWeight:800}}>{countdown}</div>
        :<button onClick={startCountdown} style={{width:72,height:72,borderRadius:"50%",background:"transparent",border:"4px solid #fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:"#e8313a"}}/>
        </button>
      )}
    </div>
    {!recording&&countdown===0&&<div style={{position:"absolute",bottom:52,left:0,right:0,textAlign:"center",color:"rgba(255,255,255,0.5)",fontSize:11,pointerEvents:"none",zIndex:2}}>Tap to start · {fmtTime(MAX_REC_SECONDS)} max</div>}
  </div>;
}

// ─── Inventory Screen ──────────────────────────────────────────────────────────
function InventoryScreen(p) {
  var th=p.th; var user=p.user; var inventory=p.inventory;
  var videos=p.videos; var sentLog=p.sentLog; var requests=p.requests||{};
  var [q,setQ]=useState("");
  var [filter,setFilter]=useState("All");
  var [sort,setSort]=useState("Default");
  var [showSort,setShowSort]=useState(false);
  var [showFilters,setShowFilters]=useState(false);
  var [pinned,setPinned]=useState({});
  var [recents,setRecents]=useState([]);
  var [colorF,setColorF]=useState("");
  var [priceMin,setPriceMin]=useState("");
  var [priceMax,setPriceMax]=useState("");
  var [milesMax,setMilesMax]=useState("");
  var [daysMin,setDaysMin]=useState("");
  var [longPress,setLongPress]=useState(null);
  var [showQR,setShowQR]=useState(false);
  var [hideSold,setHideSold]=useState(true);
  var lpTimer=useRef(null);

  var IS_AP=isAllPro(user); var IS_MGR=isManager(user);

  function addRecent(vin){
    setRecents(function(r){var nr=[vin,...r.filter(function(x){return x!==vin;})].slice(0,10);return nr;});
  }

  var colors=[...new Set(inventory.map(function(v){return v.color;}).filter(Boolean))].sort();

  var base=inventory.filter(function(v){
    if(hideSold&&v.sold)return false;
    if(!q)return true;
    var s=q.toLowerCase();
    return (v.vin||"").toLowerCase().includes(s)||(v.stock||"").toLowerCase().includes(s)||
           (v.make||"").toLowerCase().includes(s)||(v.model||"").toLowerCase().includes(s)||
           (v.trim||"").toLowerCase().includes(s)||(v.color||"").toLowerCase().includes(s)||
           (v.year+"").includes(s);
  });

  var filtered=base.filter(function(v){
    var vids=(videos[v.vin]||[]).filter(function(x){return !x.isDemo;});
    var hasOff=vids.some(function(x){return x.videoType==="Official";});
    var hasAny=vids.length>0;
    if(filter==="New")return v.type==="New";
    if(filter==="Used")return v.type==="Used";
    if(filter==="CPO")return v.type==="CPO";
    if(filter==="📹")return hasAny;
    if(filter==="Needs📹")return !hasOff;
    if(filter==="Pinned")return !!pinned[v.vin];
    if(filter==="🔴 Long Lot")return (v.daysOnLot||0)>=30;
    return true;
  }).filter(function(v){
    if(colorF&&v.color!==colorF)return false;
    if(priceMin&&v.price<Number(priceMin))return false;
    if(priceMax&&v.price>Number(priceMax))return false;
    if(milesMax&&v.miles>Number(milesMax))return false;
    if(daysMin&&(v.daysOnLot||0)<Number(daysMin))return false;
    return true;
  });

  var sorted=filtered.slice().sort(function(a,b){
    var aVids=(videos[a.vin]||[]).filter(function(x){return !x.isDemo;}).length;
    var bVids=(videos[b.vin]||[]).filter(function(x){return !x.isDemo;}).length;
    var aSent=(sentLog[a.vin]||[]).length;
    var bSent=(sentLog[b.vin]||[]).length;
    // Pinned always first
    if(pinned[b.vin]&&!pinned[a.vin])return 1;
    if(pinned[a.vin]&&!pinned[b.vin])return -1;
    if(sort==="Videos First")return bVids-aVids;
    if(sort==="Price ↑")return a.price-b.price;
    if(sort==="Price ↓")return b.price-a.price;
    if(sort==="Miles ↑")return (a.miles||0)-(b.miles||0);
    if(sort==="Most Sent")return bSent-aSent;
    if(sort==="Days on Lot")return (b.daysOnLot||0)-(a.daysOnLot||0);
    if(sort==="Oldest Video"){
      var aDate=(videos[a.vin]||[]).filter(function(x){return !x.isDemo;}).reduce(function(m,v){return v.date&&new Date(v.date)<m?new Date(v.date):m;},new Date());
      var bDate=(videos[b.vin]||[]).filter(function(x){return !x.isDemo;}).reduce(function(m,v){return v.date&&new Date(v.date)<m?new Date(v.date):m;},new Date());
      return aDate-bDate;
    }
    return 0;
  });

  var recentVehicles=recents.map(function(vin){return inventory.find(function(v){return v.vin===vin;});}).filter(Boolean).slice(0,8);

  function onLongPress(v){
    if(navigator.vibrate)navigator.vibrate(40);
    setLongPress(v);
  }
  function startLP(v){lpTimer.current=setTimeout(function(){onLongPress(v);},500);}
  function endLP(){clearTimeout(lpTimer.current);}

  var FILTERS=["All","New","Used","CPO","📹","Needs📹","Pinned","🔴 Long Lot"];
  var SORTS=["Default","Videos First","Price ↑","Price ↓","Miles ↑","Most Sent","Days on Lot","Oldest Video"];

  return <div style={rootStyle(th)}>
    <style>{getGS(th)}</style>

    {/* Long press quick actions */}
    {longPress&&<BottomSheet th={th} title={longPress.year+" "+longPress.make+" "+longPress.model} subtitle={"#"+longPress.stock+" · "+longPress.type} onClose={function(){setLongPress(null);}}>
      {[
        {icon:"📌",label:pinned[longPress.vin]?"Unpin vehicle":"Pin vehicle",action:function(){setPinned(function(prev){var n=Object.assign({},prev);if(n[longPress.vin])delete n[longPress.vin];else n[longPress.vin]=true;return n;});setLongPress(null);}},
        {icon:"📹",label:"Go to vehicle",action:function(){addRecent(longPress.vin);p.onSelectVehicle(longPress.vin);setLongPress(null);}},
        {icon:"📤",label:"View sent log",action:function(){addRecent(longPress.vin);p.onViewSentLog(longPress.vin);setLongPress(null);}},
        IS_AP?{icon:"📷",label:"Shoot this vehicle",action:function(){addRecent(longPress.vin);p.onShootVehicle(longPress.vin);setLongPress(null);}}:null,
      ].filter(Boolean).map(function(item){
        return <button key={item.label} onClick={item.action} style={{width:"100%",padding:"13px 4px",background:"transparent",border:"none",color:th.text,cursor:"pointer",fontSize:14,fontFamily:"'Barlow',sans-serif",textAlign:"left",borderBottom:"1px solid "+th.border,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:18}}>{item.icon}</span>{item.label}
        </button>;
      })}
    </BottomSheet>}

    {/* Advanced filters sheet */}
    {showFilters&&<BottomSheet th={th} title="⚙️ Advanced Filters" onClose={function(){setShowFilters(false);}}>
      {colors.length>0&&<div>
        <span style={lbl(th)}>Color</span>
        <select style={{...inp(th),marginBottom:8}} value={colorF} onChange={function(e){setColorF(e.target.value);}}>
          <option value="">All Colors</option>
          {colors.map(function(c){return <option key={c} value={c}>{c}</option>;})}
        </select>
      </div>}
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}>
          <span style={lbl(th)}>Min Price</span>
          <input style={inp(th)} type="number" placeholder="$0" value={priceMin} onChange={function(e){setPriceMin(e.target.value);}}/>
        </div>
        <div style={{flex:1}}>
          <span style={lbl(th)}>Max Price</span>
          <input style={inp(th)} type="number" placeholder="Any" value={priceMax} onChange={function(e){setPriceMax(e.target.value);}}/>
        </div>
      </div>
      <span style={lbl(th)}>Max Miles</span>
      <input style={inp(th)} type="number" placeholder="Any" value={milesMax} onChange={function(e){setMilesMax(e.target.value);}}/>
      <span style={lbl(th)}>Min Days on Lot</span>
      <input style={inp(th)} type="number" placeholder="0" value={daysMin} onChange={function(e){setDaysMin(e.target.value);}}/>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button onClick={function(){setColorF("");setPriceMin("");setPriceMax("");setMilesMax("");setDaysMin("");setShowFilters(false);}} style={{flex:1,padding:11,borderRadius:9,border:"1px solid "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif"}}>Clear All</button>
        <button onClick={function(){setShowFilters(false);}} style={{flex:1,padding:11,borderRadius:9,border:"none",background:"#4da6ff",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>Apply</button>
      </div>
    </BottomSheet>}

    {showSort&&<BottomSheet th={th} title="Sort By" onClose={function(){setShowSort(false);}}>
      {SORTS.map(function(s){
        return <div key={s} onClick={function(){setSort(s);setShowSort(false);}} style={{padding:"13px 4px",borderBottom:"1px solid "+th.border,cursor:"pointer",display:"flex",justifyContent:"space-between",fontSize:14,color:s===sort?"#e8313a":th.text,fontWeight:s===sort?700:400}}>
          {s} {s===sort&&"✓"}
        </div>;
      })}
    </BottomSheet>}

    {/* Header */}
    <div style={{...hdr(th)}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
          <img src={SONIC_LOGO} alt="Sonic Automotive" style={{height:28,width:"auto"}}/>
          <div style={{minWidth:0}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:16,letterSpacing:2,color:th.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>VIDEO VAULT</div>
            <button onClick={function(){p.onSwitchStore&&p.onSwitchStore();}} style={{background:"transparent",border:"none",cursor:"pointer",padding:0,textAlign:"left",display:"flex",alignItems:"center",gap:4}}>
              <div style={{fontSize:9,color:IS_AP?"#ff6b35":IS_MGR?"#e8313a":"#4da6ff",fontWeight:700,letterSpacing:0.5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:140}}>{user.dealerName}</div>
              {(user.stores||[]).length>1&&<span style={{fontSize:8,color:IS_AP?"#ff6b35":IS_MGR?"#e8313a":"#4da6ff",opacity:0.7}}>▾</span>}
            </button>
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
          {IS_MGR&&<button onClick={p.onManagerDash} style={{background:"#e8313a18",border:"1px solid #e8313a33",color:"#e8313a",padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>📊 Dash</button>}
          {IS_MGR&&<button onClick={p.onBilling} style={{background:"#ffd70018",border:"1px solid #ffd70033",color:"#ffd700",padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>💰</button>}
          {IS_AP&&<button onClick={p.onShotList} style={{background:"#ff6b3518",border:"1px solid #ff6b3533",color:"#ff6b35",padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>📋 List</button>}
          {IS_AP&&<button onClick={p.onBilling} style={{background:"#ffd70018",border:"1px solid #ffd70033",color:"#ffd700",padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>💰</button>}
          {/* Avatar */}
          <button onClick={p.onProfile} style={{width:34,height:34,borderRadius:"50%",background:ROLE_COLORS[user.role]+"28",border:"2px solid "+ROLE_COLORS[user.role]+"55",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:ROLE_COLORS[user.role],flexShrink:0,position:"relative",fontFamily:"'Barlow',sans-serif"}}>
            {user.displayName?user.displayName[0].toUpperCase():(user.name||"?")[0].toUpperCase()}
            {p.flagCount>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#e8313a",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>{p.flagCount}</span>}
          </button>
        </div>
      </div>

      {/* Demo banner */}
      {DEMO_MODE&&<div style={{background:"#ffd70012",border:"1px solid #ffd70030",borderRadius:8,padding:"6px 10px",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:10,color:"#ffd700",fontWeight:700}}>🎬 Demo Mode</span>
        <span style={{fontSize:10,color:th.faint}}>Sample {user.dealerName} inventory</span>
      </div>}

      {/* Search */}
      <div style={{position:"relative",marginBottom:8}}>
        <input style={{...inp(th),paddingLeft:36,paddingRight:q?32:14}} placeholder="VIN, Stock #, Make, Model, Color…" value={q} onChange={function(e){setQ(e.target.value);}}/>
        <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:th.faint,fontSize:16,pointerEvents:"none"}}>⌕</span>
        {q&&<button onClick={function(){setQ("");}} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:th.muted,cursor:"pointer",fontSize:16}}>✕</button>}
      </div>

      {/* Filter chips */}
      <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2,marginBottom:6}}>
        {FILTERS.map(function(f){
          var active=filter===f;
          return <button key={f} onClick={function(){setFilter(f);}} style={{flexShrink:0,padding:"5px 11px",background:active?"#e8313a18":"transparent",border:active?"1px solid #e8313a55":"1px solid "+th.border,borderRadius:20,color:active?"#e8313a":th.muted,fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:active?700:400,whiteSpace:"nowrap"}}>{f}</button>;
        })}
      </div>

      {/* Sort and filter row */}
      <div style={{display:"flex",gap:6}}>
        <button onClick={function(){setShowSort(true);}} style={{flex:1,padding:"6px 10px",background:sort!=="Default"?"#4da6ff18":"transparent",border:sort!=="Default"?"1px solid #4da6ff55":"1px solid "+th.border,borderRadius:7,color:sort!=="Default"?"#4da6ff":th.muted,fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700,textAlign:"left"}}>
          ↕ {sort==="Default"?"Sort":sort}
        </button>
        <button onClick={function(){setShowFilters(true);}} style={{padding:"6px 12px",background:(colorF||priceMin||priceMax||milesMax||daysMin)?"#c084fc18":"transparent",border:(colorF||priceMin||priceMax||milesMax||daysMin)?"1px solid #c084fc55":"1px solid "+th.border,borderRadius:7,color:(colorF||priceMin||priceMax||milesMax||daysMin)?"#c084fc":th.muted,fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700}}>⚙️ Filter</button>
        <button onClick={function(){setHideSold(function(h){return !h;});}} style={{padding:"6px 10px",background:!hideSold?"#ffd70018":"transparent",border:"1px solid "+th.border,borderRadius:7,color:!hideSold?"#ffd700":th.muted,fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>
          {hideSold?"Show Sold":"Hide Sold"}
        </button>
      </div>
    </div>

    <div style={{flex:1,overflowY:"auto",padding:"10px 12px"}}>
      {/* Recents */}
      {!q&&recentVehicles.length>0&&<div style={{marginBottom:14}}>
        <div style={{fontSize:10,color:th.faint,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>Recently Viewed</div>
        <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}}>
          {recentVehicles.map(function(v){
            var hasVid=(videos[v.vin]||[]).filter(function(x){return !x.isDemo;}).length>0;
            return <button key={v.vin} onClick={function(){addRecent(v.vin);p.onSelectVehicle(v.vin);}} style={{flexShrink:0,background:th.card,border:"1px solid "+th.border,borderRadius:8,padding:"8px 10px",textAlign:"left",cursor:"pointer",minWidth:120,maxWidth:140}}>
              <div style={{fontSize:11,fontWeight:700,color:th.text,marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.year} {v.model}</div>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:9,color:TYPE_COLORS[v.type]||"#888"}}>{v.type}</span>
                {hasVid&&<span style={{fontSize:9,color:"#00d97e"}}>📹</span>}
              </div>
            </button>;
          })}
        </div>
      </div>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:10,color:th.faint,letterSpacing:1,textTransform:"uppercase"}}>{sorted.length} vehicles</div>
        <div style={{fontSize:9,color:th.faint}}>Long press for quick actions</div>
      </div>

      {p.invLoading&&inventory.length===0?Array.from({length:6}).map(function(_,i){
        return <div key={i} style={{background:th.card,border:"1px solid "+th.border,borderRadius:12,padding:"12px 13px",marginBottom:8}}>
          <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
            <div style={{width:52,height:52,borderRadius:9,background:th.border,animation:"pulse 1.4s ease infinite"}}/>
            <div style={{flex:1}}>
              <div style={{height:14,width:"60%",background:th.border,borderRadius:4,marginBottom:8,animation:"pulse 1.4s ease infinite"}}/>
              <div style={{height:11,width:"80%",background:th.border,borderRadius:4,marginBottom:8,animation:"pulse 1.4s ease infinite",animationDelay:"0.1s"}}/>
              <div style={{height:10,width:"40%",background:th.border,borderRadius:4,animation:"pulse 1.4s ease infinite",animationDelay:"0.2s"}}/>
            </div>
            <div style={{width:60,height:14,background:th.border,borderRadius:4,animation:"pulse 1.4s ease infinite"}}/>
          </div>
        </div>;
      }):sorted.length===0?(
        <div style={{textAlign:"center",padding:"60px 20px",color:th.faint}}>
          <div style={{fontSize:44,marginBottom:10}}>🚗</div>
          <div>{q?"No vehicles match your search":"No vehicles in this filter"}</div>
        </div>
      ):sorted.map(function(v){
        var vids=(videos[v.vin]||[]).filter(function(x){return !x.isDemo;});
        var hasOff=vids.some(function(x){return x.videoType==="Official";});
        var sendCount=(sentLog[v.vin]||[]).length;
        var soldCount=(sentLog[v.vin]||[]).filter(function(s){return s.outcome==="Sold";}).length;
        var isLong=(v.daysOnLot||0)>=30;
        var isPinned=!!pinned[v.vin];
        var isRequested=!!(requests[v.vin]);
        var tc=TYPE_COLORS[v.type]||"#888";
        return <div key={v.vin}
          onMouseDown={function(){startLP(v);}} onMouseUp={endLP} onMouseLeave={endLP}
          onTouchStart={function(){startLP(v);}} onTouchEnd={endLP}
          onClick={function(){addRecent(v.vin);p.onSelectVehicle(v.vin);}}
          style={{...card(th),padding:"12px 13px",marginBottom:8,cursor:"pointer",border:"1px solid "+(isPinned?"#ffd70044":isLong?"#e8313a33":th.border),position:"relative"}} className="vv-tap">
          {isPinned&&<div style={{position:"absolute",top:8,left:8,fontSize:10}}>📌</div>}
          <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
            <div style={{width:52,height:52,borderRadius:9,background:th.inp,border:"1px solid "+th.border2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{v.type==="New"?"🆕":v.type==="CPO"?"✅":"🚗"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}>
                <div style={{fontSize:14,fontWeight:700,color:th.text,lineHeight:1.2}}>{v.year} {v.make} {v.model}</div>
                <div style={{fontSize:14,fontWeight:800,color:th.text,flexShrink:0,marginLeft:8}}>{fmtPrice(v.price)}</div>
              </div>
              <div style={{fontSize:11,color:th.muted,marginBottom:5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.trim} · {v.color}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:3,background:tc+"18",border:"1px solid "+tc+"33",color:tc}}>{v.type}</span>
                {v.miles>0&&<span style={{fontSize:9,color:th.muted}}>{fmtMiles(v.miles)}</span>}
                <DaysBadge days={v.daysOnLot||0}/>
                {hasOff&&<span style={{fontSize:9,fontWeight:700,color:"#ffd700",background:"#ffd70012",border:"1px solid #ffd70033",padding:"2px 6px",borderRadius:3}}>★ Off</span>}
                {vids.length>0&&<span style={{fontSize:9,color:"#00d97e",background:"#00d97e12",border:"1px solid #00d97e33",padding:"2px 6px",borderRadius:3,fontWeight:700}}>▶ {vids.length}</span>}
                {sendCount>0&&<span style={{fontSize:9,color:"#4da6ff",background:"#4da6ff12",border:"1px solid #4da6ff33",padding:"2px 6px",borderRadius:3,fontWeight:700}}>📤 {sendCount}</span>}
                {soldCount>0&&<span style={{fontSize:9,color:"#c084fc",background:"#c084fc12",border:"1px solid #c084fc33",padding:"2px 6px",borderRadius:3,fontWeight:700}}>💰 {soldCount}</span>}
                {(function(){
                  var offVid=(videos[v.vin]||[]).find(function(x){return x.videoType==="Official"&&!x.isDemo;});
                  if(!offVid)return null;
                  var age=Math.floor((Date.now()-new Date(offVid.date))/86400000);
                  if(age<60)return null;
                  return <span key="stale" style={{fontSize:9,color:"#ff6b35",background:"#ff6b3512",border:"1px solid #ff6b3533",padding:"2px 6px",borderRadius:3,fontWeight:700}}>📹 {age}d old</span>;
                })()}
                {isRequested&&<span style={{fontSize:9,color:"#ff6b35",background:"#ff6b3512",border:"1px solid #ff6b3533",padding:"2px 6px",borderRadius:3,fontWeight:700}}>🎯 Req</span>}
              </div>
            </div>
          </div>
        </div>;
      })}
    </div>
  </div>;
}

// ─── Vehicle Detail Screen ─────────────────────────────────────────────────────
function VehicleDetail(p) {
  var th=p.th; var user=p.user;
  var vehicle=p.inventory.find(function(v){return v.vin===p.vin;});
  if(!vehicle)return <div style={rootStyle(th)}><div style={{padding:32,color:th.faint,textAlign:"center"}}>Vehicle not found.</div></div>;
  var vids=p.videos[vehicle.vin]||[];
  var log=p.sentLog[vehicle.vin]||[];
  var IS_AP=isAllPro(user); var IS_MGR=isManager(user);
  var flags=p.flags||{};
  var requests=p.requests||{};
  var isRequested=!!requests[vehicle.vin];
  var [showSend,setShowSend]=useState(null);
  var [showLog,setShowLog]=useState(false);
  var [showCam,setShowCam]=useState(false);
  var [showTrim,setShowTrim]=useState(null);
  var [playVid,setPlayVid]=useState(null);
  var [noteFor,setNoteFor]=useState(null);
  var [noteText,setNoteText]=useState("");
  var [delConfirm,setDelConfirm]=useState(null);
  var [expandNote,setExpandNote]=useState({});
  var [nextIdx,setNextIdx]=useState(null);
  var [camType,setCamType]=useState("Official");

  // Upload handler
  var fileRef=useRef(null);
  var photoRef=useRef(null);
  function openMarketplace(){
    // Facebook Marketplace doesn't support full prefill via URL, so we copy a
    // ready-to-paste listing description and open the vehicle listing creator.
    var title=vehicle.year+" "+vehicle.make+" "+vehicle.model+(vehicle.trim?" "+vehicle.trim:"");
    var desc="FOR SALE: "+title+"\n"
      +"Stock #"+vehicle.stock+" · "+fmtMiles(vehicle.miles||0)+" · "+vehicle.color+"\n"
      +"Price: "+fmtPrice(vehicle.price)+"\n\n"
      +"Contact "+(user.displayName||user.name)+" at "+(user.dealerName||"")+" for a personal walkaround video!";
    try{navigator.clipboard.writeText(desc);}catch(e){}
    p.onToast("Listing description copied — paste it into Marketplace!");
    window.open("https://www.facebook.com/marketplace/create/vehicle","_blank");
  }
  function handlePhoto(e){
    var file=e.target.files[0]; if(!file)return;
    var pic={id:randId(),name:(vehicle.year+" "+vehicle.make+" "+vehicle.model+" Photo").trim(),videoType:"Photo",blob:file,date:new Date().toISOString(),uploader:user.name,role:user.role,dealerName:user.dealerName,size:file.size,duration:0,notes:"",qcStatus:"approved"};
    p.onSaveVideo(vehicle.vin,pic);
    p.onToast("Photo saved!");
    e.target.value="";
  }
  function handleUpload(e){
    var file=e.target.files[0]; if(!file)return;
    var sizeMB=file.size/1e6;
    if(sizeMB>500){if(!window.confirm("This file is "+sizeMB.toFixed(0)+"MB. Large files may take a while. Continue?"))return;}
    // Validate duration before saving
    var url=URL.createObjectURL(file);
    var tempVid=document.createElement("video");
    tempVid.preload="metadata"; tempVid.src=url;
    tempVid.onloadedmetadata=function(){
      URL.revokeObjectURL(url);
      var dur=Math.round(tempVid.duration||0);
      if(dur>0&&dur<15){
        if(!window.confirm("This video is only "+dur+" seconds long. Videos under 15 seconds may not meet quality standards. Upload anyway?"))return;
      }
      var vid={id:randId(),name:file.name.replace(/\.[^/.]+$/,""),videoType:"Walk-around",blob:file,date:new Date().toISOString(),uploader:user.name,role:user.role,dealerName:user.dealerName,size:file.size,duration:dur,notes:"",qcStatus:"pending"};
      p.onSaveVideo(vehicle.vin,vid);
      p.onToast("Video uploaded!");
    };
    tempVid.onerror=function(){
      URL.revokeObjectURL(url);
      var vid={id:randId(),name:file.name.replace(/\.[^/.]+$/,""),videoType:"Walk-around",blob:file,date:new Date().toISOString(),uploader:user.name,role:user.role,dealerName:user.dealerName,size:file.size,duration:0,notes:"",qcStatus:"pending"};
      p.onSaveVideo(vehicle.vin,vid);
      p.onToast("Video uploaded!");
    };
    e.target.value="";
  }

  // Next vehicle for All-Pro
  useEffect(function(){
    if(!IS_AP)return;
    var needsVid=p.inventory.filter(function(v){return !(p.videos[v.vin]||[]).some(function(x){return x.videoType==="Official"&&!x.isDemo;});});
    var idx=needsVid.findIndex(function(v){return v.vin===vehicle.vin;});
    if(idx!==-1&&idx<needsVid.length-1)setNextIdx(needsVid[idx+1].vin);
    else setNextIdx(null);
  },[p.vin]);

  // Request video (sales → All-Pro)
  function sendRequest(){
    p.onRequest&&p.onRequest(vehicle.vin);
    p.onToast("📷 Video request sent to All-Pro!");
  }

  if(showCam)return <CameraScreen th={th} user={user} vehicle={vehicle} defaultType={camType} onClose={function(){setShowCam(false);}} onSave={function(vid){p.onSaveVideo(vehicle.vin,vid);setShowCam(false);p.onToast("Video saved!");}} />;
  if(showSend)return <ShareComposer th={th} vid={showSend} vehicle={vehicle} sender={user.displayName||user.name} dealerId={user.dealerId||user.activeStore} templates={p.templates||[]} sentNames={log.map(function(e){return e.custName;})} onClose={function(){setShowSend(null);}} onSend={function(sendData){p.onSend(vehicle.vin,showSend,sendData);setShowSend(null);p.onToast("✓ Video sent to "+sendData.custName+"!");}} defaultLang={p.defaultLang}/>;
  if(showLog)return <SentLog th={th} log={log} vehicle={vehicle} isManager={IS_MGR} dealerId={user.dealerId||user.activeStore} onClose={function(){setShowLog(false);}} onUpdateOutcome={function(idx,outcome){p.onUpdateOutcome(vehicle.vin,idx,outcome);}}/>;
  if(playVid){
    var flagInfo=flags[playVid.id];
    return <div style={rootStyle(th)}>
      <style>{getGS(th)}</style>
      <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
        <button onClick={function(){setPlayVid(null);}} style={backBtn(th)}>←</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:th.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{playVid.name}</div>
          <UploaderChip vid={playVid} th={th}/>
        </div>
        <VTypeBadge type={playVid.videoType} small={true}/>
      </div>
      {playVid.isDemo?(
        <div style={{flex:1,background:"#141720",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:40}}>
          <div style={{fontSize:56}}>🎬</div>
          <div style={{fontSize:15,color:th.muted,textAlign:"center",lineHeight:1.6}}>Demo mode — video preview not available.</div>
          <div style={{fontSize:12,color:th.faint,textAlign:"center"}}>Real videos will play here once uploaded by photographers.</div>
        </div>
      ):playVid.videoType==="Photo"?(
        <div style={{flex:1,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
          <img src={URL.createObjectURL(playVid.blob)} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}}/>
        </div>
      ):(
        <video src={URL.createObjectURL(playVid.blob)} controls autoPlay playsInline style={{flex:1,width:"100%",background:"#000",objectFit:"contain"}}/>
      )}
      {flagInfo&&<div style={{padding:"8px 16px",background:"#e8313a12",borderTop:"1px solid #e8313a33",flexShrink:0}}>
        <div style={{fontSize:11,color:"#e8313a",fontWeight:700}}>🚩 QC Flag: {flagInfo.reason}</div>
      </div>}
      {playVid.notes&&<div style={{padding:"8px 16px",background:th.panel,borderTop:"1px solid "+th.border,flexShrink:0}}>
        <div style={{fontSize:11,color:th.muted}}>📝 {playVid.notes}</div>
      </div>}
      <div style={{padding:"12px 16px 32px",background:th.panel,borderTop:"1px solid "+th.border,display:"flex",gap:8,flexShrink:0}}>
        {!IS_AP&&<button onClick={function(){setPlayVid(null);setShowSend(playVid);}} style={{flex:2,padding:12,borderRadius:9,border:"none",background:"#00d97e",color:"#0a0c10",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>⬆ Send</button>}
        {!playVid.isDemo&&<button onClick={function(){setNoteFor(playVid.id);setNoteText(playVid.notes||"");setPlayVid(null);}} style={{flex:1,padding:12,borderRadius:9,border:"1px solid "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif"}}>📝 Note</button>}
        {!playVid.isDemo&&<button onClick={function(){setDelConfirm(playVid.id);setPlayVid(null);}} style={{padding:12,borderRadius:9,border:"1px solid #e8313a44",background:"transparent",color:"#e8313a",cursor:"pointer",fontSize:14}}>🗑</button>}
      </div>
    </div>;
  }

  var tc=TYPE_COLORS[vehicle.type]||"#888";
  var realVids=vids.filter(function(v){return !v.isDemo;});
  var demoVids=vids.filter(function(v){return v.isDemo;});
  var officialVids=vids.filter(function(v){return v.videoType==="Official";});
  var hasOff=realVids.some(function(v){return v.videoType==="Official";});

  return <div style={rootStyle(th)}>
    <style>{getGS(th)}</style>
    <input ref={fileRef} type="file" accept="video/*" style={{display:"none"}} onChange={handleUpload}/>
    <input ref={photoRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handlePhoto}/>

    {delConfirm&&<ConfirmModal th={th} icon="🗑" title="Delete video?" msg="This cannot be undone." danger={true} label="Delete" onConfirm={function(){p.onDeleteVideo(vehicle.vin,delConfirm);setDelConfirm(null);p.onToast("Video deleted.");}} onCancel={function(){setDelConfirm(null);}}/>}

    {noteFor&&<BottomSheet th={th} title="📝 Video Note" subtitle="Visible to all staff at your store." onClose={function(){setNoteFor(null);}}>
      <textarea value={noteText} onChange={function(e){setNoteText(e.target.value);}} placeholder="Add context about this video…" style={{...inp(th),height:100,resize:"none",marginBottom:12,fontSize:14}}/>
      <button onClick={function(){p.onUpdateVideoNote(vehicle.vin,noteFor,noteText);setNoteFor(null);p.onToast("Note saved.");}} style={pbtn("#4da6ff")}>Save Note</button>
    </BottomSheet>}

    <div style={{...hdr(th),display:"flex",alignItems:"center",gap:10}}>
      <button onClick={p.onClose} style={backBtn(th)}>←</button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:700,color:th.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{vehicle.year} {vehicle.make} {vehicle.model}</div>
        <div style={{fontSize:10,color:th.muted}}>#{vehicle.stock} · {vehicle.trim} · {fmtPrice(vehicle.price)}</div>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
        <span style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:4,background:tc+"18",border:"1px solid "+tc+"33",color:tc}}>{vehicle.type}</span>
        {log.length>0&&<button onClick={function(){setShowLog(true);}} style={{background:"#4da6ff18",border:"1px solid #4da6ff33",color:"#4da6ff",padding:"4px 9px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>📤 {log.length}</button>}
      </div>
    </div>

    <div style={{flex:1,overflowY:"auto"}}>
      {/* Vehicle details card */}
      <div style={{padding:"12px 14px",background:th.panel,borderBottom:"1px solid "+th.border}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {[["📅","Year",vehicle.year],["🎨","Color",vehicle.color],["⛽","Miles",vehicle.miles>0?fmtMiles(vehicle.miles):"New"],["🏷","VIN",vehicle.vin.slice(-6)]].map(function(item){
            return <div key={item[1]} style={{fontSize:11,color:th.muted}}><span style={{fontSize:10}}>{item[0]} </span>{item[2]}</div>;
          })}
          <DaysBadge days={vehicle.daysOnLot||0}/>
          {isRequested&&<span style={{fontSize:9,color:"#ff6b35",background:"#ff6b3512",border:"1px solid #ff6b3533",padding:"2px 7px",borderRadius:3,fontWeight:700}}>🎯 Shoot Requested</span>}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{padding:"10px 12px 0",background:th.panel,display:"flex",gap:7}}>
        {IS_AP&&<>
          <button onClick={function(){setCamType("Official");setShowCam(true);}} style={{flex:2,padding:10,borderRadius:9,border:"none",background:"#e8313a",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>● Rec</button>
          <button onClick={function(){fileRef.current&&fileRef.current.click();}} style={{flex:1,padding:10,borderRadius:9,border:"1px solid "+th.border2,background:th.inp,color:th.text,cursor:"pointer",fontSize:12,fontFamily:"'Barlow',sans-serif"}}>↑ Upload</button>
        </>}
        {!IS_AP&&<>
          <button onClick={function(){setCamType("Walk-around");setShowCam(true);}} style={{flex:1,padding:10,borderRadius:9,border:"1px solid "+th.border2,background:th.inp,color:th.text,cursor:"pointer",fontSize:12,fontFamily:"'Barlow',sans-serif"}}>● Rec</button>
          <button onClick={function(){photoRef.current&&photoRef.current.click();}} style={{flex:1,padding:10,borderRadius:9,border:"1px solid #00d97e44",background:"#00d97e12",color:"#00d97e",cursor:"pointer",fontSize:12,fontFamily:"'Barlow',sans-serif",fontWeight:700}}>📸 Photo</button>
          <button onClick={function(){fileRef.current&&fileRef.current.click();}} style={{flex:1,padding:10,borderRadius:9,border:"1px solid "+th.border2,background:th.inp,color:th.text,cursor:"pointer",fontSize:12,fontFamily:"'Barlow',sans-serif"}}>↑ Upload</button>
          {!hasOff&&<button onClick={sendRequest} style={{flex:1,padding:10,borderRadius:9,border:"1px solid #ff6b3544",background:"#ff6b3512",color:"#ff6b35",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Barlow',sans-serif",whiteSpace:"nowrap"}}>🎯 Request</button>}
        </>}
        {IS_AP&&nextIdx&&<button onClick={function(){p.onSelectVehicle(nextIdx);}} style={{flex:1,padding:10,borderRadius:9,border:"1px solid #ff6b3544",background:"#ff6b3512",color:"#ff6b35",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Barlow',sans-serif",whiteSpace:"nowrap"}}>Next →</button>}
      </div>
      {!IS_AP&&<div style={{padding:"7px 12px 10px",background:th.panel,borderBottom:"1px solid "+th.border}}>
        <button onClick={openMarketplace} style={{width:"100%",padding:9,borderRadius:9,border:"1px solid #4267B233",background:"#4267B212",color:"#4267B2",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <span style={{fontSize:14}}>📘</span> Post to Facebook Marketplace
        </button>
      </div>}

      {/* Videos section */}
      <div style={{padding:"12px 14px"}}>
        {demoVids.length>0&&<div style={{marginBottom:12}}>
          <div style={{fontSize:10,color:th.faint,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Demo Videos ({demoVids.length})</div>
          {demoVids.map(function(vid,i){
            return <div key={i} style={{...card(th),marginBottom:8,overflow:"hidden"}}>
              <div onClick={function(){setPlayVid(vid);}} style={{height:100,background:"#141720",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(232,49,58,0.88)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,paddingLeft:2,color:"#fff"}}>▶</div>
                <div style={{position:"absolute",top:8,left:8}}><VTypeBadge type={vid.videoType} small={true}/></div>
                <div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.5)",color:"#ffd700",padding:"2px 7px",borderRadius:4,fontSize:9,fontWeight:700}}>Demo</div>
              </div>
              <div style={{padding:"8px 12px"}}>
                <div style={{fontSize:13,fontWeight:600,color:th.text,marginBottom:4}}>{vid.name}</div>
                <UploaderChip vid={vid} th={th}/>
                <div style={{display:"flex",gap:8,marginTop:6}}>
                  <button onClick={function(){setPlayVid(vid);}} style={{flex:1,padding:"8px 0",background:"#e8313a12",border:"1px solid #e8313a33",color:"#e8313a",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>▶ Play</button>
                  {!IS_AP&&<button onClick={function(){setShowSend(vid);}} style={{flex:1,padding:"8px 0",background:"#00d97e12",border:"1px solid #00d97e33",color:"#00d97e",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>⬆ Send</button>}
                </div>
              </div>
            </div>;
          })}
        </div>}

        {realVids.length>0&&<div>
          <div style={{fontSize:10,color:th.faint,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Your Videos ({realVids.length})</div>
          {realVids.map(function(vid,i){
            var flagInfo=p.flags&&p.flags[vid.id];
            var isFlagged=!!flagInfo;
            return <div key={i} style={{...card(th),marginBottom:10,overflow:"hidden",border:"1px solid "+(isFlagged?"#e8313a44":th.border)}}>
              <div onClick={function(){setPlayVid(vid);}} style={{height:110,background:"#141720",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                <VideoThumb blob={vid.blob}/>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(232,49,58,0.88)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,paddingLeft:2,color:"#fff"}}>▶</div>
                </div>
                <div style={{position:"absolute",top:8,left:8}}><VTypeBadge type={vid.videoType} small={true}/></div>
                {isFlagged&&<div style={{position:"absolute",top:8,right:8,background:"#e8313a",color:"#fff",padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:800}}>🚩 RESHOOT</div>}
              </div>
              <div style={{padding:"8px 12px 10px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <div style={{fontSize:13,fontWeight:600,color:th.text,flex:1,marginRight:8}}>{vid.name}</div>
                  <div style={{fontSize:9,color:th.faint,flexShrink:0}}>{vid.duration>0?fmtTime(vid.duration):""}{vid.size?" · "+fmtSize(vid.size):""}</div>
                </div>
                <UploaderChip vid={vid} th={th}/>
                {vid.date&&<div style={{fontSize:10,color:th.faint,marginBottom:4}}>{fmtDate(vid.date)}</div>}
                {isFlagged&&<div style={{background:"#e8313a12",border:"1px solid #e8313a33",borderRadius:6,padding:"5px 8px",marginBottom:6}}>
                  <div style={{fontSize:10,color:"#e8313a",fontWeight:700}}>🚩 {flagInfo.reason}</div>
                </div>}
                {vid.notes&&<div onClick={function(){var n=Object.assign({},expandNote);n[vid.id]=!n[vid.id];setExpandNote(n);}} style={{fontSize:11,color:"#4da6ff",marginBottom:6,cursor:"pointer"}}>📝 {expandNote[vid.id]?vid.notes:"Note — tap to view"}</div>}
                <div style={{display:"flex",gap:7}}>
                  <button onClick={function(){setPlayVid(vid);}} style={{flex:1,padding:"8px 0",background:"#e8313a12",border:"1px solid #e8313a33",color:"#e8313a",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>▶ Play</button>
                  {!IS_AP&&<button onClick={function(){setShowSend(vid);}} style={{flex:1,padding:"8px 0",background:"#00d97e12",border:"1px solid #00d97e33",color:"#00d97e",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>⬆ Send</button>}
                  <button onClick={function(){setNoteFor(vid.id);setNoteText(vid.notes||"");}} style={{padding:"8px 10px",background:th.inp,border:"1px solid "+th.border2,color:th.muted,borderRadius:7,cursor:"pointer",fontSize:12}}>📝</button>
                  <button onClick={function(){setDelConfirm(vid.id);}} style={{padding:"8px 10px",background:"transparent",border:"1px solid #e8313a33",color:"#e8313a",borderRadius:7,cursor:"pointer",fontSize:12}}>🗑</button>
                </div>
              </div>
            </div>;
          })}
        </div>}

        {vids.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:th.faint}}>
          <div style={{fontSize:44,marginBottom:10}}>🎬</div>
          <div style={{marginBottom:12}}>No videos yet</div>
          {!IS_AP&&!hasOff&&<button onClick={sendRequest} style={{background:"#ff6b3518",border:"1px solid #ff6b3533",color:"#ff6b35",padding:"8px 18px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>🎯 Request Official from All-Pro</button>}
        </div>}
      </div>
    </div>
  </div>;
}

// ─── Profile / Settings Screen ─────────────────────────────────────────────────
function ProfileScreen(p) {
  var th=p.th; var user=p.user;
  var rc=ROLE_COLORS[user.role]||"#888";
  var [showLogout,setShowLogout]=useState(false);
  var [editing,setEditing]=useState(false);
  var [displayName,setDN]=useState(user.displayName||user.name);
  var [showAudit,setShowAudit]=useState(false);
  var [faceIdBusy,setFaceIdBusy]=useState(false);
  var [faceIdMsg,setFaceIdMsg]=useState("");
  var [clearDays,setClearDays]=useState(30);
  var [clearMsg,setClearMsg]=useState("");
  var faceIdOn=faceIdAvailable()&&getFaceIdEmail()===user.email.toLowerCase();
  async function toggleFaceId(){
    setFaceIdMsg("");
    if(faceIdOn){
      clearFaceId(user.email); setFaceIdMsg("Face ID disabled on this device.");
    }else{
      setFaceIdBusy(true);
      var res=await registerFaceId(user.email,user.displayName||user.name);
      setFaceIdBusy(false);
      if(!res.ok)setFaceIdMsg(res.err);
      else setFaceIdMsg("Face ID enabled on this device.");
    }
  }

  var auditLog=getAudit().filter(function(e){return e.user===user.email;}).slice(0,30);

  // Storage usage — own non-demo uploads still cached locally
  var myVideos=[];
  if(p.videos){
    Object.keys(p.videos).forEach(function(vin){
      (p.videos[vin]||[]).forEach(function(v){
        if(!v.isDemo&&v.uploader===(user.displayName||user.name)&&v.blob)myVideos.push(v);
      });
    });
  }
  var totalBytes=myVideos.reduce(function(sum,v){return sum+(v.blob?v.blob.size:0);},0);
  var oldCount=myVideos.filter(function(v){return new Date(v.date||0).getTime()<Date.now()-clearDays*86400000;}).length;
  function doClearOld(){
    var removed=p.onClearOldVideos?p.onClearOldVideos(clearDays):0;
    setClearMsg(removed>0?("Cleared "+removed+" video"+(removed===1?"":"s")+" from local cache."):"No videos older than "+clearDays+" days found.");
  }

  function saveProfile(){
    var u=Object.assign({},user,{displayName:displayName.trim()||user.name});
    var users=getUsers(); users[user.email]=u; saveUsers(users); saveSession(u);
    p.onUpdateUser(u); setEditing(false); p.onToast("Profile updated!");
  }

  return <div style={rootStyle(th)}>
    <style>{getGS(th)}</style>
    {showLogout&&<ConfirmModal th={th} icon="👋" title="Sign out?" msg="You will need to sign in again." danger={false} label="Sign Out" onConfirm={function(){clearSession();addAudit({type:"logout",user:user.email});p.onLogout();}} onCancel={function(){setShowLogout(false);}}/>}
    <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
      <button onClick={p.onClose} style={backBtn(th)}>←</button>
      <div style={{flex:1,fontSize:15,fontWeight:700,color:th.text}}>My Profile</div>
      <ThemeBtn theme={p.theme} onToggle={p.onToggle} th={th}/>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:16}}>
      {/* Avatar */}
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:rc+"28",border:"3px solid "+rc+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,fontWeight:800,color:rc,margin:"0 auto 10px",fontFamily:"'Barlow Condensed',sans-serif"}}>
          {(user.displayName||user.name||"?")[0].toUpperCase()}
        </div>
        <div style={{fontSize:18,fontWeight:700,color:th.text}}>{user.displayName||user.name}</div>
        <div style={{fontSize:12,color:rc,fontWeight:700,marginTop:2}}>{user.role}</div>
        <div style={{fontSize:11,color:th.muted,marginTop:2}}>{user.dealerName}</div>
      </div>

      {/* Edit profile */}
      {editing?(
        <div style={{...card(th),padding:14,marginBottom:12}}>
          <span style={lbl(th)}>Display Name</span>
          <input style={inp(th)} value={displayName} onChange={function(e){setDN(e.target.value);}} placeholder="Your name"/>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button onClick={function(){setEditing(false);}} style={{flex:1,padding:10,borderRadius:8,border:"1px solid "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
            <button onClick={saveProfile} style={{flex:1,padding:10,borderRadius:8,border:"none",background:"#00d97e",color:"#0a0c10",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>Save</button>
          </div>
        </div>
      ):(
        <button onClick={function(){setEditing(true);}} style={{width:"100%",padding:13,borderRadius:9,background:th.card,border:"1px solid "+th.border,color:th.text,cursor:"pointer",fontSize:14,fontFamily:"'Barlow',sans-serif",marginBottom:10,textAlign:"left"}}>✏️ Edit Display Name</button>
      )}

      {/* Account info */}
      <div style={{...card(th),padding:14,marginBottom:12}}>
        <div style={{fontSize:10,color:th.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Account</div>
        {[["Email",user.email],["Role",user.role],["Store",user.dealerName],["City",user.dealerCity],["Member since",fmtDate(user.createdAt||new Date())]].map(function(item){
          return <div key={item[0]} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid "+th.border}}>
            <span style={{fontSize:12,color:th.muted}}>{item[0]}</span>
            <span style={{fontSize:12,color:th.text,fontWeight:600,maxWidth:"60%",textAlign:"right",wordBreak:"break-all"}}>{item[1]}</span>
          </div>;
        })}
      </div>

      {/* Terms acceptance */}
      <div style={{...card(th),padding:14,marginBottom:12}}>
        <div style={{fontSize:10,color:th.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Terms of Use</div>
        <div style={{fontSize:12,color:th.text}}>Version {user.termsVersion||TERMS_VERSION}</div>
        <div style={{fontSize:11,color:th.muted,marginTop:3}}>Accepted: {user.termsAcceptedAt?fmtDate(user.termsAcceptedAt):"Unknown"}</div>
      </div>

      {/* Face ID / Touch ID */}
      {faceIdAvailable()&&<div style={{...card(th),padding:14,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:th.text}}>🆔 Face ID / Touch ID</div>
            <div style={{fontSize:11,color:th.muted,marginTop:2}}>{faceIdOn?"Enabled on this device":"Sign in faster without a password"}</div>
          </div>
          <div onClick={faceIdBusy?undefined:toggleFaceId} style={{width:44,height:24,borderRadius:12,background:faceIdOn?"#00d97e":th.border,cursor:faceIdBusy?"wait":"pointer",position:"relative",transition:"background 0.2s",flexShrink:0,opacity:faceIdBusy?0.6:1}}>
            <div style={{position:"absolute",top:3,left:faceIdOn?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
          </div>
        </div>
        {faceIdMsg&&<div style={{fontSize:11,color:faceIdOn?"#00d97e":th.muted,marginTop:8}}>{faceIdMsg}</div>}
      </div>}

      {/* Storage management */}
      <div style={{...card(th),padding:14,marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:th.text,marginBottom:2}}>💾 Local Video Storage</div>
        <div style={{fontSize:11,color:th.muted,marginBottom:10}}>{myVideos.length} of your video{myVideos.length===1?"":"s"} cached on this device · {fmtSize(totalBytes)}</div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <div style={{fontSize:12,color:th.sub,flex:1}}>Clear videos older than</div>
          <select value={clearDays} onChange={function(e){setClearDays(Number(e.target.value));setClearMsg("");}} style={{background:th.inp,border:"1px solid "+th.border,borderRadius:6,color:th.text,fontSize:12,fontWeight:700,padding:"5px 8px",fontFamily:"'Barlow',sans-serif"}}>
            {[7,14,30,60,90].map(function(d){return <option key={d} value={d}>{d} days</option>;})}
          </select>
        </div>
        <button onClick={doClearOld} disabled={oldCount===0} style={{width:"100%",padding:10,borderRadius:9,border:"1px solid "+(oldCount>0?"#e8313a44":th.border2),background:oldCount>0?"#e8313a12":"transparent",color:oldCount>0?"#e8313a":th.faint,cursor:oldCount>0?"pointer":"default",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>
          {oldCount>0?("🗑 Clear "+oldCount+" video"+(oldCount===1?"":"s")):"No videos to clear"}
        </button>
        {clearMsg&&<div style={{fontSize:11,color:"#00d97e",marginTop:8}}>{clearMsg}</div>}
      </div>

      {/* Audit log */}
      <button onClick={function(){setShowAudit(function(s){return !s;});}} style={{width:"100%",padding:12,borderRadius:9,background:th.card,border:"1px solid "+th.border,color:th.text,cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif",marginBottom:10,textAlign:"left",display:"flex",justifyContent:"space-between"}}>
        <span>📋 My Activity Log</span><span style={{color:th.faint}}>{showAudit?"▲":"▼"}</span>
      </button>
      {showAudit&&<div style={{...card(th),padding:12,marginBottom:12}}>
        {auditLog.length===0?<div style={{fontSize:12,color:th.faint,textAlign:"center",padding:12}}>No activity yet</div>:auditLog.map(function(e,i){
          return <div key={i} style={{padding:"6px 0",borderBottom:"1px solid "+th.border,fontSize:11}}>
            <span style={{color:th.muted}}>{fmtDate(e.ts)} · </span>
            <span style={{color:th.text,fontWeight:600,textTransform:"capitalize"}}>{e.type}</span>
          </div>;
        })}
      </div>}

      {/* App info */}
      <div style={{...card(th),padding:14,marginBottom:16}}>
        <div style={{fontSize:10,color:th.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>App Info</div>
        {[["Version",APP_VERSION],["Terms Version",TERMS_VERSION],["Mode",DEMO_MODE?"Demo":"Live"]].map(function(item){
          return <div key={item[0]} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid "+th.border}}>
            <span style={{fontSize:12,color:th.muted}}>{item[0]}</span>
            <span style={{fontSize:12,color:th.text,fontWeight:600}}>{item[1]}</span>
          </div>;
        })}
      </div>

      <button onClick={function(){setShowLogout(true);}} style={{width:"100%",padding:14,borderRadius:10,background:"#e8313a18",border:"1px solid #e8313a44",color:"#e8313a",cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:"'Barlow',sans-serif",marginBottom:32}}>Sign Out</button>
    </div>
  </div>;
}



// ─── Video Trimmer ─────────────────────────────────────────────────────────────
function VideoTrimmer(p) {
  var th=p.th; var blob=p.blob;
  var [start,setStart]=useState(0);
  var [end,setEnd]=useState(100);
  var [duration,setDuration]=useState(0);
  var [playing,setPlaying]=useState(false);
  var vidRef=useRef(null);
  var url=useRef(URL.createObjectURL(blob));

  useEffect(function(){
    return function(){URL.revokeObjectURL(url.current);};
  },[]);

  function onLoaded(){
    if(vidRef.current)setDuration(vidRef.current.duration||0);
  }
  function doTrim(){
    // Without server-side processing we approximate trim by noting timestamps
    // Full server trim requires MediaSource API or FFmpeg WASM
    var trimStart=(start/100)*duration;
    var trimEnd=(end/100)*duration;
    p.onTrim({blob:blob,trimStart:trimStart,trimEnd:trimEnd,duration:trimEnd-trimStart});
  }
  function fmtSec(s){
    return String(Math.floor(s/60)).padStart(2,"0")+":"+String(Math.floor(s%60)).padStart(2,"0");
  }
  var startSec=(start/100)*duration;
  var endSec=(end/100)*duration;

  return <BottomSheet th={th} title="✂️ Trim Video" subtitle="Drag handles to set start and end points." onClose={p.onClose}>
    <video ref={vidRef} src={url.current} onLoadedMetadata={onLoaded}
      style={{width:"100%",borderRadius:8,background:"#000",maxHeight:180,objectFit:"contain",marginBottom:12}}
      controls playsInline/>
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:11,color:th.muted}}>Start: {fmtSec(startSec)}</span>
        <span style={{fontSize:11,color:th.muted}}>End: {fmtSec(endSec)}</span>
        <span style={{fontSize:11,color:"#00d97e",fontWeight:700}}>Duration: {fmtSec(endSec-startSec)}</span>
      </div>
      <div style={{position:"relative",height:40,marginBottom:8}}>
        <div style={{position:"absolute",top:"50%",left:0,right:0,height:4,background:th.border,borderRadius:2,transform:"translateY(-50%)"}}/>
        <div style={{position:"absolute",top:"50%",left:start+"%",right:(100-end)+"%",height:4,background:"#4da6ff",borderRadius:2,transform:"translateY(-50%)"}}/>
        {/* Start handle */}
        <input type="range" min="0" max={end-1} value={start} onChange={function(e){setStart(Number(e.target.value));}}
          style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0,cursor:"pointer",zIndex:2}}/>
        <div style={{position:"absolute",top:"50%",left:start+"%",width:20,height:20,borderRadius:"50%",background:"#4da6ff",border:"3px solid #fff",transform:"translate(-50%,-50%)",pointerEvents:"none",boxShadow:"0 2px 8px rgba(0,0,0,0.4)"}}/>
        {/* End handle */}
        <input type="range" min={start+1} max="100" value={end} onChange={function(e){setEnd(Number(e.target.value));}}
          style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0,cursor:"pointer",zIndex:3}}/>
        <div style={{position:"absolute",top:"50%",left:end+"%",width:20,height:20,borderRadius:"50%",background:"#4da6ff",border:"3px solid #fff",transform:"translate(-50%,-50%)",pointerEvents:"none",boxShadow:"0 2px 8px rgba(0,0,0,0.4)"}}/>
      </div>
    </div>
    {endSec-startSec<30&&<div style={{background:"#ffd70012",border:"1px solid #ffd70033",borderRadius:7,padding:"7px 10px",marginBottom:10,fontSize:11,color:"#ffd700"}}>⚠ Clip is under 30 seconds — consider keeping more for a complete walkaround.</div>}
    <div style={{display:"flex",gap:10}}>
      <button onClick={p.onClose} style={{flex:1,padding:12,borderRadius:9,border:"1px solid "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:14,fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
      <button onClick={doTrim} style={{flex:1,padding:12,borderRadius:9,border:"none",background:"#4da6ff",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>✂️ Apply Trim</button>
    </div>
  </BottomSheet>;
}

// ─── Thumbnail Selector ────────────────────────────────────────────────────────
function ThumbnailSelector(p) {
  var th=p.th; var blob=p.blob;
  var [frames,setFrames]=useState([]);
  var [selected,setSelected]=useState(0);
  var [loading,setLoading]=useState(true);

  useEffect(function(){
    var url=URL.createObjectURL(blob);
    var v=document.createElement("video");
    v.src=url; v.muted=true; v.preload="auto";
    v.onloadeddata=function(){
      var dur=v.duration||10;
      var times=[0.05, 0.15, 0.25, 0.4, 0.55, 0.7, 0.85].map(function(t){return t*dur;});
      var results=[];
      var idx=0;
      function capFrame(){
        if(idx>=times.length){setFrames(results);setLoading(false);URL.revokeObjectURL(url);return;}
        v.currentTime=times[idx];
        v.onseeked=function(){
          var c=document.createElement("canvas");
          c.width=Math.min(v.videoWidth,320); c.height=Math.min(v.videoHeight,180);
          c.getContext("2d").drawImage(v,0,0,c.width,c.height);
          results.push({time:times[idx],dataUrl:c.toDataURL("image/jpeg",0.7)});
          idx++; capFrame();
        };
      }
      capFrame();
    };
    v.onerror=function(){setLoading(false);URL.revokeObjectURL(url);};
  },[blob]);

  return <BottomSheet th={th} title="🖼 Select Thumbnail" subtitle="Tap a frame to use as the video preview." onClose={p.onClose}>
    {loading?(
      <div style={{textAlign:"center",padding:"24px 0",color:th.faint}}>
        <div style={{fontSize:32,marginBottom:10,animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</div>
        <div style={{fontSize:12}}>Extracting frames…</div>
      </div>
    ):(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
        {frames.map(function(f,i){
          var isSelected=selected===i;
          return <div key={i} onClick={function(){setSelected(i);}} style={{position:"relative",paddingTop:"56%",borderRadius:8,overflow:"hidden",border:isSelected?"2px solid #4da6ff":"2px solid transparent",cursor:"pointer"}}>
            <img src={f.dataUrl} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
            {isSelected&&<div style={{position:"absolute",inset:0,background:"rgba(77,166,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>✓</div>}
            <div style={{position:"absolute",bottom:3,right:5,fontSize:8,color:"rgba(255,255,255,0.8)",background:"rgba(0,0,0,0.5)",padding:"1px 4px",borderRadius:3}}>{fmtTime(Math.floor(f.time))}</div>
          </div>;
        })}
      </div>
    )}
    <button onClick={function(){if(frames[selected])p.onSelect(frames[selected]);}} disabled={loading||frames.length===0}
      style={{width:"100%",padding:13,borderRadius:10,border:"none",background:"#4da6ff",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Barlow',sans-serif",opacity:loading?0.5:1}}>
      Use This Frame
    </button>
  </BottomSheet>;
}

// ─── Comparison Send ───────────────────────────────────────────────────────────
function ComparisonSend(p) {
  var th=p.th; var user=p.user;
  var [vid1,setVid1]=useState(p.vid1||null);
  var [vid2,setVid2]=useState(p.vid2||null);
  var [veh1,setVeh1]=useState(p.veh1||null);
  var [veh2,setVeh2]=useState(p.veh2||null);
  var [custName,setCust]=useState("");
  var [custContact,setCtc]=useState("");
  var [lang,setLang]=useState("en");
  var [msg,setMsg]=useState("");
  var [sending,setSending]=useState(false);
  var [step,setStep]=useState(vid1&&vid2?"compose":"pick1");

  useEffect(function(){
    if(vid1&&vid2&&veh1&&veh2){
      var n=custName||"there";
      var c1=veh1.year+" "+veh1.make+" "+veh1.model;
      var c2=veh2.year+" "+veh2.make+" "+veh2.model;
      if(lang==="es")setMsg("Hola "+n+", acabo de preparar una comparación de dos vehículos para ti:\n\n1️⃣ "+c1+" — Stock #"+veh1.stock+"\n2️⃣ "+c2+" — Stock #"+veh2.stock+"\n\nAmbos videos están adjuntos. ¿Cuál te interesa más?\n\n— "+user.name);
      else setMsg("Hi "+n+", I pulled up two vehicles I thought you'd want to compare:\n\n1️⃣ "+c1+" — Stock #"+veh1.stock+"\n2️⃣ "+c2+" — Stock #"+veh2.stock+"\n\nBoth videos are attached. Which one speaks to you?\n\n— "+user.name);
    }
  },[vid1,vid2,veh1,veh2,custName,lang]);

  function handleSend(){
    setSending(true);
    // Share both files
    var files=[]; var blobs=[];
    if(vid1&&!vid1.isDemo)blobs.push(vid1);
    if(vid2&&!vid2.isDemo)blobs.push(vid2);
    setTimeout(function(){
      setSending(false);
      p.onSend({custName:custName||"Customer",custContact:custContact,msg:msg,comparison:true});
    },800);
  }

  return <div style={rootStyle(th)}>
    <style>{getGS(th)}</style>
    <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
      <button onClick={p.onClose} style={backBtn(th)}>←</button>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:700,color:th.text}}>Comparison Send</div>
        <div style={{fontSize:11,color:th.muted}}>Send two vehicles side by side</div>
      </div>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:16}}>
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        {[{vid:vid1,veh:veh1,label:"Vehicle 1",setV:setVid1,setVeh:setVeh1},
          {vid:vid2,veh:veh2,label:"Vehicle 2",setV:setVid2,setVeh:setVeh2}].map(function(slot,i){
          return <div key={i} style={{flex:1,background:th.card,border:"1px solid "+(slot.vid?"#4da6ff44":th.border),borderRadius:10,padding:12,textAlign:"center",cursor:slot.vid?"default":"pointer"}}
            onClick={function(){if(!slot.vid)p.onPickVehicle(i,function(v,veh){if(i===0){setVid1(v);setVeh1(veh);}else{setVid2(v);setVeh2(veh);}});}} >
            {slot.vid&&slot.veh?(
              <div>
                <div style={{fontSize:10,color:"#4da6ff",fontWeight:700,marginBottom:4}}>✓ Selected</div>
                <div style={{fontSize:11,color:th.text,fontWeight:600,marginBottom:2}}>{slot.veh.year} {slot.veh.model}</div>
                <VTypeBadge type={slot.vid.videoType} small={true}/>
                <button onClick={function(e){e.stopPropagation();if(i===0){setVid1(null);setVeh1(null);}else{setVid2(null);setVeh2(null);}}} style={{display:"block",margin:"8px auto 0",background:"transparent",border:"none",color:th.muted,cursor:"pointer",fontSize:11,fontFamily:"'Barlow',sans-serif"}}>Remove</button>
              </div>
            ):(
              <div>
                <div style={{fontSize:24,marginBottom:6}}>+</div>
                <div style={{fontSize:11,color:th.muted}}>{slot.label}</div>
                <div style={{fontSize:10,color:th.faint}}>Tap to select</div>
              </div>
            )}
          </div>;
        })}
      </div>
      {vid1&&vid2&&<div>
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          {[["en","🇺🇸 English"],["es","🇪🇸 Español"]].map(function(item){
            var l=item[0]; var lb=item[1];
            return <button key={l} onClick={function(){setLang(l);}} style={{flex:1,padding:"8px 0",background:lang===l?"#4da6ff18":"transparent",border:lang===l?"1px solid #4da6ff55":"1px solid "+th.border,borderRadius:8,color:lang===l?"#4da6ff":th.muted,fontSize:12,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700}}>{lb}</button>;
          })}
        </div>
        <span style={lbl(th)}>Customer Name</span>
        <input style={inp(th)} placeholder="e.g. John Smith" value={custName} onChange={function(e){setCust(e.target.value);}}/>
        <span style={lbl(th)}>Phone or Email (optional)</span>
        <input style={inp(th)} placeholder="For your records" value={custContact} onChange={function(e){setCtc(e.target.value);}}/>
        <span style={lbl(th)}>Message</span>
        <textarea value={msg} onChange={function(e){setMsg(e.target.value);}} style={{...inp(th),height:160,resize:"none",lineHeight:1.5,fontSize:13}}/>
      </div>}
    </div>
    {vid1&&vid2&&<div style={{padding:"14px 16px 28px",background:th.panel,borderTop:"1px solid "+th.border}}>
      <button onClick={handleSend} disabled={sending} style={{...pbtn("#00d97e"),opacity:sending?0.6:1}}>
        {sending?"Sending…":"⬆ Send Comparison to "+(custName||"Customer")}
      </button>
    </div>}
  </div>;
}

// ─── Group Send ────────────────────────────────────────────────────────────────
function GroupSend(p) {
  var th=p.th; var vid=p.vid; var vehicle=p.vehicle; var user=p.user;
  var [customers,setCustomers]=useState([{name:"",contact:""}]);
  var [lang,setLang]=useState("en");
  var [sending,setSending]=useState(false);
  var [sent,setSent]=useState(false);

  function addCustomer(){setCustomers(function(c){return c.concat([{name:"",contact:""}]);});}
  function removeCustomer(i){setCustomers(function(c){return c.filter(function(_,idx){return idx!==i;});});}
  function updateCustomer(i,field,val){
    setCustomers(function(c){var n=c.slice();n[i]=Object.assign({},n[i]);n[i][field]=val;return n;});
  }
  function handleSend(){
    var valid=customers.filter(function(c){return c.name.trim();});
    if(!valid.length)return;
    setSending(true);
    setTimeout(function(){
      setSending(false); setSent(true);
      p.onSend(valid.map(function(c){
        return {custName:c.name,custContact:c.contact,sentAt:new Date().toISOString(),videoType:vid.videoType,outcome:"No Response"};
      }));
    },1000);
  }

  if(sent)return <div style={rootStyle(th)}>
    <style>{getGS(th)}</style>
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:16}}>✓</div>
      <div style={{fontSize:18,fontWeight:700,color:th.text,marginBottom:8}}>Sent to {customers.filter(function(c){return c.name.trim();}).length} customers</div>
      <div style={{fontSize:13,color:th.muted,marginBottom:24}}>All sends logged in the sent log.</div>
      <button onClick={p.onClose} style={pbtn()}>Done</button>
    </div>
  </div>;

  return <div style={rootStyle(th)}>
    <style>{getGS(th)}</style>
    <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
      <button onClick={p.onClose} style={backBtn(th)}>←</button>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:700,color:th.text}}>Group Send</div>
        <div style={{fontSize:11,color:th.muted}}>{vehicle?(vehicle.year+" "+vehicle.make+" "+vehicle.model):""}</div>
      </div>
      <VTypeBadge type={vid.videoType} small={true}/>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:16}}>
      <InfoBox msg={"📎 The same video will be sent to each customer individually with a personalized message."} accent="#4da6ff" th={th}/>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[["en","🇺🇸"],["es","🇪🇸"]].map(function(item){
          var l=item[0]; var fl=item[1];
          return <button key={l} onClick={function(){setLang(l);}} style={{flex:1,padding:"8px 0",background:lang===l?"#4da6ff18":"transparent",border:lang===l?"1px solid #4da6ff55":"1px solid "+th.border,borderRadius:8,color:lang===l?"#4da6ff":th.muted,fontSize:12,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700}}>{fl} {l==="en"?"English":"Español"}</button>;
        })}
      </div>
      {customers.map(function(c,i){
        return <div key={i} style={{...card(th),padding:"12px 14px",marginBottom:10,borderRadius:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,fontWeight:700,color:th.text}}>Customer {i+1}</span>
            {customers.length>1&&<button onClick={function(){removeCustomer(i);}} style={{background:"transparent",border:"none",color:th.muted,cursor:"pointer",fontSize:18,lineHeight:1}}>✕</button>}
          </div>
          <input style={{...inp(th),marginBottom:8}} placeholder="Name *" value={c.name} onChange={function(e){updateCustomer(i,"name",e.target.value);}}/>
          <input style={inp(th)} placeholder="Phone or email (optional)" value={c.contact} onChange={function(e){updateCustomer(i,"contact",e.target.value);}}/>
        </div>;
      })}
      <button onClick={addCustomer} style={{width:"100%",padding:11,borderRadius:9,border:"1px dashed "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif"}}>+ Add Another Customer</button>
    </div>
    <div style={{padding:"14px 16px 28px",background:th.panel,borderTop:"1px solid "+th.border}}>
      <button onClick={handleSend} disabled={sending||!customers.some(function(c){return c.name.trim();})}
        style={{...pbtn("#00d97e"),opacity:(sending||!customers.some(function(c){return c.name.trim();}))?0.5:1}}>
        {sending?"Sending…":"⬆ Send to "+customers.filter(function(c){return c.name.trim();}).length+" Customer"+(customers.filter(function(c){return c.name.trim();}).length!==1?"s":"")}
      </button>
    </div>
  </div>;
}

// ─── Schedule Send ─────────────────────────────────────────────────────────────
function ScheduleSend(p) {
  var th=p.th;
  var [date,setDate]=useState("");
  var [time,setTime]=useState("09:00");
  var [note,setNote]=useState("");
  var [saved,setSaved]=useState(false);

  // Min date = today
  var today=new Date().toISOString().slice(0,10);

  function doSchedule(){
    if(!date)return;
    var dt=new Date(date+"T"+time);
    // Store as reminder in localStorage-style in-memory
    var reminders=_db.reminders||[];
    reminders.push({
      id:randId(), type:"scheduled_send", vin:p.vin, vidId:p.vidId,
      custName:p.custName, scheduledFor:dt.toISOString(),
      note:note, createdAt:new Date().toISOString(),
      createdBy:p.userName,
    });
    _db.reminders=reminders;
    setSaved(true);
    setTimeout(function(){p.onScheduled(dt);},1200);
  }

  if(saved)return <BottomSheet th={th} title="✓ Send Scheduled" onClose={p.onClose}>
    <SuccessBox msg={"Reminder set for "+new Date(date+"T"+time).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})+" at "+time+". You'll see it in your scheduled sends."} th={th}/>
    <button onClick={p.onClose} style={pbtn(undefined,{marginTop:4})}>Done</button>
  </BottomSheet>;

  return <BottomSheet th={th} title="📅 Schedule This Send" subtitle="Set a date and time to be reminded to send this video." onClose={p.onClose}>
    <span style={lbl(th)}>Send Date</span>
    <input type="date" min={today} style={{...inp(th),marginBottom:8}} value={date} onChange={function(e){setDate(e.target.value);}}/>
    <span style={lbl(th)}>Send Time</span>
    <input type="time" style={{...inp(th),marginBottom:8}} value={time} onChange={function(e){setTime(e.target.value);}}/>
    <span style={lbl(th)}>Note (optional)</span>
    <input style={{...inp(th),marginBottom:14}} placeholder="e.g. Follow up after test drive" value={note} onChange={function(e){setNote(e.target.value);}}/>
    <div style={{display:"flex",gap:10}}>
      <button onClick={p.onClose} style={{flex:1,padding:12,borderRadius:9,border:"1px solid "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:14,fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
      <button onClick={doSchedule} disabled={!date} style={{flex:1,padding:12,borderRadius:9,border:"none",background:"#4da6ff",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Barlow',sans-serif",opacity:!date?0.5:1}}>Schedule</button>
    </div>
  </BottomSheet>;
}

// ─── Follow-up Reminder ────────────────────────────────────────────────────────
function FollowUpReminder(p) {
  var th=p.th;
  var options=[
    {label:"Tomorrow",days:1},{label:"In 2 days",days:2},{label:"In 3 days",days:3},
    {label:"In 1 week",days:7},{label:"In 2 weeks",days:14},
  ];
  var [custom,setCustom]=useState("");
  var [selected,setSelected]=useState(null);

  function doRemind(days){
    var reminderDate=new Date(Date.now()+days*86400000);
    var reminders=_db.reminders||[];
    reminders.push({
      id:randId(),type:"follow_up",vin:p.vin,custName:p.custName,
      remindAt:reminderDate.toISOString(),createdBy:p.userName,
      note:"Follow up with "+p.custName+" about "+p.vehicleName,
    });
    _db.reminders=reminders;
    p.onSet(reminderDate);
  }

  return <BottomSheet th={th} title="🔔 Follow-up Reminder" subtitle={"Set a reminder to follow up with "+(p.custName||"this customer")+"."} onClose={p.onClose}>
    <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
      {options.map(function(o){
        return <button key={o.days} onClick={function(){setSelected(o.days);doRemind(o.days);}} style={{padding:"11px 14px",background:selected===o.days?"#4da6ff18":th.inp,border:"1px solid "+(selected===o.days?"#4da6ff55":th.border),borderRadius:9,color:selected===o.days?"#4da6ff":th.text,cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif",fontWeight:selected===o.days?700:400,textAlign:"left"}}>
          📅 {o.label}
        </button>;
      })}
    </div>
    <span style={lbl(th)}>Custom (days from now)</span>
    <div style={{display:"flex",gap:8}}>
      <input type="number" min="1" max="90" style={{...inp(th),flex:1}} placeholder="e.g. 10" value={custom} onChange={function(e){setCustom(e.target.value);}}/>
      <button onClick={function(){if(custom)doRemind(Number(custom));}} disabled={!custom} style={{padding:"0 18px",borderRadius:9,border:"none",background:"#4da6ff",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Barlow',sans-serif",opacity:!custom?0.5:1}}>Set</button>
    </div>
  </BottomSheet>;
}

// ─── Customer Contact Book ─────────────────────────────────────────────────────
function ContactBook(p) {
  var th=p.th;
  var [contacts,setContacts]=useState(_db.contacts||[]);
  var [q,setQ]=useState("");
  var [adding,setAdding]=useState(false);
  var [newName,setNewName]=useState("");
  var [newContact,setNewContact]=useState("");

  function saveContact(){
    if(!newName.trim())return;
    var c={id:randId(),name:newName.trim(),contact:newContact.trim(),addedAt:new Date().toISOString()};
    var updated=contacts.concat([c]);
    setContacts(updated); _db.contacts=updated;
    setNewName(""); setNewContact(""); setAdding(false);
  }
  function removeContact(id){
    var updated=contacts.filter(function(c){return c.id!==id;});
    setContacts(updated); _db.contacts=updated;
  }

  var filtered=contacts.filter(function(c){
    return !q||c.name.toLowerCase().includes(q.toLowerCase())||c.contact.toLowerCase().includes(q.toLowerCase());
  });

  return <BottomSheet th={th} title="📇 Contact Book" subtitle="Saved customers — tap to use." onClose={p.onClose}>
    <input style={{...inp(th),marginBottom:10}} placeholder="Search saved contacts…" value={q} onChange={function(e){setQ(e.target.value);}}/>
    <div style={{maxHeight:280,overflowY:"auto",marginBottom:10}}>
      {filtered.length===0&&<div style={{textAlign:"center",padding:"20px 0",color:th.faint,fontSize:12}}>No contacts saved yet</div>}
      {filtered.map(function(c){
        return <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 4px",borderBottom:"1px solid "+th.border}}>
          <div style={{flex:1,cursor:"pointer"}} onClick={function(){p.onSelect(c);}}>
            <div style={{fontSize:13,fontWeight:600,color:th.text}}>{c.name}</div>
            {c.contact&&<div style={{fontSize:11,color:th.muted}}>{c.contact}</div>}
          </div>
          <button onClick={function(){removeContact(c.id);}} style={{background:"transparent",border:"none",color:th.muted,cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button>
        </div>;
      })}
    </div>
    {adding?(
      <div style={{background:th.inp,border:"1px solid "+th.border,borderRadius:9,padding:"12px 14px",marginBottom:10}}>
        <input style={{...inp(th),marginBottom:8}} placeholder="Customer name *" value={newName} onChange={function(e){setNewName(e.target.value);}}/>
        <input style={{...inp(th),marginBottom:8}} placeholder="Phone or email" value={newContact} onChange={function(e){setNewContact(e.target.value);}}/>
        <div style={{display:"flex",gap:8}}>
          <button onClick={function(){setAdding(false);setNewName("");setNewContact("");}} style={{flex:1,padding:10,borderRadius:8,border:"1px solid "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
          <button onClick={saveContact} style={{flex:1,padding:10,borderRadius:8,border:"none",background:"#00d97e",color:"#0a0c10",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>Save</button>
        </div>
      </div>
    ):(
      <button onClick={function(){setAdding(true);}} style={{width:"100%",padding:11,borderRadius:9,border:"1px dashed "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif"}}>+ Save New Contact</button>
    )}
  </BottomSheet>;
}

// ─── Sold Car Archive Browser ──────────────────────────────────────────────────
function SoldArchive(p) {
  var th=p.th; var videos=p.videos; var sentLog=p.sentLog; var inventory=p.inventory;
  var archived=p.archivedVins||{};

  var archivedEntries=Object.keys(archived).filter(function(vin){
    return (videos[vin]||[]).length>0;
  }).map(function(vin){
    var existing=inventory.find(function(v){return v.vin===vin;});
    return {vin:vin,veh:existing,vids:videos[vin]||[],log:sentLog[vin]||[]};
  });

  return <div style={rootStyle(th)}>
    <style>{getGS(th)}</style>
    <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
      <button onClick={p.onClose} style={backBtn(th)}>←</button>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:700,color:th.text}}>Sold / Archived</div>
        <div style={{fontSize:11,color:th.muted}}>{archivedEntries.length} vehicles with video history</div>
      </div>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:14}}>
      {archivedEntries.length===0?(
        <div style={{textAlign:"center",padding:"60px 20px",color:th.faint}}>
          <div style={{fontSize:44,marginBottom:10}}>📦</div>
          <div>No archived vehicles yet</div>
          <div style={{fontSize:11,marginTop:6}}>Sold cars with videos appear here automatically</div>
        </div>
      ):archivedEntries.map(function(entry){
        var realVids=entry.vids.filter(function(v){return !v.isDemo;});
        return <div key={entry.vin} style={{...card(th),borderRadius:12,padding:"12px 14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:th.text,marginBottom:2}}>
                {entry.veh?(entry.veh.year+" "+entry.veh.make+" "+entry.veh.model):"Unknown Vehicle"}
              </div>
              <div style={{fontSize:10,color:th.muted}}>
                {entry.veh?"#"+entry.veh.stock+" · ":""}VIN: {entry.vin.slice(-8)}
              </div>
            </div>
            <div style={{background:"#ffd70018",border:"1px solid #ffd70033",color:"#ffd700",padding:"3px 9px",borderRadius:5,fontSize:9,fontWeight:700}}>ARCHIVED</div>
          </div>
          <div style={{display:"flex",gap:10,fontSize:10,color:th.muted}}>
            <span>📹 {realVids.length} video{realVids.length!==1?"s":""}</span>
            <span>📤 {entry.log.length} sent</span>
            <span>💰 {entry.log.filter(function(s){return s.outcome==="Sold";}).length} sold</span>
          </div>
          {realVids.length>0&&<div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
            {realVids.map(function(v){
              return <VTypeBadge key={v.id} type={v.videoType} small={true}/>;
            })}
          </div>}
        </div>;
      })}
    </div>
  </div>;
}

// ─── VIN Barcode Scanner ───────────────────────────────────────────────────────
function VINScanner(p) {
  var th=p.th;
  var [scanning,setScanning]=useState(false);
  var [manual,setManual]=useState("");
  var [err,setErr]=useState("");
  var streamRef=useRef(null);
  var videoRef=useRef(null);

  function startScan(){
    setScanning(true); setErr("");
    navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}})
      .then(function(stream){
        streamRef.current=stream;
        if(videoRef.current){videoRef.current.srcObject=stream;videoRef.current.play();}
      }).catch(function(){setErr("Camera access denied.");setScanning(false);});
  }
  function stopScan(){
    if(streamRef.current)streamRef.current.getTracks().forEach(function(t){t.stop();});
    setScanning(false);
  }
  function handleManual(){
    var v=manual.trim().toUpperCase();
    if(v.length<5)return setErr("Enter at least 5 characters of the VIN or stock number.");
    stopScan(); p.onResult(v);
  }

  useEffect(function(){return stopScan;},[]);

  return <BottomSheet th={th} title="📷 Scan VIN" subtitle="Point camera at the door jamb sticker, or type manually." onClose={function(){stopScan();p.onClose();}}>
    {scanning?(
      <div style={{marginBottom:12}}>
        <div style={{position:"relative",paddingTop:"55%",borderRadius:9,overflow:"hidden",background:"#000",marginBottom:8}}>
          <video ref={videoRef} autoPlay muted playsInline style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
          <div style={{position:"absolute",inset:0,border:"2px solid #00d97e44",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:"70%",height:2,background:"#00d97e",opacity:0.8,animation:"pulse 1s ease infinite"}}/>
          </div>
          <div style={{position:"absolute",bottom:8,left:0,right:0,textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.7)"}}>Align the barcode with the green line</div>
        </div>
        <button onClick={stopScan} style={{width:"100%",padding:10,borderRadius:8,border:"1px solid "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif"}}>Stop Scanning</button>
        <div style={{fontSize:11,color:th.faint,textAlign:"center",marginTop:8}}>Auto-detection coming in a future update. Use manual entry below for now.</div>
      </div>
    ):(
      <button onClick={startScan} style={{width:"100%",padding:12,borderRadius:9,border:"1px solid "+th.border2,background:th.inp,color:th.text,cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <span style={{fontSize:18}}>📷</span> Start Camera Scan
      </button>
    )}
    <span style={lbl(th)}>Or type VIN / Stock Number manually</span>
    <div style={{display:"flex",gap:8}}>
      <input style={{...inp(th),flex:1,letterSpacing:1,textTransform:"uppercase"}} placeholder="e.g. 1GYS4BKL… or MC-N1001" value={manual} onChange={function(e){setManual(e.target.value.toUpperCase());setErr("");}} onKeyDown={function(e){if(e.key==="Enter")handleManual();}}/>
      <button onClick={handleManual} style={{padding:"0 18px",borderRadius:9,border:"none",background:"#e8313a",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>Search</button>
    </div>
    {err&&<ErrBox msg={err} th={th}/>}
  </BottomSheet>;
}

// ─── Notification Center ───────────────────────────────────────────────────────
function NotificationCenter(p) {
  var th=p.th;
  var [notes,setNotes]=useState(_db.notifications||[]);

  function dismiss(id){
    var updated=notes.map(function(n){return n.id===id?Object.assign({},n,{read:true}):n;});
    setNotes(updated); _db.notifications=updated;
  }
  function dismissAll(){
    var updated=notes.map(function(n){return Object.assign({},n,{read:true});});
    setNotes(updated); _db.notifications=updated;
  }

  var unread=notes.filter(function(n){return !n.read;});
  var byType={
    "flag":notes.filter(function(n){return n.type==="flag"&&!n.read;}),
    "request":notes.filter(function(n){return n.type==="request"&&!n.read;}),
    "coverage":notes.filter(function(n){return n.type==="coverage"&&!n.read;}),
    "inactivity":notes.filter(function(n){return n.type==="inactivity"&&!n.read;}),
    "new_video":notes.filter(function(n){return n.type==="new_video"&&!n.read;}),
  };

  var typeIcons={"flag":"🚩","request":"🎯","coverage":"📊","inactivity":"⏰","new_video":"📹","weekly":"📅","billing":"💰","new_staff":"👤"};
  var typeColors={"flag":"#e8313a","request":"#ff6b35","coverage":"#ffd700","inactivity":"#ffd700","new_video":"#00d97e","weekly":"#4da6ff","billing":"#ffd700","new_staff":"#c084fc"};

  return <div style={rootStyle(th)}>
    <style>{getGS(th)}</style>
    <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
      <button onClick={p.onClose} style={backBtn(th)}>←</button>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:700,color:th.text}}>Notifications</div>
        <div style={{fontSize:11,color:th.muted}}>{unread.length} unread</div>
      </div>
      {unread.length>0&&<button onClick={dismissAll} style={{background:"transparent",border:"none",color:th.muted,cursor:"pointer",fontSize:12,fontFamily:"'Barlow',sans-serif"}}>Mark all read</button>}
    </div>
    <div style={{flex:1,overflowY:"auto",padding:14}}>
      {notes.length===0?(
        <div style={{textAlign:"center",padding:"60px 20px",color:th.faint}}>
          <div style={{fontSize:44,marginBottom:10}}>🔔</div>
          <div>No notifications yet</div>
        </div>
      ):notes.slice().reverse().map(function(n){
        var ic=typeIcons[n.type]||"📣";
        var c=typeColors[n.type]||th.text;
        return <div key={n.id} style={{...card(th),borderRadius:10,padding:"11px 14px",marginBottom:8,opacity:n.read?0.5:1,border:"1px solid "+(n.read?th.border:c+"33")}}>
          <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:c+"18",border:"1px solid "+c+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{ic}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:th.text,marginBottom:2}}>{n.title}</div>
              <div style={{fontSize:11,color:th.muted,lineHeight:1.4,marginBottom:4}}>{n.body}</div>
              <div style={{fontSize:9,color:th.faint}}>{fmtDaysAgo(n.createdAt)}</div>
            </div>
            {!n.read&&<button onClick={function(){dismiss(n.id);}} style={{background:"transparent",border:"none",color:th.faint,cursor:"pointer",fontSize:16,lineHeight:1,flexShrink:0}}>✕</button>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}

function addNotification(title,body,type){
  if(!_db.notifications)_db.notifications=[];
  _db.notifications.push({id:randId(),title:title,body:body,type:type||"general",read:false,createdAt:new Date().toISOString()});
}

// ─── Notification Preferences ─────────────────────────────────────────────────
function NotificationPrefs(p) {
  var th=p.th;
  var defaultPrefs={
    flag:true,request:true,coverage:true,inactivity:true,
    new_video:true,weekly:true,billing:false,new_staff:true,
    new_device:true,session_expire:true,
  };
  var [prefs,setPrefs]=useState(Object.assign({},defaultPrefs,_db.notifPrefs||{}));

  function toggle(key){
    var n=Object.assign({},prefs);n[key]=!n[key];
    setPrefs(n);_db.notifPrefs=n;
  }

  var items=[
    {key:"flag",label:"Video flagged for reshoot",desc:"When QC flags one of your videos"},
    {key:"request",label:"Video shoot requested",desc:"When sales requests an Official video (All-Pro)"},
    {key:"new_video",label:"New Official video added",desc:"When a car you recently viewed gets an Official video"},
    {key:"inactivity",label:"Inactivity reminder",desc:"When you haven't sent a video in "+INACTIVITY_DAYS+" days"},
    {key:"coverage",label:"Low coverage alert",desc:"When store Official video coverage drops below 70%"},
    {key:"new_staff",label:"New staff joined",desc:"Manager: when a new account is created at your store"},
    {key:"weekly",label:"Weekly summary",desc:"Monday morning stats for the previous week"},
    {key:"billing",label:"Billing milestones",desc:"When monthly video count hits billing thresholds"},
    {key:"new_device",label:"New device login",desc:"Security: when your account is accessed from a new device"},
    {key:"session_expire",label:"Session expiry warning",desc:"5-minute warning before you get signed out"},
  ];

  return <BottomSheet th={th} title="🔔 Notification Preferences" subtitle="Choose which alerts you receive." onClose={p.onClose}>
    <div style={{maxHeight:400,overflowY:"auto"}}>
      {items.map(function(item){
        return <div key={item.key} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid "+th.border}}>
          <div style={{flex:1}}>
            <div style={{fontSize:13,color:th.text,fontWeight:600}}>{item.label}</div>
            <div style={{fontSize:11,color:th.muted}}>{item.desc}</div>
          </div>
          <div onClick={function(){toggle(item.key);}} style={{width:44,height:24,borderRadius:12,background:prefs[item.key]?"#00d97e":th.border,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
            <div style={{position:"absolute",top:3,left:prefs[item.key]?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/>
          </div>
        </div>;
      })}
    </div>
  </BottomSheet>;
}

// ─── Active Sessions ────────────────────────────────────────────────────────────
function ActiveSessions(p) {
  var th=p.th;
  var sessions=_db.activeSessions||[];
  var current=_db.currentSessionId||"current";

  function revokeSession(id){
    if(id===current)return;
    _db.activeSessions=sessions.filter(function(s){return s.id!==id;});
    p.onToast("Session revoked.");
  }

  return <BottomSheet th={th} title="📱 Active Sessions" subtitle="Devices currently signed in to your account." onClose={p.onClose}>
    {sessions.length===0?(
      <div style={{textAlign:"center",padding:"16px 0",color:th.faint}}>
        <div style={{fontSize:11}}>Only this device is active.</div>
      </div>
    ):sessions.map(function(s){
      var isCurrent=s.id===current;
      return <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid "+th.border}}>
        <div style={{fontSize:20}}>{s.device.includes("iPhone")||s.device.includes("iOS")?"📱":"💻"}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,color:th.text,fontWeight:600}}>{s.device||"Unknown Device"}</div>
          <div style={{fontSize:10,color:th.muted}}>{s.location||"Unknown location"} · {fmtDaysAgo(s.lastActive)}</div>
        </div>
        {isCurrent?(
          <span style={{fontSize:9,color:"#00d97e",fontWeight:700,background:"#00d97e18",border:"1px solid #00d97e33",padding:"2px 8px",borderRadius:4}}>This device</span>
        ):(
          <button onClick={function(){revokeSession(s.id);}} style={{background:"#e8313a18",border:"1px solid #e8313a33",color:"#e8313a",padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:"'Barlow',sans-serif",fontWeight:700}}>Sign Out</button>
        )}
      </div>;
    })}
    <div style={{marginTop:14}}>
      <button onClick={function(){_db.activeSessions=[];p.onToast("All other sessions signed out.");p.onClose();}} style={{width:"100%",padding:11,borderRadius:9,border:"1px solid #e8313a44",background:"#e8313a12",color:"#e8313a",cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif",fontWeight:700}}>Sign Out All Other Devices</button>
    </div>
  </BottomSheet>;
}

// ─── White Label Settings ──────────────────────────────────────────────────────
function WhiteLabelSettings(p) {
  var th=p.th;
  var [settings,setSettings]=useState(Object.assign({logoUrl:"",accentColor:"#e8313a",groupName:"Sonic Automotive",showPoweredBy:true},_db.whiteLabelSettings||{}));
  var [saved,setSaved]=useState(false);

  function save(){
    _db.whiteLabelSettings=settings;
    setSaved(true);
    setTimeout(function(){setSaved(false);},2000);
    p.onSave(settings);
  }

  var PRESET_COLORS=["#e8313a","#4da6ff","#00d97e","#ff6b35","#c084fc","#ffd700","#000000","#1a1a2e"];

  return <div style={rootStyle(th)}>
    <style>{getGS(th)}</style>
    <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
      <button onClick={p.onClose} style={backBtn(th)}>←</button>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:700,color:th.text}}>White Label Settings</div>
        <div style={{fontSize:11,color:th.muted}}>Customize branding for your dealer group</div>
      </div>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:16}}>
      <InfoBox msg={"These settings apply to your entire dealer group across all stores."} accent="#c084fc" th={th}/>

      {/* Group name */}
      <span style={lbl(th)}>Dealer Group Name</span>
      <input style={inp(th)} placeholder="e.g. Sonic Automotive" value={settings.groupName} onChange={function(e){setSettings(function(s){return Object.assign({},s,{groupName:e.target.value});});}}/>

      {/* Logo URL */}
      <span style={lbl(th)}>Logo Image URL (optional)</span>
      <input style={inp(th)} placeholder="https://your-logo.com/logo.png" value={settings.logoUrl} onChange={function(e){setSettings(function(s){return Object.assign({},s,{logoUrl:e.target.value});});}}/>
      <div style={{fontSize:10,color:th.faint,marginTop:4,marginBottom:12}}>Displays in place of the S badge on home screen and headers. Use a square transparent PNG for best results.</div>

      {/* Logo preview */}
      {settings.logoUrl&&<div style={{...card(th),borderRadius:10,padding:16,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <img src={settings.logoUrl} style={{maxWidth:80,maxHeight:80,objectFit:"contain"}} alt="Logo preview" onError={function(e){e.target.style.display="none";}}/>
      </div>}

      {/* Accent color */}
      <span style={lbl(th)}>Accent Color</span>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {PRESET_COLORS.map(function(c){
          var active=settings.accentColor===c;
          return <button key={c} onClick={function(){setSettings(function(s){return Object.assign({},s,{accentColor:c});});}} style={{width:36,height:36,borderRadius:"50%",background:c,border:active?"3px solid #fff":"3px solid transparent",cursor:"pointer",boxShadow:active?"0 0 0 2px "+c:"none"}}/>;
        })}
        <input type="color" value={settings.accentColor} onChange={function(e){setSettings(function(s){return Object.assign({},s,{accentColor:e.target.value});});}} style={{width:36,height:36,borderRadius:"50%",padding:2,border:"none",cursor:"pointer",background:"transparent"}} title="Custom color"/>
      </div>

      {/* Preview */}
      <div style={{background:settings.accentColor,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
        {settings.logoUrl?<img src={settings.logoUrl} style={{width:28,height:28,objectFit:"contain"}} alt=""/>:<div style={{width:28,height:28,borderRadius:6,background:"rgba(255,255,255,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff"}}>S</div>}
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:16,letterSpacing:3,color:"#fff"}}>VIDEO VAULT</div>
      </div>

      {/* Powered by */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderTop:"1px solid "+th.border}}>
        <div>
          <div style={{fontSize:13,color:th.text,fontWeight:600}}>Show "Powered by Video Vault"</div>
          <div style={{fontSize:11,color:th.muted}}>Footer attribution on all screens</div>
        </div>
        <div onClick={function(){setSettings(function(s){return Object.assign({},s,{showPoweredBy:!s.showPoweredBy});});}} style={{width:44,height:24,borderRadius:12,background:settings.showPoweredBy?"#00d97e":th.border,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
          <div style={{position:"absolute",top:3,left:settings.showPoweredBy?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
        </div>
      </div>
    </div>
    <div style={{padding:"14px 16px 28px",background:th.panel,borderTop:"1px solid "+th.border}}>
      {saved&&<SuccessBox msg="White label settings saved!" th={th}/>}
      <button onClick={save} style={pbtn(settings.accentColor)}>Save Branding</button>
    </div>
  </div>;
}


export {
  CameraScreen,
  InventoryScreen,
  NotificationCenter,
  ProfileScreen,
  ShotList,
  SoldArchive,
  VINScanner,
  VehicleDetail,
  WhiteLabelSettings,
  addNotification
};
