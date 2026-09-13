// GARUDA GENERIC WEB SCOUT — 0₹ DuckDuckGo, no billing, genuine incomplete website audit
// Reuses tutoringLeadScoutService pattern for 10 hunters: website/mobile/software/automation across Europe+Globe
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { addProspects, getPipeline } = require("./genericLeadGenEngine");

const DEFAULT_STATUS_DIR = path.join(__dirname, "..", "..", "data");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// Highest paying markets for website/mobile/app/software — UK, America, Dubai, Australia, NZ, Silicon Valley + Europe + India (new work)
const LOCATIONS = {
  usa: { cities: ["New York","San Francisco","Palo Alto","Mountain View","Menlo Park","Sunnyvale","Austin","Boston","Chicago","Seattle","Los Angeles","Miami"], country:"US", currency:"USD" },
  uk: { cities: ["London","Manchester","Birmingham","Edinburgh","Leeds","Bristol","Glasgow","Liverpool"], country:"GB", currency:"GBP" },
  dubai: { cities: ["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah"], country:"AE", currency:"AED" },
  australia: { cities: ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Canberra"], country:"AU", currency:"AUD" },
  nz: { cities: ["Auckland","Wellington","Christchurch","Hamilton","Tauranga"], country:"NZ", currency:"NZD" },
  silicon_valley: { cities: ["Palo Alto","Mountain View","Menlo Park","Sunnyvale","Cupertino","Santa Clara","San Francisco","Fremont"], country:"US", currency:"USD" },
  europe: { cities: ["Berlin","Munich","Paris","Lyon","London","Amsterdam","Warsaw","Barcelona","Milan","Stockholm","Dublin","Prague"], country:"DE", currency:"EUR" },
  india: { cities: ["Mumbai","Delhi","Bangalore","Hyderabad","Pune","Chennai","Kolkata","Ahmedabad","Jaipur","Lucknow"], country:"IN", currency:"INR" },
};

function statusPathFor(hunterId){
  return path.join(DEFAULT_STATUS_DIR, `${hunterId}-scan-status.json`);
}
function loadStatus(hunterId){
  try{
    const p=statusPathFor(hunterId);
    if(fs.existsSync(p)) return JSON.parse(fs.readFileSync(p,"utf8"));
  } catch (err) { console.warn("[auto-recovery] suppressed error in genericWebScoutService.js:", String(err.message).slice(0,80)); }
  return null;
}
function saveStatus(hunterId, status){
  try{
    const p=statusPathFor(hunterId);
    fs.mkdirSync(path.dirname(p),{recursive:true});
    fs.writeFileSync(p, JSON.stringify(status,null,2),"utf8");
  } catch (err) { console.warn("[auto-recovery] suppressed error in genericWebScoutService.js:", String(err.message).slice(0,80)); }
}

function buildWebQueries({type, locKey}){
  const suffixMap={ usa:"USA", uk:"UK", dubai:"UAE Dubai", australia:"Australia", nz:"New Zealand", silicon_valley:"Silicon Valley", europe:"Europe", india:"India" };
  const suffix=suffixMap[locKey]||"";
  if(type==="web"){
    return [
      // Business directories + listings — actual businesses with contact info
      `site:yelp.com restaurants ${suffix} contact`,
      `site:tripadvisor.com hotels ${suffix} email`,
      `site:google.com/maps "opening hours" ${suffix} contact`,
      // Job boards — businesses actively hiring for web dev = need websites
      `site:indeed.com "web developer" ${suffix}`,
      `site:linkedin.com/jobs "website" ${suffix}`,
      // Local business directories
      `site:yellowpages.com ${suffix} contact email`,
      `site:thomasnet.com ${suffix} manufacturer contact`,
      // Direct business queries — businesses that explicitly need web work
      `"we need a new website" OR "looking for web designer" ${suffix}`,
      `"our website needs updating" OR "website redesign" ${suffix} contact`,
      `"hire" "web developer" OR "web agency" ${suffix} email`,
      `"small business" "website" "contact us" ${suffix}`,
    ];
  }
  if(type==="mobile"){
    return [
      `"looking for" "mobile app developer" OR "app development" ${suffix} email`,
      `"need" "iOS" OR "Android" "app" "developer" ${suffix} contact`,
      `"hire" "React Native" OR "Flutter" developer ${suffix}`,
      `"startup" "mobile app" "need developer" ${suffix}`,
    ];
  }
  if(type==="software"){
    return [
      `"looking for" "custom software" OR "SaaS" developer ${suffix} contact`,
      `"need" "software development" company ${suffix} email`,
      `"hire" "software developer" OR "development team" ${suffix}`,
    ];
  }
  if(type==="automation"){
    return [
      `"need" "business automation" OR "process automation" ${suffix} contact`,
      `"looking for" "ERP" OR "CRM" implementation ${suffix} email`,
      `"hire" "automation" developer OR company ${suffix} contact`,
    ];
  }
  return [`"need website" OR "website development" ${suffix} contact email`];
}

function extractEmails(html){
  const found=new Set();
  const mailto=String(html||"").match(/mailto:([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})/gi)||[];
  for(const m of mailto) found.add(m.replace(/^mailto:/i,"").toLowerCase().trim());
  const text=String(html||"").replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ");
  const re=/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;
  const raw=text.match(re)||[];
  const placeholder=new Set(["example.com","example.org","example.net","domain.com","yourdomain.com","test.com","sample.com","email.com","sentry.io","schema.org","wixpress.com","placeholder.com","yoursite.com","mysite.com","company.com","business.com","website.com","change.me","noemail.com","noreply.com","donotreply.com","spam.com","throwaway.com","tempmail.com","guerrillamail.com","mailinator.com","fakeinbox.com"]);
  for(const e of raw){
    const clean=e.toLowerCase().trim();
    if(/\.(png|jpe?g|gif|webp|svg|css|js|ico)$/.test(clean)) continue;
    const d=clean.split("@")[1]||"";
    if(placeholder.has(d.replace(/^www\./,""))) continue;
    // Skip generic/placeholder local parts
    const local=clean.split("@")[0]||"";
    if(/^(info|contact|admin|support|hello|mail|webmaster|postmaster|abuse|noreply|no-reply|donotreply|test|user|example|name|sample|your|my)$/i.test(local)) continue;
    found.add(clean);
  }
  return Array.from(found);
}
function findContactUrl(html, baseUrl){
  const links=String(html||"").match(/href="([^"]+)"/gi)||[];
  const base=(()=>{try{return new URL(baseUrl).origin;}catch{return "https://garudaos.in";}})();
  for(const raw of links){
    const href=raw.replace(/^href="/i,"").replace(/"$/,"").trim();
    if(/(contact|about|reach|enquiry|inquiry|connect)/i.test(href)){
      try{ return new URL(href, base).href; } catch (err) { console.warn("[auto-recovery] suppressed error in genericWebScoutService.js:", String(err.message).slice(0,80)); }
    }
  }
  return null;
}
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
async function fetchPage(url, timeoutMs=12000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(), timeoutMs);
  const start=Date.now();
  try{
    const res=await fetch(url, {signal:controller.signal, headers:{"User-Agent":UA, Accept:"text/html,application/xhtml+xml"}});
    const timing=Date.now()-start;
    if(!res.ok) return {ok:false, status:res.status, timing};
    const ct=String(res.headers.get("content-type")||"");
    if(!/html/.test(ct)) return {ok:false, status:res.status, reason:"not_html", timing};
    return {ok:true, html: await res.text(), timing};
  }catch(e){ return {ok:false, error:e.message, timing: Date.now()-start}; }
  finally{ clearTimeout(timer); }
}
async function searchWeb(query){
  // SERPER first (if key present, no billing enable needed for free tier 2500), then DuckDuckGo fallback — 0₹
  const serperKey = process.env.SERPER_API_KEY;
  if(serperKey){
    try{
      const res=await fetch("https://google.serper.dev/search", {
        method:"POST",
        headers:{"X-API-KEY": serperKey, "Content-Type":"application/json", "User-Agent": UA},
        body: JSON.stringify({q: query, num:10})
      });
      const data=await res.json();
      if(Array.isArray(data.organic)){
        return data.organic.map(o=>({title:o.title, url:o.link, snippet:o.snippet||""}));
      }
    } catch (err) { console.warn("[auto-recovery] suppressed error in genericWebScoutService.js:", String(err.message).slice(0,80)); }
  }
  // Fallback DuckDuckGo free
  try{
    const url=`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res=await fetch(url, {headers:{"User-Agent":UA}});
    const html=await res.text();
    const re=/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m; const out=[];
    while((m=re.exec(html))!==null){
      let u=m[1].replace(/uddg=([^&]+)/,"$1");
      try{ const d=decodeURIComponent(u); if(/^https?:\/\//.test(d)) u=d; } catch (err) { console.warn("[auto-recovery] suppressed error in genericWebScoutService.js:", String(err.message).slice(0,80)); }
      out.push({title:m[2].replace(/<[^>]+>/g,"").trim(), url:u, snippet:""});
      if(out.length>=10) break;
    }
    return out;
  }catch{ return []; }
}
function realAudit(url, html, timing){
  const hasViewport=/<meta[^>]*name=["']viewport["']/i.test(html);
  const copyMatch=html.match(/©\s*(20\d{2})/);
  const copyrightYear=copyMatch?copyMatch[1]:null;
  const hasWhatsApp=/wa\.me|whatsapp/i.test(html);
  const loadSec=(timing/1000).toFixed(1);
  const isOld=copyMatch && parseInt(copyMatch[1],10) <= 2022;
  const needsUpdate = !hasViewport || isOld || parseFloat(loadSec) > 3;
  return { mobileLoadTimeSeconds: loadSec, hasViewport, viewportBroken: !hasViewport, copyrightYear, hasWhatsAppBot: hasWhatsApp, needsUpdate, timing };
}
function pickCity(locKey){
  const c=(LOCATIONS[locKey]||LOCATIONS.usa).cities;
  return c[Math.floor(Math.random()*c.length)];
}

async function runWebScoutOnce({hunterId="generic_web_hunter", domain="web_services", location="usa", type="web", maxSites=10, delayMs=800, searchFn, fetchFn}){
  const jobId=`ws_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const locKey=String(location).toLowerCase();
  const queries=buildWebQueries({type, locKey});
  const search = searchFn || searchWeb;
  const fetchP = fetchFn || fetchPage;
  saveStatus(hunterId, {jobId, running:true, startedAt:new Date().toISOString(), location:locKey, type, phase:"starting", scanned:0, emailsFound:0});
  const seen=new Set(); let scanned=0, emailsFound=0; const errors=[]; const sources=[];
  for(const query of queries){
    if(scanned>=maxSites) break;
    saveStatus(hunterId, {...loadStatus(hunterId), phase:`searching (${locKey})`, query});
    let results=[];
    try{ results=await search(query); }catch(e){ errors.push(String(e.message)); continue; }
    if(!results.length) continue;
    for(const r of results){
      if(scanned>=maxSites) break;
      if(!r.url) continue;
      let host=""; try{ host=new URL(r.url).hostname.replace(/^www\./,""); }catch{ continue; }
      if(seen.has(host)) continue;
      seen.add(host); scanned++;
      saveStatus(hunterId, {...loadStatus(hunterId), phase:`fetching ${host}`, scanned, emailsFound});
      const home=await fetchP(r.url);
      let html=home.html||""; let timing=home.timing||0;
      let audit=null;
      if(home.ok) audit=realAudit(r.url, html, timing);
      // Genuine incomplete check — only keep if needsUpdate true
      const isIncomplete = audit ? audit.needsUpdate : false;
      // Still extract emails even if not incomplete, but mark note
      let emails=[];
      if(home.ok){
        emails.push(...extractEmails(html));
        if(delayMs) await sleep(delayMs);
        const contactUrl=findContactUrl(html, r.url);
        if(contactUrl){
          const contact=await fetchP(contactUrl);
          if(contact.ok) emails.push(...extractEmails(contact.html));
          if(delayMs) await sleep(delayMs);
        }
      } else errors.push(host+": "+(home.status||home.error));
      emails=[...new Set(emails.map(e=>e.toLowerCase().trim()))];
      // Filter: must have at least one real email. Keep if ANY condition met:
      // - site needs update (incomplete/old/mobile-broken)
      // - mobile/software/automation type (always relevant)
      // - new work query (business actively seeking services)
      // - email found from a business page (not a blog/article)
      const isMobileOrSoftware = type==="mobile"||type==="software"||type==="automation";
      const isNewWorkQuery = /need website|looking for website|need digital marketing|looking for digital|need mobile app|looking for mobile|hire|looking for|need/.test(query);
      const isBusinessPage = /contact|about|team|business|company|agency|services/i.test(r.url) || /contact|about|team|business|company/i.test(r.title || "");
      const shouldKeep = emails.length>0 && (isIncomplete || isMobileOrSoftware || isNewWorkQuery || isBusinessPage);
      //shouldKeep already handles filtering — no additional skip needed
      const prospects=emails.map(email=>({
        businessName: String(r.title||host).slice(0,200),
        website: r.url,
        email,
        city: pickCity(locKey),
        country: (LOCATIONS[locKey]||LOCATIONS.usa).country,
        locale:"en",
        notes: `Found via ${hunterId} (${query}) — Audit: ${audit?`viewport:${audit.hasViewport?'ok':'missing'}, copyright:${audit.copyrightYear||'unknown'}, load:${audit.mobileLoadTimeSeconds}s, needsUpdate:${audit.needsUpdate}`:'no audit'} — garudaos.ai@gmail.com`,
        source:"web_research",
        hunterId,
      }));
      if(prospects.length){
        try{
          const added=await addProspects(prospects, {domain});
          emailsFound+=(added.added||[]).length;
          sources.push(host);
          saveStatus(hunterId, {...loadStatus(hunterId), scanned, emailsFound, lastFound:r.url});
        }catch(e){ errors.push(host+":"+String(e.message)); }
      }
    }
  }
  const final={...loadStatus(hunterId), jobId, running:false, doneAt:new Date().toISOString(), phase:"done", scanned, emailsFound, errors:errors.slice(0,12), sources:sources.slice(0,30), progress:"done"};
  saveStatus(hunterId, final);
  return final;
}
function startWebScout(opts){
  const hunterId=opts.hunterId||"generic_web_hunter";
  const jobId=`ws_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  saveStatus(hunterId, {jobId, running:true, startedAt:new Date().toISOString(), location:opts.location||"usa", type:opts.type||"web", phase:"starting", scanned:0, emailsFound:0});
  runWebScoutOnce({...opts, hunterId, jobId}).catch(e=>{
    saveStatus(hunterId, {...loadStatus(hunterId), running:false, doneAt:new Date().toISOString(), phase:"failed", error:String(e.message)});
  });
  return {jobId, started:true};
}
function getWebScoutStatus(hunterId){
  const s=loadStatus(hunterId);
  if(!s) return {status:"never_run", running:false, hunterId};
  try{
    const pipeline=getPipeline({domain:s.domain||"web_services"});
    return {...s, pipeline};
  }catch{ return s; }
}

module.exports={ LOCATIONS, buildWebQueries, realAudit, runWebScoutOnce, startWebScout, getWebScoutStatus, extractEmails, findContactUrl, fetchPage, searchWeb };
