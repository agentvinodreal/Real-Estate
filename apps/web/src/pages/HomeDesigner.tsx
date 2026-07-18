import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { useAuth, SignInButton } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'motion/react'
import Seo from '../components/Seo'
import FloorPlan2D from '../components/home-designer/FloorPlan2D'
import { computeFloorPlanLayout, auditVastu } from '../lib/floorPlanLayout'
// three.js is a heavy dependency — keep it out of the initial page bundle.
const FloorPlan3D = lazy(() => import('../components/home-designer/FloorPlan3D'))
import {
  Sparkles,
  Loader2,
  Compass,
  Check,
  Home,
  Lock,
  ArrowRight,
  Ruler,
  Building2,
  PencilRuler,
} from 'lucide-react'

/* ── Generation loaders ──────────────────────────────────────────────
   Purely decorative: the underlying layout math is instant, but a bare
   flash-to-content read as broken, so each tab gets its own themed
   "drafting" animation timed to the artificial delay it sits behind. */

function BlueprintLoader({ durationMs }: { durationMs: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 p-8">
      <div className="relative h-28 w-36">
        <svg viewBox="0 0 144 112" className="h-full w-full" fill="none">
          <motion.rect
            x={4}
            y={4}
            width={136}
            height={104}
            stroke="#1f6f66"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            initial={{ pathLength: 0, opacity: 0.3 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: durationMs / 1000, ease: 'easeInOut' }}
          />
          {[28, 58, 88].map((x, i) => (
            <motion.line
              key={x}
              x1={x}
              y1={4}
              x2={x}
              y2={108}
              stroke="#1f6f66"
              strokeWidth={0.75}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{ duration: 0.4, delay: 0.15 * i }}
            />
          ))}
          <motion.line
            x1={4}
            y1={56}
            x2={140}
            y2={56}
            stroke="#1f6f66"
            strokeWidth={0.75}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          />
        </svg>
        {/* Scanning sweep, like a drafting pen tracing the plot */}
        <motion.div
          className="absolute left-0 right-0 h-6 bg-gradient-to-b from-transparent via-ochre/25 to-transparent"
          initial={{ top: '-10%' }}
          animate={{ top: '100%' }}
          transition={{ duration: durationMs / 1000, repeat: Infinity, ease: 'linear' }}
        />
        <PencilRuler className="absolute -bottom-2 -right-2 h-5 w-5 text-ochre" />
      </div>

      <div className="w-40 space-y-2 text-center">
        <p className="font-mono text-[0.65rem] uppercase tracking-wider text-ink">
          Drafting Blueprint
        </p>
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-ink/10">
          <motion.div
            className="h-full bg-teal"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: durationMs / 1000, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  )
}

function ModelLoader({ durationMs }: { durationMs: number }) {
  const floors = [0, 1, 2, 3]
  const stagger = durationMs / 1000 / (floors.length + 1)

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8">
      <div className="relative flex h-28 w-28 items-end justify-center" style={{ perspective: 400 }}>
        <motion.div
          className="flex flex-col-reverse items-center gap-1"
          animate={{ rotateY: 360 }}
          transition={{ duration: durationMs / 1000, repeat: Infinity, ease: 'linear' }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {floors.map((f) => (
            <motion.div
              key={f}
              className="h-4 w-16 border border-teal/60 bg-teal/15"
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: f * stagger, ease: 'backOut' }}
              style={{ transformOrigin: 'bottom' }}
            />
          ))}
        </motion.div>
        <Building2 className="absolute -right-3 -top-1 h-5 w-5 text-ochre" />
      </div>

      <div className="w-44 space-y-2 text-center">
        <p className="font-mono text-[0.65rem] uppercase tracking-wider text-ink">
          Constructing Model
        </p>
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-ink/10">
          <motion.div
            className="h-full bg-ochre"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: durationMs / 1000, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </div>
  )
}

const STYLES = [
  { value: 'modern', label: 'Modern Contemporary', desc: 'Clean lines, open concept' },
  { value: 'vastu', label: 'Vastu Compliant', desc: 'Optimized directional energies' },
  { value: 'minimalist', label: 'Minimalist', desc: 'Maximum simplicity, fewer walls' },
]

const FACINGS = [
  { value: 'east', label: 'East Facing' },
  { value: 'west', label: 'West Facing' },
  { value: 'north', label: 'North Facing' },
  { value: 'south', label: 'South Facing' },
]

