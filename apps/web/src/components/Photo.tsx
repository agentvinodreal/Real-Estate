import { useState } from 'react'
import { motion } from 'motion/react'
import Placeholder from './Placeholder'
import { dummyPhoto } from '../lib/images'
import { EASE_OUT_EXPO } from '../lib/motion'

type PhotoProps = {
  seed: string
  label?: string
  className?: string
  w?: number
  h?: number
  rounded?: boolean
  /** Overrides the default picsum.photos URL (e.g. for pravatar avatars). */
  src?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
}

/**
 * Dummy photography with a graceful fallback. Renders a deterministic
 * picsum.photos image (same seed → same photo) that fades in on load;
 * falls back to the blueprint <Placeholder> if the request fails (e.g. offline).
 */
export default function Photo({ seed, label, className = '', w = 800, h = 600, rounded = false, src, objectFit = 'cover' }: PhotoProps) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (failed) {
    return <Placeholder label={label ?? seed} className={className} />
  }

  return (
    <div className={`relative overflow-hidden ${rounded ? 'rounded-full' : ''} ${className}`}>
      {!loaded && <div className={`blueprint absolute inset-0 ${rounded ? 'rounded-full' : ''}`} />}
      <motion.img
        src={src ?? dummyPhoto(seed, w, h)}
        alt={label ?? seed}
        loading="lazy"
        className={`h-full w-full ${rounded ? 'rounded-full' : ''}`}
        style={{ objectFit }}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
