import { useState, useRef, useEffect, useCallback } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────────
var WORKER_URL     = "https://sonic-inventory-proxy.57vfgk4b2v.workers.dev";
var AUTO_REFRESH   = 30 * 60 * 1000;
var DEMO_MODE      = true;
var QC_INVITE_CODE = "ALLPRO-QC-2025";



// Demo activity log — shows realistic send history in Manager Dashboard
// Only exists when DEMO_MODE is true
function buildDemoSentLog(inv) {
  if (!inv || inv.length === 0) return {};
  var log = {};
  var demoSends = [
    {sentBy:"Mike R.", custName:"James Carter",  custContact:"407-555-0182", videoType:"Official",    daysAgo:0},
    {sentBy:"Sarah K.",custName:"Priya Patel",   custContact:"407-555-0247", videoType:"Walk-around", daysAgo:0},
    {sentBy:"Mike R.", custName:"David Thompson",custContact:"321-555-0391", videoType:"Official",    daysAgo:1},
    {sentBy:"Tom B.",  custName:"Linda Nguyen",  custContact:"407-555-0128", videoType:"Official",    daysAgo:1},
    {sentBy:"Sarah K.",custName:"Robert Evans",  custContact:"321-555-0445", videoType:"Walk-around", daysAgo:2},
    {sentBy:"Mike R.", custName:"Amanda White",  custContact:"407-555-0563", videoType:"Official",    daysAgo:2},
    {sentBy:"Tom B.",  custName:"Carlos Mendez", custContact:"321-555-0677", videoType:"Trade-in",    daysAgo:3},
    {sentBy:"Sarah K.",custName:"Jennifer Brown",custContact:"407-555-0712", videoType:"Official",    daysAgo:3},
    {sentBy:"Mike R.", custName:"William Davis", custContact:"321-555-0834", videoType:"Official",    daysAgo:4},
    {sentBy:"Tom B.",  custName:"Michelle Lee",  custContact:"407-555-0956", videoType:"Walk-around", daysAgo:5},
  ];
  demoSends.forEach(function(send, i) {
    var veh = inv[i % inv.length];
    if (!veh) return;
    var sentAt = new Date(Date.now() - (send.daysAgo * 86400000) - (i * 3600000));
    if (!log[veh.vin]) log[veh.vin] = [];
    log[veh.vin].push({
      custName: send.custName,
      custContact: send.custContact,
      msg: "Hi " + send.custName.split(" ")[0] + ", I just pulled up a personal video of the " + veh.year + " " + veh.make + " " + veh.model + " you were interested in - Stock #" + veh.stock + ".\n\nTake a look and let me know what you think!\n\n- " + send.sentBy,
      sentAt: sentAt.toISOString(),
      videoType: send.videoType,
      sentBy: send.sentBy,
      vidId: veh.vin + "-demo-0",
    });
  });
  return log;
}

// ─── Store ─────────────────────────────────────────────────────────────────────
var _db = { users: {}, session: null, cache: {} };
function getUsers()    { return _db.users; }
function saveUsers(u)  { _db.users = u; }
function getSession()  { return _db.session; }
function saveSession(u){ _db.session = u; }
function clearSession(){ _db.session = null; }
function getCache(id)  { return _db.cache[id] || []; }
function setCache(id,v){ _db.cache[id] = v; }

// ─── Roles ─────────────────────────────────────────────────────────────────────
var ALLPRO_ROLE  = "Photographer – All-Pro";
var QC_ROLE      = "All-Pro QC";
var SALES_ROLES  = ["Sales","Detail / Media","Manager","BDC","Finance"];
function isAllPro(u)  { return u && u.role === ALLPRO_ROLE; }
function isManager(u) { return u && u.role === "Manager"; }
function isQC(u)      { return u && u.role === QC_ROLE; }

// ─── Dealers ───────────────────────────────────────────────────────────────────
var SONIC_DEALERS = [
  {id:"audi-birmingham",name:"Audi Birmingham",city:"Irondale, AL"},
  {id:"bmw-birmingham",name:"BMW of Birmingham",city:"Irondale, AL"},
  {id:"bmw-montgomery",name:"BMW of Montgomery",city:"Montgomery, AL"},
  {id:"capitol-chevrolet",name:"Capitol Chevrolet",city:"Montgomery, AL"},
  {id:"echopark-birmingham",name:"EchoPark Automotive Birmingham",city:"Irondale, AL"},
  {id:"jaguar-birmingham",name:"Jaguar Birmingham",city:"Birmingham, AL"},
  {id:"land-rover-birmingham",name:"Land Rover Birmingham",city:"Irondale, AL"},
  {id:"lexus-birmingham",name:"Lexus of Birmingham",city:"Birmingham, AL"},
  {id:"mini-birmingham",name:"MINI of Birmingham",city:"Irondale, AL"},
  {id:"echopark-phoenix",name:"EchoPark Automotive Phoenix",city:"Avondale, AZ"},
  {id:"autobahn-motors",name:"Autobahn Motors BMW/MINI",city:"Belmont, CA"},
  {id:"beverly-hills-bmw",name:"Beverly Hills BMW",city:"Los Angeles, CA"},
  {id:"bmw-monrovia",name:"BMW of Monrovia",city:"Monrovia, CA"},
  {id:"buena-park-honda",name:"Buena Park Honda",city:"Buena Park, CA"},
  {id:"carson-honda",name:"Carson Honda",city:"Carson, CA"},
  {id:"concord-honda",name:"Concord Honda",city:"Concord, CA"},
  {id:"concord-toyota",name:"Concord Toyota",city:"Concord, CA"},
  {id:"crown-lexus",name:"Crown Lexus",city:"Ontario, CA"},
  {id:"echopark-sacramento",name:"EchoPark Automotive Sacramento",city:"Roseville, CA"},
  {id:"honda-serramonte",name:"Honda of Serramonte",city:"Colma, CA"},
  {id:"honda-stevens-creek",name:"Honda of Stevens Creek",city:"San Jose, CA"},
  {id:"jaguar-lr-la",name:"Jaguar Land Rover Los Angeles",city:"Los Angeles, CA"},
  {id:"jaguar-lr-newport",name:"Jaguar Land Rover Newport Beach",city:"Newport Beach, CA"},
  {id:"jaguar-lr-san-jose",name:"Jaguar Land Rover San Jose",city:"San Jose, CA"},
  {id:"jaguar-santa-monica",name:"Jaguar Santa Monica",city:"Santa Monica, CA"},
  {id:"land-rover-la",name:"Land Rover Los Angeles",city:"Los Angeles, CA"},
  {id:"land-rover-newport",name:"Land Rover Newport Beach",city:"Newport Beach, CA"},
  {id:"land-rover-pasadena",name:"Land Rover Pasadena",city:"Pasadena, CA"},
  {id:"land-rover-san-jose",name:"Land Rover San Jose",city:"San Jose, CA"},
  {id:"land-rover-santa-monica",name:"Land Rover Santa Monica",city:"Santa Monica, CA"},
  {id:"lexus-marin",name:"Lexus of Marin",city:"San Rafael, CA"},
  {id:"lexus-serramonte",name:"Lexus of Serramonte",city:"Colma, CA"},
  {id:"long-beach-bmw",name:"Long Beach BMW",city:"Long Beach, CA"},
  {id:"long-beach-mini",name:"Long Beach MINI",city:"Long Beach, CA"},
  {id:"mb-calabasas",name:"Mercedes-Benz of Calabasas",city:"Calabasas, CA"},
  {id:"mb-walnut-creek",name:"Mercedes-Benz of Walnut Creek",city:"Walnut Creek, CA"},
  {id:"mini-monrovia",name:"MINI of Monrovia",city:"Monrovia, CA"},
  {id:"wi-simonson",name:"W.I. Simonson Mercedes-Benz",city:"Santa Monica, CA"},
  {id:"audi-glenwood-springs",name:"Audi Glenwood Springs",city:"Glenwood Springs, CO"},
  {id:"bmw-denver-downtown",name:"BMW of Denver Downtown",city:"Denver, CO"},
  {id:"echopark-centennial",name:"EchoPark Automotive Denver",city:"Centennial, CO"},
  {id:"echopark-colorado-springs",name:"EchoPark Automotive Colorado Springs",city:"Colorado Springs, CO"},
  {id:"glenwood-springs-vw",name:"Glenwood Springs Volkswagen",city:"Glenwood Springs, CO"},
  {id:"grand-junction-subaru",name:"Grand Junction Subaru",city:"Grand Junction, CO"},
  {id:"grand-junction-vw",name:"Grand Junction Volkswagen",city:"Grand Junction, CO"},
  {id:"land-rover-roaring-fork",name:"Land Rover Roaring Fork",city:"Glenwood Springs, CO"},
  {id:"mb-denver",name:"Mercedes-Benz of Denver",city:"Denver, CO"},
  {id:"mountain-states-toyota",name:"Mountain States Toyota",city:"Denver, CO"},
  {id:"audi-pensacola",name:"Audi Pensacola",city:"Pensacola, FL"},
  {id:"bmw-fort-myers",name:"BMW of Fort Myers",city:"Fort Myers, FL"},
  {id:"clearwater-toyota",name:"Clearwater Toyota",city:"Clearwater, FL"},
  {id:"massey-cadillac-orlando",name:"Massey Cadillac of Orlando",city:"Orlando, FL"},
  {id:"massey-cadillac-south-orlando",name:"Massey Cadillac of South Orlando",city:"Orlando, FL"},
  {id:"mb-fort-myers",name:"Mercedes-Benz of Fort Myers",city:"Fort Myers, FL"},
  {id:"mini-fort-myers",name:"MINI of Fort Myers",city:"Fort Myers, FL"},
  {id:"pensacola-honda",name:"Pensacola Honda",city:"Pensacola, FL"},
  {id:"dyer-dyer-volvo",name:"Dyer and Dyer Volvo Cars",city:"Chamblee, GA"},
  {id:"echopark-atlanta",name:"EchoPark Automotive Atlanta",city:"Duluth, GA"},
  {id:"global-imports-bmw",name:"Global Imports BMW",city:"Atlanta, GA"},
  {id:"global-imports-mini",name:"Global Imports MINI",city:"Chamblee, GA"},
  {id:"jaguar-lr-south-atlanta",name:"Jaguar Land Rover South Atlanta",city:"Union City, GA"},
  {id:"land-rover-south-atlanta",name:"Land Rover South Atlanta",city:"Union City, GA"},
  {id:"dave-smith-chevy-gmc",name:"Dave Smith Chevrolet GMC",city:"Kellogg, ID"},
  {id:"dave-smith-motors",name:"Dave Smith Motors",city:"Kellogg, ID"},
  {id:"dave-smith-wholesale",name:"Dave Smith Wholesale",city:"Coeur d'Alene, ID"},
  {id:"jordan-ford-mishawaka",name:"Jordan Ford of Mishawaka",city:"Mishawaka, IN"},
  {id:"jordan-lexus-mishawaka",name:"Jordan Lexus of Mishawaka",city:"Mishawaka, IN"},
  {id:"jordan-toyota",name:"Jordan Toyota",city:"Mishawaka, IN"},
  {id:"audi-new-orleans",name:"Audi New Orleans",city:"Metairie, LA"},
  {id:"audi-owings-mills",name:"Audi Owings Mills",city:"Owings Mills, MD"},
  {id:"audi-rockville",name:"Audi Rockville",city:"Rockville, MD"},
  {id:"porsche-chevy-chase",name:"Porsche Studio Chevy Chase",city:"Chevy Chase, MD"},
  {id:"echopark-st-louis",name:"EchoPark Automotive St. Louis",city:"Chesterfield, MO"},
  {id:"honda-jefferson-city",name:"Honda of Jefferson City",city:"Jefferson City, MO"},
  {id:"nissan-jefferson-city",name:"Nissan of Jefferson City",city:"Jefferson City, MO"},
  {id:"cadillac-las-vegas",name:"Cadillac of Las Vegas",city:"Las Vegas, NV"},
  {id:"echopark-las-vegas",name:"EchoPark Automotive Las Vegas",city:"Henderson, NV"},
  {id:"honda-west-lv",name:"Honda West",city:"Las Vegas, NV"},
  {id:"cadillac-south-charlotte",name:"Cadillac of South Charlotte",city:"Pineville, NC"},
  {id:"echopark-charlotte",name:"EchoPark Automotive Charlotte",city:"Charlotte, NC"},
  {id:"echopark-raleigh",name:"EchoPark Automotive Raleigh",city:"Cary, NC"},
  {id:"century-bmw",name:"Century BMW",city:"Greenville, SC"},
  {id:"century-mini",name:"Century MINI",city:"Greenville, SC"},
  {id:"fort-mill-ford",name:"Fort Mill Ford",city:"Fort Mill, SC"},
  {id:"audi-downtown-nashville",name:"Audi Downtown Nashville",city:"Nashville, TN"},
  {id:"audi-nashville",name:"Audi Nashville",city:"Brentwood, TN"},
  {id:"bmw-certified-nashville",name:"BMW Certified Pre-Owned Nashville",city:"Nashville, TN"},
  {id:"bmw-chattanooga",name:"BMW of Chattanooga",city:"Chattanooga, TN"},
  {id:"bmw-nashville",name:"BMW of Nashville",city:"Nashville, TN"},
  {id:"crest-honda",name:"Crest Honda",city:"Nashville, TN"},
  {id:"echopark-nashville",name:"EchoPark Automotive Nashville",city:"Nashville, TN"},
  {id:"economy-honda",name:"Economy Honda Superstore",city:"Chattanooga, TN"},
  {id:"mb-nashville",name:"Mercedes-Benz of Nashville",city:"Franklin, TN"},
  {id:"mini-nashville",name:"MINI of Nashville",city:"Brentwood, TN"},
  {id:"nissan-chattanooga",name:"Nissan of Chattanooga East",city:"Chattanooga, TN"},
  {id:"porsche-audi-nashville",name:"Porsche Audi Nashville",city:"Nashville, TN"},
  {id:"audi-central-houston",name:"Audi Central Houston",city:"Houston, TX"},
  {id:"audi-west-houston",name:"Audi West Houston",city:"Houston, TX"},
  {id:"baytown-ford",name:"Baytown Ford",city:"Baytown, TX"},
  {id:"bmw-west-houston",name:"BMW of West Houston",city:"Katy, TX"},
  {id:"bonham-cdjr",name:"Bonham Chrysler Dodge Jeep Ram",city:"Bonham, TX"},
  {id:"ecarone",name:"eCarOne",city:"Plano, TX"},
  {id:"echopark-houston-north",name:"EchoPark Automotive Houston North",city:"Houston, TX"},
  {id:"echopark-houston-sw",name:"EchoPark Automotive Houston SW",city:"Houston, TX"},
  {id:"echopark-san-antonio",name:"EchoPark Automotive San Antonio",city:"San Antonio, TX"},
  {id:"echopark-new-braunfels",name:"EchoPark Automotive New Braunfels",city:"New Braunfels, TX"},
  {id:"essence-alfa-romeo",name:"Essence Alfa Romeo",city:"Hurst, TX"},
  {id:"essence-maserati",name:"Essence Maserati",city:"Hurst, TX"},
  {id:"greenville-cdjr",name:"Greenville Chrysler Dodge Jeep Ram",city:"Greenville, TX"},
  {id:"greenville-hyundai",name:"Greenville Hyundai",city:"Greenville, TX"},
  {id:"greenville-nissan",name:"Nissan of Greenville",city:"Greenville, TX"},
  {id:"jaguar-houston-central",name:"Jaguar Houston Central",city:"Houston, TX"},
  {id:"jaguar-houston-north",name:"Jaguar Houston North",city:"Houston, TX"},
  {id:"jaguar-sw-houston",name:"Jaguar Southwest Houston",city:"Houston, TX"},
  {id:"land-rover-houston-central",name:"Land Rover Houston Central",city:"Houston, TX"},
  {id:"land-rover-houston-north",name:"Land Rover Houston North",city:"Houston, TX"},
  {id:"land-rover-sw-houston",name:"Land Rover Southwest Houston",city:"Houston, TX"},
  {id:"lone-star-chevrolet",name:"Lone Star Chevrolet",city:"Houston, TX"},
  {id:"lute-riley-honda",name:"Lute Riley Honda",city:"Richardson, TX"},
  {id:"mb-mckinney",name:"Mercedes-Benz of McKinney",city:"McKinney, TX"},
  {id:"momentum-bmw",name:"Momentum BMW",city:"Houston, TX"},
  {id:"momentum-mini",name:"Momentum MINI",city:"Houston, TX"},
  {id:"momentum-vw",name:"Momentum Volkswagen",city:"Houston, TX"},
  {id:"north-central-ford",name:"North Central Ford",city:"Richardson, TX"},
  {id:"philpott-ford",name:"Philpott Ford",city:"Nederland, TX"},
  {id:"philpott-hyundai",name:"Philpott Hyundai",city:"Nederland, TX"},
  {id:"philpott-toyota",name:"Philpott Toyota",city:"Nederland, TX"},
  {id:"sterling-mccall-bmw",name:"Sterling McCall BMW",city:"Houston, TX"},
  {id:"sterling-mccall-honda",name:"Sterling McCall Honda",city:"Houston, TX"},
  {id:"sterling-mccall-lexus",name:"Sterling McCall Lexus",city:"Houston, TX"},
  {id:"sterling-mccall-toyota",name:"Sterling McCall Toyota",city:"Houston, TX"},
  {id:"sterling-mccall-vw",name:"Sterling McCall Volkswagen",city:"Houston, TX"},
  {id:"bmw-fairfax",name:"BMW of Fairfax",city:"Fairfax, VA"},
  {id:"mb-fredericksburg",name:"Mercedes-Benz of Fredericksburg",city:"Fredericksburg, VA"},
].sort(function(a,b){ return a.name.localeCompare(b.name); });

