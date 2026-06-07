import Link from "next/link"
import { UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CandidateSiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/jobs" className="flex min-w-0 items-center gap-3">
          <img alt="SHB" className="h-10 w-auto object-contain" src="/Logo-SHB-EN.png" />
          <div className="min-w-0 border-l border-slate-200 pl-3">
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
          <Button className="flex items-center gap-2 bg-[#f37021] px-6 text-white hover:bg-[#d95f18]">
            <UserRound className="h-4 w-4" />
            Ứng viên
          </Button>
        </Link>
      </div>
    </header>
  )
}
