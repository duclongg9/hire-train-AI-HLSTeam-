"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatApiError, generateTestQuestions, listTestQuestions, publishPosition, saveTestQuestions, type BackendTestQuestion } from "@/features/hr/api/hr-api"

type TestQuestionOption = Record<string, unknown> & {
  id: string
  text: string
}

function questionOptions(question: BackendTestQuestion) {
  return question.options as TestQuestionOption[]
}

export function TestReviewScreen({ onStatusChange }: { onStatusChange?: (saved: boolean) => void }) {
  const params = useParams<{ positionId?: string }>()
  const searchParams = useSearchParams()
  const positionId = params?.positionId ?? searchParams.get("positionId") ?? ""
  
  const [questions, setQuestions] = useState<BackendTestQuestion[]>([])
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview")
  const [loading, setLoading] = useState(Boolean(positionId))
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiCount, setAiCount] = useState(15)
  const [saveMessage, setSaveMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    if (!positionId) return
    void Promise.resolve().then(() => {
      if (mounted) setLoading(true)
    })
    listTestQuestions(positionId)
      .then((data) => {
        if (mounted) setQuestions(data)
      })
      .catch((err) => {
        if (mounted) setError(formatApiError(err, "Could not load test questions."))
        onStatusChange?.(false)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [onStatusChange, positionId])

  const handleAiGenerate = async () => {
    if (!positionId) return
    setGenerating(true)
    setError("")
    try {
      const data = await generateTestQuestions(positionId, aiCount)
      setQuestions(data)
    } catch (err) {
      setError(formatApiError(err, "Generation failed."))
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!positionId) return
    setSaving(true)
    setSaveMessage("")
    try {
      const saved = await saveTestQuestions(positionId, questions)
      setQuestions(saved)
      setSaveMessage("Saved successfully to backend.")
      onStatusChange?.(true)
    } catch (err) {
      setError(formatApiError(err, "Failed to save test questions."))
      onStatusChange?.(false)
    } finally {
      setSaving(false)
    }
  }

  const updateQuestion = (id: string, updates: Partial<BackendTestQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const handleAddEmptyQuestion = () => {
    const newQ = {
      id: `new-${Date.now()}`,
      question_text: "",
      options: [{ id: "o1", text: "" }, { id: "o2", text: "" }, { id: "o3", text: "" }, { id: "o4", text: "" }],
      correct_option_id: "o1",
      difficulty: "Medium",
      skill_tag: "General"
    } as unknown as BackendTestQuestion
    setQuestions([newQ, ...questions])
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Review & AI Generation</h2>
        <p className="text-sm text-muted-foreground">Review test questions or generate new ones using AI.</p>
      </div>
      
      {error && <div className="text-red-500 font-medium text-sm">{error}</div>}
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="font-semibold" onClick={() => setViewMode("preview")}>
            Preview Mode
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setViewMode("edit")}>
            Edit Mode
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input 
            type="number" 
            min="5" 
            max="30" 
            value={aiCount} 
            onChange={(e) => setAiCount(parseInt(e.target.value) || 15)}
            className="w-20 h-9"
          />
          <Button className="bg-[#102a62] text-white hover:bg-[#0b1d45]" onClick={handleAiGenerate} disabled={generating}>
            {generating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Auto-Generate
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="text-center p-12 border rounded-lg bg-slate-50 text-slate-500">
            No test questions yet. Use AI to generate them or add manually.
          </div>
        ) : viewMode === "edit" ? (
          questions.map((q, idx) => (
            <Card key={q.id || idx} className="p-4 relative group">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                onClick={() => handleDeleteQuestion(q.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <span className="font-bold text-lg text-slate-400 mt-1">{idx + 1}.</span>
                  <div className="flex-1 space-y-3">
                    <Textarea 
                      value={q.question_text} 
                      onChange={(e) => updateQuestion(q.id, { question_text: e.target.value })}
                      className="font-medium bg-slate-50"
                      placeholder="Question text..."
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      {questionOptions(q).map((opt) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name={`correct-${q.id}`}
                            checked={q.correct_option_id === opt.id}
                            onChange={() => updateQuestion(q.id, { correct_option_id: opt.id })}
                            className="w-4 h-4 text-[#f37021] focus:ring-[#f37021]"
                          />
                          <Input 
                            value={opt.text}
                            onChange={(e) => {
                              const newOptions = questionOptions(q).map((option) => option.id === opt.id ? { ...option, text: e.target.value } : option)
                              updateQuestion(q.id, { options: newOptions })
                            }}
                            className={q.correct_option_id === opt.id ? "border-[#f37021] bg-orange-50" : ""}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          questions.map((q, idx) => (
            <Card key={q.id || idx} className="p-5 border-l-4 border-l-[#102a62]">
              <div className="flex gap-4">
                <span className="font-bold text-lg text-slate-400">{idx + 1}.</span>
                <div className="flex-1 space-y-4">
                  <h4 className="font-medium text-slate-900">{q.question_text}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {questionOptions(q).map((opt) => (
                      <div 
                        key={opt.id} 
                        className={`p-3 rounded-md border text-sm ${
                          q.correct_option_id === opt.id 
                            ? "bg-green-50 border-green-200 text-green-900 font-medium" 
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        {opt.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={handleAddEmptyQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Add Question Manually
        </Button>
        <div className="flex items-center gap-3">
          {saveMessage && <span className="text-sm text-green-600 font-medium">{saveMessage}</span>}
          <Button variant="outline" disabled={saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save Questions"}
          </Button>
          <Button 
            className="bg-[#0033A0] text-white hover:bg-[#00256f]" 
            onClick={async () => {
              if (!positionId) return
              try {
                await publishPosition(positionId)
                alert("Position published successfully!")
              } catch (error) {
                console.error(error)
                alert("Failed to publish position.")
              }
            }}
          >
            Publish Position
          </Button>
        </div>
      </div>
    </div>
  )
}
