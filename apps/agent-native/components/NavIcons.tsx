import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'

/**
 * NavIcons — native ports of the web app's colourful bottom-nav icons
 * (apps/agent/src/components/icons/NavIcons.tsx), drawn with plain Views so no
 * native SVG dependency is needed and the whole thing stays OTA-deliverable.
 *
 * Geometry and palette are transcribed 1:1 from the web SVGs, scaled from the
 * 24x24 viewBox onto a 24pt box. Inactive icons are desaturated to match the
 * web's `filter: grayscale(1) opacity(0.55)`; RN has no grayscale filter, so the
 * fills are converted to their luminance equivalent instead.
 */

const BOX = 24

// Rec. 601 luma — the same weighting a CSS grayscale() filter applies.
function gray(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
  const v = l.toString(16).padStart(2, '0')
  return `#${v}${v}${v}`
}

const useFill = (hex: string, focused: boolean) => (focused ? hex : gray(hex))

/**
 * Replays the web's `nav-icon-pop` keyframes whenever the tab becomes active:
 * scale(0.7) rotate(-8deg) → scale(1.2) rotate(5deg) → scale(1) rotate(0),
 * 0.4s on a cubic-bezier(0.34, 1.56, 0.64, 1) overshoot curve.
 */
function PopWrapper({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const t = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!focused) return
    t.setValue(0)
    Animated.sequence([
      Animated.timing(t, { toValue: 0.6, duration: 240, useNativeDriver: true }),
      Animated.spring(t, { toValue: 1, damping: 9, stiffness: 220, useNativeDriver: true }),
    ]).start()
  }, [focused, t])

  const scale = t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.7, 1.2, 1] })
  const rotate = t.interpolate({ inputRange: [0, 0.6, 1], outputRange: ['-8deg', '5deg', '0deg'] })

  return (
    <Animated.View
      style={[
        styles.box,
        { opacity: focused ? 1 : 0.55, transform: [{ scale }, { rotate }] },
      ]}
    >
      {children}
    </Animated.View>
  )
}

export function PropertiesIcon({ focused }: { focused: boolean }) {
  return (
    <PopWrapper focused={focused}>
      {/* roof: polygon 12,3 21,10.5 3,10.5 */}
      <View
        style={{
          position: 'absolute', top: 3, left: 3,
          borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 7.5,
          borderLeftColor: 'transparent', borderRightColor: 'transparent',
          borderBottomColor: useFill('#E8871E', focused),
        }}
      />
      {/* body */}
      <View
        style={{
          position: 'absolute', left: 5, top: 10.5, width: 14, height: 10,
          borderRadius: 1, borderWidth: 1,
          backgroundColor: useFill('#FFF3DC', focused),
          borderColor: useFill('#1C1B18', focused),
        }}
      />
      {/* door */}
      <View
        style={{
          position: 'absolute', left: 9.75, top: 14.5, width: 4.5, height: 6,
          backgroundColor: useFill('#7A5230', focused),
        }}
      />
      {/* window */}
      <View
        style={{
          position: 'absolute', left: 6.5, top: 12.5, width: 2.5, height: 2.5,
          borderRadius: 0.5, backgroundColor: useFill('#4C6FFF', focused),
        }}
      />
    </PopWrapper>
  )
}

export function ServicemenIcon({ focused }: { focused: boolean }) {
  return (
    <PopWrapper focused={focused}>
      {/* helmet dome: path M4 17 a8 8 0 0 1 16 0 */}
      <View
        style={{
          position: 'absolute', left: 4, top: 9, width: 16, height: 8,
          borderTopLeftRadius: 8, borderTopRightRadius: 8,
          backgroundColor: useFill('#FFC531', focused),
          borderWidth: 0.8, borderBottomWidth: 0,
          borderColor: useFill('#1C1B18', focused),
        }}
      />
      {/* brim */}
      <View
        style={{
          position: 'absolute', left: 2, top: 16.5, width: 20, height: 2.6,
          borderRadius: 1.3, borderWidth: 0.6,
          backgroundColor: useFill('#E8871E', focused),
          borderColor: useFill('#1C1B18', focused),
        }}
      />
      {/* crest knob */}
      <View
        style={{
          position: 'absolute', left: 10.5, top: 7.4, width: 3, height: 2.6,
          borderRadius: 0.8, backgroundColor: useFill('#2E3A40', focused),
        }}
      />
    </PopWrapper>
  )
}

export function ShopsIcon({ focused }: { focused: boolean }) {
  return (
    <PopWrapper focused={focused}>
      {/* awning: trapezoid M3 9 l1.5-5 h15 L21 9 */}
      <View
        style={{
          position: 'absolute', left: 3, top: 4,
          borderBottomWidth: 5, borderLeftWidth: 1.5, borderRightWidth: 1.5,
          borderLeftColor: 'transparent', borderRightColor: 'transparent',
          borderBottomColor: useFill('#1F9D82', focused),
          width: 18,
        }}
      />
      {/* scalloped valance */}
      <View
        style={{
          position: 'absolute', left: 3, top: 9, width: 18, height: 2.2,
          borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
          backgroundColor: useFill('#FFF3DC', focused),
          borderWidth: 0.5, borderTopWidth: 0,
          borderColor: useFill('#1C1B18', focused),
        }}
      />
      {/* storefront */}
      <View
        style={{
          position: 'absolute', left: 5, top: 12.5, width: 14, height: 8,
          borderRadius: 0.5, borderWidth: 1,
          backgroundColor: useFill('#FFFFFF', focused),
          borderColor: useFill('#1C1B18', focused),
        }}
      />
      {/* door */}
      <View
        style={{
          position: 'absolute', left: 10, top: 15, width: 4, height: 5.5,
          backgroundColor: useFill('#7A5230', focused),
        }}
      />
    </PopWrapper>
  )
}

export function ProfileIcon({ focused }: { focused: boolean }) {
  return (
    <PopWrapper focused={focused}>
      {/* clipped avatar disc */}
      <View
        style={{
          position: 'absolute', left: 2, top: 2, width: 20, height: 20,
          borderRadius: 10, overflow: 'hidden',
          backgroundColor: useFill('#6C5CE7', focused),
        }}
      >
        {/* head */}
        <View
          style={{
            position: 'absolute', left: 6.8, top: 4.3, width: 6.4, height: 6.4,
            borderRadius: 3.2, backgroundColor: useFill('#FFF3DC', focused),
          }}
        />
        {/* shoulders */}
        <View
          style={{
            position: 'absolute', left: 2, top: 13, width: 16, height: 12,
            borderTopLeftRadius: 8, borderTopRightRadius: 8,
            backgroundColor: useFill('#FFF3DC', focused),
          }}
        />
      </View>
    </PopWrapper>
  )
}

const styles = StyleSheet.create({
  box: { width: BOX, height: BOX, position: 'relative' },
})
