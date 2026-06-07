import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Generate a random 6-digit passcode
    const passcode = Math.floor(100000 + Math.random() * 900000).toString()

    // MOCK: Simulate email sending
    console.log(`\n==========================================`)
    console.log(`[MOCK EMAIL SERVER]`)
    console.log(`To: ${email}`)
    console.log(`Subject: Your SHB Exam Passcode`)
    console.log(`Candidate ID: SHB-2024-${Math.floor(Math.random() * 1000)}`)
    console.log(`Your secure passcode is: ${passcode}`)
    console.log(`==========================================\n`)

    // Return the passcode to the frontend for easy testing/demoing
    // In a real scenario, we NEVER return the passcode to the frontend!
    return NextResponse.json({ 
      success: true, 
      message: "Passcode sent successfully",
      passcode: passcode // Dành cho demo
    })

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
