/**
 * 🦅 GARUDA Creative Director — ORCHESTRATOR (not executor)
 * Uses existing engines: creativeStudioService, storyboards, bibles, generation, QC
 * Director = planning brain; Engines = execution.
 */
const creativeStudioService = require("./creativeStudioService");
const creativeBibleService = require("./creativeBibleService");
const videoGenerationRouter = require("./videoGenerationRouter");
const creativeQualityService = require("./creativeQualityService");

class CreativeDirectorService {
  async createProductionPlan(input={}){
    const brief = await creativeStudioService.createCreativeBrief({
      title: String(input.title||input.story||input.concept||"Untitled Production").slice(0,120),
      brandName: input.brandName||"GARUDA",
      projectId: input.projectId||null,
      industry: input.industry||"Film",
      location: input.location||null,
    });
    try{ await creativeStudioService.generateConcept(brief.briefId);}catch{}
    // Build bibles if supplied
    let characterBible=null, worldBible=null, visualBible=null;
    if(input.character) characterBible = creativeBibleService.createCharacterBible({ projectId: brief.projectId||brief.briefId, ...input.character, name: input.character.name||input.character.characterName });
    if(input.world) worldBible = creativeBibleService.createWorldBible({ projectId: brief.projectId||brief.briefId, ...input.world });
    if(input.visual) visualBible = creativeBibleService.createVisualBible({ projectId: brief.projectId||brief.briefId, ...input.visual });

    // Shot plan derived from storyboard engine shape
    const storyboardRes = await videoGenerationRouter.routeVideoGeneration({
      title: brief.title,
      location: brief.productSpecs?.location||"Prime Corridor",
      priceRange: brief.productSpecs?.priceRange||"Premium",
      format: input.aspectRatio==="9:16" ? "REEL_9_16" : "LANDSCAPE_16_9",
      style: input.style||"REAL_ESTATE_CINEMATIC",
      briefId: brief.briefId,
      projectId: brief.projectId||null,
    });
    const storyboard = storyboardRes.storyboard;
    const scenes = storyboard.scenes.map((s,i)=>({
      sceneNumber: s.sceneNumber||i+1,
      timecode: s.timecode||s.timeCode||`00:0${i*5} - 00:0${(i+1)*5}`,
      shots: [{ shotId:`shot_${i+1}_1`, camera:s.shotPlan?.cameraMovement||s.cameraMovement, lens:s.shotPlan?.focalLength||"35mm", framing:s.shotPlan?.framing||"Wide", prompt:s.generativeScenePrompt||s.visual }],
      characterBibleId: characterBible?.bibleId||null,
      worldBibleId: worldBible?.bibleId||null,
      visualBibleId: visualBible?.bibleId||null,
    }));
    const plan = {
      planId:`dir_${Date.now()}`,
      briefId: brief.briefId,
      projectId: brief.projectId||brief.briefId,
      title: brief.title,
      bibleRefs:{ characterBible, worldBible, visualBible },
      scenes,
      storyboard,
      status:"PLANNED",
      createdAt: new Date().toISOString(),
    };
    return plan;
  }
  async validatePlan(plan){
    if(!plan||!plan.storyboard) return { passed:false, reason:"Missing storyboard" };
    return { passed:true, status:"PASSED", sceneCount: plan.storyboard.sceneCount||plan.storyboard.scenes?.length||0 };
  }
}
module.exports = new CreativeDirectorService();
module.exports.CreativeDirectorService = CreativeDirectorService;
