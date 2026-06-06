"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from '@/shared/layout/page-header'

// Import the sub-screens
import { CriteriaScoringScreen } from "@/features/hr/containers/cv-rubric-screen"
import { TestReviewScreen } from "@/features/hr/containers/test-review-screen"
import { InterviewRubricEditorPage } from "@/features/hr/containers/interview-rubric-editor"
import { JDUpload } from "@/components/hr-dashboard/jd-upload"

export default function PositionAIPipelinePage() {
  const params = useParams<{ campaignId?: string, positionId?: string }>()
  const router = useRouter()
  const campaignId = params?.campaignId ?? ""
  const positionId = params?.positionId ?? ""

  // State to track if each tab has been saved/completed
  const [jdSaved, setJdSaved] = useState(false)
  const [cvSaved, setCvSaved] = useState(false)
  const [interviewSaved, setInterviewSaved] = useState(false)
  const [testSaved, setTestSaved] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const { publishPosition } = await import("@/features/hr/api/hr-api")
      await publishPosition(positionId)
      alert("Position published successfully!")
      router.push(`/hr/campaigns/${campaignId}`)
    } catch (err) {
      console.error("Failed to publish position", err)
      alert("Failed to publish position.")
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <>
      <PageHeader title="Position Details" subtitle="Details of the selected position" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push(`/hr/campaigns/${campaignId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Positions
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              Status: {jdSaved && cvSaved && interviewSaved && testSaved ? (
                <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Ready for Publish</span>
              ) : (
                <span className="text-amber-600">Action Required</span>
              )}
            </span>
            <Button 
              className="bg-[#F37021] text-white hover:bg-[#d95f18]" 
              disabled={!(jdSaved && cvSaved && interviewSaved && testSaved) || isPublishing}
              onClick={handlePublish}
            >
              {isPublishing ? "Publishing..." : "Publish Position"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="jd" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="jd" className="flex items-center gap-2">
              1. Job Description {jdSaved && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="cv-rubric" className="flex items-center gap-2">
              2. CV Rubric {cvSaved && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="interview-test" className="flex items-center gap-2">
              3. Interview Rubric & Test {(interviewSaved && testSaved) && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
          </TabsList>
          
          <div className="bg-white rounded-lg border shadow-sm min-h-[500px] p-4">
            <TabsContent value="jd" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="max-w-4xl mx-auto">
                <JDUpload onAnalyze={(tags) => {
                  setJdSaved(true)
                  console.log("Analyzed tags:", tags)
                }} />
                {jdSaved && (
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={() => alert("JD info is saved!")}>Save Job Description</Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="cv-rubric" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <CriteriaScoringScreen onStatusChange={setCvSaved} />
            </TabsContent>
            
            <TabsContent value="interview-test" className="m-0 focus-visible:outline-none focus-visible:ring-0 space-y-8">
              <div className="pb-8 border-b border-slate-200">
                <h3 className="text-xl font-semibold mb-4">Phần 1: Bài Test Chuyên Môn</h3>
                <TestReviewScreen onStatusChange={setTestSaved} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Phần 2: Tiêu Chí Phỏng Vấn (Interview Rubric)</h3>
                <InterviewRubricEditorPage onStatusChange={setInterviewSaved} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  )
}