// ─── Demo data ─────────────────────────────────────────────────────────────────
var DEMO_INV = {
  "massey-cadillac-orlando": [
    {vin:"1GYS4BKL01",stock:"MC-N1001",year:2025,make:"Cadillac",model:"Escalade",trim:"Premium Luxury",color:"Black Raven",miles:0,price:102995,type:"New",thumb:null},
    {vin:"1GYS4BKL02",stock:"MC-N1002",year:2025,make:"Cadillac",model:"Escalade ESV",trim:"Sport Platinum",color:"Crystal White Tricoat",miles:0,price:114995,type:"New",thumb:null},
    {vin:"1GYS4CKL03",stock:"MC-N1003",year:2025,make:"Cadillac",model:"XT5",trim:"Premium Luxury AWD",color:"Radiant Silver",miles:0,price:57995,type:"New",thumb:null},
    {vin:"1GYS4CKL04",stock:"MC-N1004",year:2025,make:"Cadillac",model:"XT6",trim:"Sport AWD",color:"Stellar Black",miles:0,price:63995,type:"New",thumb:null},
    {vin:"1GYS4CKL05",stock:"MC-N1005",year:2025,make:"Cadillac",model:"CT5",trim:"V-Series Blackwing",color:"Infrared Tintcoat",miles:0,price:94995,type:"New",thumb:null},
    {vin:"1GYS4CKL06",stock:"MC-N1006",year:2025,make:"Cadillac",model:"LYRIQ",trim:"AWD Sport 2",color:"Opulent Blue",miles:0,price:68995,type:"New",thumb:null},
    {vin:"1GYS4BKL07",stock:"MC-U1007",year:2023,make:"Cadillac",model:"Escalade",trim:"Luxury",color:"Black Raven",miles:18400,price:84995,type:"Used",thumb:null},
    {vin:"1GYS4CKL08",stock:"MC-U1008",year:2022,make:"Cadillac",model:"XT5",trim:"Premium Luxury",color:"Moonstone Metallic",miles:31200,price:44995,type:"Used",thumb:null},
    {vin:"1GYS4CKL09",stock:"MC-C1009",year:2023,make:"Cadillac",model:"CT5",trim:"Premium Luxury",color:"Silver Flare",miles:12800,price:52995,type:"CPO",thumb:null},
    {vin:"1GYS4CKL10",stock:"MC-C1010",year:2022,make:"Cadillac",model:"XT6",trim:"Premium Luxury AWD",color:"Shadow Metallic",miles:24100,price:49995,type:"CPO",thumb:null},
  ],
  "massey-cadillac-south-orlando": [
    {vin:"2GYS4BKL01",stock:"MCS-N2001",year:2025,make:"Cadillac",model:"Escalade",trim:"Sport Platinum",color:"Crystal White",miles:0,price:109995,type:"New",thumb:null},
    {vin:"2GYS4BKL02",stock:"MCS-N2002",year:2025,make:"Cadillac",model:"Escalade ESV",trim:"Premium Luxury",color:"Stellar Black",miles:0,price:106995,type:"New",thumb:null},
    {vin:"2GYS4CKL03",stock:"MCS-N2003",year:2025,make:"Cadillac",model:"XT5",trim:"Sport AWD",color:"Radiant Silver",miles:0,price:55995,type:"New",thumb:null},
    {vin:"2GYS4CKL04",stock:"MCS-N2004",year:2025,make:"Cadillac",model:"LYRIQ",trim:"RWD Luxury 2",color:"Opulent Blue",miles:0,price:61995,type:"New",thumb:null},
    {vin:"2GYS4CKL05",stock:"MCS-N2005",year:2025,make:"Cadillac",model:"CT5",trim:"Premium Luxury",color:"Infrared Tintcoat",miles:0,price:54995,type:"New",thumb:null},
    {vin:"2GYS4BKL06",stock:"MCS-U2006",year:2023,make:"Cadillac",model:"Escalade",trim:"Sport Platinum",color:"Black Raven",miles:14200,price:91995,type:"Used",thumb:null},
    {vin:"2GYS4CKL07",stock:"MCS-U2007",year:2022,make:"Cadillac",model:"CT4",trim:"Premium Luxury",color:"Moonstone",miles:28900,price:38995,type:"Used",thumb:null},
    {vin:"2GYS4BKL08",stock:"MCS-C2008",year:2022,make:"Cadillac",model:"Escalade",trim:"Luxury",color:"Silver Flare",miles:22100,price:79995,type:"CPO",thumb:null},
  ],
};

// ─── Constants ─────────────────────────────────────────────────────────────────
var VIDEO_TYPES = ["Official","Walk-around","Trade-in"];
var VT_COLORS   = {"Official":"#ffd700","Walk-around":"#4da6ff","Trade-in":"#ff8c00"};
var TYPE_COLORS = {"New":"#00d97e","Used":"#f5a623","CPO":"#4da6ff"};
var ROLE_COLORS = {
  "Sales":"#4da6ff",
  "Detail / Media":"#00d97e",
  "Manager":"#e8313a",
  "BDC":"#b388ff",
  "Finance":"#f5a623",
  "Photographer – All-Pro":"#ff6b35",
  "All-Pro QC":"#c084fc"
};

// ─── Theme ─────────────────────────────────────────────────────────────────────
var DARK = {
  bg:"#0a0c10",panel:"#0d0f14",border:"#1e2128",border2:"#2a2d35",
  text:"#e8eaf0",sub:"#888888",muted:"#555555",faint:"#3a3d45",
  inp:"#141720",inpBorder:"#1e2128",card:"#0d0f14",accent:"#e8313a",
  scrollThumb:"#2a2d35"
};
var LIGHT = {
  bg:"#f4f5f7",panel:"#ffffff",border:"#e0e2e8",border2:"#c8cad0",
  text:"#111318",sub:"#555555",muted:"#888888",faint:"#aaaaaa",
  inp:"#ffffff",inpBorder:"#d0d2d8",card:"#ffffff",accent:"#e8313a",
  scrollThumb:"#c0c2c8"
};

function getGS(th) {
  return "@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@300;400;500;600&display=swap');" +
    "* { box-sizing: border-box; margin: 0; padding: 0; }" +
    "@keyframes spin { to { transform: rotate(360deg); } }" +
    "@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.2} }" +
    "@keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }" +
    "::-webkit-scrollbar { width: 3px; }" +
    "::-webkit-scrollbar-thumb { background: " + th.scrollThumb + "; border-radius: 2px; }" +
    "input::placeholder, textarea::placeholder { color: " + th.faint + "; }" +
    "select option { background: " + th.inp + "; color: " + th.text + "; }" +
    "body { background: " + th.bg + "; overscroll-behavior: none; }";
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtPrice(n) { return "$" + Number(n || 0).toLocaleString(); }
function fmtMiles(n) { return Number(n || 0).toLocaleString() + " mi"; }
function fmtTime(s)  { return String(Math.floor(s/60)).padStart(2,"0") + ":" + String(s%60).padStart(2,"0"); }
function fmtSize(b)  { return b > 1e6 ? (b/1e6).toFixed(1) + " MB" : Math.round(b/1e3) + " KB"; }
function fmtDate(d)  { return new Date(d).toLocaleDateString(undefined, {month:"short",day:"numeric",year:"numeric"}); }
function randCode()  { return String(Math.floor(100000 + Math.random() * 900000)); }

function inp(th) {
  return {background:th.inp,border:"1px solid "+th.inpBorder,borderRadius:10,padding:"13px 14px",color:th.text,fontSize:15,fontFamily:"'Barlow',sans-serif",outline:"none",width:"100%",WebkitAppearance:"none"};
}
function lbl(th) {
  return {fontSize:10,color:th.muted,letterSpacing:1,textTransform:"uppercase",fontWeight:700,marginTop:12,marginBottom:4,display:"block"};
}
function pbtn(bg) {
  return {width:"100%",padding:14,borderRadius:10,cursor:"pointer",fontSize:15,fontWeight:700,fontFamily:"'Barlow',sans-serif",border:"none",background:bg||"#e8313a",color:"#fff"};
}
function hdr(th) {
  return {background:th.panel,borderBottom:"1px solid "+th.border,padding:"13px 16px",flexShrink:0};
}
function card(th) {
  return {background:th.card,border:"1px solid "+th.border,borderRadius:12};
}
function backBtn(th) {
  return {background:"transparent",border:"none",color:th.sub,cursor:"pointer",fontSize:24,lineHeight:1,padding:"0 4px",flexShrink:0};
}
function rootStyle(th) {
  return {height:"100vh",background:th.bg,display:"flex",flexDirection:"column",fontFamily:"'Barlow',sans-serif",color:th.text};
}

// ─── Small components ──────────────────────────────────────────────────────────
function ErrBox(props) {
  return (
    <div style={{background:"#e8313a18",border:"1px solid #e8313a44",color:"#e8313a",padding:"10px 14px",borderRadius:9,fontSize:13,marginBottom:14,lineHeight:1.4}}>
      {props.msg}
    </div>
  );
}

function InfoBox(props) {
  var c = props.accent || "#4da6ff";
  return (
    <div style={{background:c+"15",border:"1px solid "+c+"44",borderRadius:10,padding:"12px 14px",marginBottom:14,fontSize:13,color:c,lineHeight:1.6,whiteSpace:"pre-line"}}>
      {props.msg}
    </div>
  );
}

function Toast(props) {
  useEffect(function() {
    var t = setTimeout(props.onDone, 2500);
    return function() { clearTimeout(t); };
  }, []);
  return (
    <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:"#00d97e",color:"#0a0c10",padding:"11px 24px",borderRadius:10,fontWeight:700,fontSize:14,zIndex:9999,boxShadow:"0 4px 24px rgba(0,0,0,0.4)",whiteSpace:"nowrap",fontFamily:"'Barlow',sans-serif"}}>
      {props.msg}
    </div>
  );
}

