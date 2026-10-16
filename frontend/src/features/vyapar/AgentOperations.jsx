import React, { useState } from "react";
import { 
  FiSmartphone, FiUser, FiDollarSign, FiCheckCircle, 
  FiClock, FiShield, FiSend, FiRefreshCw, FiMapPin, FiCheck 
} from "react-icons/fi";
import { COLLECTION_AGENTS, ROJGARI_BORROWERS } from "./vyaparDemoData";

export default function AgentOperations() {
  const [agents, setAgents] = useState(COLLECTION_AGENTS);
  const [activeMobileAgent, setActiveMobileAgent] = useState(COLLECTION_AGENTS[0]);
  
  // Mobile Simulator Form State
  const [selectedBorrowerId, setSelectedBorrowerId] = useState("BOR-101");
  const [paymentAmount, setPaymentAmount] = useState("1200");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [simulatedReceipt, setSimulatedReceipt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSimulatePayment = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const amt = Number(paymentAmount) || 1200;
      const borrower = ROJGARI_BORROWERS.find(b => b.id === selectedBorrowerId) || ROJGARI_BORROWERS[0];
      const receiptNo = `REC-${Math.floor(100000 + Math.random() * 900000)}`;

      // Update active agent bag balance live!
      setAgents(prev => prev.map(a => {
        if (a.id === activeMobileAgent.id) {
          const updatedCashBag = paymentMode === "Cash" ? a.cashInHandBag + amt : a.cashInHandBag;
          const updatedDigital = paymentMode === "UPI" ? a.digitalUPICollected + amt : a.digitalUPICollected;
          return {
            ...a,
            todayCollected: a.todayCollected + amt,
            cashInHandBag: updatedCashBag,
            digitalUPICollected: updatedDigital,
            lastSyncTime: "Just now"
          };
        }
        return a;
      }));

      setActiveMobileAgent(prev => ({
        ...prev,
        todayCollected: prev.todayCollected + amt,
        cashInHandBag: paymentMode === "Cash" ? prev.cashInHandBag + amt : prev.cashInHandBag,
        digitalUPICollected: paymentMode === "UPI" ? prev.digitalUPICollected + amt : prev.digitalUPICollected,
        lastSyncTime: "Just now"
      }));

      setSimulatedReceipt({
        receiptNo,
        borrowerName: borrower.name,
        borrowerArea: borrower.area,
        amount: amt,
        mode: paymentMode,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: activeMobileAgent.name,
        date: "11 Oct 2026"
      });

      setIsSubmitting(false);
    }, 400);
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
              background: "rgba(197, 168, 105, 0.15)",
              color: "#8E6D24",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "700"
            }}>
              FIELD RECONCILIATION & AGENT ACCOUNTABILITY
            </span>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Tracking Physical Bag Float vs Cash Counter Verification
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#111827" }}>
            Collection Agents & Live Mobile PWA Simulation
          </h2>
        </div>

        <div style={{
          background: "#FFFBEB",
          border: "1px solid #FCD34D",
          padding: "8px 14px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: "700",
          color: "#B45309",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <FiShield size={14} />
          TOTAL ROAD FLOAT: {formatINR(agents.reduce((acc, a) => acc + a.cashInHandBag, 0))}
        </div>
      </div>

      {/* 2. Side-by-Side on Desktop / Stack on Mobile */}
      <div className="vyapar-two-col">
        {/* Left Column: Agents Table */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#111827" }}>
              Active Collection Agents ({agents.length})
            </h3>
            <span style={{ fontSize: "12px", color: "#64748B" }}>
              Click any agent to load in Mobile PWA
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {agents.map((agent) => {
              const isSelected = activeMobileAgent.id === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => {
                    setActiveMobileAgent(agent);
                    setSimulatedReceipt(null);
                  }}
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    border: `1px solid ${isSelected ? "#C5A869" : "#E2E8F0"}`,
                    background: isSelected ? "#FAF9F6" : "#FFFFFF",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: "800", fontSize: "15px", color: "#111827" }}>
                          {agent.name}
                        </span>
                        <span style={{ fontSize: "10px", padding: "2px 6px", background: "#E2E8F0", borderRadius: "4px", color: "#475569" }}>
                          {agent.id}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                        <FiMapPin size={11} style={{ verticalAlign: "middle", marginRight: "3px" }} />
                        {agent.assignedRoute} • {agent.assignedBorrowersCount} Borrowers
                      </div>
                    </div>

                    <span style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: agent.cashInHandBag === 0 ? "#ECFDF5" : "#FFFBEB",
                      color: agent.cashInHandBag === 0 ? "#059669" : "#B45309"
                    }}>
                      {agent.settlementStatus}
                    </span>
                  </div>

                  {/* Financial Metrics Strip */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    background: "#F8FAFC",
                    padding: "10px",
                    borderRadius: "8px",
                    marginTop: "8px"
                  }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#64748B" }}>TODAY COLLECTED</div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#111827", fontVariantNumeric: "tabular-nums" }}>
                        {formatINR(agent.todayCollected)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#B45309", fontWeight: "700" }}>CASH IN BAG (FLOAT)</div>
                      <div style={{ fontSize: "13px", fontWeight: "800", color: "#B45309", fontVariantNumeric: "tabular-nums" }}>
                        {formatINR(agent.cashInHandBag)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#059669" }}>DEPOSITED CASH</div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#059669", fontVariantNumeric: "tabular-nums" }}>
                        {formatINR(agent.depositedToGaddi)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Sample Mobile Field Collection PWA Device Simulator */}
        <div style={{
          background: "#1E293B",
          borderRadius: "28px",
          padding: "16px",
          border: "8px solid #0F172A",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          color: "#FFFFFF",
          maxWidth: "380px",
          margin: "0 auto",
          width: "100%"
        }}>
          {/* Mobile Shell Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "4px 12px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            fontSize: "11px",
            color: "#94A3B8"
          }}>
            <span>VYAPAR FIELD PWA</span>
            <span style={{ color: "#34D399" }}>🟢 ONLINE • SYNCED</span>
          </div>

          {/* Active Agent Info Banner */}
          <div style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: "12px",
            padding: "12px",
            margin: "12px 0",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <div style={{ fontSize: "11px", color: "#94A3B8" }}>LOGGED IN AGENT</div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#F8FAFC" }}>
              {activeMobileAgent.name} ({activeMobileAgent.id})
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "8px",
              paddingTop: "6px",
              borderTop: "1px solid rgba(255,255,255,0.06)"
            }}>
              <span style={{ fontSize: "11px", color: "#FCD34D" }}>Bag Cash Float:</span>
              <span style={{ fontSize: "14px", fontWeight: "800", color: "#FCD34D", fontVariantNumeric: "tabular-nums" }}>
                {formatINR(activeMobileAgent.cashInHandBag)}
              </span>
            </div>
          </div>

          {/* Collection Form */}
          <form onSubmit={handleSimulatePayment} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "11px", color: "#CBD5E1", display: "block", marginBottom: "4px" }}>
                SELECT ASSIGNED BORROWER:
              </label>
              <select
                value={selectedBorrowerId}
                onChange={(e) => {
                  setSelectedBorrowerId(e.target.value);
                  const b = ROJGARI_BORROWERS.find(x => x.id === e.target.value);
                  if (b) setPaymentAmount(String(b.dailyDue));
                }}
                style={{
                  width: "100%",
                  background: "#0F172A",
                  color: "#FFFFFF",
                  border: "1px solid #334155",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  outline: "none"
                }}
              >
                {ROJGARI_BORROWERS.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} (Due: ₹{b.dailyDue})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "11px", color: "#CBD5E1", display: "block", marginBottom: "4px" }}>
                COLLECTED AMOUNT (₹):
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                style={{
                  width: "100%",
                  background: "#0F172A",
                  color: "#FFFFFF",
                  border: "1px solid #334155",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "700",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "11px", color: "#CBD5E1", display: "block", marginBottom: "4px" }}>
                PAYMENT MODE:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setPaymentMode("Cash")}
                  style={{
                    background: paymentMode === "Cash" ? "#C5A869" : "#0F172A",
                    color: paymentMode === "Cash" ? "#111827" : "#CBD5E1",
                    border: "1px solid #334155",
                    padding: "8px",
                    borderRadius: "6px",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  💵 Physical Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("UPI")}
                  style={{
                    background: paymentMode === "UPI" ? "#2563EB" : "#0F172A",
                    color: "#FFFFFF",
                    border: "1px solid #334155",
                    padding: "8px",
                    borderRadius: "6px",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  📱 Direct UPI QR
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: "#059669",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                marginTop: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <FiCheckCircle size={16} />
              {isSubmitting ? "Logging Collection..." : "Record & Generate Receipt"}
            </button>
          </form>

          {/* Generated Simulated Receipt Card */}
          {simulatedReceipt && (
            <div style={{
              marginTop: "16px",
              background: "#FFFFFF",
              color: "#111827",
              borderRadius: "12px",
              padding: "14px",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              animation: "fadeIn 0.2s ease"
            }}>
              <div style={{ textAlign: "center", borderBottom: "1px dashed #CBD5E1", paddingBottom: "8px", marginBottom: "8px" }}>
                <div style={{ fontWeight: "800", fontSize: "13px", color: "#8E6D24" }}>LAKSHYA TRADERS • JABALPUR</div>
                <div style={{ fontSize: "10px", color: "#64748B" }}>Official Digital Payment Receipt</div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#64748B" }}>Receipt No:</span>
                <span style={{ fontWeight: "700" }}>{simulatedReceipt.receiptNo}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#64748B" }}>Customer:</span>
                <span style={{ fontWeight: "700" }}>{simulatedReceipt.borrowerName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#64748B" }}>Mode:</span>
                <span style={{ fontWeight: "700" }}>{simulatedReceipt.mode}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#64748B" }}>Time:</span>
                <span>{simulatedReceipt.time}</span>
              </div>

              <div style={{
                background: "#ECFDF5",
                padding: "8px",
                borderRadius: "6px",
                textAlign: "center",
                fontWeight: "900",
                fontSize: "15px",
                color: "#065F46"
              }}>
                RECEIVED: {formatINR(simulatedReceipt.amount)}
              </div>

              <div style={{ textAlign: "center", marginTop: "8px", fontSize: "10px", color: "#059669", fontWeight: "600" }}>
                ✓ Bag Float and Ledger updated synchronously
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
