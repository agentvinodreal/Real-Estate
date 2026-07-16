import { useState, useEffect } from 'react'
import { useAuth, SignInButton } from '@clerk/clerk-react'
import { motion } from 'motion/react'
import Seo from '../components/Seo'
import FloorPlan2D from '../components/home-designer/FloorPlan2D'
import {
  Sparkles, 
  Trash2, 
  Download, 
  Loader2, 
  Compass, 
  Check, 
  Home, 
  AlertTriangle,
  History,
  Lock,
  ArrowRight
} from 'lucide-react'

interface Plan {
  id: string;
  inputs: {
    bhk: number;
    areaSqft: number;
    style: string;
    facing: string;
    extras: string[];
    floor: string;
  };
  imageUrl: string;
  status: string;
  createdAt: string;
}

interface Quota {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}

const STYLES = [
  { value: 'modern', label: 'Modern Contemporary', desc: 'Clean lines, open concept' },
  { value: 'traditional', label: 'Traditional Indian', desc: 'Separate formal spaces & kitchen' },
  { value: 'vastu', label: 'Vastu Compliant', desc: 'Optimized directional energies' },
  { value: 'minimalist', label: 'Minimalist', desc: 'Maximum simplicity, fewer walls' },
  { value: 'open-plan', label: 'Open Plan', desc: 'Seamlessly connected spaces' },
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
]

