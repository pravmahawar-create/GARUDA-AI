import React, { useState, useEffect } from "react";
import { 
  FiClock, FiShield, FiTrendingDown, FiLock, 
  FiUsers, FiAlertCircle, FiCheck, FiArrowDown 
} from "react-icons/fi";
import { PARDA_BOLI_ACTIVE_AUCTION } from "./vyaparDemoData";

export default function PardaBoliAuction() {
  const [auction, setAuction] = useState(PARDA_BOLI_ACTIVE_AUCTION);
  const [bids, setBids] = useState(PARDA_BOLI_ACTIVE_AUCTION.bidHistory);
  const [sliderPos, setSliderPos] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [myBidAmount, setMyBidAmount] = useState(820000); // 8,25,000 - 5,000
  const [bidPlacedNotice, setBidPlacedNotice] = useState(null);
  const [showBidConfirmModal, setShowBidConfirmModal] = useState(false);

  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Slider bid execution
  const handleSlideComplete = () => {
    const newBid = {
      id: `BID-${Math.floor(900 + Math.random() * 90)}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      bidder: "Bidder #112 (You)",
      amount: myBidAmount,
      status: "Current Winner"
    };

    // Mark previous current winner as outbid
    const updatedBids = bids.map(b => ({
      ...b,
      status: b.status === "Current Winner" ? "Outbid" : b.status
    }));

    setBids([newBid, ...updatedBids]);
    
    // Recalculate dividend
    const discount = auction.chitValue - myBidAmount;
    const dividend = discount / auction.totalMembers;
    const netInstallment = auction.monthlyInstallmentGross - dividend;

    setAuction(prev => ({
      ...prev,
      currentWinningBid: myBidAmount,
      currentWinningBidderAnonymous: "Bidder #112 (You)",
      calculatedDividendPerMember: dividend,
      netInstallmentPayable: netInstallment
    }));

    setMyBidAmount(prev => Math.max(750000, prev - 5000));
    setSliderPos(0);
    setBidPlacedNotice(`Bid of ${formatINR(myBidAmount)} submitted successfully!`);
    setTimeout(() => setBidPlacedNotice(null), 3000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Header */}
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
              background: "#111827",
              color: "#C5A869",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "800"
            }}>
              PARDA BOLI • ANONYMOUS REVERSE AUCTION
            </span>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              100% Identity Masked • Reverse Chit Bidding Engine
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#111827" }}>
            {auction.groupName} ({auction.chitId})
          </h2>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            color: "#065F46",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981" }}></span>
            AUCTION WINDOW: {auction.auctionWindow}
          </div>

          <div style={{
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            color: "#1E40AF"
          }}>
            MONTH {auction.currentMonth} OF {auction.totalMonths}
          </div>
        </div>
      </div>

      {/* 2. Live Bidding Room Arena */}
      <div className="vyapar-two-col-equal">
        {/* Left Column: Live Arena & Slide-to-Bid */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          padding: "24px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.02)"
        }}>
          {/* Privacy Protection Callout */}
          <div style={{
            background: "#FAF9F6",
            border: "1px solid #E2E8F0",
            padding: "10px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#64748B",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px"
          }}>
            <FiShield color="#C5A869" size={16} />
            <span>
              <strong>Parda Privacy Protocol:</strong> All 20 member names, phone numbers, and addresses are encrypted. Bids appear only as anonymous IDs.
            </span>
          </div>

          {/* Current Winning Bid Box */}
          <div style={{
            background: "linear-gradient(135deg, #111827 0%, #1E293B 100%)",
            borderRadius: "14px",
            padding: "24px",
            color: "#FFFFFF",
            textAlign: "center",
            marginBottom: "24px",
            position: "relative"
          }}>
            <div style={{ fontSize: "11px", color: "#C5A869", fontWeight: "700", letterSpacing: "1px" }}>
              CURRENT LOWEST REVERSE BID (WINNING OFFER)
            </div>
            <div style={{ fontSize: "36px", fontWeight: "900", color: "#FFFFFF", fontVariantNumeric: "tabular-nums", margin: "8px 0" }}>
              {formatINR(auction.currentWinningBid)}
            </div>
            <div style={{ fontSize: "13px", color: "#94A3B8" }}>
              Held by: <strong style={{ color: "#FCD34D" }}>{auction.currentWinningBidderAnonymous}</strong> (Total Prize pool: {formatINR(auction.chitValue)})
            </div>

            <div style={{
              marginTop: "16px",
              paddingTop: "14px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              fontSize: "12px"
            }}>
              <div>
                <div style={{ color: "#94A3B8" }}>Dividend Earned Per Member</div>
                <div style={{ color: "#34D399", fontWeight: "800", fontSize: "15px" }}>
                  +{formatINR(auction.calculatedDividendPerMember)}
                </div>
              </div>
              <div>
                <div style={{ color: "#94A3B8" }}>Net Monthly Installment Payable</div>
                <div style={{ color: "#FCD34D", fontWeight: "800", fontSize: "15px" }}>
                  {formatINR(auction.netInstallmentPayable)}
                </div>
              </div>
            </div>
          </div>

          {/* Slide to Bid Interactive Control */}
          <div style={{
            background: "#FAF9F6",
            borderRadius: "14px",
            padding: "20px",
            border: "1px solid #E2E8F0"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>
                YOUR REVERSE BID OFFER:
              </span>
              <span style={{ fontSize: "18px", fontWeight: "800", color: "#059669", fontVariantNumeric: "tabular-nums" }}>
                {formatINR(myBidAmount)}
              </span>
            </div>

            <p style={{ fontSize: "11px", color: "#64748B", margin: "0 0 16px" }}>
              Drag the golden slider all the way to the right to confirm submission. Prevents accidental bids.
            </p>

            {/* Slider Track */}
            <div style={{
              position: "relative",
              height: "54px",
              background: "#E2E8F0",
              borderRadius: "27px",
              overflow: "hidden",
              userSelect: "none"
            }}>
              <div style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${sliderPos}%`,
                background: "linear-gradient(90deg, #C5A869, #059669)",
                transition: isSliding ? "none" : "width 0.2s ease"
              }} />

              <div style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: "700",
                color: sliderPos > 50 ? "#FFFFFF" : "#475569",
                pointerEvents: "none"
              }}>
                SLIDE TO CONFIRM REVERSE BID →
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onMouseDown={() => setIsSliding(true)}
                onTouchStart={() => setIsSliding(true)}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                onMouseUp={() => {
                  setIsSliding(false);
                  if (sliderPos > 85) setShowBidConfirmModal(true);
                  else setSliderPos(0);
                }}
                onTouchEnd={() => {
                  setIsSliding(false);
                  if (sliderPos > 85) setShowBidConfirmModal(true);
                  else setSliderPos(0);
                }}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "grab"
                }}
              />
            </div>

            {bidPlacedNotice && (
              <div style={{
                marginTop: "12px",
                padding: "8px",
                borderRadius: "6px",
                background: "#ECFDF5",
                color: "#059669",
                textAlign: "center",
                fontSize: "12px",
                fontWeight: "700"
              }}>
                ✓ {bidPlacedNotice}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Anonymous Bid Stream */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          padding: "20px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>
              Live Bid Audit Stream
            </h3>
            <span style={{ fontSize: "11px", color: "#059669", fontWeight: "700" }}>
              🟢 REALTIME FEED
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {bids.map((b) => (
              <div
                key={b.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${b.status === "Current Winner" ? "#A7F3D0" : "#F1F5F9"}`,
                  background: b.status === "Current Winner" ? "#ECFDF5" : "#FAF9F6",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: "700", color: "#1E293B", fontSize: "13px" }}>
                      {b.bidder}
                    </span>
                    <span style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontWeight: "700",
                      background: b.status === "Current Winner" ? "#059669" : "#E2E8F0",
                      color: b.status === "Current Winner" ? "#FFFFFF" : "#64748B"
                    }}>
                      {b.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                    {b.id} • {b.time}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                    {formatINR(b.amount)}
                  </div>
                  <div style={{ fontSize: "10px", color: "#059669" }}>
                    Disc: {formatINR(auction.chitValue - b.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bid Submission Confirmation Modal */}
      {showBidConfirmModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(17, 24, 39, 0.65)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "16px"
        }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            maxWidth: "460px",
            width: "100%",
            padding: "24px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
            border: "1px solid #E2E8F0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ background: "#ECFDF5", padding: "8px", borderRadius: "8px", color: "#059669" }}>
                <FiTrendingDown size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#111827" }}>
                  Confirm Reverse Bid Submission?
                </h3>
                <div style={{ fontSize: "11px", color: "#64748B" }}>
                  Parda Boli Anonymous Chamber • {auction.groupName}
                </div>
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.4", margin: "0 0 16px" }}>
              Are you sure you want to broadcast this reverse bid? Your identity remains 100% masked to other participants.
            </p>

            <div style={{
              background: "#FAF9F6",
              borderRadius: "10px",
              padding: "14px",
              border: "1px solid #E2E8F0",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "12px",
              marginBottom: "18px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Anonymous Identifier:</span>
                <strong style={{ color: "#111827" }}>Bidder #112 (You)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Your Reverse Bid Offer:</span>
                <strong style={{ color: "#059669", fontSize: "14px" }}>{formatINR(myBidAmount)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Discount Pool Created:</span>
                <strong style={{ color: "#111827" }}>{formatINR(auction.chitValue - myBidAmount)}</strong>
              </div>
              <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "6px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Dividend Generated/Member:</span>
                <strong style={{ color: "#059669" }}>+{formatINR((auction.chitValue - myBidAmount) / auction.totalMembers)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#8E6D24", fontWeight: "700" }}>Net Monthly Installment Payable:</span>
                <strong style={{ color: "#8E6D24" }}>{formatINR(auction.monthlyInstallmentGross - ((auction.chitValue - myBidAmount) / auction.totalMembers))}</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => {
                  setShowBidConfirmModal(false);
                  setSliderPos(0);
                }}
                style={{
                  background: "#F1F5F9",
                  color: "#475569",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowBidConfirmModal(false);
                  handleSlideComplete();
                }}
                style={{
                  background: "#059669",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 18px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Confirm & Place Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
