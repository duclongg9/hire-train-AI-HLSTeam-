"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormMessage } from "@/shared/components/recruitment-common"
import { CandidateSiteHeader } from "@/features/jobs/components/candidate-site-header"

export function CandidateLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const notice =
    searchParams.get("submitted") === "1"
      ? "Hồ sơ đã được gửi thành công. Mật khẩu đăng nhập đã được gửi về email của bạn."
      : typeof window !== "undefined"
        ? window.sessionStorage.getItem("candidateApplyNotice")
        : null

  const login = () => {
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập email và mật khẩu.")
      return
    }
    window.localStorage.setItem("candidateEmail", email)
    window.sessionStorage.removeItem("candidateApplyNotice")
    router.push("/candidate/assessment")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CandidateSiteHeader />
      <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px]">
        <section className="flex items-center">
          <div className="max-w-xl">
            <Badge className="bg-[#102a62] text-white hover:bg-[#102a62]">Cổng ứng viên</Badge>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-950">
              Đăng nhập để tiếp tục bài đánh giá năng lực
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Sau khi đăng nhập thành công, ứng viên được chuyển thẳng đến bài assessment. Dashboard tiến độ cũ đã được bỏ qua để quy trình rõ ràng hơn.
            </p>
          </div>
        </section>
        <section className="flex items-center">
          <Card className="w-full rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Đăng nhập</h2>
            <p className="mt-1 text-sm text-slate-500">Dùng email và mật khẩu đã được gửi tới bạn.</p>
            <div className="mt-5 space-y-4">
              {notice ? <FormMessage type="success">{notice}</FormMessage> : null}
              <div className="space-y-2">
                <Label htmlFor="candidate-email">Email</Label>
                <Input id="candidate-email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="candidate-password">Mật khẩu</Label>
                <Input
                  id="candidate-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") login()
                  }}
                />
              </div>
              {error ? <FormMessage type="error">{error}</FormMessage> : null}
              <Button className="w-full bg-[#c6203f] text-white hover:bg-[#a91935]" onClick={login}>
                Đăng nhập
              </Button>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <button type="button" className="font-medium text-[#102a62] hover:underline">
                  Đổi mật khẩu
                </button>
                <button type="button" className="font-medium text-slate-500 hover:text-[#c6203f]">
                  Quên mật khẩu?
                </button>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  )
}
