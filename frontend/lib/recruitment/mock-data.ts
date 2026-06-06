export type UserRole = "Admin" | "HR Manager"
export type AccountStatus = "Active" | "Disabled" | "Pending"
export type CandidateStatus =
  | "Applied"
  | "CV Screening"
  | "Test Sent"
  | "Interview"
  | "Offer"
  | "Rejected"

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: AccountStatus
  lastLogin: string
}

export interface SystemLog {
  id: string
  time: string
  user: string
  action: string
  device: string
  severity: "Info" | "Warning" | "Critical"
}

export interface RubricSkill {
  id: string
  name: string
  category: string
  weight: number
  evidence: string
}

export interface TestQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  difficulty: "Easy" | "Medium" | "Hard"
  relatedSkill: string
}

export interface Candidate {
  id: string
  name: string
  email: string
  position: string
  source: "LinkedIn" | "Website" | "Referral" | "Job Board"
  cvScore: number
  testScore: number
  interviewScore: number
  totalScore: number
  matchedSkills: string[]
  missingSkills: string[]
  status: CandidateStatus
  progress: number
  yearsExperience: number
  salaryExpectation?: string
  aiRecommendation: string
  strengths: string[]
  weaknesses: string[]
  riskFlags: string[]
  reasoning: string[]
}

export const adminUsers: AdminUser[] = [
  {
    id: "u-001",
    name: "Linh Tran",
    email: "linh.tran@hiretrain.ai",
    role: "Admin",
    status: "Active",
    lastLogin: "Jun 04, 2026 08:12",
  },
  {
    id: "u-002",
    name: "Minh Pham",
    email: "minh.pham@hiretrain.ai",
    role: "HR Manager",
    status: "Active",
    lastLogin: "Jun 04, 2026 07:45",
  },
  {
    id: "u-003",
    name: "Hoa Nguyen",
    email: "hoa.nguyen@hiretrain.ai",
    role: "HR Manager",
    status: "Pending",
    lastLogin: "Never",
  },
  {
    id: "u-004",
    name: "Anh Le",
    email: "anh.le@hiretrain.ai",
    role: "HR Manager",
    status: "Disabled",
    lastLogin: "May 31, 2026 17:20",
  },
]

export const systemLogs: SystemLog[] = [
  {
    id: "log-001",
    time: "Jun 04, 2026 08:24",
    user: "Minh Pham",
    action: "Published Senior Frontend Engineer test",
    device: "Chrome on Windows, 10.24.11.8",
    severity: "Info",
  },
  {
    id: "log-002",
    time: "Jun 04, 2026 08:01",
    user: "Hoa Nguyen",
    action: "Password verification failed 3 times before bulk email send",
    device: "Edge on Windows, 10.24.11.19",
    severity: "Critical",
  },
  {
    id: "log-003",
    time: "Jun 03, 2026 18:42",
    user: "System",
    action: "Created 12 interview tokens for Product Analyst campaign",
    device: "Server job",
    severity: "Info",
  },
  {
    id: "log-004",
    time: "Jun 03, 2026 16:20",
    user: "Anh Le",
    action: "Disabled inactive HR account",
    device: "Chrome on macOS, 10.24.11.31",
    severity: "Warning",
  },
]

export const campaigns = [
  {
    id: "camp-frontend-2026",
    name: "Q3 Frontend Hiring",
    jobTitle: "Senior Frontend Engineer",
    deadline: "2026-07-15",
    activeCandidates: 42,
  },
  {
    id: "camp-cx-2026",
    name: "Customer Experience Scale-up",
    jobTitle: "CX Specialist",
    deadline: "2026-06-30",
    activeCandidates: 31,
  },
]

