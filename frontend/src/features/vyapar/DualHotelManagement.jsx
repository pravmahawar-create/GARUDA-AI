import React, { useState } from "react";
import { 
  FiHome, FiCalendar, FiDollarSign, FiUsers, 
  FiExternalLink, FiCheckCircle, FiClock, FiPlus 
} from "react-icons/fi";
import { DUAL_HOTELS_DATA } from "./vyaparDemoData";

export default function DualHotelManagement({ onOpenWebsite }) {
  const [activeHotel, setActiveHotel] = useState("hotel1");
  const hotel = DUAL_HOTELS_DATA[activeHotel];

  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header with Hotel Toggle */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "16px",
        padding: "22px 28px",
        border: "1px solid #E2E8F0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{
              background: "rgba(197, 168, 105, 0.15)",
              color: "#8E6D24",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "700"
            }}>
              DUAL HOSPITALITY SUITE • JABALPUR
            </span>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Two Independent Hotels under Unified Gaddi Financial Control
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#111827" }}>
            {hotel.name}
          </h2>
          <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
            {hotel.location}
          </div>
        </div>

        {/* Hotel Workspace Selector Tabs */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setActiveHotel("hotel1")}
            style={hotelTabBtnStyle(activeHotel === "hotel1")}
          >
            🏨 Hotel 1: The Narmada Grand
          </button>
          <button
            onClick={() => setActiveHotel("hotel2")}
            style={hotelTabBtnStyle(activeHotel === "hotel2")}
          >
            🏨 Hotel 2: Kalchuri Heritage
          </button>
          <button
            onClick={() => onOpenWebsite(activeHotel)}
            style={{
              background: "#111827",
              color: "#C5A869",
              border: "1px solid #C5A869",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <FiExternalLink size={14} /> View Public Website
          </button>
        </div>
      </div>

      {/* 2. Operations & Financial KPI Strip */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px"
      }}>
        <div style={kpiBoxStyle}>
          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>ROOM OCCUPANCY</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
            {hotel.occupancyRate}
          </div>
          <div style={{ fontSize: "12px", color: "#059669" }}>
            {hotel.occupiedRooms} / {hotel.totalRooms} Rooms Booked
          </div>
        </div>

        <div style={kpiBoxStyle}>
          <div style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>TODAY'S REVENUE</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
            {formatINR(hotel.todayRevenue)}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B" }}>
            {hotel.checkInsToday} Check-ins • {hotel.checkOutsToday} Check-outs
          </div>
        </div>

        <div style={{ ...kpiBoxStyle, borderLeft: "4px solid #059669" }}>
          <div style={{ fontSize: "11px", color: "#059669", fontWeight: "700" }}>FRONT DESK PHYSICAL CASH</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#059669", fontVariantNumeric: "tabular-nums" }}>
            {formatINR(hotel.cashRevenue)}
          </div>
          <div style={{ fontSize: "12px", color: "#059669" }}>
            Credited to Maha-Rokad
          </div>
        </div>

        <div style={{ ...kpiBoxStyle, borderLeft: "4px solid #2563EB" }}>
          <div style={{ fontSize: "11px", color: "#2563EB", fontWeight: "700" }}>ONLINE / DIGITAL REVENUE</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#2563EB", fontVariantNumeric: "tabular-nums" }}>
            {formatINR(hotel.digitalRevenue)}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B" }}>
            Direct Bank Route
          </div>
        </div>
      </div>

      {/* 3. Room Inventory & Rates Management */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "14px",
        border: "1px solid #E2E8F0",
        padding: "22px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>
            Live Room Categories & Inventory Status
          </h3>
          <span style={{ fontSize: "12px", color: "#64748B" }}>
            Real-time PMS Folio Sync
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {hotel.roomCategories.map((cat, idx) => (
            <div 
              key={idx}
              style={{
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                background: "#FAF9F6"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <span style={{ fontWeight: "700", fontSize: "14px", color: "#1E293B" }}>
                  {cat.name}
                </span>
                <span style={{ fontWeight: "800", fontSize: "14px", color: "#059669" }}>
                  {formatINR(cat.rate)}/night
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B", marginBottom: "8px" }}>
                <span>Occupied: {cat.booked} of {cat.total}</span>
                <span style={{ fontWeight: "600", color: cat.booked === cat.total ? "#DC2626" : "#059669" }}>
                  {cat.total - cat.booked} Available
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: "6px", background: "#E2E8F0", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(cat.booked / cat.total) * 100}%`,
                  background: cat.booked === cat.total ? "#DC2626" : "#C5A869"
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const hotelTabBtnStyle = (active) => ({
  background: active ? "#111827" : "#FFFFFF",
  color: active ? "#C5A869" : "#475569",
  border: `1px solid ${active ? "#111827" : "#CBD5E1"}`,
  padding: "8px 14px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer",
  transition: "all 0.15s ease"
});

const kpiBoxStyle = {
  background: "#FFFFFF",
  borderRadius: "12px",
  padding: "18px",
  border: "1px solid #E2E8F0",
  display: "flex",
  flexDirection: "column",
  gap: "4px"
};
