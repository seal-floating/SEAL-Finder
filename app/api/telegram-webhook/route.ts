import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Handle Telegram webhook data
    // This is where you would process game start commands, etc.

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Telegram webhook error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: "Telegram webhook endpoint is active" })
}

