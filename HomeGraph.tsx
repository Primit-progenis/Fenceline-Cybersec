import { useMemo } from 'react'
import { devices, type Device } from '../data/devices'
import { HowThisWorks } from './HowThisWorks'
import type { ContainmentLevel } from '../logic/containment'

const VIEW_SIZE = 520
const CENTER = VIEW_SIZE / 2
const ORBIT_RADIUS = 190
const HUB_RADIUS = 36
const NODE_RADIUS = 30

const TYPE_LABELS: Record<Device['type'], string> = {
  camera: 'Camera',
  speaker: 'Speaker',
  thermostat: 'Thermostat',
  plug: 'Plug',
  lock: 'Lock',
  heater: 'Heater',
}

export function getDeviceNodePosition(deviceId: string) {
  const index = devices.findIndex((d) => d.id === deviceId)
  if (index < 0) {
    return { x: CENTER, y: CENTER }
  }
  const angle = (index / devices.length) * Math.PI * 2 - Math.PI / 2
  return {
    x: CENTER + ORBIT_RADIUS * Math.cos(angle),
    y: CENTER + ORBIT_RADIUS * Math.sin(angle),
  }
}

function nodePosition(index: number, total: number) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2
  return {
    x: CENTER + ORBIT_RADIUS * Math.cos(angle),
    y: CENTER + ORBIT_RADIUS * Math.sin(angle),
  }
}

function riskBadgeClass(tier: Device['riskTier']) {
  return tier === 'safety-critical'
    ? 'bg-amber-500/15 text-amber-300 ring-amber-500/40'
    : 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40'
}

export interface PeerAlertLink {
  fromDeviceId: string
  toDeviceId: string
}

interface HomeGraphProps {
  selectedDeviceId: string | null
  onSelectDevice: (id: string) => void
  compromisedDeviceIds?: string[]
  peerAlertLink?: PeerAlertLink | null
  containment?: Record<string, ContainmentLevel>
}

