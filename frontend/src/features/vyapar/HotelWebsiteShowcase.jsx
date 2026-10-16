import React, { useState } from "react";
import { 
  FiArrowLeft, FiCheck, FiMapPin, FiPhone, 
  FiCalendar, FiStar, FiWifi, FiCoffee, FiShield, FiSend 
} from "react-icons/fi";
import { DUAL_HOTELS_DATA } from "./vyaparDemoData";

export default function HotelWebsiteShowcase({ initialHotel = "hotel1", onBackToGaddi }) {
  const [activeHotelKey, setActiveHotelKey] = useState(initialHotel);
  const [bookingSuccessNotice, setBookingSuccessNotice] = useState(null);
  const [bookingCategory, setBookingCategory] = useState(null);
  
  const hotel = DUAL_HOTELS_DATA[activeHotelKey];

  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSimulateWhatsAppBooking = (roomName) => {
    setBookingSuccessNotice(`WhatsApp Booking Enquiry generated for ${roomName}! Simulated message queued for Lakshya Traders reservation desk.`);
    setTimeout(() => setBookingSuccessNotice(null), 4000);
  };

  return (
    <div style={{
      background: "#FAF9F6",
      minHeight: "100vh",
      fontFamily: "Inter, sans-serif",
      color: "#1E293B"
    }}>
      {/* Top Demo Bar */}
      <div style={{
        background: "#111827",
        color: "#FFFFFF",
        padding: "10px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "12px",
        borderBottom: "2px solid #C5A869"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={onBackToGaddi}
            style={{
              background: "rgba(197, 168, 105, 0.2)",
              color: "#C5A869",
              border: "1px solid #C5A869",
              padding: "4px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <FiArrowLeft size={13} /> Back to Vyapar OS Gaddi
          </button>
          <span>PUBLIC WEBSITE LIVE SHOWCASE (DEMO ENVIRONMENT)</span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setActiveHotelKey("hotel1")}
            style={{
              background: activeHotelKey === "hotel1" ? "#C5A869" : "transparent",
              color: activeHotelKey === "hotel1" ? "#111827" : "#CBD5E1",
              border: "1px solid #C5A869",
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            Showcase Hotel 1 (Narmada Grand)
          </button>
          <button
            onClick={() => setActiveHotelKey("hotel2")}
            style={{
              background: activeHotelKey === "hotel2" ? "#C5A869" : "transparent",
              color: activeHotelKey === "hotel2" ? "#111827" : "#CBD5E1",
              border: "1px solid #C5A869",
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            Showcase Hotel 2 (Kalchuri Heritage)
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div style={{
        background: activeHotelKey === "hotel1" 
          ? "linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)" 
          : "linear-gradient(135deg, #1C1917 0%, #44403C 100%)",
        color: "#FFFFFF",
        padding: "60px 24px",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(197, 168, 105, 0.2)",
            color: "#FCD34D",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700",
            marginBottom: "16px"
          }}>
            <FiStar size={13} fill="#FCD34D" /> JABALPUR'S PREMIER DESTINATION
          </div>

          <h1 style={{ fontSize: "38px", fontWeight: "900", margin: "0 0 12px", letterSpacing: "-0.5px" }}>
            {hotel.name}
          </h1>

          <p style={{ fontSize: "18px", color: "#E2E8F0", margin: "0 0 20px", lineHeight: "1.5" }}>
            {hotel.tagline}
          </p>

          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", fontSize: "14px", color: "#CBD5E1", marginBottom: "28px" }}>
            <FiMapPin color="#C5A869" /> {hotel.location}
          </div>

          <button
            onClick={() => handleSimulateWhatsAppBooking(hotel.roomCategories[0].name)}
            style={{
              background: "#25D366",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "30px",
              padding: "14px 28px",
              fontSize: "15px",
              fontWeight: "800",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 8px 24px rgba(37, 211, 102, 0.3)"
            }}
          >
            <FiSend size={16} /> Instant Direct Booking via WhatsApp
          </button>
        </div>
      </div>

      {/* Booking Notice */}
      {bookingSuccessNotice && (
        <div style={{
          maxWidth: "800px",
          margin: "20px auto 0",
          background: "#ECFDF5",
          border: "1px solid #A7F3D0",
          padding: "12px 20px",
          borderRadius: "8px",
          color: "#065F46",
          textAlign: "center",
          fontWeight: "700",
          fontSize: "13px"
        }}>
          ✓ {bookingSuccessNotice}
        </div>
      )}

      {/* Main Container */}
      <div style={{ maxWidth: "1140px", margin: "40px auto", padding: "0 20px" }}>
        {/* Amenities Bar */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          padding: "20px",
          border: "1px solid #E2E8F0",
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "40px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.02)"
        }}>
          {hotel.features.map((feat, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700", color: "#334155" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#C5A869" }}></span>
              {feat}
            </div>
          ))}
        </div>

        {/* Room Categories Showcase */}
        <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#111827", marginBottom: "20px", textAlign: "center" }}>
          Selected Rooms & Executive Suites
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {hotel.roomCategories.map((room, idx) => (
            <div
              key={idx}
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid #E2E8F0",
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Image Placeholder Frame */}
              <div style={{
                height: "180px",
                background: idx === 0 
                  ? "linear-gradient(135deg, #C5A869 0%, #8E6D24 100%)" 
                  : idx === 1 
                  ? "linear-gradient(135deg, #334155 0%, #0F172A 100%)" 
                  : "linear-gradient(135deg, #475569 0%, #1E293B 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: "700"
              }}>
                📸 {room.name}
              </div>

              <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: "800", color: "#111827" }}>
                    {room.name}
                  </h3>
                  <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "14px" }}>
                    King Bed • Central Climate Control • Fast WiFi • 24/7 Room Service
                  </div>
                </div>

                <div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "14px",
                    paddingTop: "12px",
                    borderTop: "1px solid #F1F5F9"
                  }}>
                    <div>
                      <span style={{ fontSize: "20px", fontWeight: "900", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                        {formatINR(room.rate)}
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748B" }}> / night + taxes</span>
                    </div>

                    <span style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: room.booked < room.total ? "#ECFDF5" : "#FEF2F2",
                      color: room.booked < room.total ? "#059669" : "#DC2626"
                    }}>
                      {room.total - room.booked > 0 ? `${room.total - room.booked} Available` : "Sold Out"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSimulateWhatsAppBooking(room.name)}
                    style={{
                      width: "100%",
                      background: "#111827",
                      color: "#C5A869",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <FiSend size={14} /> Book via Direct WhatsApp
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