function ConfirmModal(props) {
  var th = props.th;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Barlow',sans-serif"}}>
      <div style={{background:th.panel,border:"1px solid "+th.border,borderRadius:14,padding:"24px 20px",maxWidth:320,width:"100%"}}>
        <div style={{fontSize:15,color:th.text,lineHeight:1.5,marginBottom:20,textAlign:"center"}}>{props.msg}</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={props.onCancel} style={{flex:1,padding:12,borderRadius:9,border:"1px solid "+th.border2,background:"transparent",color:th.sub,cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
          <button onClick={props.onConfirm} style={{flex:1,padding:12,borderRadius:9,border:"none",background:"#e8313a",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>{props.label || "Delete"}</button>
        </div>
      </div>
    </div>
  );
}

function PwInput(props) {
  var th = props.th;
  var [show, setShow] = useState(false);
  return (
    <div style={{position:"relative"}}>
      <input
        style={{...inp(th),paddingRight:46}}
        type={show ? "text" : "password"}
        placeholder={props.placeholder}
        value={props.value}
        onChange={function(e){ props.onChange(e.target.value); }}
        onKeyDown={function(e){ if(e.key==="Enter" && props.onEnter) props.onEnter(); }}
      />
      <button
        onClick={function(){ setShow(function(p){ return !p; }); }}
        style={{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:th.muted,cursor:"pointer",fontSize:15}}
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}

function VTypeBadge(props) {
  var type = props.type;
  var small = props.small;
  var c = VT_COLORS[type] || "#aaa";
  return (
    <span style={{fontSize:small?9:10,fontWeight:800,padding:small?"2px 6px":"3px 9px",borderRadius:4,letterSpacing:0.5,textTransform:"uppercase",background:c+"20",border:"1px solid "+c+"55",color:c,flexShrink:0,whiteSpace:"nowrap"}}>
      {type === "Official" ? "★ " : ""}{type}
    </span>
  );
}

function UploaderChip(props) {
  var vid = props.vid;
  var th = props.th;
  if (!vid || !vid.uploader) return null;
  var c = ROLE_COLORS[vid.role] || "#888";
  return (
    <div style={{display:"flex",alignItems:"center",gap:5,margin:"3px 0 5px"}}>
      <div style={{width:17,height:17,borderRadius:"50%",background:c+"28",border:"1px solid "+c+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:c,flexShrink:0}}>
        {vid.uploader[0].toUpperCase()}
      </div>
      <span style={{fontSize:11,color:th.sub}}>{vid.uploader}</span>
      <span style={{fontSize:9,color:c,background:c+"18",border:"1px solid "+c+"33",padding:"1px 5px",borderRadius:3,fontWeight:700}}>{vid.role}</span>
    </div>
  );
}

function VideoThumb(props) {
  var blob = props.blob;
  var ref = useRef(null);
  var [ready, setReady] = useState(false);
  useEffect(function() {
    if (!blob || !ref.current) return;
    var url = URL.createObjectURL(blob);
    var v = document.createElement("video");
    v.src = url; v.muted = true; v.currentTime = 1; v.preload = "metadata";
    v.onloadeddata = function() {
      var c = ref.current;
      if (!c) return;
      c.width = v.videoWidth || 320;
      c.height = v.videoHeight || 240;
      c.getContext("2d").drawImage(v, 0, 0);
      setReady(true);
      URL.revokeObjectURL(url);
    };
    v.onerror = function() { URL.revokeObjectURL(url); };
  }, [blob]);
  return (
    <div>
      {!ready && (
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,color:"#2a2d35",background:"#141720"}}>🎬</div>
      )}
      <canvas ref={ref} style={{display:ready?"block":"none",position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}} />
    </div>
  );
}

function ThemeBtn(props) {
  var th = props.th;
  return (
    <button
      onClick={props.onToggle}
      style={{background:"transparent",border:"1px solid "+th.border2,color:th.sub,padding:"5px 9px",borderRadius:7,cursor:"pointer",fontSize:14,lineHeight:1}}
    >
      {props.theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

function SonicBadge() {
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="8" fill="#e8313a"/>
      <text x="20" y="28" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Arial,sans-serif">S</text>
    </svg>
  );
}

function DealerPicker(props) {
  var th = props.th;
  var [q, setQ] = useState("");
  var dealers = SONIC_DEALERS.filter(function(d) {
    if (!q) return true;
    return d.name.toLowerCase().includes(q.toLowerCase()) || d.city.toLowerCase().includes(q.toLowerCase());
  });
  var sel = SONIC_DEALERS.find(function(d) { return d.id === props.dealerId; });
  if (sel) {
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#00d97e0d",border:"1px solid #00d97e33",borderRadius:10,padding:"12px 14px",marginBottom:6}}>
        <div>
          <div style={{fontSize:14,color:"#00d97e",fontWeight:700}}>✓ {sel.name}</div>
          <div style={{fontSize:11,color:th.muted}}>{sel.city}</div>
        </div>
        <button onClick={function(){ props.setDealerId(""); }} style={{background:"transparent",border:"none",color:th.muted,cursor:"pointer",fontSize:12,fontFamily:"'Barlow',sans-serif"}}>Change</button>
      </div>
    );
  }
  return (
    <div>
      <input style={{...inp(th),marginBottom:6}} placeholder="Search by name or city…" value={q} onChange={function(e){ setQ(e.target.value); }} />
      <div style={{maxHeight:190,overflowY:"auto",background:th.inp,border:"1px solid "+th.inpBorder,borderRadius:10,marginBottom:4}}>
        {dealers.map(function(d) {
          return (
            <div key={d.id} onClick={function(){ props.setDealerId(d.id); setQ(""); }} style={{padding:"11px 14px",cursor:"pointer",borderBottom:"1px solid "+th.border}}>
              <div style={{fontSize:14,color:th.text,fontWeight:600}}>{d.name}</div>
              <div style={{fontSize:11,color:th.muted}}>{d.city}</div>
            </div>
          );
        })}
        {dealers.length === 0 && <div style={{padding:14,fontSize:13,color:th.muted}}>No results</div>}
      </div>
    </div>
  );
}

// ─── Terms Screen ──────────────────────────────────────────────────────────────
function TermsScreen(props) {
  var th = props.th;
  var terms = [
    {icon:"📹",title:"Video Content",body:"All videos recorded or uploaded through Video Vault are the property of Sonic Automotive and the respective dealership. Videos may not be shared publicly or used outside of authorized customer communications."},
    {icon:"👤",title:"Customer Data",body:"Customer names and contact information entered in the send log are stored within this application only and are never shared with third parties."},
    {icon:"🔒",title:"Account Security",body:"You are responsible for keeping your login credentials secure. Do not share your account with others. Report unauthorized access to your manager immediately."},
    {icon:"📋",title:"Usage Monitoring",body:"Activity within this app is logged and may be reviewed by store management and All-Pro corporate."},
    {icon:"⚖️",title:"Acceptable Use",body:"This application is for authorized Sonic Automotive dealership staff and All-Pro Reconditioning personnel only."},
  ];
  return (
    <div style={{...rootStyle(th),overflowY:"auto"}}>
      <style>{getGS(th)}</style>
      <div style={{...hdr(th),textAlign:"center"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:4}}>
          <SonicBadge />
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:18,letterSpacing:3,color:th.text}}>VIDEO VAULT</span>
        </div>
        <div style={{fontSize:11,color:th.muted}}>Terms of Use</div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"20px 20px 0",maxWidth:460,width:"100%",margin:"0 auto"}}>
        <div style={{fontSize:15,fontWeight:700,color:th.text,marginBottom:12}}>Before you continue</div>
        {terms.map(function(item) {
          return (
            <div key={item.title} style={{marginBottom:16,background:th.card,border:"1px solid "+th.border,borderRadius:10,padding:"12px 14px"}}>
              <div style={{fontSize:13,fontWeight:700,color:th.text,marginBottom:4}}>{item.icon} {item.title}</div>
              <div style={{fontSize:12,color:th.sub,lineHeight:1.6}}>{item.body}</div>
            </div>
          );
        })}
        <div style={{fontSize:10,color:th.faint,textAlign:"center",marginBottom:16,lineHeight:1.5}}>
          By tapping Agree you confirm you are an authorized user of this system.
        </div>
      </div>
      <div style={{padding:"14px 20px 32px",background:th.panel,borderTop:"1px solid "+th.border}}>
        <button onClick={props.onAccept} style={pbtn()}>I Agree — Continue →</button>
      </div>
    </div>
  );
}

// ─── Onboarding ────────────────────────────────────────────────────────────────
function OnboardingScreen(props) {
  var th = props.th;
  var role = props.role;
  var [step, setStep] = useState(0);
  var slides = isAllPro({role:role}) ? [
    {icon:"📷",title:"Your job, simplified",body:"Find each vehicle on the lot, record a short walkaround, save it. The video is permanently attached to that car's stock number."},
    {icon:"🚩",title:"Quality flags",body:"All-Pro QC management reviews your uploads. If a video needs a reshoot you will see a flag on that vehicle."},
    {icon:"📋",title:"Automatic billing",body:"Every video you record is logged with your name, the store, and the date. Your manager exports the billing report at month end."},
  ] : [
    {icon:"🚗",title:"Your inventory, live",body:"Every car on your lot is pulled automatically from the live inventory system. Search by VIN, stock number, make, model, or color."},
    {icon:"📹",title:"Professional videos, ready to send",body:"All-Pro photographers shoot official walkaround videos for every vehicle. They are attached to each car and waiting for you."},
    {icon:"⬆️",title:"Send it personally",body:"Find the car, tap Send, type the customer's name. A personal message is pre-written for you. One tap sends the video straight to their phone."},
  ];
  var slide = slides[step];
  return (
    <div style={{...rootStyle(th),overflowY:"hidden"}}>
      <style>{getGS(th)}</style>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 28px",textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:20}}>{slide.icon}</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,color:th.text,letterSpacing:0.5,marginBottom:12}}>{slide.title}</div>
        <div style={{fontSize:15,color:th.sub,lineHeight:1.7,maxWidth:300}}>{slide.body}</div>
        <div style={{display:"flex",gap:8,marginTop:32}}>
          {slides.map(function(_, i) {
            return (
              <div key={i} style={{width:i===step?24:8,height:8,borderRadius:4,background:i===step?"#e8313a":th.border2,transition:"all 0.2s"}} />
            );
          })}
        </div>
      </div>
      <div style={{padding:"14px 24px 36px",background:th.panel,borderTop:"1px solid "+th.border,display:"flex",gap:12}}>
        {step > 0 && (
          <button onClick={function(){ setStep(function(s){ return s-1; }); }} style={{flex:1,padding:13,borderRadius:10,border:"1px solid "+th.border2,background:"transparent",color:th.sub,cursor:"pointer",fontSize:15,fontFamily:"'Barlow',sans-serif"}}>← Back</button>
        )}
        <button
          onClick={function(){ step < slides.length-1 ? setStep(function(s){ return s+1; }) : props.onDone(); }}
          style={{...pbtn(),flex:2}}
        >
          {step < slides.length-1 ? "Next →" : "Get Started →"}
        </button>
      </div>
    </div>
  );
}

