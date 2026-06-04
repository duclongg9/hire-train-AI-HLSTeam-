"use client";
import { useState, useEffect, useRef } from "react";
import { createInterviewSocket, campaignApi, candidateApi } from "@/lib/api_client";

type Sentiment = "neutral" | "positive" | "nervous" | "confident";

const SENTIMENT_COLOR: Record<Sentiment, string> = {
  neutral:   "#6366f1",
  positive:  "#10b981",
  nervous:   "#f59e0b",
  confident: "#06b6d4",
};

const SENTIMENT_LABEL: Record<Sentiment, string> = {
  neutral:   "Listening...",
  positive:  "Great response!",
  nervous:   "Take a breath...",
  confident: "Strong delivery!",
};

export default function CandidatePortal() {
  const [step, setStep] = useState<"submit" | "waiting" | "interview">("submit");
  const [sentiment, setSentiment] = useState<Sentiment>("neutral");
  const [wsBars, setWsBars] = useState<number[]>(Array(24).fill(4));
  const [connected, setConnected] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [extractedInfo, setExtractedInfo] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    campaignApi.list().then(res => {
      // Show active campaigns or all
      setCampaigns(res.data);
      if (res.data.length > 0) {
        setSelectedCampaignId(res.data[0].id);
      }
    }).catch(err => {
      console.error("Failed to load campaigns", err);
    });
  }, []);

  // Animate visualizer bars
  useEffect(() => {
    if (step !== "interview") return;
    const tick = () => {
      setWsBars(prev => prev.map(() => connected
        ? Math.random() * 60 + (Math.random() > 0.7 ? 20 : 4)
        : 4 + Math.sin(Date.now() / 500) * 2
      ));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [step, connected]);

  const handleUpload = async () => {
    if (!cvFile || !selectedCampaignId) {
      setError("Please select a campaign and choose a CV file first.");
      return;
    }
    setApplying(true);
    setError("");
    setExtractedInfo(null);
    try {
      const res = await candidateApi.applyFile(selectedCampaignId, cvFile);
      setExtractedInfo(res.data);
      setStep("waiting");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to submit CV file. Ensure DB is populated.");
    } finally {
      setApplying(false);
    }
  };

  const enterInterview = () => {
    setStep("interview");
    const ws = createInterviewSocket();
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event_type === "ai_response_chunk" && data.customer_sentiment) {
          setSentiment(data.customer_sentiment as Sentiment);
        }
      } catch { /* ignore */ }
    };
    ws.onerror = () => setConnected(false);
    ws.onclose = () => { setConnected(false); setSentiment("neutral"); };
  };

  const leaveInterview = () => {
    wsRef.current?.close();
    wsRef.current = null;
    setStep("submit");
    setConnected(false);
    setSentiment("neutral");
  };

  const color = SENTIMENT_COLOR[sentiment];

  return (
    <main style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 80%, rgba(6,182,212,0.08) 0%, transparent 60%), var(--bg-primary)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 20px",
    }}>
      <div style={{ width: "100%", maxWidth: "600px" }}>

        {/* ── STEP: Submit CV ───────────────────────────────────── */}
        {step === "submit" && (
          <div className="animate-fade-in">
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div className="badge badge-cyan" style={{ marginBottom: "16px" }}>Candidate Portal</div>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "8px" }}>
                Apply for a Position
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Upload your CV and wait for AI screening before your voice interview.
              </p>
            </div>

            <div className="glass-card" style={{ padding: "32px", marginBottom: "20px" }}>
              <h2 style={{ fontWeight: 700, marginBottom: "20px", fontSize: "1rem" }}>1. Submit Your CV</h2>
              
              {/* Campaign Dropdown */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Select Recruitment Campaign / Position
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={e => setSelectedCampaignId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontSize: "0.9rem",
                  }}
                >
                  <option value="" style={{ background: "#1c1c24" }}>-- Select a Position --</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id} style={{ background: "#1c1c24" }}>
                      {c.title} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Zone */}
              <div
                id="cv-upload-zone"
                className="upload-zone"
                style={{ marginBottom: "16px" }}
                onClick={() => document.getElementById("cv-input")?.click()}
              >
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📄</div>
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                  {cvFile ? cvFile.name : "Drop CV here or click to browse"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>PDF or DOCX</div>
                <input id="cv-input" type="file" accept=".pdf,.docx" style={{ display: "none" }}
                  onChange={e => setCvFile(e.target.files?.[0] ?? null)} />
              </div>

              {error && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "16px", fontWeight: 500 }}>
                  ❌ {error}
                </div>
              )}

              <button
                id="btn-upload-cv"
                className="btn-primary"
                style={{ width: "100%", opacity: applying ? 0.7 : 1 }}
                disabled={!cvFile || !selectedCampaignId || applying}
                onClick={handleUpload}
              >
                {applying ? "Parsing CV via Gemini..." : "Upload & Submit"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: Waiting Room ────────────────────────────────── */}
        {step === "waiting" && (
          <div className="animate-fade-in">
            <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "20px" }}>⏳</div>
              <h2 style={{ fontWeight: 700, fontSize: "1.3rem", marginBottom: "12px" }}>
                CV Received!
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "24px" }}>
                Our AI is reviewing your resume. You will be notified when your interview session is ready.
              </p>

              {extractedInfo && (
                <div style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "20px",
                  marginBottom: "28px",
                  textAlign: "left",
                }}>
                  <h3 style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "12px", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "8px" }}>
                    ✨ AI-Parsed Candidate Information:
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    <div><strong style={{ color: "var(--text-primary)" }}>Full Name:</strong> {extractedInfo.full_name || "N/A"}</div>
                    <div><strong style={{ color: "var(--text-primary)" }}>Email:</strong> {extractedInfo.email || "N/A"}</div>
                    <div><strong style={{ color: "var(--text-primary)" }}>Phone:</strong> {extractedInfo.phone || "N/A"}</div>
                  </div>
                  <div style={{ marginTop: "12px", fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    ✓ This info was parsed directly from the CV file text using Gemini.
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "32px" }}>
                {["Uploaded", "AI Screening", "Interview"].map((s, i) => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.75rem", fontWeight: 700,
                      background: i === 0 ? "var(--accent-green)" : i === 1 ? "rgba(99,102,241,0.3)" : "var(--bg-card)",
                      color: i === 0 ? "#fff" : "var(--text-muted)",
                      border: i === 1 ? "1px solid var(--accent-purple)" : "none",
                    }}>
                      {i === 0 ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: "0.8rem", color: i === 0 ? "var(--accent-green)" : "var(--text-muted)" }}>{s}</span>
                    {i < 2 && <span style={{ color: "var(--text-muted)" }}>→</span>}
                  </div>
                ))}
              </div>
              {/* Demo: enter immediately */}
              <button id="btn-enter-interview" className="btn-primary" style={{ width: "100%" }} onClick={enterInterview}>
                🎤 Enter Interview Room (Demo)
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: Interview Room ──────────────────────────────── */}
        {step === "interview" && (
          <div className="animate-fade-in">
            <div className="glass-card" style={{
              padding: "36px",
              borderColor: `${color}40`,
              boxShadow: `0 0 60px ${color}20`,
              transition: "border-color 0.6s ease, box-shadow 0.6s ease",
            }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: "1.1rem" }}>AI Interview Room</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: connected ? "#10b981" : "#ef4444",
                      animation: connected ? "pulse-glow 2s infinite" : "none",
                    }} />
                    <span style={{ fontSize: "0.78rem", color: connected ? "#10b981" : "#ef4444" }}>
                      {connected ? "Connected" : "Connecting..."}
                    </span>
                  </div>
                </div>
                <button className="btn-ghost" style={{ fontSize: "0.8rem" }} onClick={leaveInterview}>
                  Leave ✕
                </button>
              </div>

              {/* Audio Visualizer */}
              <div style={{
                height: "100px",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "4px", marginBottom: "24px",
              }}>
                {wsBars.map((h, i) => (
                  <div key={i} style={{
                    width: "5px",
                    height: `${Math.min(h, 96)}px`,
                    borderRadius: "3px",
                    background: color,
                    opacity: 0.6 + (h / 100) * 0.4,
                    transition: "height 0.08s ease, background 0.6s ease",
                  }} />
                ))}
              </div>

              {/* Sentiment */}
              <div style={{
                padding: "16px",
                borderRadius: "10px",
                background: `${color}12`,
                border: `1px solid ${color}30`,
                textAlign: "center",
                transition: "all 0.6s ease",
              }}>
                <div style={{ fontWeight: 700, color, fontSize: "1rem", marginBottom: "2px" }}>
                  {SENTIMENT_LABEL[sentiment]}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                  Detected sentiment: {sentiment}
                </div>
              </div>

              <p style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "20px", lineHeight: 1.6 }}>
                AI is analyzing your speech in real time. Sentiment updates every 5s.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
