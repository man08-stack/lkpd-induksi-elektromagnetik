export interface NativeBridgeStatus { isNative: boolean; platform: 'web' | 'android' | 'ios' }

interface CapacitorBridge { isNativePlatform?: () => boolean; getPlatform?: () => string }
declare global { interface Window { Capacitor?: CapacitorBridge } }

export function getNativeBridgeStatus(): NativeBridgeStatus {
  const capacitor = window.Capacitor
  if (!capacitor?.isNativePlatform?.()) return { isNative: false, platform: 'web' }
  const platform = capacitor.getPlatform?.()
  return { isNative: true, platform: platform === 'android' || platform === 'ios' ? platform : 'web' }
}

/** Uses Web Share where available and gracefully falls back to the caller's web download flow. */
export async function shareText(title: string, text: string): Promise<boolean> {
  if (!navigator.share) return false
  try { await navigator.share({ title, text }); return true } catch { return false }
}
