/**
 * 🦅 GARUDA Creative Bible Service — Character / World / Visual Continuity
 * Extends existing Project Memory / Living Artifact infrastructure — NOT a new memory engine.
 * Persistence: data/creative-bibles.jsonl (same pattern as creative-briefs.jsonl)
 * Each bible entry is a Living Artifact evidence-backed record with provenance.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(process.cwd(), "data");
const BIBLE_FILE = path.join(DATA_DIR, "creative-bibles.jsonl");
function ensure(){ try{ if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true}); }catch{} }
function sha(s){ return crypto.createHash("sha256").update(JSON.stringify(s)).digest("hex"); }
const store = new Map(); // bibleId -> doc
function load(){ ensure(); try{ if(fs.existsSync(BIBLE_FILE)){ for(const l of fs.readFileSync(BIBLE_FILE,"utf8").split("\n").filter(Boolean)){ try{ const d=JSON.parse(l); if(d.bibleId) store.set(d.bibleId, d);}catch{}}}}catch{} }
load();
function append(d){ ensure(); try{ fs.appendFileSync(BIBLE_FILE, JSON.stringify(d)+"\n"); }catch{} }

class CreativeBibleService {
  clearForTesting(){ store.clear(); try{ if(fs.existsSync(BIBLE_FILE)) fs.unlinkSync(BIBLE_FILE);}catch{} }
  createCharacterBible(input={}){
    const bibleId = `char_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`;
    const doc = {
      bibleId, type:"CHARACTER_BIBLE",
      projectId: input.projectId||null,
      name: String(input.name||input.characterName||"Unnamed Character").trim(),
      description: String(input.description||"").trim(),
      appearance: input.appearance||{},
      age: input.age||null,
      hairstyle: input.hairstyle||input.hair||null,
      clothing: input.clothing||input.costume||null,
      accessories: input.accessories||[],
      personality: input.personality||null,
      voice: input.voice||null,
      referenceImageIds: input.referenceImageIds||[],
      continuityRules: input.continuityRules||["Maintain outfit and hairstyle across all shots"],
      approved: false,
      bibleHash: null,
      createdAt: new Date().toISOString()
    };
    doc.bibleHash = sha(doc);
    store.set(bibleId, doc);
    append(doc);
    return doc;
  }
  createWorldBible(input={}){
    const bibleId = `world_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`;
    const doc = {
      bibleId, type:"WORLD_BIBLE",
      projectId: input.projectId||null,
      location: String(input.location||input.worldName||"Unnamed World").trim(),
      architecture: input.architecture||null,
      environment: input.environment||null,
      geography: input.geography||null,
      lighting: input.lighting||null,
      atmosphere: input.atmosphere||null,
      recurringProps: input.recurringProps||[],
      visualRules: input.visualRules||[],
      referenceImageIds: input.referenceImageIds||[],
      bibleHash: null,
      createdAt: new Date().toISOString()
    };
    doc.bibleHash = sha(doc);
    store.set(bibleId, doc);
    append(doc);
    return doc;
  }
  createVisualBible(input={}){
    const bibleId = `visual_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`;
    const doc = {
      bibleId, type:"VISUAL_BIBLE",
      projectId: input.projectId||null,
      visualStyle: input.visualStyle||"cinematic",
      cameraLanguage: input.cameraLanguage||null,
      lighting: input.lighting||null,
      palette: input.palette||[],
      texture: input.texture||null,
      lensStyle: input.lensStyle||null,
      aspectRatio: input.aspectRatio||"16:9",
      framing: input.framing||null,
      motionStyle: input.motionStyle||null,
      approvedReferences: input.approvedReferences||[],
      bibleHash: null,
      createdAt: new Date().toISOString()
    };
    doc.bibleHash = sha(doc);
    store.set(bibleId, doc);
    append(doc);
    return doc;
  }
  getBible(bibleId){ return store.get(bibleId)||null; }
  listBibles(projectId=null, type=null){
    let arr = Array.from(store.values());
    if(projectId) arr = arr.filter(b=> b.projectId===projectId);
    if(type) arr = arr.filter(b=> b.type===type);
    return arr.sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt));
  }
  getProjectBibles(projectId){
    return {
      characters: this.listBibles(projectId,"CHARACTER_BIBLE"),
      worlds: this.listBibles(projectId,"WORLD_BIBLE"),
      visuals: this.listBibles(projectId,"VISUAL_BIBLE"),
    };
  }
}
module.exports = new CreativeBibleService();
module.exports.CreativeBibleService = CreativeBibleService;
