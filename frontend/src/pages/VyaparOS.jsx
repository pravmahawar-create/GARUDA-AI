import React, { useState } from "react";
import { 
  FiHome, FiDollarSign, FiUsers, FiTruck, 
  FiShield, FiTrendingDown, FiBriefcase, FiGlobe, 
  FiSearch, FiMenu, FiX, FiLayers, FiAlertCircle 
} from "react-icons/fi";

import ExecutiveCommandCenter from "../features/vyapar/ExecutiveCommandCenter";
import RojgariCollections from "../features/vyapar/RojgariCollections";
import AgentOperations from "../features/vyapar/AgentOperations";
import MilkDistributionOS from "../features/vyapar/MilkDistributionOS";
import MahaRokadReconciliation from "../features/vyapar/MahaRokadReconciliation";
import PardaBoliAuction from "../features/vyapar/PardaBoliAuction";
import DualHotelManagement from "../features/vyapar/DualHotelManagement";
import HotelWebsiteShowcase from "../features/vyapar/HotelWebsiteShowcase";
import { DEMO_CONFIG } from "../features/vyapar/vyaparDemoData";
import "../features/vyapar/vyaparResponsive.css";

export default function VyaparOS() {
  const [activeTab, setActiveTab] = useState("executive");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedHotelForShowcase, setSelectedHotelForShowcase] = useState("hotel1");

  // Switch to public website view
  const handleOpenWebsite = (hotelKey) => {
    setSelectedHotelForShowcase(hotelKey);
    setActiveTab("hotel_showcase");
  };

  // If public hotel showcase is active, show the full public website view
  if (activeTab === "hotel_showcase") {
    return (
      <HotelWebsiteShowcase
        initialHotel={selectedHotelForShowcase}
        onBackToGaddi={() => setActiveTab("hotels")}
      />
    );
  }

  const navItems = [
    { id: "executive", label: "Executive Gaddi", icon: <FiHome size={16} />, badge: "Command" },
    { id: "rojgari", label: "Rojgari Finance", icon: <FiDollarSign size={16} /> },
    { id: "agents", label: "Agent PWA & Float", icon: <FiUsers size={16} /> },
    { id: "milk", label: "Milk OS (100 Staff)", icon: <FiTruck size={16} />, badge: "100 Staff" },
    { id: "maharokad", label: "Maha-Rokad Vault", icon: <FiShield size={16} />, highlight: true },
    { id: "pardaboli", label: "Parda Boli (BC)", icon: <FiTrendingDown size={16} /> },
    { id: "hotels", label: "Dual Hotels PMS", icon: <FiBriefcase size={16} /> },
    { id: "hotel_showcase_tab", label: "Public Hotel Sites", icon: <FiGlobe size={16} /> },
  ];

  const bottomNavItems = [
    { id: "executive", label: "Gaddi", icon: <FiHome size={18} /> },
    { id: "rojgari", label: "Lending", icon: <FiDollarSign size={18} /> },
    { id: "agents", label: "Agent PWA", icon: <FiUsers size={18} /> },
    { id: "milk", label: "Milk 100", icon: <FiTruck size={18} /> },
    { id: "maharokad", label: "Vault", icon: <FiShield size={18} /> },
    { id: "pardaboli", label: "Chit BC", icon: <FiTrendingDown size={18} /> }
  ];

  return (
    <div className="vyapar-container" style={{
      minHeight: "100vh",
      background: "#FAF9F6", // Warm Alabaster
      color: "#1E293B",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* 1. Global Sovereign Header Bar */}
      <header className="vyapar-header-bar" style={{
        background: "#111827", // Obsidian Slate
        color: "#FFFFFF",
        padding: "0 24px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "2px solid #C5A869",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
      }}>
        {/* Header Top Row / Brand Desk */}
        <div className="vyapar-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              background: "linear-gradient(135deg, #C5A869 0%, #8E6D24 100%)",
              color: "#111827",
              fontWeight: "900",
              fontSize: "13px",
              padding: "5px 10px",
              borderRadius: "6px",
              letterSpacing: "0.5px",
              flexShrink: 0
            }}>
              VYAPAR OS
            </div>

            <div style={{ overflow: "hidden" }}>
              <div style={{ fontWeight: "800", fontSize: "14px", color: "#F8FAFC", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {DEMO_CONFIG.clientName}
                <span style={{ fontSize: "11px", color: "#C5A869", fontWeight: "600", marginLeft: "4px" }}>• Jabalpur</span>
              </div>
              <div className="vyapar-desktop-only" style={{ fontSize: "11px", color: "#94A3B8" }}>
                Unified Business Operating System • Product Engineering by GARUDA AI
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <div style={{
              background: "#059669",
              color: "#FFFFFF",
              fontSize: "10px",
              fontWeight: "700",
              padding: "4px 8px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#A7F3D0" }}></span>
              GADDI LIVE
            </div>
          </div>
        </div>

        {/* Center: Demo Simulation Label Guard */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(197, 168, 105, 0.15)",
          border: "1px solid rgba(197, 168, 105, 0.3)",
          color: "#FCD34D",
          padding: "4px 10px",
          borderRadius: "6px",
          fontSize: "10px",
          fontWeight: "700",
          justifyContent: "center",
          maxWidth: "100%",
          boxSizing: "border-box"
        }}>
          <FiAlertCircle size={13} style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            SALES DEMONSTRATION • SIMULATED DATA
          </span>
        </div>

        {/* Right Status Desk (Desktop Only) */}
        <div className="vyapar-desktop-only" style={{ alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "#94A3B8" }}>OPERATING DATE</div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#C5A869" }}>
              {DEMO_CONFIG.operatingDate}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Navigation Tab Bar (Desktop Only - hidden below 768px) */}
      <nav className="vyapar-desktop-only" style={{
        background: "#FFFFFF",
        borderBottom: "1px solid #E2E8F0",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        overflowX: "auto",
        scrollbarWidth: "none",
        position: "sticky",
        top: "64px",
        zIndex: 90
      }}>
        <div style={{ display: "flex", gap: "4px", minWidth: "max-content", padding: "6px 0" }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "hotel_showcase_tab") {
                    setSelectedHotelForShowcase("hotel1");
                    setActiveTab("hotel_showcase");
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background: isActive ? (item.highlight ? "#111827" : "#FAF9F6") : "transparent",
                  color: isActive ? (item.highlight ? "#C5A869" : "#111827") : "#64748B",
                  fontWeight: isActive ? "800" : "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isActive && !item.highlight ? "inset 0 0 0 1px #E2E8F0" : "none"
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: isActive ? "#C5A869" : "#F1F5F9",
                    color: isActive ? "#111827" : "#64748B",
                    fontWeight: "700"
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. Main Workspace Canvas */}
      <main className="vyapar-main-canvas" style={{ maxWidth: "1440px", margin: "0 auto", padding: "28px 24px 60px" }}>
        {activeTab === "executive" && (
          <ExecutiveCommandCenter onSelectTab={setActiveTab} />
        )}
        {activeTab === "rojgari" && (
          <RojgariCollections />
        )}
        {activeTab === "agents" && (
          <AgentOperations />
        )}
        {activeTab === "milk" && (
          <MilkDistributionOS />
        )}
        {activeTab === "maharokad" && (
          <MahaRokadReconciliation />
        )}
        {activeTab === "pardaboli" && (
          <PardaBoliAuction />
        )}
        {activeTab === "hotels" && (
          <DualHotelManagement onOpenWebsite={handleOpenWebsite} />
        )}
      </main>

      {/* 4. Sovereign Footer Bar */}
      <footer style={{
        background: "#FFFFFF",
        borderTop: "1px solid #E2E8F0",
        padding: "20px 24px",
        textAlign: "center",
        fontSize: "12px",
        color: "#64748B"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <strong>VYAPAR OS™</strong> — Designed for traditional Indian enterprises with multi-vertical operations.
          </div>
          <div>
            Jabalpur Gaddi Headquarters • Strict Double-Entry Cash Vault Protocol • Powered by <strong>GARUDA AI</strong>
          </div>
        </div>
      </footer>

      {/* 5. Mobile Bottom Navigation Bar (< 768px viewports) */}
      <nav className="vyapar-bottom-nav">
        {bottomNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`vyapar-bottom-nav-item ${isActive ? "active" : ""}`}
            >
              <div className="nav-icon-wrap">
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