export default function HomeDesigner() {
  const { isLoaded, isSignedIn, getToken } = useAuth()

  // Form State
  const [bhk, setBhk] = useState<number>(3)
  const [areaSqft, setAreaSqft] = useState<number>(1200)
  const [style, setStyle] = useState<string>('modern')
  const [facing, setFacing] = useState<string>('east')
  const [floor, setFloor] = useState<string>('ground')
  const [extras, setExtras] = useState<string[]>([])

  // Quota & Plans State
  const [quota, setQuota] = useState<Quota | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [activePlan, setActivePlan] = useState<Plan | null>(null)

  // UX State
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'2d' | '3d'>('2d')

  // Custom AI 2D Layout State
  const [specialRequirements, setSpecialRequirements] = useState<string>('')
  const [aiLayout, setAiLayout] = useState<any>(null)
  const [isGeneratingLayout, setIsGeneratingLayout] = useState<boolean>(false)

  // Reset custom AI layout when any core parameters change
  useEffect(() => {
    setAiLayout(null)
  }, [bhk, areaSqft, style, facing, floor, extras])

  // Fetch quota & plans on load / auth state change
  useEffect(() => {
    if (isSignedIn) {
      fetchQuota()
      fetchPlans()
    }
  }, [isSignedIn])

  const fetchQuota = async () => {
    try {
      const token = await getToken()
      const res = await fetch('/api/v1/home-designer/quota', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setQuota(data)
      }
    } catch (err) {
      console.error('Failed to fetch quota:', err)
    }
  }

  const fetchPlans = async () => {
    setLoadingHistory(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/v1/home-designer/my-plans', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPlans(data)
        if (data.length > 0 && !activePlan) {
          setActivePlan(data[0])
        }
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleExtraToggle = (value: string) => {
    setExtras(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const handleGenerate2DLayout = async () => {
    if (isGeneratingLayout) return
    setIsGeneratingLayout(true)
    setGenError(null)

    try {
      const token = await getToken()
      const response = await fetch('/api/v1/home-designer/generate-2d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bhk,
          areaSqft,
          style,
          facing,
          extras,
          floor,
          specialRequirements,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to generate custom AI layout')
      }

      const data = await response.json()
      setAiLayout(data.layout)
      fetchQuota()
    } catch (err: any) {
      setGenError(err.message || 'Failed to customize blueprint with AI. Please try again.')
    } finally {
      setIsGeneratingLayout(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isGenerating) return
    setIsGenerating(true)
    setGenError(null)

    try {
      const token = await getToken()
      const response = await fetch('/api/v1/home-designer/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bhk,
          areaSqft,
          style,
          facing,
          extras,
          floor,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to generate visualization')
      }

      const data = await response.json()
      
      // Build a local Plan object from success payload
      const newPlan: Plan = {
        id: data.generationId,
        inputs: data.inputs,
        imageUrl: data.imageUrl,
        status: 'completed',
        createdAt: new Date().toISOString(),
      }

      setPlans(prev => [newPlan, ...prev])
      setActivePlan(newPlan)
      setActiveTab('3d')
      fetchQuota() // update remaining count
    } catch (err: any) {
      setGenError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDeleting) return
    setIsDeleting(id)
    setGenError(null)

    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/home-designer/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Server responded with status ${res.status}`)
      }

      setPlans(prev => prev.filter(p => p.id !== id))
      if (activePlan?.id === id) {
        const remaining = plans.filter(p => p.id !== id)
        setActivePlan(remaining.length > 0 ? remaining[0] : null)
      }
      fetchQuota()
    } catch (err: any) {
      console.error('Delete failed:', err)
      setGenError(err.message || 'Failed to delete the floor plan.')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      // Fallback
      window.open(imageUrl, '_blank')
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-bone">
        <Loader2 className="h-8 w-8 animate-spin text-concrete" />
      </div>
    )
  }

  return (
    <div className="bg-bone min-h-screen relative overflow-hidden">
      {/* Drafting grid background overlay */}
      <div className="bg-[radial-gradient(var(--color-ink)_1px,transparent_1px)] [background-size:24px_24px] [background-position:center] opacity-[0.03] pointer-events-none absolute inset-0" />

      <Seo
        title="AI Home Designer — Carry Construction"
        description="Design to-scale 2D floor plan blueprints instantly, and generate optional AI 3D visualizations of your custom layout."
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
            Input your dimensions and specifications for an instant to-scale 2D blueprint, then optionally generate an AI 3D visualization on demand.
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
              To control costs and maintain plan quality, our interactive AI Home Designer requires registration. Signing in grants you <strong>3 free generations daily</strong>.
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
              {quota && (
                <div className="flex items-center justify-between border border-ink/10 bg-sand/20 px-4 py-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${quota.remaining > 0 ? 'bg-teal' : 'bg-ochre'}`} />
                    <span className="font-mono text-[0.68rem] uppercase tracking-wider text-ink-soft">
                      Daily Usage Quota
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-ink">
                    {quota.remaining} of {quota.limit} Left
                  </span>
                </div>
              )}

              <form onSubmit={handleGenerate} className="border border-ink/10 bg-bone p-6 space-y-6 shadow-sm hover:shadow-md transition-shadow duration-300">
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

                {/* Special Requirements */}
                <div>
                  <label className="font-mono text-[0.68rem] uppercase tracking-wider text-concrete block mb-2">
                    Special Requirements (AI 2D Customization)
                  </label>
                  <textarea
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    placeholder="e.g. make the master bedroom massive, place kitchen next to living room, add front lawn area..."
                    rows={3}
                    className="w-full border border-ink/10 bg-bone px-3 py-2 text-xs text-ink focus:border-teal focus:outline-none placeholder-concrete font-sans resize-none"
                  />
                </div>

                {genError && (
                  <div className="flex gap-2 border border-ochre/40 bg-ochre/5 p-3 text-xs text-ochre-dark">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p>{genError}</p>
                  </div>
                )}

                <p className="text-[0.65rem] text-concrete leading-relaxed">
                  Your 2D Blueprint updates instantly on the right as you edit specs above — no generation needed.
                  Use the button below only when you want an AI-rendered photorealistic 3D visualization (uses your daily quota).
                </p>

                <button
                  type="submit"
                  disabled={isGenerating || (quota !== null && quota.remaining <= 0)}
                  className="w-full flex items-center justify-center gap-2 bg-ochre hover:bg-ochre-dark disabled:bg-sand text-ink disabled:text-concrete py-3 font-mono text-xs uppercase tracking-wider transition-colors duration-200 cursor-pointer font-bold"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Rendering Visualization...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate 3D Visualization
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* RIGHT COLUMN: Studio Preview & History */}
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
                  {activeTab === '3d' && activePlan && (
                    <button
                      onClick={() => handleDownload(activePlan.imageUrl, `carry_floor_plan_${activePlan.id.slice(0, 8)}`)}
                      className="flex items-center gap-1.5 border border-ink/15 hover:border-teal hover:text-teal px-3 py-1 font-mono text-[0.62rem] uppercase tracking-wider text-ink transition-colors duration-150 cursor-pointer"
                    >
                      <Download className="h-3 w-3" /> Save Layout
                    </button>
                  )}
                </div>

                {/* Preview Viewport */}
                <div className="w-full h-[450px] flex items-center justify-center border border-ink/5 bg-sand/10 relative overflow-hidden">

                  {activeTab === '2d' ? (
                    <div className="w-full h-full relative">
                      <FloorPlan2D
                        bhk={bhk}
                        areaSqft={areaSqft}
                        style={style}
                        facing={facing}
                        floor={floor}
                        extras={extras}
                        customLayout={aiLayout}
                      />
                      <div className="absolute bottom-12 left-2 right-2 flex items-center justify-between bg-bone/90 backdrop-blur-sm border border-ink/10 px-3 py-2 shadow-sm">
                        <p className="text-[0.65rem] text-concrete font-mono">
                          {aiLayout ? "✨ CUSTOM AI 2D BLUEPRINT ACTIVE" : "💡 ADD SPECIAL REQUIREMENTS TO CUSTOMIZE WITH AI"}
                        </p>
                        {specialRequirements.trim().length > 0 && (
                          <button
                            type="button"
                            onClick={handleGenerate2DLayout}
                            disabled={isGeneratingLayout}
                            className="flex items-center gap-1 bg-teal hover:bg-teal-dark disabled:bg-sand text-bone disabled:text-concrete px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-wider transition-colors duration-150 cursor-pointer font-bold"
                          >
                            {isGeneratingLayout ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Customizing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3" />
                                Generate AI 2D Blueprint
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : isGenerating ? (
                    /* Loading State */
                    <div className="text-center p-8 space-y-3 z-10">
                      <Loader2 className="h-10 w-10 animate-spin text-teal mx-auto" />
                      <p className="font-display text-sm font-semibold text-ink animate-pulse">
                        Rendering Visualization...
                      </p>
                      <p className="text-[0.68rem] text-concrete max-w-xs mx-auto">
                        Generating a photorealistic AI render of this layout. Please hold.
                      </p>
                    </div>
                  ) : activePlan ? (
                    /* Display Generated AI Visualization */
                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                      <img
                        src={activePlan.imageUrl}
                        alt="AI 3D Visualization"
                        className="max-h-[380px] w-auto object-contain border border-ink/10 shadow-sm"
                      />
                      <div className="mt-3 text-center">
                        <p className="font-mono text-[0.65rem] uppercase tracking-wider text-concrete">
                          Specs: {activePlan.inputs.bhk}BHK · {activePlan.inputs.areaSqft} sqft · {activePlan.inputs.style} · {activePlan.inputs.facing} Facing
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Fallback / CTA */
                    <div className="blueprint absolute inset-0 flex items-center justify-center p-6 text-center">
                      <div className="max-w-xs bg-bone p-6 border border-ink/10 shadow-sm">
                        <Home className="h-8 w-8 text-concrete mx-auto mb-3" />
                        <h3 className="font-display text-sm font-semibold text-ink">No Visualization Yet</h3>
                        <p className="text-[0.68rem] text-concrete mt-1.5 leading-relaxed">
                          Hit "Generate 3D Visualization" on the left to render a photorealistic AI concept of this layout. This uses one of your daily generations.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Plans History List */}
              <div className="border border-ink/10 bg-bone p-4">
                <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-concrete" />
                    <span className="font-display font-medium text-ink text-sm sm:text-base">Visualization History</span>
                  </div>
                  <span className="font-mono text-[0.68rem] text-concrete">
                    {plans.length} Renders Saved
                  </span>
                </div>

                {loadingHistory ? (
                  <div className="flex py-8 justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-concrete" />
                  </div>
                ) : plans.length === 0 ? (
                  <p className="text-center py-6 text-xs text-concrete">
                    No AI visualizations generated yet. Use the button on the form above.
                  </p>
                ) : (
                  <div className="grid gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {plans.map((p) => {
                      const isActive = activePlan?.id === p.id
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setActivePlan(p)
                            setActiveTab('3d')
                          }}
                          className={`flex items-center gap-3 border p-2 cursor-pointer transition-colors duration-150 ${
                            isActive
                              ? 'border-teal bg-teal/5'
                              : 'border-ink/10 hover:border-ink/20 bg-bone'
                          }`}
                        >
                          <img
                            src={p.imageUrl}
                            alt={`${p.inputs.bhk}BHK ${p.inputs.style} layout visualization`}
                            className="h-10 w-10 shrink-0 object-cover border border-ink/10"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">
                              {p.inputs.bhk}BHK Visualization
                            </p>
                            <p className="text-[0.62rem] text-concrete mt-0.5 truncate">
                              {p.inputs.areaSqft} sqft · {p.inputs.style} · {new Date(p.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <button
                            disabled={isDeleting !== null}
                            onClick={(e) => handleDelete(p.id, e)}
                            className="p-1 text-concrete hover:text-ochre disabled:text-concrete transition-colors cursor-pointer"
                            aria-label="Delete plan"
                          >
                            {isDeleting === p.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )
                    })}
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
