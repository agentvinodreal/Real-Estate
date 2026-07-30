import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'
import { useAuth } from '@clerk/clerk-expo'
import { runFullSync } from '../lib/sync'
import { getPendingCount, resetStuckUploads } from '../lib/uploadQueue'
import { persistToken } from '../lib/auth'
import { colors } from '../theme/colors'

type BannerStatus = 'online' | 'offline' | 'syncing' | 'synced' | 'partial'

export function NetworkBanner() {
  const { getToken, isSignedIn } = useAuth()
  const [status, setStatus] = useState<BannerStatus>('online')
  const [pendingCount, setPendingCount] = useState(0)
  const opacity = useRef(new Animated.Value(0)).current
  const wasOffline = useRef(false)
  const isSyncing = useRef(false)

  // Show / hide banner
  const show = useCallback(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start()
  }, [opacity])

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start()
  }, [opacity])

  // Guarded against overlapping calls — on a weak/flapping signal, NetInfo's
  // reachability probe can fire several offline→online transitions in a row,
  // and without this guard each one would kick off its own concurrent
  // runFullSync() pass over the same SQLite queue.
  const sync = useCallback(async () => {
    if (!isSignedIn || isSyncing.current) return
    isSyncing.current = true
    try {
      const token = await getToken()
      if (!token) return
      await persistToken(token)
      setStatus('syncing')
      show()
      await runFullSync(token)
      const remaining = getPendingCount()
      setStatus(remaining === 0 ? 'synced' : 'partial')
      setPendingCount(remaining)
      // Only dismiss on a clean sweep. Auto-hiding the "still pending" warning
      // after 3s is what made a stalled queue invisible — the agent saw a flash
      // of orange and assumed it had gone through.
      if (remaining === 0) setTimeout(hide, 3000)
    } catch {
      setStatus('partial')
    } finally {
      isSyncing.current = false
    }
  }, [isSignedIn, getToken, show, hide])

  useEffect(() => {
    // The reconnect listener below only fires on a *live* offline→online
    // transition observed during this session — a cold launch while already
    // online would otherwise never trigger an automatic sync of anything left
    // over from a previous session. Check once on mount and sync immediately
    // if there's pending work and the device is already online.
    // Only an explicit `false` means offline — `isInternetReachable` is null
    // until the probe resolves and stays false where the probe host is blocked,
    // and treating those as offline suppressed sync on a working connection.
    NetInfo.fetch().then((state) => {
      const isOnline = !!state.isConnected && state.isInternetReachable !== false
      if (isOnline && getPendingCount() > 0) sync()
    })

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isOnline = !!state.isConnected && state.isInternetReachable !== false
      if (!isOnline) {
        wasOffline.current = true
        setStatus('offline')
        show()
      } else {
        if (wasOffline.current) {
          wasOffline.current = false
          // Regaining the network is exactly when an upload that exhausted its
          // attempts on the old, bad connection deserves a fresh budget —
          // otherwise it stays retired and only a manual tap can revive it.
          resetStuckUploads()
          sync()
        } else {
          hide()
        }
      }
    })
    return unsubscribe
  }, [sync, show, hide])

  const config: Record<BannerStatus, { bg: string; text: string; label: string }> = {
    online:  { bg: colors.success,  text: '#fff', label: '✓ Back online' },
    offline: { bg: '#374151',       text: '#fff', label: '📵 No internet — working offline' },
    syncing: { bg: colors.ochre,    text: '#fff', label: '⟳ Syncing your records...' },
    synced:  { bg: colors.success,  text: '#fff', label: '✅ All records synced!' },
    partial: { bg: colors.warning,  text: '#fff', label: `⚠️ ${pendingCount} record${pendingCount !== 1 ? 's' : ''} still pending` },
  }

  return (
    <Animated.View style={[styles.banner, { backgroundColor: config[status].bg, opacity }]}>
      <Text style={[styles.text, { color: config[status].text }]}>
        {config[status].label}
      </Text>
      {status === 'partial' && (
        <TouchableOpacity onPress={() => { resetStuckUploads(); sync() }} style={styles.retryBtn}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>Retry</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0,
    zIndex: 999,
    paddingTop: 44,  // safe area
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: { fontSize: 13, fontWeight: '600' },
  retryBtn: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
  },
})