export const extractedSkills: RubricSkill[] = [
  {
    id: "react",
    name: "React architecture",
    category: "Technical",
    weight: 25,
    evidence: "JD asks for component design, state management, and performance work.",
  },
  {
    id: "typescript",
    name: "TypeScript quality",
    category: "Technical",
    weight: 20,
    evidence: "Role requires typed contracts across shared frontend modules.",
  },
  {
    id: "product",
    name: "Product thinking",
    category: "Business",
    weight: 15,
    evidence: "Candidate should translate product metrics into UI decisions.",
  },
  {
    id: "collaboration",
    name: "Cross-functional collaboration",
    category: "Behavioral",
    weight: 20,
    evidence: "JD mentions working with HR, product, design, and backend teams.",
  },
  {
    id: "testing",
    name: "Testing discipline",
    category: "Technical",
    weight: 20,
    evidence: "Role owns regression-safe delivery for critical recruitment flows.",
  },
]

export const testQuestions: TestQuestion[] = [
  {
    id: "q-01",
    question: "Which pattern best reduces unnecessary renders in a large candidate table?",
    options: ["Inline all callbacks", "Memoize row components and stable handlers", "Store every row in URL params", "Disable React strict mode"],
    correctAnswer: "Memoize row components and stable handlers",
    difficulty: "Medium",
    relatedSkill: "React architecture",
  },
  {
    id: "q-02",
    question: "What is the safest type for a finite candidate status set?",
    options: ["string", "any", "Union of literal statuses", "object"],
    correctAnswer: "Union of literal statuses",
    difficulty: "Easy",
    relatedSkill: "TypeScript quality",
  },
  {
    id: "q-03",
    question: "A rubric total is 96%. What should the UI do?",
    options: ["Auto-publish", "Warn and keep save disabled", "Ignore the total", "Round in the database"],
    correctAnswer: "Warn and keep save disabled",
    difficulty: "Easy",
    relatedSkill: "Product thinking",
  },
  {
    id: "q-04",
    question: "Which test best protects a public apply flow?",
    options: ["Only snapshot tests", "Validation and happy-path form tests", "Manual QA only", "No tests for public pages"],
    correctAnswer: "Validation and happy-path form tests",
    difficulty: "Medium",
    relatedSkill: "Testing discipline",
  },
  {
    id: "q-05",
    question: "How should a team handle unclear API states for AI processing?",
    options: ["Hide the section", "Represent loading, empty, success, and error states", "Block all navigation", "Ask users to refresh"],
    correctAnswer: "Represent loading, empty, success, and error states",
    difficulty: "Easy",
    relatedSkill: "Product thinking",
  },
  {
    id: "q-06",
    question: "What makes an interview report actionable for HR?",
    options: ["A single final score", "Transcript, evidence, score breakdown, and recommendation", "Only the transcript", "Only charts"],
    correctAnswer: "Transcript, evidence, score breakdown, and recommendation",
    difficulty: "Medium",
    relatedSkill: "Product thinking",
  },
  {
    id: "q-07",
    question: "Which approach is safest for a bulk email action?",
    options: ["Send immediately", "Require secondary verification before sending", "Ask candidates to confirm", "Disable logs"],
    correctAnswer: "Require secondary verification before sending",
    difficulty: "Medium",
    relatedSkill: "Cross-functional collaboration",
  },
  {
    id: "q-08",
    question: "Which signal most clearly indicates a risky CV match?",
    options: ["Strong overlap and clear evidence", "Missing required skills and unexplained gaps", "Referral source", "High test score"],
    correctAnswer: "Missing required skills and unexplained gaps",
    difficulty: "Easy",
    relatedSkill: "Product thinking",
  },
  {
    id: "q-09",
    question: "What is the best fallback if WebRTC reconnect fails for 5 minutes?",
    options: ["Keep recording forever", "End or fail the session with a clear state", "Delete the application", "Reload silently"],
    correctAnswer: "End or fail the session with a clear state",
    difficulty: "Hard",
    relatedSkill: "Testing discipline",
  },
  {
    id: "q-10",
    question: "Which UI is most appropriate for comparing 2-5 candidates?",
    options: ["One long paragraph", "Side-by-side columns with shared rows", "A hidden CSV", "A pie chart only"],
    correctAnswer: "Side-by-side columns with shared rows",
    difficulty: "Easy",
    relatedSkill: "Product thinking",
  },
  {
    id: "q-11",
    question: "What should happen when a candidate test timer reaches zero?",
    options: ["Allow edits", "Auto-submit and lock answers", "Reset all answers", "Navigate home without notice"],
    correctAnswer: "Auto-submit and lock answers",
    difficulty: "Medium",
    relatedSkill: "Testing discipline",
  },
  {
    id: "q-12",
    question: "A scanned JD PDF has no selectable text. What is the correct UI response?",
    options: ["Pretend analysis succeeded", "Show a clear upload error", "Create an empty rubric", "Crash the page"],
    correctAnswer: "Show a clear upload error",
    difficulty: "Easy",
    relatedSkill: "Product thinking",
  },
]

