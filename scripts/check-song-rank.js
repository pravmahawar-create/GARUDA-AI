const yt = require("../src/services/youtubeDirectPushService");

async function checkRank() {
  const t = await yt.getFreshAccessToken();
  const queries = [
    "Praveen Mahawar Saara Zamaana",
    "Praveen Mahawar Sara Zamana",
    "Praveen Mahawar Live singing",
    "Praveen Mahawar Kishore Kumar",
    "Saara Zamaana Praveen Mahawar"
  ];

  console.log("=== CHECKING YOUTUBE SEARCH RANKINGS FOR VIDEO: s-uFBOXA0ME ===\n");

  for (const q of queries) {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=25`, {
      headers: { Authorization: `Bearer ${t}` }
    });
    const data = await res.json();
    const items = data.items || [];
    const index = items.findIndex(i => i.id?.videoId === "s-uFBOXA0ME");
    if (index >= 0) {
      console.log(`🎯 "${q}" -> RANK #${index + 1} (TOP RESULT!)`);
    } else {
      console.log(`ℹ️ "${q}" -> Not in top ${items.length} (First result: "${items[0]?.snippet?.title}")`);
    }
  }
}

checkRank().catch(console.error);
