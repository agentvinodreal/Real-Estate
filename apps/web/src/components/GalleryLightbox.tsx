import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import Photo from './Photo'

type Props = {
  images: string[]
  open: boolean
  startIndex?: number
  onClose: () => void
}

export default function GalleryLightbox({ images, open, startIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)

  // Sync index with startIndex when lightbox opens
  useEffect(() => {
    if (open) {
      setIndex(startIndex)
    }
  }, [open, startIndex])

  // Prevent background scrolling when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === 'Right') handleNext()
      if (e.key === 'ArrowLeft' || e.key === 'Left') handlePrev()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, index, images.length])

  // Touch Swipe handlers
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe) handleNext()
    if (isRightSwipe) handlePrev()
  }

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % images.length)
  }

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (!open) return null

  const modalRoot = document.body

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-ink/95 pb-[env(safe-area-inset-bottom,20px)] pt-[env(safe-area-inset-top,20px)] text-bone backdrop-blur-sm select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Top bar info & controls */}
        <div className="flex w-full items-center justify-between px-6 py-4">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-bone/60">
            {index + 1} / {images.length}
          </span>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-bone/10 text-bone/70 transition-colors hover:border-ochre hover:text-ochre focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre"
            aria-label="Close gallery"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Center content with navigation buttons */}
        <div className="relative flex w-full flex-1 items-center justify-between px-4 sm:px-6">
          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            className="z-10 flex h-12 w-12 items-center justify-center rounded-full border border-bone/10 bg-ink/40 text-bone/70 transition-colors hover:border-ochre hover:text-ochre focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre max-sm:hidden"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Active Image */}
          <div className="relative flex h-full w-full max-w-5xl items-center justify-center overflow-hidden p-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="h-full w-full"
              >
                <Photo
                  src={images[index]}
                  seed={`lightbox-${index}`}
                  className="h-full w-full"
                  objectFit="contain"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="z-10 flex h-12 w-12 items-center justify-center rounded-full border border-bone/10 bg-ink/40 text-bone/70 transition-colors hover:border-ochre hover:text-ochre focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre max-sm:hidden"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Bottom thumbnail strip for fast nav */}
        <div className="mt-4 flex max-w-full items-center gap-2 overflow-x-auto px-6 py-4 scrollbar-none">
          {images.map((imgUrl, idx) => (
            <button
              key={idx}
              onClick={() => setIndex(idx)}
              className={`relative h-14 w-20 shrink-0 overflow-hidden border transition-all duration-200 ${
                idx === index ? 'border-ochre scale-105' : 'border-bone/15 opacity-50 hover:opacity-100'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            >
              <Photo src={imgUrl} seed={`thumb-${idx}`} className="h-full w-full" objectFit="cover" />
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>,
    modalRoot
  )
}