export function HomeGraph({
  selectedDeviceId,
  onSelectDevice,
  compromisedDeviceIds = [],
  peerAlertLink = null,
  containment = {},
}: HomeGraphProps) {
  const compromisedSet = useMemo(
    () => new Set(compromisedDeviceIds),
    [compromisedDeviceIds],
  )

  const selected = useMemo(
    () => devices.find((d) => d.id === selectedDeviceId) ?? null,
    [selectedDeviceId],
  )

  const peerLine = useMemo(() => {
    if (!peerAlertLink) return null
    const from = getDeviceNodePosition(peerAlertLink.fromDeviceId)
    const to = getDeviceNodePosition(peerAlertLink.toDeviceId)
    return { from, to }
  }, [peerAlertLink])

  return (
    <div className="flex min-h-0 flex-col gap-6 lg:flex-row lg:items-stretch">
      <div className="relative min-h-[360px] flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <svg
          viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
          className="mx-auto h-full max-h-[min(62vh,480px)] w-full"
          role="img"
          aria-label="Smart home device graph connected to central hub"
        >
          {devices.map((device, index) => {
            const { x, y } = nodePosition(index, devices.length)
            const isSelected = device.id === selectedDeviceId
            const isCompromised = compromisedSet.has(device.id)
            const level = containment[device.id] ?? 0
            return (
              <g key={device.id}>
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={x}
                  y2={y}
                  className={
                    isCompromised ? 'stroke-red-900/80' : 'stroke-zinc-700'
                  }
                  strokeWidth={2}
                  strokeDasharray={isSelected ? undefined : '4 4'}
                />
                <g
                  role="button"
                  tabIndex={0}
                  aria-label={`${device.name}, ${TYPE_LABELS[device.type]}`}
                  className="cursor-pointer outline-none"
                  onClick={() => onSelectDevice(device.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelectDevice(device.id)
                    }
                  }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={NODE_RADIUS}
                    className={
                      isCompromised
                        ? 'fill-red-950/80 stroke-red-500'
                        : isSelected
                          ? 'fill-sky-500/25 stroke-sky-400'
                          : device.riskTier === 'safety-critical'
                            ? 'fill-zinc-800 stroke-amber-500/70'
                            : 'fill-zinc-800 stroke-zinc-600'
                    }
                    strokeWidth={isSelected || isCompromised ? 3 : 2}
                  />
                  <text
                    x={x}
                    y={y - 2}
                    textAnchor="middle"
                    className="fill-zinc-100 font-medium"
                    style={{
                      pointerEvents: 'none',
                      fontSize:
                        device.type === 'thermostat' ? '8px' : '10px',
                    }}
                  >
                    {TYPE_LABELS[device.type]}
                  </text>
                  <text
                    x={x}
                    y={y + 11}
                    textAnchor="middle"
                    className="fill-zinc-500"
                    style={{ pointerEvents: 'none', fontSize: '8px' }}
                  >
                    {device.vendor}
                  </text>
                  {level > 0 ? (
                    <g>
                      <rect
                        x={x + NODE_RADIUS - 6}
                        y={y - NODE_RADIUS - 6}
                        width={22}
                        height={14}
                        rx={3}
                        className="fill-sky-950 stroke-sky-400"
                        strokeWidth={1}
                      />
                      <text
                        x={x + NODE_RADIUS + 5}
                        y={y - NODE_RADIUS + 4}
                        textAnchor="middle"
                        className="fill-sky-200"
                        style={{ pointerEvents: 'none', fontSize: '8px' }}
                      >
                        L{level}
                      </text>
                    </g>
                  ) : null}
                </g>
              </g>
            )
          })}

          {peerLine ? (
            <line
              x1={peerLine.from.x}
              y1={peerLine.from.y}
              x2={peerLine.to.x}
              y2={peerLine.to.y}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="6 4"
              opacity={0.9}
            />
          ) : null}

          <circle
            cx={CENTER}
            cy={CENTER}
            r={HUB_RADIUS}
            className="fill-zinc-950 stroke-cyan-500/80"
            strokeWidth={2}
          />
          <text
            x={CENTER}
            y={CENTER - 6}
            textAnchor="middle"
            className="fill-cyan-300 text-[11px] font-semibold"
          >
            Hub
          </text>
          <text
            x={CENTER}
            y={CENTER + 10}
            textAnchor="middle"
            className="fill-zinc-500 text-[9px]"
          >
            Router
          </text>
        </svg>
        <div className="absolute bottom-3 left-4 flex flex-col gap-2">
          <p className="text-xs text-zinc-600">Click a device for details</p>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span
              className="inline-block h-3 w-3 rounded-full border-2 border-amber-500/70 bg-zinc-800"
              aria-hidden
            />
            Amber ring = safety-critical device
          </div>
        </div>
      </div>

      <aside
        className="flex w-full shrink-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/80 p-5 lg:w-80"
        aria-live="polite"
      >
        {selected ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Device
              </p>
              <h2 className="mt-1 text-lg font-semibold text-zinc-100">
                {selected.name}
              </h2>
              <p className="mt-1 font-mono text-xs text-zinc-500">
                {selected.ip}
              </p>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-zinc-500">Vendor</dt>
                <dd className="font-medium text-zinc-200">{selected.vendor}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Risk tier</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${riskBadgeClass(selected.riskTier)}`}
                  >
                    {selected.riskTier === 'safety-critical'
                      ? 'Safety critical'
                      : 'Low'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Normal behavior</dt>
                <dd className="mt-1 leading-relaxed text-zinc-300">
                  {selected.normalBehavior}
                </dd>
              </div>
            </dl>
            <HowThisWorks>
              <p>
                The graph is a layout of hardcoded devices around a hub. An
                L-badge means a simulated containment rule is applied. Clicking
                a node only updates this panel — it does not probe the
                network.
              </p>
            </HowThisWorks>
          </div>
        ) : (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center text-sm text-zinc-500">
            <p>Select a device on the graph to inspect its baseline profile.</p>
          </div>
        )}
      </aside>
    </div>
  )
}
