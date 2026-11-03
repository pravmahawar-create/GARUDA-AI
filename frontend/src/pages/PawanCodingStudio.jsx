import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const SpeechRec = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const PAYMENT_URL = "https://razorpay.me/@garudaosincompany";

// 🏛️ Canonical Claude-Code Inspired Luxury Palette
const T = {
  bg: "#FBFBF9",             // Claude warm porcelain / ivory canvas
  bgSubtle: "#F4F3EE",       // Subtle warm stone
  panel: "#FFFFFF",          // Pure white card surfaces
  panelSubtle: "#FAF9F5",    // Soft warm tint
  border: "#E7E5E0",         // Ultra-crisp fine stone border
  borderHover: "#D6D3CC",    // Slightly deeper stone on hover
  text: "#18181B",           // Deep graphite text (maximum legibility)
  textMuted: "#52525B",      // Refined slate
  textSubtle: "#71717A",     // Gentle tertiary text
  accent: "#C48B28",         // GARUDA Sovereign warm amber
  accentHover: "#B45309",    // Rich amber
  accentLight: "#FEF3C7",    // Soft amber tint
  accentBorder: "#FDE68A",   // Gentle amber border
  claudeTerracotta: "#D97706",// Claude signature warm terracotta
  emerald: "#059669",        // Status emerald
  emeraldLight: "#ECFDF5",   // Status emerald tint
  emeraldBorder: "#A7F3D0",  // Status emerald border
  codeBg: "#18181B",         // High-contrast clean dark slate for code viewer
  codeText: "#F4F4F5",       // Crisp white code text
  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
  shadowMd: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
  shadowLg: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)"
};

const CODING_TEMPLATES = [
  {
    icon: "🩺",
    title: "AI Clinic Receptionist",
    category: "Healthcare Triage PWA",
    targetFile: "public/clinic_receptionist.html",
    instruction: "Build a complete, modern Doctor & AI Clinic Receptionist PWA with 24/7 symptom triage, urgency flagging (Emergency/Urgent/Normal), automated appointment slot booking, interactive fee calculator, and WhatsApp confirmation CTA."
  },
  {
    icon: "🛍️",
    title: "WhatsApp Dukan & Billing",
    category: "Retail & GST Invoicing",
    targetFile: "public/whatsapp_dukan.html",
    instruction: "Build a high-speed WhatsApp Dukan & GST Invoicing mobile web app for Indian shopkeepers with instant product catalog, cart calculation, 1-tap WhatsApp order sharing, and UPI QR code generator."
  },
  {
    icon: "💼",
    title: "Agency CRM & Escrow",
    category: "B2B Agency OS",
    targetFile: "public/agency_crm.html",
    instruction: "Build an executive Agency Client Portal with 50/50 milestone payment escrow tracking, project timeline deliverables, client approval gates, and automated status telemetry."
  },
  {
    icon: "🚀",
    title: "Sovereign Micro-SaaS",
    category: "Next-Gen SaaS MVP",
    targetFile: "public/saas_starter.html",
    instruction: "Build a high-converting SaaS landing page with interactive pricing tiers, live product feature sandbox, customer testimonials, and instant Razorpay checkout modal."
  },
  {
    icon: "🌾",
    title: "GARUDA Dost Rozgar Hub",
    category: "Sovereign Rozgar Engine",
    targetFile: "public/dost_rozgar_portal.html",
    instruction: "Build a Sovereign GARUDA Dost affiliate & rozgar command center with unique referral link generator, client onboarding tracker, T+3 escrow settlement ledger, and WhatsApp lead share button."
  }
];

