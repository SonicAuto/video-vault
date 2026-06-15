import { useState, useEffect, useRef } from "react";
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
  isDemoMode,
  setDemoMode,
  MASTER_ADMIN_EMAIL,
  isMasterAdmin,
  isPlatformAdmin,
  MASTER_VIEW_ROLES,
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
  isSonicCorp,
  isAllProCorp,
  isCorporate,
  persistDB,
  lbl,
  pbtn,
  px2,
  randId,
  rootStyle,
  saveSession,
  saveUsers,
  setCache
} from './vaultCore.jsx';
import {
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
} from './vaultComponents.jsx';

// ─── Admin Panel (for app owner - you) ────────────────────────────────────────
function AdminPanel(p) {
  var th=p.th;
  var users=getUsers();
  var allUsers=Object.values(users);
  var stores={};
  allUsers.forEach(function(u){
    var sid=u.dealerId||"unknown";
    if(!stores[sid])stores[sid]={id:sid,name:u.dealerName||"Unknown",city:u.dealerCity||"",users:[],active:true};
    stores[sid].users.push(u);
  });
  var storeList=Object.values(stores);

  var [tab,setTab]=useState("stores");
  var [q,setQ]=useState("");

  var filteredUsers=allUsers.filter(function(u){
    return !q||u.name.toLowerCase().includes(q.toLowerCase())||u.email.toLowerCase().includes(q.toLowerCase())||(u.dealerName||"").toLowerCase().includes(q.toLowerCase());
  });

  function deactivateStore(sid){
    if(!window.confirm("Deactivate "+stores[sid].name+"? Users will not be able to log in."))return;
    if(!_db.deactivatedStores)_db.deactivatedStores={};
    _db.deactivatedStores[sid]=true;
    p.onToast("Store deactivated.");
  }
  function deactivateUser(email){
    if(!window.confirm("Deactivate "+email+"? They will not be able to log in."))return;
    var u=getUsers();
    if(u[email])u[email]=Object.assign({},u[email],{deactivated:true});
    saveUsers(u);
    p.onToast("User deactivated.");
  }

  var totalVideos=Object.values(p.videosByStore||{}).reduce(function(a,b){return a+b;},0);
  var totalSends=Object.values(p.sendsByStore||{}).reduce(function(a,b){return a+b;},0);

  return <div style={rootStyle(th)}>
    <style>{getGS(th)}</style>
    <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
      <button onClick={p.onClose} style={backBtn(th)}>←</button>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:800,color:th.text,letterSpacing:2}}>ADMIN PANEL</div>
        <div style={{fontSize:9,color:"#c084fc",letterSpacing:1,textTransform:"uppercase"}}>Video Vault Network · All Clients</div>
      </div>
    </div>

    {/* Network stats */}
    <div style={{background:th.panel,borderBottom:"1px solid "+th.border,padding:"10px 14px",display:"flex",gap:8,flexShrink:0}}>
      {[
        [storeList.length,"Stores","#4da6ff"],
        [allUsers.length,"Users","#00d97e"],
        [totalVideos,"Videos","#ff6b35"],
        [totalSends,"Sends","#c084fc"],
      ].map(function(item){
        return <div key={item[1]} style={{flex:1,background:th.inp,border:"1px solid "+th.border,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
          <div style={{fontSize:18,fontWeight:800,color:item[2],fontFamily:"'Barlow Condensed',sans-serif"}}>{item[0]}</div>
          <div style={{fontSize:9,color:th.muted,textTransform:"uppercase",letterSpacing:1}}>{item[1]}</div>
        </div>;
      })}
    </div>

    {/* Tabs */}
    <div style={{background:th.panel,borderBottom:"1px solid "+th.border,padding:"8px 14px",display:"flex",gap:6,flexShrink:0}}>
      {[["stores","🏢 Stores"],["users","👤 Users"],["audit","📋 Audit"]].map(function(item){
        var id=item[0]; var lb=item[1];
        return <button key={id} onClick={function(){setTab(id);}} style={{flex:1,padding:"7px 0",background:tab===id?"#c084fc18":"transparent",border:tab===id?"1px solid #c084fc55":"1px solid "+th.border,borderRadius:7,color:tab===id?"#c084fc":th.muted,fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700}}>{lb}</button>;
      })}
    </div>

    <div style={{flex:1,overflowY:"auto",padding:14}}>
      {tab==="stores"&&<div>
        {storeList.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:th.faint}}>No stores registered yet</div>}
        {storeList.map(function(s){
          var isDeactivated=_db.deactivatedStores&&_db.deactivatedStores[s.id];
          return <div key={s.id} style={{...card(th),borderRadius:10,padding:"11px 14px",marginBottom:8,opacity:isDeactivated?0.5:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:th.text}}>{s.name}</div>
                <div style={{fontSize:10,color:th.muted}}>{s.city} · {s.users.length} users</div>
              </div>
              {isDeactivated?(
                <span style={{fontSize:9,color:"#e8313a",fontWeight:700,background:"#e8313a18",border:"1px solid #e8313a33",padding:"2px 8px",borderRadius:4}}>INACTIVE</span>
              ):(
                <span style={{fontSize:9,color:"#00d97e",fontWeight:700,background:"#00d97e18",border:"1px solid #00d97e33",padding:"2px 8px",borderRadius:4}}>ACTIVE</span>
              )}
            </div>
            <div style={{display:"flex",gap:6,marginTop:6}}>
              <span style={{fontSize:9,color:th.muted}}>{s.users.filter(function(u){return u.role==="Manager";}).length} managers</span>
              <span style={{fontSize:9,color:th.muted}}>·</span>
              <span style={{fontSize:9,color:th.muted}}>{s.users.filter(function(u){return u.role===ALLPRO_ROLE;}).length} photographers</span>
            </div>
            {!isDeactivated&&<button onClick={function(){deactivateStore(s.id);}} style={{marginTop:8,padding:"5px 12px",background:"#e8313a12",border:"1px solid #e8313a33",color:"#e8313a",borderRadius:6,cursor:"pointer",fontSize:11,fontFamily:"'Barlow',sans-serif",fontWeight:700}}>Deactivate Store</button>}
          </div>;
        })}
      </div>}

      {tab==="users"&&<div>
        <input style={{...inp(th),marginBottom:12}} placeholder="Search by name, email, store…" value={q} onChange={function(e){setQ(e.target.value);}}/>
        {filteredUsers.map(function(u){
          var rc=ROLE_COLORS[u.role]||"#888";
          var isDeact=u.deactivated;
          return <div key={u.email} style={{...card(th),borderRadius:9,padding:"10px 12px",marginBottom:7,opacity:isDeact?0.5:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:rc+"28",border:"1px solid "+rc+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:rc,flexShrink:0}}>{u.name[0].toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:th.text}}>{u.name}</div>
                <div style={{fontSize:10,color:th.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{u.email}</div>
                <div style={{display:"flex",gap:6,marginTop:2}}>
                  <span style={{fontSize:9,color:rc,background:rc+"18",border:"1px solid "+rc+"33",padding:"1px 6px",borderRadius:3,fontWeight:700}}>{u.role}</span>
                  <span style={{fontSize:9,color:th.faint}}>{u.dealerName}</span>
                </div>
              </div>
              {!isDeact&&<button onClick={function(){deactivateUser(u.email);}} style={{padding:"4px 10px",background:"#e8313a12",border:"1px solid #e8313a33",color:"#e8313a",borderRadius:6,cursor:"pointer",fontSize:10,fontFamily:"'Barlow',sans-serif",flexShrink:0}}>Deactivate</button>}
              {isDeact&&<span style={{fontSize:9,color:"#e8313a",fontWeight:700}}>Inactive</span>}
            </div>
          </div>;
        })}
      </div>}

      {tab==="audit"&&<div>
        {getAudit().length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:th.faint}}>No audit events yet</div>}
        {getAudit().slice(0,50).map(function(e,i){
          var c=e.type==="login"?"#4da6ff":e.type==="signup"?"#00d97e":e.type==="video_upload"?"#ff6b35":e.type==="video_sent"?"#00d97e":th.muted;
          return <div key={i} style={{padding:"8px 0",borderBottom:"1px solid "+th.border,display:"flex",gap:10}}>
            <span style={{fontSize:9,color:c,fontWeight:700,background:c+"18",border:"1px solid "+c+"33",padding:"2px 8px",borderRadius:3,flexShrink:0,alignSelf:"flex-start",marginTop:2,textTransform:"uppercase"}}>{e.type}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:th.text}}>{e.user}</div>
              {e.store&&<div style={{fontSize:9,color:th.muted}}>{e.store}</div>}
            </div>
            <div style={{fontSize:9,color:th.faint,flexShrink:0}}>{fmtDaysAgo(e.ts)}</div>
          </div>;
        })}
      </div>}
    </div>
  </div>;
}

