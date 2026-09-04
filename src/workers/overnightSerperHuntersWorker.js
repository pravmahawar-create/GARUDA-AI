// GARUDA Overnight Serper Hunters — Laptop band ke baad bhi subah tak chalega
// Founder permission YES for tonight (auto-approve), 2500 credits loop, garudaos.ai@gmail.com
const fs = require("fs");
const path = require("path");

const SERPER_CREDITS_TOTAL = 2500;
const CREDITS_PER_ROUND = 60; // 10 hunters x ~6 queries avg
const MAX_ROUNDS = Math.floor(SERPER_CREDITS_TOTAL / CREDITS_PER_ROUND); // ~41 rounds

let running = false;
let intervalHandle = null;
let creditsUsed = 0;

function founderApprovedTonight(){
  // YES for tonight — auto-approve till 06:00 next morning IST
  const now = new Date();
  const tonightEnd = new Date();
  tonightEnd.setHours(6,0,0,0);
  if (tonightEnd <= now) tonightEnd.setDate(tonightEnd.getDate()+1);
  return now < tonightEnd;
}

async function runOneRound(roundNum){
  const workforce = require("../services/workforceRouterService");
  const hunters = [
    "agent.personal_uk_web_hunter",
    "agent.personal_usa_web_hunter",
    "agent.personal_dubai_web_hunter",
    "agent.personal_australia_web_hunter",
    "agent.personal_nz_web_hunter",
    "agent.personal_silicon_valley_web_hunter",
    "agent.personal_uk_mobile_hunter",
    "agent.personal_usa_mobile_hunter",
    "agent.personal_global_software_hunter",
    "agent.personal_global_automation_hunter",
  ];
  console.log(`[Overnight] Round ${roundNum}/${MAX_ROUNDS} — ${new Date().toISOString()} — creditsUsed ${creditsUsed}/${SERPER_CREDITS_TOTAL}`);
  for(const hunterId of hunters){
    if(creditsUsed >= SERPER_CREDITS_TOTAL) break;
    try{
      console.log(`[Overnight] Dispatching ${hunterId}...`);
      const result = await workforce.dispatchAgentTask(hunterId, {limit: 5});
      creditsUsed += 6; // approx queries per hunter
      console.log(`[Overnight] ${hunterId} -> ${result.result?.emailsFound||0} leads, scanned ${result.result?.scanned||0}`);
      // Auto send emails via Brevo if leads found and founder approved tonight
      if(result.result?.emailsFound > 0 && founderApprovedTonight()){
        try{
          const { getPipeline } = require("../services/leadgen/genericLeadGenEngine");
          const pipeline = getPipeline({domain:"web_services"});
          const prospects = pipeline.prospects || [];
          // Send only newly found (last 5) that are HOT/STRONG and not yet queued
          const toSend = prospects.filter(p=>p.status==="scored" && p.grade!=="LOW").slice(-5);
          if(toSend.length){
            const outreach = require("../services/leadgen/genericOutreachEngine");
            // Build contacts CSV and send via Brevo relay (garudaos.ai@gmail.com)
            const csv = await outreach.generateContactsCsv({domain:"web_services", minScore:60});
            console.log(`[Overnight] Generated contacts CSV for ${toSend.length} prospects`);
            // Use garudaOutreachDispatchService for governed send (auto-approved tonight)
            const dispatch = require("../services/garudaOutreachDispatchService");
            for(const prospect of toSend.slice(0,2)){ // limit 2 per round to avoid spam, 10 hunters *2 =20 per round
              try{
                await dispatch.approveAndDispatchOutreach({
                  prospectId: prospect.id,
                  founderApproved: true, // YES tonight
                  relayFrom: "garudaos.ai@gmail.com",
                  subject: `Quick idea for ${prospect.businessName}`,
                  pitch: `Hello ${prospect.businessName}, we noticed your website could use a refresh. GARUDA builds fast, modern websites and mobile apps (iOS/Android) and automation software. Contact: garudaos.ai@gmail.com — genuine audit, no fake promises.`,
                });
                console.log(`[Overnight] Email sent to ${prospect.email} via garudaos.ai@gmail.com`);
              }catch(e){ console.log(`[Overnight] Send failed ${prospect.email}: ${String(e.message).slice(0,100)}`); }
            }
          }
        }catch(e){ console.log(`[Overnight] Outreach error: ${String(e.message).slice(0,100)}`); }
      }
      // Small delay between hunters to avoid rate limit
      await new Promise(r=>setTimeout(r, 2000));
    }catch(e){
      console.log(`[Overnight] Hunter ${hunterId} failed: ${String(e.message).slice(0,100)}`);
    }
    if(creditsUsed >= SERPER_CREDITS_TOTAL){
      console.log(`[Overnight] Credits exhausted ${creditsUsed}/${SERPER_CREDITS_TOTAL} — stopping`);
      break;
    }
  }
  // Save credits used
  try{
    const statusPath = path.join(__dirname, "..", "..", "data", "overnight-hunters-status.json");
    fs.mkdirSync(path.dirname(statusPath), {recursive:true});
    fs.writeFileSync(statusPath, JSON.stringify({round:roundNum, creditsUsed, total: SERPER_CREDITS_TOTAL, lastRun: new Date().toISOString(), founderApprovedTonight: founderApprovedTonight()},null,2));
  }catch{}
}

function startOvernightLoop(){
  if(running) return {started:false, reason:"already running"};
  running=true;
  console.log("[Overnight] Starting overnight loop — laptop band ke baad bhi chalega (Render pe) — 2500 credits, founder YES tonight");
  let round=1;
  const loop = async ()=>{
    if(!founderApprovedTonight()){
      console.log("[Overnight] Founder approval for tonight expired (06:00) — stopping loop");
      stopOvernightLoop();
      return;
    }
    if(creditsUsed >= SERPER_CREDITS_TOTAL){
      console.log("[Overnight] Credits done — stopping");
      stopOvernightLoop();
      return;
    }
    await runOneRound(round++);
    if(round > MAX_ROUNDS || creditsUsed >= SERPER_CREDITS_TOTAL){
      console.log("[Overnight] All rounds done");
      stopOvernightLoop();
    }
  };
  // Run immediately first round, then every 15 min till morning
  loop();
  intervalHandle = setInterval(loop, 15*60*1000);
  return {started:true, intervalMs:15*60*1000, maxRounds:MAX_ROUNDS};
}
function stopOvernightLoop(){
  if(intervalHandle) clearInterval(intervalHandle);
  intervalHandle=null;
  running=false;
  console.log("[Overnight] Stopped");
}
function getOvernightStatus(){
  try{
    const p=path.join(__dirname, "..", "..", "data", "overnight-hunters-status.json");
    if(fs.existsSync(p)) return JSON.parse(fs.readFileSync(p,"utf8"));
  }catch{}
  return {running, creditsUsed, total: SERPER_CREDITS_TOTAL, founderApprovedTonight: founderApprovedTonight()};
}

module.exports={ startOvernightLoop, stopOvernightLoop, getOvernightStatus, runOneRound, founderApprovedTonight };
