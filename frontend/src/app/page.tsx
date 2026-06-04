import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 60% 20%, rgba(99,102,241,0.12) 0%, transparent 60%), var(--bg-primary)",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      {/* Hero Badge */}
      <div className="badge badge-purple animate-fade-in" style={{ marginBottom: "24px", fontSize: "0.75rem", padding: "5px 14px" }}>
        ✦ Powered by AWS AI Services + WebRTC
      </div>

      {/* Headline */}
      <h1
        className="animate-fade-in"
        style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08, marginBottom: "20px", animationDelay: "0.05s" }}
      >
        <span className="gradient-text">HireTrain AI</span>
        <br />
        <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: "0.55em" }}>
          Intelligent Recruitment Platform
        </span>
      </h1>

      <p
        className="animate-fade-in"
        style={{ fontSize: "1.05rem", color: "var(--text-secondary)", maxWidth: "520px", lineHeight: 1.7, marginBottom: "48px", animationDelay: "0.1s" }}
      >
        Screen hundreds of CVs in seconds. Run AI-powered voice interviews. Build the best teams — smarter, faster.
      </p>

      {/* Portal Cards */}
      <div
        className="animate-fade-in"
        style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center", animationDelay: "0.15s" }}
      >
        <Link href="/hr-portal" style={{ textDecoration: "none" }}>
          <div
            className="glass-card"
            style={{ padding: "32px 40px", cursor: "pointer", minWidth: "220px" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🏢</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "6px" }}>HR Portal</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Manage campaigns & candidates</div>
          </div>
        </Link>

        <Link href="/candidate" style={{ textDecoration: "none" }}>
          <div
            className="glass-card"
            style={{ padding: "32px 40px", cursor: "pointer", minWidth: "220px" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>🎤</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "6px" }}>Candidate Portal</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Submit CV & voice interview</div>
          </div>
        </Link>
      </div>

      {/* Feature tags */}
      <div
        className="animate-fade-in"
        style={{ display: "flex", gap: "10px", marginTop: "48px", flexWrap: "wrap", justifyContent: "center", animationDelay: "0.2s" }}
      >
        {["Batch CV Scoring", "AI Rubric Builder", "WebRTC Interview", "Leaderboard", "AWS S3"].map(f => (
          <span key={f} className="badge badge-gray">{f}</span>
        ))}
      </div>
    </main>
  );
}
