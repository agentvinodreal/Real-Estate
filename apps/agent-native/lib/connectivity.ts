import NetInfo from '@react-native-community/netinfo'

// A failed API call can mean the device is offline, or that the request reached
// the server and got rejected/timed out — those need different user messaging.
// Checked after the failure (not before) so a connection that drops mid-request
// is still reported accurately.
// `isInternetReachable` is null until NetInfo's reachability probe resolves, and
// stays false on networks that block the probe endpoint even when the connection
// works fine. Treating either as offline made the app refuse to sync on a working
// link, so only an explicit `false` counts as offline — unknown is optimistic.
export async function isDeviceOnline(): Promise<boolean> {
  const state = await NetInfo.fetch()
  return !!state.isConnected && state.isInternetReachable !== false
}
