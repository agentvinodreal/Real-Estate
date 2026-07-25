import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'

const OCHRE = '#d5a96a'
const INK = '#122325'

export default function CranePullController() {
  const { pathname } = useLocation()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prevPath = useRef(pathname)

  // Track scroll position for the vertical scroll crane indicator
  useEffect(() => {
    function handleScroll() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return
      setScrollProgress(window.scrollY / docHeight)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Trigger page transition hoisting animation when pathname changes
  useEffect(() => {
    if (prevPath.current !== pathname) {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setIsTransitioning(false)
        prevPath.current = pathname
      }, 1000) // matches transition duration
      return () => clearTimeout(timer)
    }
  }, [pathname])

  return (
    <>
      {/* ── 1. ROUTE TRANSITION HOISTING CRANE ── */}
      <AnimatePresence mode="wait">
        {isTransitioning && (
          <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col items-center justify-start">
            {/* The Crane Cable */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: ['0vh', '40vh', '0vh'] }}
              transition={{ duration: 1.0, ease: 'easeInOut' }}
              className="w-0.5 bg-ochre/80 relative"
              style={{ originY: 0 }}
            />

            {/* The Crane Hook */}
            <motion.div
              initial={{ y: -150 }}
              animate={{ y: [-150, 0, -600] }}
              transition={{ duration: 1.0, ease: 'easeInOut' }}
              className="flex flex-col items-center -mt-1"
            >
              {/* Detailed Construction Pulley & Hook SVG */}
              <svg width="60" height="90" viewBox="0 0 60 90" fill="none" className="drop-shadow-lg">
                {/* Pulley block housing */}
                <rect x="18" y="5" width="24" height="24" rx="4" fill={INK} stroke={OCHRE} strokeWidth="2" />
                {/* Pulley wheel */}
                <circle cx="30" cy="17" r="8" fill={OCHRE} />
                <circle cx="30" cy="17" r="3" fill={INK} />
                {/* Connector bar */}
                <rect x="27" y="29" width="6" height="15" fill={OCHRE} />
                {/* Weight block */}
                <path d="M15 44h30l-5 15H20l-5-15z" fill={INK} stroke={OCHRE} strokeWidth="1.5" />
                {/* Twin Shackle Hooks */}
                <path
                  d="M30 59c-6 0-10 4-10 9s3 6 6 3 2-6-2-6"
                  stroke={OCHRE}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M30 59c6 0 10 4 10 9s-3 6-6 3-2-6 2-6"
                  stroke={OCHRE}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
              {/* Hoist indicator banner */}
              <div 
                className="mt-2 px-3 py-1 bg-ink border border-ochre/30 text-[0.55rem] font-mono uppercase tracking-[0.25em] text-ochre whitespace-nowrap shadow-md"
              >
                HOISTING PAGE
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 2. INTERACTIVE SCROLL-PROGRESS CRANE (ON SCREEN RIGHT) ── */}
      <div className="fixed right-6 top-16 bottom-16 z-40 w-12 hidden lg:flex flex-col items-center pointer-events-none">
        {/* Fixed Crane Boom/Jib at Top Right */}
        <div className="absolute right-0 top-0 h-10 w-24">
          <svg width="96" height="40" viewBox="0 0 96 40" fill="none">
            {/* Jib body (truss pattern) */}
            <path d="M0 5h80l12 15L80 35H12L0 5z" fill={`${INK}ef`} stroke={OCHRE} strokeWidth="1.5" />
            <path d="M12 5l12 30M36 5l12 30M60 5l12 30" stroke={OCHRE} strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="8" cy="20" r="6" fill={OCHRE} />
            <circle cx="8" cy="20" r="2" fill={INK} />
            {/* Cable exit wheel */}
            <circle cx="88" cy="20" r="4" fill={OCHRE} />
          </svg>
        </div>

        {/* Dynamic steel cable extending down from jib wheel */}
        <div
          className="absolute w-0.5 bg-gradient-to-b from-ochre to-ochre-dark opacity-75"
          style={{
            right: '12px', // aligns with the jib wheel tip
            top: '20px',
            height: `calc(40px + ${scrollProgress * 80}%)`,
            transition: 'height 0.15s cubic-bezier(0.1, 0.8, 0.2, 1)',
          }}
        />

        {/* Detailed Crane Hook moving with scroll progress */}
        <div
          className="absolute flex flex-col items-center"
          style={{
            right: '-12px',
            top: '20px',
            transform: `translateY(calc(${scrollProgress * 80}vh))`,
            transition: 'transform 0.15s cubic-bezier(0.1, 0.8, 0.2, 1)',
          }}
        >
          {/* Scroll hook indicator */}
          <svg width="32" height="48" viewBox="0 0 32 48" fill="none" className="drop-shadow-md">
            {/* Pulley body */}
            <circle cx="16" cy="12" r="8" fill={INK} stroke={OCHRE} strokeWidth="1.5" />
            <circle cx="16" cy="12" r="3" fill={OCHRE} />
            {/* Hook shank */}
            <line x1="16" y1="20" x2="16" y2="28" stroke={OCHRE} strokeWidth="2" />
            {/* Curved hook */}
            <path
              d="M16 28c-4 0-6 3-6 6s2 4 4 2 1-4-2-4"
              stroke={OCHRE}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <div 
            className="mt-1 bg-ink/90 border border-ochre/20 text-[0.45rem] font-mono text-ochre px-1 py-0.5 rounded shadow-sm scale-90"
          >
            {Math.round(scrollProgress * 100)}%
          </div>
        </div>
      </div>
    </>
  )
}
