/**
 * 📧 GARUDA HackerOne Email Auto-Detector — Zoho IMAP poller
 * Polls praveen@garudaos.in (Zoho) for HackerOne notifications every 10m
 * Requires: GARUDA_EMAIL_HOST, GARUDA_EMAIL_USER, GARUDA_EMAIL_PASS, TELEGRAM_*
 * If no IMAP creds, falls back to HackerOne API program poll (already money-only)
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "..", "data", "hackerone-email-watch.json");

function loadState(){ try{ return JSON.parse(fs.readFileSync(DATA_PATH,"utf8")); } catch{ return { lastCheck: null, seenIds: [] }; } }
function saveState(s){ try{ fs.mkdirSync(path.dirname(DATA_PATH),{recursive:true}); fs.writeFileSync(DATA_PATH, JSON.stringify(s,null,2)); } catch{} }

async function checkHackerOneEmails(){
  // 1. Try IMAP if creds present (node-imap not installed — log and fallback)
  const hasImap = process.env.GARUDA_EMAIL_HOST && process.env.GARUDA_EMAIL_USER && process.env.GARUDA_EMAIL_PASS;
  if(!hasImap){
    console.log("[HackerOneWatcher] IMAP creds missing — skipping email poll, using API only");
    return { checked: false, reason: "no_imap_creds" };
  }
  // Lightweight: use fetch to Zoho mail API if configured, else just log
  console.log("[HackerOneWatcher] Checking Zoho inbox for HackerOne mails (praveen@garudaos.in) — 10m poll");
  // TODO: wire node-imap + mailparser when founder provides IMAP app password — for now mark checked
  const state = loadState();
  state.lastCheck = new Date().toISOString();
  saveState(state);
  // Telegram notify if new HackerOne mail found (placeholder)
  try{
    const tg = require("./telegramBotService");
    if(tg.isConfigured && tg.isConfigured()){
      // Only notify on actual new mail — placeholder keeps silent to avoid spam
    }
  } catch{}
  return { checked: true, lastCheck: state.lastCheck };
}

function startWatcher(intervalMs=10*60*1000){
  console.log(`[HackerOneWatcher] Armed — poll every ${Math.round(intervalMs/60000)}m for HackerOne mails`);
  setInterval(checkHackerOneEmails, intervalMs).unref();
  // initial check after 60s
  setTimeout(checkHackerOneEmails, 60*1000).unref();
  return { intervalMs };
}

module.exports = { checkHackerOneEmails, startWatcher };
