import { PLUG_DEVICE_ID } from './devices'

export type FlowDirection = 'in' | 'out'

export interface Flow {
  deviceId: string
  destination: string
  direction: FlowDirection
  mb: number
  hour: number
  isPeer?: boolean
}

/** Simulated overnight firmware download to the office plug. */
export const updateScenarioFlows: Flow[] = [
  {
    deviceId: PLUG_DEVICE_ID,
    destination: 'updates.tp-link.example',
    direction: 'in',
    mb: 80,
    hour: 2,
  },
  {
    deviceId: PLUG_DEVICE_ID,
    destination: 'updates.tp-link.example',
    direction: 'out',
    mb: 0.1,
    hour: 2,
  },
]

/** Simulated plug exfiltration and lateral probe toward the thermostat. */
export const compromiseScenarioFlows: Flow[] = [
  {
    deviceId: PLUG_DEVICE_ID,
    destination: 'unknown-host.example',
    direction: 'out',
    mb: 20,
    hour: 3,
  },
  {
    deviceId: PLUG_DEVICE_ID,
    destination: 'thermostat',
    direction: 'out',
    mb: 0.3,
    hour: 3,
    isPeer: true,
  },
]
