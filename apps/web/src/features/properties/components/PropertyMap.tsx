import { useEffect, useRef, useState } from 'react'

type Props = {
  lat: number
  lng: number
  title: string
  className?: string
}

export default function PropertyMap({ lat, lng, title, className = '' }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [useFallback, setUseFallback] = useState(true)

  useEffect(() => {
    const mapKey = import.meta.env.VITE_MAPPLS_MAP_KEY
    if (!mapKey) {
      setUseFallback(true)
      return
    }

    let isMounted = true
    const scriptId = 'mappls-sdk-script'
    let script = document.getElementById(scriptId) as HTMLScriptElement | null

    const initMap = () => {
      if (!isMounted || !mapContainerRef.current) return
      try {
        // @ts-ignore
        const map = new window.mappls.Map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: 15,
          zoomControl: true,
          hybrid: false
        })

        map.addListener('load', () => {
          if (!isMounted) return
          // @ts-ignore
          new window.mappls.Marker({
            map: map,
            position: [lat, lng],
            popupHtml: `<div className="font-sans text-xs p-1 font-semibold">${title}</div>`,
            html: '<div className="h-4 w-4 bg-ochre rounded-full border-2 border-bone shadow-md"></div>'
          })
          setUseFallback(false)
        })
      } catch (err) {
        console.error('Failed to init Mappls map:', err)
        setUseFallback(true)
      }
    }

    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = `https://apis.mappls.com/advancedmaps/api/v1.5/map_sdk?key=${mapKey}`
      script.async = true
      script.defer = true
      script.onload = () => {
        // @ts-ignore
        if (window.mappls) {
          initMap()
        } else {
          setUseFallback(true)
        }
      }
      script.onerror = () => {
        setUseFallback(true)
      }
      document.head.appendChild(script)
    } else {
      // @ts-ignore
      if (window.mappls) {
        initMap()
      } else {
        script.addEventListener('load', initMap)
      }
    }

    return () => {
      isMounted = false
    }
  }, [lat, lng, title])

  if (useFallback) {
    return (
      <div className={`relative overflow-hidden border border-ink/10 ${className}`}>
        <iframe
          src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
          className="w-full h-full border-none"
          allowFullScreen
          loading="lazy"
          title="Google Map Fallback"
        />
      </div>
    )
  }

  return (
    <div className={`border border-ink/10 overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
    </div>
  )
}
