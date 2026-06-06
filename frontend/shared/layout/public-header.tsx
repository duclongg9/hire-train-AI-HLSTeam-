import Link from "next/link"
import { Button } from "@/components/ui/button"

export function PublicHeader() {
  return (
    <header className="border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/jobs" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200">
            <img alt="SHB" className="h-7 w-7 object-contain" src="https://img.logokit.com/shb.com.vn" />
          </div>
          <div>
            <p className="font-semibold text-[#c6203f]">SHB Tuyen dung</p>
            <p className="text-xs text-muted-foreground">Candidate experience</p>
          </div>
        </Link>
        <Link href="/jobs">
          <Button variant="outline">Viec lam</Button>
        </Link>
      </div>
    </header>
  )
}