export const candidates: Candidate[] = [
  {
    id: "cand-001",
    name: "Nguyen Van An",
    email: "an.nguyen@example.com",
    position: "Senior Frontend Engineer",
    source: "LinkedIn",
    cvScore: 94,
    testScore: 88,
    interviewScore: 91,
    totalScore: 91,
    matchedSkills: ["React", "TypeScript", "Testing", "Design systems"],
    missingSkills: ["GraphQL depth"],
    status: "Interview",
    progress: 92,
    yearsExperience: 6,
    salaryExpectation: "$5,500",
    aiRecommendation: "Strong hire. Evidence is consistent across CV, test, and interview.",
    strengths: ["Clear architecture decisions", "Strong test discipline", "Mentoring experience"],
    weaknesses: ["Limited GraphQL ownership"],
    riskFlags: [],
    reasoning: [
      "CV examples align with the JD's React architecture needs.",
      "Test score is high on state management and performance questions.",
      "Interview answers used specific tradeoffs instead of generic claims.",
    ],
  },
  {
    id: "cand-002",
    name: "Tran Thi Binh",
    email: "binh.tran@example.com",
    position: "Senior Frontend Engineer",
    source: "Referral",
    cvScore: 89,
    testScore: 92,
    interviewScore: 86,
    totalScore: 89,
    matchedSkills: ["TypeScript", "Accessibility", "Product thinking"],
    missingSkills: ["Large-scale dashboard work"],
    status: "Offer",
    progress: 100,
    yearsExperience: 5,
    salaryExpectation: "$5,200",
    aiRecommendation: "Recommended for offer with dashboard onboarding plan.",
    strengths: ["Excellent TypeScript answers", "Strong user empathy", "Accessible UI habits"],
    weaknesses: ["Less exposure to heavy data grids"],
    riskFlags: [],
    reasoning: [
      "Referral notes match interview evidence.",
      "Technical test shows reliable fundamentals.",
      "Would need ramp-up on large dashboard performance constraints.",
    ],
  },
  {
    id: "cand-003",
    name: "Le Hoang Cuong",
    email: "cuong.le@example.com",
    position: "Senior Frontend Engineer",
    source: "Job Board",
    cvScore: 76,
    testScore: 71,
    interviewScore: 68,
    totalScore: 72,
    matchedSkills: ["React", "CSS"],
    missingSkills: ["Testing", "System design", "TypeScript depth"],
    status: "CV Screening",
    progress: 61,
    yearsExperience: 4,
    salaryExpectation: "$4,300",
    aiRecommendation: "Consider for mid-level role, not current senior scope.",
    strengths: ["Fast implementation", "Good CSS layout sense"],
    weaknesses: ["Weak test coverage reasoning", "Shallow system design examples"],
    riskFlags: ["Employment gap needs clarification"],
    reasoning: [
      "CV uses many keywords but limited measurable outcomes.",
      "Test misses cases around validation and failure states.",
      "Interview examples are implementation-heavy, less strategic.",
    ],
  },
  {
    id: "cand-004",
    name: "Pham Minh Duc",
    email: "duc.pham@example.com",
    position: "Senior Frontend Engineer",
    source: "Website",
    cvScore: 82,
    testScore: 79,
    interviewScore: 80,
    totalScore: 80,
    matchedSkills: ["React", "Recharts", "Collaboration"],
    missingSkills: ["Security flows"],
    status: "Test Sent",
    progress: 74,
    yearsExperience: 5,
    salaryExpectation: "$4,900",
    aiRecommendation: "Keep in pipeline; ask focused security-flow questions.",
    strengths: ["Dashboard delivery experience", "Good stakeholder communication"],
    weaknesses: ["Needs stronger auth and security examples"],
    riskFlags: [],
    reasoning: [
      "Dashboard portfolio is relevant to HR manager workflows.",
      "Assessment is solid but misses edge cases in protected actions.",
      "Interview score can improve with clearer prioritization.",
    ],
  },
  {
    id: "cand-005",
    name: "Hoang Thi Em",
    email: "em.hoang@example.com",
    position: "Senior Frontend Engineer",
    source: "LinkedIn",
    cvScore: 65,
    testScore: 63,
    interviewScore: 0,
    totalScore: 64,
    matchedSkills: ["UI polish"],
    missingSkills: ["React architecture", "TypeScript", "Testing"],
    status: "Rejected",
    progress: 100,
    yearsExperience: 3,
    salaryExpectation: "$3,800",
    aiRecommendation: "Reject for this role; potential fit for junior product UI track.",
    strengths: ["Visual detail", "Quick prototyping"],
    weaknesses: ["Insufficient senior-level architecture evidence"],
    riskFlags: ["Portfolio projects not verifiable"],
    reasoning: [
      "Core senior requirements are not strongly evidenced.",
      "Test results fall below campaign threshold.",
      "Missing interview score because candidate did not complete the stage.",
    ],
  },
]

