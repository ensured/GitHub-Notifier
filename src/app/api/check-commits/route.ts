import { NextRequest, NextResponse } from "next/server";
import { checkForNewCommits } from "@/lib/commit-checker";

export async function GET(request: NextRequest) {
  try {
    // Verify this is coming from a trusted source (optional)
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await checkForNewCommits();

    return NextResponse.json({
      success: true,
      message: "Commit check completed",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in commit check API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