// ─── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen(props) {
  var path = props.path;
  var th = props.th;
  var isAP = path === "allpro";
  var isQP = path === "qc";
  var roles = isAP ? [ALLPRO_ROLE] : (isQP ? [QC_ROLE] : SALES_ROLES);
  var pc = isAP ? "#ff6b35" : (isQP ? "#c084fc" : "#4da6ff");
  var pl = isAP ? "All-Pro Photographer" : (isQP ? "All-Pro QC" : "Sales Staff");

  var [tab, setTab]         = useState("login");
  var [name, setName]       = useState("");
  var [email, setEmail]     = useState("");
  var [pw, setPw]           = useState("");
  var [role, setRole]       = useState(roles[0]);
  var [dealerId, setDealer] = useState("");
  var [invCode, setInvCode] = useState("");
  var [err, setErr]         = useState("");
  var [info, setInfo]       = useState("");
  var [sentCode, setSent]   = useState("");
  var [pending, setPending] = useState(null);
  var [digits, setDigits]   = useState(["","","","","",""]);
  var [step, setStep]       = useState("form");
  var d0=useRef(),d1=useRef(),d2=useRef(),d3=useRef(),d4=useRef(),d5=useRef();
  var dRefs = [d0,d1,d2,d3,d4,d5];

  function clr() { setErr(""); setInfo(""); }

  function doLogin() {
    clr();
    if (!email || !pw) return setErr("Enter your email and password.");
    var u = getUsers()[email.toLowerCase()];
    if (!u) return setErr("No account found with that email.");
    if (!u.verified) return setErr("Account not verified. Check your email for the code.");
    if (u.password !== pw) return setErr("Incorrect password.");
    if (isQP && u.role !== QC_ROLE) return setErr("This is not a QC account.");
    if (isAP && u.role !== ALLPRO_ROLE) return setErr("This is not an All-Pro account.");
    if (!isAP && !isQP && (u.role === ALLPRO_ROLE || u.role === QC_ROLE)) return setErr("Please use the correct login path.");
    saveSession(u); props.onLogin(u);
  }

  function doSignup() {
    clr();
    if (!name.trim()) return setErr("Enter your full name.");
    if (!email.includes("@")) return setErr("Enter a valid work email.");
    if (pw.length < 6) return setErr("Password must be at least 6 characters.");
    if (isQP && invCode.trim().toUpperCase() !== QC_INVITE_CODE) return setErr("Invalid invite code. Contact All-Pro management.");
    if (!isQP && !dealerId) return setErr("Select your dealership.");
    var users = getUsers();
    if (users[email.toLowerCase()] && users[email.toLowerCase()].verified) return setErr("Account already exists.");
    var d = !isQP ? SONIC_DEALERS.find(function(x){ return x.id === dealerId; }) : null;
    var code = randCode();
    setSent(code);
    setPending({
      email: email.toLowerCase(), password: pw, name: name.trim(), role: role,
      dealerId: isQP ? "allpro-qc" : dealerId,
      dealerName: isQP ? "All-Pro QC" : d.name,
      dealerCity: isQP ? "All Stores" : d.city,
      verified: false
    });
    setDigits(["","","","","",""]);
    setStep("verify");
    setInfo("📧 Code sent to " + email + ".\n\n🔑 Demo code: " + code);
  }

  function doVerify() {
    clr();
    var entered = digits.join("");
    if (entered.length < 6) return setErr("Enter the full 6-digit code.");
    if (entered !== sentCode) return setErr("Incorrect code.");
    var users = getUsers();
    var verified = Object.assign({}, pending, {verified:true});
    users[verified.email] = verified;
    saveUsers(users); saveSession(verified); props.onLogin(verified);
  }

  function onDigit(i, val) {
    var v = val.replace(/\D/g,"").slice(-1);
    var next = digits.slice();
    next[i] = v;
    setDigits(next);
    if (v && i < 5 && dRefs[i+1].current) dRefs[i+1].current.focus();
  }
  function onKey(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0 && dRefs[i-1].current) dRefs[i-1].current.focus();
  }
  function onPaste(e) {
    var p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    if (p.length === 6) { setDigits(p.split("")); if(dRefs[5].current) dRefs[5].current.focus(); e.preventDefault(); }
  }

  return (
    <div style={{minHeight:"100vh",background:th.bg,display:"flex",flexDirection:"column",fontFamily:"'Barlow',sans-serif"}}>
      <style>{getGS(th)}</style>
      <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
        <button onClick={props.onBack} style={backBtn(th)}>←</button>
        <div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:18,letterSpacing:2,color:th.text}}>VIDEO VAULT</div>
          <div style={{fontSize:10,color:pc,fontWeight:700,letterSpacing:0.5}}>{pl}</div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"24px 20px 48px",maxWidth:460,width:"100%",margin:"0 auto"}}>
        {step === "form" && (
          <div>
            <div style={{display:"flex",background:th.inp,borderRadius:10,padding:4,marginBottom:22}}>
              {[["login","Sign In"],["signup","Create Account"]].map(function(item) {
                var tb = item[0]; var tl = item[1];
                return (
                  <button key={tb} onClick={function(){ setTab(tb); clr(); }} style={{flex:1,padding:"10px 0",background:tab===tb?th.panel:"transparent",border:"none",color:tab===tb?th.text:th.muted,cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"'Barlow',sans-serif",borderRadius:7}}>{tl}</button>
                );
              })}
            </div>
            {err && <ErrBox msg={err} />}
            {tab === "login" && (
              <div>
                <span style={lbl(th)}>Work Email</span>
                <input style={inp(th)} type="email" inputMode="email" autoCapitalize="none" placeholder="you@dealership.com" value={email} onChange={function(e){ setEmail(e.target.value); }} />
                <span style={lbl(th)}>Password</span>
                <PwInput value={pw} onChange={setPw} onEnter={doLogin} placeholder="••••••••" th={th} />
                <button onClick={doLogin} style={{...pbtn(pc),marginTop:20}}>Sign In →</button>
              </div>
            )}
            {tab === "signup" && (
              <div>
                <span style={lbl(th)}>Full Name</span>
                <input style={inp(th)} placeholder="Your name" value={name} onChange={function(e){ setName(e.target.value); }} />
                <span style={lbl(th)}>Work Email</span>
                <input style={inp(th)} type="email" inputMode="email" autoCapitalize="none" placeholder="you@dealership.com" value={email} onChange={function(e){ setEmail(e.target.value); }} />
                <span style={lbl(th)}>Password</span>
                <PwInput value={pw} onChange={setPw} placeholder="Min. 6 characters" th={th} />
                {!isAP && !isQP && (
                  <div>
                    <span style={lbl(th)}>Your Role</span>
                    <select style={inp(th)} value={role} onChange={function(e){ setRole(e.target.value); }}>
                      {roles.map(function(r) { return <option key={r} value={r}>{r}</option>; })}
                    </select>
                  </div>
                )}
                {isQP && (
                  <div>
                    <span style={lbl(th)}>Invite Code</span>
                    <input style={{...inp(th),letterSpacing:2}} placeholder="Enter your QC invite code" value={invCode} onChange={function(e){ setInvCode(e.target.value.toUpperCase()); }} />
                    <div style={{fontSize:10,color:th.muted,marginTop:4}}>Contact All-Pro management if you do not have a code.</div>
                  </div>
                )}
                {!isQP && (
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={lbl(th)}>Your Dealership</span>
                      <span style={{fontSize:9,color:th.faint,marginTop:12}}>{SONIC_DEALERS.length} locations</span>
                    </div>
                    <DealerPicker dealerId={dealerId} setDealerId={setDealer} th={th} />
                  </div>
                )}
                <button onClick={doSignup} style={{...pbtn(pc),marginTop:20}}>Send Confirmation Code →</button>
              </div>
            )}
          </div>
        )}
        {step === "verify" && (
          <div>
            <div style={{textAlign:"center",marginBottom:22}}>
              <div style={{fontSize:44,marginBottom:10}}>📧</div>
              <div style={{fontSize:18,fontWeight:700,color:th.text,marginBottom:6}}>Check your email</div>
              <div style={{fontSize:13,color:th.muted,lineHeight:1.5}}>We sent a 6-digit code to<br /><span style={{color:th.text,fontWeight:600}}>{email}</span></div>
            </div>
            {info && <InfoBox msg={info} />}
            {err && <ErrBox msg={err} />}
            <div style={{display:"flex",gap:8,justifyContent:"center",margin:"8px 0 22px"}}>
              {digits.map(function(d, i) {
                return (
                  <input
                    key={i}
                    ref={dRefs[i]}
                    style={{width:46,height:58,textAlign:"center",fontSize:24,fontWeight:700,background:th.inp,border:"2px solid "+(d ? pc : th.border),borderRadius:10,color:th.text,outline:"none",fontFamily:"'Barlow',sans-serif"}}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={function(e){ onDigit(i, e.target.value); }}
                    onKeyDown={function(e){ onKey(i, e); }}
                    onPaste={onPaste}
                  />
                );
              })}
            </div>
            <button onClick={doVerify} style={pbtn(pc)}>Verify and Create Account →</button>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
              <button onClick={function(){ setStep("form"); clr(); setDigits(["","","","","",""]); }} style={{background:"none",border:"none",color:th.muted,fontSize:13,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>← Back</button>
              <button onClick={function(){ var c=randCode(); setSent(c); setDigits(["","","","","",""]); setInfo("📧 New code sent.\n\n🔑 Demo code: "+c); }} style={{background:"none",border:"none",color:pc,fontSize:13,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>Resend code</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Home Screen ───────────────────────────────────────────────────────────────
function HomeScreen(props) {
  var th = props.th;
  return (
    <div style={{minHeight:"100vh",background:th.bg,display:"flex",flexDirection:"column",fontFamily:"'Barlow',sans-serif"}}>
      <style>{getGS(th)}</style>
      <div style={{background:th.panel,borderBottom:"1px solid "+th.border,padding:"20px 20px 16px"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <SonicBadge />
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:22,letterSpacing:3,color:th.text,lineHeight:1}}>VIDEO VAULT</div>
              <div style={{fontSize:9,color:th.muted,letterSpacing:2,textTransform:"uppercase",marginTop:3}}>Sonic Automotive · Dealership Media</div>
            </div>
          </div>
          <ThemeBtn theme={props.theme} onToggle={props.onToggle} th={th} />
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"28px 24px 0",gap:14,maxWidth:420,width:"100%",margin:"0 auto"}}>
        <div style={{fontSize:13,color:th.muted,textAlign:"center",marginBottom:4}}>Select your role to continue</div>
        <button onClick={function(){ props.onPath("sales"); }} style={{background:th.card,border:"1px solid "+th.border,borderRadius:14,padding:"20px 18px",cursor:"pointer",textAlign:"left",width:"100%"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:50,height:50,borderRadius:12,background:"#4da6ff18",border:"1px solid #4da6ff33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>💼</div>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,color:th.text,letterSpacing:0.5,marginBottom:2}}>Sales Staff</div>
              <div style={{fontSize:12,color:th.muted,lineHeight:1.5}}>Sales, Managers, BDC, Finance, Detail</div>
            </div>
            <div style={{marginLeft:"auto",color:th.faint,fontSize:20,flexShrink:0}}>›</div>
          </div>
        </button>
        <button onClick={function(){ props.onPath("allpro"); }} style={{background:th.card,border:"1px solid "+th.border,borderRadius:14,padding:"20px 18px",cursor:"pointer",textAlign:"left",width:"100%"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:50,height:50,borderRadius:12,background:"#ff6b3518",border:"1px solid #ff6b3533",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📷</div>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,color:th.text,letterSpacing:0.5,marginBottom:2}}>All-Pro Photographer</div>
              <div style={{fontSize:12,color:th.muted,lineHeight:1.5}}>All-Pro Reconditioning · Shoot · Log · Bill</div>
            </div>
            <div style={{marginLeft:"auto",color:th.faint,fontSize:20,flexShrink:0}}>›</div>
          </div>
        </button>
        <div style={{textAlign:"center",paddingTop:10,paddingBottom:24}}>
          <button onClick={function(){ props.onPath("qc"); }} style={{background:"none",border:"none",color:th.faint,fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif",textDecoration:"underline"}}>All-Pro QC Access</button>
          <div style={{fontSize:9,color:th.faint,opacity:0.4,letterSpacing:1,marginTop:8}}>SONIC AUTOMOTIVE EXCLUSIVE · VIDEO VAULT</div>
        </div>
      </div>
    </div>
  );
}

// ─── Share Composer ────────────────────────────────────────────────────────────
function ShareComposer(props) {
  var vid = props.vid; var vehicle = props.vehicle; var sender = props.sender; var th = props.th;
  var [lang, setLang]       = useState("en");
  var [custName, setCust]   = useState("");
  var [custContact, setCtc] = useState("");
  var [msg, setMsg]         = useState("");
  var [sending, setSending] = useState(false);

  function buildMsg(name, l) {
    var n = name || "there";
    var car = vehicle ? (vehicle.year + " " + vehicle.make + " " + vehicle.model + " " + (vehicle.trim || "")) : "the vehicle";
    var stock = vehicle ? ("Stock #" + vehicle.stock) : "";
    if (l === "es") return "Hola " + n + ", acabo de preparar un video personal del " + car + " en el que estabas interesado — " + stock + ".\n\nEchale un vistazo y dime que te parece.\n\n— " + sender;
    return "Hi " + n + ", I just pulled up a personal video of the " + car + " you were interested in — " + stock + ".\n\nTake a look and let me know what you think!\n\n— " + sender;
  }

  useEffect(function() { setMsg(buildMsg(custName, lang)); }, [custName, lang]);

  function handleSend() {
    setSending(true);
    if (vid.isDemo) {
      setTimeout(function() {
        setSending(false);
        props.onSend({custName:custName||"Customer",custContact:custContact,msg:msg,sentAt:new Date().toISOString()});
      }, 800);
      return;
    }
    var ext = vid.blob.type.includes("mp4") ? ".mp4" : ".webm";
    var file = new File([vid.blob], vid.name + ext, {type:vid.blob.type});
    var shared = false;
    var doShare = function() {
      if (navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
        navigator.share({title:vehicle ? (vehicle.year+" "+vehicle.make+" "+vehicle.model) : "Video", text:msg, files:[file]})
          .then(function(){ shared = true; finish(); })
          .catch(function(err){ if (err.name === "AbortError") { setSending(false); return; } finish(); });
      } else {
        finish();
      }
    };
    function finish() {
      if (!shared) {
        try { navigator.clipboard.writeText(msg); } catch(e) {}
        var a = document.createElement("a"); a.href = URL.createObjectURL(vid.blob); a.download = vid.name + ext; a.click();
      }
      setSending(false);
      props.onSend({custName:custName||"Customer",custContact:custContact,msg:msg,sentAt:new Date().toISOString()});
    }
    doShare();
  }

  return (
    <div style={rootStyle(th)}>
      <style>{getGS(th)}</style>
      <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
        <button onClick={props.onClose} style={backBtn(th)}>←</button>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:700,color:th.text}}>Send Video</div>
          <div style={{fontSize:11,color:th.muted}}>{vehicle ? (vehicle.year+" "+vehicle.make+" "+vehicle.model+" · #"+vehicle.stock) : ""}</div>
        </div>
        <VTypeBadge type={vid.videoType} small={true} />
      </div>
      <div style={{flex:1,overflowY:"auto",padding:16}}>
        {vid.isDemo && <InfoBox msg="🎬 Demo mode — in production the real video file attaches here." accent="#ffd700" />}
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {[["en","🇺🇸 English"],["es","🇪🇸 Español"]].map(function(item) {
            var l = item[0]; var lbl2 = item[1];
            return (
              <button key={l} onClick={function(){ setLang(l); }} style={{flex:1,padding:"8px 0",background:lang===l?"#4da6ff18":"transparent",border:lang===l?"1px solid #4da6ff55":"1px solid "+th.border,borderRadius:8,color:lang===l?"#4da6ff":th.muted,fontSize:12,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700}}>{lbl2}</button>
            );
          })}
        </div>
        <span style={lbl(th)}>Customer Name</span>
        <input style={inp(th)} placeholder={lang==="es"?"Ej. Juan Garcia":"e.g. John Smith"} value={custName} onChange={function(e){ setCust(e.target.value); }} />
        <span style={lbl(th)}>{lang==="es" ? "Telefono o Correo (opcional)" : "Phone or Email (optional)"}</span>
        <input style={inp(th)} placeholder={lang==="es"?"Para sus registros":"For your records"} value={custContact} onChange={function(e){ setCtc(e.target.value); }} />
        <span style={lbl(th)}>{lang==="es" ? "Mensaje" : "Message"}</span>
        <textarea value={msg} onChange={function(e){ setMsg(e.target.value); }} style={{...inp(th),height:160,resize:"none",lineHeight:1.55,fontSize:14}} />
        <div style={{background:th.inp,border:"1px solid "+th.border,borderRadius:9,padding:"10px 14px",marginTop:10,fontSize:12,color:th.muted,lineHeight:1.5}}>
          📎 {lang==="es" ? "En movil el video se adjunta directamente." : "On mobile the video attaches directly. On desktop it downloads and the message copies to clipboard."}
        </div>
      </div>
      <div style={{padding:"14px 16px 28px",background:th.panel,borderTop:"1px solid "+th.border,flexShrink:0}}>
        <button onClick={handleSend} disabled={sending} style={{...pbtn("#00d97e"),opacity:sending?0.6:1,fontSize:16}}>
          {sending ? (lang==="es"?"Enviando…":"Sending…") : (lang==="es"?"⬆ Enviar a "+(custName||"Cliente"):"⬆ Send to "+(custName||"Customer"))}
        </button>
      </div>
    </div>
  );
}

// ─── Sent Log ──────────────────────────────────────────────────────────────────
function SentLog(props) {
  var th = props.th; var log = props.log; var vehicle = props.vehicle;
  var isManagerUser = props.isManager;
  var [passkey, setPasskey]     = useState("");
  var [passkeyInput, setPKInput] = useState("");
  var [pkError, setPKError]     = useState("");
  var [showPK, setShowPK]       = useState(false);
  var [unlocked, setUnlocked]   = useState(false);

  // Manager passkey — stored per session when manager first sets/enters it
  var MANAGER_PK = "1234"; // default, manager can change in settings later

  function tryUnlock() {
    if (passkeyInput === MANAGER_PK) {
      setUnlocked(true); setShowPK(false); setPKError("");
    } else {
      setPKError("Incorrect passkey.");
    }
  }

  return (
    <div style={rootStyle(th)}>
      <style>{getGS(th)}</style>
      {showPK && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Barlow',sans-serif"}}>
          <div style={{background:th.panel,border:"1px solid "+th.border,borderRadius:14,padding:"24px 20px",maxWidth:320,width:"100%"}}>
            <div style={{fontSize:16,fontWeight:700,color:th.text,marginBottom:4,textAlign:"center"}}>🔐 Manager Access</div>
            <div style={{fontSize:12,color:th.muted,textAlign:"center",marginBottom:16,lineHeight:1.5}}>Enter your manager passkey to view full message details and customer contact info.</div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Passkey"
              value={passkeyInput}
              onChange={function(e){ setPKInput(e.target.value); setPKError(""); }}
              onKeyDown={function(e){ if(e.key==="Enter") tryUnlock(); }}
              style={{...inp(th),fontSize:20,letterSpacing:6,textAlign:"center",marginBottom:10}}
            />
            {pkError && <div style={{fontSize:12,color:"#e8313a",textAlign:"center",marginBottom:10}}>{pkError}</div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={function(){ setShowPK(false); setPKInput(""); setPKError(""); }} style={{flex:1,padding:12,borderRadius:9,border:"1px solid "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:14,fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
              <button onClick={tryUnlock} style={{flex:1,padding:12,borderRadius:9,border:"none",background:"#e8313a",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>Unlock</button>
            </div>
          </div>
        </div>
      )}
      <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
        <button onClick={props.onClose} style={backBtn(th)}>←</button>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:700,color:th.text}}>Sent Log</div>
          <div style={{fontSize:11,color:th.muted}}>{vehicle ? (vehicle.year+" "+vehicle.make+" "+vehicle.model+" · #"+vehicle.stock) : ""}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {isManagerUser && !unlocked && (
            <button onClick={function(){ setShowPK(true); }} style={{background:"#e8313a18",border:"1px solid #e8313a44",color:"#e8313a",padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>🔐 Unlock</button>
          )}
          {unlocked && (
            <span style={{fontSize:10,color:"#00d97e",fontWeight:700}}>🔓 Manager View</span>
          )}
          <span style={{fontSize:12,color:th.muted}}>{log.length} sent</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:14}}>
        {log.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",color:th.faint}}>
            <div style={{fontSize:44,marginBottom:10}}>📤</div>
            <div>No videos sent yet</div>
          </div>
        ) : log.slice().reverse().map(function(e, i) {
          return (
            <div key={i} style={{...card(th),padding:"12px 14px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:th.text,marginBottom:2}}>{e.custName}</div>
                  <div style={{fontSize:11,color:th.muted}}>Sent by <span style={{color:ROLE_COLORS["Sales"]||"#4da6ff",fontWeight:600}}>{e.sentBy}</span> · {fmtDate(e.sentAt)}</div>
                </div>
                <VTypeBadge type={e.videoType||"Walk-around"} small={true} />
              </div>
              {unlocked && (
                <div style={{borderTop:"1px solid "+th.border,paddingTop:8,marginTop:4}}>
                  {e.custContact && <div style={{fontSize:12,color:th.muted,marginBottom:6}}>📞 {e.custContact}</div>}
                  <div style={{fontSize:11,color:th.muted,fontStyle:"italic",lineHeight:1.4}}>"{(e.msg||"").slice(0,160)}{(e.msg||"").length>160?"…":""}"</div>
                </div>
              )}
              {!unlocked && isManagerUser && (
                <div style={{borderTop:"1px solid "+th.border,paddingTop:8,marginTop:4}}>
                  <div style={{fontSize:11,color:th.faint,fontStyle:"italic"}}>🔐 Tap Unlock to view message and contact details</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Billing Report ────────────────────────────────────────────────────────────
function BillingReport(props) {
  var th = props.th; var videos = props.videos; var inventory = props.inventory;
  var [startDate, setStart] = useState("");
  var [endDate, setEnd]     = useState("");
  var [rf, setRf]           = useState("All-Pro");

  var allVids = [];
  Object.keys(videos).forEach(function(vin) {
    var veh = inventory.find(function(v){ return v.vin === vin; });
    (videos[vin] || []).forEach(function(v) {
      if (!v.isDemo) allVids.push(Object.assign({}, v, {vin:vin, veh:veh}));
    });
  });

  var filtered = allVids.filter(function(v) {
    var matchRole = rf === "All-Pro" ? v.role === ALLPRO_ROLE : true;
    var d = new Date(v.date || Date.now());
    var after = !startDate || d >= new Date(startDate);
    var before = !endDate || d <= new Date(endDate + "T23:59:59");
    return matchRole && after && before;
  }).sort(function(a,b){ return new Date(b.date||0) - new Date(a.date||0); });

  var apCount = filtered.filter(function(v){ return v.role === ALLPRO_ROLE; }).length;

  function exportCSV() {
    var header = "Date,Photographer,Role,Vehicle,Stock #,VIN,Video Type,Store";
    var rows = filtered.map(function(v) {
      return [
        fmtDate(v.date||new Date()), v.uploader, v.role,
        v.veh ? (v.veh.year+" "+v.veh.make+" "+v.veh.model) : "Unknown",
        v.veh ? v.veh.stock : v.vin, v.vin, v.videoType, props.dealerName
      ].map(function(c){ return '"' + String(c).replace(/"/g,'""') + '"'; }).join(",");
    });
    var blob = new Blob([[header].concat(rows).join("\n")], {type:"text/csv"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "VideoVault-Billing-" + props.dealerName.replace(/\s+/g,"-") + "-" + new Date().toISOString().slice(0,10) + ".csv";
    a.click();
  }

  var summaryItems = [
    {val:apCount, label:"All-Pro Videos", clr:"#ff6b35"},
    {val:filtered.length, label:"Total Videos", clr:"#00d97e"},
    {val:"Est. $" + (apCount*2).toLocaleString(), label:"@ $2/video", clr:"#ffd700"},
  ];

  return (
    <div style={rootStyle(th)}>
      <style>{getGS(th)}</style>
      <div style={{...hdr(th)}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <button onClick={props.onClose} style={backBtn(th)}>←</button>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:700,color:th.text}}>Billing Report</div>
            <div style={{fontSize:11,color:th.muted}}>{props.dealerName} · {props.dealerCity}</div>
          </div>
          <button onClick={exportCSV} style={{background:"#00d97e18",border:"1px solid #00d97e44",color:"#00d97e",padding:"7px 13px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>↓ CSV</button>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <div style={{flex:1}}>
            <span style={lbl(th)}>From</span>
            <input type="date" style={{...inp(th),padding:"8px 10px",fontSize:13}} value={startDate} onChange={function(e){ setStart(e.target.value); }} />
          </div>
          <div style={{flex:1}}>
            <span style={lbl(th)}>To</span>
            <input type="date" style={{...inp(th),padding:"8px 10px",fontSize:13}} value={endDate} onChange={function(e){ setEnd(e.target.value); }} />
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["All-Pro","All-Pro Only"],["All","All Staff"]].map(function(item) {
            var val = item[0]; var lbl2 = item[1];
            return (
              <button key={val} onClick={function(){ setRf(val); }} style={{flex:1,padding:"7px 0",background:rf===val?"#ff6b3518":"transparent",border:rf===val?"1px solid #ff6b3555":"1px solid "+th.border,borderRadius:7,color:rf===val?"#ff6b35":th.muted,fontSize:12,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700}}>{lbl2}</button>
            );
          })}
        </div>
      </div>
      <div style={{background:th.panel,borderBottom:"1px solid "+th.border,padding:"12px 16px",flexShrink:0}}>
        <div style={{display:"flex",gap:10}}>
          {summaryItems.map(function(item) {
            return (
              <div key={item.label} style={{flex:1,background:th.inp,border:"1px solid "+th.border,borderRadius:9,padding:"10px 14px"}}>
                <div style={{fontSize:22,fontWeight:800,color:item.clr,fontFamily:"'Barlow Condensed',sans-serif"}}>{item.val}</div>
                <div style={{fontSize:9,color:th.muted,textTransform:"uppercase",letterSpacing:1,marginTop:2}}>{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:14}}>
        {filtered.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",color:th.faint}}>
            <div style={{fontSize:44,marginBottom:10}}>📋</div>
            <div>No entries match</div>
          </div>
        ) : filtered.map(function(v, i) {
          var isAP = v.role === ALLPRO_ROLE;
          var rc = ROLE_COLORS[v.role] || "#888";
          return (
            <div key={i} style={{...card(th),padding:"11px 14px",marginBottom:8,display:"flex",gap:12,alignItems:"center"}}>
              <div style={{width:36,height:36,borderRadius:8,background:rc+"20",border:"1px solid "+rc+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{isAP ? "📷" : "🎬"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:th.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.veh ? (v.veh.year+" "+v.veh.make+" "+v.veh.model) : v.vin}</div>
                <div style={{fontSize:10,color:th.muted,marginTop:2,display:"flex",gap:8}}>
                  {v.veh && <span>#{v.veh.stock}</span>}
                  <span>{fmtDate(v.date||new Date())}</span>
                  <span style={{color:rc}}>{v.uploader}</span>
                </div>
              </div>
              <div style={{flexShrink:0,textAlign:"right"}}>
                <VTypeBadge type={v.videoType} small={true} />
                {isAP && <div style={{fontSize:9,color:"#ffd700",fontWeight:700,marginTop:4}}>$2.00</div>}
              </div>
            </div>
          );
        })}
        <div style={{textAlign:"center",padding:"20px 0 8px",fontSize:9,color:th.faint,letterSpacing:1}}>POWERED BY VIDEO VAULT · SONIC AUTOMOTIVE EXCLUSIVE</div>
      </div>
    </div>
  );
}

// ─── QC Feed ───────────────────────────────────────────────────────────────────
function QCFeed(props) {
  var th = props.th; var videos = props.videos; var user = props.user;
  var [storeF, setStoreF]   = useState("All");
  var [flagged, setFlagged] = useState(false);
  var [flags, setFlags]     = useState({});
  var [flagging, setFlagging] = useState(null);
  var [flagNote, setFlagNote] = useState("");
  var [playVid, setPlayVid] = useState(null);

  var allEntries = [];
  Object.keys(videos).forEach(function(vin) {
    (videos[vin] || []).forEach(function(v) {
      if (v.role === ALLPRO_ROLE && !v.isDemo) allEntries.push(Object.assign({}, v, {vin:vin}));
    });
  });
  allEntries.sort(function(a,b){ return new Date(b.date||0) - new Date(a.date||0); });

  var stores = ["All"].concat(allEntries.map(function(v){ return v.dealerName; }).filter(function(v,i,a){ return v && a.indexOf(v)===i; }));
  var filtered = allEntries.filter(function(v) {
    var ms = storeF === "All" || v.dealerName === storeF;
    var mf = !flagged || flags[v.id];
    return ms && mf;
  });

  function flagVideo(vid) {
    if (!flagNote.trim()) return;
    var newFlags = Object.assign({}, flags);
    newFlags[vid.id] = {reason:flagNote.trim(), flaggedBy:user.name, flaggedAt:new Date().toISOString()};
    setFlags(newFlags); setFlagging(null); setFlagNote("");
  }
  function unflag(id) {
    var newFlags = Object.assign({}, flags);
    delete newFlags[id];
    setFlags(newFlags);
  }

  if (playVid) {
    return (
      <div style={rootStyle(th)}>
        <style>{getGS(th)}</style>
        <div style={{...hdr(th),display:"flex",alignItems:"center",gap:12}}>
          <button onClick={function(){ setPlayVid(null); }} style={backBtn(th)}>←</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:th.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{playVid.name}</div>
            <div style={{fontSize:10,color:"#ff6b35"}}>{playVid.dealerName} · {playVid.uploader}</div>
          </div>
          <VTypeBadge type={playVid.videoType} small={true} />
        </div>
        <video src={URL.createObjectURL(playVid.blob)} controls autoPlay playsInline style={{flex:1,width:"100%",background:"#000",objectFit:"contain"}} />
        <div style={{padding:"12px 16px 28px",background:th.panel,borderTop:"1px solid "+th.border}}>
          {flags[playVid.id] && (
            <div style={{background:"#e8313a12",border:"1px solid #e8313a33",borderRadius:9,padding:"10px 14px",marginBottom:10}}>
              <div style={{fontSize:12,color:"#e8313a",fontWeight:700,marginBottom:2}}>🚩 {flags[playVid.id].reason}</div>
              <div style={{fontSize:9,color:th.muted}}>Flagged by {flags[playVid.id].flaggedBy}</div>
            </div>
          )}
          {!flags[playVid.id] ? (
            <button onClick={function(){ setFlagging(playVid.id); setPlayVid(null); }} style={pbtn()}>🚩 Flag for Reshoot</button>
          ) : (
            <button onClick={function(){ unflag(playVid.id); }} style={{...pbtn("transparent"),border:"1px solid "+th.border2,color:th.muted}}>Remove Flag</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={rootStyle(th)}>
      <style>{getGS(th)}</style>
      {flagging && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:500,display:"flex",alignItems:"flex-end",fontFamily:"'Barlow',sans-serif"}}>
          <div style={{background:th.panel,border:"1px solid "+th.border,borderRadius:"14px 14px 0 0",padding:"22px 18px 36px",width:"100%"}}>
            <div style={{fontSize:15,fontWeight:700,color:th.text,marginBottom:6}}>🚩 Flag for Reshoot</div>
            <div style={{fontSize:12,color:th.muted,marginBottom:14}}>Explain what needs to be reshot.</div>
            <textarea value={flagNote} onChange={function(e){ setFlagNote(e.target.value); }} placeholder="e.g. Too dark, missed interior, blocked by another car..." style={{...inp(th),height:90,resize:"none",fontSize:14,lineHeight:1.5,marginBottom:12}} />
            <div style={{display:"flex",gap:10}}>
              <button onClick={function(){ setFlagging(null); setFlagNote(""); }} style={{flex:1,padding:12,borderRadius:9,border:"1px solid "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:14,fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
              <button onClick={function(){ var vid = allEntries.find(function(x){ return x.id === flagging; }); if(vid) flagVideo(vid); }} style={{flex:1,padding:12,borderRadius:9,border:"none",background:"#e8313a",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>Submit Flag</button>
            </div>
          </div>
        </div>
      )}
      <div style={{...hdr(th)}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <button onClick={props.onClose} style={backBtn(th)}>←</button>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:17,letterSpacing:2,color:th.text}}>QC REVIEW</div>
            <div style={{fontSize:9,color:"#c084fc",letterSpacing:1,textTransform:"uppercase"}}>All-Pro Quality Control · All Stores</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:18,fontWeight:800,color:th.text,fontFamily:"'Barlow Condensed',sans-serif"}}>{allEntries.length}</div>
            <div style={{fontSize:9,color:th.muted}}>total</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,marginBottom:8}}>
          {stores.map(function(s) {
            return (
              <button key={s} onClick={function(){ setStoreF(s); }} style={{flexShrink:0,padding:"6px 12px",background:storeF===s?"#c084fc18":"transparent",border:storeF===s?"1px solid #c084fc55":"1px solid "+th.border,borderRadius:7,color:storeF===s?"#c084fc":th.muted,fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:600,whiteSpace:"nowrap"}}>
                {s === "All" ? "All Stores" : s}
              </button>
            );
          })}
        </div>
        <button onClick={function(){ setFlagged(function(p){ return !p; }); }} style={{width:"100%",padding:"8px 0",background:flagged?"#e8313a18":"transparent",border:flagged?"1px solid #e8313a55":"1px solid "+th.border,borderRadius:8,color:flagged?"#e8313a":th.muted,fontSize:12,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700}}>
          {flagged ? "🚩 Showing Flagged Only" : "Show All Videos"}
          {Object.keys(flags).length > 0 && <span style={{marginLeft:8,background:"#e8313a",color:"#fff",padding:"1px 6px",borderRadius:10,fontSize:10}}>{Object.keys(flags).length}</span>}
        </button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:12}}>
        <div style={{fontSize:10,color:th.faint,letterSpacing:1,textTransform:"uppercase",padding:"2px 2px 8px"}}>{filtered.length} videos</div>
        {filtered.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 20px",color:th.faint}}>
            <div style={{fontSize:44,marginBottom:10}}>📋</div>
            <div>No All-Pro videos uploaded yet</div>
          </div>
        ) : filtered.map(function(vid, i) {
          var isFlagged = !!flags[vid.id];
          var flagInfo = flags[vid.id];
          return (
            <div key={vid.id + "-" + i} style={{...card(th),overflow:"hidden",border:isFlagged?"1px solid #e8313a44":"1px solid "+th.border,marginBottom:10}}>
              <div style={{position:"relative",paddingTop:"45%",background:"#141720",cursor:"pointer"}} onClick={function(){ setPlayVid(vid); }}>
                <VideoThumb blob={vid.blob} />
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.22)"}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(232,49,58,0.88)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#fff",paddingLeft:3}}>▶</div>
                </div>
                <div style={{position:"absolute",top:8,left:8}}><VTypeBadge type={vid.videoType} small={true} /></div>
                {isFlagged && <div style={{position:"absolute",top:8,right:8,background:"#e8313a",color:"#fff",padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:800}}>🚩 RESHOOT</div>}
              </div>
              <div style={{padding:"10px 12px 12px"}}>
                <div style={{fontSize:13,fontWeight:600,color:th.text,marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{vid.name}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                  <span style={{fontSize:10,color:"#ff6b35",background:"#ff6b3512",border:"1px solid #ff6b3533",padding:"1px 7px",borderRadius:3,fontWeight:700}}>📍 {vid.dealerName || "Unknown"}</span>
                  <span style={{fontSize:10,color:"#c084fc",background:"#c084fc12",border:"1px solid #c084fc33",padding:"1px 7px",borderRadius:3,fontWeight:700}}>📷 {vid.uploader}</span>
                </div>
                <div style={{fontSize:10,color:th.faint,marginBottom:isFlagged?6:10}}>{fmtDate(vid.date)}</div>
                {isFlagged && (
                  <div style={{background:"#e8313a12",border:"1px solid #e8313a33",borderRadius:7,padding:"7px 10px",marginBottom:8}}>
                    <div style={{fontSize:11,color:"#e8313a",fontWeight:700,marginBottom:1}}>🚩 {flagInfo.reason}</div>
                    <div style={{fontSize:9,color:th.muted}}>by {flagInfo.flaggedBy}</div>
                  </div>
                )}
                <div style={{display:"flex",gap:7}}>
                  <button onClick={function(){ setPlayVid(vid); }} style={{flex:1,padding:"9px 0",background:"#e8313a18",border:"1px solid #e8313a44",color:"#e8313a",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>▶ Review</button>
                  {!isFlagged ? (
                    <button onClick={function(){ setFlagging(vid.id); }} style={{flex:1,padding:"9px 0",background:th.inp,border:"1px solid "+th.border2,color:th.muted,borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>🚩 Flag</button>
                  ) : (
                    <button onClick={function(){ unflag(vid.id); }} style={{flex:1,padding:"9px 0",background:th.inp,border:"1px solid "+th.border2,color:th.faint,borderRadius:8,cursor:"pointer",fontSize:11,fontFamily:"'Barlow',sans-serif"}}>Remove Flag</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Manager Dashboard ─────────────────────────────────────────────────────────
function ManagerDash(props) {
  var th = props.th; var videos = props.videos; var sentLog = props.sentLog; var inventory = props.inventory;
  var [tab, setTab]             = useState("activity");
  var [unlocked, setUnlocked]   = useState(false);
  var [showPK, setShowPK]       = useState(false);
  var [pkInput, setPKInput]     = useState("");
  var [pkError, setPKError]     = useState("");
  var MANAGER_PK = "1234";

  function tryUnlock() {
    if (pkInput === MANAGER_PK) { setUnlocked(true); setShowPK(false); setPKError(""); setPKInput(""); }
    else { setPKError("Incorrect passkey."); }
  }

  var allSends = [];
  Object.values(sentLog).forEach(function(arr){ arr.forEach(function(s){ allSends.push(s); }); });
  var byPerson = {};
  allSends.forEach(function(s) {
    if (!s.sentBy) return;
    if (!byPerson[s.sentBy]) byPerson[s.sentBy] = {name:s.sentBy, sends:0, customers:[]};
    byPerson[s.sentBy].sends++;
    if (s.custName && byPerson[s.sentBy].customers.indexOf(s.custName) === -1) byPerson[s.sentBy].customers.push(s.custName);
  });
  var people = Object.values(byPerson).sort(function(a,b){ return b.sends - a.sends; });

  var totalVehicles = inventory.length;
  var withOfficial  = inventory.filter(function(v){ return (videos[v.vin]||[]).some(function(x){ return x.videoType==="Official" && !x.isDemo; }); }).length;
  var withAny       = inventory.filter(function(v){ return (videos[v.vin]||[]).filter(function(x){ return !x.isDemo; }).length > 0; }).length;
  var totalVideos   = Object.values(videos).flat().filter(function(v){ return !v.isDemo; }).length;
  var totalSends    = allSends.length;

  var coverage1Pct = totalVehicles > 0 ? Math.round(withOfficial/totalVehicles*100) : 0;
  var coverage2Pct = totalVehicles > 0 ? Math.round(withAny/totalVehicles*100) : 0;

  var summaryCards = [
    {val:totalVideos, label:"Videos Recorded", clr:"#00d97e"},
    {val:totalSends,  label:"Videos Sent",     clr:"#4da6ff"},
    {val:people.length, label:"Active Senders", clr:"#ffd700"},
    {val:withOfficial,  label:"w/ Official",    clr:"#ff6b35"},
  ];

  var missing = inventory.filter(function(v){ return !(videos[v.vin]||[]).some(function(x){ return x.videoType==="Official"&&!x.isDemo; }); });

  return (
    <div style={rootStyle(th)}>
      <style>{getGS(th)}</style>
      <div style={{...hdr(th)}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <button onClick={props.onClose} style={backBtn(th)}>←</button>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:800,color:th.text,letterSpacing:2}}>MANAGER DASHBOARD</div>
            <div style={{fontSize:9,color:"#e8313a",letterSpacing:1,textTransform:"uppercase"}}>{props.dealerName}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["activity","📊 Activity"],["feed","📋 All Sends"],["coverage","📹 Coverage"]].map(function(item) {
            var id = item[0]; var label = item[1];
            return (
              <button key={id} onClick={function(){ setTab(id); }} style={{flex:1,padding:"8px 0",background:tab===id?"#e8313a1a":"transparent",border:tab===id?"1px solid #e8313a55":"1px solid "+th.border,borderRadius:8,color:tab===id?"#e8313a":th.muted,fontSize:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700}}>{label}</button>
            );
          })}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:14}}>
        {tab === "activity" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
              {summaryCards.map(function(item) {
                return (
                  <div key={item.label} style={{...card(th),padding:"12px 14px"}}>
                    <div style={{fontSize:24,fontWeight:800,color:item.clr,fontFamily:"'Barlow Condensed',sans-serif"}}>{item.val}</div>
                    <div style={{fontSize:9,color:th.muted,textTransform:"uppercase",letterSpacing:1,marginTop:2}}>{item.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{fontSize:10,color:th.faint,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Video sends by salesperson</div>
            {people.length === 0 ? (
              <div style={{textAlign:"center",padding:"40px 20px",color:th.faint}}>
                <div style={{fontSize:36,marginBottom:8}}>📤</div>
                <div>No sends recorded yet</div>
              </div>
            ) : people.map(function(p, i) {
              return (
                <div key={p.name} style={{...card(th),padding:"11px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"#e8313a18",border:"1px solid #e8313a33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#e8313a",flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:th.text}}>{p.name}</div>
                    <div style={{fontSize:11,color:th.muted}}>{p.customers.length} unique customer{p.customers.length!==1?"s":""}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:18,fontWeight:800,color:"#4da6ff",fontFamily:"'Barlow Condensed',sans-serif"}}>{p.sends}</div>
                    <div style={{fontSize:9,color:th.faint}}>sends</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === "feed" && (
          <div>
            {showPK && (
              <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Barlow',sans-serif"}}>
                <div style={{background:th.panel,border:"1px solid "+th.border,borderRadius:14,padding:"24px 20px",maxWidth:300,width:"100%"}}>
                  <div style={{fontSize:16,fontWeight:700,color:th.text,marginBottom:4,textAlign:"center"}}>🔐 Manager Access</div>
                  <div style={{fontSize:12,color:th.muted,textAlign:"center",marginBottom:16,lineHeight:1.5}}>Enter your passkey to view customer contact and message details.</div>
                  <input type="password" inputMode="numeric" maxLength={6} placeholder="Passkey" value={pkInput} onChange={function(e){ setPKInput(e.target.value); setPKError(""); }} onKeyDown={function(e){ if(e.key==="Enter") tryUnlock(); }} style={{...inp(th),fontSize:20,letterSpacing:6,textAlign:"center",marginBottom:10}} />
                  {pkError && <div style={{fontSize:12,color:"#e8313a",textAlign:"center",marginBottom:10}}>{pkError}</div>}
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={function(){ setShowPK(false); setPKInput(""); setPKError(""); }} style={{flex:1,padding:12,borderRadius:9,border:"1px solid "+th.border2,background:"transparent",color:th.muted,cursor:"pointer",fontSize:14,fontFamily:"'Barlow',sans-serif"}}>Cancel</button>
                    <button onClick={tryUnlock} style={{flex:1,padding:12,borderRadius:9,border:"none",background:"#e8313a",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>Unlock</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:10,color:th.faint,letterSpacing:1,textTransform:"uppercase"}}>{allSends.length} total sends · all staff</div>
              {!unlocked
                ? <button onClick={function(){ setShowPK(true); }} style={{background:"#e8313a18",border:"1px solid #e8313a44",color:"#e8313a",padding:"5px 12px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>🔐 Manager Unlock</button>
                : <span style={{fontSize:10,color:"#00d97e",fontWeight:700}}>🔓 Full Access</span>
              }
            </div>
            {allSends.length === 0 ? (
              <div style={{textAlign:"center",padding:"40px 20px",color:th.faint}}>
                <div style={{fontSize:36,marginBottom:8}}>📤</div>
                <div>No sends recorded yet</div>
              </div>
            ) : allSends.slice().sort(function(a,b){ return new Date(b.sentAt||0)-new Date(a.sentAt||0); }).map(function(e, i) {
              var veh = null;
              Object.keys(sentLog).forEach(function(vin) {
                if ((sentLog[vin]||[]).indexOf(e) !== -1) {
                  veh = inventory.find(function(v){ return v.vin === vin; });
                }
              });
              return (
                <div key={i} style={{...card(th),padding:"11px 14px",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:th.text}}>{e.custName}</div>
                      <div style={{fontSize:10,color:th.muted,marginTop:2}}>
                        Sent by <span style={{color:"#4da6ff",fontWeight:600}}>{e.sentBy}</span> · {fmtDate(e.sentAt)}
                      </div>
                    </div>
                    <VTypeBadge type={e.videoType||"Walk-around"} small={true} />
                  </div>
                  {veh && (
                    <div style={{fontSize:11,color:th.muted,marginTop:4}}>
                      🚗 {veh.year} {veh.make} {veh.model} · <span style={{fontFamily:"monospace"}}>#{veh.stock}</span>
                    </div>
                  )}
                  {unlocked && (
                    <div style={{borderTop:"1px solid "+th.border,paddingTop:8,marginTop:8}}>
                      {e.custContact && <div style={{fontSize:11,color:th.muted,marginBottom:4}}>📞 {e.custContact}</div>}
                      <div style={{fontSize:11,color:th.muted,fontStyle:"italic",lineHeight:1.4}}>"{(e.msg||"").slice(0,140)}{(e.msg||"").length>140?"…":""}"</div>
                    </div>
                  )}
                  {!unlocked && (
                    <div style={{borderTop:"1px solid "+th.border,paddingTop:6,marginTop:6}}>
                      <div style={{fontSize:10,color:th.faint,fontStyle:"italic"}}>🔐 Unlock to view message and contact</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {tab === "coverage" && (
          <div>
            <div style={{...card(th),padding:"14px",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:700,color:th.text}}>Official video coverage</span>
                <span style={{fontSize:12,color:"#00d97e",fontWeight:700}}>{coverage1Pct}%</span>
              </div>
              <div style={{height:8,background:th.border,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:coverage1Pct+"%",background:"#00d97e",borderRadius:4}} />
              </div>
              <div style={{fontSize:10,color:th.muted,marginTop:6}}>{withOfficial} of {totalVehicles} vehicles have an Official video</div>
            </div>
            <div style={{...card(th),padding:"14px",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:700,color:th.text}}>Any video coverage</span>
                <span style={{fontSize:12,color:"#4da6ff",fontWeight:700}}>{coverage2Pct}%</span>
              </div>
              <div style={{height:8,background:th.border,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:coverage2Pct+"%",background:"#4da6ff",borderRadius:4}} />
              </div>
              <div style={{fontSize:10,color:th.muted,marginTop:6}}>{withAny} of {totalVehicles} vehicles have at least one video</div>
            </div>
            <div style={{fontSize:10,color:th.faint,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Missing official video ({missing.length})</div>
            {missing.map(function(v) {
              return (
                <div key={v.vin} style={{...card(th),padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#e8313a",flexShrink:0}} />
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:th.text}}>{v.year} {v.make} {v.model}</div>
                    <div style={{fontSize:10,color:th.muted}}>#{v.stock} · {v.type}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  var [theme, setTheme]       = useState("dark");
  var [authPath, setAuthPath] = useState(null);
  var [user, setUser]         = useState(null);
  var [terms, setTerms]       = useState(false);
  var [onboarded, setOb]      = useState(false);
  var [inventory, setInv]     = useState([]);
  var [invLoading, setInvL]   = useState(false);
  var [invError, setInvE]     = useState(null);
  var [lastSync, setSync]     = useState(null);
  var [search, setSearch]     = useState("");
  var [filter, setFilter]     = useState("All");
  var [sortBy, setSort]       = useState("videos");
  var [videos, setVideos]     = useState({});
  var [sentLog, setSentLog]   = useState({});
  var [flags, setFlags]       = useState({});
  var [view, setView]         = useState("list");
  var [selVin, setSelVin]     = useState(null);
  var [playIdx, setPlayIdx]   = useState(null);
  var [shareVid, setShareVid] = useState(null);
  var [showSent, setShowSent] = useState(false);
  var [showBill, setShowBill] = useState(false);
  var [showQC, setShowQC]     = useState(false);
  var [showDash, setShowDash] = useState(false);
  var [editNote, setEditNote] = useState(null);
  var [noteText, setNoteText] = useState("");
  var [editName, setEditName] = useState(null);
  var [nameText, setNameText] = useState("");
  var [confirm, setConfirm]   = useState(null);
  var [mediaRec, setMediaRec] = useState(null);
  var [stream, setStream]     = useState(null);
  var [recTime, setRecTime]   = useState(0);
  var [pendType, setPendType] = useState("Official");
  var [toast, setToast]       = useState(null);
  var [showMenu, setMenu]     = useState(false);

  var th = theme === "dark" ? DARK : LIGHT;
  var previewRef = useRef(null);
  var chunksRef  = useRef([]);
  var timerRef   = useRef(null);
  var refreshRef = useRef(null);

  function buildDemoVideos(dealerId) {
    if (!DEMO_MODE) return {};
    var inv = DEMO_INV[dealerId] || [];
    var result = {};
    inv.slice(0,4).forEach(function(v, idx) {
      var templates = idx < 2 ? [
        {videoType:"Official",   uploader:"All-Pro Media", role:ALLPRO_ROLE, note:"Full exterior + interior walkaround"},
        {videoType:"Walk-around",uploader:"Sales – Demo",  role:"Sales",      note:""},
      ] : [
        {videoType:"Official",   uploader:"All-Pro Media", role:ALLPRO_ROLE, note:"Full exterior + interior walkaround"},
      ];
      result[v.vin] = templates.map(function(tpl, i) {
        return {id:v.vin+"-demo-"+i, isDemo:true, name:v.year+" "+v.make+" "+v.model+" – Demo", date:new Date(Date.now()-(idx*86400000)).toISOString(), size:0, note:tpl.note, videoType:tpl.videoType, uploader:tpl.uploader, role:tpl.role, dealerName:SONIC_DEALERS.find(function(d){ return d.id===dealerId; }) ? SONIC_DEALERS.find(function(d){ return d.id===dealerId; }).name : ""};
      });
    });
    return result;
  }

  var fetchInv = useCallback(function() {
    if (!user) return;
    setInvL(true); setInvE(null);
    if (DEMO_MODE) {
      setTimeout(function() {
        var data = DEMO_INV[user.dealerId] || [];
        setInv(data); setCache(user.dealerId, data); setSync(new Date()); setInvL(false);
      }, 900);
    } else {
      fetch(WORKER_URL + "?dealer_id=" + user.dealerId + "&rows=200")
        .then(function(res) {
          if (!res.ok) throw new Error("Server error " + res.status);
          return res.json();
        })
        .then(function(data) {
          if (data.error) throw new Error(data.error);
          var inv = data.inventory || [];
          setInv(inv); setCache(user.dealerId, inv); setSync(new Date());
        })
        .catch(function(e) {
          setInvE(e.message);
          var cached = getCache(user.dealerId);
          if (cached.length > 0) setInv(cached);
        })
        .finally(function() { setInvL(false); });
    }
  }, [user]);

  useEffect(function() {
    if (!user) return;
    fetchInv();
    refreshRef.current = setInterval(fetchInv, AUTO_REFRESH);
    return function() { clearInterval(refreshRef.current); };
  }, [user]);

  useEffect(function() {
    if (previewRef.current && stream) previewRef.current.srcObject = stream;
  }, [stream]);

  function handleLogin(u) {
    setUser(u);
    if (DEMO_MODE) {
      var dv = buildDemoVideos(u.dealerId);
      setVideos(dv);
      var inv = DEMO_INV[u.dealerId] || [];
      setSentLog(buildDemoSentLog(inv));
    }
    if (isQC(u)) setShowQC(true);
  }

  function logout() {
    clearInterval(refreshRef.current);
    clearSession(); setUser(null); setInv([]); setSelVin(null); setView("list");
    setMenu(false); setAuthPath(null); setVideos({}); setTerms(false); setOb(false); setShowQC(false);
  }

  var filtered = inventory.filter(function(v) {
    var q = search.toLowerCase();
    var ms = !q || [v.vin,v.stock,v.make,v.model,v.trim,v.color].some(function(x){ return x && x.toLowerCase().includes(q); });
    var vids = videos[v.vin] || [];
    var mf;
    if (filter === "All")       mf = true;
    else if (filter === "HasVideo")   mf = vids.filter(function(x){ return !x.isDemo; }).length > 0;
    else if (filter === "NeedsVideo") mf = !vids.some(function(x){ return x.videoType==="Official"&&!x.isDemo; });
    else                        mf = v.type === filter;
    return ms && mf;
  }).sort(function(a,b) {
    if (sortBy === "price-asc")  return (a.price||0)-(b.price||0);
    if (sortBy === "price-desc") return (b.price||0)-(a.price||0);
    if (sortBy === "miles")      return (a.miles||0)-(b.miles||0);
    return (videos[b.vin]||[]).length - (videos[a.vin]||[]).length;
  });

  var selVeh  = inventory.find(function(v){ return v.vin === selVin; });
  var selVids = selVin ? (videos[selVin] || []) : [];
  var selLog  = selVin ? (sentLog[selVin] || []) : [];
  var apMode  = isAllPro(user);
  var ac      = apMode ? "#ff6b35" : "#e8313a";

  function selectVehicle(vin) { setSelVin(vin); setPlayIdx(null); setView("detail"); }

  function addVideo(vin, blob, name) {
    var entry = {id:Date.now()+Math.random(), blob:blob, name:name, note:"", date:new Date().toISOString(), size:blob.size, uploader:user.name, role:user.role, videoType:pendType, dealerName:user.dealerName, dealerCity:user.dealerCity};
    setVideos(function(prev) {
      var next = Object.assign({}, prev);
      next[vin] = (prev[vin] || []).concat([entry]);
      return next;
    });
  }

  function updateVideo(vin, id, patch) {
    setVideos(function(prev) {
      var next = Object.assign({}, prev);
      next[vin] = prev[vin].map(function(v){ return v.id === id ? Object.assign({},v,patch) : v; });
      return next;
    });
  }

  function deleteVideo(vin, id) {
    setVideos(function(prev) {
      var next = Object.assign({}, prev);
      next[vin] = prev[vin].filter(function(v){ return v.id !== id; });
      return next;
    });
    if (playIdx !== null) { setPlayIdx(null); setView("detail"); }
  }

  function startRec() {
    navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:true})
      .then(function(s) {
        setStream(s); chunksRef.current = [];
        var mimes = ["video/webm;codecs=vp9,opus","video/webm","video/mp4"];
        var mime = "";
        if (typeof MediaRecorder !== "undefined") {
          mime = mimes.find(function(m){ try{ return MediaRecorder.isTypeSupported(m); }catch(e){ return false; } }) || "";
        }
        var rec = new MediaRecorder(s, mime ? {mimeType:mime} : {});
        rec.ondataavailable = function(e){ if(e.data.size>0) chunksRef.current.push(e.data); };
        rec.onstop = function() {
          var blob = new Blob(chunksRef.current, {type:rec.mimeType||"video/webm"});
          var name = (selVeh ? selVeh.year+" "+selVeh.make+" "+selVeh.model : "Vehicle") + " – " + new Date().toLocaleDateString();
          addVideo(selVin, blob, name);
          s.getTracks().forEach(function(t){ t.stop(); });
          setStream(null); setView("detail"); setToast("Video saved!");
        };
        rec.start(500); setMediaRec(rec); setRecTime(0);
        timerRef.current = setInterval(function(){ setRecTime(function(t){ return t+1; }); }, 1000);
        setView("camera");
      })
      .catch(function() { alert("Camera access denied. Try file upload instead."); });
  }

  function stopRec() { clearInterval(timerRef.current); if(mediaRec) mediaRec.stop(); setMediaRec(null); }

  function handleUpload(files) {
    var valid = Array.from(files).filter(function(f){ return f.type.startsWith("video/"); });
    valid.forEach(function(f) {
      var name = f.name.replace(/\.[^.]+$/,"") || (selVeh ? selVeh.year+" "+selVeh.make+" "+selVeh.model : "Video");
      addVideo(selVin, f, name);
    });
    if (valid.length > 0) setToast(valid.length + " video" + (valid.length>1?"s":"") + " added");
  }

  function handleSent(vid, entry) {
    setSentLog(function(prev) {
      var next = Object.assign({}, prev);
      var logEntry = Object.assign({},entry,{vidId:vid.id,videoType:vid.videoType,sentBy:user.name});
      next[selVin] = (prev[selVin]||[]).concat([logEntry]);
      return next;
    });
    setShareVid(null); setToast("Sent to " + entry.custName + "!");
  }

  var myFlagCount = apMode ? Object.keys(flags).filter(function(id) {
    return flags[id] && Object.values(videos).flat().find(function(v){ return v.id===id&&v.uploader===user.name; });
  }).length : 0;

  // ── Not logged in ──
  if (!user) {
    if (!authPath) return <HomeScreen th={th} theme={theme} onToggle={function(){ setTheme(theme==="dark"?"light":"dark"); }} onPath={setAuthPath} />;
    return <AuthScreen path={authPath} th={th} onLogin={handleLogin} onBack={function(){ setAuthPath(null); }} />;
  }

  // ── Terms ──
  if (!terms) return <TermsScreen th={th} onAccept={function(){ setTerms(true); }} />;

  // ── Onboarding ──
  if (!onboarded && !isQC(user)) return <OnboardingScreen role={user.role} th={th} onDone={function(){ setOb(true); }} />;

  // ── Overlays ──
  if (shareVid) return <ShareComposer vid={shareVid} vehicle={selVeh} sender={user.name} th={th} onSend={function(e){ handleSent(shareVid,e); }} onClose={function(){ setShareVid(null); }} />;
  if (showSent) return <SentLog log={selLog} vehicle={selVeh} th={th} isManager={isManager(user)} onClose={function(){ setShowSent(false); }} />;
  if (showBill) return <BillingReport videos={videos} inventory={inventory} dealerName={user.dealerName} dealerCity={user.dealerCity} th={th} onClose={function(){ setShowBill(false); }} />;
  if (showQC)   return <QCFeed videos={videos} user={user} th={th} onClose={function(){ setShowQC(false); }} />;
  if (showDash) return <ManagerDash videos={videos} sentLog={sentLog} inventory={inventory} dealerName={user.dealerName} th={th} onClose={function(){ setShowDash(false); }} />;



  // ── Camera ──
  if (view === "camera") return (
    <div style={{height:"100vh",background:"#000",display:"flex",flexDirection:"column",position:"relative"}}>
      <style>{getGS(th)}</style>
      <video ref={previewRef} autoPlay muted playsInline style={{flex:1,objectFit:"cover",width:"100%"}} />
      <div style={{position:"absolute",top:16,left:16,background:"#e8313a",color:"#fff",padding:"5px 14px",borderRadius:6,fontSize:13,fontWeight:700,letterSpacing:1,display:"flex",alignItems:"center",gap:7}}>
        <span style={{width:9,height:9,borderRadius:"50%",background:"#fff",display:"inline-block",animation:"pulse 0.8s infinite"}} />
        {" REC "}{fmtTime(recTime)}
      </div>
      <div style={{position:"absolute",top:16,right:16}}>
        <select value={pendType} onChange={function(e){ setPendType(e.target.value); }} style={{background:"rgba(0,0,0,0.75)",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",padding:"7px 11px",borderRadius:8,fontSize:13,fontFamily:"'Barlow',sans-serif",outline:"none",fontWeight:700}}>
          {VIDEO_TYPES.map(function(tp){ return <option key={tp} value={tp}>{tp}</option>; })}
        </select>
      </div>
      <div style={{padding:"20px 24px 50px",display:"flex",justifyContent:"center",background:"linear-gradient(transparent,rgba(0,0,0,0.7))"}}>
        <button onClick={stopRec} style={{width:76,height:76,borderRadius:"50%",background:"#e8313a",border:"5px solid #fff",cursor:"pointer",fontSize:24,color:"#fff",fontWeight:700}}>■</button>
      </div>
    </div>
  );

  // ── Player ──
  if (view === "player" && playIdx !== null && selVids[playIdx] && !selVids[playIdx].isDemo) {
    var vid = selVids[playIdx];
    var vidSentCount = (sentLog[selVin]||[]).filter(function(e){ return e.vidId===vid.id; }).length;
    var vidFlagged   = !!flags[vid.id];
    return (
      <div style={{height:"100vh",background:"#000",display:"flex",flexDirection:"column",fontFamily:"'Barlow',sans-serif"}}>
        <style>{getGS(th)}</style>
        {confirm && <ConfirmModal msg={confirm.msg} label={confirm.label} onConfirm={confirm.onConfirm} onCancel={function(){ setConfirm(null); }} th={th} />}
        <div style={{...hdr(th),display:"flex",alignItems:"center",gap:10}}>
          <button onClick={function(){ setView("detail"); setPlayIdx(null); }} style={backBtn(th)}>←</button>
          <div style={{flex:1,minWidth:0}}>
            {editName === vid.id ? (
              <div style={{display:"flex",gap:6}}>
                <input style={{...inp(th),padding:"6px 10px",fontSize:13,flex:1}} value={nameText} onChange={function(e){ setNameText(e.target.value); }} onKeyDown={function(e){ if(e.key==="Enter"){ updateVideo(selVin,vid.id,{name:nameText}); setEditName(null); } if(e.key==="Escape") setEditName(null); }} />
                <button onClick={function(){ updateVideo(selVin,vid.id,{name:nameText}); setEditName(null); }} style={{background:"#00d97e",border:"none",color:"#0a0c10",padding:"6px 10px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>Save</button>
              </div>
            ) : (
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{fontSize:13,fontWeight:600,color:th.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{vid.name}</div>
                <button onClick={function(){ setEditName(vid.id); setNameText(vid.name); }} style={{background:"none",border:"none",color:th.muted,cursor:"pointer",fontSize:12,flexShrink:0}}>✏️</button>
              </div>
            )}
            <UploaderChip vid={vid} th={th} />
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
            {vidFlagged && <span style={{fontSize:9,background:"#e8313a",color:"#fff",padding:"2px 7px",borderRadius:4,fontWeight:800}}>🚩 RESHOOT</span>}
            <VTypeBadge type={vid.videoType} small={true} />
          </div>
        </div>
        <video src={URL.createObjectURL(vid.blob)} controls autoPlay playsInline style={{flex:1,width:"100%",background:"#000",objectFit:"contain"}} />
        <div style={{background:th.panel,borderTop:"1px solid "+th.border,padding:"10px 16px"}}>
          {editNote === vid.id ? (
            <div style={{display:"flex",gap:8}}>
              <input style={{...inp(th),padding:"8px 12px",fontSize:13,flex:1}} placeholder="Add a note…" value={noteText} onChange={function(e){ setNoteText(e.target.value); }} onKeyDown={function(e){ if(e.key==="Enter"){ updateVideo(selVin,vid.id,{note:noteText}); setEditNote(null); } if(e.key==="Escape") setEditNote(null); }} />
              <button onClick={function(){ updateVideo(selVin,vid.id,{note:noteText}); setEditNote(null); }} style={{background:"#4da6ff",border:"none",color:"#fff",padding:"8px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif",flexShrink:0}}>Save</button>
            </div>
          ) : (
            <div onClick={function(){ setEditNote(vid.id); setNoteText(vid.note||""); }} style={{fontSize:12,color:vid.note?th.sub:th.faint,cursor:"pointer",fontStyle:vid.note?"normal":"italic"}}>
              📝 {vid.note || "Add a note (condition, damage, context…)"}
            </div>
          )}
        </div>
        <div style={{padding:"12px 16px 28px",background:th.panel,borderTop:"1px solid "+th.border2}}>
          {vidSentCount > 0 && (
            <div style={{fontSize:11,color:"#4da6ff",marginBottom:10,textAlign:"center"}}>
              📤 Sent to {vidSentCount} customer{vidSentCount!==1?"s":""} ·{" "}
              <button onClick={function(){ setShowSent(true); }} style={{background:"none",border:"none",color:"#4da6ff",cursor:"pointer",fontSize:11,fontFamily:"'Barlow',sans-serif",textDecoration:"underline"}}>View log</button>
            </div>
          )}
          <div style={{display:"flex",gap:10}}>
            {!apMode && <button onClick={function(){ setShareVid(vid); }} style={{flex:1,padding:13,background:"#00d97e18",border:"1px solid #00d97e44",color:"#00d97e",borderRadius:10,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>⬆ Send to Customer</button>}
            <button onClick={function(){ setConfirm({msg:"Delete this video?",label:"Delete",onConfirm:function(){ deleteVideo(selVin,vid.id); setConfirm(null); }}); }} style={{padding:"13px 16px",background:"#e8313a18",border:"1px solid #e8313a44",color:"#e8313a",borderRadius:10,cursor:"pointer",fontSize:18}}>🗑</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Detail ──
  if (view === "detail" && selVeh) return (
    <div style={rootStyle(th)}>
      <style>{getGS(th)}</style>
      {confirm && <ConfirmModal msg={confirm.msg} label={confirm.label} onConfirm={confirm.onConfirm} onCancel={function(){ setConfirm(null); }} th={th} />}
      <div style={hdr(th)}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <button onClick={function(){ setView("list"); }} style={backBtn(th)}>←</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:800,color:th.text,letterSpacing:0.5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{selVeh.year} {selVeh.make} {selVeh.model}</div>
            <div style={{fontSize:11,color:th.muted,display:"flex",gap:7,flexWrap:"wrap"}}>
              {selVeh.stock && <span>#{selVeh.stock}</span>}
              {selVeh.trim  && <span>· {selVeh.trim}</span>}
              {selVeh.miles>0 && <span>· {fmtMiles(selVeh.miles)}</span>}
              {selVeh.price>0 && <span style={{color:"#00d97e",fontWeight:600}}>· {fmtPrice(selVeh.price)}</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
            {selLog.length>0 && !apMode && (
              <button onClick={function(){ setShowSent(true); }} style={{background:"#4da6ff18",border:"1px solid #4da6ff33",color:"#4da6ff",padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>📤 {selLog.length}</button>
            )}
            <span style={{fontSize:9,fontWeight:800,padding:"3px 8px",borderRadius:4,letterSpacing:1,textTransform:"uppercase",background:(TYPE_COLORS[selVeh.type]||"#888")+"22",color:TYPE_COLORS[selVeh.type]||"#888",border:"1px solid "+(TYPE_COLORS[selVeh.type]||"#888")+"44"}}>{selVeh.type}</span>
          </div>
        </div>
        {selVeh.thumb && <img src={selVeh.thumb} alt="" style={{width:"100%",height:150,objectFit:"cover",borderRadius:10,marginBottom:10}} onError={function(e){ e.target.style.display="none"; }} />}
        <div style={{display:"flex",gap:8}}>
          <select value={pendType} onChange={function(e){ setPendType(e.target.value); }} style={{flex:1,background:th.inp,border:"1px solid "+(VT_COLORS[pendType]||"#aaa")+"55",color:VT_COLORS[pendType]||"#aaa",padding:"10px 11px",borderRadius:9,fontSize:13,fontFamily:"'Barlow',sans-serif",outline:"none",fontWeight:700,WebkitAppearance:"none"}}>
            {VIDEO_TYPES.map(function(tp){ return <option key={tp} value={tp}>{tp}</option>; })}
          </select>
          <label style={{display:"flex",alignItems:"center",gap:5,padding:"0 13px",background:th.inp,border:"1px solid "+th.border2,color:th.sub,borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"'Barlow',sans-serif",flexShrink:0}}>
            ↑ Upload
            <input type="file" accept="video/*" multiple style={{display:"none"}} onChange={function(e){ handleUpload(e.target.files); }} />
          </label>
          <button onClick={startRec} style={{padding:"0 14px",background:ac,border:"none",color:"#fff",borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"'Barlow',sans-serif",flexShrink:0}}>● Rec</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:14}}>
        {selVids.length === 0 ? (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"65%",gap:10,textAlign:"center"}}>
            <div style={{fontSize:52}}>📹</div>
            <div style={{fontSize:15,color:th.sub,fontWeight:600}}>No videos yet</div>
            <div style={{fontSize:13,color:th.faint}}>Select a type above, then record or upload</div>
          </div>
        ) : selVids.map(function(vid, idx) {
          if (vid.isDemo) {
            return (
              <div key={vid.id} style={{...card(th),overflow:"hidden",marginBottom:12}}>
                <div style={{position:"relative",paddingTop:"50%",background:"#141720"}}>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
                    <div style={{fontSize:32}}>🎬</div>
                    <div style={{fontSize:11,color:"#555",fontStyle:"italic"}}>Demo placeholder</div>
                  </div>
                  <div style={{position:"absolute",top:9,left:9}}><VTypeBadge type={vid.videoType} small={true} /></div>
                  <div style={{position:"absolute",top:9,right:9,fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:4,background:"#ffd70015",border:"1px solid #ffd70033",color:"#ffd700"}}>DEMO</div>
                </div>
                <div style={{padding:"10px 12px 12px"}}>
                  <div style={{fontSize:13,fontWeight:600,color:th.text,marginBottom:2}}>{vid.videoType} Walkaround</div>
                  <UploaderChip vid={vid} th={th} />
                  {vid.note && <div style={{fontSize:11,color:th.muted,marginBottom:4,fontStyle:"italic"}}>📝 {vid.note}</div>}
                  <div style={{fontSize:10,color:th.faint,marginBottom:10}}>Demo · {fmtDate(vid.date)}</div>
                  <div style={{display:"flex",gap:7}}>
                    <button onClick={function(){ setToast("Upload or record a real video to preview playback here."); }} style={{flex:1,padding:"10px 0",background:"#e8313a18",border:"1px solid #e8313a44",color:"#e8313a",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>▶ Play</button>
                    {!apMode && <button onClick={function(){ setShareVid(vid); }} style={{flex:1,padding:"10px 0",background:"#00d97e14",border:"1px solid #00d97e33",color:"#00d97e",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>⬆ Send</button>}
                  </div>
                </div>
              </div>
            );
          }
          var vtc = VT_COLORS[vid.videoType] || "#aaa";
          var isFlagged = !!flags[vid.id];
          var sc = (sentLog[selVin]||[]).filter(function(e){ return e.vidId===vid.id; }).length;
          return (
            <div key={vid.id} style={{...card(th),overflow:"hidden",border:isFlagged?"1px solid #e8313a44":"1px solid "+th.border,marginBottom:12}}>
              <div style={{position:"relative",paddingTop:"50%",background:"#141720",cursor:"pointer"}} onClick={function(){ setPlayIdx(idx); setView("player"); }}>
                <VideoThumb blob={vid.blob} />
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.22)"}}>
                  <div style={{width:48,height:48,borderRadius:"50%",background:"rgba(232,49,58,0.88)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff",paddingLeft:3}}>▶</div>
                </div>
                <div style={{position:"absolute",top:9,left:9}}><VTypeBadge type={vid.videoType} small={true} /></div>
                {isFlagged && <div style={{position:"absolute",top:9,right:9,background:"#e8313a",color:"#fff",padding:"2px 8px",borderRadius:4,fontSize:9,fontWeight:800}}>🚩 RESHOOT</div>}
                {!isFlagged && sc>0 && <div style={{position:"absolute",top:9,right:9,fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:5,background:"#4da6ff22",border:"1px solid #4da6ff44",color:"#4da6ff"}}>📤 {sc}</div>}
              </div>
              <div style={{padding:"10px 12px 12px"}}>
                <div style={{fontSize:13,fontWeight:600,color:th.text,marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{vid.name}</div>
                <UploaderChip vid={vid} th={th} />
                {vid.note && <div style={{fontSize:11,color:th.sub,marginBottom:4,fontStyle:"italic"}}>📝 {vid.note}</div>}
                {isFlagged && (
                  <div style={{background:"#e8313a12",border:"1px solid #e8313a33",borderRadius:7,padding:"7px 10px",marginBottom:6}}>
                    <div style={{fontSize:11,color:"#e8313a",fontWeight:700}}>🚩 {flags[vid.id].reason}</div>
                    <div style={{fontSize:9,color:th.muted,marginTop:2}}>QC flagged this for reshoot</div>
                  </div>
                )}
                <div style={{fontSize:10,color:th.faint,marginBottom:10}}>{fmtDate(vid.date)} · {fmtSize(vid.size)}</div>
                <div style={{display:"flex",gap:7}}>
                  <button onClick={function(){ setPlayIdx(idx); setView("player"); }} style={{flex:1,padding:"10px 0",background:"#e8313a18",border:"1px solid #e8313a44",color:"#e8313a",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>▶ Play</button>
                  {!apMode && <button onClick={function(){ setShareVid(vid); }} style={{flex:1,padding:"10px 0",background:"#00d97e14",border:"1px solid #00d97e33",color:"#00d97e",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>⬆ Send</button>}
                  <button onClick={function(){ setConfirm({msg:"Delete this video?",label:"Delete",onConfirm:function(){ deleteVideo(selVin,vid.id); setConfirm(null); }}); }} style={{padding:"10px 12px",background:th.inp,border:"1px solid "+th.border2,color:th.muted,borderRadius:8,cursor:"pointer",fontSize:14}}>🗑</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {toast && <Toast msg={toast} onDone={function(){ setToast(null); }} />}
    </div>
  );

  // ── List ──
  var filterOpts = apMode
    ? [["All","All"],["New","New"],["Used","Used"],["CPO","CPO"],["HasVideo","📹"],["NeedsVideo","Needs 📹"]]
    : [["All","All"],["New","New"],["Used","Used"],["CPO","CPO"],["HasVideo","📹"]];

  return (
    <div style={rootStyle(th)}>
      <style>{getGS(th)}</style>
      <div style={hdr(th)}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <SonicBadge />
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:16,letterSpacing:3,color:th.text,lineHeight:1}}>VIDEO VAULT</div>
              <div style={{fontSize:9,color:apMode?"#ff6b35":th.muted,letterSpacing:1,textTransform:"uppercase"}}>{apMode?"All-Pro · ":""}{user.dealerName}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <ThemeBtn theme={theme} onToggle={function(){ setTheme(theme==="dark"?"light":"dark"); }} th={th} />
            {lastSync && <span style={{fontSize:9,color:th.faint}}>{lastSync.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>}
            <button onClick={fetchInv} disabled={invLoading} style={{background:"transparent",border:"1px solid "+th.border2,color:th.muted,padding:"6px 10px",borderRadius:7,cursor:"pointer",fontSize:13}}>
              <span style={{display:"inline-block",animation:invLoading?"spin 1s linear infinite":"none"}}>⟳</span>
            </button>
            <div style={{position:"relative"}}>
              <button onClick={function(){ setMenu(function(m){ return !m; }); }} style={{width:33,height:33,borderRadius:"50%",background:ac+"28",border:"1px solid "+ac+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:ac,cursor:"pointer",position:"relative"}}>
                {user.name[0].toUpperCase()}
                {myFlagCount > 0 && <span style={{position:"absolute",top:-4,right:-4,background:"#e8313a",color:"#fff",width:14,height:14,borderRadius:"50%",fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{myFlagCount}</span>}
              </button>
              {showMenu && (
                <div style={{position:"absolute",right:0,top:40,background:th.panel,border:"1px solid "+th.border,borderRadius:11,padding:"8px 0",minWidth:200,zIndex:100,boxShadow:"0 8px 32px rgba(0,0,0,0.3)"}}>
                  <div style={{padding:"8px 16px",borderBottom:"1px solid "+th.border,marginBottom:4}}>
                    <div style={{fontSize:13,fontWeight:600,color:th.text}}>{user.name}</div>
                    <div style={{fontSize:10,color:ROLE_COLORS[user.role]||th.muted}}>{user.role} · {user.dealerCity}</div>
                  </div>
                  {isManager(user) && <button onClick={function(){ setShowDash(true); setMenu(false); }} style={{width:"100%",padding:"10px 16px",background:"transparent",border:"none",color:"#4da6ff",cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif",textAlign:"left",fontWeight:600,borderBottom:"1px solid "+th.border}}>📊 Manager Dashboard</button>}
                  {(apMode||isManager(user)) && <button onClick={function(){ setShowBill(true); setMenu(false); }} style={{width:"100%",padding:"10px 16px",background:"transparent",border:"none",color:"#ff6b35",cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif",textAlign:"left",fontWeight:600,borderBottom:"1px solid "+th.border}}>📋 Billing Report</button>}
                  {isQC(user) && <button onClick={function(){ setShowQC(true); setMenu(false); }} style={{width:"100%",padding:"10px 16px",background:"transparent",border:"none",color:"#c084fc",cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif",textAlign:"left",fontWeight:600,borderBottom:"1px solid "+th.border}}>🔍 QC Review Feed</button>}
                  {myFlagCount > 0 && (
                    <div style={{padding:"8px 16px",borderBottom:"1px solid "+th.border}}>
                      <div style={{fontSize:11,color:"#e8313a",fontWeight:700}}>🚩 {myFlagCount} video{myFlagCount!==1?"s":""} flagged for reshoot</div>
                      <div style={{fontSize:10,color:th.muted,marginTop:2}}>Check flagged vehicles in your list</div>
                    </div>
                  )}
                  <button onClick={logout} style={{width:"100%",padding:"10px 16px",background:"transparent",border:"none",color:"#e8313a",cursor:"pointer",fontSize:13,fontFamily:"'Barlow',sans-serif",textAlign:"left",fontWeight:600}}>Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {DEMO_MODE && (
          <div style={{background:"#ffd70010",border:"1px solid #ffd70030",borderRadius:8,padding:"6px 12px",marginBottom:8,fontSize:11,color:"#ffd700",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>🎬 Demo Mode · Sample Cadillac inventory</span>
            <span style={{fontSize:9,color:"#ffd70066"}}>Set DEMO_MODE=false to go live</span>
          </div>
        )}

        {invError && (
          <div style={{background:"#e8313a12",border:"1px solid #e8313a33",borderRadius:8,padding:"8px 12px",marginBottom:8,fontSize:12,color:"#e8313a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>⚠ {invError}</span>
            <button onClick={fetchInv} style={{background:"none",border:"none",color:"#e8313a",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Barlow',sans-serif",marginLeft:8}}>Retry</button>
          </div>
        )}

        <div style={{position:"relative",marginBottom:8}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:th.faint,fontSize:17}}>⌕</span>
          <input style={{...inp(th),paddingLeft:36,paddingTop:10,paddingBottom:10,fontSize:14}} placeholder="VIN, Stock #, Make, Model, Color…" value={search} onChange={function(e){ setSearch(e.target.value); }} />
        </div>
        <div style={{display:"flex",gap:5,marginBottom:6}}>
          {filterOpts.map(function(item) {
            var f = item[0]; var lbl2 = item[1];
            return (
              <button key={f} onClick={function(){ setFilter(f); }} style={{flex:1,padding:"7px 0",background:filter===f?ac+"1a":"transparent",border:filter===f?"1px solid "+ac+"55":"1px solid "+th.border,borderRadius:7,color:filter===f?ac:th.muted,fontSize:f==="HasVideo"||f==="NeedsVideo"?12:11,cursor:"pointer",fontFamily:"'Barlow',sans-serif",fontWeight:700}}>{lbl2}</button>
            );
          })}
        </div>
        <select value={sortBy} onChange={function(e){ setSort(e.target.value); }} style={{...inp(th),padding:"8px 12px",fontSize:12,color:th.muted}}>
          <option value="videos">Sort: Videos First</option>
          <option value="price-asc">Sort: Price Low to High</option>
          <option value="price-desc">Sort: Price High to Low</option>
          <option value="miles">Sort: Miles Low to High</option>
        </select>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"10px 12px 16px"}}>
        <div style={{fontSize:10,color:th.faint,letterSpacing:1,textTransform:"uppercase",padding:"2px 2px 8px"}}>
          {invLoading ? "Fetching live inventory…" : filtered.length + " vehicles"}
        </div>
        {invLoading && [0,1,2,3,4].map(function(i) {
          return (
            <div key={i} style={{...card(th),padding:"13px 14px",marginBottom:8,animation:"pulse 1.5s infinite"}}>
              <div style={{height:15,background:th.border,borderRadius:4,width:"55%",marginBottom:8}} />
              <div style={{height:10,background:th.border,borderRadius:4,width:"35%",marginBottom:6}} />
              <div style={{height:10,background:th.border,borderRadius:4,width:"45%"}} />
            </div>
          );
        })}
        {!invLoading && filtered.map(function(v) {
          var vids = videos[v.vin] || [];
          var realVids = vids.filter(function(x){ return !x.isDemo; });
          var hasOfficial = vids.some(function(x){ return x.videoType==="Official"&&!x.isDemo; });
          var needsVideo = !hasOfficial;
          var totalSent = (sentLog[v.vin]||[]).length;
          var tc = TYPE_COLORS[v.type] || "#888";
          var hasFlag = realVids.some(function(vid){ return flags[vid.id]; });
          return (
            <div key={v.vin} onClick={function(){ selectVehicle(v.vin); }} style={{...card(th),padding:"12px 13px",marginBottom:8,border:hasFlag?"1px solid #e8313a33":(needsVideo&&apMode?"1px solid #ff6b3522":"1px solid "+th.border),cursor:"pointer",display:"flex",alignItems:"center",gap:11}}>
              {v.thumb ? (
                <img src={v.thumb} alt="" style={{width:56,height:42,borderRadius:8,objectFit:"cover",background:th.inp,flexShrink:0}} onError={function(e){ e.target.style.display="none"; }} />
              ) : (
                <div style={{width:56,height:42,borderRadius:8,background:th.inp,border:"1px solid "+th.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                  {v.type==="New"?"🆕":v.type==="CPO"?"⭐":"🚗"}
                </div>
              )}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:th.text}}>{v.year} {v.make} {v.model}</span>
                  <span style={{fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:3,letterSpacing:0.5,textTransform:"uppercase",background:tc+"22",color:tc,border:"1px solid "+tc+"44",flexShrink:0}}>{v.type}</span>
                </div>
                {v.trim && <div style={{fontSize:11,color:th.muted,marginBottom:3}}>{v.trim}{v.color ? " · " + v.color : ""}</div>}
                <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
                  {v.stock && <span style={{fontSize:10,color:th.faint,fontFamily:"monospace"}}>#{v.stock}</span>}
                  {v.miles>0 && <span style={{fontSize:10,color:th.muted}}>{fmtMiles(v.miles)}</span>}
                  {v.price>0 && <span style={{fontSize:12,fontWeight:600,color:th.sub}}>{fmtPrice(v.price)}</span>}
                  {hasOfficial && <span style={{fontSize:9,color:"#ffd700",background:"#ffd70015",border:"1px solid #ffd70033",padding:"1px 5px",borderRadius:3,fontWeight:700}}>★ Official</span>}
                  {vids.length>0 && <span style={{fontSize:9,color:"#00d97e",background:"#00d97e12",padding:"1px 5px",borderRadius:3,fontWeight:700}}>▶ {vids.length}</span>}
                  {!apMode && totalSent>0 && <span style={{fontSize:9,color:"#4da6ff",background:"#4da6ff12",padding:"1px 5px",borderRadius:3,fontWeight:700}}>📤 {totalSent}</span>}
                  {apMode && needsVideo && <span style={{fontSize:9,color:"#ff6b35",background:"#ff6b3512",padding:"1px 5px",borderRadius:3,fontWeight:700}}>Needs video</span>}
                  {hasFlag && <span style={{fontSize:9,color:"#e8313a",background:"#e8313a12",padding:"1px 5px",borderRadius:3,fontWeight:700}}>🚩 Reshoot</span>}
                </div>
              </div>
              <span style={{color:th.faint,fontSize:20,flexShrink:0}}>›</span>
            </div>
          );
        })}
        {!invLoading && filtered.length===0 && (
          <div style={{textAlign:"center",padding:"70px 20px",color:th.faint}}>
            <div style={{fontSize:44,marginBottom:12}}>🔍</div>
            <div style={{fontSize:14}}>No vehicles match</div>
          </div>
        )}
      </div>
      {toast && <Toast msg={toast} onDone={function(){ setToast(null); }} />}
      {showMenu && <div onClick={function(){ setMenu(false); }} style={{position:"fixed",inset:0,zIndex:99}} />}
    </div>
  );
}
