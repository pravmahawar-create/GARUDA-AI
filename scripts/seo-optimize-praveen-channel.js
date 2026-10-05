#!/usr/bin/env node
/**
 * 🦅 GARUDA YouTube SEO Optimization Engine for Praveen Mahawar Channel
 * Channel: @Praveen-Mahawar-111 (Comedy & Soulful Singing)
 * 
 * Honors the #raavee and 😍😍😍🤗🤗❣️ love signature with Ayesha
 * while injecting algorithmic high-CTR titles, rich descriptions, and search tags.
 */
require("dotenv").config();
const youtubeService = require("../src/services/youtubeDirectPushService");

const OPTIMIZED_VIDEOS = [
  {
    videoId: "wPN5QTCJmS4",
    title: "Bhai Ne Stage Par Aag Laga Di! 🔥 'Sara Zamana' Kishore Kumar Live | Praveen Mahawar 😍😍😍🤗🤗❣️ #raavee",
    description: `Kishore Kumar ji ka timeless iconic classic 'Sara Zamana' (Yaarana) live stage performance at family function by Praveen Mahawar! Pure high-energy celebration, family cheering & stage madness! 💥

❤️ Emotional Love Signature: #raavee 😍😍😍🤗🤗❣️

🎤 Performer: Praveen Mahawar
🎵 Song: Sara Zamana Haseeno Ka Deewana (Kishore Kumar / Yaarana)
🎬 Genre: Retro Bollywood Live Singing & Family Comedy Energy

Subscribe for more raw soulful singing, Kishore Da classics, and comedy moments!

#PraveenMahawar #SaraZamana #KishoreKumar #LiveSinging #FamilyFunction #IndianWeddingDance #Shorts #raavee #BollywoodClassics #RetroBollywood #TrendingShorts`,
    tags: ["Praveen Mahawar", "Sara Zamana", "Kishore Kumar songs", "live singing", "family function dance", "sangeet performance", "raavee", "old hindi songs", "viral shorts", "Bollywood classics", "Yaarana live", "stage performance"],
    categoryId: "10"
  },
  {
    videoId: "PSlYx4H0ghY",
    title: "Stage Par Aag Laga Di! 🤯 'Sara Zamana' Live Madness | Praveen Mahawar 😍😍😍🤗🤗❣️ #raavee",
    description: `When the stage caught real fire at a family function! Comedian & Singer Praveen Mahawar taking over the stage with Kishore Kumar's immortal 'Sara Zamana'. Pure entertainment and comedy! 🔥

❤️ Love Signature: #raavee 😍😍😍🤗🤗❣️

🎤 Performer: Praveen Mahawar
🎵 Original Track: Sara Zamana (Kishore Kumar)
✨ Channel: Praveen Mahawar — Comedy, Raw Singing & Life Moments

#PraveenMahawar #SaraZamana #StageFire #FamilyFunction #ComedyShorts #LiveSinging #raavee #ViralIndianShorts #RetroClassics #YouTubeShorts`,
    tags: ["Praveen Mahawar", "Sara Zamana", "stage fire video", "family function comedy", "live singing", "Indian comedy shorts", "raavee", "Kishore Kumar", "viral shorts", "wedding dance comedy"],
    categoryId: "10"
  },
  {
    videoId: "4hA-ntBeokU",
    title: "Kal Ho Naa Ho (Har Ghadi Badal Rahi Hai) Soulful Cover 💔 Praveen Mahawar 😍😍😍🤗🤗❣️ #raavee",
    description: `Heartfelt unplugged cover of the immortal masterpiece 'Kal Ho Naa Ho' (originally sung by legend Sonu Nigam). Sung straight from a heartbroken soul. 💔

❤️ Love Signature: #raavee 😍😍😍🤗🤗❣️

🎤 Vocals: Praveen Mahawar
🎵 Original Song: Kal Ho Naa Ho (Sonu Nigam / Shankar-Ehsaan-Loy / Javed Akhtar)
🎸 Mood: Heartbroken, Soulful, Unplugged Bollywood

If you feel the depth and pain in every word, please like, comment, and share.

#KalHoNaaHo #SonuNigam #PraveenMahawar #SoulfulCover #Heartbroken #SadSongs #UnpluggedHindi #raavee #EmotionalSongs #ShahrukhKhan #BollywoodClassics`,
    tags: ["Kal Ho Naa Ho", "Sonu Nigam", "Har Ghadi Badal Rahi Hai", "Praveen Mahawar", "soulful cover", "heartbroken song", "unplugged hindi songs", "raavee", "sad songs bollywood", "emotional cover"],
    categoryId: "10"
  },
  {
    videoId: "z4v5FHXl9JA",
    title: "Lambiyaan Si Judaiyaan Unplugged Heartbreak Cover 💔 Praveen Mahawar 😍😍😍🤗🤗❣️ #raavee",
    description: `Pure raw emotion — Arijit Singh's soul-stirring heartbreak ballad 'Lambiyaan Si Judaiyaan' (Raabta) sung acoustic and unfiltered by Praveen Mahawar.

❤️ Love Signature: #raavee 😍😍😍🤗🤗❣️

🎤 Vocals: Praveen Mahawar
🎵 Original Song: Lambiyaan Si Judaiyaan (Arijit Singh / Pritam / Amitabh Bhattacharya)
💔 Mood: Pure Heartbreak & Nostalgia

#LambiyaanSiJudaiyaan #ArijitSingh #PraveenMahawar #HeartbreakCover #SadSongStatus #UnpluggedMusic #raavee #Raabta #EmotionalSinging #AcousticHindi`,
    tags: ["Lambiyaan Si Judaiyaan", "Arijit Singh", "Raabta", "Praveen Mahawar", "heartbreak cover", "sad hindi songs", "unplugged acoustic", "raavee", "emotional singing", "bollywood sad songs"],
    categoryId: "10"
  },
  {
    videoId: "wAQf7M1w9GI",
    title: "Ba Khuda Tumhi Ho (Kismat Konnection) Soulful Acoustic Hook ✨ Praveen Mahawar 😍😍😍🤗🤗❣️ #raavee",
    description: `Acoustic soulful rendition of Atif Aslam's iconic romantic track 'Ba Khuda Tumhi Ho' from Kismat Konnection. Sung with raw love and memories. ✨

❤️ Love Signature: #raavee 😍😍😍🤗🤗❣️

🎤 Performer: Praveen Mahawar
🎵 Song: Ba Khuda Tumhi Ho (Atif Aslam / Pritam)

#BaKhudaTumhiHo #AtifAslam #PraveenMahawar #SoulfulCover #RomanticSongs #AcousticVibes #raavee #KismatKonnection #HindiCoverShorts #ViralSinging`,
    tags: ["Ba Khuda Tumhi Ho", "Atif Aslam", "Kismat Konnection", "Praveen Mahawar", "romantic song", "acoustic cover", "raavee", "soulful cover", "hindi cover shorts"],
    categoryId: "10"
  },
  {
    videoId: "CWezztbQkaw",
    title: "Dil Ko Choo Lene Wali Awaaz... 💔 Pure Soul Unplugged | Praveen Mahawar 😍😍😍🤗🤗❣️ #raavee",
    description: `When music becomes the only voice for an aching heart. Pure soul, unedited acoustic vocal session by Praveen Mahawar. 💔

❤️ Love Signature: #raavee 😍😍😍🤗🤗❣️

🎤 Performer: Praveen Mahawar
✨ Channel: Praveen Mahawar — Comedy, Raw Soulful Singing & Real Moments

#PraveenMahawar #HeartbreakSongs #SoulfulSinging #UnpluggedHindi #AcousticVoice #raavee #SukoonSongs #SadVibes #HindiCovers`,
    tags: ["Praveen Mahawar", "heartbreak songs", "soulful singing", "unplugged hindi songs", "raavee", "acoustic voice", "sukoon songs", "sad song cover"],
    categoryId: "10"
  },
  {
    videoId: "33YiWEgq6hI",
    title: "Original Self-Made Heartbreak Melody (AMYPJ) 💔 Praveen Mahawar 😍😍😍🤗🤗❣️ #raavee",
    description: `An original self-written and self-composed heartbreak song by Praveen Mahawar. Raw emotions, pure heart, dedicated to deep memories and unhealed scars. 💔

❤️ Love Signature: #raavee 😍😍😍🤗🤗❣️

✍️ Lyrics & Composition: Praveen Mahawar
🎤 Vocals: Praveen Mahawar
🎼 Project: AMYPJ Soul Sessions

#PraveenMahawar #OriginalSong #SelfMadeSong #HeartbreakMelody #IndieHindi #raavee #AMYPJ #EmotionalLyrics #AcousticOriginal #SadHindiSongs`,
    tags: ["Praveen Mahawar", "original song", "self made song", "heartbreak melody", "indie hindi song", "raavee", "AMYPJ", "acoustic original", "emotional lyrics"],
    categoryId: "10"
  },
  {
    videoId: "b3lXe8RqzXE",
    title: "Tum To Thehre Pardesi (Altaf Raja) Nostalgic Live Session 🎙️ Praveen Mahawar 😍😍😍🤗🤗❣️ #raavee",
    description: `Remember the 90s classic that ruled every cassette tape and heart? Altaf Raja's evergreen 'Tum To Thehre Pardesi' sung live with nostalgic comedy and emotion! 🎙️

❤️ Love Signature: #raavee 😍😍😍🤗🤗❣️

🎤 Vocals: Praveen Mahawar
🎵 Original: Altaf Raja (Tum To Thehre Pardesi)

#AltafRaja #TumToThehrePardesi #PraveenMahawar #90sBollywood #QawwaliHits #LiveSinging #raavee #NostalgicHindiSongs #IndianComedySinging`,
    tags: ["Altaf Raja", "Tum To Thehre Pardesi", "Praveen Mahawar", "90s hindi songs", "qawwali pop", "raavee", "live singing", "desi nostalgia"],
    categoryId: "10"
  },
  {
    videoId: "hIhcigL1yTo",
    title: "Mohammad Rafi Ji Ka Timeless Classic Live Tribute 🎙️ Praveen Mahawar 😍😍😍🤗🤗❣️ #raavee",
    description: `A humble live tribute to the greatest musical maestro of all time — Mohammad Rafi sahab. Classic vintage golden era Bollywood vibes by Praveen Mahawar. ✨

❤️ Love Signature: #raavee 😍😍😍🤗🤗❣️

🎤 Tribute Vocals: Praveen Mahawar
🎵 In Honour of: Mohammad Rafi Sahab

#MohammadRafi #RafiHits #PraveenMahawar #GoldenEraBollywood #VintageClassics #LiveSinging #raavee #RetroHindi #OldIsGold`,
    tags: ["Mohammad Rafi", "Rafi songs", "Praveen Mahawar", "golden era bollywood", "retro classics", "old hindi songs", "raavee", "live singing tribute"],
    categoryId: "10"
  },
  {
    videoId: "o7he2Vuxyxc",
    title: "My First Time Anchoring On Stage! 🎤 Epic Stage Energy & Hosting Moments 😍😍😍🤗🤗❣️ #raavee",
    description: `First time taking the microphone to anchor a massive live stage event! Nervous excitement, comedic timing, audience banter, and pure stage madness. 🎤

❤️ Love Signature: #raavee 😍😍😍🤗🤗❣️

🎤 Host & Anchor: Praveen Mahawar
Special thanks to Chinky Di for always believing in me! ❤️

#PraveenMahawar #StageAnchoring #LiveHost #EventAnchoring #PublicSpeaking #raavee #ComedyHost #StageMoments #IndianAnchor`,
    tags: ["stage anchoring", "live host", "event anchoring", "Praveen Mahawar", "public speaking", "raavee", "comedy host", "stage energy"],
    categoryId: "24"
  },
  {
    videoId: "Gc0zwk19osc",
    title: "Bigg Boss Live Roast & Late Night Masti Session 😂 Praveen Mahawar Comedy 😍😍😍🤗🤗❣️ #raavee",
    description: `Late night hilarious unfiltered roast of Bigg Boss drama, funny reactions, audience masti, and comedy banters with Praveen Mahawar! 😂🔥

❤️ Love Signature: #raavee 😍😍😍🤗🤗❣️

🎙️ Host / Comedian: Praveen Mahawar
🎭 Genre: Comedy, Roast, Late Night Live Masti

#PraveenMahawar #BiggBossRoast #HindiComedy #RoastVideo #FunnyReactions #raavee #LateNightMasti #IndianRoasters #LiveComedy`,
    tags: ["Bigg Boss roast", "hindi comedy roast", "Praveen Mahawar comedy", "entertainment live", "raavee", "funny reaction", "desi roast"],
    categoryId: "23"
  },
  {
    videoId: "incM9CzWZTc",
    title: "Late Night Soulful Singing & Masti Session 🎙️❤️ Praveen Mahawar Live 😍😍😍🤗🤗❣️ #raavee",
    description: `Late night acoustic session featuring favorite Bollywood retro songs, viewer requests, personal stories, and heartfelt melodies with Praveen Mahawar. 🎙️

❤️ Love Signature: #raavee 😍😍😍🤗🤗❣️

🎤 Vocals: Praveen Mahawar
🎸 Mood: Unplugged, Late Night Conversations, Soulful Music

#PraveenMahawar #LiveSinging #LateNightSession #UnpluggedBollywood #AcousticLive #raavee #SukoonMusic #HindiSingingLive`,
    tags: ["Praveen Mahawar live", "hindi singing session", "unplugged live", "raavee", "bollywood acoustic live", "late night singing"],
    categoryId: "10"
  }
];

