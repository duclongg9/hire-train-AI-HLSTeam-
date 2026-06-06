export type ScoreMode = "stepper" | "range"

export interface RubricCriterion {
  id: string
  code: string
  name: string
  score: number
  scoreMode: ScoreMode
  description: string
  aiEnabled?: boolean
  deletable?: boolean
  activeEditor?: boolean
}

export interface RubricGroup {
  id: string
  title: string
  colorClass: string
  criteria: RubricCriterion[]
}

export interface InterviewCriterion {
  id: string
  index: number
  criterion: string
  description: string
  weight: number
  tone: string
  editing?: boolean
}

export interface InterviewRubricGroup {
  id: string
  name: string
  expanded: boolean
  criteria: InterviewCriterion[]
}

export const cvRubricGroups: RubricGroup[] = [
  {
    id: "group-a",
    title: "Nhóm A — Kiến thức nghiệp vụ",
    colorClass: "bg-emerald-50 text-emerald-950 border-emerald-200",
    criteria: [
      {
        id: "a1",
        code: "A1",
        name: "Kiểm click kiến thức nghiệp vụ",
        score: 3,
        scoreMode: "stepper",
        aiEnabled: true,
        description:
          "Định nghĩa / Ví dụ / Thang điểm AI chấm: ứng viên thể hiện hiểu biết về quy trình nghiệp vụ, chứng cứ từ CV và kinh nghiệm áp dụng thực tế.",
      },
      {
        id: "a2",
        code: "A2",
        name: "Kiểm click kiến thức nghiệp vụ",
        score: 5,
        scoreMode: "range",
        aiEnabled: true,
        description:
          "AI đánh giá mức độ phù hợp của kinh nghiệm với yêu cầu vị trí, ưu tiên ví dụ đo lường được và vai trò sở hữu rõ ràng.",
      },
      {
        id: "a3",
        code: "A3",
        name: "Kiểm click kiến thức nghiệp",
        score: 4,
        scoreMode: "stepper",
        activeEditor: true,
        description: "",
      },
    ],
  },
  {
    id: "group-b",
    title: "Nhóm B — Kiến thức nghiệp vụ",
    colorClass: "bg-cyan-50 text-cyan-950 border-cyan-200",
    criteria: [
      {
        id: "b1",
        code: "B1",
        name: "Điền thực bại",
        score: 2,
        scoreMode: "stepper",
        aiEnabled: true,
        description:
          "Mô tả dấu hiệu ứng viên có thể chuyển hóa kiến thức thành kết quả, nêu rõ ví dụ triển khai và kết quả đạt được.",
      },
      {
        id: "b2",
        code: "B2",
        name: "Điểm hiểu đánh trong gần nghiệp vụ",
        score: 6,
        scoreMode: "range",
        deletable: true,
        description:
          "Thang điểm tập trung vào khả năng phân tích tình huống nghiệp vụ, nhận diện rủi ro và đề xuất cải tiến có cơ sở.",
      },
    ],
  },
  {
    id: "group-c",
    title: "Nhóm C — Kiến thức nghiệp vụ",
    colorClass: "bg-rose-50 text-rose-950 border-rose-200",
    criteria: [
      {
        id: "c1",
        code: "C1",
        name: "Điểm click tiêu chí",
        score: 5,
        scoreMode: "stepper",
        aiEnabled: true,
        description:
          "AI chấm mức độ rõ ràng của thành tựu, vai trò cá nhân và sự liên quan tới tiêu chí tuyển dụng.",
      },
      {
        id: "c2",
        code: "C2",
        name: "Điểm click loạn mảnh tắt",
        score: 3,
        scoreMode: "stepper",
        deletable: true,
        description:
          "Mô tả cách loại trừ thông tin rời rạc, thiếu bằng chứng hoặc không có liên hệ trực tiếp tới yêu cầu công việc.",
      },
      {
        id: "c3",
        code: "C3",
        name: "Điểm chứng kiến thức nghiệp vụ",
        score: 4,
        scoreMode: "range",
        aiEnabled: true,
        description:
          "Thang điểm ưu tiên chứng chỉ, dự án và kết quả cụ thể chứng minh năng lực nghiệp vụ trong môi trường ngân hàng.",
      },
    ],
  },
]

export const interviewRubricGroups: InterviewRubricGroup[] = [
  {
    id: "product",
    name: "Product Knowledge",
    expanded: true,
    criteria: [
      {
        id: "pk-1",
        index: 1,
        criterion: "Technical Understanding (Score Level 1)",
        description: "Understand content and product knowledge.",
        weight: 30,
        tone: "bg-rose-50",
      },
      {
        id: "pk-2",
        index: 2,
        criterion: "Technical Understanding (Score Level 2)",
        description: "Understand introductory volumes and markets.",
        weight: 25,
        tone: "bg-orange-50",
      },
      {
        id: "pk-3",
        index: 3,
        criterion: "Technical Understanding (Score Level 3)",
        description: "Connect product features with customer problems and explain tradeoffs.",
        weight: 10,
        tone: "bg-emerald-50",
        editing: true,
      },
      {
        id: "pk-4",
        index: 4,
        criterion: "Technical Understanding (Score Level 4)",
        description: "Shows confident comparison of product packages, risks, and compliance impact.",
        weight: 10,
        tone: "bg-sky-50",
      },
      {
        id: "pk-5",
        index: 5,
        criterion: "Technical Understanding (Score Level 5)",
        description: "Can coach others and localize product positioning by segment.",
        weight: 10,
        tone: "bg-violet-50",
      },
      {
        id: "pk-6",
        index: 6,
        criterion: "Persuasion & Objection (Score Level 3)",
        description: "Persuasion & objection handling adds elements of digital product handling.",
        weight: 5,
        tone: "bg-slate-50",
      },
    ],
  },
  {
    id: "sales",
    name: "Sales Skills",
    expanded: false,
    criteria: [
      {
        id: "ss-1",
        index: 1,
        criterion: "Persuasion & Objection Handling",
        description: "Responds to common concerns with structured evidence.",
        weight: 35,
        tone: "bg-rose-50",
      },
      {
        id: "ss-2",
        index: 2,
        criterion: "Persuasion & Objection Handling",
        description: "Balances customer empathy and product explanation.",
        weight: 30,
        tone: "bg-orange-50",
      },
      {
        id: "ss-3",
        index: 3,
        criterion: "Customers & Objection Handling",
        description: "Uses digital product examples to close the conversation.",
        weight: 25,
        tone: "bg-emerald-50",
      },
    ],
  },
  {
    id: "accordion",
    name: "Accordion Grid",
    expanded: false,
    criteria: [],
  },
]
