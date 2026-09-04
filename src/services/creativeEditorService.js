/**
 * 🦅 GARUDA Creative Editor — ORCHESTRATOR for EDIT workflows
 * Ranks clips, maps beats, builds EDL + timeline, delegates render to mediaEditingService (ffmpeg)
 * Does NOT duplicate rendering — delegates.
 */
const mediaEditingService = require("./mediaEditingService");
const crypto = require("crypto");

class CreativeEditorService {
  async analyzeFootage(ingestRecords=[]){
    // Lightweight heuristic: sort by fileSize descending (larger ~ more content), mark first as hero
    const ranked = [...ingestRecords].map(r=> ({ assetId:r.assetId, filePath:r.filePath, fileSize:r.fileSize, mimetype:r.mimetype }))
      .sort((a,b)=> (b.fileSize||0)-(a.fileSize||0))
      .map((r,i)=> ({ ...r, rank:i+1, usable: (r.fileSize||0)>100, score: Math.max(10, 100 - i*10) }));
    return { total: ranked.length, ranked, usableCount: ranked.filter(r=>r.usable).length };
  }
  async buildEditPlan({ footageAnalysis, beatAnalysis, durationSec=60, style="cinematic" }){
    const usable = (footageAnalysis?.ranked||[]).filter(r=>r.usable);
    if(usable.length===0) throw new Error("No usable footage for edit plan");
    const beats = beatAnalysis?.beats||[];
    const cutCount = Math.min(usable.length, Math.max(3, Math.round(durationSec/6)));
    const selections = usable.slice(0, cutCount);
    const perClipSec = durationSec / selections.length;
    const edl = selections.map((clip,i)=>({
      edlId:`edl_${i+1}`,
      assetId: clip.assetId,
      filePath: clip.filePath,
      inSec: 0,
      outSec: perClipSec,
      beatSync: beats[i % Math.max(1, beats.length)]?.timeSec || (i+1)*perClipSec,
      transition: i===0 ? "fade_in" : (i===selections.length-1 ? "fade_out" : "cut"),
      style
    }));
    const timeline = { timelineId:`tl_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`, durationSec, edl, perClipSec, style, beatAligned: beats.length>0 };
    return { edl, timeline };
  }
  async renderFromPlan(timeline, options={}){
    if(!timeline||!timeline.edl||timeline.edl.length===0) throw new Error("Empty timeline");
    const inputs = timeline.edl.map(e=> e.filePath);
    const operations = [];
    if(options.textOverlay) operations.push({ text:{ text:String(options.textOverlay), x:20, y:40 }});
    if(options.targetSize) operations.push({ scale:{ w:options.targetSize.width, h:options.targetSize.height }});
    const outName = options.outputName || `musicvideo_${Date.now()}.mp4`;
    const result = await mediaEditingService.renderTimeline({ inputs, operations, outputName: outName });
    return { ...result, timelineId: timeline.timelineId, edl: timeline.edl };
  }
}
module.exports = new CreativeEditorService();
module.exports.CreativeEditorService = CreativeEditorService;
