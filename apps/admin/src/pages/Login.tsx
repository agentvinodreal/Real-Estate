import { SignIn } from '@clerk/clerk-react'
import { Logo } from '@carry/shared'

export default function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bone px-5 py-12">
      <div className="text-ink">
        <Logo />
      </div>
      <SignIn routing="hash" forceRedirectUrl="/" signUpForceRedirectUrl="/" />
    </div>
  )
}
