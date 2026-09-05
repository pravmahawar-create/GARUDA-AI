import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SovereignHeroAvatar from "../components/SovereignHeroAvatar";

// 🔊 High-Fidelity Audio Synthesizer for Clean Sound FX
class SovereignAudioEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playPop() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.07);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  playChime() {
    this.init();
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  playFanfare() {
    this.init();
    if (!this.ctx) return;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    });
  }
}

const audioFX = new SovereignAudioEngine();

export default function KidsVoiceApp() {
  const [selectedPersona, setSelectedPersona] = useState("garuda");
  const [visualState, setVisualState] = useState("IDLE"); // IDLE | THINKING | SPEAKING
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("नमस्ते नन्हें दोस्त! मैं गरुड़ पवन हूँ — तुम्हारा स्वायत्त साथी।");
  const [userSpokenText, setUserSpokenText] = useState("");
  const [customQuery, setCustomQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chat"); // chat | riddles | stories | animal

  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

  // 🦅 5 ASTRA-GRADE SOVEREIGN VOICE PERSONAS
  const personas = [
    {
      id: "garuda",
      name: "गरुड़ पवन (GARUDA)",
      badge: "Sovereign Intelligence",
      tagline: "वीर, बुद्धिमान एवं मित्रवत रक्षक",
      accent: "#d4af37",
      greeting: "नमस्ते नन्हें दोस्त! मैं गरुड़ पवन हूँ — हवा की रफ़्तार से तेज़ और ज्ञान से भरपूर। आज हम कौन सा नया रहस्य जानेंगे?",
      speed: 1.0,
      riddles: [
        { q: "ऐसी कौन सी चीज़ है जो पानी पीते ही मर जाती है?", a: "प्यास! क्योंकि पानी पीते ही प्यास बुझ जाती है। शाबाश!" },
        { q: "वह कौन है जिसके पास मुकुट है लेकिन वह राजा नहीं, और पंख हैं लेकिन वह चिड़िया नहीं?", a: "मोर! हमारा राष्ट्रीय पक्षी जो बारिश में नाचता है।" }
      ],
      stories: [
        "एक बार एक छोटे गरुड़ ने आसमान की सबसे ऊँची चोटी पर उड़ना चाहा। सबने कहा तुम बहुत छोटे हो, लेकिन उसने हिम्मत नहीं हारी और सूरज की पहली किरण को छू लिया!"
      ]
    },
    {
      id: "astra",
      name: "एस्ट्रा कॉस्मिक (Astra Core)",
      badge: "DeepMind Neural Flow",
      tagline: "ब्रह्मांड एवं विज्ञान का अन्वेषक",
      accent: "#38bdf8",
      greeting: "हेलो सुपर जूनियर! मैं एस्ट्रा कॉस्मिक हूँ। क्या तुम जानते हो कि अंतरिक्ष में तारे कैसे चमकते हैं?",
      speed: 1.05,
      riddles: [
        { q: "दिन में सोता हूँ, रात में जागता हूँ, कभी घटता कभी बढ़ता हूँ। बताओ मैं कौन हूँ?", a: "चंदा मामा! जो रात के आकाश को अपनी चाँदनी से सजाते हैं।" },
        { q: "मेरे पास कोई पैर नहीं हैं, फिर भी मैं पूरी दुनिया घूमती हूँ। बताओ मैं क्या हूँ?", a: "हवा! जो हमेशा बहती रहती है।" }
      ],
      stories: [
        "मंगल ग्रह पर एक छोटे रोवर ने एक लाल रंग का पत्थर उठाया और जब उसने गौर से देखा, तो उस पर एक चमकता हुआ सितारा बना हुआ था!"
      ]
    },
    {
      id: "balmitra",
      name: "बाल मित्र (Bal Mitra)",
      badge: "Playful Companion",
      tagline: "हँसमुख, नटखट और चुटकुलों का राजा",
      accent: "#f59e0b",
      greeting: "अरे दोस्त! आ गए तुम! आज तो हम खूब हँसी-मज़ाक और पहेलियाँ सुलझाएंगे। चलो शुरू करते हैं!",
      speed: 1.05,
      riddles: [
        { q: "कंप्यूटर ने डॉक्टर से क्या कहा?", a: "डॉक्टर साहब, मुझे लगता है मेरी स्क्रीन पर कोई वायरस नाच रहा है!" },
        { q: "गाड़ी लाल बत्ती देखकर क्यों रुक जाती है?", a: "ताकि वो हरी बत्ती को नमस्ते कह सके!" }
      ],
      stories: [
        "जंगल के सारे जानवरों ने मिलकर एक क्रिकेट मैच खेला। जब हाथी बैटिंग करने आया तो उसने ऐसा छक्का मारा कि गेंद सीधे बादलों में चली गई!"
      ]
    },
    {
      id: "sher",
      name: "केसरी वीर (Jungle Guardian)",
      badge: "Vedic Wildlife King",
      tagline: "बहादुर, साहसी और जंगल का राजा",
      accent: "#ef4444",
      greeting: "दहाड़! मैं जंगल का रक्षक केसरी वीर हूँ। हमेशा सच बोलो, माता-पिता का आदर करो और बहादुर बनो!",
      speed: 0.95,
      riddles: [
        { q: "जंगल का ऐसा कौन सा जानवर है जो खड़े-खड़े भी सो सकता है?", a: "घोड़ा! जिसके पैर बहुत मज़बूत होते हैं।" },
        { q: "हरी थी मन भरी थी, लाख मोती जड़ी थी, राजा जी के बाग में दुशाला ओढ़े खड़ी थी?", a: "भुट्टा (Corn)! जो सर्दियों में मीठा स्वाद देता है।" }
      ],
      stories: [
        "एक नन्हे चीते ने अपनी माँ से पूछा कि मैं सबसे तेज़ कब दौड़ पाऊँगा? माँ ने कहा—जिस दिन तुम खुद पर विश्वास करना सीख जाओगे!"
      ]
    },
    {
      id: "rishi",
      name: "जादूगर ऋषि (Sage Storyteller)",
      badge: "Ancient Wisdom",
      tagline: "जादुई किस्से और प्राचीन पहेलियाँ",
      accent: "#a855f7",
      greeting: "शुभम भवतु! मैं जादुई ऋषि हूँ। मेरे कमंडल में असीम कहानियाँ हैं। क्या सुनना चाहते हो?",
      speed: 0.95,
      riddles: [
        { q: "एक थाल मोतियों से भरा, सबके सर पर औंधा धरा। चारों ओर वह थाल फिरे, मोती उससे एक न गिरे?", a: "आसमान और तारे! जो रात में बहुत सुंदर लगते हैं।" },
        { q: "जादू की ऐसी कौन सी चीज़ है जो खर्च करने से और बढ़ जाती है?", a: "विद्या और ज्ञान! जितना बाँटो उतना बढ़ता है।" }
      ],
      stories: [
        "पुराने समय में एक राजा के पास ऐसा जादुई वृक्ष था जो सिर्फ मीठे बोल बोलने वाले को ही स्वर्ण फल देता था!"
      ]
    }
  ];

  const current = personas.find((p) => p.id === selectedPersona) || personas[0];

  useEffect(() => {
    // Speak initial greeting naturally
    speakNatural(current.greeting, false);
  }, []);

  // 🔊 Stream Authentic Google Natural Indian Voice
  const speakNatural = (text, playFX = true) => {
    if (!text) return;
    setSpeechTranscript(text);
    if (playFX) audioFX.playChime();

    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      setVisualState("THINKING");
      const url = `/api/audio/tts?text=${encodeURIComponent(text)}&lang=hi`;
      const audio = new Audio(url);
      audio.playbackRate = current.speed || 1.0;

      audio.onplay = () => {
        setIsSpeaking(true);
        setVisualState("SPEAKING");
      };
      audio.onended = () => {
        setIsSpeaking(false);
        setVisualState("IDLE");
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setVisualState("IDLE");
        if (window.speechSynthesis) {
          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = "hi-IN";
          utter.rate = current.speed;
          window.speechSynthesis.speak(utter);
        }
      };

      audioRef.current = audio;
      audio.play().catch(() => {
        setIsSpeaking(false);
        setVisualState("IDLE");
      });
    } catch {
      setIsSpeaking(false);
      setVisualState("IDLE");
    }
  };

  // 🎙️ Two-Way Speech Interaction
  const handleStartListening = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("माइक Chrome या Edge ब्राउज़र में उपलब्ध है।");
      return;
    }

    audioFX.playChime();
    const rec = new SpeechRec();
    rec.lang = "hi-IN";

    rec.onstart = () => {
      setIsListening(true);
      setVisualState("THINKING");
      setUserSpokenText("");
    };

    rec.onresult = (e) => {
      const heard = e.results[0][0].transcript;
      setUserSpokenText(heard);
      setIsListening(false);
      audioFX.playFanfare();

      const responses = [
        `शाबाश नन्हे दोस्त! तुमने कहा: "${heard}"! तुम्हारी आवाज़ सुनकर मुझे बहुत आनंद हुआ!`,
        `वाह! "${heard}"! तुम बहुत समझदार बच्चे हो। चलो अगली बात पूछते हैं!`,
        `अरे वाह! "${heard}"! यह सुनकर मेरे चेहरे पर बड़ी मुस्कान आ गई!`
      ];
      const reply = responses[Math.floor(Math.random() * responses.length)];
      setTimeout(() => {
        speakNatural(reply, false);
      }, 400);
    };

    rec.onerror = () => {
      setIsListening(false);
      setVisualState("IDLE");
    };

    rec.onend = () => {
      setIsListening(false);
      if (!isSpeaking) setVisualState("IDLE");
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const handleTellRiddle = () => {
    audioFX.playFanfare();
    const r = current.riddles[Math.floor(Math.random() * current.riddles.length)];
    speakNatural(`पहेली सुनो दोस्त: ${r.q} ... उत्तर है: ${r.a}`, false);
  };

  const handleTellStory = () => {
    audioFX.playChime();
    const s = current.stories[Math.floor(Math.random() * current.stories.length)];
    speakNatural(`एक सुंदर कहानी सुनो: ${s}`, false);
  };

  const handleAnimalSound = (animal, label, msg) => {
    audioFX.playPop();
    speakNatural(`${label} की आवाज़ सुनो दोस्त! ${msg}`, false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 10%, #090e1f 0%, #030712 70%, #000208 100%)", color: "#f8fafc", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: "1.2rem 1rem" }}>
      
      {/* 🦅 Top Sovereign Navigation Header */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(212, 175, 55, 0.2)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <Link to="/pawan" style={{ textDecoration: "none", color: "#94a3b8", fontSize: "0.78rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.4rem", padding: "5px 12px", background: "#0b101e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" }}>
            ← गरुड़ पवन स्टूडियो
          </Link>
          <span style={{ fontSize: "0.7rem", color: "#d4af37", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: "800" }}>
            GARUDA ASTRA • MULTIMODAL VOICE ENGINE
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "3px 10px", borderRadius: "999px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", fontSize: "0.7rem", color: "#34d399", fontWeight: "800" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", display: "inline-block" }}></span>
            GOOGLE NATURAL VOICE LIVE
          </span>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* 🎭 Sleek Persona Dock (Refined Metrics, Zero Bloat) */}
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.8rem", marginBottom: "1.5rem", scrollbarWidth: "none" }}>
          {personas.map((p) => {
            const isSelected = p.id === selectedPersona;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPersona(p.id);
                  audioFX.playChime();
                  speakNatural(p.greeting, false);
                }}
                style={{
                  flex: "1 1 auto",
                  minWidth: "170px",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  background: isSelected ? "linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(15,23,42,0.9) 100%)" : "#070b14",
                  border: `1px solid ${isSelected ? p.accent : "rgba(255,255,255,0.08)"}`,
                  boxShadow: isSelected ? `0 0 20px ${p.accent}33` : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: "800", color: isSelected ? "#ffffff" : "#cbd5e1" }}>
                    {p.name}
                  </span>
                  {isSelected && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: p.accent }}></span>}
                </div>
                <div style={{ fontSize: "0.68rem", color: isSelected ? p.accent : "#64748b", fontWeight: "600" }}>
                  {p.badge}
                </div>
              </button>
            );
          })}
        </div>

        {/* 🌟 Central Stage: Sovereign Hero Mascot & Live Multimodal Audio Deck */}
        <div style={{ background: "#050811", border: "1px solid rgba(212, 175, 55, 0.3)", borderRadius: "16px", padding: "1.5rem", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", marginBottom: "1.5rem" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.8rem", alignItems: "center" }}>
            
            {/* Left: Authentic Sovereign Hero Mascot Presence */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
              <SovereignHeroAvatar visualState={visualState} isSpeaking={isSpeaking} size={280} />

              {/* State Telemetry Badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "3px 12px", borderRadius: "999px", background: isSpeaking ? "rgba(245,158,11,0.2)" : "rgba(56,189,248,0.15)", border: `1px solid ${isSpeaking ? "#f59e0b" : "#38bdf8"}`, marginTop: "0.4rem" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isSpeaking ? "#f59e0b" : "#38bdf8" }}></span>
                <span style={{ fontSize: "0.68rem", fontWeight: "800", letterSpacing: "0.1em", textTransform: "uppercase", color: isSpeaking ? "#fef08a" : "#7dd3fc" }}>
                  {isSpeaking ? `${current.name} बोल रहा है` : isListening ? "माइक सुन रहा है..." : "अखंड संप्रभु तैयार"}
                </span>
              </div>
            </div>

            {/* Right: Astra Neural Speech Deck & Interactive Command Console */}
            <div>
              
              {/* Dynamic Speech Glass Bubble */}
              <div style={{ background: "rgba(11, 16, 30, 0.85)", backdropFilter: "blur(12px)", border: `1px solid ${current.accent}55`, borderRadius: "12px", padding: "1.2rem", marginBottom: "1.2rem", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.72rem", color: current.accent, fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    ✦ {current.name} • विशुद्ध भारतीय आवाज़
                  </span>
                  {isSpeaking && (
                    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "14px" }}>
                      {[1, 2, 3, 4, 5].map((b) => (
                        <div key={b} style={{ width: "3px", height: `${b * 3}px`, background: current.accent, borderRadius: "1px" }} />
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: "1.05rem", color: "#f8fafc", lineHeight: 1.5, fontWeight: "600" }}>
                  "{speechTranscript}"
                </div>
              </div>

              {/* Action Buttons (Refined Proportions) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.6rem", marginBottom: "1rem" }}>
                
                {/* 1. Greet */}
                <button
                  type="button"
                  onClick={() => speakNatural(current.greeting, true)}
                  disabled={isSpeaking}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "8px",
                    background: "#0b1120",
                    border: `1px solid ${current.accent}88`,
                    color: "#f8fafc",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem"
                  }}
                >
                  <span>👋</span> नमस्ते कहो
                </button>

                {/* 2. Riddle */}
                <button
                  type="button"
                  onClick={handleTellRiddle}
                  disabled={isSpeaking}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "8px",
                    background: "rgba(245, 158, 11, 0.15)",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    color: "#fef08a",
                    fontSize: "0.8rem",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem"
                  }}
                >
                  <span>🧩</span> पहेली बूझो
                </button>

                {/* 3. Story */}
                <button
                  type="button"
                  onClick={handleTellStory}
                  disabled={isSpeaking}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "8px",
                    background: "rgba(168, 85, 247, 0.15)",
                    border: "1px solid rgba(168, 85, 247, 0.4)",
                    color: "#e9d5ff",
                    fontSize: "0.8rem",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem"
                  }}
                >
                  <span>📜</span> कहानी सुनो
                </button>

                {/* 4. Two-Way Mic */}
                <button
                  type="button"
                  onClick={handleStartListening}
                  disabled={isListening || isSpeaking}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "8px",
                    background: isListening ? "#ef4444" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "0.8rem",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: isListening ? "0 0 15px #ef4444" : "0 4px 15px rgba(16, 185, 129, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem"
                  }}
                >
                  <span>{isListening ? "⏹️" : "🎙️"}</span>
                  {isListening ? "सुन रहा है..." : "बातचीत करो"}
                </button>
              </div>

              {userSpokenText && (
                <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "8px 12px", borderRadius: "8px", fontSize: "0.78rem", color: "#6ee7b7", marginBottom: "0.8rem" }}>
                  आपने कहा: <strong>"{userSpokenText}"</strong>
                </div>
              )}

              {/* Custom Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customQuery.trim()) {
                    speakNatural(customQuery.trim(), true);
                    setCustomQuery("");
                  }
                }}
                style={{ display: "flex", gap: "0.5rem" }}
              >
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="यहाँ कुछ भी लिखें, गरुड़ तुरंत मधुर आवाज़ में बोलेगा..."
                  style={{ flex: 1, background: "#02040a", border: "1px solid #1e293b", borderRadius: "8px", padding: "9px 12px", color: "#f8fafc", fontSize: "0.85rem", outline: "none" }}
                />
                <button
                  type="submit"
                  disabled={isSpeaking || !customQuery.trim()}
                  style={{ background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)", border: "none", color: "#000", padding: "9px 16px", borderRadius: "8px", fontWeight: "800", fontSize: "0.8rem", cursor: isSpeaking ? "wait" : "pointer" }}
                >
                  बुलवाएँ
                </button>
              </form>

            </div>
          </div>
        </div>

        {/* 🐾 Vedic Wildlife & Animal Sounds Matrix (Clean Compact Proportions) */}
        <div style={{ background: "#070b14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1.2rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#d4af37", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              🐾 वन्य जीव ध्वनि ज्ञान (Wildlife Acoustic Matrix)
            </div>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
              टैप करें और वास्तविक भारतीय आवाज़ में रोचक ज्ञान सुनें
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.6rem" }}>
            {[
              { id: "lion", name: "बब्बर शेर (Lion)", emoji: "🦁", fact: "दहाड़! शेर की दहाड़ 8 किलोमीटर दूर तक सुनाई देती है। जंगल का यह राजा असीम शक्ति और साहस का प्रतीक है!" },
              { id: "peacock", name: "मयूर (Peacock)", emoji: "🦚", fact: "पीहू पीहू! मोर हमारा राष्ट्रीय पक्षी है जो बारिश की बूँदों में पंख फैलाकर मनमोहक नृत्य करता है!" },
              { id: "elephant", name: "गजराज हाथी (Elephant)", emoji: "🐘", fact: "चिंघाड़! हाथी दुनिया का सबसे बुद्धिमान और संवेदनशील जीव है जो अपने दोस्तों को कभी नहीं भूलता!" },
              { id: "eagle", name: "महा गरुड़ (Eagle)", emoji: "🦅", fact: "स्वाहा! गरुड़ सबसे ऊँचा उड़ता है और तूफानों के ऊपर जाकर अपनी उड़ान भरता है!" }
            ].map((animal) => (
              <button
                key={animal.id}
                type="button"
                onClick={() => handleAnimalSound(animal.id, animal.name, animal.fact)}
                style={{
                  background: "#030712",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.8rem",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <span style={{ fontSize: "1.8rem" }}>{animal.emoji}</span>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#f8fafc" }}>
                    {animal.name}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                    आवाज़ व तथ्य सुनें 🔊
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
