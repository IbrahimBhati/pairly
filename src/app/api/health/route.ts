import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const startTime = Date.now()

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("categories")
      .select("id")
      .limit(1)

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          message: "Database ping returned an error",
          error: error.message,
          time: new Date().toISOString(),
          durationMs: Date.now() - startTime,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        time: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      },
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      {
        status: "error",
        error: message,
        time: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
