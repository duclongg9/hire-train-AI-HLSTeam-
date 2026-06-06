import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function CandidateHero() {
  return (
    <section className="relative overflow-hidden bg-[#102a62] text-white">
      <img
        alt="SHB recruitment office"
        className="absolute inset-0 h-full w-full object-cover opacity-28"
        src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,42,98,0.95),rgba(16,42,98,0.74),rgba(198,32,63,0.52))]" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:py-16">
        <div className="max-w-3xl">
          <Badge className="bg-white/15 text-white hover:bg-white/15">Cơ hội nghề nghiệp SHB</Badge>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Cùng SHB kiến tạo tương lai tài chính số
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/82">
            Khám phá các vị trí đang tuyển, nộp hồ sơ nhanh và tiếp tục quy trình đánh giá năng lực trực tuyến dành cho ứng viên.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#open-jobs">
              <Button className="bg-[#f37021] text-white hover:bg-[#d95f18]">Xem việc làm</Button>
            </a>
            <Link href="/candidate/login">
              <Button variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                Đăng nhập ứng viên
              </Button>
            </Link>
          </div>
        </div>
        <Card className="rounded-lg border-white/20 bg-white/92 p-5 text-slate-900 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#c6203f]">Talent Network là gì?</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Gia nhập mạng lưới nhân tài giúp bạn cập nhật việc làm mới, theo dõi hồ sơ và nhận thông báo từ đội ngũ tuyển dụng.
          </p>
          <div className="mt-5 grid gap-3 text-sm">
            {["Việc làm phù hợp theo năng lực", "Quy trình đánh giá minh bạch", "Thông báo kết quả qua email"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
