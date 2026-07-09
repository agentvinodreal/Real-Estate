import { useEffect, useState } from 'react'

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/** Gates the 3D hero scene to desktop, motion-tolerant, WebGL-capable browsers. */
export default function useCanRender3D(): boolean {
  const [canRender, setCanRender] = useState(false)

  useEffect(() => {
    const widthQuery = window.matchMedia('(min-width: 1024px)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    function evaluate() {
      setCanRender(widthQuery.matches && !motionQuery.matches && hasWebGL())
    }

    evaluate()
    widthQuery.addEventListener('change', evaluate)
    motionQuery.addEventListener('change', evaluate)
    return () => {
      widthQuery.removeEventListener('change', evaluate)
      motionQuery.removeEventListener('change', evaluate)
    }
  }, [])

  return canRender
}
