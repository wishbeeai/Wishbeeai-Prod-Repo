import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // In production, fetch from database
    // For now, return mock data
    const stats = {
      totalReferrals: 0,
      successfulReferrals: 0,
      rewardsEarned: 0,
    }

    // TODO: Query database for actual stats
    // const { data } = await supabase
    //   .from('referrals')
    //   .select('*')
    //   .eq('referrer_id', user.id)

    return NextResponse.json(stats, { status: 200 })
  } catch (error) {
    console.error("[Referrals] Error fetching stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch referral stats" },
      { status: 500 }
    )
  }
}

