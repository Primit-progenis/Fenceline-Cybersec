export type DeviceType =
  | 'camera'
  | 'speaker'
  | 'thermostat'
  | 'plug'
  | 'lock'
  | 'heater'

export type RiskTier = 'low' | 'safety-critical'

export type DeviceStatus = 'normal'

export interface ActiveHours {
  start: number
  end: number
}

export interface Device {
  id: string
  name: string
  type: DeviceType
  vendor: string
  ip: string
  riskTier: RiskTier
  normalBehavior: string
  allowedDestinations: string[]
  allowedPeers: string[]
  typicalDailyMB: number
  typicalFlowMB: number
  activeHours: ActiveHours
  status: DeviceStatus
}

export const devices: Device[] = [
  {
    id: 'cam-living',
    name: 'Living Room Camera',
    type: 'camera',
    vendor: 'Nest',
    ip: '192.168.1.21',
    riskTier: 'low',
    normalBehavior:
      'Streams video only to its vendor cloud and the local hub when motion is detected.',
    allowedDestinations: [
      'nest.com',
      'googleapis.com',
      'updates.nest.example',
      '192.168.1.1',
    ],
    allowedPeers: ['hub'],
    typicalDailyMB: 420,
    typicalFlowMB: 8,
    activeHours: { start: 0, end: 23 },
    status: 'normal',
  },
  {
    id: 'spk-kitchen',
    name: 'Kitchen Speaker',
    type: 'speaker',
    vendor: 'Sonos',
    ip: '192.168.1.22',
    riskTier: 'low',
    normalBehavior:
      'Talks only to its vendor cloud and the hub for playback and status updates.',
    allowedDestinations: [
      'sonos.com',
      'updates.sonos.example',
      '192.168.1.1',
    ],
    allowedPeers: ['hub'],
    typicalDailyMB: 85,
    typicalFlowMB: 2,
    activeHours: { start: 6, end: 23 },
    status: 'normal',
  },
  {
    id: 'therm-main',
    name: 'Main Thermostat',
    type: 'thermostat',
    vendor: 'Ecobee',
    ip: '192.168.1.23',
    riskTier: 'low',
    normalBehavior:
      'Syncs temperature schedules with the vendor cloud and reports state to the hub.',
    allowedDestinations: [
      'ecobee.com',
      'updates.ecobee.example',
      '192.168.1.1',
    ],
    allowedPeers: ['hub', 'heat-garage'],
    typicalDailyMB: 12,
    typicalFlowMB: 0.4,
    activeHours: { start: 0, end: 23 },
    status: 'normal',
  },
  {
    id: 'plug-office',
    name: 'Office Smart Plug',
    type: 'plug',
    vendor: 'TP-Link',
    ip: '192.168.1.24',
    riskTier: 'low',
    normalBehavior:
      'Sends on/off telemetry to the vendor cloud and accepts commands from the hub.',
    allowedDestinations: [
      'tplinkcloud.com',
      'updates.tp-link.example',
      '192.168.1.1',
    ],
    allowedPeers: ['hub'],
    typicalDailyMB: 3,
    typicalFlowMB: 0.5,
    activeHours: { start: 6, end: 23 },
    status: 'normal',
  },
  {
    id: 'lock-front',
    name: 'Front Door Lock',
    type: 'lock',
    vendor: 'August',
    ip: '192.168.1.25',
    riskTier: 'safety-critical',
    normalBehavior:
      'Reports lock state to the hub and vendor cloud; accepts unlock only from authorized apps.',
    allowedDestinations: [
      'august.com',
      'updates.august.example',
      '192.168.1.1',
    ],
    allowedPeers: ['hub'],
    typicalDailyMB: 8,
    typicalFlowMB: 0.2,
    activeHours: { start: 0, end: 23 },
    status: 'normal',
  },
  {
    id: 'heat-garage',
    name: 'Garage Heater',
    type: 'heater',
    vendor: 'Dyson',
    ip: '192.168.1.26',
    riskTier: 'safety-critical',
    normalBehavior:
      'Adjusts heat on schedule via the hub and reports temperature to the vendor cloud.',
    allowedDestinations: [
      'dyson.com',
      'updates.dyson.example',
      '192.168.1.1',
    ],
    allowedPeers: ['hub', 'therm-main'],
    typicalDailyMB: 18,
    typicalFlowMB: 1.2,
    activeHours: { start: 6, end: 22 },
    status: 'normal',
  },
]

export const HUB_IP = '192.168.1.1'
export const PLUG_DEVICE_ID = 'plug-office'
export const THERMOSTAT_DEVICE_ID = 'therm-main'
