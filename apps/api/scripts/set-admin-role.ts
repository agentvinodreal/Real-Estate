/**
 * Promotes a Clerk user to admin (publicMetadata.role = "admin"), which is
 * what apps/api/src/lib/auth.ts checks on every protected route.
 *
 * Usage: tsx apps/api/scripts/set-admin-role.ts someone@example.com
 */
import { fileURLToPath } from 'node:url'
import { createClerkClient } from '@clerk/backend'

// Load apps/api/.env regardless of the cwd this script is invoked from.
process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)))

const email = process.argv[2]
if (!email) {
  console.error('Usage: tsx apps/api/scripts/set-admin-role.ts <email>')
  process.exit(1)
}

const secretKey = process.env.CLERK_SECRET_KEY
if (!secretKey) {
  console.error('CLERK_SECRET_KEY is not set in apps/api/.env')
  process.exit(1)
}

const clerkClient = createClerkClient({ secretKey })

async function main() {
  const { data: users } = await clerkClient.users.getUserList({ emailAddress: [email] })
  const user = users[0]
  if (!user) {
    console.error(`No Clerk user found with email ${email}. They must sign up at least once first.`)
    process.exit(1)
  }

  await clerkClient.users.updateUserMetadata(user.id, {
    publicMetadata: { ...user.publicMetadata, role: 'admin' },
  })

  console.log(`${email} (${user.id}) is now an admin.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
