import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type Stage = "auth" | "intro" | "test" | "review" | "completed"

interface AssessmentState {
  isExamMode: boolean
  stage: Stage
  currentQuestion: number
  answers: Record<number, number>
  flaggedQuestions: Record<number, boolean>
  timeLeft: number
  hasStarted: boolean
  violationCount: number
  passcode: string | null
  
  // Actions
  setStage: (stage: Stage) => void
  setExamMode: (isExamMode: boolean) => void
  answerQuestion: (questionIndex: number, optionIndex: number) => void
  toggleFlag: (questionIndex: number) => void
  nextQuestion: (totalQuestions: number) => void
  prevQuestion: () => void
  jumpToQuestion: (index: number) => void
  setTimeLeft: (time: number | ((prev: number) => number)) => void
  resetAssessment: (initialTime: number) => void
  startAssessment: () => void
  incrementViolation: () => void
  setPasscode: (code: string | null) => void
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      isExamMode: true,
      stage: "auth",
      currentQuestion: 0,
      answers: {},
      flaggedQuestions: {},
      timeLeft: 20 * 60,
      hasStarted: false,
      violationCount: 0,
      passcode: null,

      setStage: (stage) => set({ stage }),
      setExamMode: (isExamMode) => set({ isExamMode }),
      setPasscode: (passcode) => set({ passcode }),
      
      incrementViolation: () => set((state) => ({ violationCount: state.violationCount + 1 })),
      
      startAssessment: () => set({ hasStarted: true, stage: "test" }),

      answerQuestion: (questionIndex, optionIndex) => 
        set((state) => ({
          answers: {
            ...state.answers,
            [questionIndex]: optionIndex,
          },
        })),

      toggleFlag: (questionIndex) =>
        set((state) => ({
          flaggedQuestions: {
            ...state.flaggedQuestions,
            [questionIndex]: !state.flaggedQuestions[questionIndex],
          },
        })),

      nextQuestion: (totalQuestions) =>
        set((state) => {
          if (state.currentQuestion < totalQuestions - 1) {
            return { currentQuestion: state.currentQuestion + 1 }
          }
          return state
        }),

      prevQuestion: () =>
        set((state) => {
          if (state.currentQuestion > 0) {
            return { currentQuestion: state.currentQuestion - 1 }
          }
          return state
        }),

      jumpToQuestion: (index) => set({ currentQuestion: index }),

      setTimeLeft: (time) =>
        set((state) => ({
          timeLeft: typeof time === "function" ? time(state.timeLeft) : time,
        })),

      resetAssessment: (initialTime) =>
        set({
          stage: "intro",
          currentQuestion: 0,
          answers: {},
          flaggedQuestions: {},
          timeLeft: initialTime,
          hasStarted: false,
        }),
    }),
    {
      name: "assessment-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist necessary data to avoid losing state on refresh
        answers: state.answers,
        flaggedQuestions: state.flaggedQuestions,
        currentQuestion: state.currentQuestion,
        timeLeft: state.timeLeft,
        hasStarted: state.hasStarted,
        stage: state.stage,
        violationCount: state.violationCount,
        passcode: state.passcode,
      }),
    }
  )
)
