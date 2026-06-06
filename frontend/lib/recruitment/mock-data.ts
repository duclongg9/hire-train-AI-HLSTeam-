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

export interface ScoreBreakdownItem {
  score: number;
  max: number;
  reason: string;
}

export interface Candidate {
  id: string
  name: string
  email: string
  position: string
  source: "LinkedIn" | "Website" | "Referral" | "Job Board"
  cvScore: number
  score_breakdown?: {
    experience: ScoreBreakdownItem;
    hard_skills: ScoreBreakdownItem;
    soft_skills: ScoreBreakdownItem;
  }
  action_recommendation?: "auto_shortlist" | "auto_reject" | "manual_review"
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
  strengths: { trait: string; evidence: string }[]
  weaknesses: { trait: string; evidence: string }[]
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
    id: "camp-retail-2026",
    name: "Chiến dịch Tuyển dụng Q3/2026",
    jobTitle: "Chuyên viên Quan hệ Khách hàng Cá nhân",
    deadline: "2026-07-15",
    activeCandidates: 350,
  },
  {
    id: "camp-teller-2026",
    name: "Tuyển dụng Giao dịch viên Toàn quốc",
    jobTitle: "Giao dịch viên",
    deadline: "2026-06-30",
    activeCandidates: 1200,
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
    name: "Nguyễn Văn An",
    email: "an.nguyen@example.com",
    position: "Chuyên viên Quan hệ Khách hàng Cá nhân",
    source: "LinkedIn",
    cvScore: 94,
    score_breakdown: {
      experience: { score: 25, max: 30, reason: "Có 3 năm kinh nghiệm tín dụng, đạt yêu cầu 2-5 năm" },
      hard_skills: { score: 49, max: 50, reason: "Đầy đủ Tín dụng, Huy động. Từng quản lý danh mục > 50 tỷ." },
      soft_skills: { score: 20, max: 20, reason: "Kỹ năng thuyết phục, đàm phán rất tốt." }
    },
    action_recommendation: "auto_shortlist",
    testScore: 88,
    interviewScore: 91,
    totalScore: 91,
    matchedSkills: ["Tín dụng", "Huy động vốn", "Thuyết phục", "Đàm phán"],
    missingSkills: ["Kinh nghiệm bán chéo bảo hiểm"],
    status: "Interview",
    progress: 92,
    yearsExperience: 3,
    salaryExpectation: "15,000,000 VND",
    aiRecommendation: "Phù hợp cao. Kinh nghiệm tín dụng tốt, giao tiếp tự tin.",
    strengths: [
      { trait: "Hiểu biết sâu sản phẩm vay", evidence: "Đã giải ngân >50 tỷ tín dụng tại VIB." },
      { trait: "Kỹ năng tư vấn tốt", evidence: "Top 3 Sales chi nhánh quý 1/2026." },
      { trait: "Đã có tệp khách hàng", evidence: "Quản lý danh mục 100+ khách VIP." }
    ],
    weaknesses: [
      { trait: "Chưa mạnh mảng bảo hiểm liên kết (Bancassurance)", evidence: "Doanh số bảo hiểm năm trước chỉ đạt 200tr." }
    ],
    riskFlags: [],
    reasoning: [
      "CV thể hiện rõ doanh số huy động và tín dụng tại ngân hàng cũ.",
      "Bài test đạt điểm cao ở phần xử lý tình huống nợ xấu.",
      "Vòng phỏng vấn trả lời thuyết phục các câu hỏi về đánh giá tài chính cá nhân.",
    ],
  },
  {
    id: "cand-002",
    name: "Trần Thị Bình",
    email: "binh.tran@example.com",
    position: "Chuyên viên Quan hệ Khách hàng Cá nhân",
    source: "Referral",
    cvScore: 89,
    score_breakdown: {
      experience: { score: 20, max: 30, reason: "Mới 2 năm kinh nghiệm (Mức tối thiểu)" },
      hard_skills: { score: 49, max: 50, reason: "Bán chéo rất mạnh, huy động tốt. Thiếu tín dụng thế chấp." },
      soft_skills: { score: 20, max: 20, reason: "Giao tiếp xuất sắc, ngoại hình sáng." }
    },
    action_recommendation: "auto_shortlist",
    testScore: 92,
    interviewScore: 86,
    totalScore: 89,
    matchedSkills: ["Giao tiếp", "Bán chéo", "Chăm sóc khách hàng"],
    missingSkills: ["Thẩm định hồ sơ vay mua nhà"],
    status: "Offer",
    progress: 100,
    yearsExperience: 2,
    salaryExpectation: "12,000,000 VND",
    aiRecommendation: "Đề xuất Offer. Ưu thế bán chéo thẻ tín dụng và kỹ năng mềm xuất sắc.",
    strengths: [
      { trait: "Bán chéo thẻ tín dụng cực tốt", evidence: "Phát hành thành công 50 thẻ tín dụng/tháng liên tiếp." },
      { trait: "Thái độ phục vụ chuyên nghiệp", evidence: "Được khách hàng khen ngợi trên hệ thống CSKH 5 lần." },
      { trait: "Mở rộng nguồn KH", evidence: "Chuyển hóa tốt từ tệp data Telesales sang KH cá nhân." }
    ],
    weaknesses: [
      { trait: "Ít kinh nghiệm xử lý hồ sơ thế chấp lớn", evidence: "Giá trị trung bình mỗi hợp đồng vay < 500tr." }
    ],
    riskFlags: [],
    reasoning: [
      "Được nội bộ giới thiệu, đã từng làm Telesales tài chính.",
      "Nắm chắc các quy định về thẻ tín dụng và tiền gửi.",
      "Cần đào tạo thêm nghiệp vụ vay mua nhà/ô tô khi onboard.",
    ],
  },
  {
    id: "cand-003",
    name: "Lê Hoàng Cường",
    email: "cuong.le@example.com",
    position: "Chuyên viên Quan hệ Khách hàng Cá nhân",
    source: "Job Board",
    cvScore: 76,
    score_breakdown: {
      experience: { score: 10, max: 30, reason: "Chỉ có 1 năm kinh nghiệm tại tổ chức tín dụng nhỏ" },
      hard_skills: { score: 46, max: 50, reason: "Biết làm tín dụng tiêu dùng. Thiếu huy động dài hạn." },
      soft_skills: { score: 20, max: 20, reason: "Năng động, đi thị trường tốt." }
    },
    action_recommendation: "manual_review",
    testScore: 71,
    interviewScore: 68,
    totalScore: 72,
    matchedSkills: ["Tín dụng tiêu dùng", "Giao tiếp cơ bản"],
    missingSkills: ["Huy động vốn dài hạn", "Bảo hiểm"],
    status: "CV Screening",
    progress: 61,
    yearsExperience: 1,
    salaryExpectation: "10,000,000 VND",
    aiRecommendation: "Xem xét kỹ. Chỉ mạnh về vay tiêu dùng tín chấp nhỏ lẻ.",
    strengths: [
      { trait: "Kinh nghiệm mở rộng tệp khách hàng thực tế", evidence: "Tự khai thác 50 khách hàng mới tín dụng tiêu dùng trong 6 tháng." },
      { trait: "Kinh nghiệm thị trường", evidence: "Phụ trách khu vực vùng ven, thường xuyên chốt khách tại địa bàn." }
    ],
    weaknesses: [
      { trait: "Thiếu kỹ năng tư vấn khách VIP", evidence: "Chưa từng tiếp xúc KH phân khúc tài sản > 5 tỷ." },
      { trait: "Chưa có kinh nghiệm huy động sổ tiết kiệm", evidence: "Doanh số huy động gần như bằng 0 trong CV." }
    ],
    riskFlags: ["Chuyển việc 3 lần trong 1 năm qua"],
    reasoning: [
      "Chỉ làm việc tại công ty tài chính, chưa có kinh nghiệm ngân hàng chính thống.",
      "Bài test kiến thức ngân hàng bán lẻ ở mức trung bình.",
      "Phù hợp với nhóm khách hàng mass hơn là phân khúc cao cấp.",
    ],
  },
  {
    id: "cand-004",
    name: "Phạm Minh Đức",
    email: "duc.pham@example.com",
    position: "Chuyên viên Quan hệ Khách hàng Cá nhân",
    source: "Website",
    cvScore: 82,
    score_breakdown: {
      experience: { score: 30, max: 30, reason: "Kinh nghiệm 4 năm quản lý tài sản" },
      hard_skills: { score: 35, max: 50, reason: "Chỉ làm huy động, đầu tư. Không có kinh nghiệm cho vay." },
      soft_skills: { score: 17, max: 20, reason: "Tác phong chững chạc, tạo niềm tin." }
    },
    action_recommendation: "auto_shortlist",
    testScore: 79,
    interviewScore: 80,
    totalScore: 80,
    matchedSkills: ["Huy động vốn", "Đầu tư", "Phân tích tài chính"],
    missingSkills: ["Vay thế chấp doanh nghiệp siêu nhỏ"],
    status: "Test Sent",
    progress: 74,
    yearsExperience: 4,
    salaryExpectation: "18,000,000 VND",
    aiRecommendation: "Giữ lại Pipeline. Điểm huy động vốn cao, tập trung phỏng vấn kỹ năng chốt sale.",
    strengths: [
      { trait: "Kinh nghiệm tư vấn trái phiếu và quỹ đầu tư", evidence: "Làm việc 4 năm tại công ty chứng khoán, quản lý tài sản khách hàng." },
      { trait: "Khả năng phân tích tài chính", evidence: "Có chứng chỉ CFA Level 1." }
    ],
    weaknesses: [
      { trait: "Thiếu kinh nghiệm cho vay", evidence: "Chưa từng làm hồ sơ vay vốn tín chấp hay thế chấp." }
    ],
    riskFlags: [],
    reasoning: [
      "Từng làm môi giới chứng khoán chuyển sang.",
      "Có tư duy tốt về quản lý gia sản (Wealth Management).",
      "Bài test chưa làm xong phần quy trình giải ngân.",
    ],
  },
  {
    id: "cand-005",
    name: "Hoàng Thị Em",
    email: "em.hoang@example.com",
    position: "Chuyên viên Quan hệ Khách hàng Cá nhân",
    source: "LinkedIn",
    cvScore: 55,
    score_breakdown: {
      experience: { score: 0, max: 30, reason: "Sinh viên mới ra trường, 0 kinh nghiệm." },
      hard_skills: { score: 40, max: 50, reason: "Trái ngành, không có kỹ năng ngân hàng." },
      soft_skills: { score: 15, max: 20, reason: "Trình bày rõ ràng nhưng chưa thể hiện kỹ năng sale." }
    },
    action_recommendation: "auto_reject",
    testScore: 40,
    interviewScore: 0,
    totalScore: 45,
    matchedSkills: ["Tin học văn phòng"],
    missingSkills: ["Nghiệp vụ Tín dụng", "Kiến thức Ngân hàng", "Giao tiếp bán hàng"],
    status: "Rejected",
    progress: 100,
    yearsExperience: 0,
    salaryExpectation: "8,000,000 VND",
    aiRecommendation: "Loại hồ sơ. Trái ngành và không có kinh nghiệm liên quan.",
    strengths: [
      { trait: "Sử dụng tốt tin học văn phòng", evidence: "Có chứng chỉ MOS Excel 900 điểm." }
    ],
    weaknesses: [
      { trait: "Không có kinh nghiệm Sale", evidence: "Chỉ tham gia CLB trường, không có kinh nghiệm thực tế." },
      { trait: "Trái ngành", evidence: "Tốt nghiệp ngành Văn học." }
    ],
    riskFlags: ["Hoàn toàn không có bằng cấp tài chính kinh tế"],
    reasoning: [
      "Sinh viên mới tốt nghiệp ngành kỹ thuật, không có kinh nghiệm sales/ngân hàng.",
      "Điểm bài test kiến thức quá thấp (40/100).",
      "Hệ thống tự động từ chối.",
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
