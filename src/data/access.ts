import { devices } from './devices'

export type AccessRole = 'owner' | 'family' | 'staff' | 'vendor'
export type AccessPermission = 'view' | 'control'

export interface AccessPass {
  id: string
  person: string
  role: AccessRole
  deviceIds: string[]
  permission: AccessPermission
  /** Simulated hour when the pass expires. null = no expiry. */
  expiresAtHour: number | null
  lastUsedDaysAgo: number
  expired: boolean
  revoked?: boolean
}

const ALL_DEVICE_IDS = devices.map((d) => d.id)
const ALL_EXCEPT_HEATER = devices
  .filter((d) => d.type !== 'heater')
  .map((d) => d.id)

export function initialPasses(): AccessPass[] {
  return [
    {
      id: 'pass-priya',
      person: 'Priya',
      role: 'owner',
      deviceIds: ALL_DEVICE_IDS,
      permission: 'control',
      expiresAtHour: null,
      lastUsedDaysAgo: 0,
      expired: false,
    },
    {
      id: 'pass-rohan',
      person: 'Rohan',
      role: 'family',
      deviceIds: ALL_EXCEPT_HEATER,
      permission: 'control',
      expiresAtHour: null,
      lastUsedDaysAgo: 1,
      expired: false,
    },
    {
      id: 'pass-meena',
      person: 'Meena',
      role: 'staff',
      deviceIds: ['lock-front', 'cam-living'],
      permission: 'view',
      expiresAtHour: 120,
      lastUsedDaysAgo: 0,
      expired: false,
    },
    {
      id: 'pass-raj',
      person: 'Raj',
      role: 'vendor',
      deviceIds: ['lock-front'],
      permission: 'control',
      expiresAtHour: null,
      lastUsedDaysAgo: 40,
      expired: false,
    },
  ]
}
