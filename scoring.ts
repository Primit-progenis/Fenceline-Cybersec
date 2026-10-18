import type { Device } from '../data/devices'
import type { Flow } from '../data/scenarios'

/** Shared weights and threshold for UI and scoring logic. */
export const SCORING_CONSTANTS = {
  weights: {
    newDestination: 30,
    volumeSpike: 30,
    newPeer: 25,
    oddHour: 15,
  },
  alertThreshold: 40,
  volumeSpikeMinRatio: 2,
  volumeSpikeFullRatio: 5,
  updateInboundOutboundRatio: 10,
} as const

export interface ScoreFactor {
  key: keyof typeof SCORING_CONSTANTS.weights
  label: string
  points: number
  detail: string
}

export interface DeviceScore {
  total: number
  factors: ScoreFactor[]
  isUpdate: boolean
  level: 'normal' | 'alert'
}

export interface ScoreDeviceOptions {
  /** When true, suppress volume/odd-hour points for vendor update patterns. */
  useDiscriminator?: boolean
}

function deviceFlows(deviceId: string, flows: Flow[]): Flow[] {
  return flows.filter((f) => f.deviceId === deviceId)
}

function isHourActive(device: Device, hour: number): boolean {
  const { start, end } = device.activeHours
  if (start <= end) {
    return hour >= start && hour <= end
  }
  return hour >= start || hour <= end
}

function maxOutboundMb(flows: Flow[]): number {
  return flows
    .filter((f) => f.direction === 'out')
    .reduce((max, f) => (f.mb > max ? f.mb : max), 0)
}

/**
 * Large download followed by a tiny ack matches vendor firmware updates.
 */
function detectFirmwareUpdate(device: Device, flows: Flow[]): boolean {
  const mine = deviceFlows(device.id, flows)
  const maxOut = maxOutboundMb(mine)
  return mine.some(
    (flow) =>
      flow.direction === 'in' &&
      device.allowedDestinations.includes(flow.destination) &&
      flow.mb >= SCORING_CONSTANTS.updateInboundOutboundRatio * maxOut,
  )
}

function scoreNewDestination(device: Device, flows: Flow[]): ScoreFactor {
  const weight = SCORING_CONSTANTS.weights.newDestination
  const mine = deviceFlows(device.id, flows)
  const badOutbound = mine.filter(
    (f) =>
      f.direction === 'out' &&
      !f.isPeer &&
      !device.allowedDestinations.includes(f.destination),
  )

  if (badOutbound.length === 0) {
    return {
      key: 'newDestination',
      label: 'New destination',
      points: 0,
      detail: 'All outbound traffic stayed on known destinations.',
    }
  }

  const worst = badOutbound.reduce((a, b) => (a.mb >= b.mb ? a : b))
  return {
    key: 'newDestination',
    label: 'New destination',
    points: weight,
    detail: `Sent ${worst.mb} MB to unknown destination ${worst.destination}.`,
  }
}

function scoreVolumeSpike(device: Device, flows: Flow[]): ScoreFactor {
  const weight = SCORING_CONSTANTS.weights.volumeSpike
  const mine = deviceFlows(device.id, flows)
  const largest = mine.reduce<Flow | null>(
    (best, flow) => (!best || flow.mb > best.mb ? flow : best),
    null,
  )
  const peakMb = largest?.mb ?? 0
  const ratio = peakMb / device.typicalFlowMB
  const verb =
    largest?.direction === 'in'
      ? 'Received'
      : largest?.direction === 'out'
        ? 'Sent'
        : 'Moved'

  if (ratio < SCORING_CONSTANTS.volumeSpikeMinRatio) {
    return {
      key: 'volumeSpike',
      label: 'Volume spike',
      points: 0,
      detail: 'Traffic volume stayed within the usual range.',
    }
  }

  if (ratio >= SCORING_CONSTANTS.volumeSpikeFullRatio) {
    const rounded = Math.round(ratio)
    return {
      key: 'volumeSpike',
      label: 'Volume spike',
      points: weight,
      detail: `${verb} ${rounded}x its usual data (${peakMb} MB vs ${device.typicalFlowMB} MB typical).`,
    }
  }

  const span =
    SCORING_CONSTANTS.volumeSpikeFullRatio -
    SCORING_CONSTANTS.volumeSpikeMinRatio
  const points =
    ((ratio - SCORING_CONSTANTS.volumeSpikeMinRatio) / span) * weight
  const rounded = Math.round(ratio)
  return {
    key: 'volumeSpike',
    label: 'Volume spike',
    points: Math.round(points),
    detail: `${verb} ${rounded}x its usual data (${peakMb} MB vs ${device.typicalFlowMB} MB typical).`,
  }
}

function scoreNewPeer(device: Device, flows: Flow[]): ScoreFactor {
  const weight = SCORING_CONSTANTS.weights.newPeer
  const mine = deviceFlows(device.id, flows)
  const badPeers = mine.filter(
    (f) => f.isPeer && !device.allowedPeers.includes(f.destination),
  )

  if (badPeers.length === 0) {
    return {
      key: 'newPeer',
      label: 'New peer',
      points: 0,
      detail: 'No unexpected on-network peer contact.',
    }
  }

  const peerNames = [...new Set(badPeers.map((f) => f.destination))].join(', ')
  return {
    key: 'newPeer',
    label: 'New peer',
    points: weight,
    detail: `Contacted disallowed peer(s): ${peerNames}.`,
  }
}

function scoreOddHour(device: Device, flows: Flow[]): ScoreFactor {
  const weight = SCORING_CONSTANTS.weights.oddHour
  const mine = deviceFlows(device.id, flows)
  const odd = mine.filter((f) => !isHourActive(device, f.hour))

  if (odd.length === 0) {
    return {
      key: 'oddHour',
      label: 'Odd hour',
      points: 0,
      detail: 'Activity occurred during normal active hours.',
    }
  }

  const hours = [...new Set(odd.map((f) => f.hour))].sort((a, b) => a - b)
  return {
    key: 'oddHour',
    label: 'Odd hour',
    points: weight,
    detail: `Traffic at hour ${hours.join(', ')} outside active window (${device.activeHours.start}:00–${device.activeHours.end}:00).`,
  }
}

/**
 * Rule-based anomaly score for a single device and a batch of observed flows.
 */
export function scoreDevice(
  device: Device,
  flows: Flow[],
  options: ScoreDeviceOptions = {},
): DeviceScore {
  const useDiscriminator = options.useDiscriminator ?? true
  const isUpdate = useDiscriminator && detectFirmwareUpdate(device, flows)

  let factors: ScoreFactor[] = [
    scoreNewDestination(device, flows),
    scoreVolumeSpike(device, flows),
    scoreNewPeer(device, flows),
    scoreOddHour(device, flows),
  ]

  if (isUpdate) {
    factors = factors.map((factor) => {
      if (factor.key === 'volumeSpike' || factor.key === 'oddHour') {
        return {
          ...factor,
          points: 0,
          detail:
            'Suppressed: large inbound from an allowed update server with a small outbound ack (likely firmware update).',
        }
      }
      return factor
    })
  }

  const total = factors.reduce((sum, f) => sum + f.points, 0)
  const level =
    total >= SCORING_CONSTANTS.alertThreshold ? 'alert' : 'normal'

  return { total, factors, isUpdate, level }
}
