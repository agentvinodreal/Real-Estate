/**
 * Lists all Clerk users and their roles.
 *
 * Usage: tsx apps/api/scripts/list-admins.ts
 */
import { fileURLToPath } from 'node:url'
import { createClerkClient } from '@clerk/backend'

process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)))

const secretKey = process.env.CLERK_SECRET_KEY
if (!secretKey) {
  console.error('CLERK_SECRET_KEY is not set in apps/api/.env')
  process.exit(1)
}

const clerkClient = createClerkClient({ secretKey })

async function main() {
  const { data: users } = await clerkClient.users.getUserList()
  console.log('--- Current Clerk Users ---')
  for (const user of users) {
    const email = user.emailAddresses[0]?.emailAddress ?? 'No email'
    const role = user.publicMetadata?.role ?? 'no role'
    console.log(`- ${email} (Role: ${role}, ID: ${user.id})`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