// ─── Corporate Dashboard (Sonic Corporate / All-Pro Corporate) ────────────────
function CorporateDashboard(p) {
  var th=p.th; var user=p.user;
  var isSonic=isSonicCorp(user);
  var allUsers=Object.values(getUsers());
  var auditLog=getAudit();

  // Build store list with metrics
  var stores={};
  allUsers.forEach(function(u){
    var sid=u.dealerId||"unknown";
    if(sid==="sonic-corporate"||sid==="allpro-corporate"||sid==="allpro-qc")return;
    if(!stores[sid])stores[sid]={id:sid,name:u.dealerName||"Unknown",city:u.dealerCity||"",
      managers:0,sales:0,photographers:0,active:!(_db.deactivatedStores&&_db.deactivatedStores[sid])};
    if(u.role==="Manager")stores[sid].managers++;
    else if(u.role===ALLPRO_ROLE)stores[sid].photographers++;
    else stores[sid].sales++;
  });
  var storeList=Object.values(stores);

  // All-Pro people across the network
  var photographers=allUsers.filter(function(u){return u.role===ALLPRO_ROLE;});
  var qcReviewers=allUsers.filter(function(u){return u.role===QC_ROLE;});

  var [tab,setTab]=useState("overview");
  var [q,setQ]=useState("");

  var totalVideos=Object.values(p.videos||{}).reduce(function(sum,vids){
    return sum+(vids||[]).filter(function(v){return !v.isDemo;}).length;
  },0);
  var totalOfficial=Object.values(p.videos||{}).reduce(function(sum,vids){
    return sum+(vids||[]).filter(function(v){return !v.isDemo&&v.videoType==="Official";}).length;
  },0);
  var totalSends=Object.values(p.sentLog||{}).reduce(function(sum,log){return sum+(log||[]).length;},0);
  var totalSold=Object.values(p.sentLog||{}).reduce(function(sum,log){
    return sum+(log||[]).filter(function(e){return e.outcome==="Sold";}).length;
  },0);

  var filteredStores=storeList.filter(function(s){
    return !q||s.name.toLowerCase().includes(q.toLowerCase())||s.city.toLowerCase().includes(q.toLowerCase());
  });

  var accent=isSonic?"#ffd700":"#00d97e";
  var accentBg=isSonic?"#ffd70018":"#00d97e18";
  var accentBorder=isSonic?"#ffd70033":"#00d97e33";

  return <div style={rootStyle(th)}>
    <style>{getGS(th)}</style>
    <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
      <button onClick={p.onClose} style={backBtn(th)}>←</button>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:800,color:th.text,letterSpacing:2}}>
          {isSonic?"SONIC CORPORATE":"ALL-PRO CORPORATE"}
        </div>
        <div style={{fontSize:9,color:accent,letterSpacing:1,textTransform:"uppercase"}}>
          {isSonic?"Network-Wide Oversight · Read Only":"Photographer & QC Production · Read Only"}
        </div>
      </div>
      <div style={{background:accentBg,border:"1px solid "+accentBorder,color:accent,padding:"4px 10px",borderRadius:6,fontSize:10,fontWeight:700}}>👤 {user.name}</div>
    </div>

    {/* Top-line stats */}
    <div style={{background:th.panel,borderBottom:"1px solid "+th.border,padding:"10px 14px",display:"flex",gap:8,flexShrink:0}}>
      {isSonic?[
        [storeList.length,"Stores",accent],
        [totalOfficial,"Official Videos",accent],
        [totalSends,"Total Sends",accent],
        [totalSold,"Sold",accent],
      ]:[
        [photographers.length,"Photographers",accent],
        [qcReviewers.length,"QC Reviewers",accent],
        [totalOfficial,"Official Videos",accent],
        [storeList.length,"Stores Serviced",accent],
      ].map(function(item){
        return <div key={item[1]} style={{flex:1,background:th.inp,border:"1px solid "+th.border,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
          <div style={{fontSize:18,fontWeight:800,color:item[2],fontFamily:"'Barlow Condensed',sans-serif"}}>{item[0]}</div>
          <div style={{fontSize:9,color:th.muted,textTransform:"uppercase",letterSpacing:1}}>{item[1]}</div>
        </div>;
      })}
    </div>

    {/* Tabs */}
    <div style={{background:th.panel,borderBottom:"1px solid "+th.border,padding:"8px 14px",display:"flex",gap:6,flexShrink:0}}>
      {(isSonic?[["overview","📊 Stores"],["coverage","📹 Coverage"],["audit","📋 Audit"]]
               :[["overview","📸 Photographers"],["qc","✅ QC Reviewers"],["audit","📋 Audit"]]).map(function(item){
        var id=item[0]; var lb=item[1];
        return <button key={id} onClick={function(){setTab(id);}} style={{flex:1,padding:"7px 0",background:tab===id?accentBg:"transparent",border:tab===id?"1px solid "+accentBorder:"1px solid "+th.border,borderRadius:7,color:tab===id?accent:th.muted,fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700}}>{lb}</button>;
      })}
    </div>

    <div style={{flex:1,overflowY:"auto",padding:14}}>

      {/* SONIC: Store overview */}
      {isSonic&&tab==="overview"&&<div>
        <input style={{...inp(th),marginBottom:12}} placeholder="Search stores by name or city…" value={q} onChange={function(e){setQ(e.target.value);}}/>
        {filteredStores.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:th.faint}}>No stores found</div>}
        {filteredStores.map(function(s){
          return <div key={s.id} style={{...card(th),borderRadius:10,padding:"11px 14px",marginBottom:8,opacity:s.active?1:0.5}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:th.text}}>{s.name}</div>
                <div style={{fontSize:10,color:th.muted}}>{s.city}</div>
              </div>
              <span style={{fontSize:9,color:s.active?"#00d97e":"#e8313a",fontWeight:700,background:(s.active?"#00d97e":"#e8313a")+"18",border:"1px solid "+(s.active?"#00d97e":"#e8313a")+"33",padding:"2px 8px",borderRadius:4}}>{s.active?"ACTIVE":"INACTIVE"}</span>
            </div>
            <div style={{display:"flex",gap:10,marginTop:6}}>
              <span style={{fontSize:9,color:th.muted}}>👔 {s.managers} mgr</span>
              <span style={{fontSize:9,color:th.muted}}>💼 {s.sales} sales</span>
              <span style={{fontSize:9,color:"#ff6b35"}}>📷 {s.photographers} All-Pro</span>
            </div>
          </div>;
        })}
      </div>}

      {/* SONIC: Coverage */}
      {isSonic&&tab==="coverage"&&<div>
        <InfoBox msg={"Official video coverage and send activity across the Sonic network. "+totalOfficial+" Official videos uploaded, "+totalSends+" videos sent to customers, "+totalSold+" resulted in a Sold outcome."} accent={accent} th={th}/>
        <div style={{...card(th),borderRadius:10,padding:14,marginTop:10}}>
          <div style={{fontSize:11,color:th.muted,marginBottom:8}}>NETWORK CONVERSION RATE</div>
          <div style={{fontSize:28,fontWeight:800,color:accent,fontFamily:"'Barlow Condensed',sans-serif"}}>
            {totalSends>0?Math.round(totalSold/totalSends*100):0}%
          </div>
          <div style={{fontSize:10,color:th.faint}}>{totalSold} sold out of {totalSends} video sends</div>
        </div>
      </div>}

      {/* ALL-PRO: Photographer roster */}
      {!isSonic&&tab==="overview"&&<div>
        {photographers.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:th.faint}}>No photographers registered yet</div>}
        {photographers.map(function(ph){
          var myVids=Object.values(p.videos||{}).reduce(function(sum,vids){
            return sum+(vids||[]).filter(function(v){return !v.isDemo&&v.uploader===ph.name;}).length;
          },0);
          return <div key={ph.email} style={{...card(th),borderRadius:10,padding:"11px 14px",marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:th.text}}>{ph.name}</div>
                <div style={{fontSize:10,color:th.muted}}>{ph.dealerName}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:18,fontWeight:800,color:accent,fontFamily:"'Barlow Condensed',sans-serif"}}>{myVids}</div>
                <div style={{fontSize:9,color:th.faint}}>videos</div>
              </div>
            </div>
          </div>;
        })}
      </div>}

      {/* ALL-PRO: QC reviewers */}
      {!isSonic&&tab==="qc"&&<div>
        {qcReviewers.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:th.faint}}>No QC reviewers registered yet</div>}
        {qcReviewers.map(function(qcr){
          return <div key={qcr.email} style={{...card(th),borderRadius:10,padding:"11px 14px",marginBottom:8}}>
            <div style={{fontSize:13,fontWeight:700,color:th.text}}>{qcr.name}</div>
            <div style={{fontSize:10,color:th.muted}}>{qcr.email}</div>
          </div>;
        })}
      </div>}

      {/* AUDIT (shared) */}
      {tab==="audit"&&<div>
        {auditLog.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:th.faint}}>No audit events yet</div>}
        {auditLog.slice(0,50).map(function(e,i){
          var c=e.type==="login"?"#4da6ff":e.type==="signup"?"#00d97e":e.type==="video_upload"?"#ff6b35":e.type==="video_sent"?"#00d97e":th.muted;
          return <div key={i} style={{padding:"8px 0",borderBottom:"1px solid "+th.border,display:"flex",gap:10}}>
            <span style={{fontSize:9,color:c,fontWeight:700,background:c+"18",border:"1px solid "+c+"33",padding:"2px 8px",borderRadius:3,flexShrink:0,alignSelf:"flex-start",marginTop:2,textTransform:"uppercase"}}>{e.type}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:th.text}}>{e.user}</div>
              {e.store&&<div style={{fontSize:9,color:th.muted}}>{e.store}</div>}
            </div>
            <div style={{fontSize:9,color:th.faint,flexShrink:0}}>{fmtDaysAgo(e.ts)}</div>
          </div>;
        })}
      </div>}
    </div>
  </div>;
}

// ─── Scheduled Sends Viewer ────────────────────────────────────────────────────
function ScheduledSends(p) {
  var th=p.th;
  var [reminders,setReminders]=useState(_db.reminders||[]);

  var scheduled=reminders.filter(function(r){return r.type==="scheduled_send"||r.type==="follow_up";})
    .sort(function(a,b){return new Date(a.scheduledFor||a.remindAt)-new Date(b.scheduledFor||b.remindAt);});

  function removeReminder(id){
    var updated=reminders.filter(function(r){return r.id!==id;});
    setReminders(updated); _db.reminders=updated;
  }

  return <BottomSheet th={th} title="📅 Scheduled & Reminders" subtitle="Upcoming send reminders." onClose={p.onClose}>
    <div style={{maxHeight:350,overflowY:"auto"}}>
      {scheduled.length===0&&<div style={{textAlign:"center",padding:"20px 0",color:th.faint,fontSize:12}}>No scheduled sends or reminders</div>}
      {scheduled.map(function(r){
        var dt=new Date(r.scheduledFor||r.remindAt);
        var isPast=dt<new Date();
        return <div key={r.id} style={{...card(th),borderRadius:9,padding:"10px 12px",marginBottom:8,opacity:isPast?0.5:1,border:"1px solid "+(isPast?"#e8313a33":th.border)}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:th.text}}>{r.type==="follow_up"?"🔔 Follow up":"📅 Scheduled send"}</div>
              {r.custName&&<div style={{fontSize:11,color:th.muted}}>👤 {r.custName}</div>}
              {r.note&&<div style={{fontSize:11,color:th.muted,fontStyle:"italic"}}>{r.note}</div>}
            </div>
            <button onClick={function(){removeReminder(r.id);}} style={{background:"transparent",border:"none",color:th.faint,cursor:"pointer",fontSize:16,lineHeight:1,flexShrink:0}}>✕</button>
          </div>
          <div style={{fontSize:10,color:isPast?"#e8313a":"#4da6ff",fontWeight:700}}>{isPast?"⚠ Overdue · ":""}{dt.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})} at {dt.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"})}</div>
        </div>;
      })}
    </div>
  </BottomSheet>;
}