export const pipelineStages: CandidateStatus[] = [
  "Applied",
  "CV Screening",
  "Test Sent",
  "Interview",
  "Offer",
  "Rejected",
]

export const sourceData = [
  { name: "LinkedIn", value: 38, fill: "#0033A0" },
  { name: "Website", value: 24, fill: "#F37021" },
  { name: "Referral", value: 21, fill: "#16A34A" },
  { name: "Job Board", value: 17, fill: "#7C3AED" },
]

export const interviewTranscript = [
  {
    speaker: "AI Interviewer",
    time: "00:42",
    text: "Tell me about a dashboard performance issue you owned end to end.",
  },
  {
    speaker: "Candidate",
    time: "01:18",
    text: "I profiled slow candidate list renders, split heavy cells, memoized row actions, and moved filtering to indexed state.",
  },
  {
    speaker: "AI Interviewer",
    time: "04:05",
    text: "How did you decide which tradeoffs were acceptable for HR users?",
  },
  {
    speaker: "Candidate",
    time: "04:40",
    text: "We prioritized scan speed and status accuracy over decorative details, then validated with recruiters during weekly reviews.",
  },
]

export const radarData = [
  { skill: "Communication", score: 88, fullMark: 100 },
  { skill: "Technical Knowledge", score: 91, fullMark: 100 },
  { skill: "Problem Solving", score: 86, fullMark: 100 },
  { skill: "Culture Fit", score: 84, fullMark: 100 },
  { skill: "Confidence", score: 82, fullMark: 100 },
  { skill: "Clarity", score: 90, fullMark: 100 },
]

export const publicJob = {
  slug: "senior-frontend-engineer",
  title: "Senior Frontend Engineer",
  company: "HireTrain AI",
  location: "Hybrid, Ho Chi Minh City",
  deadline: "Jul 15, 2026",
  description:
    "Build responsive recruitment workflows for AI-assisted hiring teams, from public application pages to HR review dashboards.",
  requirements: [
    "5+ years building production React applications",
    "Strong TypeScript and component architecture",
    "Experience with forms, tables, charts, and protected actions",
    "Comfortable collaborating with product, design, and backend teams",
  ],
  benefits: [
    "Hybrid work setup",
    "Annual learning budget",
    "Modern AI product environment",
    "Private healthcare and performance bonus",
  ],
}
