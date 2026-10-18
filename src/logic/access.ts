import type {
  AccessPass,
  AccessPermission,
  AccessRole,
} from '../data/access'

export const STALE_AFTER_DAYS = 14

export interface AccessCheck {
  allowed: boolean
  reason: string
}

/** Create a time-boxed pass. Duration is in simulated hours. */
export function issuePass(args: {
  person: string
  role: AccessRole
  deviceIds: string[]
  permission: AccessPermission
  durationHours: number
  currentHour: number
}): AccessPass {
  const slug = args.person.toLowerCase().replace(/\s+/g, '-') || 'guest'
  return {
    id: `pass-${slug}-${args.currentHour}-${Math.random().toString(36).slice(2, 7)}`,
    person: args.person.trim() || 'Guest',
    role: args.role,
    deviceIds: args.deviceIds,
    permission: args.permission,
    expiresAtHour: args.currentHour + args.durationHours,
    lastUsedDaysAgo: 0,
    expired: args.durationHours <= 0,
  }
}

/** Mark passes expired when the simulated clock reaches their expiry hour. */
export function tickPasses(
  passes: AccessPass[],
  currentHour: number,
): AccessPass[] {
  return passes.map((pass) => {
    if (pass.expiresAtHour == null) return { ...pass, expired: false }
    return { ...pass, expired: pass.expiresAtHour <= currentHour }
  })
}

/**
 * Stale = still active, not household (owner/family), unused for more than
 * STALE_AFTER_DAYS. Household passes are never stale.
 */
export function isStale(pass: AccessPass): boolean {
  if (pass.revoked) return false
  if (pass.expired) return false
  if (pass.role === 'owner' || pass.role === 'family') return false
  return pass.lastUsedDaysAgo > STALE_AFTER_DAYS
}

export function passStatus(
  pass: AccessPass,
): 'revoked' | 'expired' | 'stale' | 'active' {
  if (pass.revoked) return 'revoked'
  if (pass.expired) return 'expired'
  if (isStale(pass)) return 'stale'
  return 'active'
}

export function checkAccess(
  pass: AccessPass,
  deviceId: string,
  currentHour: number,
  action: AccessPermission = 'view',
): AccessCheck {
  if (pass.revoked) {
    return { allowed: false, reason: 'Pass revoked' }
  }

  const expired =
    pass.expired ||
    (pass.expiresAtHour != null && pass.expiresAtHour <= currentHour)

  if (expired) {
    return { allowed: false, reason: 'Pass expired' }
  }
  if (!pass.deviceIds.includes(deviceId)) {
    return { allowed: false, reason: 'Device is not on this pass' }
  }
  if (action === 'control' && pass.permission === 'view') {
    return { allowed: false, reason: 'View-only pass cannot control' }
  }
  return {
    allowed: true,
    reason: `${pass.permission} granted for this device`,
  }
}
