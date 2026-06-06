"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from '@/shared/layout/page-header'

// Import the sub-screens
import { CriteriaScoringScreen } from "@/features/hr/containers/cv-rubric-screen"
import { TestReviewScreen } from "@/features/hr/containers/hr-screens"
import { InterviewRubricEditorPage } from "@/features/hr/containers/interview-rubric-editor"

export default function PositionAIPipelinePage() {
  const params = useParams<{ campaignId?: string, positionId?: string }>()
  const router = useRouter()
  const campaignId = params?.campaignId ?? ""
  const positionId = params?.positionId ?? ""

  // State to track if each tab has been saved/completed
  const [cvSaved, setCvSaved] = useState(false)
  const [testSaved, setTestSaved] = useState(false)
  const [interviewSaved, setInterviewSaved] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      // Import publishPosition if not already imported
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
              Status: {cvSaved && testSaved && interviewSaved ? (
                <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Ready for Publish</span>
              ) : (
                <span className="text-amber-600">Action Required</span>
              )}
            </span>
            <Button 
              className="bg-[#F37021] text-white hover:bg-[#d95f18]" 
              disabled={!(cvSaved && testSaved && interviewSaved) || isPublishing}
              onClick={handlePublish}
            >
              {isPublishing ? "Publishing..." : "Publish Position"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="cv-rubric" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="cv-rubric" className="flex items-center gap-2">
              1. CV Rubric {cvSaved && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="test-assessment" className="flex items-center gap-2">
              2. Test Assessment {testSaved && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="interview-rubric" className="flex items-center gap-2">
              3. Interview Rubric {interviewSaved && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
          </TabsList>
          
          <div className="bg-white rounded-lg border shadow-sm min-h-[500px]">
            <TabsContent value="cv-rubric" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <CriteriaScoringScreen onStatusChange={setCvSaved} />
            </TabsContent>
            
            <TabsContent value="test-assessment" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <TestReviewScreen onStatusChange={setTestSaved} />
            </TabsContent>
            
            <TabsContent value="interview-rubric" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <InterviewRubricEditorPage onStatusChange={setInterviewSaved} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  )
}
