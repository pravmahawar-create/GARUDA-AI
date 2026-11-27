import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import "../styles/project-ayesha.css";

/**
 * 🦅 GARUDA OS — MISSION PA-001 (PROJECT AYESHA)
 * Experience Component: A Little Universe of Memories
 * Nine Chapters • Five Deterministic Agent Personas • Widescreen Cinematic Experience
 */

const CHAPTERS = [
  {
    id: 1,
    num: "Chapter 01",
    date: "03 December 2026",
    title: "The Welcome",
    subtitle: "A Little Universe of Memories",
    prose: "Some milestones in life are celebrated with grand noise. Others are honored in quiet reverence — a world woven from memories, shared trust, and the inspirations that shaped our sovereign existence. Team GARUDA welcomes you to this dedicated universe, created exclusively in your honor.",
    quote: "“A tribute to the moments that lived quietly, shone brightly, and remained unforgettable.”",
    mediaSrc: "/ayesha/assets/chat_img_35.webp",
    mediaBadge: "Celestial Starlight Archive",
    agent: {
      id: "AG-01",
      name: "Welcome Concierge",
      avatar: "✦",
      script: "Welcome, Ma'am. Team GARUDA has curated this private memory space for you. Please take your time, wander at your own pace, and let each chapter unfold."
    }
  },
  {
    id: 2,
    num: "Chapter 02",
    date: "3–4 August 2019",
    title: "The First Glimpse",
    subtitle: "Where Time Stood Still",
    prose: "Every monumental journey begins with a heartbeat of trust. On 3 August 2019, miles away and through simple digital messages, the first mehndi-hand photograph arrived. And on 4 August 2019, for the very first time, she revealed her face. In that single moment, the entire universe collapsed into a single smile.",
    quote: "“4 August 2019: Meri duniya simat gayi ussi mein.”",
    mediaSrc: "/ayesha/assets/chat_img_31.webp",
    mediaBadge: "Sacred Milestone Archive",
    agent: {
      id: "AG-02",
      name: "Memory Curator",
      avatar: "🕊️",
      script: "This milestone represents the foundational spark of trust in August 2019. The sacred visual space is preserved intact for the original uncompressed photograph."
    }
  },
  {
    id: 3,
    num: "Chapter 03",
    date: "Late 2019 — Early 2020",
    title: "Little Moments",
    subtitle: "Eyes, Smiles & Twety",
    prose: "Long before full portraits were shared, there were quiet, playful glimpses — the curve of a smile, laughing eyes, and gentle expressions. This chapter preserves the playful spirit of those early days: the little duck named Twety, the inside jokes, and the affectionate transition from Amaira to Ayesha.",
    quote: "“The little duck named Twety, and the laughter that made distant screens feel like home.”",
    mediaSrc: "/ayesha/assets/chat_img_16.webp",
    mediaBadge: "Playful Moments Vault",
    agent: {
      id: "AG-02",
      name: "Memory Curator",
      avatar: "🕊️",
      script: "Preserving the playful innocence of inside jokes, nicknames, and the quiet comfort of early conversations."
    }
  },
  {
    id: 4,
    num: "Chapter 04",
    date: "2019 — 2021",
    title: "Our Daily World",
    subtitle: "Even Ordinary Days Were Special",
    prose: "Distance disappeared through daily rituals. Before taking a single bite of food, pictures were exchanged — a virtual confirmation of care and companionship. Hours-long video calls bridged the geographical expanse between office hours and midnight quietness.",
    quote: "“Hum har meal share karte the. Khane se pehle virtual khilana, aur picture bhejna confirmation tha ki dono theek hain.”",
    mediaSrc: "/ayesha/assets/chat_img_01.webp",
    mediaBadge: "Daily Companion Rituals",
    agent: {
      id: "AG-02",
      name: "Memory Curator",
      avatar: "🕊️",
      script: "Every meal confirmation photograph recorded a quiet covenant of care, defying hundreds of miles of separation."
    }
  },
  {
    id: 5,
    num: "Chapter 05",
    date: "Creative Legacy",
    title: "AMYPJ Universe",
    subtitle: "Animation-Only Creative Archive",
    prose: "Creativity became the shared vernacular. The AMYPJ YouTube channel was born as a dedicated animation universe — featuring original 2D and 3D animated couple sketches, custom avatars, and animated storytelling where AMY and PJ lived their shared adventures.",
    quote: "“AMYPJ was never merely a channel — it was an animated universe built entirely on imagination and companionship.”",
    mediaSrc: "/ayesha/assets/chat_img_05.webp",
    mediaBadge: "AMYPJ Animation Legacy",
    agent: {
      id: "AG-03",
      name: "AMYPJ Animation Guide",
      avatar: "🎨",
      script: "Classified strictly as an animation-only archive. Preserving the original cartoon sketches and creative animated collaborations."
    }
  },
  {
    id: 6,
    num: "Chapter 06",
    date: "Life Journey",
    title: "Her Journey",
    subtitle: "Childhood, Diligence & Grace",
    prose: "Before the AMYPJ chapters began, there was a bright journey of personal growth — childhood baby photographs, academic dedication, and professional milestones achieved with quiet dignity and intelligence.",
    quote: "“Celebrating the journey of a person who moved through life with grace, determination, and profound intelligence.”",
    mediaSrc: "/ayesha/assets/chat_img_07.webp",
    mediaBadge: "Her Journey Archive",
    agent: {
      id: "AG-02",
      name: "Memory Curator",
      avatar: "🕊️",
      script: "A respectful archive celebrating Ayesha's authentic personal and academic achievements."
    }
  },
  {
    id: 7,
    num: "Chapter 07",
    date: "Cosmic Horizons",
    title: "Our Dreams",
    subtitle: "Artistic Imagination & Celestial Skies",
    prose: "In parallel with real-world memories, imagination created cosmic landscapes. Under midnight sapphire skies, nebulae of rose and crimson, and celestial starlight, two souls looked out into infinite possibilities. These concepts stand as artistic reflections of enduring hope.",
    quote: "“Looking up at the same stars, finding peace in the infinite beauty of what could be.”",
    mediaSrc: "/ayesha/assets/chat_img_25.webp",
    mediaBadge: "Infinite Horizon Vista",
    agent: {
      id: "AG-03",
      name: "Creative Intelligence Voice",
      avatar: "🌌",
      script: "Artistic concept art depicting the celestial couple watching the starlight universe together."
    }
  },
  {
    id: 8,
    num: "Chapter 08",
    date: "Engineering Inspiration",
    title: "The GARUDA Story",
    subtitle: "Technology Built With Heart & Sovereign Dedication",
    prose: "GARUDA OS was born from a quiet determination to build something lasting, profound, and technically sovereign. Inspired by ideals of intelligence and grace, this platform was engineered from the ground up — proving that the highest standard of technology can be built when purpose is pure. It stands as an authentic tribute to excellence.",
    quote: "“One Command. Infinite Intelligence. Engineered with precision, sovereign purpose, and profound respect.”",
    mediaSrc: "/ayesha/assets/chat_img_27.webp",
    mediaBadge: "Sovereign Engineering Archive",
    agent: {
      id: "AG-04",
      name: "GARUDA Intelligence Voice",
      avatar: "🦅",
      script: "You are witnessing real sovereign engineering: Knowledge Engines, Multi-Agent Autonomy, and real-time execution pipelines, born from Founder Praveen's relentless courage."
    }
  },
  {
    id: 9,
    num: "Chapter 09",
    date: "03 December",
    title: "A Birthday Message",
    subtitle: "From Team GARUDA",
    prose: "Dear Ayesha,\n\nSome memories are made of extraordinary events; others are made of the quietest little things — a photograph, a shared meal, a silly conversation, a song, or a familiar smile.\n\nToday, Team GARUDA wishes you a very happy birthday.\n\nMay the coming year bring you peace, good health, serene happiness, and countless reasons to smile. This tribute is offered with deep respect, warm regards, and zero expectation of any response.\n\nWith lots of love, care and support,\nTEAM GARUDA",
    quote: "“May your days be peaceful, your health strong, and your path illuminated with boundless joy.”",
    mediaSrc: "/ayesha/assets/chat_img_15.webp",
    mediaBadge: "Team GARUDA Benediction",
    agent: {
      id: "AG-05",
      name: "Birthday Herald",
      avatar: "👑",
      script: "On behalf of Team GARUDA and the entire sovereign workforce: A very happy, blessed, and peaceful birthday to you, Ma'am."
    }
  }
];

