import { deviceFunctions, type DeviceFunction } from '../data/dependencies'
import { HUB_IP, type Device } from '../data/devices'

/** Graded containment. 0 is unconstrained (no rules). */
export const LEVELS = {
  1: { id: 1, name: 'Rate-limit' },
  2: { id: 2, name: 'Block internet, keep local' },
  3: { id: 3, name: 'Also block device-to-device' },
  4: { id: 4, name: 'Also block hub (full isolate)' },
} as const

export type ContainmentLevel = 0 | 1 | 2 | 3 | 4

export interface ContainmentEffect {
  rateLimited: boolean
  internetBlocked: boolean
  peersBlocked: boolean
  hubBlocked: boolean
}

export interface Reachability {
  internet: boolean
  hub: boolean
  peers: boolean
}

export interface ImpactPreview {
  broken: DeviceFunction[]
  slowed: DeviceFunction[]
  kept: DeviceFunction[]
}

/** Map a level onto which paths are throttled or cut. */
export function getEffect(level: number): ContainmentEffect {
  const n = Math.max(0, Math.min(4, Math.floor(level)))
  return {
    rateLimited: n >= 1,
    internetBlocked: n >= 2,
    peersBlocked: n >= 3,
    hubBlocked: n >= 4,
  }
}

/** Whether internet / hub / other devices can still be reached. */
export function reachability(level: number): Reachability {
  const effect = getEffect(level)
  return {
    internet: !effect.internetBlocked,
    hub: !effect.hubBlocked,
    peers: !effect.peersBlocked,
  }
}

function isBroken(fn: DeviceFunction, effect: ContainmentEffect): boolean {
  if (effect.internetBlocked && fn.needsInternet) return true
  if (effect.peersBlocked && fn.needsPeers) return true
  if (effect.hubBlocked && fn.needsHub) return true
  return false
}

/**
 * Classify this device's functions at a proposed level.
 * Rate-limit only slows internet-using functions that are otherwise still up.
 */
export function previewImpact(deviceId: string, level: number): ImpactPreview {
  const effect = getEffect(level)
  const mine = deviceFunctions.filter((fn) => fn.deviceId === deviceId)
  const broken: DeviceFunction[] = []
  const slowed: DeviceFunction[] = []
  const kept: DeviceFunction[] = []

  for (const fn of mine) {
    if (isBroken(fn, effect)) {
      broken.push(fn)
    } else if (effect.rateLimited && fn.needsInternet) {
      slowed.push(fn)
    } else {
      kept.push(fn)
    }
  }

  return { broken, slowed, kept }
}

/**
 * Safety-critical devices need an extra confirm before applying a level
 * that would break an essential function (or any isolate of the lock/heater).
 */
export function requiresConfirmation(
  device: Device,
  level: number,
): boolean {
  if (device.riskTier !== 'safety-critical') return false
  if (level <= 0) return false
  const { broken } = previewImpact(device.id, level)
  return broken.some((fn) => fn.essential) || level >= 2
}

/** Text of nftables rules that WOULD be applied. Never executed. */
export function nftablesPreview(device: Device, level: number): string {
  const header = `# SIMULATED, not executed
# Containment L${level} for ${device.name} (${device.ip})
table inet fenceline {`

  if (level <= 0) {
    return `${header}
  # no rules — device is unconstrained
}`
  }

  if (level === 1) {
    return `${header}
  chain forward {
    ip saddr ${device.ip} limit rate 32 kbytes/second accept
    ip daddr ${device.ip} limit rate 32 kbytes/second accept
  }
}`
  }

  if (level === 2) {
    return `${header}
  chain forward {
    # keep LAN (hub + peers); drop the public internet
    ip saddr ${device.ip} ip daddr != 192.168.0.0/16 drop
    ip daddr ${device.ip} ip saddr != 192.168.0.0/16 drop
  }
}`
  }

  if (level === 3) {
    return `${header}
  chain forward {
    # keep hub only; drop internet and other devices
    ip saddr ${device.ip} ip daddr != ${HUB_IP} drop
    ip daddr ${device.ip} ip saddr != ${HUB_IP} drop
  }
}`
  }

  return `${header}
  chain forward {
    # full isolate — no internet, no hub, no peers
    ip saddr ${device.ip} drop
    ip daddr ${device.ip} drop
  }
}`
}