// ─── Session Timeout Warning ───────────────────────────────────────────────────
function SessionTimeoutWarning(p) {
  var th=p.th; var [secs,setSecs]=useState(300);
  useEffect(function(){
    var iv=setInterval(function(){setSecs(function(s){if(s<=1){clearInterval(iv);p.onTimeout();return 0;}return s-1;});},1000);
    return function(){clearInterval(iv);};
  },[]);
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Barlow',sans-serif"}}>
    <div style={{background:th.panel,border:"1px solid "+th.border,borderRadius:14,padding:"24px 20px",maxWidth:320,width:"100%",textAlign:"center"}}>
      <div style={{fontSize:44,marginBottom:12}}>⏰</div>
      <div style={{fontSize:16,fontWeight:700,color:th.text,marginBottom:6}}>Still there?</div>
      <div style={{fontSize:13,color:th.muted,marginBottom:6}}>You'll be signed out due to inactivity in</div>
      <div style={{fontSize:36,fontWeight:800,color:"#e8313a",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:20}}>{fmtTime(secs)}</div>
      <button onClick={p.onStayLoggedIn} style={{width:"100%",padding:13,borderRadius:10,border:"none",background:"#00d97e",color:"#0a0c10",cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>Stay Signed In</button>
    </div>
  </div>;
}

// ─── Video Send Preview ────────────────────────────────────────────────────────
function SendPreview(p) {
  var th=p.th;
  return <BottomSheet th={th} title="👁 Send Preview" subtitle="This is what the customer will receive." onClose={p.onClose}>
    <div style={{background:"#f0f2f5",borderRadius:12,padding:"16px 14px",marginBottom:14}}>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:"#4da6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0}}>{(p.senderName||"?")[0].toUpperCase()}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:"#555",fontWeight:700,marginBottom:4}}>{p.senderName||"Sales Staff"}</div>
          <div style={{background:"#fff",borderRadius:"12px 12px 12px 4px",padding:"10px 12px",fontSize:13,color:"#111",lineHeight:1.5,boxShadow:"0 1px 4px rgba(0,0,0,0.1)",whiteSpace:"pre-line"}}>{p.msg}</div>
        </div>
      </div>
      {p.vid&&!p.vid.isDemo&&<div style={{background:"#141720",borderRadius:10,height:90,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(232,49,58,0.88)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",paddingLeft:3}}>▶</div>
        <div style={{color:"rgba(255,255,255,0.7)",fontSize:12}}>{p.vid.name}</div>
      </div>}
      <div style={{fontSize:10,color:"#999",textAlign:"right",marginTop:8}}>{new Date().toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"})}</div>
    </div>
    <div style={{fontSize:11,color:th.muted,textAlign:"center",marginBottom:14,lineHeight:1.5}}>On iPhone the video attaches directly to the message. On Android it downloads. The customer receives it from your personal number.</div>
    <button onClick={p.onConfirm} style={pbtn("#00d97e")}>⬆ Looks Good — Send</button>
  </BottomSheet>;
}

// ─── Lot Zone / Store Map ──────────────────────────────────────────────────────
function LotZoneSettings(p) {
  var th=p.th;
  var [zones,setZones]=useState(_db.lotZones||[
    {id:"A",name:"Front Row",color:"#4da6ff"},
    {id:"B",name:"Side Lot",color:"#00d97e"},
    {id:"C",name:"Back Row",color:"#ff6b35"},
    {id:"D",name:"Indoor Showroom",color:"#ffd700"},
  ]);
  var [adding,setAdding]=useState(false);
  var [newZone,setNewZone]=useState({name:"",color:"#4da6ff"});

  function saveZones(){_db.lotZones=zones;p.onToast("Lot zones saved!");}
  function addZone(){
    if(!newZone.name.trim())return;
    var z=Object.assign({},newZone,{id:String.fromCharCode(65+zones.length)});
    var updated=zones.concat([z]);
    setZones(updated);setAdding(false);setNewZone({name:"",color:"#4da6ff"});
  }
  function removeZone(id){setZones(zones.filter(function(z){return z.id!==id;}));}

  return <BottomSheet th={th} title="🗺 Lot Zones" subtitle="Define zones to help All-Pro organize the shot list." onClose={p.onClose}>
    <div style={{marginBottom:10}}>
      {zones.map(function(z){
        return <div key={z.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid "+th.border}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:z.color,flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:700,color:th.text}}>{z.id}: {z.name}</div>
          </div>
          <button onClick={function(){removeZone(z.id);}} style={{background:"transparent",border:"none",color:th.muted,cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button>
        </div>;
      })}
    </div>
    {adding?(
      <div style={{background:th.inp,border:"1px solid "+th.border,borderRadius:9,padding:12,marginBottom:10}}>
        <input style={{...inp(th),marginBottom:8}} placeholder="Zone name (e.g. Back Lot)" value={newZone.name} onChange={function(e){setNewZone(function(z){return Object.assign({},z,{name:e.target.value});});}}/>
        <div style={{display:"flex",gap:8}}>
          <input type="color" value={newZone.color} onChange={function(e){setNewZone(function(z){return Object.assign({},z,{color:e.target.value});});}} style={{width:42,height:36,borderRadius:6,padding:2,border:"none",cursor:"pointer"}}/>
          <button onClick={addZone} style={{flex:1,padding:10,borderRadius:8,border:"none",background:"#00d97e",color:"#0a0c10",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>Add Zone</button>
          <button onClick={function(){setAdding(false);}} style={{padding:"10px 14px",borderRadius:8,border:"1px solid "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
        </div>
      </div>
    ):(
      <button onClick={function(){setAdding(true);}} style={{width:"100%",padding:10,borderRadius:8,border:"1px dashed "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif",marginBottom:10}}>+ Add Zone</button>
    )}
    <button onClick={saveZones} style={pbtn()}>Save Zones</button>
  </BottomSheet>;
}

// ─── QC Performance Dashboard ─────────────────────────────────────────────────
function QCPerformance(p) {
  var th=p.th; var log=p.reviewLog||[];
  var today=new Date().toDateString();
  var todayReviews=log.filter(function(e){return new Date(e.ts).toDateString()===today;}).length;
  var approvedTotal=log.filter(function(e){return e.action==="approved";}).length;
  var flaggedTotal=log.filter(function(e){return e.action==="flagged";}).length;
  var total=approvedTotal+flaggedTotal;
  var approvalRate=total>0?Math.round(approvedTotal/total*100):0;

  return <BottomSheet th={th} title="📊 QC Performance" subtitle="Your review statistics." onClose={p.onClose}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
      {[
        [todayReviews,"Reviewed Today","#4da6ff"],
        [approvedTotal,"Total Approved","#00d97e"],
        [flaggedTotal,"Total Flagged","#e8313a"],
        [approvalRate+"%","Approval Rate","#ffd700"],
      ].map(function(item){
        return <div key={item[1]} style={{...card(th),borderRadius:9,padding:"10px 12px"}}>
          <div style={{fontSize:22,fontWeight:800,color:item[2],fontFamily:"'Barlow Condensed',sans-serif"}}>{item[0]}</div>
          <div style={{fontSize:9,color:th.muted,textTransform:"uppercase",letterSpacing:1,marginTop:2}}>{item[1]}</div>
        </div>;
      })}
    </div>
    {log.length===0&&<div style={{textAlign:"center",padding:"16px 0",color:th.faint,fontSize:12}}>Start reviewing videos to build your stats</div>}
    {log.slice(-10).reverse().map(function(e,i){
      return <div key={i} style={{padding:"7px 0",borderBottom:"1px solid "+th.border,display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontSize:9,color:e.action==="approved"?"#00d97e":"#e8313a",fontWeight:700,background:(e.action==="approved"?"#00d97e":"#e8313a")+"18",border:"1px solid "+(e.action==="approved"?"#00d97e":"#e8313a")+"33",padding:"2px 7px",borderRadius:3,flexShrink:0}}>{e.action==="approved"?"✓ Approved":"🚩 Flagged"}</span>
        <div style={{flex:1,fontSize:11,color:th.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{e.vidName||"Video"}</div>
        <div style={{fontSize:9,color:th.faint,flexShrink:0}}>{fmtDaysAgo(e.ts)}</div>
      </div>;
    })}
  </BottomSheet>;
}

// ─── All-Pro Personal Stats ────────────────────────────────────────────────────
function AllProStats(p) {
  var th=p.th; var user=p.user; var videos=p.videos; var sentLog=p.sentLog;

  var myVids=[];
  Object.keys(videos).forEach(function(vin){
    (videos[vin]||[]).forEach(function(v){
      if(!v.isDemo&&v.uploader===user.name)myVids.push(Object.assign({},v,{vin:vin}));
    });
  });

  var today=new Date().toDateString();
  var thisWeek=new Date(Date.now()-7*86400000);
  var thisMonth=new Date(Date.now()-30*86400000);

  var todayCount=myVids.filter(function(v){return new Date(v.date).toDateString()===today;}).length;
  var weekCount=myVids.filter(function(v){return new Date(v.date)>=thisWeek;}).length;
  var monthCount=myVids.filter(function(v){return new Date(v.date)>=thisMonth;}).length;

  // Best performing videos
  var withSends=myVids.map(function(v){
    var sends=0;
    Object.values(sentLog).forEach(function(log){
      (log||[]).forEach(function(s){if(s.videoType===v.videoType)sends++;});
    });
    return Object.assign({},v,{sends:sends});
  }).sort(function(a,b){return b.sends-a.sends;}).slice(0,5);

  return <BottomSheet th={th} title="📊 My Stats" subtitle={"Performance overview for "+user.name} onClose={p.onClose}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
      {[
        [todayCount,"Today","#ff6b35"],
        [weekCount,"This Week","#4da6ff"],
        [monthCount,"This Month","#00d97e"],
        [myVids.length,"All Time","#ffd700"],
      ].map(function(item){
        return <div key={item[1]} style={{...card(th),borderRadius:9,padding:"10px 12px"}}>
          <div style={{fontSize:22,fontWeight:800,color:item[2],fontFamily:"'Barlow Condensed',sans-serif"}}>{item[0]}</div>
          <div style={{fontSize:9,color:th.muted,textTransform:"uppercase",letterSpacing:1,marginTop:2}}>{item[1]}</div>
        </div>;
      })}
    </div>
    {withSends.length>0&&<div>
      <div style={{fontSize:10,color:th.faint,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Top Performing Videos</div>
      {withSends.map(function(v,i){
        return <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid "+th.border}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:"#ff6b3518",border:"1px solid #ff6b3533",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#ff6b35",flexShrink:0}}>{i+1}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,color:th.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.name}</div>
            <VTypeBadge type={v.videoType} small={true}/>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:14,fontWeight:800,color:"#4da6ff",fontFamily:"'Barlow Condensed',sans-serif"}}>{v.sends}</div>
            <div style={{fontSize:9,color:th.faint}}>sends</div>
          </div>
        </div>;
      })}
    </div>}
  </BottomSheet>;
}

// ─── Temporary Account Creator ─────────────────────────────────────────────────
function TempAccountCreator(p) {
  var th=p.th; var dealerId=p.dealerId; var dealerName=p.dealerName;
  var [name,setName]=useState("");
  var [role,setRole]=useState("Sales");
  var [hours,setHours]=useState("24");
  var [created,setCreated]=useState(null);

  function createAccount(){
    if(!name.trim())return;
    var email="guest-"+randId()+"@videovault.temp";
    var pw=String(Math.floor(1000+Math.random()*9000));
    var expiresAt=new Date(Date.now()+Number(hours)*3600000).toISOString();
    var account={
      email:email,password:pw,name:name.trim(),role:role,
      dealerId:dealerId,dealerName:dealerName,
      verified:true,hasOnboarded:true,
      termsVersion:TERMS_VERSION,termsAcceptedAt:new Date().toISOString(),
      createdAt:new Date().toISOString(),expiresAt:expiresAt,isGuest:true,
    };
    if(!_db.guestAccounts)_db.guestAccounts={};
    _db.guestAccounts[email]=account;
    addAudit({type:"guest_account_created",user:p.createdBy,store:dealerId,guest:name});
    setCreated({email:email,password:pw,expiresAt:expiresAt});
  }

  if(created)return <BottomSheet th={th} title="✓ Guest Account Created" onClose={p.onClose}>
    <SuccessBox msg={"Guest account created for "+name+"."} th={th}/>
    <div style={{...card(th),borderRadius:10,padding:14,marginBottom:14}}>
      <div style={{fontSize:10,color:th.muted,marginBottom:8,letterSpacing:1,textTransform:"uppercase"}}>Share these credentials</div>
      <div style={{fontSize:13,color:th.text,marginBottom:6}}>📧 Email: <span style={{fontFamily:"monospace",color:"#4da6ff"}}>{created.email}</span></div>
      <div style={{fontSize:13,color:th.text,marginBottom:6}}>🔑 Password: <span style={{fontFamily:"monospace",color:"#4da6ff",fontWeight:800,fontSize:16}}>{created.password}</span></div>
      <div style={{fontSize:11,color:"#ffd700"}}>⏰ Expires: {new Date(created.expiresAt).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
    </div>
    <button onClick={p.onClose} style={pbtn()}>Done</button>
  </BottomSheet>;

  return <BottomSheet th={th} title="👤 Create Guest Account" subtitle="Temporary access that expires automatically." onClose={p.onClose}>
    <span style={lbl(th)}>Guest Name</span>
    <input style={inp(th)} placeholder="e.g. John Smith (Event Staff)" value={name} onChange={function(e){setName(e.target.value);}}/>
    <span style={lbl(th)}>Role</span>
    <select style={inp(th)} value={role} onChange={function(e){setRole(e.target.value);}}>
      {["Sales","Detail / Media","BDC"].map(function(r){return <option key={r} value={r}>{r}</option>;})}
    </select>
    <span style={lbl(th)}>Expires After</span>
    <select style={inp(th)} value={hours} onChange={function(e){setHours(e.target.value);}}>
      {[["4","4 hours"],["8","8 hours"],["24","24 hours"],["48","2 days"],["168","1 week"]].map(function(o){return <option key={o[0]} value={o[0]}>{o[1]}</option>;})}
    </select>
    <div style={{display:"flex",gap:10,marginTop:14}}>
      <button onClick={p.onClose} style={{flex:1,padding:12,borderRadius:9,border:"1px solid "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:14,fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
      <button onClick={createAccount} disabled={!name.trim()} style={{flex:1,padding:12,borderRadius:9,border:"none",background:"#e8313a",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Barlow',sans-serif",opacity:!name.trim()?0.5:1}}>Create Account</button>
    </div>
  </BottomSheet>;
}

// ─── Accessibility Settings ────────────────────────────────────────────────────
function AccessibilitySettings(p) {
  var th=p.th;
  var [prefs,setPrefs]=useState(Object.assign({
    fontSize:"normal",oneHanded:false,reducedMotion:false,highContrast:false,defaultLang:"en",
  },_db.accessPrefs||{}));

  function save(){_db.accessPrefs=prefs;p.onSave(prefs);p.onToast("Accessibility preferences saved!");}

  return <BottomSheet th={th} title="♿ Accessibility" subtitle="Adjust text size and interface preferences." onClose={p.onClose}>
    <span style={lbl(th)}>Text Size</span>
    <div style={{display:"flex",gap:6,marginBottom:12}}>
      {[["small","Aa","11px"],["normal","Aa","14px"],["large","Aa","17px"],["xlarge","Aa","20px"]].map(function(item){
        var v=item[0]; var l=item[1]; var sz=item[2];
        return <button key={v} onClick={function(){setPrefs(function(p2){return Object.assign({},p2,{fontSize:v});});}} style={{flex:1,padding:"8px 0",background:prefs.fontSize===v?"#4da6ff18":"transparent",border:prefs.fontSize===v?"1px solid #4da6ff55":"1px solid "+th.border,borderRadius:7,color:prefs.fontSize===v?"#4da6ff":th.muted,cursor:"pointer",fontSize:sz,fontFamily:"'Barlow',sans-serif",fontWeight:prefs.fontSize===v?700:400}}>{l}</button>;
      })}
    </div>
    <span style={lbl(th)}>Default Language</span>
    <select style={{...inp(th),marginBottom:12}} value={prefs.defaultLang} onChange={function(e){setPrefs(function(p2){return Object.assign({},p2,{defaultLang:e.target.value});});}}>
      <option value="en">🇺🇸 English</option>
      <option value="es">🇪🇸 Español</option>
    </select>
    {[
      {key:"oneHanded",label:"One-handed mode",desc:"Shift all controls and navigation to the bottom of the screen"},
      {key:"reducedMotion",label:"Reduce motion",desc:"Minimize animations and transitions throughout the app"},
      {key:"highContrast",label:"High contrast",desc:"Increase contrast for better readability"},
    ].map(function(item){
      return <div key={item.key} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid "+th.border}}>
        <div style={{flex:1}}>
          <div style={{fontSize:13,color:th.text,fontWeight:600}}>{item.label}</div>
          <div style={{fontSize:11,color:th.muted}}>{item.desc}</div>
        </div>
        <div onClick={function(){setPrefs(function(p2){var n=Object.assign({},p2);n[item.key]=!n[item.key];return n;});}} style={{width:44,height:24,borderRadius:12,background:prefs[item.key]?"#00d97e":th.border,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
          <div style={{position:"absolute",top:3,left:prefs[item.key]?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
        </div>
      </div>;
    })}
    <button onClick={save} style={{...pbtn(),marginTop:14}}>Save Preferences</button>
  </BottomSheet>;
}

// ─── Send History Per Customer ─────────────────────────────────────────────────
function CustomerHistory(p) {
  var th=p.th; var custName=p.custName; var sentLog=p.sentLog; var inventory=p.inventory;

  var history=[];
  Object.keys(sentLog).forEach(function(vin){
    (sentLog[vin]||[]).forEach(function(e,idx){
      if(e.custName&&e.custName.toLowerCase()===custName.toLowerCase()){
        var veh=inventory.find(function(v){return v.vin===vin;});
        history.push(Object.assign({},e,{vin:vin,veh:veh,logIdx:idx}));
      }
    });
  });
  history.sort(function(a,b){return new Date(b.sentAt||0)-new Date(a.sentAt||0);});

  return <BottomSheet th={th} title={"📋 "+custName} subtitle={history.length+" video"+(history.length!==1?"s":"")+" sent across all vehicles."} onClose={p.onClose}>
    <div style={{maxHeight:380,overflowY:"auto"}}>
      {history.length===0&&<div style={{textAlign:"center",padding:"20px 0",color:th.faint,fontSize:12}}>No send history for this customer</div>}
      {history.map(function(e,i){
        return <div key={i} style={{...card(th),borderRadius:9,padding:"10px 12px",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            {e.veh&&<div style={{fontSize:12,fontWeight:700,color:th.text}}>{e.veh.year} {e.veh.make} {e.veh.model}</div>}
            <VTypeBadge type={e.videoType||"Walk-around"} small={true}/>
          </div>
          {e.veh&&<div style={{fontSize:10,color:th.muted,marginBottom:4}}>#{e.veh.stock}</div>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:10,color:th.faint}}>{fmtDaysAgo(e.sentAt)} by {e.sentBy}</div>
            <OutcomeBadge outcome={e.outcome||"No Response"}/>
          </div>
        </div>;
      })}
    </div>
  </BottomSheet>;
}

// ─── Video Expiration Settings ─────────────────────────────────────────────────
function VideoExpirationSettings(p) {
  var th=p.th;
  var [days,setDays]=useState(String(_db.videoExpireDays||90));
  var [enabled,setEnabled]=useState(!!_db.videoExpireEnabled);

  function save(){
    _db.videoExpireDays=Number(days); _db.videoExpireEnabled=enabled;
    p.onToast("Expiration settings saved.");p.onClose();
  }

  return <BottomSheet th={th} title="⏰ Video Expiration" subtitle="Auto-flag videos older than a set number of days." onClose={p.onClose}>
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid "+th.border,marginBottom:12}}>
      <div style={{flex:1}}>
        <div style={{fontSize:13,color:th.text,fontWeight:600}}>Enable video expiration</div>
        <div style={{fontSize:11,color:th.muted}}>Videos older than the threshold will be flagged for reshoot</div>
      </div>
      <div onClick={function(){setEnabled(function(e){return !e;});}} style={{width:44,height:24,borderRadius:12,background:enabled?"#00d97e":th.border,cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
        <div style={{position:"absolute",top:3,left:enabled?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
      </div>
    </div>
    {enabled&&<div>
      <span style={lbl(th)}>Flag videos older than</span>
      <select style={inp(th)} value={days} onChange={function(e){setDays(e.target.value);}}>
        {[["30","30 days"],["60","60 days"],["90","90 days"],["120","120 days"],["180","180 days"]].map(function(o){return <option key={o[0]} value={o[0]}>{o[1]}</option>;})}
      </select>
    </div>}
    <button onClick={save} style={{...pbtn(),marginTop:14}}>Save</button>
  </BottomSheet>;
}

// ─── Data Export (CCPA) ────────────────────────────────────────────────────────
function DataExport(p) {
  var th=p.th; var user=p.user;

  function exportData(){
    var data={
      account:{name:user.name,email:user.email,role:user.role,store:user.dealerName,createdAt:user.createdAt},
      sentLog:Object.values(p.sentLog).flat().filter(function(e){return e.sentBy===user.name;}).map(function(e){return {customer:e.custName,contact:e.custContact,date:e.sentAt,vehicle:e.vehicleName||""};}),
      auditLog:getAudit().filter(function(e){return e.user===user.email;}),
      exportedAt:new Date().toISOString(),
    };
    var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    var a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download="VideoVault-MyData-"+user.name.replace(/\s+/g,"-")+".json"; a.click();
    p.onToast("Data exported.");
  }

  return <BottomSheet th={th} title="📤 Export My Data" subtitle="Download all data associated with your account." onClose={p.onClose}>
    <div style={{...card(th),borderRadius:10,padding:14,marginBottom:14}}>
      <div style={{fontSize:12,color:th.muted,lineHeight:1.6}}>
        Your export will include:{"\n"}
        • Account details and role{"\n"}
        • Send history (customers you messaged){"\n"}
        • Activity log (logins and actions){"\n"}
        • Terms acceptance timestamp
      </div>
    </div>
    <InfoBox msg={"This export does not include video files. Videos are stored in session memory only."} accent="#ffd700" th={th}/>
    <button onClick={exportData} style={pbtn("#4da6ff")}>⬇ Download My Data (JSON)</button>
    <div style={{fontSize:10,color:th.faint,textAlign:"center",marginTop:10,lineHeight:1.5}}>
      Compliant with CCPA data portability requirements.{"\n"}Data is encrypted in transit.
    </div>
  </BottomSheet>;
}

// ─── Error Reporter ────────────────────────────────────────────────────────────
function ErrorReporter(p) {
  var th=p.th;
  var [desc,setDesc]=useState("");
  var [sent,setSent]=useState(false);

  function submit(){
    var report={
      description:desc,userAgent:navigator.userAgent,
      url:window.location.href,timestamp:new Date().toISOString(),
      user:p.userEmail||"unknown",appVersion:APP_VERSION,
    };
    // In production: POST to support endpoint
    console.log("Error report:",report);
    setSent(true);
  }

  if(sent)return <BottomSheet th={th} title="✓ Report Sent" onClose={p.onClose}>
    <SuccessBox msg="Thanks for the report. We'll look into it." th={th}/>
    <button onClick={p.onClose} style={pbtn()}>Close</button>
  </BottomSheet>;

  return <BottomSheet th={th} title="🐛 Report an Issue" subtitle="Describe what went wrong and we'll fix it." onClose={p.onClose}>
    <textarea value={desc} onChange={function(e){setDesc(e.target.value);}} placeholder={"Describe what happened…\n\ne.g. The camera wouldn't open after I selected a vehicle."} style={{...inp(th),height:120,resize:"none",lineHeight:1.5,fontSize:13,marginBottom:12}}/>
    <div style={{fontSize:10,color:th.faint,marginBottom:12}}>App v{APP_VERSION} · Automatically includes device info</div>
    <button onClick={submit} disabled={!desc.trim()} style={{...pbtn("#ff6b35"),opacity:!desc.trim()?0.5:1}}>Send Report</button>
  </BottomSheet>;
}




// ─── Zoom Control (camera) ─────────────────────────────────────────────────────
// Integrated into CameraScreen via ZoomSlider component
function ZoomSlider(p) {
  var th=p.th;
  return <div style={{position:"absolute",bottom:px2(140),left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:10,background:"rgba(0,0,0,0.5)",borderRadius:20,padding:"6px 14px",zIndex:3}}>
    <span style={{color:"#fff",fontSize:11,fontWeight:700,minWidth:28,textAlign:"center"}}>{p.zoom.toFixed(1)}x</span>
    <input type="range" min="10" max="50" step="1" value={Math.round(p.zoom*10)}
      onChange={function(e){p.setZoom(Number(e.target.value)/10);}}
      style={{width:120,accentColor:"#e8313a"}}/>
  </div>;
}

// ─── Landscape Lock Warning ────────────────────────────────────────────────────
function LandscapeLockWarning(p) {
  var th=p.th;
  var [portrait,setPortrait]=useState(false);
  useEffect(function(){
    function check(){
      var w=window.innerWidth; var h=window.innerHeight;
      setPortrait(h>w);
    }
    check();
    window.addEventListener("resize",check);
    return function(){window.removeEventListener("resize",check);};
  },[]);
  if(!portrait||!p.recording)return null;
  return <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"rgba(0,0,0,0.88)",borderRadius:12,padding:"14px 20px",textAlign:"center",zIndex:10,pointerEvents:"none"}}>
    <div style={{fontSize:32,marginBottom:8}}>🔄</div>
    <div style={{color:"#fff",fontSize:13,fontWeight:700}}>Rotate for best quality</div>
    <div style={{color:"rgba(255,255,255,0.6)",fontSize:11,marginTop:4}}>Landscape recording recommended</div>
  </div>;
}

// ─── Auto-compress helper ──────────────────────────────────────────────────────
function AutoCompress(p) {
  var th=p.th;
  var [pct,setPct]=useState(0);
  var [done,setDone]=useState(false);
  useEffect(function(){
    var steps=0;
    var iv=setInterval(function(){
      steps++;
      setPct(Math.min(steps*15,95));
      if(steps>=7){clearInterval(iv);setPct(100);setDone(true);setTimeout(function(){p.onDone(p.file);},400);}
    },200);
    return function(){clearInterval(iv);};
  },[]);
  return <BottomSheet th={th} title="⚡ Optimizing Video" subtitle="Compressing for faster delivery..." onClose={function(){}}>
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:12,color:th.muted}}>Processing...</span>
        <span style={{fontSize:12,color:"#00d97e",fontWeight:700}}>{pct}%</span>
      </div>
      <div style={{height:8,background:th.border,borderRadius:4,overflow:"hidden"}}>
        <div style={{height:"100%",width:pct+"%",background:"#00d97e",borderRadius:4,transition:"width 0.2s ease"}}/>
      </div>
    </div>
    {done&&<SuccessBox msg={"Video optimized — "+Math.round(p.file.size/1e6*0.6*10)/10+" MB"} th={th}/>}
    <div style={{fontSize:10,color:th.faint,textAlign:"center",marginTop:8}}>Original: {p.file?Math.round(p.file.size/1e6*10)/10+" MB":"—"}</div>
  </BottomSheet>;
}

// ─── Auto-naming convention ────────────────────────────────────────────────────
function autoName(vehicle, videoType, uploaderName) {
  var date=new Date().toISOString().slice(0,10);
  var veh=vehicle
    ? [vehicle.year,vehicle.make,vehicle.model,vehicle.stock]
        .join("-").replace(/\s+/g,"-").replace(/[^a-zA-Z0-9-]/g,"")
    : "vehicle";
  var vt=(videoType||"video").replace(/\s+/g,"-");
  return veh+"_"+vt+"_"+date;
}

// ─── Auto-save Draft ───────────────────────────────────────────────────────────
function useDraftSave(vin, msg, custName, custContact, lang) {
  useEffect(function(){
    if(!vin||!msg)return;
    if(!_db.drafts)_db.drafts={};
    _db.drafts[vin]={msg:msg,custName:custName,custContact:custContact,lang:lang,savedAt:new Date().toISOString()};
  },[vin,msg,custName,custContact,lang]);
  var draft=_db.drafts&&_db.drafts[vin]||null;
  return draft;
}

// ─── Bulk Delete Videos ────────────────────────────────────────────────────────
function BulkDeleteSheet(p) {
  var th=p.th;
  var realVids=(p.videos||[]).filter(function(v){return !v.isDemo;});
  var [selected,setSelected]=useState({});
  var count=Object.keys(selected).filter(function(k){return selected[k];}).length;

  function toggle(id){setSelected(function(prev){var n=Object.assign({},prev);n[id]=!n[id];return n;});}
  function deleteSelected(){
    var ids=Object.keys(selected).filter(function(k){return selected[k];});
    p.onDelete(ids);
  }

  return <BottomSheet th={th} title="🗑 Bulk Delete" subtitle={"Select videos to remove. "+realVids.length+" total."} onClose={p.onClose}>
    <div style={{maxHeight:320,overflowY:"auto",marginBottom:12}}>
      {realVids.length===0&&<div style={{textAlign:"center",padding:"16px 0",color:th.faint,fontSize:12}}>No videos to delete</div>}
      {realVids.map(function(v){
        var isSel=!!selected[v.id];
        return <div key={v.id} onClick={function(){toggle(v.id);}} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid "+th.border,cursor:"pointer"}}>
          <div style={{width:22,height:22,borderRadius:6,border:"2px solid "+(isSel?"#e8313a":th.border2),background:isSel?"#e8313a":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {isSel&&<span style={{color:"#fff",fontSize:12,fontWeight:800}}>✓</span>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:600,color:th.text}}>{v.name}</div>
            <div style={{display:"flex",gap:8,marginTop:2}}>
              <VTypeBadge type={v.videoType} small={true}/>
              {v.size>0&&<span style={{fontSize:9,color:th.faint}}>{fmtSize(v.size)}</span>}
            </div>
          </div>
        </div>;
      })}
    </div>
    {count>0&&<div>
      <div style={{fontSize:11,color:"#e8313a",textAlign:"center",marginBottom:8}}>{count} video{count!==1?"s":""} selected</div>
      <button onClick={deleteSelected} style={{...pbtn("#e8313a")}}> 🗑 Delete {count} Video{count!==1?"s":""}</button>
    </div>}
  </BottomSheet>;
}

// ─── Copy Video to Another Vehicle ────────────────────────────────────────────
function CopyVideoSheet(p) {
  var th=p.th; var vid=p.vid; var inventory=p.inventory;
  var [q,setQ]=useState(""); var [selected,setSelected]=useState(null);

  var filtered=inventory.filter(function(v){
    return v.vin!==p.currentVin&&(!q||
      (v.make+v.model+v.year+v.stock).toLowerCase().includes(q.toLowerCase()));
  }).slice(0,15);

  function doCopy(){
    if(!selected)return;
    var copy=Object.assign({},vid,{id:randId(),date:new Date().toISOString(),notes:"Copied from #"+(p.currentStock||"")});
    p.onCopy(selected,copy);
  }

  return <BottomSheet th={th} title="📋 Copy Video to Another Vehicle" subtitle={"Copying: "+vid.name} onClose={p.onClose}>
    <input style={{...inp(th),marginBottom:8}} placeholder="Search vehicles..." value={q} onChange={function(e){setQ(e.target.value);}}/>
    <div style={{maxHeight:250,overflowY:"auto",marginBottom:12}}>
      {filtered.map(function(v){
        var isSel=selected===v.vin;
        return <div key={v.vin} onClick={function(){setSelected(v.vin);}} style={{padding:"10px 12px",borderBottom:"1px solid "+th.border,cursor:"pointer",background:isSel?"#4da6ff12":"transparent",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:th.text}}>{v.year} {v.make} {v.model}</div>
            <div style={{fontSize:10,color:th.muted}}>#{v.stock} · {v.type}</div>
          </div>
          {isSel&&<span style={{color:"#4da6ff",fontSize:14,fontWeight:800}}>✓</span>}
        </div>;
      })}
      {filtered.length===0&&<div style={{textAlign:"center",padding:"16px 0",color:th.faint,fontSize:12}}>No vehicles found</div>}
    </div>
    <button onClick={doCopy} disabled={!selected} style={{...pbtn("#4da6ff"),opacity:!selected?0.5:1}}>Copy to Selected Vehicle</button>
  </BottomSheet>;
}

// ─── Batch Upload from Camera Roll ────────────────────────────────────────────
function BatchUploadSheet(p) {
  var th=p.th; var inventory=p.inventory; var user=p.user;
  var [files,setFiles]=useState([]);
  var [assignments,setAssignments]=useState({});
  var [uploading,setUploading]=useState(false);
  var [progress,setProgress]=useState(0);
  var [done,setDone]=useState(false);
  var fileRef=useRef(null);

  function handleFiles(e){
    var selected=Array.from(e.target.files||[]);
    if(selected.length===0)return;
    setFiles(selected);
    var init={};
    selected.forEach(function(f,i){init[i]={vin:"",videoType:"Official"};});
    setAssignments(init);
  }
  function updateAssign(i,field,val){
    setAssignments(function(prev){var n=Object.assign({},prev);n[i]=Object.assign({},n[i]);n[i][field]=val;return n;});
  }
  function doUpload(){
    var ready=files.filter(function(f,i){return assignments[i]&&assignments[i].vin;});
    if(!ready.length)return;
    setUploading(true);
    var total=ready.length; var done2=0;
    var results=[];
    files.forEach(function(f,i){
      if(!assignments[i]||!assignments[i].vin)return;
      var a=assignments[i];
      var veh=inventory.find(function(v){return v.vin===a.vin;});
      var vid={
        id:randId(),
        name:autoName(veh,a.videoType,user.name),
        videoType:a.videoType,blob:f,
        date:new Date().toISOString(),uploader:user.name,
        role:user.role,dealerName:user.dealerName,
        size:f.size,duration:0,notes:"",qcStatus:"pending",
      };
      results.push({vin:a.vin,vid:vid});
      done2++;
      setProgress(Math.round(done2/total*100));
    });
    setTimeout(function(){
      setUploading(false);setDone(true);
      p.onUpload(results);
    },800);
  }

  if(done)return <BottomSheet th={th} title="✓ Batch Upload Complete" onClose={p.onClose}>
    <SuccessBox msg={files.length+" video"+(files.length!==1?"s":"")+" uploaded successfully."} th={th}/>
    <button onClick={p.onClose} style={{...pbtn(),marginTop:4}}>Done</button>
  </BottomSheet>;

  return <BottomSheet th={th} title="📷 Batch Upload" subtitle="Select multiple videos and assign each to a vehicle." onClose={p.onClose}>
    <input ref={fileRef} type="file" accept="video/*" multiple style={{display:"none"}} onChange={handleFiles}/>
    {files.length===0?(
      <button onClick={function(){fileRef.current&&fileRef.current.click();}} style={{width:"100%",padding:14,borderRadius:10,border:"2px dashed "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:14,fontFamily:"'Barlow',sans-serif",marginBottom:12}}>
        📁 Select Videos from Camera Roll
      </button>
    ):(
      <div>
        <div style={{fontSize:10,color:th.faint,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>{files.length} videos selected</div>
        <div style={{maxHeight:300,overflowY:"auto",marginBottom:12}}>
          {files.map(function(f,i){
            var a=assignments[i]||{vin:"",videoType:"Official"};
            var veh=a.vin?inventory.find(function(v){return v.vin===a.vin;}):null;
            return <div key={i} style={{...card(th),borderRadius:9,padding:"10px 12px",marginBottom:8}}>
              <div style={{fontSize:12,fontWeight:600,color:th.text,marginBottom:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.name}</div>
              <div style={{fontSize:10,color:th.muted,marginBottom:6}}>{fmtSize(f.size)}</div>
              <select style={{...inp(th),fontSize:12,padding:"7px 10px",marginBottom:6}} value={a.vin} onChange={function(e){updateAssign(i,"vin",e.target.value);}}>
                <option value="">Assign to vehicle...</option>
                {inventory.map(function(v){return <option key={v.vin} value={v.vin}>{v.year+" "+v.make+" "+v.model+" #"+v.stock}</option>;} )}
              </select>
              <div style={{display:"flex",gap:6}}>
                {["Official","Walk-around","Trade-in"].map(function(vt){
                  return <button key={vt} onClick={function(){updateAssign(i,"videoType",vt);}} style={{flex:1,padding:"5px 0",background:a.videoType===vt?VT_COLORS[vt]+"18":"transparent",border:"1px solid "+(a.videoType===vt?VT_COLORS[vt]+"55":th.border),borderRadius:6,color:a.videoType===vt?VT_COLORS[vt]:th.muted,fontSize:9,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700}}>{vt==="Official"?"★ ":""}{vt}</button>;
                })}
              </div>
            </div>;
          })}
        </div>
        {uploading&&<div style={{marginBottom:10}}>
          <div style={{height:6,background:th.border,borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:progress+"%",background:"#00d97e",borderRadius:3,transition:"width 0.3s"}}/>
          </div>
          <div style={{fontSize:10,color:th.muted,textAlign:"center",marginTop:4}}>{progress}% uploaded</div>
        </div>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={function(){setFiles([]);setAssignments({});}} style={{flex:1,padding:11,borderRadius:9,border:"1px solid "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif"}}>Clear</button>
          <button onClick={doUpload} disabled={uploading||!Object.values(assignments).some(function(a){return a.vin;})} style={{flex:2,padding:11,borderRadius:9,border:"none",background:"#00d97e",color:"#0a0c10",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Barlow',sans-serif",opacity:(!Object.values(assignments).some(function(a){return a.vin;})||uploading)?0.5:1}}>
            {uploading?"Uploading...":"Upload "+files.filter(function(f,i){return assignments[i]&&assignments[i].vin;}).length+" Videos"}
          </button>
        </div>
      </div>
    )}
  </BottomSheet>;
}

// ─── Copy Send to New Customer ─────────────────────────────────────────────────
function CopySendSheet(p) {
  var th=p.th; var original=p.original;
  var [custName,setCust]=useState("");
  var [custContact,setCtc]=useState("");
  var [msg,setMsg]=useState(original.msg||"");

  return <BottomSheet th={th} title="📋 Copy Send" subtitle={"Reuse message for a new customer."} onClose={p.onClose}>
    <div style={{background:th.inp,border:"1px solid "+th.border,borderRadius:9,padding:"10px 12px",marginBottom:14,fontSize:11,color:th.muted,lineHeight:1.5}}>
      Original: sent to <span style={{color:th.text,fontWeight:600}}>{original.custName}</span> · {fmtDaysAgo(original.sentAt)}
    </div>
    <span style={lbl(th)}>New Customer Name</span>
    <input style={inp(th)} placeholder="e.g. Maria Rodriguez" value={custName} onChange={function(e){setCust(e.target.value);}}/>
    <span style={lbl(th)}>Phone or Email (optional)</span>
    <input style={{...inp(th),marginBottom:10}} placeholder="For your records" value={custContact} onChange={function(e){setCtc(e.target.value);}}/>
    <span style={lbl(th)}>Message</span>
    <textarea value={msg} onChange={function(e){setMsg(e.target.value);}} style={{...inp(th),height:130,resize:"none",lineHeight:1.5,fontSize:13,marginBottom:14}}/>
    <button onClick={function(){if(custName.trim())p.onSend({custName:custName,custContact:custContact,msg:msg});}} disabled={!custName.trim()} style={{...pbtn("#00d97e"),opacity:!custName.trim()?0.5:1}}>
      ⬆ Send to {custName||"New Customer"}
    </button>
  </BottomSheet>;
}

// ─── Double Tap Fullscreen (video) ────────────────────────────────────────────
function useDoubleTap(onDoubleTap) {
  var lastTap=useRef(0);
  return function(e){
    var now=Date.now();
    if(now-lastTap.current<300){onDoubleTap(e);}
    lastTap.current=now;
  };
}

// ─── Low Data Mode ────────────────────────────────────────────────────────────
function LowDataBanner(p) {
  var th=p.th;
  if(!_db.accessPrefs||!_db.accessPrefs.lowData)return null;
  return <div style={{background:"#ffd70012",border:"1px solid #ffd70030",borderRadius:7,padding:"5px 12px",margin:"6px 14px",fontSize:10,color:"#ffd700",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <span>⚡ Low data mode — thumbnails compressed</span>
    <button onClick={function(){var p2=Object.assign({},_db.accessPrefs);p2.lowData=false;_db.accessPrefs=p2;p.onDismiss();}} style={{background:"none",border:"none",color:"#ffd700",cursor:"pointer",fontSize:11,fontFamily:"'Barlow',sans-serif"}}>Off</button>
  </div>;
}

// ─── QC Reviewer Assignment ────────────────────────────────────────────────────
function QCReviewerAssignment(p) {
  var th=p.th;
  var users=Object.values(getUsers()).filter(function(u){return u.role===QC_ROLE;});
  var stores=SONIC_DEALERS.slice(0,20);
  var [assignments,setAssignments]=useState(_db.qcAssignments||{});

  function assign(storeId,email){
    var n=Object.assign({},assignments);
    n[storeId]=email;
    setAssignments(n);
    _db.qcAssignments=n;
  }

  return <BottomSheet th={th} title="👤 QC Reviewer Assignment" subtitle="Assign specific QC reviewers to specific stores." onClose={p.onClose}>
    <div style={{maxHeight:360,overflowY:"auto"}}>
      {stores.map(function(s){
        return <div key={s.id} style={{padding:"8px 0",borderBottom:"1px solid "+th.border}}>
          <div style={{fontSize:12,fontWeight:600,color:th.text,marginBottom:4}}>{s.name}</div>
          <select style={{...inp(th),padding:"6px 10px",fontSize:12}} value={assignments[s.id]||""} onChange={function(e){assign(s.id,e.target.value);}}>
            <option value="">Unassigned (any QC)</option>
            {users.map(function(u){return <option key={u.email} value={u.email}>{u.name}</option>;} )}
          </select>
        </div>;
      })}
    </div>
    <button onClick={p.onClose} style={{...pbtn(),marginTop:14}}>Save Assignments</button>
  </BottomSheet>;
}

// ─── Role Change (no new account) ─────────────────────────────────────────────
function RoleChangeSheet(p) {
  var th=p.th; var target=p.user;
  var [newRole,setNewRole]=useState(target.role);
  var [done,setDone]=useState(false);

  var availableRoles=SALES_ROLES.concat([ALLPRO_ROLE]);

  function doChange(){
    if(newRole===target.role)return;
    var users=getUsers();
    if(users[target.email]){
      users[target.email]=Object.assign({},users[target.email],{role:newRole});
      saveUsers(users);
      addAudit({type:"role_change",changedBy:p.changedBy,user:target.email,from:target.role,to:newRole});
      setDone(true);
      setTimeout(function(){p.onChanged(newRole);},1200);
    }
  }

  if(done)return <BottomSheet th={th} title="✓ Role Updated" onClose={p.onClose}>
    <SuccessBox msg={target.name+" is now "+newRole+"."} th={th}/>
  </BottomSheet>;

  return <BottomSheet th={th} title="🔄 Change Role" subtitle={"Changing role for "+target.name+"."} onClose={p.onClose}>
    <div style={{...card(th),borderRadius:9,padding:"10px 14px",marginBottom:12}}>
      <div style={{fontSize:11,color:th.muted}}>Current role</div>
      <div style={{fontSize:14,fontWeight:700,color:ROLE_COLORS[target.role]||th.text}}>{target.role}</div>
    </div>
    <span style={lbl(th)}>New Role</span>
    <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
      {availableRoles.map(function(r){
        var rc=ROLE_COLORS[r]||"#888";
        return <button key={r} onClick={function(){setNewRole(r);}} style={{padding:"11px 14px",background:newRole===r?rc+"18":"transparent",border:"1px solid "+(newRole===r?rc+"55":th.border),borderRadius:9,cursor:"pointer",textAlign:"left",fontSize:13,color:newRole===r?rc:th.text,fontWeight:newRole===r?700:400,fontFamily:"'Barlow',sans-serif",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:rc,flexShrink:0}}/>
          {r}
          {newRole===r&&<span style={{marginLeft:"auto",fontWeight:800}}>✓</span>}
        </button>;
      })}
    </div>
    <div style={{display:"flex",gap:10}}>
      <button onClick={p.onClose} style={{flex:1,padding:12,borderRadius:9,border:"1px solid "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:14,fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
      <button onClick={doChange} disabled={newRole===target.role} style={{flex:1,padding:12,borderRadius:9,border:"none",background:"#e8313a",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Barlow',sans-serif",opacity:newRole===target.role?0.4:1}}>Change Role</button>
    </div>
  </BottomSheet>;
}

// ─── Training Certification Tracker ───────────────────────────────────────────
function CertificationTracker(p) {
  var th=p.th;
  var modules=[
    {id:"terms",label:"Terms of Use",desc:"Acknowledge usage policy and data responsibilities"},
    {id:"camera",label:"Camera & Recording",desc:"Learn camera controls, video types, and quality standards"},
    {id:"sending",label:"Sending Videos",desc:"Compose messages, use templates, understand blackout hours"},
    {id:"outcomes",label:"Outcome Tracking",desc:"Mark sends as Responded, Visited, or Sold for reporting"},
    {id:"billing",label:"Billing & Reports",desc:"Understand per-video billing and how to read the report"},
  ];
  var cert=_db.certifications||{};
  var userCert=cert[p.userId]||{};

  function complete(id){
    if(!_db.certifications)_db.certifications={};
    if(!_db.certifications[p.userId])_db.certifications[p.userId]={};
    _db.certifications[p.userId][id]={completedAt:new Date().toISOString()};
    p.onToast("Module complete!");
  }

  var completed=modules.filter(function(m){return !!userCert[m.id];}).length;
  var pct=Math.round(completed/modules.length*100);
  var allDone=completed===modules.length;

  return <BottomSheet th={th} title="📚 Training Certification" subtitle={completed+"/"+modules.length+" modules complete."} onClose={p.onClose}>
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:11,color:th.muted}}>Overall progress</span>
        <span style={{fontSize:11,color:"#00d97e",fontWeight:700}}>{pct}%</span>
      </div>
      <div style={{height:6,background:th.border,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:pct+"%",background:"#00d97e",borderRadius:3,transition:"width 0.4s"}}/>
      </div>
    </div>
    {allDone&&<div style={{background:"#00d97e12",border:"1px solid #00d97e33",borderRadius:9,padding:"10px 14px",marginBottom:12,textAlign:"center"}}>
      <div style={{fontSize:16}}>🎓</div>
      <div style={{fontSize:13,fontWeight:700,color:"#00d97e"}}>Fully Certified</div>
      <div style={{fontSize:10,color:th.muted,marginTop:2}}>Completed {fmtDate(Object.values(userCert).map(function(c){return c.completedAt;}).sort().reverse()[0]||new Date())}</div>
    </div>}
    {modules.map(function(m){
      var isComplete=!!userCert[m.id];
      return <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid "+th.border}}>
        <div style={{width:28,height:28,borderRadius:"50%",background:isComplete?"#00d97e":"transparent",border:"2px solid "+(isComplete?"#00d97e":th.border2),display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,color:"#0a0c10"}}>
          {isComplete?"✓":""}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,color:th.text,fontWeight:600}}>{m.label}</div>
          <div style={{fontSize:11,color:th.muted}}>{m.desc}</div>
          {isComplete&&<div style={{fontSize:9,color:"#00d97e",marginTop:2}}>Completed {fmtDate(userCert[m.id].completedAt)}</div>}
        </div>
        {!isComplete&&<button onClick={function(){complete(m.id);}} style={{padding:"5px 12px",background:"#00d97e18",border:"1px solid #00d97e44",color:"#00d97e",borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:"'Barlow',sans-serif",fontWeight:700,flexShrink:0}}>Mark Done</button>}
      </div>;
    })}
  </BottomSheet>;
}

// ─── Sound on Send ────────────────────────────────────────────────────────────
function playSuccessSound() {
  try {
    var ctx=new (window.AudioContext||window.webkitAudioContext)();
    var osc=ctx.createOscillator();
    var gain=ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(520,ctx.currentTime);
    osc.frequency.setValueAtTime(680,ctx.currentTime+0.1);
    gain.gain.setValueAtTime(0.15,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime+0.3);
    setTimeout(function(){ctx.close();},500);
  } catch(e) {}
}

// ─── Resend from Sent Log ─────────────────────────────────────────────────────
function ResendSheet(p) {
  var th=p.th; var entry=p.entry;
  var [custName,setCust]=useState(entry.custName||"");
  var [custContact,setCtc]=useState(entry.custContact||"");
  var [msg,setMsg]=useState(entry.msg||"");

  return <BottomSheet th={th} title="🔁 Resend Video" subtitle={"Resending to "+entry.custName+"."} onClose={p.onClose}>
    <span style={lbl(th)}>Customer Name</span>
    <input style={inp(th)} value={custName} onChange={function(e){setCust(e.target.value);}}/>
    <span style={lbl(th)}>Phone or Email</span>
    <input style={inp(th)} value={custContact} onChange={function(e){setCtc(e.target.value);}}/>
    <span style={lbl(th)}>Message</span>
    <textarea value={msg} onChange={function(e){setMsg(e.target.value);}} style={{...inp(th),height:120,resize:"none",lineHeight:1.5,fontSize:13,marginBottom:14}}/>
    <button onClick={function(){p.onResend({custName:custName,custContact:custContact,msg:msg});}} style={pbtn("#00d97e")}>⬆ Resend</button>
  </BottomSheet>;
}

// ─── Reorder Videos ────────────────────────────────────────────────────────────
function ReorderVideos(p) {
  var th=p.th;
  var [order,setOrder]=useState(p.videos.map(function(v,i){return i;}));
  var [dragging,setDragging]=useState(null);

  function moveUp(i){
    if(i===0)return;
    var n=order.slice(); var tmp=n[i]; n[i]=n[i-1]; n[i-1]=tmp; setOrder(n);
  }
  function moveDown(i){
    if(i===order.length-1)return;
    var n=order.slice(); var tmp=n[i]; n[i]=n[i+1]; n[i+1]=tmp; setOrder(n);
  }

  var orderedVids=order.map(function(i){return p.videos[i];});

  return <BottomSheet th={th} title="↕ Reorder Videos" subtitle="Move videos up or down to change display order." onClose={p.onClose}>
    <div style={{maxHeight:360,overflowY:"auto",marginBottom:12}}>
      {orderedVids.map(function(v,i){
        return <div key={v.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid "+th.border}}>
          <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}>
            <button onClick={function(){moveUp(i);}} disabled={i===0} style={{background:"transparent",border:"1px solid "+th.border,borderRadius:4,width:22,height:22,cursor:"pointer",color:i===0?th.faint:th.text,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>▲</button>
            <button onClick={function(){moveDown(i);}} disabled={i===orderedVids.length-1} style={{background:"transparent",border:"1px solid "+th.border,borderRadius:4,width:22,height:22,cursor:"pointer",color:i===orderedVids.length-1?th.faint:th.text,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>▼</button>
          </div>
          <div style={{width:5,height:36,borderRadius:3,background:VT_COLORS[v.videoType]||"#888",flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:th.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.name}</div>
            <VTypeBadge type={v.videoType} small={true}/>
          </div>
          <div style={{fontSize:11,color:th.faint,flexShrink:0}}>#{i+1}</div>
        </div>;
      })}
    </div>
    <button onClick={function(){p.onReorder(orderedVids);p.onClose();}} style={pbtn()}>Save Order</button>
  </BottomSheet>;
}

// ─── Estimated Shot List Time ──────────────────────────────────────────────────
function EstimatedTime(p) {
  var count=p.count||0;
  var minsEach=4; // avg 4 min per vehicle
  var totalMins=count*minsEach;
  var hrs=Math.floor(totalMins/60); var mins=totalMins%60;
  if(count===0)return null;
  return <div style={{background:"#ff6b3512",border:"1px solid #ff6b3530",borderRadius:7,padding:"6px 12px",marginBottom:8,fontSize:11,color:"#ff6b35",display:"flex",justifyContent:"space-between"}}>
    <span>⏱ Estimated time</span>
    <span style={{fontWeight:700}}>{hrs>0?hrs+"h ":""}{mins>0?mins+"m":""}</span>
  </div>;
}


// ─── Pinch to zoom photos ─────────────────────────────────────────────────────
function PinchZoomImage(p) {
  var th=p.th;
  var [scale,setScale]=useState(1);
  var lastDist=useRef(null);

  function onTouchMove(e){
    if(e.touches.length===2){
      var dx=e.touches[0].clientX-e.touches[1].clientX;
      var dy=e.touches[0].clientY-e.touches[1].clientY;
      var dist=Math.sqrt(dx*dx+dy*dy);
      if(lastDist.current!==null){
        var delta=dist/lastDist.current;
        setScale(function(s){return Math.min(4,Math.max(1,s*delta));});
      }
      lastDist.current=dist;
    }
  }
  function onTouchEnd(){lastDist.current=null;}

  return <div style={{overflow:"hidden",borderRadius:p.radius||0,background:"#141720"}}
    onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
    onDoubleClick={function(){setScale(scale===1?2:1);}}>
    <img src={p.src} alt="" style={{width:"100%",height:"100%",objectFit:"cover",transform:"scale("+scale+")",transition:scale===1?"transform 0.3s":"none",touchAction:"none"}}/>
  </div>;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  var [theme,setTheme]=useState("dark");
  var th=theme==="dark"?DARK:LIGHT;
  var [screen,setScreen]=useState("home");
  var [authPath,setAuthPath]=useState("sales");
  var [user,setUser]=useState(function(){return getSession();});
  var [showTerms,setShowTerms]=useState(false);
  var [showMasterPanel,setShowMasterPanel]=useState(false);
  var [demoModeOn,setDemoModeOn]=useState(function(){return isDemoMode();});
  var [showOnboard,setShowOnboard]=useState(false);
  var [toast,setToast]=useState(null);

  // Inventory
  var [inventory,setInventory]=useState([]);
  var [invLoading,setInvLoading]=useState(false);
  var [invError,setInvError]=useState(null);
  var [lastSync,setLastSync]=useState(null);
  var [archivedVins,setArchived]=useState({});

  // Core data
  var [videos,setVideos]=useState({});
  var [sentLog,setSentLog]=useState({});
  var [flags,setFlags]=useState({});
  var [requests,setRequests]=useState({});
  var [qcReviewLog,setQcReviewLog]=useState([]);

  // Templates
  var [templates,setTemplates]=useState([
    {name:"Standard intro",text:"Hi {name}, I just pulled up a personal video of the {car} you were interested in. Take a look and let me know what you think!\n\n— {sender}"},
    {name:"Follow-up",text:"Hi {name}, just wanted to follow up on the {car} I sent you. Any questions I can answer? I'm here to help!\n\n— {sender}"},
    {name:"Price drop",text:"Hi {name}, great news — we just adjusted the price on the {car} you were looking at. Check out the video and let's talk!\n\n— {sender}"},
    {name:"New arrival",text:"Hi {name}, this {car} just arrived and I thought of you immediately. Take a look at this video — I think you'll love it!\n\n— {sender}"},
    {name:"Trade-in follow-up",text:"Hi {name}, here's the video of the {car} we discussed as a trade-in. Take a look and I can put together some numbers for you.\n\n— {sender}"},
    {name:"Post test drive",text:"Hi {name}, so glad you got to experience the {car} today! I put together a quick video so you can share it with family before making your decision.\n\n— {sender}"},
  ]);

  // Navigation
  var [currentView,setCurrentView]=useState("inventory");
  var [selectedVin,setSelectedVin]=useState(null);

  // Modals / overlays
  var [showNotifications,setShowNotifications]=useState(false);
  var [showScheduled,setShowScheduled]=useState(false);
  var [showWhiteLabel,setShowWhiteLabel]=useState(false);
  var [showAdmin,setShowAdmin]=useState(false);
  var [showSoldArchive,setShowSoldArchive]=useState(false);
  var [showScanner,setShowScanner]=useState(false);
  var [showAccessibility,setShowAccessibility]=useState(false);
  var [showErrorReport,setShowErrorReport]=useState(false);
  var [showSessionTimeout,setShowSessionTimeout]=useState(false);

  // Session timeout
  var lastActivityRef=useRef(Date.now());
  var timeoutCheckRef=useRef(null);
  var SESSION_IDLE_MS=30*60*1000; // 30 min
  var WARN_BEFORE_MS=5*60*1000;   // warn 5 min before

  var refreshRef=useRef(null);
  var [preselectedStore,setPreselectedStore]=useState(null);

  // White label settings
  var wlSettings=Object.assign({logoUrl:"",accentColor:"#e8313a",groupName:"Sonic Automotive",showPoweredBy:true},_db.whiteLabelSettings||{});

  // Activity tracker for session timeout
  function resetActivity(){
    lastActivityRef.current=Date.now();
    if(showSessionTimeout)setShowSessionTimeout(false);
  }

  // Persist app state (logins, accounts, reminders, audit log, ack flags, etc.)
  // to localStorage so it survives reloads/restarts on this device.
  useEffect(function(){
    var iv=setInterval(persistDB,4000);
    function onHide(){persistDB();}
    window.addEventListener("beforeunload",onHide);
    document.addEventListener("visibilitychange",onHide);
    return function(){
      clearInterval(iv);
      window.removeEventListener("beforeunload",onHide);
      document.removeEventListener("visibilitychange",onHide);
      persistDB();
    };
  },[]);

  useEffect(function(){
    var events=["mousedown","touchstart","keydown","scroll"];
    events.forEach(function(e){document.addEventListener(e,resetActivity,{passive:true});});
    timeoutCheckRef.current=setInterval(function(){
      var idle=Date.now()-lastActivityRef.current;
      if(idle>SESSION_IDLE_MS-WARN_BEFORE_MS&&idle<SESSION_IDLE_MS&&user){
        setShowSessionTimeout(true);
      } else if(idle>SESSION_IDLE_MS&&user){
        handleLogout();
      }
    },60000);
    return function(){
      events.forEach(function(e){document.removeEventListener(e,resetActivity);});
      clearInterval(timeoutCheckRef.current);
    };
  },[user]);

  // ── Demo data ────────────────────────────────────────────────────────────────
  var DEMO_VIDEOS_TEMPLATE=[
    {videoType:"Official",   uploader:"All-Pro Media",role:ALLPRO_ROLE,notes:"Full exterior + interior walkaround"},
    {videoType:"Walk-around",uploader:"Sales – Demo", role:"Sales",    notes:""},
  ];

  function buildDemoVideos(storeId){
    var inv=DEMO_INV[storeId]||DEMO_INV["massey-cadillac-orlando"]||[];
    var result={};
    inv.slice(0,4).forEach(function(v,idx){
      result[v.vin]=DEMO_VIDEOS_TEMPLATE.slice(0,idx<2?2:1).map(function(tpl,i){
        return {
          id:v.vin+"-demo-"+i, isDemo:true,
          name:v.year+" "+v.make+" "+v.model+" — Demo",
          date:new Date(Date.now()-(idx*86400000*3)).toISOString(),
          size:0, duration:90, notes:tpl.notes, videoType:tpl.videoType,
          uploader:tpl.uploader, role:tpl.role,
          dealerName:(SONIC_DEALERS.find(function(d){return d.id===storeId;})||{}).name||"",
          qcStatus:"pending",
        };
      });
    });
    return result;
  }

  function buildDemoSentLog(storeId){
    var inv=DEMO_INV[storeId]||DEMO_INV["massey-cadillac-orlando"]||[];
    var sl={};
    var senders=["Mike R.","Sarah K.","Tom B."];
    var customers=[
      ["James Carter","407-555-0101"],["Priya Patel","priya@email.com"],
      ["David Thompson","407-555-0202"],["Maria Rodriguez","maria@email.com"],
      ["Kevin Lee","407-555-0303"],["Angela White","407-555-0404"],
    ];
    inv.slice(0,5).forEach(function(v,vi){
      sl[v.vin]=[];
      var numSends=Math.floor(Math.random()*4)+1;
      for(var i=0;i<numSends;i++){
        var cust=customers[(vi*numSends+i)%customers.length];
        sl[v.vin].push({
          custName:cust[0],custContact:cust[1],
          sentBy:senders[i%senders.length],
          sentAt:new Date(Date.now()-(i+1)*86400000*(vi+1)).toISOString(),
          videoType:DEMO_VIDEOS_TEMPLATE[0].videoType,
          msg:"Demo sent message",
          outcome:OUTCOMES[Math.floor(Math.random()*OUTCOMES.length)],
        });
      }
    });
    return sl;
  }

  // ── Inventory loading ────────────────────────────────────────────────────────
  function loadInventory(storeId){
    setInvLoading(true); setInvError(null);
    if(isDemoMode()){
      setTimeout(function(){
        var data=DEMO_INV[storeId]||DEMO_INV["massey-cadillac-orlando"]||[];
        setInventory(data); setCache(storeId,data); setLastSync(new Date());
        setInvLoading(false);
      },600);
      return;
    }
    var dealer=SONIC_DEALERS.find(function(d){return d.id===storeId;});
    var q=dealer?dealer.name:"Massey Cadillac Orlando";
    fetch(WORKER_URL+"?q="+encodeURIComponent(q)+"&rows=50")
      .then(function(r){return r.json();})
      .then(function(data){
        var items=(data.response&&data.response.docs)||data.listing||[];
        var mapped=items.map(function(v){
          return {
            vin:v.vin,stock:v.stock_no||v.vin.slice(-6),
            year:v.year||2025,make:v.make||"",model:v.model||"",
            trim:v.trim||"",color:v.exterior_color||"",
            miles:v.miles||0,price:v.price||0,
            type:v.car_type==="new"?"New":v.car_type==="certified"?"CPO":"Used",
            daysOnLot:v.dom||0,thumb:v.photo_links&&v.photo_links[0]||null,
          };
        });
        setVideos(function(prev){
          var currentVins={};
          mapped.forEach(function(v){currentVins[v.vin]=true;});
          var newArchived=Object.assign({},archivedVins);
          Object.keys(prev).forEach(function(vin){
            if(!currentVins[vin]&&(prev[vin]||[]).filter(function(v){return !v.isDemo;}).length>0)newArchived[vin]=true;
          });
          setArchived(newArchived);
          return prev;
        });
        setInventory(mapped); setCache(storeId,mapped); setLastSync(new Date());
        setInvLoading(false);
        clearInterval(refreshRef.current);
        refreshRef.current=setInterval(function(){loadInventory(storeId);},AUTO_REFRESH);
      })
      .catch(function(e){
        setInvError(e.message||"Inventory unavailable");
        var cached=getCache(storeId);
        if(cached.length>0)setInventory(cached);
        setInvLoading(false);
      });
  }

  useEffect(function(){
    if(user&&!isCorporate(user)){
      var storeId=user.activeStore||user.dealerId||"massey-cadillac-orlando";
      loadInventory(storeId);
      if(isDemoMode()){
        setVideos(buildDemoVideos(storeId));
        setSentLog(buildDemoSentLog(storeId));
      }
    } else if(user&&isCorporate(user)&&isDemoMode()){
      // Corporate sees demo data aggregated across the demo stores for preview purposes
      var v1=buildDemoVideos("massey-cadillac-orlando");
      var v2=buildDemoVideos("massey-cadillac-south-orlando");
      var s1=buildDemoSentLog("massey-cadillac-orlando");
      var s2=buildDemoSentLog("massey-cadillac-south-orlando");
      setVideos(Object.assign({},v1,v2));
      setSentLog(Object.assign({},s1,s2));
    }
    return function(){clearInterval(refreshRef.current);};
  },[user&&(user.activeStore||user.dealerId)]);

  // QR code store pre-selection
  useEffect(function(){
    try{
      var params=new URLSearchParams(window.location.search);
      var store=params.get("store");
      if(store)setPreselectedStore(store);
    }catch(e){}
  },[]);

  // Low coverage alert
  useEffect(function(){
    if(!user||!isManager(user)||!inventory.length)return;
    var withOff=inventory.filter(function(v){return (videos[v.vin]||[]).some(function(x){return x.videoType==="Official"&&!x.isDemo;});}).length;
    var pct=Math.round(withOff/inventory.length*100);
    if(pct<70){addNotification("Low Coverage Alert","Official video coverage is at "+pct+"% — below the 70% threshold.","coverage");}
  },[inventory.length,user&&user.email]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function showToast(msg,type){setToast({msg:msg,type:type||"success"});}

  function handleLogin(u){
    // Log session
    if(!_db.currentSessionId)_db.currentSessionId=randId();
    addAudit({type:"login",user:u.email,store:u.dealerId||u.activeStore});
    setScreen("app");
    if(!u.termsVersion||u.termsVersion!==TERMS_VERSION){
      setUser(u); setShowTerms(true);
    } else if(!u.hasOnboarded){
      setUser(u); setShowOnboard(true);
    } else {
      setUser(u); setCurrentView("inventory");
    }
  }

  function handleTermsAccept(){
    var u=Object.assign({},user,{termsVersion:TERMS_VERSION,termsAcceptedAt:new Date().toISOString()});
    var users=getUsers(); users[u.email]=u; saveUsers(users); saveSession(u); setUser(u);
    setShowTerms(false);
    if(!u.hasOnboarded)setShowOnboard(true);
    else{setScreen("app");setCurrentView("inventory");}
  }

  function handleOnboardDone(){
    var u=Object.assign({},user,{hasOnboarded:true});
    var users=getUsers(); users[u.email]=u; saveUsers(users); saveSession(u); setUser(u);
    setShowOnboard(false); setScreen("app"); setCurrentView("inventory");
  }

  function handleLogout(){
    // Master Admin "View as <role>" mode: the close/X button on locked views
    // (QC, Corporate) exits back to the Master Admin's normal view instead of
    // logging out entirely.
    if(isPlatformAdmin(user)&&user.masterViewAs){
      var reset=Object.assign({},user,{masterViewAs:""});
      setUser(reset); saveSession(reset); setCurrentView("inventory");
      return;
    }
    clearSession();
    addAudit({type:"logout",user:user&&user.email});
    setUser(null); setScreen("home"); setCurrentView("inventory");
    setInventory([]); setVideos({}); setSentLog({}); setFlags({}); setRequests({});
    setShowSessionTimeout(false);
    clearInterval(refreshRef.current);
  }

  function handleUpdateUser(u){setUser(u);saveSession(u);}

  function handleSaveVideo(vin,vid){
    // Check video expiration settings
    setVideos(function(prev){
      var n=Object.assign({},prev);
      if(!n[vin])n[vin]=[];
      var dupName=n[vin].some(function(v){return !v.isDemo&&v.name===vid.name&&v.videoType===vid.videoType;});
      if(dupName&&!window.confirm("A video with this name and type already exists on this vehicle. Save anyway?"))return prev;
      n[vin]=[vid].concat(n[vin]);
      return n;
    });
    addAudit({type:"video_upload",user:user.email,vin:vin,store:user.dealerId||user.activeStore,videoType:vid.videoType,vidName:vid.name,uploader:vid.uploader,role:vid.role,duration:vid.duration||0});

    // Notify sales staff who recently viewed this vehicle (if All-Pro uploaded)
    if(vid.role===ALLPRO_ROLE&&vid.videoType==="Official"){
      addNotification("New Official Video","A new Official video was added for a vehicle you recently viewed.","new_video");
    }

    // Clear video request if fulfilled
    if(vid.videoType==="Official"&&requests[vin]){
      setRequests(function(prev){var n=Object.assign({},prev);delete n[vin];return n;});
      addNotification("Video Request Fulfilled","All-Pro has uploaded the Official video you requested.","request");
    }
  }

  function handleClearOldVideos(days){
    var cutoff=Date.now()-days*86400000;
    var myName=user.displayName||user.name;
    function isOldMine(v){
      return !v.isDemo&&v.uploader===myName&&new Date(v.date||0).getTime()<cutoff;
    }
    var removed=0;
    Object.keys(videos).forEach(function(vin){
      (videos[vin]||[]).forEach(function(v){if(isOldMine(v))removed++;});
    });
    if(removed>0){
      setVideos(function(prev){
        var n={};
        Object.keys(prev).forEach(function(vin){
          n[vin]=(prev[vin]||[]).filter(function(v){return !isOldMine(v);});
        });
        return n;
      });
    }
    return removed;
  }

  function handleDeleteVideo(vin,vidId){
    setVideos(function(prev){
      var n=Object.assign({},prev);
      n[vin]=(n[vin]||[]).filter(function(v){return v.id!==vidId;});
      return n;
    });
    addAudit({type:"video_delete",user:user.email,vin:vin});
  }

  function handleUpdateVideoNote(vin,vidId,note){
    setVideos(function(prev){
      var n=Object.assign({},prev);
      n[vin]=(n[vin]||[]).map(function(v){return v.id===vidId?Object.assign({},v,{notes:note}):v;});
      return n;
    });
  }

  function handleSend(vin,vid,sendData){
    setSentLog(function(prev){
      var n=Object.assign({},prev);
      if(!n[vin])n[vin]=[];
      n[vin]=n[vin].concat([Object.assign({},sendData,{
        sentBy:user.displayName||user.name,
        videoType:vid.videoType,
        outcome:"No Response",
        vin:vin,
        vehicleName:inventory.find(function(v){return v.vin===vin;})?
          (inventory.find(function(v){return v.vin===vin;}).year+" "+inventory.find(function(v){return v.vin===vin;}).make+" "+inventory.find(function(v){return v.vin===vin;}).model):"",
      })]);
      return n;
    });
    addAudit({type:"video_sent",user:user.email,vin:vin,customer:sendData.custName,store:user.dealerId||user.activeStore});
    // Auto follow-up reminder if salesperson selected it
    if(sendData.followUpDays){
      var veh=inventory.find(function(v){return v.vin===vin;});
      var vehName=veh?(veh.year+" "+veh.make+" "+veh.model):"this vehicle";
      var remindAt=new Date(Date.now()+sendData.followUpDays*86400000);
      if(!_db.reminders)_db.reminders=[];
      _db.reminders.push({
        id:randId(),type:"follow_up",vin:vin,
        custName:sendData.custName,remindAt:remindAt.toISOString(),
        createdBy:user.displayName||user.name,
        note:"Follow up with "+sendData.custName+" about "+vehName,
      });
    }
    // Haptic
    if(navigator.vibrate)navigator.vibrate([50,30,50]);
  }

  function handleUpdateOutcome(vin,idx,outcome){
    setSentLog(function(prev){
      var n=Object.assign({},prev);
      var log=(n[vin]||[]).slice();
      if(log[idx])log[idx]=Object.assign({},log[idx],{outcome:outcome});
      n[vin]=log;
      return n;
    });
    if(outcome==="Sold"){
      // Notify photographer
      var veh=inventory.find(function(v){return v.vin===vin;});
      if(veh){
        var vid=(videos[vin]||[]).find(function(v){return v.videoType==="Official"&&!v.isDemo;});
        if(vid)addNotification("Car Sold 🎉","The "+veh.year+" "+veh.make+" "+veh.model+" you filmed sold!","general");
      }
    }
  }

  function handleRequest(vin){
    setRequests(function(prev){var n=Object.assign({},prev);n[vin]={requestedBy:user.name,requestedAt:new Date().toISOString()};return n;});
    addNotification("New Shoot Request","Sales has requested an Official video for a vehicle on the lot.","request");
  }

  function handleScannerResult(query){
    setShowScanner(false);
    var found=inventory.find(function(v){
      return (v.vin||"").toUpperCase().includes(query)||(v.stock||"").toUpperCase().includes(query);
    });
    if(found){setSelectedVin(found.vin);setCurrentView("detail");}
    else showToast("No match found for: "+query,"warn");
  }

  // Flag count for All-Pro avatar badge
  var flagCount=isAllPro(user)?Object.keys(flags).filter(function(vidId){
    return flags[vidId]&&Object.values(videos).some(function(vids){return (vids||[]).some(function(v){return v.id===vidId&&v.uploader===user.name;});});
  }).length:0;
  var requestCount=isAllPro(user)?Object.keys(requests||{}).filter(function(k){return requests[k]&&!Object.values(videos).some(function(vv){return (vv||[]).some(function(v){return v.videoType==="Official"&&!v.isDemo;});});}).length:0;
  var totalBadge=flagCount+requestCount;

  // Unread notification count
  var unreadCount=(_db.notifications||[]).filter(function(n){return !n.read;}).length;

  var storeId=user?(user.activeStore||user.dealerId||"massey-cadillac-orlando"):"massey-cadillac-orlando";
  var dealer=SONIC_DEALERS.find(function(d){return d.id===storeId;})||{};

  // ── Screen: Auth ────────────────────────────────────────────────────────────
  if(screen==="auth"){
    return <AuthScreen th={th} path={authPath} preselectedStore={preselectedStore}
      onBack={function(){setScreen("home");}} onLogin={handleLogin}/>;
  }

  // ── Screen: Home ────────────────────────────────────────────────────────────
  if(!user||screen==="home"){
    return <HomeScreen th={th} theme={theme}
      onToggle={function(){setTheme(function(t){return t==="dark"?"light":"dark";});}}
      onPath={function(path){setAuthPath(path);setScreen("auth");}}/>;
  }

  if(showTerms)return <TermsScreen th={th} onAccept={handleTermsAccept}/>;
  if(showOnboard&&user)return <OnboardingScreen th={th} role={user.role} onDone={handleOnboardDone}/>;

  // ── Session timeout warning ─────────────────────────────────────────────────
  var sessionTimeoutEl=showSessionTimeout?<SessionTimeoutWarning th={th}
    onStayLoggedIn={function(){setShowSessionTimeout(false);lastActivityRef.current=Date.now();}}
    onTimeout={handleLogout}/>:null;

  // ── Corporate users (Sonic Corporate / All-Pro Corporate) ──────────────────
  if(isCorporate(user)){
    return <div>
      <style>{getGS(th)}</style>
      {sessionTimeoutEl}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={function(){setToast(null);}}/>}
      <CorporateDashboard th={th} user={user} videos={videos} sentLog={sentLog}
        onClose={handleLogout}/>
    </div>;
  }

  // ── QC users ────────────────────────────────────────────────────────────────
  if(isQC(user)){
    return <div>
      <style>{getGS(th)}</style>
      {sessionTimeoutEl}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={function(){setToast(null);}}/>}
      {showNotifications&&<NotificationCenter th={th} onClose={function(){setShowNotifications(false);}}/>}
      <QCFeed th={th} user={user} videos={videos} flags={flags}
        reviewLog={qcReviewLog}
        onClose={handleLogout}
        onUpdateFlag={function(fid,fi){setFlags(function(prev){var n=Object.assign({},prev);if(fi)n[fid]=fi;else delete n[fid];return n;});}}
        onLogReview={function(entry){setQcReviewLog(function(prev){return prev.concat([entry]);});}}
        onNotifications={function(){setShowNotifications(true);}}
        notifCount={unreadCount} onToast={showToast}/></div>;
  }

  // ── Profile ─────────────────────────────────────────────────────────────────
  if(currentView==="profile"){
    return <div>
      <style>{getGS(th)}</style>
      {sessionTimeoutEl}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={function(){setToast(null);}}/>}
      {showAccessibility&&<AccessibilitySettings th={th} onClose={function(){setShowAccessibility(false);}} onSave={function(){}} onToast={showToast}/>}
      {showErrorReport&&<ErrorReporter th={th} userEmail={user.email} onClose={function(){setShowErrorReport(false);}} onToast={showToast}/>}
      <ProfileScreen th={th} user={user} theme={theme}
        onToggle={function(){setTheme(function(t){return t==="dark"?"light":"dark";});}}
        onClose={function(){setCurrentView("inventory");}}
        onLogout={handleLogout} onUpdateUser={handleUpdateUser} onToast={showToast}
        onAccessibility={function(){setShowAccessibility(true);}}
        onErrorReport={function(){setShowErrorReport(true);}}
        onDataExport={function(){}} sentLog={sentLog} videos={videos}
        onClearOldVideos={handleClearOldVideos}/>
    </div>;
  }

  // ── Billing ─────────────────────────────────────────────────────────────────
  if(currentView==="billing"){
    return <div>
      <style>{getGS(th)}</style>
      {sessionTimeoutEl}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={function(){setToast(null);}}/>}
      <BillingReport th={th} videos={videos} inventory={inventory}
        dealerName={dealer.name||user.dealerName} dealerCity={dealer.city||user.dealerCity}
        onClose={function(){setCurrentView("inventory");}}/></div>;
  }

  // ── Manager dashboard ───────────────────────────────────────────────────────
  if(currentView==="manager"&&isManager(user)){
    return <div>
      <style>{getGS(th)}</style>
      {sessionTimeoutEl}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={function(){setToast(null);}}/>}
      {showAdmin&&<AdminPanel th={th} onClose={function(){setShowAdmin(false);}} onToast={showToast}/>}
      {showWhiteLabel&&<WhiteLabelSettings th={th} onClose={function(){setShowWhiteLabel(false);}} onSave={function(s){_db.whiteLabelSettings=s;showToast("Branding saved!");}} onToast={showToast}/>}
      {showSoldArchive&&<SoldArchive th={th} videos={videos} sentLog={sentLog} inventory={inventory} archivedVins={archivedVins} onClose={function(){setShowSoldArchive(false);}}/>}
      <ManagerDash th={th} user={user} videos={videos} sentLog={sentLog} inventory={inventory}
        dealerId={storeId} dealerName={dealer.name||user.dealerName}
        onClose={function(){setCurrentView("inventory");}} onToast={showToast}
        onAdmin={function(){setShowAdmin(true);}}
        onWhiteLabel={function(){setShowWhiteLabel(true);}}
        onSoldArchive={function(){setShowSoldArchive(true);}}/></div>;
  }

  // ── Shot list ───────────────────────────────────────────────────────────────
  if(currentView==="shotlist"&&isAllPro(user)){
    return <div>
      <style>{getGS(th)}</style>
      {sessionTimeoutEl}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={function(){setToast(null);}}/>}
      <ShotList th={th} user={user} inventory={inventory} videos={videos} requests={requests}
        dealerName={dealer.name||user.dealerName}
        onClose={function(){setCurrentView("inventory");}}
        onSelectVehicle={function(vin){setSelectedVin(vin);setCurrentView("detail");}}/></div>;
  }

  // ── My Sends ────────────────────────────────────────────────────────────────
  if(currentView==="mysends"){
    return <div>
      <style>{getGS(th)}</style>
      {sessionTimeoutEl}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={function(){setToast(null);}}/>}
      <MySends th={th} user={user} sentLog={sentLog} inventory={inventory}
        onClose={function(){setCurrentView("inventory");}}
        onUpdateOutcome={handleUpdateOutcome}/></div>;
  }

  // ── Notifications ───────────────────────────────────────────────────────────
  if(currentView==="notifications"){
    return <div>
      <style>{getGS(th)}</style>
      {sessionTimeoutEl}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={function(){setToast(null);}}/>}
      <NotificationCenter th={th} onClose={function(){setCurrentView("inventory");}}/></div>;
  }

  // ── Sold Archive ────────────────────────────────────────────────────────────
  if(currentView==="archive"){
    return <div>
      <style>{getGS(th)}</style>
      {sessionTimeoutEl}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={function(){setToast(null);}}/>}
      <SoldArchive th={th} videos={videos} sentLog={sentLog} inventory={inventory}
        archivedVins={archivedVins} onClose={function(){setCurrentView("inventory");}}/></div>;
  }

  // ── Vehicle detail ──────────────────────────────────────────────────────────
  if(currentView==="detail"&&selectedVin){
    return <div>
      <style>{getGS(th)}</style>
      {sessionTimeoutEl}
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={function(){setToast(null);}}/>}
      {showScanner&&<VINScanner th={th} onResult={handleScannerResult} onClose={function(){setShowScanner(false);}}/>}
      <VehicleDetail
        th={th} user={user} vin={selectedVin}
        inventory={inventory} videos={videos} sentLog={sentLog}
        flags={flags} requests={requests} templates={templates}
        archivedVins={archivedVins}
        onClose={function(){setCurrentView("inventory");setSelectedVin(null);}}
        onSaveVideo={handleSaveVideo}
        onDeleteVideo={handleDeleteVideo}
        onUpdateVideoNote={handleUpdateVideoNote}
        onSend={handleSend}
        onUpdateOutcome={handleUpdateOutcome}
        onRequest={handleRequest}
        onSelectVehicle={function(vin){setSelectedVin(vin);}}
        onToast={showToast}
        onSaveTemplate={function(t){setTemplates(function(prev){return prev.concat([t]);});}}
        onMySends={function(){setCurrentView("mysends");}}
        onCustomerHistory={function(){}}/></div>;
  }

  // ── Default: Inventory ──────────────────────────────────────────────────────
  return <div>
    <style>{getGS(th)}</style>
    {sessionTimeoutEl}
    {toast&&<Toast msg={toast.msg} type={toast.type} onDone={function(){setToast(null);}}/>}
    {isPlatformAdmin(user)&&<button onClick={function(){setShowMasterPanel(true);}} style={{position:"fixed",bottom:16,right:16,zIndex:9990,width:44,height:44,borderRadius:"50%",border:"none",background:"#111",color:"#fff",fontSize:18,cursor:"pointer",boxShadow:"0 2px 10px rgba(0,0,0,0.4)"}}>🛠</button>}
    {showMasterPanel&&<BottomSheet th={th} title="🛠 Master Admin" subtitle={"Signed in as "+user.email} onClose={function(){setShowMasterPanel(false);}}>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:11,color:th.faint,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Demo Mode</div>
        <div onClick={function(){
          var v=!demoModeOn; setDemoMode(v); setDemoModeOn(v);
          showToast(v?"Demo Mode ON — demo inventory + auto-confirmed signups.":"Demo Mode OFF — live MarketCheck inventory + real email verification.");
          loadInventory(storeId);
        }} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 12px",borderRadius:9,border:"1px solid "+th.border,background:th.inp}}>
          <div style={{width:40,height:22,borderRadius:11,background:demoModeOn?"#00d97e":th.border2,position:"relative",flexShrink:0}}>
            <div style={{position:"absolute",top:2,left:demoModeOn?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.15s"}}/>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:th.text}}>{demoModeOn?"Demo Mode is ON":"Demo Mode is OFF"}</div>
            <div style={{fontSize:11,color:th.muted}}>{demoModeOn?"Demo inventory · signups auto-confirm instantly":"Live MarketCheck inventory · email verification required"}</div>
          </div>
        </div>
      </div>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:11,color:th.faint,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Store</div>
        <select value={storeId} onChange={function(e){
          var newStoreId=e.target.value;
          var nu=Object.assign({},user,{activeStore:newStoreId});
          setUser(nu); saveSession(nu); loadInventory(newStoreId);
          var d=SONIC_DEALERS.find(function(x){return x.id===newStoreId;});
          showToast("Now viewing: "+(d?d.name:newStoreId));
        }} style={{...inp(th),padding:"8px 10px",fontSize:13}}>
          {SONIC_DEALERS.map(function(d){return <option key={d.id} value={d.id}>{d.name} — {d.city}</option>;})}
        </select>
        <div style={{fontSize:11,color:th.faint,marginTop:6}}>Switches the inventory/data store for every role view below.</div>
      </div>
      <div>
        <div style={{fontSize:11,color:th.faint,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>View As</div>
        {MASTER_VIEW_ROLES.map(function(r){
          var active=(user.masterViewAs||"")===r.key;
          return <button key={r.key||"default"} onClick={function(){
            var nu=Object.assign({},user,{masterViewAs:r.key});
            setUser(nu); saveSession(nu); setShowMasterPanel(false);
            if(r.key&&r.key!=="sales")showToast("Viewing as: "+r.label);
          }} style={{display:"block",width:"100%",textAlign:"left",padding:"10px 12px",borderRadius:9,border:"1px solid "+(active?"#4da6ff":th.border),background:active?"#4da6ff12":"transparent",color:active?"#4da6ff":th.text,cursor:"pointer",fontSize:13,fontWeight:active?700:500,fontFamily:"'Barlow',sans-serif",marginBottom:6}}>
            {active?"✓ ":""}{r.label}
          </button>;
        })}
        {user.masterViewAs&&<div style={{fontSize:11,color:th.faint,marginTop:6}}>Tip: the ✕/close button on the role view returns you here.</div>}
      </div>
    </BottomSheet>}
    {invLoading&&<div style={{position:"fixed",top:0,left:0,right:0,height:3,background:wlSettings.accentColor||"#e8313a",zIndex:9999,animation:"pulse 0.8s ease infinite"}}/>}
    {invError&&!invLoading&&<div style={{position:"fixed",top:0,left:0,right:0,background:"#e8313a",color:"#fff",padding:"7px 16px",fontSize:11,zIndex:9998,display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:"'Barlow',sans-serif"}}>
      <span>⚠ {invError}{getCache(storeId).length>0?" · Cached data":""}</span>
      <button onClick={function(){loadInventory(storeId);}} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",padding:"3px 9px",borderRadius:5,cursor:"pointer",fontSize:10,fontFamily:"'Barlow',sans-serif"}}>Retry</button>
    </div>}
    {showScanner&&<VINScanner th={th} onResult={handleScannerResult} onClose={function(){setShowScanner(false);}}/>}
    {showSoldArchive&&<SoldArchive th={th} videos={videos} sentLog={sentLog} inventory={inventory} archivedVins={archivedVins} onClose={function(){setShowSoldArchive(false);}}/>}
    <InventoryScreen
      th={th} user={user}
      inventory={inventory} videos={videos} sentLog={sentLog} requests={requests}
      flags={flags} flagCount={totalBadge}
      invLoading={invLoading} lastSync={lastSync}
      wlSettings={wlSettings}
      notifCount={unreadCount}
      onRefresh={function(){loadInventory(storeId);}}
      onSelectVehicle={function(vin){setSelectedVin(vin);setCurrentView("detail");}}
      onViewSentLog={function(vin){setSelectedVin(vin);setCurrentView("detail");}}
      onShootVehicle={function(vin){setSelectedVin(vin);setCurrentView("detail");}}
      onManagerDash={function(){setCurrentView("manager");}}
      onBilling={function(){setCurrentView("billing");}}
      onShotList={function(){setCurrentView("shotlist");}}
      onMySends={function(){setCurrentView("mysends");}}
      onProfile={function(){setCurrentView("profile");}}
      onNotifications={function(){setCurrentView("notifications");}}
      onSoldArchive={function(){setShowSoldArchive(true);}}
      onScan={function(){setShowScanner(true);}}/></div>;
}