async function runOptimization() {
  console.log("🦅 [GARUDA] Initiating Autonomous SEO Overhaul for Praveen Mahawar Channel...\n");
  const status = youtubeService.getStatus("praveen");
  console.log(`Channel Status: connected=${status.connected} title="${status.channelTitle}" id="${status.channelId}"\n`);

  if (!status.connected) {
    console.error("[-] Error: Praveen channel not connected via OAuth!");
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < OPTIMIZED_VIDEOS.length; i++) {
    const video = OPTIMIZED_VIDEOS[i];
    console.log(`\n--------------------------------------------------------------`);
    console.log(`[${i + 1}/${OPTIMIZED_VIDEOS.length}] Updating Video: ${video.videoId}`);
    console.log(`New Title: "${video.title}"`);
    console.log(`Category: ${video.categoryId} | Tags: ${video.tags.length}`);

    try {
      const result = await youtubeService.pushVideoUpdate({
        videoId: video.videoId,
        title: video.title,
        description: video.description,
        tags: video.tags,
        categoryId: video.categoryId,
        channelProfile: "praveen"
      });

      if (result.success) {
        console.log(`[+] SUCCESS! Video ${video.videoId} updated on YouTube.`);
        console.log(`    Link: ${result.youtubeUrl}`);
        successCount++;
      } else {
        console.warn(`[-] FAILED: ${result.error || JSON.stringify(result)}`);
        failCount++;
      }
    } catch (err) {
      console.error(`[-] EXCEPTION for ${video.videoId}:`, err.message);
      failCount++;
    }

    // Polite rate limiting (1.5s between API calls)
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n==============================================================`);
  console.log(`🦅 SEO OVERHAUL COMPLETE: ${successCount} updated successfully, ${failCount} failed.`);
  console.log(`==============================================================\n`);
}

runOptimization();
