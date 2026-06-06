"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Lock, Mic, ShieldCheck, WifiOff, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormMessage } from "@/components/recruitment/common"

export function JdErrorModal({
  open,
  error,
  onUploadAgain,
  onCancel,
}: {
  open: boolean
  error: string
  onUploadAgain: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onCancel()}>
      <DialogContent className="border-red-200">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-red-700">JD analysis failed</DialogTitle>
          <DialogDescription>{error}</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Supported files are PDF, DOC, and DOCX. Text-based JD content must include at least 100 words.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="bg-red-600 text-white hover:bg-red-700" onClick={onUploadAgain}>
            Upload Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CvErrorModal({
  open,
  error,
  onFix,
}: {
  open: boolean
  error: string
  onFix: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onFix()}>
      <DialogContent className="border-orange-200">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>Application needs attention</DialogTitle>
          <DialogDescription>{error}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button className="bg-[#F37021] text-white hover:bg-[#d95f18]" onClick={onFix}>
            Fix Information
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function VoiceConsentModal({
  open,
  onOpenChange,
  onConsent,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConsent: () => void
}) {
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (open) setAccepted(false)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-[#0033A0]/10 text-[#0033A0]">
            <Mic className="h-5 w-5" />
          </div>
          <DialogTitle>Xác nhận đồng ý tham gia phỏng vấn</DialogTitle>
          <DialogDescription>
            Vui lòng đọc kỹ các điều khoản trước khi tiếp tục vào phòng phỏng vấn AI.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground">
          <p>- Hệ thống có thể ghi âm giọng nói để tạo transcript, đánh giá phỏng vấn AI và phục vụ HR xem xét hồ sơ.</p>
          <p>- Dữ liệu cá nhân chỉ được sử dụng trong phạm vi quy trình tuyển dụng và theo chính sách bảo mật của đơn vị tuyển dụng.</p>
          <p>- Dữ liệu được lưu trữ, phân quyền truy cập và xử lý nhằm bảo vệ quyền riêng tư của ứng viên.</p>
          <p>- Bạn xác nhận câu trả lời là của chính mình và đồng ý tham gia phỏng vấn trong môi trường phù hợp.</p>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-3 text-foreground">
            <Checkbox
              checked={accepted}
              onCheckedChange={(value) => setAccepted(value === true)}
              className="mt-0.5"
            />
            <span className="text-sm font-medium">
              Tôi đã đọc và đồng ý với các điều khoản trên
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" disabled={!accepted} onClick={onConsent}>
            Tiếp tục phỏng vấn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SecurityAuthModal({
  open,
  onOpenChange,
  onVerified,
  onLocked,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: () => void
  onLocked?: () => void
}) {
  const [mode, setMode] = useState<"face" | "password">("password")
  const [password, setPassword] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (!open) {
      setPassword("")
      setAttempts(0)
      setLocked(false)
      setMode("password")
    }
  }, [open])

  const verify = () => {
    if (locked) return
    if (mode === "face" || password === "demo123") {
      onVerified()
      onOpenChange(false)
      return
    }

    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)
    if (nextAttempts >= 3) {
      setLocked(true)
      onLocked?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-[#0033A0]/10 text-[#0033A0]">
            <Lock className="h-5 w-5" />
          </div>
          <DialogTitle>Security verification required</DialogTitle>
          <DialogDescription>Verify before sending result emails in bulk.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={`rounded-lg border p-4 text-left ${mode === "password" ? "border-[#0033A0] bg-blue-50" : "bg-white"}`}
            onClick={() => setMode("password")}
          >
            <Lock className="mb-2 h-5 w-5 text-[#0033A0]" />
            <p className="font-medium">Password verification</p>
            <p className="text-xs text-muted-foreground">Use demo password: demo123</p>
          </button>
          <button
            type="button"
            className={`rounded-lg border p-4 text-left ${mode === "face" ? "border-[#0033A0] bg-blue-50" : "bg-white"}`}
            onClick={() => setMode("face")}
          >
            <ShieldCheck className="mb-2 h-5 w-5 text-[#0033A0]" />
            <p className="font-medium">Face verification</p>
            <p className="text-xs text-muted-foreground">Mock placeholder, accepts instantly.</p>
          </button>
        </div>

        {mode === "password" ? (
          <div className="space-y-2">
            <Label htmlFor="security-password">Password</Label>
            <Input
              id="security-password"
              type="password"
              value={password}
              disabled={locked}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
          </div>
        ) : null}

        {attempts > 0 && !locked ? (
          <FormMessage type="warning">Verification failed. Attempts: {attempts}/3.</FormMessage>
        ) : null}
        {locked ? (
          <FormMessage type="error">Action disabled after 3 failed attempts. A mock security log was recorded.</FormMessage>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" disabled={locked} onClick={verify}>
            Verify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TestTimeUpModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Time is up</DialogTitle>
          <DialogDescription>Your test has been automatically submitted. Answers are now locked.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" onClick={onClose}>
            View Next Step
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function NetworkWarningModal({
  open,
  onRetry,
  onFail,
}: {
  open: boolean
  onRetry: () => void
  onFail: () => void
}) {
  const [secondsLeft, setSecondsLeft] = useState(300)

  useEffect(() => {
    if (!open) {
      setSecondsLeft(300)
      return
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval)
          onFail()
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [open, onFail])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = String(secondsLeft % 60).padStart(2, "0")

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-700">
            <WifiOff className="h-5 w-5" />
          </div>
          <DialogTitle>Connection interrupted</DialogTitle>
          <DialogDescription>WebRTC reconnect is paused. The session can resume if the connection returns.</DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-red-50 p-4 text-center text-red-700">
          <p className="text-sm">Reconnect window</p>
          <p className="mt-1 font-mono text-3xl font-bold">
            {minutes}:{seconds}
          </p>
        </div>
        <DialogFooter>
          <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" onClick={onRetry}>
            Retry Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function NoiseWarningModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
            <Volume2 className="h-5 w-5" />
          </div>
          <DialogTitle>Noisy environment detected</DialogTitle>
          <DialogDescription>Please move to a quieter place so the AI can hear you clearly. Your interview data is preserved.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button className="bg-[#F37021] text-white hover:bg-[#d95f18]" onClick={onClose}>
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
