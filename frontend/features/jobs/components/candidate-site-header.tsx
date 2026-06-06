import Link from "next/link"
import { UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CandidateSiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/jobs" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200">
            <img alt="SHB" className="h-7 w-7 object-contain" src="/shb-mark.svg" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-[#c6203f]">SHB Tuyển dụng</p>
            <p className="truncate text-xs font-medium text-slate-500">Nơi khởi nguồn khát vọng dẫn đầu</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/jobs" className="hover:text-[#c6203f]">
            Việc làm
          </Link>
          <a href="#talent-network" className="hover:text-[#c6203f]">
            Talent Network
          </a>
          <Link href="/candidate/login" className="hover:text-[#c6203f]">
            Đăng nhập
          </Link>
        </nav>
        <Link href="/candidate/login">
          <Button className="bg-[#f37021] text-white hover:bg-[#d95f18]">
            <UserRound className="mr-2 h-4 w-4" />
            Ứng viên
          </Button>
        </Link>
      </div>
    </header>
  )
}