export default function PawanCodingStudio({ founderSessionActive = false }) {
  const navigate = useNavigate();
  const [instruction, setInstruction] = useState("");
  const [targetFile, setTargetFile] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [statusInfo, setStatusInfo] = useState(null);
  const [isFounder, setIsFounder] = useState(founderSessionActive === true);
  const [showGateModal, setShowGateModal] = useState(false);
  const [commercialTier, setCommercialTier] = useState("starter");
  const [turnCount, setTurnCount] = useState(0);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [showFounderPasskeyModal, setShowFounderPasskeyModal] = useState(false);
  const [founderPasskeyInput, setFounderPasskeyInput] = useState("");
  const [passkeyError, setPasskeyError] = useState("");
  const [activeTab, setActiveTab] = useState("preview"); // 'preview' | 'code' | 'mobile' | 'trajectory' | 'proof'
  const [mobileViewTab, setMobileViewTab] = useState("chat"); // 'chat' | 'output' (on small screens)
  const [codeCopied, setCodeCopied] = useState(false);
  const [previewViewport, setPreviewViewport] = useState("desktop"); // 'desktop' | 'mobile'
  const [previewKey, setPreviewKey] = useState(0);

  // 📱 Mobile Remote Debugging States
  const [mobileStatus, setMobileStatus] = useState(null);
  const [mobileLoading, setMobileLoading] = useState(false);
  const [mobileReverseMsg, setMobileReverseMsg] = useState("");
  const [mobileLogs, setMobileLogs] = useState("");

  // Client Intake State for Access Gate
  const [intakeName, setIntakeName] = useState("");
  const [intakeEmail, setIntakeEmail] = useState("");
  const [intakePhone, setIntakePhone] = useState("");
  const [intakeRepo, setIntakeRepo] = useState("");
  const [intakeSubmitted, setIntakeSubmitted] = useState(false);

  // 🎙️ Voice & Conversational States
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const recognitionRef = useRef(null);

  // 💬 Consultative Brain, Attachments & Chat States
  const [studioMode, setStudioMode] = useState("discuss"); // 'discuss' | 'execute'
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("garuda_pawan_chat_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: "welcome",
        sender: "pawan",
        text: "नमस्ते! मैं गरुड़ पवन हूँ — आपका Autonomous Software Architect। आप जो भी नया ऐप या फीचर बनाना चाहते हैं, बताइए। मैं पहले आपको Pro Architecture Plan दूँगा, और फिर एक क्लिक में कोड करूँगा!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });
  const [activeAttachment, setActiveAttachment] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [isConsulting, setIsConsulting] = useState(false);
  const [apkBuilding, setApkBuilding] = useState(false);
  const [apkDownloadUrl, setApkDownloadUrl] = useState(null);
  const [apkModalData, setApkModalData] = useState(null);
  const [counterOffers, setCounterOffers] = useState({});
  const [showComparisonFor, setShowComparisonFor] = useState(null);
  const [showAppsFleet, setShowAppsFleet] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);

  const [pawanHistorySynced, setPawanHistorySynced] = useState(false);
  const [pawanHistoryCount, setPawanHistoryCount] = useState(0);

  const founderRequestHeaders = async () => {
    const headers = { "Content-Type": "application/json" };
    let tokenError = null;
    try {
      const response = await fetch("/api/auth/pawan-token", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      });
      const session = await response.json().catch(() => ({}));
      if (response.ok && session.success && session.token) {
        headers.Authorization = `Bearer ${session.token}`;
        return headers;
      }
      if (response.status === 401) {
        tokenError = "Founder session required. Please sign in to Founder Workspace (/founder/access) first.";
      } else if (response.status === 503) {
        tokenError = "Founder authentication is not configured on the server.";
      } else if (session.message) {
        tokenError = session.message;
      }
    } catch (e) {
      tokenError = `Failed to obtain founder token: ${e.message}`;
    }
    try {
      const token = localStorage.getItem("garuda_founder_token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        return headers;
      }
    } catch {}
    if (tokenError) {
      const err = new Error(tokenError);
      err.isAuthError = true;
      throw err;
    }
    return headers;
  };

  const fetchPawanHistory = async () => {
    try {
      const res = await fetch("/api/pawan/history?limit=30");
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setPawanHistorySynced(true);
        setPawanHistoryCount(data.history.length);
        setHistory(data.history);
      }
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    fetchHistory();
    fetchPawanHistory();
    fetchMobileStatus();
    checkAuthSession();
    if (SpeechRec) {
      setVoiceSupported(true);
    }
    try {
      const saved = localStorage.getItem("garuda_pawan_active_project");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.code) {
          setActiveProject(parsed);
          setResult({
            file: parsed.file || "public/app.html",
            code: parsed.code,
            summary: parsed.summary || "Recovered previous project from memory",
            taskId: parsed.taskId || "LOCAL-PERSISTED"
          });
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (messages && messages.length > 0) {
        localStorage.setItem("garuda_pawan_chat_messages", JSON.stringify(messages));
      }
    } catch {}
  }, [messages]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isConsulting]);

  const checkAuthSession = async () => {
    try {
      if (founderSessionActive === true) {
        setIsFounder(true);
        return;
      }
      const isLocalHost = typeof window !== "undefined" && (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.endsWith(".local")
      );
      if (isLocalHost) {
        setIsFounder(true);
        return;
      }
      const savedToken = localStorage.getItem("garuda_founder_token");
      if (savedToken) {
        try {
          const verifyRes = await fetch("/api/pawan/verify-founder-token", {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          const verifyData = await verifyRes.json();
          if (verifyData.authorized === true) {
            setIsFounder(true);
            return;
          } else {
            localStorage.removeItem("garuda_founder_token");
          }
        } catch {}
      }
      const res = await fetch("/api/auth/session", { credentials: "same-origin" });
      const data = await res.json();
      if (data.authenticated === true) {
        setIsFounder(true);
      } else {
        setIsFounder(false);
      }
    } catch {
      if (founderSessionActive === true) {
        setIsFounder(true);
        return;
      }
      setIsFounder(false);
    }
  };

  useEffect(() => {
    if (founderSessionActive === true) setIsFounder(true);
  }, [founderSessionActive]);

  const handleVerifyFounderPasskey = async (e) => {
    e?.preventDefault();
    setPasskeyError("");
    const clean = founderPasskeyInput.trim();
    if (!clean) return;

    try {
      const res = await fetch("/api/pawan/verify-founder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey: clean })
      });
      const data = await res.json();

      if (res.ok && data.authorized === true) {
        if (data.token) {
          localStorage.setItem("garuda_founder_token", data.token);
        }
        setIsFounder(true);
        setShowFounderPasskeyModal(false);
        setFounderPasskeyInput("");
        pawanSpeak(data.message || "Founder Praveen authenticated. Internal sovereign controls active.");
      } else {
        setPasskeyError(data.error || "Galat Passkey! Founder access restricted.");
      }
    } catch (err) {
      setPasskeyError("Verification error: " + err.message);
    }
  };

  const handleFounderLock = () => {
    localStorage.removeItem("garuda_founder_token");
    setIsFounder(false);
    pawanSpeak("Founder mode locked. Standard client scoping active.");
  };

  const handleClearChatMemory = () => {
    if (window.confirm("Kya aap conversation memory reset karke naya project shuru karna chahte hain?")) {
      localStorage.removeItem("garuda_pawan_chat_messages");
      setMessages([
        {
          id: "welcome",
          sender: "pawan",
          text: "नमस्ते! मेमोरी रीसेट हो गई है। आप जो भी नया ऐप या फीचर बनाना चाहते हैं, बताइए।",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      setTurnCount(0);
      pawanSpeak("Memory cleared. Ready for a new project.");
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/pawan/status");
      const data = await res.json();
      if (data.success) setStatusInfo(data);
    } catch {}
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/pawan/history?limit=15");
      const data = await res.json();
      if (data.success) setHistory(data.history || []);
    } catch {}
  };

  const fetchMobileStatus = async () => {
    try {
      setMobileLoading(true);
      const res = await fetch("/api/pawan/mobile-status");
      const data = await res.json();
      if (data.success) setMobileStatus(data);
    } catch {} finally {
      setMobileLoading(false);
    }
  };

  const handleMobileReverse = async () => {
    try {
      setMobileReverseMsg("Establishing USB device bridge...");
      const res = await fetch("/api/pawan/mobile-reverse", { method: "POST" });
      const data = await res.json();
      setMobileReverseMsg(data.message || data.error || "Completed");
      pawanSpeak("USB bridge active. Connected phone is now synchronized with GARUDA.");
    } catch (err) {
      setMobileReverseMsg("Error: " + err.message);
    }
  };

  const fetchMobileLogs = async () => {
    try {
      const res = await fetch("/api/pawan/mobile-logs");
      const data = await res.json();
      setMobileLogs(data.logs || "No recent logs captured.");
    } catch {
      setMobileLogs("Log fetch error.");
    }
  };

  const handleLaunchLiveApp = () => {
    const codeToRun = activeProject?.code || result?.code;
    if (!codeToRun) {
      alert("No application code available to test yet.");
      return;
    }

    let fullHtml = codeToRun;
    if (!codeToRun.includes("<html") && !codeToRun.includes("<!DOCTYPE") && !codeToRun.includes("<body")) {
      fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${activeProject?.file || result?.file || "GARUDA Live Application"}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-stone-900 text-stone-100 min-h-screen">
  ${codeToRun}
</body>
</html>`;
    }

    try {
      const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const newWin = window.open(blobUrl, "_blank");
      if (!newWin) {
        window.location.href = blobUrl;
      }
    } catch (e) {
      console.error("Blob launch error:", e);
    }
  };

  const pawanSpeak = (text) => {
    if (voiceMuted || typeof window === "undefined" || !text) return;
    try {
      const audio = new Audio(`/api/audio/tts?text=${encodeURIComponent(text.slice(0, 200))}&lang=hi`);
      audio.play().catch(() => {
        try {
          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text.slice(0, 160));
            utterance.lang = "hi-IN";
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
          }
        } catch {}
      });
    } catch {}
  };

  const toggleVoiceInput = () => {
    if (!SpeechRec) {
      alert("Voice recognition is supported in Chrome or Edge browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setVoiceStatus("");
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatus("🎙️ Listening... Speak your prompt now.");
        pawanSpeak("नमस्ते प्रवीण जी! मैं गरुड़ पवन हूँ। आदेश दीजिए, क्या कोड करना है?");
      };

      recognition.onresult = (event) => {
        let transcriptText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcriptText += event.results[i][0].transcript;
        }
        setInstruction(transcriptText);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setVoiceStatus("Mic error: " + event.error);
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceStatus("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      setVoiceStatus("Voice error: " + err.message);
    }
  };

  const handleExecute = async (e) => {
    e?.preventDefault();
    if (!instruction.trim()) return;

    if (!isFounder) {
      setPendingPlan({ instruction: instruction.trim(), targetFile: targetFile.trim() || activeProject?.file });
      setShowGateModal(true);
      pawanSpeak("Application code synthesize karne se pehle commercial token confirm karein.");
      return;
    }

    setLoading(true);
    setError(null);
    pawanSpeak("Pawan has initiated the task. Synthesizing verified patch.");

    try {
      const res = await fetch("/api/pawan/execute", {
        method: "POST",
        headers: await founderRequestHeaders(),
        body: JSON.stringify({
          instruction: instruction.trim(),
          targetFile: targetFile.trim() || activeProject?.file || undefined,
          currentCode: activeProject?.code,
          attachment: activeAttachment ? { data: activeAttachment.data, mimeType: activeAttachment.mimeType } : undefined
        })
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Server returned HTTP ${res.status}: ${rawText.slice(0, 150) || "Backend server warming up, please retry in 3 seconds."}`);
      }

      if (!res.ok || !data.success) {
        const detail = data.error || data.data?.error || data.data?.validation?.stderr || (data.data?.validation?.valid === false ? "Syntax validation failed on generated code." : "Autonomous execution failed.");
        throw new Error(detail);
      }

      setResult(data.data);
      const newProj = {
        file: data.data.file,
        code: data.data.code,
        version: (activeProject?.version || 0) + 1,
        summary: data.data.summary,
        taskId: data.data.taskId
      };
      setActiveProject(newProj);
      try {
        localStorage.setItem("garuda_pawan_active_project", JSON.stringify(newProj));
      } catch {}
      setActiveTab("preview"); // Switch to preview automatically so user sees the result!
      setMobileViewTab("output");
      fetchHistory();
      pawanSpeak("Task completed successfully! App is running live on screen.");
    } catch (err) {
      setResult(null);
      let errMsg = err.message || "Autonomous execution failed";
      if (err.name === "TypeError" && errMsg.includes("Failed to fetch")) {
        errMsg = "Network connection failed (/api/pawan/execute). Render backend may be waking up. Please retry shortly.";
      }
      setError(errMsg);
      pawanSpeak("Execution note: " + errMsg.replace(/https?:\/\/\S+/g, "").slice(0, 75));
    } finally {
      setLoading(false);
    }
  };

  const compressImageIfNeeded = (file) => {
    return new Promise((resolve) => {
      if (!file.type || !file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => resolve({ data: reader.result, size: file.size, isImage: false });
        reader.readAsDataURL(file);
        return;
      }

      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1600;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.82);
          const sizeBytes = Math.round((compressedBase64.length * 3) / 4);
          resolve({ data: compressedBase64, size: sizeBytes, isImage: true });
        } catch {
          resolve({ data: reader.result, size: file.size, isImage: true });
        }
      };
      img.onerror = () => {
        resolve({ data: reader.result, size: file.size, isImage: true });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAttachmentSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const maxAttachmentBytes = 2.5 * 1024 * 1024;
      if (file.size > maxAttachmentBytes) throw new Error("File size 2.5 MB se kam rakhein.");
      const { data, size, isImage } = await compressImageIfNeeded(file);
      const encodedBytes = Math.max(0, Math.floor(data.length * 0.75));
      if (encodedBytes > maxAttachmentBytes) throw new Error("Compressed attachment 2.5 MB se badi hai. Chhoti image/PDF try karein.");
      setActiveAttachment({
        name: file.name,
        size: (size / 1024).toFixed(1) + " KB",
        mimeType: isImage ? "image/jpeg" : (file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "application/octet-stream")),
        data,
        isImage
      });
      pawanSpeak("Document attached: " + file.name);
    } catch (err) {
      setError(err.message || "Attachment read nahi ho paaya.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = () => {
    setActiveAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConsult = async (customText, customAttachment = null) => {
    const textToSend = (customText || instruction).trim();
    const attachmentToSend = customAttachment || activeAttachment;
    if (!textToSend && !attachmentToSend) return;

    const userMsg = {
      id: "u_" + Date.now(),
      sender: "user",
      text: textToSend,
      attachment: attachmentToSend ? { ...attachmentToSend } : null,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInstruction("");
    setActiveAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTurnCount(prev => prev + 1);
    setIsConsulting(true);
    setError(null);
    pawanSpeak("Analyzing requirements and formulating architectural recommendations.");

    try {
      const executeConsultRequest = async () => {
        const historyPayload = messages.slice(-10).map(m => ({ sender: m.sender, text: m.text }));
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 40000);
        try {
          const res = await fetch("/api/pawan/consult", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instruction: textToSend,
              attachment: attachmentToSend ? { data: attachmentToSend.data, mimeType: attachmentToSend.mimeType } : undefined,
              currentCode: activeProject?.code,
              targetFile: activeProject?.file || targetFile.trim() || undefined,
              history: historyPayload
            }),
            signal: controller.signal
          });
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || "Consultation failed");
          return data;
        } finally {
          clearTimeout(timeoutId);
        }
      };

      const data = await executeConsultRequest();

      const c = data.consultation;
      const isConversational = c.isConversational || (!c.actionPlan && (!c.recommendations || c.recommendations.length === 0));
      let messageText = c.reply || c.observation || "Ji boliye, kya develop karna hai?";

      if (!isFounder && turnCount >= 2 && !isConversational) {
        messageText += "\n\n💳 **Commercial Scoping Update:** Requirements scoped. Application code synthesis unlock karne ke liye amount confirmation token confirm karein.";
      }

      const pawanMsg = {
        id: "p_" + Date.now(),
        sender: "pawan",
        consultation: isConversational ? null : c,
        text: messageText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, pawanMsg]);
      if (isConversational) {
        pawanSpeak(messageText);
      } else {
        pawanSpeak("Architecture plan ready. Review specifications on screen.");
      }
    } catch (err) {
      setError(err.message);
      setInstruction(textToSend);
      if (attachmentToSend) setActiveAttachment(attachmentToSend);
      const isNetworkError = err.name === "AbortError" || String(err.message).toLowerCase().includes("failed to fetch") || String(err.message).toLowerCase().includes("network");

      const friendlyText = isNetworkError
        ? `⚡ Pawan ka response timeout ho gaya. Ek baar dobara try karein.`
        : `Error during consultation: ${err.message}`;

      setMessages(prev => [...prev, {
        id: "err_" + Date.now(),
        sender: "pawan",
        text: friendlyText,
        isError: !isNetworkError,
        consultation: isNetworkError ? {
          isConversational: true,
          reply: `Aapka command safely capture ho chuka hai: "${textToSend}". Cloud reconnect ho raha hai.`,
          actionPlan: "1. Auto-reconnect with sovereign AI cloud. 2. Synthesize code directly.",
          suggestedInstruction: textToSend
        } : null,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);
      pawanSpeak(isNetworkError ? "Connection reconnect ho raha hai." : "Consultation error occurred.");
    } finally {
      setIsConsulting(false);
    }
  };

  const handleExecuteFromPlan = async (suggestedInstruction, suggestedFile) => {
    const fileToUse = suggestedFile || activeProject?.file || targetFile || "public/app.html";
    const instrToUse = suggestedInstruction || instruction;

    if (!isFounder) {
      setPendingPlan({ instruction: instrToUse, targetFile: fileToUse });
      setShowGateModal(true);
      pawanSpeak("Application code generate karne se pehle commercial confirmation zaruri hai.");
      return;
    }
    
    setLoading(true);
    setError(null);
    pawanSpeak("Order confirmed. Synthesizing verified application code.");

    try {
      const res = await fetch("/api/pawan/execute", {
        method: "POST",
        headers: await founderRequestHeaders(),
        body: JSON.stringify({
          instruction: instrToUse,
          targetFile: fileToUse,
          currentCode: activeProject?.code
        })
      });

      const rawText = await res.text();
      let data;
      try { data = JSON.parse(rawText); } catch {
        throw new Error(`Server returned HTTP ${res.status}: ${rawText.slice(0, 150)}`);
      }

      if (!res.ok || !data.success) {
        const detail = data.error || data.data?.error || data.data?.validation?.stderr || "Autonomous execution failed.";
        throw new Error(detail);
      }

      const resData = data.data;
      setResult(resData);
      const newProj = {
        file: resData.file,
        code: resData.code,
        version: (activeProject?.version || 0) + 1,
        summary: resData.summary
      };
      setActiveProject(newProj);
      try {
        localStorage.setItem("garuda_pawan_active_project", JSON.stringify(newProj));
      } catch {}
      setActiveTab("preview");
      setMobileViewTab("output");
      fetchHistory();

      setMessages(prev => [...prev, {
        id: "exec_" + Date.now(),
        sender: "pawan",
        text: `✓ Code built and verified for ${resData.file}! Live preview is running on the right.`,
        codeResult: resData,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);

      pawanSpeak("Praveen ji, application code is verified and ready on screen!");
    } catch (err) {
      setResult(null);
      let errMsg = err.message || "Autonomous execution failed";
      if (err.name === "TypeError" && errMsg.includes("Failed to fetch")) {
        errMsg = "Network connection failed (/api/pawan/execute). Render backend may be waking up. Please retry shortly.";
      }
      setError(errMsg);
      pawanSpeak("Execution error occurred. Check screen details.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuildApk = async () => {
    const codeToBuild = activeProject?.code || result?.code;
    if (!codeToBuild) {
      alert("Please generate application code first before packaging for mobile.");
      return;
    }
    setApkBuilding(true);
    pawanSpeak("Packaging mobile application and compiling bundle.");
    try {
      const res = await fetch("/api/pawan/build-apk", {
        method: "POST",
        headers: await founderRequestHeaders(),
        body: JSON.stringify({
          code: codeToBuild,
          targetFile: activeProject?.file || result?.file,
          appName: (activeProject?.file || result?.file || "garuda-app").replace(/\.[^/.]+$/, "").replace(/^.*\//, "")
        })
      });
      const data = await res.json();
      if (data.success) {
        setApkDownloadUrl(data.downloadUrl);
        setApkModalData(data);
        pawanSpeak("Mobile package and APK bundle are ready on screen!");
      } else {
        alert("APK build error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("APK build error: " + err.message);
    } finally {
      setApkBuilding(false);
    }
  };

  const handleRequestMarketQuote = async (promptText, customBudget) => {
    pawanSpeak("Calculating market benchmarks and generating feasibility report.");
    try {
      const res = await fetch("/api/pawan/market-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: intakeName || "Executive Partner",
          prompt: promptText || instruction || "Custom Web & Mobile Application",
          budget: customBudget || "standard",
          appName: targetFile || "garuda-app"
        })
      });
      const data = await res.json();
      if (data.success && data.quote) {
        setMessages(prev => [...prev, {
          id: "quote_" + Date.now(),
          sender: "pawan",
          marketQuote: data.quote,
          text: `📊 Feasibility & Market Report generated for ${data.quote.proposedApp}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }]);
        pawanSpeak("Market analysis and transparent pricing report is ready on screen.");
      }
    } catch (err) {
      alert("Error fetching market quote: " + err.message);
    }
  };

  const handleNegotiateQuote = async (quoteObj, counterOfferValue) => {
    try {
      const res = await fetch("/api/pawan/negotiate-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentQuote: quoteObj,
          clientCounterOffer: counterOfferValue
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setMessages(prev => [...prev, {
          id: "neg_" + Date.now(),
          sender: "pawan",
          negotiationResult: data.result,
          text: data.result.message,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }]);
        pawanSpeak(data.result.accepted ? "Counter-offer accepted! Partnership locked." : "Scope review required for this budget.");
      }
    } catch (err) {
      alert("Negotiation error: " + err.message);
    }
  };

  const handleCopyCode = () => {
    if (!result?.code) return;
    navigator.clipboard.writeText(result.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    if (!intakeEmail && !intakePhone) {
      alert("Please enter email or phone number.");
      return;
    }

    try {
      await fetch("/api/project-scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: intakeName || "Prospective Client",
          clientEmail: intakeEmail,
          clientPhone: intakePhone,
          serviceNeeded: "GARUDA PAWAN Autonomous Coding Agent Execution",
          requirements: `Repo: ${intakeRepo || "Private Repository"}\nTask Instruction: ${instruction}`,
          budgetRange: "₹25,000 - ₹1,00,000"
        })
      });
      setIntakeSubmitted(true);
    } catch {
      alert("Unable to transmit scoping request right now.");
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      height: "100dvh",
      background: T.bg,
      color: T.text,
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      overscrollBehavior: "none",
      WebkitFontSmoothing: "antialiased"
    }}>

      {/* Global CSS for Claude Code Clean Aesthetics & Scrollbars */}
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D6D3CC; border-radius: 999px; }
        ::-webkit-scrollbar-thumb:hover { background: #A8A29E; }
        .claude-card {
          background: ${T.panel};
          border: 1px solid ${T.border};
          box-shadow: ${T.shadowSm};
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .claude-card:hover {
          border-color: ${T.borderHover};
        }
        .claude-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.82rem;
          transition: all 0.16s ease;
          cursor: pointer;
        }
        .claude-btn:active {
          transform: scale(0.98);
        }
        @media (max-width: 1023px) {
          .desktop-split-view {
            display: none !important;
          }
          .mobile-view {
            display: flex !important;
          }
        }
        @media (min-width: 1024px) {
          .desktop-split-view {
            display: grid !important;
          }
          .mobile-view {
            display: none !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 🏛️ TOP HEADER: CLAUDE CODE EXECUTIVE BRAND BAR (ANCHORED & SYMMETRICAL)    */}
      {/* ========================================================================= */}
      <header style={{
        flexShrink: 0,
        background: T.panel,
        borderBottom: `1px solid ${T.border}`,
        padding: "0.75rem 1.5rem",
        zIndex: 50
      }}>
        <div style={{
          maxWidth: "1600px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem"
        }}>
          {/* Brand Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${T.accentLight} 0%, #FDE68A 100%)`,
              border: `1px solid ${T.accentBorder}`,
              display: "grid",
              placeItems: "center",
              fontSize: "1.2rem",
              boxShadow: T.shadowSm
            }}>
              🦅
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.02rem", fontWeight: "800", color: T.text, letterSpacing: "-0.01em" }}>
                  PAWAN
                </span>
                <span style={{
                  fontSize: "0.68rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: T.accent,
                  background: T.accentLight,
                  border: `1px solid ${T.accentBorder}`,
                  padding: "1px 7px",
                  borderRadius: "6px"
                }}>
                  Studio
                </span>
                <span style={{
                  fontSize: "0.7rem",
                  color: T.emerald,
                  fontWeight: "700",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.emerald }}></span>
                  Ready
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: T.textMuted, marginTop: "1px" }}>
                Autonomous Software Architect • Closed-Loop ReAct Engine
              </div>
            </div>
          </div>

          {/* Center: Active Project Pill (If any) */}
          {activeProject && (
            <div style={{
              display: "none",
              alignItems: "center",
              gap: "0.5rem",
              background: T.bgSubtle,
              border: `1px solid ${T.border}`,
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "0.75rem",
              color: T.text
            }} className="md:flex">
              <span style={{ color: T.textSubtle }}>Active:</span>
              <strong style={{ fontFamily: "ui-monospace, monospace" }}>{activeProject.file}</strong>
              <span style={{ background: T.border, color: T.text, padding: "1px 6px", borderRadius: "4px", fontSize: "0.68rem" }}>
                v{activeProject.version}
              </span>
              <button
                type="button"
                onClick={() => setActiveProject(null)}
                title="Start fresh project"
                style={{ background: "transparent", border: "none", color: T.textSubtle, cursor: "pointer", padding: "0 2px" }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Right Header Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setShowAppsFleet(true)}
              className="claude-btn"
              style={{
                background: T.bgSubtle,
                border: `1px solid ${T.border}`,
                color: T.text,
                padding: "6px 12px",
                fontSize: "0.75rem"
              }}
            >
              <span>📱</span> Fleet ({CODING_TEMPLATES.length})
            </button>

            <button
              type="button"
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className="claude-btn"
              style={{
                background: showAuditTrail ? T.panelSubtle : T.panel,
                border: `1px solid ${T.border}`,
                color: T.textMuted,
                padding: "6px 12px",
                fontSize: "0.75rem"
              }}
            >
              <span>📜</span> History ({history.length})
            </button>

            <button
              type="button"
              onClick={() => setVoiceMuted(!voiceMuted)}
              className="claude-btn"
              title={voiceMuted ? "Unmute Voice" : "Mute Voice"}
              style={{
                background: T.panel,
                border: `1px solid ${T.border}`,
                color: voiceMuted ? T.textSubtle : T.accent,
                padding: "6px 10px",
                fontSize: "0.75rem"
              }}
            >
              {voiceMuted ? "🔇" : "🔊"}
            </button>

            <button
              type="button"
              onClick={handleClearChatMemory}
              className="claude-btn"
              title="Reset conversation memory"
              style={{
                background: T.panel,
                border: `1px solid ${T.border}`,
                color: T.textSubtle,
                padding: "6px 10px",
                fontSize: "0.75rem"
              }}
            >
              🧹
            </button>

            {isFounder ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <span style={{
                  background: T.accentLight,
                  border: `1px solid ${T.accentBorder}`,
                  color: T.accentHover,
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: "700"
                }}>
                  👑 Founder
                </span>
                <button
                  type="button"
                  onClick={handleFounderLock}
                  title="Lock Founder Mode"
                  style={{ background: "transparent", border: "none", color: T.textSubtle, cursor: "pointer", padding: "4px 6px" }}
                >
                  🔒
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowFounderPasskeyModal(true)}
                className="claude-btn"
                style={{
                  background: T.panel,
                  border: `1px solid ${T.border}`,
                  color: T.textMuted,
                  padding: "5px 10px",
                  fontSize: "0.75rem"
                }}
              >
                Founder Access
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Top Navigation Tabs (Only visible on small screens) */}
      <div className="mobile-view" style={{
        display: "none",
        flexShrink: 0,
        background: T.panel,
        borderBottom: `1px solid ${T.border}`,
        padding: "0.4rem 1rem",
        gap: "0.5rem"
      }}>
        <button
          type="button"
          onClick={() => setMobileViewTab("chat")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "6px",
            border: mobileViewTab === "chat" ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
            background: mobileViewTab === "chat" ? T.accentLight : T.panel,
            color: mobileViewTab === "chat" ? T.accentHover : T.textMuted,
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer"
          }}
        >
          💬 Chat & Plan
        </button>
        <button
          type="button"
          onClick={() => setMobileViewTab("output")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "6px",
            border: mobileViewTab === "output" ? `1px solid ${T.emerald}` : `1px solid ${T.border}`,
            background: mobileViewTab === "output" ? T.emeraldLight : T.panel,
            color: mobileViewTab === "output" ? T.emerald : T.textMuted,
            fontWeight: "700",
            fontSize: "0.82rem",
            cursor: "pointer"
          }}
        >
          👁️ Live App & Code {result ? "• Ready" : ""}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 🖥️ MAIN STUDIO BODY: TWO-COLUMN SYMMETRICAL WORKSPACE ON DESKTOP           */}
      {/* ========================================================================= */}
      <main style={{
        flex: 1,
        minHeight: 0,
        maxWidth: "1600px",
        margin: "0 auto",
        width: "100%",
        padding: "1rem 1.5rem",
        display: "grid",
        gridTemplateColumns: "1fr 1.15fr",
        gap: "1.25rem",
        overflow: "hidden"
      }} className="desktop-split-view">

        {/* ----------------------------------------------------------------------- */}
        {/* LEFT COLUMN: THE CONVERSATIONAL ARCHITECT & PROMPT TERMINAL             */}
        {/* ----------------------------------------------------------------------- */}
        <section className="claude-card" style={{
          borderRadius: "14px",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden"
        }}>
          {/* Subheader: Mode & 1-Tap Blueprint Pills */}
          <div style={{
            padding: "0.75rem 1rem",
            background: T.panelSubtle,
            borderBottom: `1px solid ${T.border}`,
            flexShrink: 0
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  onClick={() => setStudioMode("discuss")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: studioMode === "discuss" ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
                    background: studioMode === "discuss" ? T.panel : "transparent",
                    color: studioMode === "discuss" ? T.text : T.textSubtle,
                    fontWeight: "700",
                    fontSize: "0.75rem",
                    cursor: "pointer"
                  }}
                >
                  💬 Samvaad (Plan First)
                </button>
                <button
                  type="button"
                  onClick={() => setStudioMode("execute")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: studioMode === "execute" ? `1px solid ${T.emerald}` : `1px solid ${T.border}`,
                    background: studioMode === "execute" ? T.panel : "transparent",
                    color: studioMode === "execute" ? T.emerald : T.textSubtle,
                    fontWeight: "700",
                    fontSize: "0.75rem",
                    cursor: "pointer"
                  }}
                >
                  ⚡ Direct Execute
                </button>
              </div>
              <span style={{ fontSize: "0.7rem", color: T.textSubtle }}>
                {studioMode === "discuss" ? "Structured Roadmap" : "Instant Code Synthesis"}
              </span>
            </div>

            {/* Blueprint Horizontal Chips */}
            <div style={{
              display: "flex",
              gap: "0.5rem",
              overflowX: "auto",
              paddingBottom: "2px",
              scrollbarWidth: "none"
            }}>
              {CODING_TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInstruction(tpl.instruction);
                    setTargetFile(tpl.targetFile);
                    setStudioMode("discuss");
                  }}
                  style={{
                    flex: "0 0 auto",
                    background: instruction === tpl.instruction ? T.accentLight : T.panel,
                    border: instruction === tpl.instruction ? `1px solid ${T.accentBorder}` : `1px solid ${T.border}`,
                    borderRadius: "6px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    color: T.text,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <span>{tpl.icon}</span>
                  <span style={{ fontWeight: "600" }}>{tpl.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Conversational Stream: Clean White Chat Body */}
          <div style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "1rem",
            background: T.bg,
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem"
          }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: m.consultation ? "100%" : "88%",
                  width: m.consultation ? "100%" : "auto"
                }}
              >
                {/* Message Header */}
                <div style={{
                  fontSize: "0.68rem",
                  color: T.textSubtle,
                  marginBottom: "3px",
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  display: "flex",
                  gap: "6px"
                }}>
                  <strong style={{ color: m.sender === "user" ? T.text : T.claudeTerracotta }}>
                    {m.sender === "user" ? "Praveen Mahawar" : "PAWAN"}
                  </strong>
                  <span>{m.timestamp}</span>
                </div>

                {/* User Message Bubble */}
                {m.sender === "user" && (
                  <div style={{
                    background: T.panel,
                    color: T.text,
                    border: `1px solid ${T.border}`,
                    padding: "10px 14px",
                    borderRadius: "12px 12px 2px 12px",
                    fontSize: "0.86rem",
                    lineHeight: 1.5,
                    boxShadow: T.shadowSm
                  }}>
                    {m.attachment && (
                      <div style={{
                        marginBottom: "6px",
                        padding: "6px 8px",
                        background: T.bgSubtle,
                        borderRadius: "6px",
                        border: `1px solid ${T.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}>
                        {m.attachment.isImage ? (
                          <img src={m.attachment.data} alt="thumb" style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "4px" }} />
                        ) : (
                          <span style={{ fontSize: "1.2rem" }}>📄</span>
                        )}
                        <span style={{ fontSize: "0.75rem", fontWeight: "600" }}>{m.attachment.name}</span>
                      </div>
                    )}
                    {m.text}
                  </div>
                )}

                {/* Pawan Message / Consultation Cards */}
                {m.sender === "pawan" && (
                  <div>
                    {m.consultation && m.consultation.actionPlan ? (
                      <div style={{
                        background: T.panel,
                        border: `1px solid ${T.border}`,
                        borderRadius: "10px",
                        padding: "12px 14px",
                        boxShadow: T.shadowSm,
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}>
                        {/* Observation */}
                        {(m.consultation.reply || m.consultation.observation) && (
                          <div style={{ fontSize: "0.86rem", color: T.text, lineHeight: 1.5 }}>
                            {m.consultation.reply || m.consultation.observation}
                          </div>
                        )}

                        {/* Recommendations */}
                        {m.consultation.recommendations?.length > 0 && (
                          <div style={{
                            background: T.emeraldLight,
                            border: `1px solid ${T.emeraldBorder}`,
                            borderRadius: "8px",
                            padding: "8px 12px"
                          }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: T.emerald, marginBottom: "3px" }}>
                              Key Recommendations:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.8rem", color: "#065F46", lineHeight: 1.45 }}>
                              {m.consultation.recommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action Plan */}
                        <div style={{
                          background: T.panelSubtle,
                          border: `1px solid ${T.border}`,
                          borderRadius: "8px",
                          padding: "10px"
                        }}>
                          <div style={{ fontSize: "0.75rem", fontWeight: "700", color: T.textMuted, marginBottom: "4px" }}>
                            Execution Blueprint:
                          </div>
                          <div style={{ fontSize: "0.82rem", color: T.text, whiteSpace: "pre-line", lineHeight: 1.45 }}>
                            {m.consultation.actionPlan}
                          </div>

                          {/* 1-Click Action Buttons */}
                          <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => handleExecuteFromPlan(m.consultation.suggestedInstruction, m.consultation.targetFile)}
                              className="claude-btn"
                              style={{
                                background: loading ? T.textSubtle : T.accent,
                                color: "#FFFFFF",
                                border: "none",
                                padding: "7px 14px",
                                fontSize: "0.78rem"
                              }}
                            >
                              <span>{loading ? "⚡" : (isFounder ? "🚀" : "💳")}</span>
                              {loading ? "Synthesizing..." : (isFounder ? "Execute Plan (कोड निष्पादित करें)" : "Confirm & Unlock Code")}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setInstruction(m.consultation.suggestedInstruction || "");
                                setTargetFile(m.consultation.targetFile || "");
                              }}
                              className="claude-btn"
                              style={{
                                background: T.panel,
                                color: T.textMuted,
                                border: `1px solid ${T.border}`,
                                padding: "7px 12px",
                                fontSize: "0.78rem"
                              }}
                            >
                              ✏️ Tweak Plan
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRequestMarketQuote(m.consultation.suggestedInstruction || m.consultation.actionPlan)}
                              className="claude-btn"
                              style={{
                                background: T.panel,
                                color: T.accent,
                                border: `1px solid ${T.border}`,
                                padding: "7px 12px",
                                fontSize: "0.78rem"
                              }}
                            >
                              📊 Feasibility Report
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background: T.panel,
                        color: T.text,
                        border: `1px solid ${T.border}`,
                        padding: "10px 14px",
                        borderRadius: "12px 12px 12px 2px",
                        fontSize: "0.86rem",
                        lineHeight: 1.5,
                        boxShadow: T.shadowSm
                      }}>
                        {m.text}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isConsulting && (
              <div style={{
                alignSelf: "flex-start",
                padding: "8px 12px",
                background: T.panel,
                border: `1px solid ${T.border}`,
                borderRadius: "8px",
                fontSize: "0.8rem",
                color: T.textMuted,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span style={{ animation: "spin 1s linear infinite" }}>⚙️</span>
                Pawan is analyzing architecture & designing blueprint...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Prompt Dock: Claude Code Clean Textarea & Actions */}
          <div style={{
            flexShrink: 0,
            background: T.panel,
            borderTop: `1px solid ${T.border}`,
            padding: "0.85rem 1rem"
          }}>
            {/* Attachment preview if active */}
            {activeAttachment && (
              <div style={{
                marginBottom: "8px",
                padding: "6px 10px",
                background: T.bgSubtle,
                border: `1px solid ${T.border}`,
                borderRadius: "6px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.78rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📎</span>
                  <strong>{activeAttachment.name}</strong>
                  <span style={{ color: T.textSubtle }}>({activeAttachment.size})</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  style={{ background: "transparent", border: "none", color: "#DC2626", cursor: "pointer", fontWeight: "700" }}
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={studioMode === "discuss" ? (e) => { e.preventDefault(); handleConsult(); } : handleExecute}>
              <div style={{ position: "relative" }}>
                <textarea
                  rows="3"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (studioMode === "discuss") handleConsult();
                      else handleExecute();
                    }
                  }}
                  placeholder={
                    studioMode === "discuss"
                      ? "Describe your app idea or attach photo/PDF (e.g. 'Build an executive real-time profit & ROI calculator with sliders')..."
                      : "Direct coding task describe karein..."
                  }
                  style={{
                    width: "100%",
                    background: T.bg,
                    border: `1px solid ${T.border}`,
                    borderRadius: "8px",
                    padding: "10px 12px",
                    color: T.text,
                    fontSize: "0.88rem",
                    lineHeight: 1.5,
                    resize: "none",
                    outline: "none",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s ease"
                  }}
                  onFocus={(e) => e.target.style.borderColor = T.accent}
                  onBlur={(e) => e.target.style.borderColor = T.border}
                />
              </div>

              {/* Bottom Row inside Prompt Dock */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", flexWrap: "wrap", gap: "6px" }}>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="claude-btn"
                    title="Attach image or PDF"
                    style={{
                      background: activeAttachment ? T.accentLight : T.bgSubtle,
                      border: `1px solid ${T.border}`,
                      color: activeAttachment ? T.accentHover : T.textMuted,
                      padding: "6px 10px",
                      fontSize: "0.75rem"
                    }}
                  >
                    <span>📷</span> Camera / Doc
                  </button>

                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className="claude-btn"
                    style={{
                      background: isListening ? "#FEE2E2" : T.bgSubtle,
                      border: `1px solid ${isListening ? "#FCA5A5" : T.border}`,
                      color: isListening ? "#DC2626" : T.textMuted,
                      padding: "6px 10px",
                      fontSize: "0.75rem"
                    }}
                  >
                    <span>{isListening ? "⏹️" : "🎙️"}</span>
                    {isListening ? "Listening..." : "Mic"}
                  </button>

                  <input
                    type="text"
                    value={targetFile}
                    onChange={(e) => setTargetFile(e.target.value)}
                    placeholder={activeProject?.file ? `File: ${activeProject.file}` : "Target file (optional)"}
                    style={{
                      background: T.bgSubtle,
                      border: `1px solid ${T.border}`,
                      borderRadius: "6px",
                      padding: "5px 8px",
                      fontSize: "0.75rem",
                      color: T.text,
                      width: "140px",
                      fontFamily: "ui-monospace, monospace",
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  {studioMode === "discuss" ? (
                    <button
                      type="submit"
                      disabled={isConsulting || (!instruction.trim() && !activeAttachment)}
                      className="claude-btn"
                      style={{
                        background: isConsulting ? T.border : T.accent,
                        color: "#FFFFFF",
                        border: "none",
                        padding: "7px 16px",
                        fontSize: "0.82rem"
                      }}
                    >
                      <span>{isConsulting ? "⚙️" : "💬"}</span>
                      {isConsulting ? "Planning..." : "Ask Pawan ↵"}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || !instruction.trim()}
                      className="claude-btn"
                      style={{
                        background: loading ? T.border : T.emerald,
                        color: "#FFFFFF",
                        border: "none",
                        padding: "7px 16px",
                        fontSize: "0.82rem"
                      }}
                    >
                      <span>{loading ? "⚡" : "🚀"}</span>
                      {loading ? "Building..." : "Run Code ↵"}
                    </button>
                  )}
                </div>
              </div>
            </form>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              capture="environment"
              style={{ display: "none" }}
              onChange={handleAttachmentSelect}
            />
          </div>
        </section>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: THE STUDIO DECK (LIVE PREVIEW, CODE VIEWER & APK)          */}
        {/* ----------------------------------------------------------------------- */}
        <section className="claude-card" style={{
          borderRadius: "14px",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden"
        }}>
          {/* Deck Tab Header */}
          <div style={{
            padding: "0.75rem 1rem",
            background: T.panelSubtle,
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0
          }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: activeTab === "preview" ? `1px solid ${T.emeraldBorder}` : "1px solid transparent",
                  background: activeTab === "preview" ? T.panel : "transparent",
                  color: activeTab === "preview" ? T.emerald : T.textMuted,
                  fontWeight: "700",
                  fontSize: "0.78rem",
                  cursor: "pointer"
                }}
              >
                👁️ Live App Preview
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("code")}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: activeTab === "code" ? `1px solid ${T.border}` : "1px solid transparent",
                  background: activeTab === "code" ? T.panel : "transparent",
                  color: activeTab === "code" ? T.text : T.textMuted,
                  fontWeight: "700",
                  fontSize: "0.78rem",
                  cursor: "pointer"
                }}
              >
                📜 Code Viewer
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("mobile");
                  fetchMobileStatus();
                }}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: activeTab === "mobile" ? `1px solid ${T.border}` : "1px solid transparent",
                  background: activeTab === "mobile" ? T.panel : "transparent",
                  color: activeTab === "mobile" ? T.text : T.textMuted,
                  fontWeight: "700",
                  fontSize: "0.78rem",
                  cursor: "pointer"
                }}
              >
                📱 Mobile Bridge
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("trajectory")}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: activeTab === "trajectory" ? `1px solid ${T.border}` : "1px solid transparent",
                  background: activeTab === "trajectory" ? T.panel : "transparent",
                  color: activeTab === "trajectory" ? T.text : T.textMuted,
                  fontWeight: "700",
                  fontSize: "0.78rem",
                  cursor: "pointer"
                }}
              >
                ⚡ Steps
              </button>
            </div>

            {/* Quick Action Buttons on Active Deck */}
            {result && (
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleLaunchLiveApp}
                  className="claude-btn"
                  title="Open app in fullscreen window"
                  style={{
                    background: T.emeraldLight,
                    border: `1px solid ${T.emeraldBorder}`,
                    color: T.emerald,
                    padding: "4px 8px",
                    fontSize: "0.72rem"
                  }}
                >
                  ↗ Fullscreen
                </button>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="claude-btn"
                  style={{
                    background: T.panel,
                    border: `1px solid ${T.border}`,
                    color: T.text,
                    padding: "4px 8px",
                    fontSize: "0.72rem"
                  }}
                >
                  {codeCopied ? "✓ Copied" : "📋 Copy"}
                </button>

                <button
                  type="button"
                  disabled={apkBuilding}
                  onClick={handleBuildApk}
                  className="claude-btn"
                  style={{
                    background: T.panel,
                    border: `1px solid ${T.border}`,
                    color: T.accent,
                    padding: "4px 8px",
                    fontSize: "0.72rem"
                  }}
                >
                  📦 {apkBuilding ? "Packaging..." : "APK"}
                </button>
              </div>
            )}
          </div>

          {/* Deck Content Area */}
          <div style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "1rem",
            background: T.bgSubtle,
            display: "flex",
            flexDirection: "column"
          }}>
            {error && (
              <div style={{
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#991B1B",
                fontSize: "0.82rem",
                marginBottom: "1rem"
              }}>
                <strong>Execution Note:</strong> {error}
              </div>
            )}

            {/* TAB 1: LIVE APP PREVIEW */}
            {activeTab === "preview" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                {/* Viewport bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("desktop")}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        border: `1px solid ${previewViewport === "desktop" ? T.borderHover : T.border}`,
                        background: previewViewport === "desktop" ? T.panel : "transparent",
                        color: T.text,
                        fontSize: "0.72rem",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      🖥️ Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewport("mobile")}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        border: `1px solid ${previewViewport === "mobile" ? T.borderHover : T.border}`,
                        background: previewViewport === "mobile" ? T.panel : "transparent",
                        color: T.text,
                        fontSize: "0.72rem",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      📱 Mobile (375px)
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewKey(k => k + 1)}
                    style={{ background: "transparent", border: "none", color: T.textSubtle, fontSize: "0.72rem", cursor: "pointer" }}
                  >
                    🔄 Reload Preview
                  </button>
                </div>

                {/* The Iframe Sandbox Container */}
                <div style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "stretch",
                  minHeight: "450px",
                  background: previewViewport === "mobile" ? T.panelSubtle : T.panel,
                  borderRadius: "10px",
                  border: `1px solid ${T.border}`,
                  overflow: "hidden",
                  boxShadow: T.shadowSm
                }}>
                  <iframe
                    key={previewKey}
                    srcDoc={result?.code || activeProject?.code || `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#FBFBF9] text-stone-800 flex items-center justify-center min-h-screen p-8 font-sans">
  <div class="text-center max-w-md">
    <div class="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">
      🦅
    </div>
    <h3 class="text-lg font-bold text-stone-900 mb-1">PAWAN Live Simulation Studio</h3>
    <p class="text-xs text-stone-500 leading-relaxed mb-4">
      Aapka application code generate hone par yahan live running app appear hoga.
    </p>
    <div class="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
      Awaiting Next Command
    </div>
  </div>
</body>
</html>`}
                    title="Live Simulation Studio"
                    sandbox="allow-scripts allow-modals allow-pointer-lock allow-same-origin"
                    style={{
                      width: previewViewport === "mobile" ? "375px" : "100%",
                      height: "100%",
                      minHeight: "500px",
                      border: previewViewport === "mobile" ? `8px solid #27272A` : "none",
                      borderRadius: previewViewport === "mobile" ? "24px" : "0",
                      background: "#FFFFFF",
                      margin: previewViewport === "mobile" ? "12px auto" : "0"
                    }}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: CODE VIEWER */}
            {activeTab === "code" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{
                  padding: "6px 12px",
                  background: T.panel,
                  border: `1px solid ${T.border}`,
                  borderBottom: "none",
                  borderTopLeftRadius: "8px",
                  borderTopRightRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  color: T.textMuted
                }}>
                  <strong style={{ fontFamily: "ui-monospace, monospace" }}>{result?.file || activeProject?.file || "public/app.html"}</strong>
                  <span>{result?.code ? `${result.code.split("\n").length} lines` : "Empty"}</span>
                </div>
                <pre style={{
                  margin: 0,
                  flex: 1,
                  background: T.codeBg,
                  color: T.codeText,
                  padding: "1rem",
                  borderBottomLeftRadius: "8px",
                  borderBottomRightRadius: "8px",
                  fontSize: "0.82rem",
                  fontFamily: "ui-monospace, Consolas, Monaco, monospace",
                  lineHeight: 1.55,
                  overflowX: "auto",
                  maxHeight: "600px"
                }}>
                  <code>{result?.code || activeProject?.code || "// No code generated yet. Enter prompt on the left to synthesize."}</code>
                </pre>
              </div>
            )}

            {/* TAB 3: MOBILE BRIDGE */}
            {activeTab === "mobile" && (
              <div style={{
                background: T.panel,
                border: `1px solid ${T.border}`,
                borderRadius: "10px",
                padding: "1.2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: "700", color: T.text }}>
                      📱 USB & Wi-Fi Mobile Device Bridge
                    </h4>
                    <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: T.textMuted }}>
                      Plug phone via USB or connect to Wi-Fi to test and debug live on device.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchMobileStatus}
                    disabled={mobileLoading}
                    className="claude-btn"
                    style={{ background: T.bgSubtle, border: `1px solid ${T.border}`, padding: "4px 10px", fontSize: "0.72rem" }}
                  >
                    {mobileLoading ? "Checking..." : "🔄 Refresh"}
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                  <div style={{
                    background: T.bgSubtle,
                    border: `1px solid ${mobileStatus?.connected ? T.emeraldBorder : T.border}`,
                    borderRadius: "8px",
                    padding: "10px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span>{mobileStatus?.connected ? "🟢" : "🔌"}</span>
                      <strong style={{ fontSize: "0.8rem", color: mobileStatus?.connected ? T.emerald : T.text }}>
                        {mobileStatus?.connected ? "USB Phone Connected" : "No USB Device Detected"}
                      </strong>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: T.textSubtle }}>
                      {mobileStatus?.connected ? `Device: ${mobileStatus.devices[0]?.model || mobileStatus.devices[0]?.id}` : "Connect phone via USB and enable USB debugging"}
                    </div>
                    <button
                      type="button"
                      onClick={handleMobileReverse}
                      className="claude-btn"
                      style={{ marginTop: "8px", width: "100%", background: T.accent, color: "#fff", border: "none", padding: "6px", fontSize: "0.75rem" }}
                    >
                      ⚡ Activate Phone Reverse Bridge
                    </button>
                    {mobileReverseMsg && (
                      <div style={{ marginTop: "4px", fontSize: "0.7rem", color: T.accent }}>{mobileReverseMsg}</div>
                    )}
                  </div>

                  <div style={{ background: T.bgSubtle, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "10px" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: "700", color: T.text, marginBottom: "4px" }}>
                      📶 Wi-Fi Mirror URL
                    </div>
                    <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                      <input
                        type="text"
                        readOnly
                        value={mobileStatus?.wifiUrl || (typeof window !== "undefined" ? window.location.origin : "https://www.garudaos.in")}
                        style={{ flex: 1, background: T.panel, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "4px 8px", fontSize: "0.75rem" }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = mobileStatus?.wifiUrl || window.location.origin;
                          navigator.clipboard.writeText(url);
                          alert("Mirror URL copied!");
                        }}
                        className="claude-btn"
                        style={{ background: T.panel, border: `1px solid ${T.border}`, padding: "4px 8px", fontSize: "0.72rem" }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: T.textMuted }}>ADB Logcat Stream:</span>
                    <button
                      type="button"
                      onClick={fetchMobileLogs}
                      style={{ background: "transparent", border: "none", color: T.accent, fontSize: "0.72rem", cursor: "pointer" }}
                    >
                      Fetch Logs
                    </button>
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: "8px",
                    background: T.codeBg,
                    color: "#F87171",
                    borderRadius: "6px",
                    fontSize: "0.7rem",
                    maxHeight: "100px",
                    overflowY: "auto"
                  }}>
                    {mobileLogs || "// Device error log stream will appear here."}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 4: TRAJECTORY */}
            {activeTab === "trajectory" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {result?.trajectory?.map((t, idx) => (
                  <div key={idx} style={{
                    background: T.panel,
                    border: `1px solid ${T.border}`,
                    borderRadius: "6px",
                    padding: "8px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.78rem"
                  }}>
                    <div>
                      <strong style={{ color: T.accent, marginRight: "6px" }}>Step {idx + 1}:</strong>
                      <span>{t.step}</span>
                    </div>
                    <span style={{ color: T.textSubtle, fontSize: "0.72rem" }}>
                      {t.summary || t.provider || t.instruction || (t.durationMs ? `${t.durationMs}ms` : "")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* ========================================================================= */}
      {/* 📱 MOBILE VIEW COMPONENT CONTAINER (SINGLE-COLUMN CARD DECK)              */}
      {/* ========================================================================= */}
      <div className="mobile-view" style={{
        display: "none",
        flex: 1,
        minHeight: 0,
        flexDirection: "column",
        padding: "0.75rem",
        overflowY: "auto"
      }}>
        {mobileViewTab === "chat" ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Same clean chat stream */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem", paddingBottom: "1rem" }}>
              {messages.map((m) => (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", alignSelf: m.sender === "user" ? "flex-end" : "flex-start", maxWidth: "90%" }}>
                  <div style={{ fontSize: "0.68rem", color: T.textSubtle, marginBottom: "2px" }}>
                    {m.sender === "user" ? "Praveen Mahawar" : "PAWAN"}
                  </div>
                  <div style={{
                    background: m.sender === "user" ? T.panel : T.panelSubtle,
                    border: `1px solid ${T.border}`,
                    padding: "8px 12px",
                    borderRadius: m.sender === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    fontSize: "0.85rem",
                    lineHeight: 1.45
                  }}>
                    {m.text}
                    {m.consultation?.actionPlan && (
                      <button
                        type="button"
                        onClick={() => handleExecuteFromPlan(m.consultation.suggestedInstruction, m.consultation.targetFile)}
                        className="claude-btn"
                        style={{ marginTop: "8px", width: "100%", background: T.accent, color: "#fff", border: "none", padding: "6px" }}
                      >
                        🚀 Execute Plan Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Bottom Input */}
            <form onSubmit={studioMode === "discuss" ? (e) => { e.preventDefault(); handleConsult(); } : handleExecute} style={{ flexShrink: 0, background: T.panel, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "8px" }}>
              <textarea
                rows="2"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Message Pawan..."
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: "0.88rem", resize: "none" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  style={{ background: isListening ? "#FEE2E2" : "transparent", border: "none", color: isListening ? "#DC2626" : T.textMuted, cursor: "pointer", fontSize: "1rem" }}
                >
                  🎙️
                </button>
                <button
                  type="submit"
                  disabled={loading || !instruction.trim()}
                  className="claude-btn"
                  style={{ background: T.accent, color: "#fff", border: "none", padding: "5px 14px", fontSize: "0.78rem" }}
                >
                  {loading ? "..." : "Send ↵"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Mobile preview screen */}
            <div style={{ flex: 1, background: T.panel, borderRadius: "10px", border: `1px solid ${T.border}`, overflow: "hidden" }}>
              <iframe
                srcDoc={result?.code || activeProject?.code || "<h3 style='padding:20px;text-align:center;'>Enter prompt in Chat tab to see app here</h3>"}
                title="Mobile Preview"
                sandbox="allow-scripts allow-modals allow-pointer-lock allow-same-origin"
                style={{ width: "100%", height: "100%", minHeight: "450px", border: "none" }}
              />
            </div>
            {result && (
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={handleLaunchLiveApp}
                  className="claude-btn"
                  style={{ flex: 1, background: T.emerald, color: "#fff", border: "none", padding: "8px", fontSize: "0.8rem" }}
                >
                  📲 Test Fullscreen
                </button>
                <button
                  type="button"
                  onClick={handleBuildApk}
                  className="claude-btn"
                  style={{ flex: 1, background: T.accent, color: "#fff", border: "none", padding: "8px", fontSize: "0.8rem" }}
                >
                  📦 APK
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📜 MODAL: EXECUTION AUDIT HISTORY DRAWER (CLEAN & ISOLATED)               */}
      {/* ========================================================================= */}
      {showAuditTrail && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "flex-end"
        }}>
          <div style={{
            width: "100%",
            maxWidth: "520px",
            height: "100%",
            background: T.panel,
            borderLeft: `1px solid ${T.border}`,
            boxShadow: T.shadowLg,
            display: "flex",
            flexDirection: "column",
            padding: "1.5rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: `1px solid ${T.border}`, paddingBottom: "0.75rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: T.text }}>
                  📜 Execution History & Memory
                </h3>
                <div style={{ fontSize: "0.75rem", color: T.textMuted, marginTop: "2px" }}>
                  {history.length} verified runs in cloud database
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditTrail(false)}
                style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", color: T.textSubtle }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", color: T.textSubtle, padding: "2rem", fontSize: "0.82rem" }}>
                  No execution logs recorded yet.
                </div>
              ) : (
                history.map((item, idx) => (
                  <div key={idx} style={{
                    background: T.bgSubtle,
                    border: `1px solid ${T.border}`,
                    borderRadius: "8px",
                    padding: "10px 12px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "0.82rem", color: T.text }}>
                        {item.file || item.instruction?.slice(0, 40) || item.taskId}
                      </strong>
                      <span style={{
                        fontSize: "0.68rem",
                        fontWeight: "700",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: item.success ? T.emeraldLight : "#FEE2E2",
                        color: item.success ? T.emerald : "#DC2626"
                      }}>
                        {item.success ? "Passed" : "Failed"}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: T.textMuted, lineHeight: 1.4 }}>
                      {item.summary || item.thought?.slice(0, 80) || "Task completed."}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", fontSize: "0.7rem", color: T.textSubtle }}>
                      <span>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : "Recent"}</span>
                      {item.code && (
                        <button
                          type="button"
                          onClick={() => {
                            setResult({
                              file: item.file || "public/app.html",
                              code: item.code,
                              summary: item.summary,
                              taskId: item.taskId
                            });
                            setActiveProject({
                              file: item.file || "public/app.html",
                              code: item.code,
                              version: 1,
                              summary: item.summary
                            });
                            setActiveTab("preview");
                            setShowAuditTrail(false);
                          }}
                          style={{ background: "transparent", border: "none", color: T.accent, cursor: "pointer", fontWeight: "700" }}
                        >
                          Load in Studio ➔
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📱 MODAL: APPS MADE BY PAWAN FLEET DRAWER                                  */}
      {/* ========================================================================= */}
      {showAppsFleet && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "flex-end"
        }}>
          <div style={{
            width: "100%",
            maxWidth: "540px",
            height: "100%",
            background: T.panel,
            borderLeft: `1px solid ${T.border}`,
            boxShadow: T.shadowLg,
            display: "flex",
            flexDirection: "column",
            padding: "1.5rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: `1px solid ${T.border}`, paddingBottom: "0.75rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: T.text }}>
                  📱 Apps Built by PAWAN Fleet
                </h3>
                <div style={{ fontSize: "0.75rem", color: T.textMuted, marginTop: "2px" }}>
                  Autonomous ReAct synthesis • PWA/APK Live
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAppsFleet(false)}
                style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", color: T.textSubtle }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* App 1: Cloth MIS */}
              <div style={{ background: T.bgSubtle, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "0.85rem", color: T.text }}>🧵 Cloth Wholesale 2-Device Lock GST MIS</strong>
                  <span style={{ fontSize: "0.68rem", background: T.emeraldLight, color: T.emerald, padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>Production Ready</span>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: "0.75rem", color: T.textMuted }}>
                  Saree/fabric invoice generation, wholesale slabs, multi-rate GST, thermal receipts.
                </p>
                <div style={{ display: "flex", gap: "6px" }}>
                  <a href="/cloth-gst.html" target="_blank" rel="noreferrer" className="claude-btn" style={{ background: T.emerald, color: "#fff", textDecoration: "none", padding: "5px 10px", fontSize: "0.72rem" }}>
                    🚀 Launch Web App
                  </a>
                  <a href="/apps/cloth-gst-calculator/" target="_blank" rel="noreferrer" className="claude-btn" style={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, textDecoration: "none", padding: "5px 10px", fontSize: "0.72rem" }}>
                    📲 PWA / Mobile
                  </a>
                </div>
              </div>

              {/* App 2: DOST Portal */}
              <div style={{ background: T.bgSubtle, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "0.85rem", color: T.text }}>🌱 GARUDA DOST • Rozgar Gateway</strong>
                  <span style={{ fontSize: "0.68rem", background: T.emeraldLight, color: T.emerald, padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>Live Gateway</span>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: "0.75rem", color: T.textMuted }}>
                  Public enrollment platform for youth and housewives. Earn transparent commissions on software leads.
                </p>
                <a href="/dost" target="_blank" rel="noreferrer" className="claude-btn" style={{ display: "inline-block", background: T.panel, border: `1px solid ${T.border}`, color: T.text, textDecoration: "none", padding: "5px 10px", fontSize: "0.72rem" }}>
                  🚀 Open Portal (/dost)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👑 MODAL: FOUNDER PASSKEY MODAL (CLEAN & ELEGANT)                          */}
      {/* ========================================================================= */}
      {showFounderPasskeyModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(4px)",
          display: "grid",
          placeItems: "center",
          zIndex: 10001,
          padding: "1rem"
        }}>
          <div style={{
            background: T.panel,
            border: `1px solid ${T.border}`,
            borderRadius: "14px",
            maxWidth: "400px",
            width: "100%",
            padding: "1.75rem",
            boxShadow: T.shadowLg,
            position: "relative"
          }}>
            <button
              onClick={() => { setShowFounderPasskeyModal(false); setPasskeyError(""); }}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: T.textSubtle, fontSize: "1.2rem", cursor: "pointer" }}
            >
              ✕
            </button>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "4px" }}>👑🔑</div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: T.text, margin: "0 0 4px" }}>
                Founder Workspace Access
              </h3>
              <p style={{ fontSize: "0.78rem", color: T.textMuted, margin: 0 }}>
                Internal sovereign authentication for Founder Praveen Mahawar.
              </p>
            </div>
            <form onSubmit={handleVerifyFounderPasskey}>
              <input
                type="password"
                required
                placeholder="Enter Founder Passkey"
                value={founderPasskeyInput}
                onChange={(e) => setFounderPasskeyInput(e.target.value)}
                style={{
                  width: "100%",
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: T.text,
                  fontSize: "0.88rem",
                  marginBottom: "8px",
                  outline: "none"
                }}
              />
              {passkeyError && (
                <div style={{ color: "#DC2626", fontSize: "0.75rem", marginBottom: "8px", fontWeight: "600" }}>
                  {passkeyError}
                </div>
              )}
              <button
                type="submit"
                className="claude-btn"
                style={{
                  width: "100%",
                  background: T.accent,
                  color: "#FFFFFF",
                  border: "none",
                  padding: "10px",
                  fontSize: "0.85rem"
                }}
              >
                Verify & Unlock Founder Mode
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📦 MODAL: 1-TAP APK & MOBILE DOWNLOAD MODAL                                */}
      {/* ========================================================================= */}
      {apkModalData && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(4px)",
          display: "grid",
          placeItems: "center",
          zIndex: 10002,
          padding: "1rem"
        }}>
          <div style={{
            background: T.panel,
            border: `1px solid ${T.border}`,
            borderRadius: "14px",
            maxWidth: "480px",
            width: "100%",
            padding: "1.75rem",
            boxShadow: T.shadowLg,
            position: "relative"
          }}>
            <button
              type="button"
              onClick={() => setApkModalData(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: T.textSubtle, fontSize: "1.2rem", cursor: "pointer" }}
            >
              ✕
            </button>
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.72rem", color: T.accent, fontWeight: "700", textTransform: "uppercase" }}>
                📱 Mobile Superpower
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: T.text, margin: "2px 0 4px" }}>
                {apkModalData.appName}
              </h3>
              <p style={{ margin: 0, color: T.textMuted, fontSize: "0.8rem" }}>
                {apkModalData.message}
              </p>
            </div>

            {apkModalData.qrUrl && (
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", background: T.bgSubtle, padding: "12px", borderRadius: "10px", marginBottom: "1rem" }}>
                <img src={apkModalData.qrUrl} alt="Scan QR" style={{ width: "100px", height: "100px", borderRadius: "6px", background: "#fff", padding: "4px" }} />
                <div style={{ fontSize: "0.78rem", color: T.textMuted, lineHeight: 1.4 }}>
                  Scan with Android camera to open and install to home screen instantly.
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <a
                href={apkModalData.downloadUrl}
                download
                className="claude-btn"
                style={{ background: T.accent, color: "#fff", textDecoration: "none", padding: "9px", fontSize: "0.8rem" }}
              >
                📦 Download Bundle (.zip)
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(apkModalData.previewUrl);
                  alert("Mobile link copied!");
                }}
                className="claude-btn"
                style={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, padding: "9px", fontSize: "0.8rem" }}
              >
                📋 Copy Mobile Link
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
