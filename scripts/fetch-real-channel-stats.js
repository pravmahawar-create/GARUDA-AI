const youtubeService = require("../src/services/youtubeDirectPushService");

async function fetchChannelDetails(profile) {
  const token = await youtubeService.getFreshAccessToken(profile);
  if (!token) return { profile, error: "No valid access token available" };

  try {
    const chRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&mine=true", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!chRes.ok) {
      const err = await chRes.text();
      return { profile, error: `Channel API error: ${chRes.status} ${err}` };
    }
    const data = await chRes.json();
    const item = data.items?.[0];
    if (!item) return { profile, error: "No channel item returned" };

    // Fetch latest 5 uploads
    const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads || ("UU" + item.id.substring(2));
    const plRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    let latestVideos = [];
    if (plRes.ok) {
      const plData = await plRes.json();
      latestVideos = (plData.items || []).map(v => ({
        id: v.snippet?.resourceId?.videoId,
        title: v.snippet?.title,
        publishedAt: v.snippet?.publishedAt
      }));
    }

    return {
      profile,
      channelId: item.id,
      title: item.snippet?.title,
      customUrl: item.snippet?.customUrl,
      description: item.snippet?.description?.substring(0, 150),
      statistics: {
        viewCount: item.statistics?.viewCount,
        subscriberCount: item.statistics?.subscriberCount,
        hiddenSubscriberCount: item.statistics?.hiddenSubscriberCount,
        videoCount: item.statistics?.videoCount
      },
      latestVideos
    };
  } catch (e) {
    return { profile, error: e.message };
  }
}

async function main() {
  console.log("Fetching live YouTube data...\n");
  const garuda = await fetchChannelDetails("garuda");
  const praveen = await fetchChannelDetails("praveen");

  console.log("=== GARUDA CHANNEL LIVE STATS ===");
  console.log(JSON.stringify(garuda, null, 2));

  console.log("\n=== PRAVEEN CHANNEL LIVE STATS ===");
  console.log(JSON.stringify(praveen, null, 2));
}

main().catch(console.error);
