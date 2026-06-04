"use client";
import { useState, useCallback } from "react";
import { campaignApi, candidateApi } from "@/lib/api_client";

type Campaign = {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  rubric_schema: Record<string, unknown> | null;
};

type Candidate = {
  id: string;
  full_name: string;
  email: string;
  overall_score: number;
  status: string;
};

type Tab = "campaigns" | "leaderboard" | "upload" | "campaign_details";

export default function HRPortalDashboard() {
  const [tab, setTab] = useState<Tab>("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchStatus, setBatchStatus] = useState<string>("");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // New state variables for testing flow
  const [campaignCandidates, setCampaignCandidates] = useState<any[]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [rubric, setRubric] = useState<any[]>([]);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdStatus, setJdStatus] = useState("");
  const [scoringStatus, setScoringStatus] = useState("");
  const [selectedCandidateScoreDetail, setSelectedCandidateScoreDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await campaignApi.list();
      setCampaigns(res.data);
    } catch {
      showToast("Failed to load campaigns", "err");
    } finally {
      setLoading(false);
    }
  }, []);

  const selectCampaignDetails = async (campaign: Campaign) => {
    setActiveCampaign(campaign);
    setLoading(true);
    setJdFile(null);
    setJdStatus("");
    setScoringStatus("");
    setSelectedCandidateIds([]);
    setSelectedCandidateScoreDetail(null);
    try {
      // 1. Get campaign's rubric
      const rubricRes = await campaignApi.getRubric(campaign.id);
      setRubric(rubricRes.data || []);
      
      // 2. Load candidate list
      const candRes = await candidateApi.list(campaign.id);
      setCampaignCandidates(candRes.data || []);
      
      setTab("campaign_details");
    } catch (err) {
      console.error(err);
      showToast("Failed to load campaign details", "err");
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = useCallback(async (campaign: Campaign) => {
    setActiveCampaign(campaign);
    setLoading(true);
    try {
      const res = await candidateApi.leaderboard(campaign.id);
      setCandidates(res.data);
      setTab("leaderboard");
    } catch {
      showToast("Failed to load leaderboard", "err");
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload JD PDF/Word to parse and generate Rubric
  const uploadJd = async () => {
    if (!activeCampaign || !jdFile) return;
    setJdStatus("Analyzing Job Description via Gemini...");
    try {
      const res = await campaignApi.extractRubric(activeCampaign.id, jdFile);
      setRubric(res.data || []);
      setJdStatus("✓ Rubric generated successfully!");
      showToast("Rubric generated ✓");
      
      // Refresh campaign object to update rubric state
      const campRes = await campaignApi.get(activeCampaign.id);
      setActiveCampaign(campRes.data);
    } catch (err: any) {
      console.error(err);
      setJdStatus("");
      showToast(err.response?.data?.detail || "JD upload failed", "err");
    }
  };

  // Score candidate(s) (single or bulk selection)
  const scoreCandidates = async (candidateId?: string) => {
    if (!activeCampaign) return;
    const targetIds = candidateId ? [candidateId] : selectedCandidateIds;
    if (targetIds.length === 0) {
      showToast("Please select at least one candidate", "err");
      return;
    }
    
    setScoringStatus(`Scoring ${targetIds.length} candidate(s)...`);
    try {
      if (targetIds.length === 1) {
        await candidateApi.score(activeCampaign.id, targetIds[0]);
      } else {
        await candidateApi.bulkScore(activeCampaign.id, targetIds);
      }
      setScoringStatus("✓ Scoring completed!");
      showToast("Scoring completed ✓");
      setSelectedCandidateIds([]);
      
      // Refresh candidates list
      const candRes = await candidateApi.list(activeCampaign.id);
      setCampaignCandidates(candRes.data || []);
    } catch (err: any) {
      console.error(err);
      setScoringStatus("");
      showToast(err.response?.data?.detail || "Scoring failed", "err");
    }
  };

  // View detailed score breakdown for a scored candidate
  const viewCandidateScoreDetail = async (candidateId: string) => {
    setDetailLoading(true);
    setSelectedCandidateScoreDetail(null);
    try {
      const res = await candidateApi.finalReview(candidateId);
      setSelectedCandidateScoreDetail(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load candidate score breakdown", "err");
    } finally {
      setDetailLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!newTitle.trim()) return;
    try {
      await campaignApi.create({ title: newTitle, status: "DRAFT" });
      setNewTitle("");
      showToast("Campaign created ✓");
      loadCampaigns();
    } catch {
      showToast("Failed to create campaign", "err");
    }
  };

  const startBatch = async () => {
    if (!activeCampaign || !batchFile) return;
    setBatchStatus("Uploading...");
    try {
      const res = await candidateApi.batchEvaluate(activeCampaign.id, batchFile);
      setBatchStatus(`✓ Batch job queued: ${res.data.batch_job_id}`);
      showToast("Batch evaluation started in background");
    } catch {
      setBatchStatus("");
      showToast("Batch upload failed", "err");
    }
  };

  const getScoreClass = (s: number) => s >= 75 ? "high" : s >= 50 ? "medium" : "low";
  const getStatusBadge = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: "badge-gray", ACTIVE: "badge-blue", CLOSED: "badge-red",
      SCREENED: "badge-purple", PASSED: "badge-green", REJECTED: "badge-red",
      APPLIED: "badge-amber",
    };
    return map[s] ?? "badge-gray";
  };

  // Auto-load campaigns on mount
  useState(() => { loadCampaigns(); });

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <span className="gradient-text">HireTrain</span>
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> AI</span>
        </div>
        <hr className="divider" style={{ margin: "0 20px 20px" }} />
        {[
          { key: "campaigns", icon: "📋", label: "Campaigns" },
          { key: "upload",    icon: "📦", label: "Batch Upload" },
          { key: "leaderboard", icon: "🏆", label: "Leaderboard" },
        ].map((item) => (
          <div
            key={item.key}
            id={`nav-${item.key}`}
            className={`sidebar-nav-item ${(tab === item.key || (item.key === "campaigns" && tab === "campaign_details")) ? "active" : ""}`}
            onClick={() => { setTab(item.key as Tab); if (item.key === "campaigns") loadCampaigns(); }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            HR Manager
          </div>
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="main-content">
        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed", top: 24, right: 24, zIndex: 9999,
            padding: "12px 20px", borderRadius: "10px",
            background: toast.type === "ok" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
            border: `1px solid ${toast.type === "ok" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
            color: toast.type === "ok" ? "#10b981" : "#ef4444",
            fontWeight: 600, fontSize: "0.875rem", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}>
            {toast.msg}
          </div>
        )}

        {/* ── TAB: Campaigns ─────────────────────────────────────── */}
        {tab === "campaigns" && (
          <div className="animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
              <div>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Campaigns</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: 4 }}>
                  Manage all recruitment campaigns
                </p>
              </div>
            </div>

            {/* Create Campaign */}
            <div className="glass-card" style={{ padding: "20px", marginBottom: "24px", display: "flex", gap: "12px" }}>
              <input
                id="new-campaign-title"
                className="input-field"
                placeholder="Campaign title (e.g. Senior Backend Engineer Q3 2025)"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createCampaign()}
              />
              <button id="btn-create-campaign" className="btn-primary" onClick={createCampaign} style={{ whiteSpace: "nowrap" }}>
                + New Campaign
              </button>
            </div>

            {/* Campaign Table */}
            <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
              {loading ? (
                <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: "44px" }} />)}
                </div>
              ) : campaigns.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📋</div>
                  <div>No campaigns yet. Create your first one above.</div>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Rubric</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map(c => (
                      <tr key={c.id}>
                        <td
                          style={{ fontWeight: 600, cursor: "pointer", color: "var(--accent-cyan)" }}
                          onClick={() => selectCampaignDetails(c)}
                        >
                          {c.title}
                        </td>
                        <td><span className={`badge ${getStatusBadge(c.status)}`}>{c.status}</span></td>
                        <td>
                          {c.rubric_schema
                            ? <span className="badge badge-green">✓ Defined</span>
                            : <span className="badge badge-gray">Not set</span>}
                        </td>
                        <td style={{ display: "flex", gap: "8px" }}>
                          <button
                            id={`btn-manage-${c.id}`}
                            className="btn-primary"
                            style={{ padding: "6px 14px", fontSize: "0.8rem", background: "rgba(99,102,241,0.2)", border: "1px solid var(--accent-purple)", color: "var(--text-primary)" }}
                            onClick={() => selectCampaignDetails(c)}
                          >
                            ⚙ Manage Details
                          </button>
                          <button
                            id={`btn-leaderboard-${c.id}`}
                            className="btn-ghost"
                            style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                            onClick={() => loadLeaderboard(c)}
                          >
                            🏆 Leaderboard
                          </button>
                          <button
                            id={`btn-batch-${c.id}`}
                            className="btn-ghost"
                            style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                            onClick={() => { setActiveCampaign(c); setTab("upload"); }}
                          >
                            📦 Batch Upload
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: Campaign Details & Testing ────────────────────── */}
        {tab === "campaign_details" && activeCampaign && (
          <div className="animate-fade-in">
            {/* Back button and title */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <button
                className="btn-ghost"
                onClick={() => { setTab("campaigns"); loadCampaigns(); }}
                style={{ padding: "8px 16px", fontSize: "0.9rem" }}
              >
                ← Back
              </button>
              <div>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                  {activeCampaign.title}
                </h1>
                <span className={`badge ${getStatusBadge(activeCampaign.status)}`}>
                  {activeCampaign.status}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              {/* ── LEFT COLUMN: JD & Rubric ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* JD PDF/Word Upload */}
                <div className="glass-card" style={{ padding: "24px" }}>
                  <h2 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "12px" }}>
                    1. Job Description & Rubric Criteria
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "20px" }}>
                    Upload JD (PDF/Word) to automatically extract scoring rubric criteria using Gemini.
                  </p>

                  <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      id="jd-file-input"
                      onChange={e => setJdFile(e.target.files?.[0] ?? null)}
                      style={{ display: "none" }}
                    />
                    <button
                      className="btn-ghost"
                      onClick={() => document.getElementById("jd-file-input")?.click()}
                      style={{ flex: 1, padding: "10px" }}
                    >
                      📁 {jdFile ? jdFile.name : "Choose JD File"}
                    </button>
                    <button
                      className="btn-primary"
                      onClick={uploadJd}
                      disabled={!jdFile}
                    >
                      Upload JD
                    </button>
                  </div>

                  {jdStatus && (
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: "6px",
                      background: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      color: "#10b981",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      marginBottom: "16px",
                    }}>
                      {jdStatus}
                    </div>
                  )}

                  {/* Rubric Criteria List */}
                  <h3 style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "6px" }}>
                    Current Rubric Criteria
                  </h3>
                  {rubric.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                      No criteria set. Upload a JD file above to generate criteria.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "350px", overflowY: "auto" }}>
                      {rubric.map((crit, idx) => (
                        <div key={crit.id || idx} style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "8px",
                          padding: "12px",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <strong style={{ fontSize: "0.85rem" }}>{crit.name}</strong>
                            <span className="badge badge-blue" style={{ fontSize: "0.75rem" }}>
                              {crit.weight}%
                            </span>
                          </div>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                            Category: {String(crit.category).replace("_", " ")}
                          </span>
                          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                            {crit.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT COLUMN: Candidates & Scoring ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div className="glass-card" style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h2 style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                      2. Candidates & CV Evaluation
                    </h2>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {campaignCandidates.length} candidate(s)
                    </span>
                  </div>

                  {/* Actions bar */}
                  <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                    <button
                      className="btn-primary"
                      onClick={() => scoreCandidates()}
                      disabled={selectedCandidateIds.length === 0}
                      style={{ flex: 1 }}
                    >
                      🚀 Score Selected ({selectedCandidateIds.length})
                    </button>
                  </div>

                  {scoringStatus && (
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: "6px",
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      color: "var(--accent-purple)",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      marginBottom: "16px",
                    }}>
                      {scoringStatus}
                    </div>
                  )}

                  {/* Candidate List Table */}
                  <div style={{ overflowX: "auto" }}>
                    {campaignCandidates.length === 0 ? (
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic", textAlign: "center", padding: "30px" }}>
                        No candidates have applied yet. Go to candidate portal to upload CV.
                      </p>
                    ) : (
                      <table className="data-table" style={{ fontSize: "0.85rem" }}>
                        <thead>
                          <tr>
                            <th style={{ width: "36px" }}>
                              <input
                                type="checkbox"
                                checked={selectedCandidateIds.length === campaignCandidates.length && campaignCandidates.length > 0}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedCandidateIds(campaignCandidates.map(c => c.id));
                                  } else {
                                    setSelectedCandidateIds([]);
                                  }
                                }}
                              />
                            </th>
                            <th>Candidate</th>
                            <th>Status</th>
                            <th>Score</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {campaignCandidates.map(cand => (
                            <tr key={cand.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedCandidateIds.includes(cand.id)}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedCandidateIds(prev => [...prev, cand.id]);
                                    } else {
                                      setSelectedCandidateIds(prev => prev.filter(id => id !== cand.id));
                                    }
                                  }}
                                />
                              </td>
                              <td>
                                <div><strong>{cand.full_name}</strong></div>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{cand.email}</div>
                                {cand.phone && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>📞 {cand.phone}</div>}
                              </td>
                              <td>
                                <span className={`badge ${getStatusBadge(cand.status)}`} style={{ fontSize: "0.75rem" }}>
                                  {cand.status}
                                </span>
                              </td>
                              <td>
                                {cand.status === "CV_SCORED" || cand.status === "PASSED" || cand.status === "REJECTED" ? (
                                  <span style={{ fontWeight: 700, color: "var(--accent-cyan)" }}>
                                    Scored
                                  </span>
                                ) : (
                                  <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                                    Not scored
                                  </span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                  <button
                                    className="btn-ghost"
                                    style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                                    onClick={() => scoreCandidates(cand.id)}
                                  >
                                    ⚡ Score CV
                                  </button>
                                  {(cand.status === "CV_SCORED" || cand.status === "PASSED" || cand.status === "REJECTED") && (
                                    <button
                                      className="btn-primary"
                                      style={{ padding: "4px 8px", fontSize: "0.75rem", background: "rgba(6,182,212,0.15)", color: "var(--accent-cyan)", border: "1px solid rgba(6,182,212,0.3)" }}
                                      onClick={() => viewCandidateScoreDetail(cand.id)}
                                    >
                                      🔍 View Score
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── CANDIDATE SCORE BREAKDOWN MODAL ── */}
            {selectedCandidateScoreDetail && (
              <div style={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.8)", zIndex: 1000,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "24px",
              }}>
                <div className="glass-card" style={{
                  width: "100%", maxWidth: "800px", maxHeight: "90vh",
                  overflowY: "auto", padding: "28px", display: "flex", flexDirection: "column", gap: "20px"
                }}>
                  {/* Modal Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
                    <div>
                      <h2 style={{ fontSize: "1.3rem", fontWeight: 800 }}>
                        Score Breakdown: {selectedCandidateScoreDetail.candidate?.full_name}
                      </h2>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "2px" }}>
                        Email: {selectedCandidateScoreDetail.candidate?.email}
                      </p>
                    </div>
                    <button
                      className="btn-ghost"
                      onClick={() => setSelectedCandidateScoreDetail(null)}
                      style={{ fontSize: "1.2rem", padding: "4px 12px" }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Overall score ring */}
                  <div style={{ display: "flex", gap: "24px", alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", padding: "20px" }}>
                    <div style={{
                      width: "80px", height: "80px", borderRadius: "50%",
                      border: "4px solid var(--accent-cyan)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-cyan)"
                    }}>
                      {selectedCandidateScoreDetail.cv_score?.score || 0}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                        <span className="badge badge-green" style={{ fontSize: "0.8rem" }}>
                          Badge: {selectedCandidateScoreDetail.cv_score?.badge || "GAP"}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        <strong>AI Reasoning summary:</strong> {selectedCandidateScoreDetail.cv_score?.ai_reasoning || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Rubric Criteria score list */}
                  <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>
                    Evaluation per Criterion (RAG-based)
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {Object.entries(selectedCandidateScoreDetail.cv_score?.score_breakdown || {}).map(([critName, data]: [string, any], idx) => (
                      <div key={idx} style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        borderRadius: "10px",
                        padding: "16px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{critName}</strong>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              Weight: {data.weight}%
                            </span>
                            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent-green)" }}>
                              {data.raw_score !== undefined ? `${data.raw_score}/10` : (data.score !== undefined ? `${data.score}/10` : "N/A")}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem" }}>
                          {data.evidence && (
                            <div style={{ background: "rgba(6,182,212,0.04)", borderLeft: "3px solid var(--accent-cyan)", padding: "8px 12px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                              <strong>Evidence Quote:</strong> "{data.evidence}"
                            </div>
                          )}
                          {data.reasoning && (
                            <div style={{ color: "var(--text-muted)" }}>
                              <strong>Reasoning:</strong> {data.reasoning}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      className="btn-primary"
                      onClick={() => setSelectedCandidateScoreDetail(null)}
                      style={{ padding: "8px 24px" }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Batch Upload ──────────────────────────────────── */}
        {tab === "upload" && (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "8px" }}>Batch Evaluate CVs</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "28px" }}>
              Upload a .zip of CV files → AI scores all of them in background
            </p>

            {!activeCampaign && (
              <div className="glass-card" style={{ padding: "24px", marginBottom: "20px", borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.05)" }}>
                <p style={{ color: "#f59e0b", fontSize: "0.875rem" }}>
                  ⚠️ Select a campaign from the Campaigns tab first.
                </p>
              </div>
            )}

            {activeCampaign && (
              <div className="glass-card" style={{ padding: "24px", marginBottom: "20px", borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.05)" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "4px" }}>Active campaign</p>
                <p style={{ fontWeight: 700, fontSize: "1rem" }}>{activeCampaign.title}</p>
              </div>
            )}

            {/* Upload Zone */}
            <div
              id="zip-upload-zone"
              className="upload-zone"
              style={{ marginBottom: "20px" }}
              onClick={() => document.getElementById("zip-input")?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); }}
              onDragLeave={e => e.currentTarget.classList.remove("drag-over")}
              onDrop={e => {
                e.preventDefault();
                e.currentTarget.classList.remove("drag-over");
                const f = e.dataTransfer.files[0];
                if (f?.name.endsWith(".zip")) setBatchFile(f);
                else showToast("Please drop a .zip file", "err");
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📦</div>
              <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                {batchFile ? batchFile.name : "Drop your CV zip here"}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                {batchFile ? `${(batchFile.size / 1024 / 1024).toFixed(1)} MB` : "or click to browse · .zip files only"}
              </div>
              <input
                id="zip-input"
                type="file"
                accept=".zip"
                style={{ display: "none" }}
                onChange={e => setBatchFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <button
              id="btn-start-batch"
              className="btn-primary"
              onClick={startBatch}
              disabled={!activeCampaign || !batchFile}
            >
              🚀 Start Batch Evaluation
            </button>

            {batchStatus && (
              <div className="glass-card" style={{ padding: "16px", marginTop: "20px", borderColor: "rgba(16,185,129,0.3)", color: "#10b981", fontWeight: 600 }}>
                {batchStatus}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Leaderboard ──────────────────────────────────── */}
        {tab === "leaderboard" && (
          <div className="animate-fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
              <div>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                  🏆 Leaderboard
                </h1>
                {activeCampaign && (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: 4 }}>
                    {activeCampaign.title}
                  </p>
                )}
              </div>
              {activeCampaign && (
                <button className="btn-ghost" onClick={() => loadLeaderboard(activeCampaign)}>
                  ↻ Refresh
                </button>
              )}
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
              {loading ? (
                <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: "52px" }} />)}
                </div>
              ) : candidates.length === 0 ? (
                <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🏆</div>
                  <div>No candidates scored yet. Run a Batch Evaluation first.</div>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: "48px" }}>#</th>
                      <th>Candidate</th>
                      <th>Email</th>
                      <th>Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c, idx) => (
                      <tr key={c.id}>
                        <td style={{ color: "var(--text-muted)", fontWeight: 700 }}>
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                        </td>
                        <td style={{ fontWeight: 600 }}>{c.full_name}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{c.email}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div className={`score-ring ${getScoreClass(c.overall_score)}`}>
                              {Number(c.overall_score).toFixed(0)}
                            </div>
                            <div className="progress-bar" style={{ flex: 1, maxWidth: "120px" }}>
                              <div
                                className="progress-fill"
                                style={{ width: `${c.overall_score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(c.status)}`}>{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
