import { NextResponse } from 'next/server'
import { query } from '../../../../lib/database/client'

export const dynamic = 'force-dynamic'

/** Vercel Cron calls this daily; only the configured cron secret can trigger deletion. */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await query(
      `DELETE FROM activity_log WHERE created_at < now() - interval '1 year'`,
    )
    return NextResponse.json({ success: true, deletedCount: result.rowCount ?? 0 })
  } catch (error) {
    console.error('Could not remove expired activity records:', error)
    return NextResponse.json({ success: false, error: 'Activity cleanup failed.' }, { status: 500 })
  }
}
