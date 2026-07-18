import { prisma } from '../lib/prisma.js'

const DAILY_LIMIT = process.env.DAILY_LIMIT ? parseInt(process.env.DAILY_LIMIT, 10) : 100

export interface RateLimitStatus {
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
  resetsAt: string;
}

export async function checkRateLimit(userId: string): Promise<RateLimitStatus> {
  // Set start of day in Indian Standard Time (IST, UTC+5:30) or system start of day.
  // Since server might run in UTC, let's calculate the exact start of today in IST
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000 // 5.5 hours in ms
  const istNow = new Date(now.getTime() + istOffset)
  
  // Set to midnight in IST
  const startOfDayIST = new Date(istNow)
  startOfDayIST.setUTCHours(0, 0, 0, 0)
  
  // Convert back to UTC date object for DB query comparison
  const startOfDayUTC = new Date(startOfDayIST.getTime() - istOffset)

  // Count generations for this user today (both pending and completed, to avoid race conditions)
  const count = await prisma.floorPlanGeneration.count({
    where: {
      userId,
      status: { in: ['completed', 'pending'] },
      createdAt: { gte: startOfDayUTC },
    },
  })

  const remaining = Math.max(0, DAILY_LIMIT - count)
  
  // Reset time is next day's midnight in IST
  const tomorrowIST = new Date(startOfDayIST)
  tomorrowIST.setDate(tomorrowIST.getDate() + 1)
  const resetsAtUTC = new Date(tomorrowIST.getTime() - istOffset)

  return {
    allowed: count < DAILY_LIMIT,
    used: count,
    remaining,
    limit: DAILY_LIMIT,
    resetsAt: resetsAtUTC.toISOString(),
  }
}