const FLOORS = [
  { value: 'ground', label: 'Ground Floor' },
  { value: 'first', label: 'First Floor' },
  { value: 'second', label: 'Second Floor' },
  { value: 'third', label: 'Third Floor' },
  { value: 'penthouse', label: 'Penthouse' },
]

const EXTRAS = [
  { value: 'pooja_room', label: 'Pooja Room' },
  { value: 'study', label: 'Study / Office' },
  { value: 'servant_quarter', label: 'Servant Quarter' },
  { value: 'store_room', label: 'Store Room' },
  { value: 'balcony', label: 'Attached Balcony' },
  { value: 'gym', label: 'Home Gym Space' },
  { value: 'staircase', label: 'Internal Staircase' },
]

const BLUEPRINT_DELAY_MS = 1500
const MODEL_DELAY_MS = 4000
const MODEL_GENERATION_LIMIT = 5

export default function HomeDesigner() {
  const { isLoaded, isSignedIn, userId } = useAuth()

  // Form State
  const [bhk, setBhk] = useState<number>(3)
  const [areaSqft, setAreaSqft] = useState<number>(1200)
  const [style, setStyle] = useState<string>('modern')
  const [facing, setFacing] = useState<string>('east')
  const [floor, setFloor] = useState<string>('ground')
  const [extras, setExtras] = useState<string[]>([])

  // Studio State
  const [activeTab, setActiveTab] = useState<'2d' | '3d'>('2d')
  const [isGenerating2D, setIsGenerating2D] = useState<boolean>(false)
  const [isGenerating3D, setIsGenerating3D] = useState<boolean>(false)
  const [ready2D, setReady2D] = useState<boolean>(false)
  const [ready3D, setReady3D] = useState<boolean>(false)
  const timer2DRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timer3DRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Caps how many 3D models a signed-in user can build, tracked per Clerk
  // userId in localStorage — the model is free/local, this just guards
  // against unbounded repeat clicks rather than metering a paid resource.
  const [used3D, setUsed3D] = useState<number>(0)
  const quota3DKey = userId ? `hd_3d_generations_${userId}` : null

  useEffect(() => {
    if (!quota3DKey) return
    const stored = Number(localStorage.getItem(quota3DKey) ?? '0')
    setUsed3D(Number.isFinite(stored) ? stored : 0)
  }, [quota3DKey])

  // The layout both the 2D blueprint and the 3D model are built from.
  const activeLayout = useMemo(
    () => computeFloorPlanLayout({ bhk, areaSqft, style, facing, floor, extras }),
    [bhk, areaSqft, style, facing, floor, extras]
  )

  const vastuFindings = useMemo(
    () => auditVastu(activeLayout, { bhk, areaSqft, style, facing, floor, extras }),
    [activeLayout, bhk, areaSqft, style, facing, floor, extras]
  )

  // Any spec change invalidates whatever was already drafted/built —
  // both previews go back behind their "Generate" gate.
  useEffect(() => {
    if (timer2DRef.current) clearTimeout(timer2DRef.current)
    if (timer3DRef.current) clearTimeout(timer3DRef.current)
    setIsGenerating2D(false)
    setIsGenerating3D(false)
    setReady2D(false)
    setReady3D(false)
  }, [activeLayout])

  useEffect(() => {
    return () => {
      if (timer2DRef.current) clearTimeout(timer2DRef.current)
      if (timer3DRef.current) clearTimeout(timer3DRef.current)
    }
  }, [])

  const handleExtraToggle = (value: string) => {
    setExtras(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const handleGenerate2D = () => {
    if (isGenerating2D) return
    setReady2D(false)
    setIsGenerating2D(true)
    timer2DRef.current = setTimeout(() => {
      setIsGenerating2D(false)
      setReady2D(true)
    }, BLUEPRINT_DELAY_MS)
  }

  const handleGenerate3D = () => {
    if (isGenerating3D || used3D >= MODEL_GENERATION_LIMIT) return
    setReady3D(false)
    setIsGenerating3D(true)
    if (quota3DKey) {
      const next = used3D + 1
      setUsed3D(next)
      localStorage.setItem(quota3DKey, String(next))
    }
    timer3DRef.current = setTimeout(() => {
      setIsGenerating3D(false)
      setReady3D(true)
    }, MODEL_DELAY_MS)
  }

  const handleGenerate = () => {
    if (activeTab === '2d') handleGenerate2D()
    else handleGenerate3D()
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bone">
        <Loader2 className="h-8 w-8 animate-spin text-concrete" />
      </div>
    )
  }

  const isGenerating = activeTab === '2d' ? isGenerating2D : isGenerating3D

  return (
    <div className="bg-bone min-h-screen relative overflow-hidden">
      {/* Drafting grid background overlay */}
      <div className="bg-[radial-gradient(var(--color-ink)_1px,transparent_1px)] [background-size:24px_24px] [background-position:center] opacity-[0.03] pointer-events-none absolute inset-0" />

      <Seo
        title="AI Home Designer — Carry Construction"
        description="Design a to-scale 2D floor plan blueprint and an interactive 3D model from your own dimensions and specifications."
        path="/home-designer"
      />

      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="border-b border-ink/10 bg-bone-dim relative z-10"
      >
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <span className="kicker">Interactive Studio</span>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Home Designer
          </h1>
          <p className="mt-2 max-w-xl text-xs sm:text-sm text-ink-soft">
            Input your dimensions and specifications, then generate a to-scale 2D blueprint or an interactive 3D model of your layout.
          </p>
        </div>
      </motion.div>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 relative z-10">
        {!isSignedIn ? (
          /* Locked State for Guest Users */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mx-auto max-w-lg border border-ink/10 bg-sand/30 p-8 text-center sm:p-12 backdrop-blur-xs"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center bg-teal/5 text-teal">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="mt-6 font-display text-xl font-semibold text-ink sm:text-2xl">
              Authenticate to Start Designing
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-ink-soft leading-relaxed">
              Sign in to use the interactive Home Designer studio and draft your own to-scale layouts.
            </p>
            <div className="mt-8">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 bg-teal px-6 py-3 font-mono text-xs uppercase tracking-wider text-bone hover:bg-teal-dark transition-colors duration-200 cursor-pointer"
                >
                  Sign In / Register <ArrowRight className="h-4 w-4" />
                </button>
              </SignInButton>
            </div>
          </motion.div>
        ) : (
          /* Main Workspace Grid */
          <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:gap-12">

            {/* LEFT COLUMN: Input Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              className="flex flex-col gap-6"
            >
              {activeTab === '3d' && (
                <div className="flex items-center justify-between border border-ink/10 bg-sand/20 px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${used3D < MODEL_GENERATION_LIMIT ? 'bg-teal' : 'bg-ochre'}`} />
                    <span className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft">
                      3D Model Generations
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-ink">
                    {Math.max(MODEL_GENERATION_LIMIT - used3D, 0)} of {MODEL_GENERATION_LIMIT} Left
                  </span>
                </div>
              )}

              <div className="border border-ink/10 bg-bone p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <h2 className="font-display text-lg font-semibold text-ink border-b border-ink/10 pb-3">
                  Specifications
                </h2>

                {/* BHK Config */}
                <div>
                  <label className="font-mono text-[0.68rem] uppercase tracking-wider text-concrete block mb-3">
                    Space Configuration (BHK)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBhk(val)}
                        className={`py-2 text-center border font-mono text-xs transition-colors duration-150 ${
                          bhk === val
                            ? 'bg-teal border-teal text-bone font-bold'
                            : 'border-ink/10 bg-bone hover:bg-bone-dim text-ink'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Built-up Area */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-mono text-[0.68rem] uppercase tracking-wider text-concrete">
                      Built-up Area
                    </label>
                    <span className="font-mono text-xs font-bold text-ink">{areaSqft} Sq Ft</span>
                  </div>
                  <input
                    type="range"
                    min="300"
                    max="6000"
                    step="50"
                    value={areaSqft}
                    onChange={(e) => setAreaSqft(Number(e.target.value))}
                    className="w-full h-1 bg-ink/10 rounded-lg appearance-none cursor-pointer accent-teal"
                  />
                  <div className="flex justify-between font-mono text-[0.6rem] text-concrete mt-1">
                    <span>300 sq ft</span>
                    <span>6,000 sq ft</span>
                  </div>
                </div>

                {/* Floor Level */}
                <div>
                  <label className="font-mono text-[0.68rem] uppercase tracking-wider text-concrete block mb-2">
                    Floor Level
                  </label>
                  <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full appearance-none border border-ink/10 bg-bone px-3 py-2 text-xs text-ink focus:border-teal focus:outline-none"
                  >
                    {FLOORS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Layout Style */}
                <div>
                  <label className="font-mono text-[0.68rem] uppercase tracking-wider text-concrete block mb-3">
                    Design Theme
                  </label>
                  <div className="space-y-2">
                    {STYLES.map((s) => (
                      <div
                        key={s.value}
                        onClick={() => setStyle(s.value)}
                        className={`flex items-center justify-between border p-3 cursor-pointer transition-colors duration-150 ${
                          style === s.value
                            ? 'border-teal bg-teal/5'
                            : 'border-ink/10 hover:border-ink/20'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold text-ink">{s.label}</p>
                          <p className="text-[0.62rem] text-concrete mt-0.5">{s.desc}</p>
                        </div>
                        {style === s.value && (
                          <div className="flex h-5 w-5 items-center justify-center bg-teal text-bone rounded-full">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Facing Direction */}
                <div>
                  <label className="font-mono text-[0.68rem] uppercase tracking-wider text-concrete block mb-2">
                    Entrance Orientation
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {FACINGS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setFacing(f.value)}
                        className={`py-2 text-center border font-mono text-[0.62rem] uppercase tracking-wider transition-colors duration-150 ${
                          facing === f.value
                            ? 'bg-teal border-teal text-bone font-bold'
                            : 'border-ink/10 bg-bone hover:bg-bone-dim text-ink'
                        }`}
                      >
                        {f.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extra rooms */}
                <div>
                  <label className="font-mono text-[0.68rem] uppercase tracking-wider text-concrete block mb-3">
                    Additional Rooms / Spaces
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {EXTRAS.map((item) => {
                      const selected = extras.includes(item.value)
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleExtraToggle(item.value)}
                          className={`flex items-center gap-2 border px-3 py-2 text-left transition-colors duration-150 ${
                            selected
                              ? 'border-teal bg-teal/5 text-teal font-medium'
                              : 'border-ink/10 hover:border-ink/25 text-ink'
                          }`}
                        >
                          <div className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                            selected ? 'border-teal bg-teal text-bone' : 'border-ink/20'
                          }`}>
                            {selected && <Check className="h-3 w-3" />}
                          </div>
                          <span className="text-[0.68rem]">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <p className="text-[0.65rem] text-concrete leading-relaxed">
                  {activeTab === '3d' && used3D >= MODEL_GENERATION_LIMIT
                    ? `You've used all ${MODEL_GENERATION_LIMIT} of your 3D model generations.`
                    : `Edit your specs above any time — switch to the ${activeTab === '2d' ? '2D Blueprint' : '3D Visualize'} tab on the right and hit the button below to draft it.`}
                </p>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || (activeTab === '3d' && used3D >= MODEL_GENERATION_LIMIT)}
                  className="w-full flex items-center justify-center gap-2 bg-ochre hover:bg-ochre-dark disabled:bg-sand text-ink disabled:text-concrete py-3 font-mono text-xs uppercase tracking-wider transition-colors duration-200 cursor-pointer font-bold"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {activeTab === '2d' ? 'Drafting Blueprint...' : 'Constructing Model...'}
                    </>
                  ) : activeTab === '3d' && used3D >= MODEL_GENERATION_LIMIT ? (
                    <>
                      <Lock className="h-4 w-4" />
                      3D Limit Reached
                    </>
                  ) : activeTab === '2d' ? (
                    <>
                      <Ruler className="h-4 w-4" />
                      Generate 2D Visualization
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate 3D Visualization
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* RIGHT COLUMN: Studio Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="space-y-6"
            >

              {/* Studio Window */}
              <div className="border border-ink/10 bg-bone p-4 flex flex-col shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Compass className="h-4 w-4 text-teal animate-pulse" />
                      <span className="font-display font-medium text-ink text-sm sm:text-base">Studio</span>
                    </div>
                    {/* Tab Switcher */}
                    <div className="flex border border-ink/10 bg-sand/20 p-0.5 rounded-sm">
                      <button
                        type="button"
                        onClick={() => setActiveTab('2d')}
                        className={`px-3 py-1 font-mono text-[0.62rem] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          activeTab === '2d'
                            ? 'bg-teal text-bone font-bold'
                            : 'text-concrete hover:text-ink'
                        }`}
                      >
                        2D Blueprint
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('3d')}
                        className={`px-3 py-1 font-mono text-[0.62rem] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                          activeTab === '3d'
                            ? 'bg-teal text-bone font-bold'
                            : 'text-concrete hover:text-ink'
                        }`}
                      >
                        3D Visualize
                      </button>
                    </div>
                  </div>
                </div>

                {/* Preview Viewport */}
                <div className="w-full h-[520px] sm:h-[640px] lg:h-[720px] flex items-center justify-center border border-ink/5 bg-sand/10 relative overflow-hidden">

                  <AnimatePresence mode="wait">
                    {activeTab === '2d' ? (
                      isGenerating2D ? (
                        <motion.div
                          key="2d-loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <BlueprintLoader durationMs={BLUEPRINT_DELAY_MS} />
                        </motion.div>
                      ) : ready2D ? (
                        <motion.div
                          key="2d-ready"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className="w-full h-full relative"
                        >
                          <FloorPlan2D
                            bhk={bhk}
                            areaSqft={areaSqft}
                            style={style}
                            facing={facing}
                            floor={floor}
                            extras={extras}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="2d-cta"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center p-6 text-center"
                        >
                          <div className="max-w-xs bg-bone p-6 border border-ink/10 shadow-sm">
                            <PencilRuler className="h-8 w-8 text-concrete mx-auto mb-3" />
                            <h3 className="font-display text-sm font-semibold text-ink">No Blueprint Yet</h3>
                            <p className="text-[0.68rem] text-concrete mt-1.5 leading-relaxed">
                              Hit "Generate 2D Visualization" on the left to draft a to-scale blueprint of this layout.
                            </p>
                          </div>
                        </motion.div>
                      )
                    ) : isGenerating3D ? (
                      <motion.div
                        key="3d-loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <ModelLoader durationMs={MODEL_DELAY_MS} />
                      </motion.div>
                    ) : ready3D ? (
                      <motion.div
                        key="3d-ready"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="w-full h-full relative"
                      >
                        <Suspense
                          fallback={
                            <div className="w-full h-full flex items-center justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-teal" />
                            </div>
                          }
                        >
                          <FloorPlan3D layout={activeLayout} facing={facing} />
                        </Suspense>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="3d-cta"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center p-6 text-center"
                      >
                        <div className="max-w-xs bg-bone p-6 border border-ink/10 shadow-sm">
                          {used3D >= MODEL_GENERATION_LIMIT ? (
                            <>
                              <Lock className="h-8 w-8 text-concrete mx-auto mb-3" />
                              <h3 className="font-display text-sm font-semibold text-ink">3D Limit Reached</h3>
                              <p className="text-[0.68rem] text-concrete mt-1.5 leading-relaxed">
                                You've used all {MODEL_GENERATION_LIMIT} of your 3D model generations.
                              </p>
                            </>
                          ) : (
                            <>
                              <Home className="h-8 w-8 text-concrete mx-auto mb-3" />
                              <h3 className="font-display text-sm font-semibold text-ink">No Model Yet</h3>
                              <p className="text-[0.68rem] text-concrete mt-1.5 leading-relaxed">
                                Hit "Generate 3D Visualization" on the left to build an interactive model of this layout.
                              </p>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Vastu audit — shown once a preview for this layout exists. */}
                {style === 'vastu' && (ready2D || ready3D) && vastuFindings.length > 0 && (
                  <div className="mt-3 border border-ink/10 bg-bone-dark/30 p-3">
                    <h4 className="font-display font-semibold text-[0.7rem] text-ink mb-2 uppercase tracking-[0.08em] flex items-center gap-1.5">
                      <Compass className="h-3 w-3 text-teal" />
                      Vastu Review · {vastuFindings.filter((f) => f.severity === 'violation').length} violation
                      {vastuFindings.filter((f) => f.severity === 'violation').length === 1 ? '' : 's'},{' '}
                      {vastuFindings.filter((f) => f.severity === 'advisory').length} advisory
                    </h4>
                    <ul className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                      {vastuFindings.map((f) => (
                        <li key={f.code} className="flex items-start gap-2 text-[0.65rem] leading-relaxed">
                          <span
                            className={`shrink-0 mt-1 h-1.5 w-1.5 rounded-full ${
                              f.severity === 'violation' ? 'bg-red-600' : 'bg-ochre'
                            }`}
                          />
                          <span className="text-concrete">{f.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            </motion.div>

          </div>
        )}
      </div>
    </div>
  )
}
