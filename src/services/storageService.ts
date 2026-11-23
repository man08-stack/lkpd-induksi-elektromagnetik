import type { PersistedState } from '../types/lkpd'

const STORAGE_KEY = 'lkpd-dynamo-state-v1'

export function loadState(): PersistedState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    return parsed as PersistedState
  } catch {
    return null
  }
}

export function saveState(state: PersistedState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearState(): void {
  try { window.localStorage.removeItem(STORAGE_KEY) } catch { /* Storage can be disabled in private WebViews. */ }
}
