#!/usr/bin/env node
/**
 * CLI: node scripts/account-creation-agent.js --target https://tinder.com --prefix garuda --headless
 */
require("dotenv").config();
const { createAccount, listAccounts } = require("../src/services/accountCreationAgent");

async function main(){
  const args = process.argv.slice(2);
  const get = (k) => { const i=args.indexOf(k); return i!==-1 ? args[i+1] : null; };
  if(args.includes("--list")){
    console.log(JSON.stringify(listAccounts(), null, 2));
    return;
  }
  const target = get("--target") || args.find(a=>a.startsWith("http"));
  const prefix = get("--prefix") || "garuda";
  const headless = !args.includes("--no-headless");
  if(!target){
    console.log("Usage: node scripts/account-creation-agent.js --target https://tinder.com --prefix garuda");
    console.log("       node scripts/account-creation-agent.js --list");
    process.exit(1);
  }
  console.log(`🤖 GARUDA Account Agent → ${target} (prefix ${prefix}, headless ${headless})`);
  const res = await createAccount({ target, prefix, headless });
  console.log(JSON.stringify(res, null, 2));
}
if(require.main===module) main().catch(e=>{ console.error(e); process.exit(1); });
