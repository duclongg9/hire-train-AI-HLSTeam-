"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, Sparkles, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ExtractedTags {
  hardSkills: string[]
  softSkills: string[]
  experienceLevel: string
}

interface JDUploadProps {
  onAnalyze: (tags: ExtractedTags) => void
}

const sampleJD = `Vị trí: Chuyên viên Quan hệ Khách hàng Cá nhân

Yêu cầu:
- Tốt nghiệp Đại học chuyên ngành Tài chính, Ngân hàng, Kinh tế
- Tối thiểu 2 năm kinh nghiệm trong lĩnh vực ngân hàng
- Thành thạo kỹ năng tư vấn sản phẩm tài chính
- Khả năng giao tiếp và thuyết phục tốt
- Chịu được áp lực công việc cao
- Ưu tiên có chứng chỉ CFA, ACCA`

export function JDUpload({ onAnalyze }: JDUploadProps) {
  const [jdText, setJdText] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [extractedTags, setExtractedTags] = useState<ExtractedTags | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setJdText(sampleJD)
  }, [])

  const handleAnalyze = async () => {
    if (!jdText.trim()) return
    
    setIsAnalyzing(true)
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const tags: ExtractedTags = {
      hardSkills: ["Tài chính ngân hàng", "Tư vấn sản phẩm", "CFA/ACCA", "Phân tích tín dụng"],
      softSkills: ["Giao tiếp", "Thuyết phục", "Chịu áp lực", "Làm việc nhóm"],
      experienceLevel: "2-5 năm kinh nghiệm"
    }
    
    setExtractedTags(tags)
    setIsAnalyzing(false)
    setIsAnalyzed(true)
    onAnalyze(tags)
  }

  const resetAnalysis = () => {
    setJdText("")
    setIsAnalyzed(false)
    setExtractedTags(null)
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Tải lên & Phân tích JD</h2>
            <p className="text-sm text-muted-foreground mt-1">AI sẽ trích xuất yêu cầu từ Job Description</p>
          </div>
          {isAnalyzed && (
            <Button variant="ghost" size="sm" onClick={resetAnalysis}>
              <X className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Upload/Input Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-xl border-2 border-dashed transition-all duration-300",
            isDragging 
              ? "border-[#F37021] bg-orange-50" 
              : "border-border hover:border-[#0033A0]/50",
            isAnalyzed && "opacity-60 pointer-events-none"
          )}
        >
          {!jdText ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#0033A0]/10 to-[#0033A0]/5 flex items-center justify-center">
                <Upload className="w-8 h-8 text-[#0033A0]" />
              </div>
              <p className="font-medium text-foreground mb-1">Kéo thả file JD vào đây</p>
              <p className="text-sm text-muted-foreground mb-4">hoặc paste nội dung JD bên dưới</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setJdText(sampleJD)}
                className="border-[#0033A0]/30 text-[#0033A0] hover:bg-[#0033A0]/5"
              >
                <FileText className="w-4 h-4 mr-2" />
                Dùng JD mẫu
              </Button>
            </div>
          ) : (
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="w-full h-48 p-4 bg-transparent resize-none focus:outline-none text-sm text-foreground"
              placeholder="Paste nội dung Job Description tại đây..."
              disabled={isAnalyzed}
            />
          )}
        </div>

        {/* Analyze Button */}
        <AnimatePresence mode="wait">
          {!isAnalyzed && jdText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full h-12 bg-gradient-to-r from-[#F37021] to-[#FF9A5C] hover:from-[#E06010] hover:to-[#F08040] text-white font-semibold shadow-lg shadow-orange-500/25 transition-all duration-300"
              >
                {isAnalyzing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                    </motion.div>
                    Đang phân tích...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Phân tích JD với AI
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Extracted Tags */}
        <AnimatePresence>
          {extractedTags && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium text-sm">Phân tích thành công!</span>
              </div>

              {/* Hard Skills */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Hard Skills</p>
                <div className="flex flex-wrap gap-2">
                  {extractedTags.hardSkills.map((skill, i) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="px-3 py-1.5 bg-[#0033A0]/10 text-[#0033A0] text-sm font-medium rounded-lg"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Soft Skills */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Soft Skills</p>
                <div className="flex flex-wrap gap-2">
                  {extractedTags.softSkills.map((skill, i) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="px-3 py-1.5 bg-[#F37021]/10 text-[#F37021] text-sm font-medium rounded-lg"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Kinh nghiệm</p>
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="inline-flex px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg"
                >
                  {extractedTags.experienceLevel}
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
