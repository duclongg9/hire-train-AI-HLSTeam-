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

type Tab = "campaigns" | "leaderboard" | "upload";

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
            className={`sidebar-nav-item ${tab === item.key ? "active" : ""}`}
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
                        <td style={{ fontWeight: 600 }}>{c.title}</td>
                        <td><span className={`badge ${getStatusBadge(c.status)}`}>{c.status}</span></td>
                        <td>
                          {c.rubric_schema
                            ? <span className="badge badge-green">✓ Defined</span>
                            : <span className="badge badge-gray">Not set</span>}
                        </td>
                        <td style={{ display: "flex", gap: "8px" }}>
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
