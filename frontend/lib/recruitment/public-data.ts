export interface Job {
  id: string
  slug: string
  title: string
  shortDescription: string
  department: string
  location: string
  type: string
  deadline: string
  quantity: number
  responsibilities: string[]
  requirements: string[]
  benefits: string[]
  otherInfo: string[]
}

export interface CandidateApplication {
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  workLocation: string
  cvFileName?: string
}

export const shbJobs: Job[] = [
  {
    id: "457696",
    slug: "chuyen-gia-quan-ly-he-thong-van-ban",
    title: "Chuyên gia Quản lý hệ thống văn bản - Khối Pháp chế và Tuân thủ",
    shortDescription:
      "Quản lý hệ thống văn bản nội bộ, phối hợp rà soát quy định và chuẩn hóa quy trình tuân thủ trên toàn hệ thống SHB.",
    department: "Khối Pháp chế và Tuân thủ",
    location: "Hà Nội",
    type: "Toàn thời gian",
    deadline: "04/07/2026",
    quantity: 3,
    responsibilities: [
      "Tư vấn, kiểm soát dự thảo văn bản nội bộ bảo đảm tính đồng bộ, khả thi và tuân thủ pháp luật.",
      "Đầu mối làm việc với Công nghệ thông tin để tối ưu tra cứu văn bản trên hệ thống.",
      "Rà soát hệ thống văn bản định kỳ, tổng hợp kết quả đánh giá và đề xuất quy hoạch văn bản.",
      "Theo dõi văn bản quy phạm pháp luật có ảnh hưởng đến hoạt động ngân hàng.",
    ],
    requirements: [
      "Tốt nghiệp đại học trở lên chuyên ngành Luật, Kinh tế hoặc các ngành liên quan.",
      "Có tối thiểu 2 năm kinh nghiệm pháp chế ngân hàng hoặc 3 năm kinh nghiệm pháp chế doanh nghiệp.",
      "Am hiểu Luật các Tổ chức tín dụng, Luật Doanh nghiệp và quy định pháp luật liên quan.",
      "Kỹ năng soạn thảo văn bản, thuyết trình, giao tiếp và đàm phán tốt.",
    ],
    benefits: [
      "Chế độ lương thưởng cạnh tranh theo năng lực và hiệu quả công việc.",
      "Bảo hiểm, chăm sóc sức khỏe, đào tạo và lộ trình phát triển rõ ràng.",
      "Môi trường làm việc nhân văn, chuyên nghiệp, gắn với chuyển đổi số ngân hàng.",
    ],
    otherInfo: [
      "Số lượng tuyển: 3",
      "Cấp bậc: Chuyên gia/CVCC",
      "Hình thức phỏng vấn: Bài đánh giá năng lực và phỏng vấn AI trước vòng HR.",
    ],
  },
  {
    id: "457701",
    slug: "chuyen-vien-giai-phap-thanh-toan",
    title: "Chuyên viên Giải pháp thanh toán",
    shortDescription:
      "Triển khai giải pháp thanh toán số, phối hợp với đơn vị kinh doanh để phát triển sản phẩm dịch vụ cho khách hàng doanh nghiệp.",
    department: "Khối Ngân hàng số",
    location: "Hà Nội",
    type: "Toàn thời gian",
    deadline: "05/07/2026",
    quantity: 1,
    responsibilities: [
      "Phân tích nhu cầu thanh toán của khách hàng và đề xuất giải pháp phù hợp.",
      "Phối hợp với đội sản phẩm, công nghệ và kinh doanh để triển khai dịch vụ mới.",
      "Theo dõi hiệu quả vận hành, hỗ trợ xử lý vướng mắc trong quá trình sử dụng.",
    ],
    requirements: [
      "Có kinh nghiệm trong lĩnh vực thanh toán, ngân hàng số hoặc sản phẩm tài chính.",
      "Kỹ năng phân tích yêu cầu, giao tiếp khách hàng và quản lý triển khai tốt.",
      "Ưu tiên ứng viên có hiểu biết về API, QR, POS hoặc cổng thanh toán.",
    ],
    benefits: [
      "Thưởng hiệu quả kinh doanh và các chương trình thi đua nội bộ.",
      "Đào tạo chuyên sâu về ngân hàng số và sản phẩm thanh toán.",
      "Cơ hội làm việc với các dự án chuyển đổi số quy mô lớn.",
    ],
    otherInfo: ["Số lượng tuyển: 1", "Cấp bậc: Chuyên viên", "Báo cáo trực tiếp cho Trưởng nhóm sản phẩm."],
  },
  {
    id: "457702",
    slug: "chuyen-vien-tu-van-tai-chinh-ca-nhan-ha-noi",
    title: "Chuyên viên Tư vấn Tài chính cá nhân - Khu vực Hà Nội",
    shortDescription:
      "Tư vấn sản phẩm tài chính cá nhân, mở rộng tệp khách hàng và chăm sóc khách hàng theo chuẩn dịch vụ SHB.",
    department: "Khối Ngân hàng Bán lẻ",
    location: "Hà Nội",
    type: "Toàn thời gian",
    deadline: "04/07/2026",
    quantity: 10,
    responsibilities: [
      "Tìm kiếm, tư vấn và chăm sóc khách hàng cá nhân.",
      "Giới thiệu các sản phẩm thẻ, vay tiêu dùng, tiền gửi và ngân hàng số.",
      "Đảm bảo chỉ tiêu kinh doanh đi cùng chất lượng dịch vụ và tuân thủ.",
    ],
    requirements: [
      "Tốt nghiệp cao đẳng trở lên, ưu tiên khối ngành kinh tế, tài chính, ngân hàng.",
      "Yêu thích kinh doanh, giao tiếp tốt và có tinh thần phục vụ khách hàng.",
      "Có kinh nghiệm bán hàng tài chính là lợi thế.",
    ],
    benefits: [
      "Thu nhập gồm lương cố định, thưởng kinh doanh và các khoản phụ cấp.",
      "Được đào tạo sản phẩm, kỹ năng bán hàng và quy trình dịch vụ.",
      "Cơ hội phát triển lên các vị trí quản lý kinh doanh tại chi nhánh.",
    ],
    otherInfo: ["Số lượng tuyển: 10", "Địa bàn làm việc: Hà Nội", "Ưu tiên ứng viên có thể nhận việc sớm."],
  },
  {
    id: "457703",
    slug: "chuyen-vien-cao-cap-phat-trien-thuong-hieu",
    title: "Chuyên viên cao cấp Phát triển Thương hiệu - Khối Marcom",
    shortDescription:
      "Phát triển chiến dịch thương hiệu tuyển dụng và truyền thông nội bộ, lan tỏa câu chuyện con người SHB.",
    department: "Khối Marcom",
    location: "Hà Nội",
    type: "Toàn thời gian",
    deadline: "05/07/2026",
    quantity: 1,
    responsibilities: [
      "Lập kế hoạch và triển khai hoạt động phát triển thương hiệu nhà tuyển dụng.",
      "Phối hợp sản xuất nội dung truyền thông đa kênh cho các chiến dịch nhân sự.",
      "Đo lường hiệu quả chiến dịch và đề xuất cải tiến trải nghiệm ứng viên.",
    ],
    requirements: [
      "Tối thiểu 3 năm kinh nghiệm truyền thông thương hiệu, tuyển dụng hoặc marketing.",
      "Kỹ năng viết, quản lý chiến dịch và phối hợp liên phòng ban tốt.",
      "Có tư duy hình ảnh, dữ liệu và hiểu biết về nền tảng số.",
    ],
    benefits: [
      "Tham gia các dự án thương hiệu quy mô toàn hàng.",
      "Môi trường sáng tạo, nhiều cơ hội học hỏi và phát triển.",
      "Chế độ phúc lợi đầy đủ theo chính sách SHB.",
    ],
    otherInfo: ["Số lượng tuyển: 1", "Cấp bậc: Chuyên viên cao cấp", "Yêu cầu portfolio hoặc ví dụ chiến dịch đã thực hiện."],
  },
]

export const jobDepartments = ["Tất cả", ...Array.from(new Set(shbJobs.map((job) => job.department)))]
export const jobLocations = ["Tất cả", ...Array.from(new Set(shbJobs.map((job) => job.location)))]

export function getJobBySlug(slug?: string) {
  return shbJobs.find((job) => job.slug === slug || job.id === slug) ?? shbJobs[0]
}
