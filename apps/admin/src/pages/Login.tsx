import { SignIn } from '@clerk/clerk-react'
import { motion } from 'motion/react'
import { Logo } from '@carry/shared'
import { EASE_OUT_EXPO } from '../lib/motion'

export default function Login() {
  return (
    <div className="blueprint flex min-h-screen flex-col items-center justify-center gap-8 px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="flex flex-col items-center gap-2 text-ink"
      >
        <Logo />
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-concrete">Admin</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT_EXPO }}
      >
        <SignIn routing="hash" forceRedirectUrl={import.meta.env.BASE_URL} signUpForceRedirectUrl={import.meta.env.BASE_URL} />
      </motion.div>
    </div>
  )
}
