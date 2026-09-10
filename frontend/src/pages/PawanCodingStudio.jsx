import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const SpeechRec = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const PAYMENT_URL = "https://razorpay.me/@garudaosincompany";

const CODING_TEMPLATES = [
  {
    icon: "🩺",
    title: "AI Clinic Receptionist",
    category: "Healthcare Triage PWA",
    targetFile: "public/clinic_receptionist.html",
    instruction: "Build a complete, dark-theme Doctor & AI Clinic Receptionist PWA with 24/7 symptom triage, urgency flagging (Emergency/Urgent/Normal), automated appointment slot booking, and WhatsApp confirmation CTA."
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
    instruction: "Build a high-converting cybernetic SaaS landing page with interactive pricing tiers, live product feature sandbox, customer testimonials, and instant Razorpay/Stripe checkout modal."
  },
  {
    icon: "🌾",
    title: "GARUDA Dost Rozgar Hub",
    category: "Sovereign Rozgar Engine",
    targetFile: "public/dost_rozgar_portal.html",
    instruction: "Build a Sovereign GARUDA Dost affiliate & rozgar command center with unique referral link generator, client onboarding tracker, T+3 escrow settlement ledger, and WhatsApp lead share button."
  }
];

export default function PawanCodingStudio() {
  const navigate = useNavigate();
  const [instruction, setInstruction] = useState("");
  const [targetFile, setTargetFile] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [statusInfo, setStatusInfo] = useState(null);
  const [isFounder, setIsFounder] = useState(true); // Default to Founder mode
  const [showGateModal, setShowGateModal] = useState(false);
  const [activeTab, setActiveTab] = useState("code"); // 'code' | 'preview' | 'mobile' | 'trajectory' | 'proof'
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
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "pawan",
      text: "नमस्ते प्रवीण जी! मैं गरुड़ पवन हूँ — आपका Autonomous Software Architect। आप जो भी नया ऐप बनाना चाहते हैं या बदलाव करना चाहते हैं, मुझे बताइए या डॉक्यूमेंट/फोटो अटैच कीजिए। मैं पहले आपको Pro Recommendations और Action Plan दूँगा, और फिर आपके आदेश पर कोड करूँगा!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [activeAttachment, setActiveAttachment] = useState(null);
  const [activeProject, setActiveProject] = useState(null); // { file, code, version, summary }
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

  useEffect(() => {
    fetchStatus();
    fetchHistory();
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


  const checkAuthSession = async () => {
    try {
      const res = await fetch("/api/auth/session", { credentials: "same-origin" });
      const data = await res.json();
      if (data.authenticated === true) {
        setIsFounder(true);
      }
    } catch {
      setIsFounder(true);
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
      const res = await fetch("/api/pawan/history?limit=10");
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
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #000; color: #fff; font-family: system-ui, -apple-system, sans-serif; overflow-x: hidden; }
  </style>
</head>
<body>
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

  const getAppPreviewUrl = (filePath) => {
    if (!filePath) return "";
    const p = filePath.toLowerCase();
    if (p.includes("cloth-gst")) return "/cloth-gst.html";
    if (p.includes("billing")) return "/app";
    if (p.includes("kids")) return "/kids-play";
    if (p.includes("investor")) return "/investor";
    if (p.includes("botverse") || p.includes("bot-verse")) return "/bot-verse";
    if (p.includes("whatisgaruda")) return "/what-is-garuda-ai";
    if (p.includes("command")) return "/command-center";
    return "";
  };


  // 🔊 PAWAN Natural Speech (Streams Google Natural Voice with Web Speech fallback)
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

  // 🎙️ Toggle Voice Listening
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
        setVoiceStatus("🎙️ Listening for task instruction... Speak now.");
        pawanSpeak("नमस्ते प्रवीण जी! मैं गरुड़ पवन हूँ। आदेश दीजिए, आज क्या कोड करना है?");
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
      setShowGateModal(true);
      pawanSpeak("This is GARUDA PAWAN sovereign execution engine. Please verify project scope.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    pawanSpeak("Pawan has initiated the task. Analyzing codebase and synthesizing verified patch.");

    try {
      const res = await fetch("/api/pawan/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setActiveTab("code");
      fetchHistory();
      pawanSpeak("Praveen ji, task completed successfully! Verified code is ready on screen.");
    } catch (err) {
      const errMsg = err.message || "Autonomous execution failed";
      setError(errMsg);
      pawanSpeak("Praveen ji, execution note: " + errMsg.replace(/https?:\/\/\S+/g, "").slice(0, 75));
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
      const { data, size, isImage } = await compressImageIfNeeded(file);
      setActiveAttachment({
        name: file.name,
        size: (size / 1024).toFixed(1) + " KB",
        mimeType: isImage ? "image/jpeg" : (file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "application/octet-stream")),
        data,
        isImage
      });
      pawanSpeak("Document attached: " + file.name);
    } catch (err) {
      console.error("Attachment compression error:", err);
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
    setIsConsulting(true);
    setError(null);
    pawanSpeak("Analyzing requirements and formulating architectural recommendations.");

    try {
      const res = await fetch("/api/pawan/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: textToSend,
          attachment: attachmentToSend ? { data: attachmentToSend.data, mimeType: attachmentToSend.mimeType } : undefined,
          currentCode: activeProject?.code,
          targetFile: activeProject?.file || targetFile.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Consultation failed");
      }

      const c = data.consultation;
      const isConversational = c.isConversational || (!c.actionPlan && (!c.recommendations || c.recommendations.length === 0));
      const messageText = c.reply || c.observation || "Ji Praveen bhai, boliye.";
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
        pawanSpeak("Plan taiyar hai, screen par dekh sakte hain.");
      }
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, {
        id: "err_" + Date.now(),
        sender: "pawan",
        text: "Error during consultation: " + err.message,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);
    } finally {
      setIsConsulting(false);
    }
  };

  const handleExecuteFromPlan = async (suggestedInstruction, suggestedFile) => {
    const fileToUse = suggestedFile || activeProject?.file || targetFile || "public/app.html";
    const instrToUse = suggestedInstruction || instruction;
    
    setLoading(true);
    setError(null);
    pawanSpeak("Order confirmed. Synthesizing verified application code.");

    try {
      const res = await fetch("/api/pawan/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setActiveTab("code");
      fetchHistory();

      setMessages(prev => [...prev, {
        id: "exec_" + Date.now(),
        sender: "pawan",
        text: `✓ Code built and verified for ${resData.file}! Ready for instant mobile testing.`,
        codeResult: resData,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);

      pawanSpeak("Praveen ji, application code is verified and ready on screen!");
    } catch (err) {
      setError(err.message);
      pawanSpeak("Execution error occurred. Check screen details.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuildApk = async () => {
    const codeToBuild = activeProject?.code || result?.code;
    if (!codeToBuild) {
      alert("Please generate or enter application code first before packaging for mobile / APK.");
      return;
    }
    setApkBuilding(true);
    pawanSpeak("Packaging mobile application, generating PWA manifest and compiling bundle.");
    try {
      const res = await fetch("/api/pawan/build-apk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    setTimeout(() => setCodeCopied(false), 3000);
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
      pawanSpeak("Your project scope has been transmitted to Founder Praveen Mahawar.");
    } catch {
      setIntakeSubmitted(true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 50% 0%, rgba(212, 175, 55, 0.08) 0%, #060503 60%, #030201 100%)", color: "#f8fafc", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", padding: "1.5rem 1rem" }}>
      <style>{`
        @media (max-width: 768px) {
          .pawan-header { flex-direction: column !important; align-items: flex-start !important; }
          .pawan-controls { width: 100%; justify-content: flex-start !important; }
          .pawan-controls button { flex: 1 1 auto; min-height: 44px; font-size: 0.8rem !important; }
          .pawan-templates { gap: 0.5rem !important; }
          .pawan-templates button { min-width: 140px !important; max-width: 160px !important; }
          .pawan-chat { max-height: 50vh !important; min-height: 280px !important; }
          .pawan-input-grid { grid-template-columns: 1fr !important; }
          .pawan-action-buttons { flex-direction: column !important; }
          .pawan-action-buttons button { width: 100% !important; min-height: 44px; justify-content: center; }
        }
        @media (max-width: 480px) {
          h1 { font-size: 1.4rem !important; }
          .pawan-container { padding: 1rem 0.75rem !important; }
        }
      `}</style>
      <div className="pawan-container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Top Header & Brand Bar */}
        <div style={{ borderBottom: "1px solid rgba(212, 175, 55, 0.2)", paddingBottom: "1.2rem", marginBottom: "1.8rem" }}>
          <div className="pawan-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(212, 175, 55, 0.1)", border: "1px solid rgba(212, 175, 55, 0.35)", borderRadius: "999px", padding: "3px 12px", marginBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.85rem" }}>🦅</span>
                <span style={{ color: "#fbbf24", fontWeight: "800", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  GARUDA PAWAN • Autonomous Coding Studio
                </span>
              </div>

              <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: "800", margin: "0.2rem 0", color: "#ffffff", letterSpacing: "-0.02em" }}>
                PAWAN Autonomous Code & Repair Studio
              </h1>
              <p style={{ margin: 0, color: "#d4af37", fontSize: "0.85rem", fontWeight: "600" }}>
                “As Fast as Wind • Smooth & Powerful” — Closed-Loop ReAct Engine with Real-Time Syntax Repair & SHA-256 Audit Trail
              </p>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.3rem" }}>
                Founder: <strong>Praveen Mahawar</strong> • Voice-Guided Closed Loop • Multi-Model Synthesis
              </div>
            </div>

            {/* Controls */}
            <div className="pawan-controls" style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setShowAppsFleet(true)}
                style={{
                  background: "linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(99,102,241,0.25) 100%)",
                  border: "1px solid #d4af37",
                  color: "#fef08a",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  boxShadow: "0 0 12px rgba(212,175,55,0.2)"
                }}
              >
                <span>📱</span> Apps Made by Pawan
                <span style={{ background: "#d4af37", color: "#000", padding: "1px 6px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: "900" }}>Fleet</span>
              </button>

              <button
                type="button"
                onClick={() => setVoiceMuted(!voiceMuted)}
                style={{ background: voiceMuted ? "#1c1917" : "rgba(212, 175, 55, 0.12)", border: `1px solid ${voiceMuted ? "#44403c" : "#d4af37"}`, color: voiceMuted ? "#a8a29e" : "#fbbf24", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700" }}
              >
                {voiceMuted ? "🔇 Voice Muted" : "🔊 Voice Active"}
              </button>

              <button
                type="button"
                onClick={() => setIsFounder(!isFounder)}
                style={{
                  background: isFounder ? "linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(245,158,11,0.2) 100%)" : "#1c1917",
                  border: `1px solid ${isFounder ? "#d4af37" : "#44403c"}`,
                  color: isFounder ? "#fef08a" : "#94a3b8",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  cursor: "pointer"
                }}
              >
                {isFounder ? "👑 Founder Mode: Unlocked" : "🔒 Visitor Gate"}
              </button>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.35)", fontSize: "0.72rem", color: "#34d399", fontWeight: "800" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                ONLINE
              </div>
            </div>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
          
          {/* ================================================================= */}
          {/* 🦅 PAWAN SOVEREIGN CONSULTATIVE CHATBOX & EXECUTION CONSOLE       */}
          {/* ================================================================= */}
          <div style={{ background: "#080705", border: "1px solid rgba(212, 175, 55, 0.35)", borderRadius: "14px", padding: "1.2rem", boxShadow: "0 15px 40px rgba(0,0,0,0.7)" }}>
            
            {/* Top Mode Switcher & Active Project Indicator */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.8rem", borderBottom: "1px solid rgba(212, 175, 55, 0.2)", paddingBottom: "0.8rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setStudioMode("discuss")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px",
                    border: studioMode === "discuss" ? "1px solid #d4af37" : "1px solid #292524",
                    background: studioMode === "discuss" ? "linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(245,158,11,0.15) 100%)" : "#14120c",
                    color: studioMode === "discuss" ? "#fef08a" : "#a8a29e",
                    fontWeight: "800",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem"
                  }}
                >
                  <span>💬</span> Samvaad (Discuss & Plan)
                </button>

                <button
                  type="button"
                  onClick={() => setStudioMode("execute")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px",
                    border: studioMode === "execute" ? "1px solid #10b981" : "1px solid #292524",
                    background: studioMode === "execute" ? "rgba(16, 185, 129, 0.15)" : "#14120c",
                    color: studioMode === "execute" ? "#6ee7b7" : "#a8a29e",
                    fontWeight: "800",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem"
                  }}
                >
                  <span>⚡</span> Direct Code Execution
                </button>
              </div>

              {/* Active Project Continuity Memory Indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {activeProject ? (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.35)", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", color: "#38bdf8" }}>
                    <span>📌 Active App:</span>
                    <strong>{activeProject.file}</strong>
                    <span style={{ background: "#0369a1", color: "#fff", padding: "1px 5px", borderRadius: "4px", fontSize: "0.68rem" }}>v{activeProject.version}</span>
                    <button
                      type="button"
                      onClick={() => setActiveProject(null)}
                      title="Clear active project to start fresh"
                      style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.75rem", padding: "0 2px" }}
                    >
                      ✕ New
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: "0.72rem", color: "#78716c" }}>
                    ✨ Mode: Fresh Architecture
                  </span>
                )}
              </div>
            </div>

            {/* ⚡ Beautiful Production Coding Templates Gallery */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#f59e0b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  ⚡ 1-Tap Production Coding Templates:
                </span>
                <span style={{ fontSize: "0.68rem", color: "#78716c" }}>Click to auto-load blueprint</span>
              </div>
              <div className="pawan-templates" style={{ display: "flex", gap: "0.6rem", overflowX: "auto", paddingBottom: "4px", WebkitOverflowScrolling: "touch" }}>
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
                      background: instruction === tpl.instruction ? "rgba(245, 158, 11, 0.2)" : "#090d16",
                      border: instruction === tpl.instruction ? "1px solid #f59e0b" : "1px solid #1e293b",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      cursor: "pointer",
                      textAlign: "left",
                      minWidth: "160px",
                      maxWidth: "200px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "1rem" }}>{tpl.icon}</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#f3f4f6", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tpl.title}</span>
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{tpl.category}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversational Stream (Spacious Mobile Chat Area) */}
            {studioMode === "discuss" && (
              <div style={{ maxHeight: "420px", minHeight: "220px", overflowY: "auto", padding: "12px", background: "#040302", borderRadius: "10px", border: "1px solid #1c1917", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                      maxWidth: "92%",
                      width: m.consultation ? "100%" : "auto"
                    }}
                  >
                    {/* Message Header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "4px", alignSelf: m.sender === "user" ? "flex-end" : "flex-start" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: "700", color: m.sender === "user" ? "#93c5fd" : "#f59e0b" }}>
                        {m.sender === "user" ? "👤 Praveen Mahawar" : "🦅 PAWAN Sovereign Architect"}
                      </span>
                      <span style={{ fontSize: "0.65rem", color: "#78716c" }}>{m.timestamp}</span>
                    </div>

                    {/* User Message Bubble */}
                    {m.sender === "user" && (
                      <div style={{ background: "#1e293b", color: "#f8fafc", padding: "10px 14px", borderRadius: "12px 12px 2px 12px", fontSize: "0.88rem", lineHeight: 1.5, border: "1px solid #334155" }}>
                        {m.attachment && (
                          <div style={{ marginBottom: "8px", padding: "6px 8px", background: "#0f172a", borderRadius: "6px", border: "1px solid #334155", display: "flex", alignItems: "center", gap: "8px" }}>
                            {m.attachment.isImage ? (
                              <img src={m.attachment.data} alt="attachment" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />
                            ) : (
                              <span style={{ fontSize: "1.4rem" }}>📄</span>
                            )}
                            <div style={{ fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <strong>{m.attachment.name}</strong> ({m.attachment.size})
                            </div>
                          </div>
                        )}
                        {m.text}
                      </div>
                    )}

                    {/* Pawan Consultative Message Cards */}
                    {m.sender === "pawan" && (
                      <div>
                        {m.consultation && m.consultation.actionPlan ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {/* Summary / Thought Bubble */}
                            {(m.consultation.reply || m.consultation.observation) && (
                              <div style={{ background: "#181511", color: "#fef08a", padding: "12px 14px", borderRadius: "12px 12px 12px 2px", fontSize: "0.88rem", lineHeight: 1.5, border: "1px solid rgba(212, 175, 55, 0.35)" }}>
                                {m.consultation.reply || m.consultation.observation}
                              </div>
                            )}

                            {/* Recommendations (Only if provided) */}
                            {m.consultation.recommendations?.length > 0 && (
                              <div style={{ background: "rgba(6, 78, 59, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "10px", padding: "10px 14px" }}>
                                <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#34d399", textTransform: "uppercase", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span>💡</span> Key Recommendations
                                </div>
                                <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.83rem", color: "#d1fae5", lineHeight: 1.5 }}>
                                  {m.consultation.recommendations.map((rec, idx) => (
                                    <li key={idx} style={{ marginBottom: "2px" }}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Risks & Loopholes (Only if provided) */}
                            {m.consultation.risksAndLoopholes?.length > 0 && (
                              <div style={{ background: "rgba(127, 29, 29, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "10px", padding: "10px 14px" }}>
                                <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#f87171", textTransform: "uppercase", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span>⚠️</span> Key Risks
                                </div>
                                <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.83rem", color: "#fee2e2", lineHeight: 1.5 }}>
                                  {m.consultation.risksAndLoopholes.map((risk, idx) => (
                                    <li key={idx} style={{ marginBottom: "2px" }}>{risk}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Execution Plan & 1-Click Execution */}
                            <div style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(245,158,11,0.08) 100%)", border: "1px solid rgba(212, 175, 55, 0.45)", borderRadius: "10px", padding: "14px" }}>
                              <div style={{ fontSize: "0.78rem", fontWeight: "800", color: "#fbbf24", textTransform: "uppercase", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>🚀</span> Action Roadmap
                              </div>
                              <div style={{ fontSize: "0.84rem", color: "#fef08a", lineHeight: 1.5, marginBottom: "12px", whiteSpace: "pre-line" }}>
                                {m.consultation.actionPlan}
                              </div>

                              {/* Action Footer Buttons */}
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", paddingTop: "8px", borderTop: "1px dashed rgba(212, 175, 55, 0.3)" }}>
                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => handleExecuteFromPlan(m.consultation.suggestedInstruction, m.consultation.targetFile)}
                                  style={{
                                    background: loading ? "#44403c" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                    color: "#ffffff",
                                    border: "none",
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    fontWeight: "900",
                                    fontSize: "0.82rem",
                                    cursor: loading ? "wait" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    boxShadow: "0 0 15px rgba(16, 185, 129, 0.3)"
                                  }}
                                >
                                  <span>{loading ? "⚡" : "🚀"}</span>
                                  {loading ? "Building Code..." : "Execute This Plan (कोड निष्पादित करें)"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setInstruction(m.consultation.suggestedInstruction || "");
                                    setTargetFile(m.consultation.targetFile || "");
                                  }}
                                  style={{
                                    background: "#1c1917",
                                    color: "#fef08a",
                                    border: "1px solid #44403c",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    fontWeight: "700",
                                    fontSize: "0.78rem",
                                    cursor: "pointer"
                                  }}
                                >
                                  ✏️ Tweak / Alter Plan
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRequestMarketQuote(m.consultation.suggestedInstruction || m.consultation.actionPlan)}
                                  style={{
                                    background: "linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(245,158,11,0.2) 100%)",
                                    color: "#fef08a",
                                    border: "1px solid #d4af37",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    fontWeight: "800",
                                    fontSize: "0.78rem",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                >
                                  📊 Market Rate &amp; Feasibility Report
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : m.marketQuote ? (
                          <div style={{ background: "#0B0F19", border: "1px solid #D4AF37", borderRadius: "12px", padding: "16px", color: "#F8FAFC", maxWidth: "600px" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(212, 175, 55, 0.15)", border: "1px solid rgba(212, 175, 55, 0.35)", padding: "3px 10px", borderRadius: "999px", fontSize: "0.72rem", color: "#FEF08A", fontWeight: "800", marginBottom: "8px" }}>
                              <span>🏛️</span> {m.marketQuote.formalGreeting} • MARKET FEASIBILITY REPORT
                            </div>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#FFFFFF", margin: "0 0 4px 0" }}>
                              {m.marketQuote.proposedApp}
                            </h3>
                            <p style={{ color: "#94A3B8", fontSize: "0.8rem", margin: "0 0 12px 0", lineHeight: 1.4 }}>
                              {m.marketQuote.scopeSummary}
                            </p>

                            {/* Price Comparison Block */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#050811", border: "1px solid #1E293B", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
                              <div>
                                <div style={{ fontSize: "0.72rem", color: "#64748B", textTransform: "uppercase", fontWeight: "700" }}>Traditional Agencies:</div>
                                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#94A3B8", textDecoration: m.marketQuote.allowDiscount ? "line-through" : "none" }}>
                                  ₹{m.marketQuote.pricing.marketStandardPrice.toLocaleString("en-IN")}
                                </div>
                                <div style={{ fontSize: "0.68rem", color: "#64748B" }}>6-8 Weeks Delivery</div>
                              </div>
                              <div>
                                <div style={{ fontSize: "0.72rem", color: "#34D399", textTransform: "uppercase", fontWeight: "800" }}>GARUDA Sovereign Rate:</div>
                                <div style={{ fontSize: "1.25rem", fontWeight: "900", color: "#FEF08A" }}>
                                  ₹{m.marketQuote.pricing.garudaStandardPrice.toLocaleString("en-IN")}
                                </div>
                                <div style={{ fontSize: "0.68rem", color: m.marketQuote.allowDiscount ? "#34D399" : "#F59E0B", fontWeight: "700" }}>
                                  {m.marketQuote.allowDiscount ? "🔥 30% Efficiency Discount Applied" : "🔒 Baseline Resource Tier (No Discount)"}
                                </div>
                              </div>
                            </div>

                            {/* Governance & Upfront Options */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                              <div style={{ background: "#070D18", border: "1px solid #1E293B", borderRadius: "6px", padding: "10px" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#38BDF8" }}>50/50 Milestone Plan</div>
                                <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#FFFFFF", marginTop: "2px" }}>
                                  Kickoff: ₹{m.marketQuote.pricing.milestonePlan.kickoff50.toLocaleString("en-IN")}
                                </div>
                                <div style={{ fontSize: "0.68rem", color: "#94A3B8", marginTop: "2px" }}>50% strictly on verified delivery</div>
                              </div>
                              <div style={{ background: "#070D18", border: "1px solid #10B981", borderRadius: "6px", padding: "10px" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#34D399" }}>100% Upfront VIP Bonus</div>
                                <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#FEF08A", marginTop: "2px" }}>
                                  ₹{m.marketQuote.pricing.upfrontPlan.price.toLocaleString("en-IN")}
                                </div>
                                <div style={{ fontSize: "0.68rem", color: "#34D399", marginTop: "2px" }}>
                                  {m.marketQuote.allowDiscount ? "Extra 5% Principal OFF (Total 35% Savings)" : "Full priority allocation"}
                                </div>
                              </div>
                            </div>

                            {/* Free Inclusions */}
                            <div style={{ background: "#050811", borderRadius: "6px", padding: "8px 10px", marginBottom: "12px", border: "1px solid #1E293B" }}>
                              <div style={{ fontSize: "0.7rem", color: "#D4AF37", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>🎁 FREE BUILT-IN SOVEREIGN VALUE:</div>
                              <div style={{ fontSize: "0.72rem", color: "#CBD5E1", display: "flex", flexDirection: "column", gap: "2px" }}>
                                {m.marketQuote.freeValueAdditions.map((item, i) => (
                                  <div key={i}>✓ {item}</div>
                                ))}
                              </div>
                            </div>

                            {/* Sasti vs Premium Audit Toggle */}
                            <div style={{ marginBottom: "12px" }}>
                              <button
                                type="button"
                                onClick={() => setShowComparisonFor(showComparisonFor === m.id ? null : m.id)}
                                style={{ background: "transparent", border: "none", color: "#38BDF8", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                              >
                                {showComparisonFor === m.id ? "▲ Sasti vs Premium vs GARUDA Audit Chhupayein" : "▼ Sasti Website vs Premium vs GARUDA Audit Dekhein"}
                              </button>
                              {showComparisonFor === m.id && (
                                <div style={{ marginTop: "8px", background: "#050811", border: "1px solid #1E293B", borderRadius: "6px", padding: "8px", fontSize: "0.72rem", overflowX: "auto" }}>
                                  {m.marketQuote.technicalComparison.map((comp, idx) => (
                                    <div key={idx} style={{ padding: "6px 0", borderBottom: "1px solid #141D2F" }}>
                                      <div style={{ color: "#FEF08A", fontWeight: "700" }}>{comp.parameter}</div>
                                      <div style={{ color: "#F87171" }}>❌ Sasti Site: {comp.sastiSite}</div>
                                      <div style={{ color: "#94A3B8" }}>🏢 Agency Build: {comp.premiumAgency}</div>
                                      <div style={{ color: "#34D399", fontWeight: "700" }}>🦅 GARUDA Sovereign: {comp.garudaSovereign}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Interactive Negotiation & Counter-Offer Box */}
                            <div style={{ background: "#0E1526", border: "1px solid #3730A3", borderRadius: "8px", padding: "10px" }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#A5B4FC", marginBottom: "4px" }}>
                                🤝 Budget Negotiation &amp; Counter-Offer:
                              </div>
                              <div style={{ fontSize: "0.7rem", color: "#94A3B8", marginBottom: "8px" }}>
                                GARUDA rate client-friendly aur negotiable hai. Apna budget propose karein:
                              </div>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <input
                                  type="text"
                                  placeholder="e.g. 50000"
                                  value={counterOffers[m.id] || ""}
                                  onChange={(e) => setCounterOffers({ ...counterOffers, [m.id]: e.target.value })}
                                  style={{ flex: 1, background: "#050811", border: "1px solid #334155", borderRadius: "4px", padding: "6px 10px", color: "#fff", fontSize: "0.8rem" }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleNegotiateQuote(m.marketQuote, counterOffers[m.id])}
                                  style={{ background: "#6366F1", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "800", cursor: "pointer" }}
                                >
                                  Negotiate
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ background: "#181511", color: "#fef08a", padding: "10px 14px", borderRadius: "12px 12px 12px 2px", fontSize: "0.88rem", lineHeight: 1.5, border: "1px solid rgba(212, 175, 55, 0.25)" }}>
                            {m.text}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isConsulting && (
                  <div style={{ alignSelf: "flex-start", padding: "10px 14px", background: "#181511", borderRadius: "10px", border: "1px solid #d4af37", color: "#fef08a", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ animation: "spin 1s linear infinite" }}>⚙️</span> Pawan is analyzing requirements and structuring recommendations...
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            )}

            {/* Voice Status Alert */}
            {voiceStatus && (
              <div style={{ marginBottom: "0.8rem", padding: "8px 12px", background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.4)", borderRadius: "6px", fontSize: "0.8rem", color: "#fef08a", fontWeight: "700" }}>
                {voiceStatus}
              </div>
            )}

            {/* Hidden Attachment File Input (Camera & PDF picker) */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              capture="environment"
              style={{ display: "none" }}
              onChange={handleAttachmentSelect}
            />

            {/* Attachment Preview Chip (If Selected) */}
            {activeAttachment && (
              <div style={{ marginBottom: "8px", padding: "8px 12px", background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.35)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {activeAttachment.isImage ? (
                    <img src={activeAttachment.data} alt="thumb" style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "4px" }} />
                  ) : (
                    <span style={{ fontSize: "1.2rem" }}>📄</span>
                  )}
                  <div style={{ fontSize: "0.8rem", color: "#e2e8f0" }}>
                    <strong>{activeAttachment.name}</strong> <span style={{ color: "#94a3b8" }}>({activeAttachment.size})</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontWeight: "800", fontSize: "0.85rem" }}
                >
                  ✕ Remove
                </button>
              </div>
            )}

            {/* Input Textarea & Smart Action Bar */}
            <form onSubmit={studioMode === "discuss" ? (e) => { e.preventDefault(); handleConsult(); } : handleExecute}>
              <div style={{ position: "relative", marginBottom: "0.8rem" }}>
                <textarea
                  rows="3"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (studioMode === "discuss") {
                        handleConsult();
                      } else {
                        handleExecute();
                      }
                    }
                  }}
                  placeholder={
                    studioMode === "discuss"
                      ? "Pawan se requirement discuss karein ya photo/PDF upload karke sujhav maangein (jaise: 'Client ko accounts sell karne ke liye app chahiye, batao kya-kya zaroori hai')..."
                      : "Direct coding task describe karein (e.g. 'Add a trade discount toggle to cloth-gst.html')..."
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#030201",
                    border: "1px solid rgba(212, 175, 55, 0.35)",
                    borderRadius: "10px",
                    padding: "14px",
                    color: "#ffffff",
                    fontSize: "0.94rem",
                    resize: "vertical",
                    outline: "none",
                    lineHeight: 1.5,
                    fontFamily: "inherit"
                  }}
                />
              </div>

              {/* Action Bar (Camera, Voice, File, Send) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.8rem" }}>
                
                {/* Left: Camera/Attachment + Voice Mic + Target File */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload photo from camera or PDF document"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: activeAttachment ? "rgba(56, 189, 248, 0.2)" : "#14120c",
                      border: `1px solid ${activeAttachment ? "#38bdf8" : "#292524"}`,
                      color: activeAttachment ? "#7dd3fc" : "#cbd5e1",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    <span>📷</span> Camera / PDF
                  </button>

                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: isListening ? "#b91c1c" : "#14120c",
                      border: `1px solid ${isListening ? "#ef4444" : "rgba(212, 175, 55, 0.4)"}`,
                      color: isListening ? "#ffffff" : "#fbbf24",
                      fontSize: "0.8rem",
                      fontWeight: "800",
                      cursor: "pointer"
                    }}
                  >
                    <span>{isListening ? "⏹️" : "🎙️"}</span>
                    {isListening ? "Listening..." : "Voice Mic"}
                  </button>

                  {/* Target File (Optional) */}
                  <input
                    type="text"
                    value={targetFile}
                    onChange={(e) => setTargetFile(e.target.value)}
                    placeholder={activeProject?.file ? `Editing: ${activeProject.file}` : "Target file (optional)"}
                    style={{
                      background: "#030201",
                      border: "1px solid #292524",
                      borderRadius: "6px",
                      padding: "7px 10px",
                      color: "#f8fafc",
                      fontSize: "0.78rem",
                      outline: "none",
                      fontFamily: "ui-monospace, monospace",
                      width: "160px"
                    }}
                  />
                </div>

                {/* Right: Submit Button (Discuss / Run) */}
                <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  {studioMode === "discuss" ? (
                    <button
                      type="submit"
                      disabled={isConsulting || (!instruction.trim() && !activeAttachment)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "9px 20px",
                        background: isConsulting ? "#292524" : "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)",
                        color: "#050402",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "900",
                        fontSize: "0.85rem",
                        cursor: isConsulting ? "wait" : "pointer",
                        boxShadow: "0 2px 15px rgba(212, 175, 55, 0.3)",
                        letterSpacing: "0.02em"
                      }}
                    >
                      <span>{isConsulting ? "⚙️" : "💬"}</span>
                      {isConsulting ? "Analyzing..." : "Ask Pawan / Plan ↵"}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || !instruction.trim()}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "9px 20px",
                        background: loading ? "#292524" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "900",
                        fontSize: "0.85rem",
                        cursor: loading ? "wait" : "pointer",
                        boxShadow: "0 2px 15px rgba(16, 185, 129, 0.3)",
                        letterSpacing: "0.02em"
                      }}
                    >
                      <span>{loading ? "⚡" : "🚀"}</span>
                      {loading ? "Synthesizing..." : "Run Code ↵"}
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* Clean Distraction-Free Status Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.8rem", paddingTop: "0.6rem", borderTop: "1px solid #14120c", fontSize: "0.72rem", color: "#78716c", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ color: "#d4af37" }}>⚡ Pro-Tip:</span>
                <span>Boliye ya type kijiye — Pawan architecture plan karega, syntax verify karega aur phone par live test dega.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAppsFleet(true)}
                style={{ background: "transparent", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "0.72rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <span>📱 Apps Built by Pawan</span>
                <span style={{ textDecoration: "underline" }}>View Fleet ➔</span>
              </button>
            </div>
          </div>

          {/* Execution Error Banner */}
          {error && (
            <div style={{ background: "rgba(185, 28, 28, 0.15)", border: "1px solid #dc2626", padding: "1rem", borderRadius: "8px", color: "#fca5a5", fontSize: "0.85rem" }}>
              <strong>Execution Error:</strong> {error}
            </div>
          )}

          {/* ================================================================= */}
          {/* THE REAL RESULT VIEWER: CODE, LIVE PREVIEW, MOBILE DEBUGGER       */}
          {/* ================================================================= */}
          {result && (
            <div style={{ background: "#080705", border: "2px solid #d4af37", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 15px 40px rgba(0,0,0,0.8)" }}>
              {/* Result Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.8rem", borderBottom: "1px solid rgba(212, 175, 55, 0.2)", paddingBottom: "0.8rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", border: "1px solid #10b981", display: "grid", placeItems: "center", fontSize: "1.1rem" }}>
                    ✓
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#75f4ab", fontWeight: "900", letterSpacing: "-0.01em" }}>
                      TASK COMPLETED • CODE VERIFIED
                    </h3>
                    <div style={{ fontSize: "0.75rem", color: "#d4af37", marginTop: "2px", fontFamily: "monospace" }}>
                      Target: <strong>{result.file}</strong> • Task ID: {result.taskId}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleLaunchLiveApp}
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#ffffff",
                      border: "none",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      fontWeight: "800",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      boxShadow: "0 0 15px rgba(16, 185, 129, 0.3)"
                    }}
                  >
                    <span>📲</span> Test Live on Mobile ➔
                  </button>

                  <button
                    type="button"
                    disabled={apkBuilding}
                    onClick={handleBuildApk}
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      color: "#ffffff",
                      border: "none",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      fontWeight: "800",
                      fontSize: "0.78rem",
                      cursor: apkBuilding ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      boxShadow: "0 0 15px rgba(99, 102, 241, 0.3)"
                    }}
                  >
                    <span>📦</span> {apkBuilding ? "Packaging APK..." : "Download APK / Package"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    style={{
                      background: codeCopied ? "#10b981" : "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)",
                      color: "#000",
                      border: "none",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      fontWeight: "800",
                      fontSize: "0.78rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem"
                    }}
                  >
                    <span>{codeCopied ? "✓" : "📋"}</span>
                    {codeCopied ? "Copied!" : "Copy Code"}
                  </button>

                  <span style={{ background: "#14120c", border: "1px solid rgba(212,175,55,0.3)", color: "#fef08a", padding: "5px 10px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: "700" }}>
                    Self-Heal Cycles: {result.healCyclesRun}
                  </span>
                </div>
              </div>

              {/* Summary Note */}
              {result.summary && (
                <div style={{ background: "rgba(212, 175, 55, 0.06)", border: "1px solid rgba(212, 175, 55, 0.2)", padding: "10px 14px", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.82rem", color: "#fef08a", lineHeight: 1.5 }}>
                  <strong>💡 Architectural Summary:</strong> {result.summary}
                </div>
              )}

              {/* Result Tabs Navigation */}
              <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", borderBottom: "1px solid #14120c", paddingBottom: "0.4rem", overflowX: "auto" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("code")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "6px",
                    border: activeTab === "code" ? "1px solid #d4af37" : "1px solid transparent",
                    background: activeTab === "code" ? "rgba(212, 175, 55, 0.15)" : "transparent",
                    color: activeTab === "code" ? "#fef08a" : "#94a3b8",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  📜 Code Viewer
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "6px",
                    border: activeTab === "preview" ? "1px solid #10b981" : "1px solid transparent",
                    background: activeTab === "preview" ? "rgba(16, 185, 129, 0.15)" : "transparent",
                    color: activeTab === "preview" ? "#6ee7b7" : "#94a3b8",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  👁️ In-Studio Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("mobile");
                    fetchMobileStatus();
                  }}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "6px",
                    border: activeTab === "mobile" ? "1px solid #38bdf8" : "1px solid transparent",
                    background: activeTab === "mobile" ? "rgba(56, 189, 248, 0.15)" : "transparent",
                    color: activeTab === "mobile" ? "#7dd3fc" : "#94a3b8",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  📱 Mobile Debugger
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("trajectory")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "6px",
                    border: activeTab === "trajectory" ? "1px solid #d4af37" : "1px solid transparent",
                    background: activeTab === "trajectory" ? "rgba(212, 175, 55, 0.15)" : "transparent",
                    color: activeTab === "trajectory" ? "#fef08a" : "#94a3b8",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  ⚡ Execution Steps
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("proof")}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "6px",
                    border: activeTab === "proof" ? "1px solid #d4af37" : "1px solid transparent",
                    background: activeTab === "proof" ? "rgba(212, 175, 55, 0.15)" : "transparent",
                    color: activeTab === "proof" ? "#fef08a" : "#94a3b8",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  🔒 SHA-256 Proof
                </button>
              </div>

              {/* TAB 1: CODE VIEWER */}
              {activeTab === "code" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#110f0b", padding: "8px 12px", borderTopLeftRadius: "6px", borderTopRightRadius: "6px", border: "1px solid #24201a", borderBottom: "none" }}>
                    <span style={{ fontSize: "0.75rem", color: "#d4af37", fontFamily: "ui-monospace, monospace", fontWeight: "700" }}>
                      📁 {result.file}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#a8a29e" }}>
                      {result.code ? `${result.code.split("\n").length} Lines` : "File Updated"}
                    </span>
                  </div>
                  <pre style={{ margin: 0, padding: "14px", background: "#030201", border: "1px solid #24201a", borderBottomLeftRadius: "6px", borderBottomRightRadius: "6px", color: "#f8fafc", fontSize: "0.82rem", fontFamily: "ui-monospace, Consolas, Monaco, monospace", lineHeight: 1.5, overflowX: "auto", maxHeight: "440px", whiteSpace: "pre" }}>
                    <code>{result.code || "// Code patched directly to " + result.file + "\n// Inspect file in editor."}</code>
                  </pre>
                </div>
              )}

              {/* TAB 2: LIVE APP PREVIEW (IN-STUDIO SIMULATOR) */}
              {activeTab === "preview" && (
                <div style={{ background: "#030201", border: "1px solid #24201a", borderRadius: "8px", padding: "0.8rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "#d4af37", fontWeight: "700" }}>Simulator:</span>
                      <button
                        type="button"
                        onClick={() => setPreviewViewport("desktop")}
                        style={{ background: previewViewport === "desktop" ? "rgba(212,175,55,0.2)" : "#14120c", border: "1px solid #38332b", color: previewViewport === "desktop" ? "#fef08a" : "#94a3b8", padding: "3px 8px", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "700" }}
                      >
                        🖥️ Desktop (Full)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewViewport("mobile")}
                        style={{ background: previewViewport === "mobile" ? "rgba(56,189,248,0.2)" : "#14120c", border: "1px solid #38332b", color: previewViewport === "mobile" ? "#7dd3fc" : "#94a3b8", padding: "3px 8px", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "700" }}
                      >
                        📱 Mobile (375px)
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => setPreviewKey((k) => k + 1)}
                        style={{ background: "#14120c", border: "1px solid #38332b", color: "#cbd5e1", padding: "3px 8px", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer" }}
                      >
                        🔄 Reload
                      </button>
                      <button
                        type="button"
                        onClick={handleLaunchLiveApp}
                        style={{ background: "rgba(16,185,129,0.15)", border: "1px solid #10b981", color: "#6ee7b7", padding: "3px 8px", borderRadius: "4px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "700" }}
                      >
                        🔗 Open Fullscreen
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", background: "#080705", padding: "0.8rem", borderRadius: "6px", border: "1px solid #1a1712", minHeight: "440px" }}>
                    <iframe
                      key={previewKey}
                      srcDoc={result?.code || activeProject?.code || "<!DOCTYPE html><html><body style='background:#030712;color:#fbbf24;display:grid;place-items:center;height:100vh;font-family:sans-serif;margin:0;'><div style='text-align:center;'><h3>GARUDA Live Studio</h3><p style='color:#94a3b8;font-size:0.85rem;'>Code banne ke baad app ya game yahan live chalega.</p></div></body></html>"}
                      title="Live App Preview"
                      sandbox="allow-scripts allow-modals allow-pointer-lock allow-same-origin"
                      style={{
                        width: previewViewport === "mobile" ? "375px" : "100%",
                        height: "500px",
                        border: previewViewport === "mobile" ? "6px solid #334155" : "1px solid #1e293b",
                        borderRadius: previewViewport === "mobile" ? "20px" : "4px",
                        background: "#030712"
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: MOBILE DEBUGGER (ADB & WI-FI REMOTE LINK) */}
              {activeTab === "mobile" && (
                <div style={{ background: "#030201", border: "1px solid #24201a", borderRadius: "8px", padding: "1.2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.6rem", borderBottom: "1px solid #14120c", paddingBottom: "0.6rem" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.92rem", color: "#38bdf8", fontWeight: "800" }}>
                        📱 Mobile Device Debugger & Remote Bridge
                      </h4>
                      <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#94a3b8" }}>
                        Plug your phone via USB or connect to same Wi-Fi to test and debug live on your mobile.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchMobileStatus}
                      disabled={mobileLoading}
                      style={{ background: "#14120c", border: "1px solid #38bdf8", color: "#7dd3fc", padding: "5px 12px", borderRadius: "5px", fontSize: "0.72rem", fontWeight: "800", cursor: "pointer" }}
                    >
                      {mobileLoading ? "Checking..." : "🔄 Refresh Devices"}
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.8rem", marginBottom: "1rem" }}>
                    
                    {/* USB Cable Status */}
                    <div style={{ background: "#080a10", border: `1px solid ${mobileStatus?.connected ? "#10b981" : "#24201a"}`, borderRadius: "8px", padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>{mobileStatus?.connected ? "🟢" : "🔌"}</span>
                        <div>
                          <div style={{ fontSize: "0.8rem", fontWeight: "800", color: mobileStatus?.connected ? "#34d399" : "#cbd5e1" }}>
                            {mobileStatus?.connected ? "USB Phone Connected!" : "No USB Device Detected"}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                            {mobileStatus?.connected ? `Model: ${mobileStatus.devices[0]?.model || mobileStatus.devices[0]?.id}` : "Plug phone via USB cable and enable 'USB Debugging'"}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleMobileReverse}
                        style={{
                          width: "100%",
                          marginTop: "0.6rem",
                          background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                          color: "#ffffff",
                          border: "none",
                          padding: "8px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: "800",
                          cursor: "pointer"
                        }}
                      >
                        ⚡ Activate Phone Device Bridge
                      </button>

                      {mobileReverseMsg && (
                        <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "#fef08a", background: "rgba(245,158,11,0.1)", padding: "5px 8px", borderRadius: "4px" }}>
                          {mobileReverseMsg}
                        </div>
                      )}
                    </div>

                    {/* Mobile Mirror Link */}
                    <div style={{ background: "#080a10", border: "1px solid #24201a", borderRadius: "8px", padding: "1rem" }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: "800", color: "#fef08a", marginBottom: "0.2rem" }}>
                        📶 Mobile Device Mirror Link
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: "0.6rem" }}>
                        Open this link on your phone's browser for instant live testing:
                      </div>

                      <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                        <input
                          type="text"
                          readOnly
                          value={mobileStatus?.wifiUrl || (typeof window !== "undefined" ? window.location.origin : "https://www.garudaos.in")}
                          style={{ flex: 1, background: "#02040a", border: "1px solid #334155", borderRadius: "4px", padding: "6px 8px", color: "#38bdf8", fontSize: "0.75rem", fontFamily: "monospace" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const url = mobileStatus?.wifiUrl || window.location.origin;
                            navigator.clipboard.writeText(url);
                            alert("Mobile mirror URL copied!");
                          }}
                          style={{ background: "#14120c", border: "1px solid #38bdf8", color: "#7dd3fc", padding: "6px 10px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "700", cursor: "pointer" }}
                        >
                          Copy
                        </button>
                      </div>

                      <div style={{ marginTop: "0.8rem", fontSize: "0.68rem", color: "#a8a29e" }}>
                        💡 Chrome DevTools: Open <code>chrome://inspect/#devices</code> in laptop Chrome to inspect phone DOM & console.
                      </div>
                    </div>

                  </div>

                  {/* Mobile Logs */}
                  <div style={{ borderTop: "1px solid #14120c", paddingTop: "0.8rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#d4af37" }}>
                        ADB Error Logcat Stream:
                      </span>
                      <button
                        type="button"
                        onClick={fetchMobileLogs}
                        style={{ background: "#14120c", border: "1px solid #38332b", color: "#cbd5e1", padding: "3px 8px", borderRadius: "4px", fontSize: "0.7rem", cursor: "pointer" }}
                      >
                        Fetch Phone Logs
                      </button>
                    </div>

                    <pre style={{ margin: 0, padding: "8px", background: "#02040a", border: "1px solid #1a1712", borderRadius: "4px", color: "#f87171", fontSize: "0.7rem", fontFamily: "monospace", maxHeight: "120px", overflowY: "auto", whiteSpace: "pre-wrap" }}>
                      {mobileLogs || "// Click 'Fetch Phone Logs' to inspect device error output."}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 4: TRAJECTORY */}
              {activeTab === "trajectory" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {result.trajectory?.map((t, idx) => (
                    <div key={idx} style={{ background: "#110f0b", padding: "8px 12px", borderRadius: "6px", border: "1px solid #24201a", fontSize: "0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#d4af37", fontWeight: "800" }}>
                        Step {idx + 1}: {t.step}
                      </span>
                      <span style={{ color: "#e7e5e4" }}>
                        {t.summary || t.instruction || t.file || "Completed"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5: PROOF */}
              {activeTab === "proof" && (
                <div style={{ background: "#030201", padding: "1rem", borderRadius: "6px", border: "1px solid #24201a" }}>
                  <div style={{ fontSize: "0.75rem", color: "#d4af37", fontWeight: "800", marginBottom: "0.3rem" }}>
                    Cryptographic Integrity Proof (SHA-256):
                  </div>
                  <code style={{ fontSize: "0.8rem", color: "#75f4ab", wordBreak: "break-all", fontFamily: "monospace" }}>
                    {result.sha256}
                  </code>
                  <div style={{ marginTop: "0.8rem", fontSize: "0.72rem", color: "#a8a29e", lineHeight: 1.5 }}>
                    This cryptographic digest certifies that code was written to local disk and passed syntax verification.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit History Log (Collapsible for Clean Distraction-Free Console) */}
          <div style={{ background: "#080705", border: "1px solid rgba(212, 175, 55, 0.2)", borderRadius: "12px", padding: "1rem 1.4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#d4af37", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  📜 Execution Audit Trail
                </span>
                <span style={{ background: "#1c1917", color: "#a8a29e", padding: "2px 8px", borderRadius: "999px", fontSize: "0.68rem" }}>
                  {history.length} runs recorded
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={fetchHistory}
                  style={{ background: "#14120c", border: "1px solid rgba(212, 175, 55, 0.3)", color: "#fef08a", padding: "4px 10px", borderRadius: "4px", fontSize: "0.7rem", cursor: "pointer", fontWeight: "700" }}
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuditTrail(!showAuditTrail)}
                  style={{ background: "#14120c", border: "1px solid #334155", color: "#cbd5e1", padding: "4px 10px", borderRadius: "4px", fontSize: "0.7rem", cursor: "pointer", fontWeight: "700" }}
                >
                  {showAuditTrail ? "Hide Log ▲" : "Inspect Log ▼"}
                </button>
              </div>
            </div>

            {showAuditTrail && (
              <div style={{ marginTop: "1rem", borderTop: "1px solid #1c1917", paddingTop: "0.8rem" }}>
                {history.length === 0 ? (
                  <div style={{ color: "#78716c", fontSize: "0.8rem", textAlign: "center", padding: "1rem" }}>
                    No execution audit logs found. Run your first task above.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {history.map((item, idx) => (
                      <div key={idx} style={{ background: "#030201", border: "1px solid #1a1712", borderRadius: "6px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.4rem" }}>
                        <div>
                          <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "#ffffff" }}>
                            {item.file || item.instruction || item.taskId}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "#a8a29e", marginTop: "2px" }}>
                            {item.timestamp ? new Date(item.timestamp).toLocaleString("en-IN") : "Recent"} • {item.summary || "Task executed"}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: "800", color: item.success ? "#34d399" : "#f87171", background: item.success ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", padding: "2px 6px", borderRadius: "4px" }}>
                            {item.success ? "✓ Passed" : "✕ Failed"}
                          </span>
                          {item.sha256 && (
                            <span style={{ fontSize: "0.68rem", color: "#78716c", fontFamily: "monospace" }}>
                              {item.sha256.substring(0, 10)}...
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* ================================================================= */}
        {/* 📱 APPS MADE BY PAWAN • SOVEREIGN APPLICATION FLEET DRAWER        */}
        {/* ================================================================= */}
        {showAppsFleet && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 99999, display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: "100%", maxWidth: "600px", height: "100%", background: "#080705", borderLeft: "2px solid #d4af37", boxShadow: "-20px 0 50px rgba(0,0,0,0.9)", display: "flex", flexDirection: "column", overflowY: "auto", padding: "1.8rem" }}>
              
              {/* Drawer Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(212,175,55,0.25)", paddingBottom: "1.2rem", marginBottom: "1.5rem" }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: "999px", padding: "2px 10px", fontSize: "0.7rem", color: "#fef08a", fontWeight: "800", marginBottom: "0.4rem" }}>
                    <span>🦅</span> GARUDA PAWAN FLEET
                  </div>
                  <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "900", color: "#ffffff", letterSpacing: "-0.01em" }}>
                    Apps Built by PAWAN
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#a8a29e" }}>
                    Autonomous ReAct synthesis • 1-Tap Android PWA/APK • Hot OTA Self-Healing
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAppsFleet(false)}
                  style={{ background: "#1c1917", border: "1px solid #44403c", color: "#e7e5e4", width: "32px", height: "32px", borderRadius: "8px", fontSize: "1rem", cursor: "pointer", display: "grid", placeItems: "center" }}
                >
                  ✕
                </button>
              </div>

              {/* Active Session App (if any) */}
              {activeProject && (
                <div style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(3,105,161,0.15) 100%)", border: "1px solid #38bdf8", borderRadius: "10px", padding: "1rem", marginBottom: "1.2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      ● Active Project in Studio
                    </span>
                    <span style={{ background: "#0284c7", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "0.68rem", fontWeight: "800" }}>
                      v{activeProject.version}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#ffffff", marginBottom: "0.4rem" }}>
                    {activeProject.file}
                  </div>
                  <p style={{ margin: "0 0 0.8rem", fontSize: "0.75rem", color: "#cbd5e1", lineHeight: 1.4 }}>
                    {activeProject.summary || "Synthesized application currently in local session memory."}
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={handleLaunchLiveApp}
                      style={{ flex: 1, background: "#0284c7", color: "#fff", border: "none", padding: "8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800", cursor: "pointer" }}
                    >
                      🚀 Test Live on Mobile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAppsFleet(false);
                        handleBuildApk();
                      }}
                      style={{ flex: 1, background: "rgba(212,175,55,0.2)", border: "1px solid #d4af37", color: "#fef08a", padding: "8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800", cursor: "pointer" }}
                    >
                      📦 1-Tap APK Package
                    </button>
                  </div>
                </div>
              )}

              {/* Fleet List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                
                {/* App 1: Cloth Wholesale MIS */}
                <div style={{ background: "#0d0b08", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "10px", padding: "1.1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>🧵</span>
                        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: "#fef08a" }}>
                          Cloth Wholesale 2-Device Lock GST MIS
                        </h3>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>
                        Wholesale Textile B2B • Security Hardened • PWA/APK Live
                      </div>
                    </div>
                    <span style={{ background: "rgba(16,185,129,0.15)", border: "1px solid #10b981", color: "#6ee7b7", padding: "2px 8px", borderRadius: "4px", fontSize: "0.68rem", fontWeight: "800" }}>
                      Production Ready
                    </span>
                  </div>
                  <p style={{ margin: "0 0 0.8rem", fontSize: "0.75rem", color: "#d6d3d1", lineHeight: 1.5 }}>
                    Real-time saree/fabric invoice generation, wholesale slab calculations, multi-rate GST, printable thermal receipts, and 2-device cryptographic hardware binding.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <a
                      href="/cloth-gst.html"
                      target="_blank"
                      rel="noreferrer"
                      style={{ flex: "1 1 140px", textAlign: "center", background: "#10b981", color: "#000", textDecoration: "none", padding: "7px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800" }}
                    >
                      🚀 Launch Web App
                    </a>
                    <a
                      href="/apps/cloth-gst-calculator/"
                      target="_blank"
                      rel="noreferrer"
                      style={{ flex: "1 1 140px", textAlign: "center", background: "#14120c", border: "1px solid #d4af37", color: "#fef08a", textDecoration: "none", padding: "7px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800" }}
                    >
                      📲 1-Tap Mobile PWA/APK
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAppsFleet(false);
                        setStudioMode("discuss");
                        handleConsult("Cloth wholesale business ke liye 2-device lock wala MIS app banana hai. Slabs aur invoice breakdown ki recommendations do.");
                      }}
                      style={{ background: "#14120c", border: "1px solid #334155", color: "#cbd5e1", padding: "7px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}
                    >
                      ✏️ Alter in Pawan
                    </button>
                  </div>
                </div>

                {/* App 2: Field Sourcing MIS */}
                <div style={{ background: "#0d0b08", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "10px", padding: "1.1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>💼</span>
                        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: "#fef08a" }}>
                          Field Agent Account Sourcing MIS
                        </h3>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>
                        FinTech & Agent Workforce • Anti-Fraud Architecture
                      </div>
                    </div>
                    <span style={{ background: "rgba(99,102,241,0.15)", border: "1px solid #6366f1", color: "#a5b4fc", padding: "2px 8px", borderRadius: "4px", fontSize: "0.68rem", fontWeight: "800" }}>
                      Architecture Spec
                    </span>
                  </div>
                  <p style={{ margin: "0 0 0.8rem", fontSize: "0.75rem", color: "#d6d3d1", lineHeight: 1.5 }}>
                    Field agent lead intake with anti-fraud IMEI lock, slab-based 10%-40% daily payout calculator, customer KYC verification, and encrypted daily audit ledger.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAppsFleet(false);
                        setStudioMode("discuss");
                        handleConsult("Client ko accounts selling ke liye app chahiye jisme ladke account layenge aur per-day % commission milega. Iska best structure aur anti-fraud logic suggest karo.");
                      }}
                      style={{ flex: 1, background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)", color: "#000", border: "none", padding: "7px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800", cursor: "pointer" }}
                    >
                      💬 Discuss & Synthesize in Studio
                    </button>
                  </div>
                </div>

                {/* App 3: GARUDA DOST Rozgar Portal */}
                <div style={{ background: "#0d0b08", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "10px", padding: "1.1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "1.2rem" }}>🌱</span>
                        <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: "#fef08a" }}>
                          GARUDA DOST • Zero-Travel Rozgar Gateway
                        </h3>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>
                        Village Youth & Community Livelihood • Direct UPI
                      </div>
                    </div>
                    <span style={{ background: "rgba(16,185,129,0.15)", border: "1px solid #10b981", color: "#6ee7b7", padding: "2px 8px", borderRadius: "4px", fontSize: "0.68rem", fontWeight: "800" }}>
                      Live Gateway
                    </span>
                  </div>
                  <p style={{ margin: "0 0 0.8rem", fontSize: "0.75rem", color: "#d6d3d1", lineHeight: 1.5 }}>
                    Zero-advance public enrollment platform for rural youth, housewives, and zero-experience partners. Earn 10%-40% transparent commissions on software leads.
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <a
                      href="/dost"
                      target="_blank"
                      rel="noreferrer"
                      style={{ flex: 1, textAlign: "center", background: "#10b981", color: "#000", textDecoration: "none", padding: "7px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800" }}
                    >
                      🚀 Open Live Portal (/dost)
                    </a>
                  </div>
                </div>

              </div>

              {/* Drawer Footer Notice */}
              <div style={{ marginTop: "auto", paddingTop: "1.5rem", borderTop: "1px solid rgba(212,175,55,0.15)", fontSize: "0.72rem", color: "#78716c", textAlign: "center" }}>
                🔒 100% Anti-Fabrication Law • Real Code • SHA-256 Verified
              </div>

            </div>
          </div>
        )}

        {/* Commercial Access Gate Modal */}
        {showGateModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "grid", placeItems: "center", zIndex: 1000, padding: "1.5rem" }}>
            <div style={{ background: "#0b0a07", border: "2px solid #d4af37", borderRadius: "16px", maxWidth: "560px", width: "100%", padding: "2rem", boxShadow: "0 20px 50px rgba(0,0,0,0.9)", position: "relative" }}>
              <button
                onClick={() => setShowGateModal(false)}
                style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "#a8a29e", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>

              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "2.4rem", marginBottom: "0.4rem" }}>🦅🔒</div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: "900", color: "#ffffff", margin: "0 0 0.4rem" }}>
                  Unlock GARUDA PAWAN Execution Engine
                </h2>
                <p style={{ fontSize: "0.85rem", color: "#d6d3d1", margin: 0, lineHeight: 1.5 }}>
                  PAWAN executes autonomously on real codebases with closed-loop syntax verification, multi-model synthesis, and cryptographic SHA-256 evidence.
                </p>
              </div>

              {!intakeSubmitted ? (
                <div>
                  <div style={{ background: "rgba(212, 175, 55, 0.1)", border: "1px solid rgba(212, 175, 55, 0.3)", borderRadius: "10px", padding: "1.2rem", marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#fef08a" }}>Option 1: Instant Pilot Execution Token</span>
                      <span style={{ fontSize: "1.1rem", fontWeight: "900", color: "#34d399" }}>₹5,000</span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#cbd5e1", margin: "0 0 1rem 0" }}>
                      Instant activation token for autonomous repo diagnosis, bug fix, and feature synthesis.
                    </p>
                    <a
                      href={PAYMENT_URL}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "block", textAlign: "center", background: "linear-gradient(135deg, #d4af37 0%, #b8860b 100%)", color: "#000", fontWeight: "900", fontSize: "0.85rem", padding: "10px", borderRadius: "8px", textDecoration: "none" }}
                    >
                      Pay ₹5,000 Advance Token via Razorpay
                    </a>
                  </div>

                  <form onSubmit={handleIntakeSubmit}>
                    <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#d4af37", marginBottom: "0.8rem" }}>
                      Option 2: Submit Scoping Request to Founder
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "0.8rem" }}>
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={intakeName}
                        onChange={(e) => setIntakeName(e.target.value)}
                        style={{ background: "#050402", border: "1px solid #333", borderRadius: "6px", padding: "8px 12px", color: "#fff", fontSize: "0.85rem" }}
                      />
                      <input
                        type="text"
                        placeholder="Phone / WhatsApp"
                        value={intakePhone}
                        onChange={(e) => setIntakePhone(e.target.value)}
                        style={{ background: "#050402", border: "1px solid #333", borderRadius: "6px", padding: "8px 12px", color: "#fff", fontSize: "0.85rem" }}
                      />
                    </div>
                    <div style={{ marginBottom: "0.8rem" }}>
                      <input
                        type="email"
                        placeholder="Work Email Address"
                        value={intakeEmail}
                        onChange={(e) => setIntakeEmail(e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", background: "#050402", border: "1px solid #333", borderRadius: "6px", padding: "8px 12px", color: "#fff", fontSize: "0.85rem" }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{ width: "100%", background: "#1c1917", border: "1px solid #44403c", color: "#ffffff", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "700", cursor: "pointer" }}
                    >
                      Submit Scope for Review
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "1.5rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✓</div>
                  <h3 style={{ color: "#34d399", margin: "0 0 0.5rem" }}>Request Transmitted</h3>
                  <p style={{ fontSize: "0.85rem", color: "#cbd5e1", margin: "0 0 1.2rem" }}>
                    Founder Praveen Mahawar's desk has received your request.
                  </p>
                  <button
                    onClick={() => {
                      setShowGateModal(false);
                      setIntakeSubmitted(false);
                    }}
                    style={{ background: "#d4af37", color: "#000", border: "none", padding: "8px 20px", borderRadius: "6px", fontWeight: "800", cursor: "pointer" }}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 📱 PAWAN 1-TAP APK & PWA SUPERPOWER MODAL */}
        {apkModalData && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "1rem" }}>
            <div style={{ background: "#0B0F19", border: "1px solid #D4AF37", borderRadius: "16px", maxWidth: "520px", width: "100%", padding: "1.8rem", color: "#F8FAFC", boxShadow: "0 25px 60px rgba(0,0,0,0.9)", position: "relative" }}>
              <button
                type="button"
                onClick={() => setApkModalData(null)}
                style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", color: "#94A3B8", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>

              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "3px 10px", borderRadius: "999px", background: "rgba(212, 175, 55, 0.15)", border: "1px solid rgba(212, 175, 55, 0.35)", fontSize: "0.72rem", color: "#FEF08A", fontWeight: "800", marginBottom: "0.8rem" }}>
                <span>📱</span> PILLAR 1: PAWAN MOBILE SUPERPOWER
              </div>

              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", margin: "0 0 0.4rem 0", color: "#FFFFFF" }}>
                {apkModalData.appName}
              </h2>
              <p style={{ margin: "0 0 1.2rem 0", color: "#94A3B8", fontSize: "0.82rem", lineHeight: 1.5 }}>
                {apkModalData.message}
              </p>

              {/* QR Code and Quick Install Section */}
              <div style={{ display: "flex", gap: "1.2rem", alignItems: "center", background: "#050811", border: "1px solid #1E293B", borderRadius: "12px", padding: "1rem", marginBottom: "1.2rem", flexWrap: "wrap" }}>
                <div style={{ background: "#FFFFFF", padding: "8px", borderRadius: "8px", display: "inline-block" }}>
                  <img src={apkModalData.qrUrl} alt="Scan to Install" style={{ width: "120px", height: "120px", display: "block" }} />
                </div>
                <div style={{ flex: "1 1 200px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#FEF08A", marginBottom: "4px" }}>
                    📷 Scan with Mobile Camera
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "#94A3B8", lineHeight: 1.4, marginBottom: "10px" }}>
                    Scan QR code with your Android phone to instantly open and install to home screen with 1 tap.
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(apkModalData.previewUrl, "_blank")}
                    style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", color: "#FFFFFF", border: "none", padding: "8px 14px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "800", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <span>🚀</span> Open Mobile PWA
                  </button>
                </div>
              </div>

              {/* Direct Download Actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginBottom: "1.2rem" }}>
                <a
                  href={apkModalData.downloadUrl}
                  download
                  style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", color: "#FFFFFF", padding: "10px 14px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "800", textDecoration: "none", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)" }}
                >
                  <span>📦</span> Download Bundle (.zip)
                </a>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(apkModalData.previewUrl);
                    alert("Mobile link copied: " + apkModalData.previewUrl);
                  }}
                  style={{ background: "#1E293B", color: "#E2E8F0", border: "1px solid #334155", padding: "10px 14px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                >
                  <span>📋</span> Copy Mobile URL
                </button>
              </div>

              {/* Anti-Fabrication SHA-256 Proof */}
              <div style={{ background: "#050811", border: "1px solid #1E293B", borderRadius: "8px", padding: "8px 12px", fontSize: "0.72rem", color: "#64748B", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span style={{ color: "#D4AF37", fontWeight: "700" }}>SHA-256: </span>
                {apkModalData.sha256}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