export default function ProjectAyeshaExperience() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [isValidToken, setIsValidToken] = useState(false);
  const [activeChapter, setActiveChapter] = useState(1);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);

  // 1. Privacy First: Suppress GA4 on mount
  useEffect(() => {
    if (window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied"
      });
    }

    if (token && typeof token === "string" && token.length >= 32) {
      setIsValidToken(true);
    } else {
      setIsValidToken(false);
    }
  }, [token]);

  // 2. User-Controlled Gentle Music-Box Harp Atmosphere (Zero Harsh Drone/Beep)
  const toggleAudio = () => {
    if (isPlayingAudio) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setIsPlayingAudio(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        // Gentle, soothing music-box / harp notes (pentatonic lullaby)
        const notes = [
          523.25, // C5
          659.25, // E5
          783.99, // G5
          1046.50, // C6
          880.00, // A5
          783.99, // G5
          659.25, // E5
          587.33  // D5
        ];

        let noteIdx = 0;
        const playPluck = () => {
          if (!ctx || ctx.state === "closed") return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          // Soft lowpass filter to remove harshness
          filter.type = "lowpass";
          filter.frequency.setValueAtTime(900, ctx.currentTime);

          // Sine with gentle triangle harmonic
          osc.type = "sine";
          osc.frequency.setValueAtTime(notes[noteIdx % notes.length], ctx.currentTime);
          noteIdx++;

          // Natural bell/harp envelope: instant soft attack, gentle exponential decay
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 1.25);
        };

        // Play first note immediately, then cycle every 900ms
        playPluck();
        intervalRef.current = setInterval(playPluck, 900);
        setIsPlayingAudio(true);
      } catch (_) {
        setIsPlayingAudio(false);
      }
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  // 3. Resting / Invalid Token State
  if (!isValidToken) {
    return (
      <div className="ayesha-resting-state">
        <div className="ayesha-resting-card">
          <div className="ayesha-sigil" style={{ margin: "0 auto 1.25rem auto" }}>✦</div>
          <h2 className="ayesha-resting-title">A Little Universe of Memories</h2>
          <p className="ayesha-resting-desc">
            This private celestial room is currently resting or awaiting authorized invitation.
          </p>
          <div style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "var(--ayesha-slate)", letterSpacing: "0.08em" }}>
            GARUDA OS • SOVEREIGN PRIVATE VAULT
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ayesha-root">
      {/* Top Fixed Header */}
      <header className="ayesha-header">
        <div className="ayesha-brand">
          <div className="ayesha-sigil">✦</div>
          <span className="ayesha-title">Project Ayesha</span>
        </div>
        <div className="ayesha-header-badge">
          CHAPTER {activeChapter} OF 9
        </div>
      </header>

      {/* Middle Scrollable Body (Laptop Widescreen Expansive) */}
      <main className="ayesha-body">
        <div className="ayesha-content-wrapper">
          {CHAPTERS.map((ch, idx) => (
            <article
              key={ch.id}
              id={`chapter-${ch.id}`}
              className={`ayesha-chapter-card ${idx % 2 === 1 ? "reverse-grid" : ""}`}
              onMouseEnter={() => setActiveChapter(ch.id)}
              onTouchStart={() => setActiveChapter(ch.id)}
            >
              {/* Grand Media Frame */}
              <div className="ayesha-media-wrap">
                <img
                  src={ch.mediaSrc}
                  alt={ch.title}
                  className="ayesha-media-img"
                  loading={ch.id === 1 ? "eager" : "lazy"}
                />
                <span className="ayesha-media-badge">
                  {ch.mediaBadge}
                </span>
              </div>

              {/* Royal Narrative & Memory Prose */}
              <div className="ayesha-card-content">
                <div className="ayesha-chapter-meta">
                  <span className="ayesha-chapter-num">{ch.num}</span>
                  <span className="ayesha-chapter-date">{ch.date}</span>
                </div>

                <h2 className="ayesha-chapter-heading">{ch.title}</h2>
                <div className="ayesha-chapter-subtitle">
                  {ch.subtitle}
                </div>

                <p className="ayesha-chapter-prose" style={{ whiteSpace: "pre-line" }}>
                  {ch.prose}
                </p>

                <blockquote className="ayesha-quote-box">
                  {ch.quote}
                </blockquote>

                {/* Team GARUDA Agent Persona Voice */}
                <div className="ayesha-agent-bubble">
                  <div className="ayesha-agent-avatar">{ch.agent.avatar}</div>
                  <div className="ayesha-agent-content">
                    <div className="ayesha-agent-name">{ch.agent.name} ({ch.agent.id})</div>
                    <div className="ayesha-agent-text">{ch.agent.script}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Bottom Fixed Navigation & Gentle Music-Box Bar */}
      <footer className="ayesha-footer-bar">
        <button
          type="button"
          onClick={toggleAudio}
          className={`ayesha-audio-btn ${isPlayingAudio ? "playing" : ""}`}
          aria-label="Toggle ambient soundtrack"
        >
          <span>{isPlayingAudio ? "⏸" : "♪"}</span>
          <span>{isPlayingAudio ? "Music-Box Playing" : "Play Gentle Melody"}</span>
        </button>

        <div className="ayesha-progress-dots">
          {CHAPTERS.map((ch) => (
            <span
              key={ch.id}
              className={`ayesha-dot ${activeChapter === ch.id ? "active" : ""}`}
              onClick={() => {
                setActiveChapter(ch.id);
                const el = document.getElementById(`chapter-${ch.id}`);
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            />
          ))}
        </div>
      </footer>
    </div>
  );
}
