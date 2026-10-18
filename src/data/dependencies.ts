/**
 * Hand-authored map of what each device actually does, and which paths it needs.
 * Used only for simulated "what breaks" previews — not discovered from the network.
 */
export type FunctionPath = 'local' | 'internet' | 'hub' | 'peer'

export interface DeviceFunction {
  id: string
  deviceId: string
  name: string
  /** Primary path this function uses. */
  path: FunctionPath
  needsInternet: boolean
  needsHub: boolean
  needsPeers: boolean
  essential: boolean
}

export const deviceFunctions: DeviceFunction[] = [
  // Plug
  {
    id: 'plug-remote',
    deviceId: 'plug-office',
    name: 'Remote on/off from phone app',
    path: 'internet',
    needsInternet: true,
    needsHub: false,
    needsPeers: false,
    essential: false,
  },
  {
    id: 'plug-lamp',
    deviceId: 'plug-office',
    name: 'Office lamp power',
    path: 'local',
    needsInternet: false,
    needsHub: false,
    needsPeers: false,
    essential: true,
  },
  {
    id: 'plug-hub',
    deviceId: 'plug-office',
    name: 'On/off from the hub',
    path: 'hub',
    needsInternet: false,
    needsHub: true,
    needsPeers: false,
    essential: false,
  },
  // Thermostat
  {
    id: 'therm-schedule',
    deviceId: 'therm-main',
    name: 'Heating schedule',
    path: 'local',
    needsInternet: false,
    needsHub: false,
    needsPeers: false,
    essential: true,
  },
  {
    id: 'therm-remote',
    deviceId: 'therm-main',
    name: 'Remote control from app',
    path: 'internet',
    needsInternet: true,
    needsHub: false,
    needsPeers: false,
    essential: false,
  },
  {
    id: 'therm-peer',
    deviceId: 'therm-main',
    name: 'Share setpoints with heater',
    path: 'peer',
    needsInternet: false,
    needsHub: false,
    needsPeers: true,
    essential: false,
  },
  // Heater
  {
    id: 'heat-schedule',
    deviceId: 'heat-garage',
    name: 'Heat on schedule',
    path: 'local',
    needsInternet: false,
    needsHub: false,
    needsPeers: false,
    essential: true,
  },
  {
    id: 'heat-reports',
    deviceId: 'heat-garage',
    name: 'Temperature reports',
    path: 'internet',
    needsInternet: true,
    needsHub: false,
    needsPeers: false,
    essential: false,
  },
  {
    id: 'heat-peer',
    deviceId: 'heat-garage',
    name: 'Follow thermostat setpoints',
    path: 'peer',
    needsInternet: false,
    needsHub: false,
    needsPeers: true,
    essential: false,
  },
  // Lock
  {
    id: 'lock-local',
    deviceId: 'lock-front',
    name: 'Keypad and local unlock',
    path: 'local',
    needsInternet: false,
    needsHub: false,
    needsPeers: false,
    essential: true,
  },
  {
    id: 'lock-remote',
    deviceId: 'lock-front',
    name: 'Remote unlock and guest codes',
    path: 'internet',
    needsInternet: true,
    needsHub: false,
    needsPeers: false,
    essential: false,
  },
  {
    id: 'lock-hub',
    deviceId: 'lock-front',
    name: 'Status to hub',
    path: 'hub',
    needsInternet: false,
    needsHub: true,
    needsPeers: false,
    essential: false,
  },
  // Camera
  {
    id: 'cam-local',
    deviceId: 'cam-living',
    name: 'Live view at home',
    path: 'local',
    needsInternet: false,
    needsHub: false,
    needsPeers: false,
    essential: true,
  },
  {
    id: 'cam-cloud',
    deviceId: 'cam-living',
    name: 'Motion clips to cloud',
    path: 'internet',
    needsInternet: true,
    needsHub: false,
    needsPeers: false,
    essential: false,
  },
  // Speaker
  {
    id: 'spk-stream',
    deviceId: 'spk-kitchen',
    name: 'Music streaming',
    path: 'internet',
    needsInternet: true,
    needsHub: false,
    needsPeers: false,
    essential: false,
  },
  {
    id: 'spk-voice',
    deviceId: 'spk-kitchen',
    name: 'Voice commands',
    path: 'internet',
    needsInternet: true,
    needsHub: false,
    needsPeers: false,
    essential: false,
  },
  {
    id: 'spk-hub',
    deviceId: 'spk-kitchen',
    name: 'Local playback from hub',
    path: 'hub',
    needsInternet: false,
    needsHub: true,
    needsPeers: false,
    essential: false,
  },
]
