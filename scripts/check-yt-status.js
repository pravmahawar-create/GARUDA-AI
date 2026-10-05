const youtubeService = require("../src/services/youtubeDirectPushService");

async function checkYouTubeStatus() {
  console.log("=== YOUTUBE SEO STATUS ===");
  const garudaStatus = youtubeService.getStatus("garuda");
  console.log("GARUDA Channel:", JSON.stringify(garudaStatus, null, 2));

  const praveenStatus = youtubeService.getStatus("praveen");
  console.log("Praveen Channel:", JSON.stringify(praveenStatus, null, 2));
}

checkYouTubeStatus().catch(console.error);
