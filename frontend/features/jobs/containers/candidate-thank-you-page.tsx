"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CandidateSiteHeader } from "@/features/jobs/components/candidate-site-header"

export function CandidateThankYouPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <CandidateSiteHeader />
      <main className="mx-auto flex max-w-3xl items-center px-4 py-16 sm:px-6">
        <Card className="w-full rounded-lg border-emerald-200 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-slate-950">Cảm ơn bạn đã hoàn thành quy trình đánh giá.</h1>
          <p className="mx-auto mt-3 max-w-lg text-slate-600">
            Bộ phận tuyển dụng sẽ liên hệ với bạn khi có kết quả phù hợp.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/jobs">
              <Button variant="outline">Xem việc làm khác</Button>
            </Link>
            <Link href="/candidate/login">
              <Button className="bg-[#102a62] text-white hover:bg-[#0b1d45]">Quay lại cổng ứng viên</Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  )
}
