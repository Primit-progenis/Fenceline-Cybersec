import { useMemo, useState } from 'react'
import { AccessPanel } from './components/AccessPanel'
import { ActivityLog } from './components/ActivityLog'
import { AlertCard } from './components/AlertCard'
import { ContainmentPanel } from './components/ContainmentPanel'
import { HomeGraph } from './components/HomeGraph'
import { ScenarioPanel } from './components/ScenarioPanel'
import { UpdateDetectedCard } from './components/UpdateDetectedCard'
import { initialPasses, type AccessPass } from './data/access'
import {
  devices,
  PLUG_DEVICE_ID,
  THERMOSTAT_DEVICE_ID,
} from './data/devices'
import {
  makeEvent,
  resetEventSeq,
  type AppEvent,
} from './data/events'
import {
  compromiseScenarioFlows,
  updateScenarioFlows,
} from './data/scenarios'
import { checkAccess, tickPasses } from './logic/access'
import {
  LEVELS,
  type ContainmentLevel,
} from './logic/containment'
import { scoreDevice } from './logic/scoring'

type DemoMode = 'idle' | 'update' | 'compromise'
type AppTab = 'home' | 'access'

const emptyContainment = (): Record<string, ContainmentLevel> =>
  Object.fromEntries(devices.map((d) => [d.id, 0])) as Record<
    string,
    ContainmentLevel
  >

function App() {
  const [tab, setTab] = useState<AppTab>('home')
  const [demoMode, setDemoMode] = useState<DemoMode>('idle')
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [containment, setContainment] =
    useState<Record<string, ContainmentLevel>>(emptyContainment)
  const [events, setEvents] = useState<AppEvent[]>([])
  const [currentHour, setCurrentHour] = useState(0)
  const [passes, setPasses] = useState<AccessPass[]>(() =>
    tickPasses(initialPasses(), 0),
  )

  const plug = useMemo(
    () => devices.find((d) => d.id === PLUG_DEVICE_ID)!,
    [],
  )
  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === selectedDeviceId) ?? null,
    [selectedDeviceId],
  )

  const updateScores = useMemo(() => {
    if (demoMode !== 'update') return null
    return {
      smart: scoreDevice(plug, updateScenarioFlows, { useDiscriminator: true }),
      basic: scoreDevice(plug, updateScenarioFlows, {
        useDiscriminator: false,
      }),
    }
  }, [demoMode, plug])

  const compromiseScore = useMemo(() => {
    if (demoMode !== 'compromise') return null
    return scoreDevice(plug, compromiseScenarioFlows, {
      useDiscriminator: true,
    })
  }, [demoMode, plug])

  function pushEvent(
    kind: AppEvent['kind'],
    message: string,
    hour = currentHour,
  ) {
    setEvents((prev) => [...prev, makeEvent(kind, message, hour)])
  }

  function resetAll() {
    resetEventSeq()
    setDemoMode('idle')
    setSelectedDeviceId(null)
    setContainment(emptyContainment())
    setEvents([])
    setCurrentHour(0)
    setPasses(tickPasses(initialPasses(), 0))
  }

  function runUpdate() {
    setDemoMode('update')
    setSelectedDeviceId(PLUG_DEVICE_ID)
    pushEvent(
      'info',
      'Firmware update scenario on Office Smart Plug (simulated).',
    )
  }

  function runCompromise() {
    setDemoMode('compromise')
    setSelectedDeviceId(PLUG_DEVICE_ID)
    pushEvent(
      'alert',
      'Office Smart Plug looks compromised. Containment preview is open for that device.',
    )
  }

  function applyContainment(level: ContainmentLevel) {
    if (!selectedDevice) return
    setContainment((prev) => ({ ...prev, [selectedDevice.id]: level }))
    const label = level === 0 ? 'none' : LEVELS[level].name
    pushEvent(
      'containment',
      `Applied L${level} (${label}) on ${selectedDevice.name}. SIMULATED, not executed.`,
    )
  }

  function undoContainment() {
    if (!selectedDevice) return
    setContainment((prev) => ({ ...prev, [selectedDevice.id]: 0 }))
    pushEvent('containment', `Undid containment on ${selectedDevice.name}.`)
  }

  function advanceClock(hours: number) {
    const next = currentHour + hours
    setCurrentHour(next)
    setPasses((prev) => tickPasses(prev, next))
    pushEvent('clock', `Clock advanced by ${hours}h.`, next)
  }

  function issueGuest(pass: AccessPass) {
    const stamped = tickPasses([pass], currentHour)[0]
    setPasses((prev) => [...prev, stamped])
    pushEvent(
      'access',
      `Issued ${stamped.permission} pass for ${stamped.person}.`,
    )
  }

  function attemptAccess(pass: AccessPass, deviceId: string) {
    const device = devices.find((d) => d.id === deviceId)
    const result = checkAccess(pass, deviceId, currentHour, pass.permission)
    if (!result.allowed && result.reason === 'Pass expired') {
      pushEvent(
        'alert',
        `EXPIRED pass: ${pass.person} tried ${pass.permission} on ${device?.name ?? deviceId} and was denied.`,
      )
      return
    }
    if (result.allowed) {
      setPasses((prev) =>
        prev.map((p) =>
          p.id === pass.id ? { ...p, lastUsedDaysAgo: 0 } : p,
        ),
      )
      pushEvent(
        'access',
        `${pass.person} allowed ${pass.permission} on ${device?.name ?? deviceId}.`,
      )
      return
    }
    pushEvent(
      'access',
      `${pass.person} denied on ${device?.name ?? deviceId}: ${result.reason}.`,
    )
  }

  function revokePass(pass: AccessPass) {
    if (pass.revoked) return
    setPasses((prev) =>
      prev.map((item) =>
        item.id === pass.id ? { ...item, revoked: true } : item,
      ),
    )
    pushEvent('access', `Revoked access pass for ${pass.person}.`)
  }

  const tabBtn = (id: AppTab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        tab === id
          ? 'bg-zinc-100 text-zinc-900'
          : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-700'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex min-h-svh flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
              Fenceline
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Smart home security overview
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
              {tabBtn('home', 'Home and Threats')}
              {tabBtn('access', 'Access')}
            </nav>
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-300">
              SIMULATED DATA
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        {tab === 'home' ? (
          <>
            <ScenarioPanel
              onReset={resetAll}
              onRunUpdate={runUpdate}
              onRunCompromise={runCompromise}
            />

            <HomeGraph
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={setSelectedDeviceId}
              compromisedDeviceIds={
                demoMode === 'compromise' ? [PLUG_DEVICE_ID] : []
              }
              peerAlertLink={
                demoMode === 'compromise'
                  ? {
                      fromDeviceId: PLUG_DEVICE_ID,
                      toDeviceId: THERMOSTAT_DEVICE_ID,
                    }
                  : null
              }
              containment={containment}
            />

            {updateScores ? (
              <UpdateDetectedCard
                smartScore={updateScores.smart}
                basicScore={updateScores.basic}
              />
            ) : null}

            {compromiseScore ? (
              <AlertCard
                title="Suspicious activity on Office Smart Plug"
                score={compromiseScore}
                whatHappened="The office smart plug sent a large burst of data to an unknown server on the internet, then opened a local connection toward the thermostat during quiet hours — a pattern consistent with compromise and lateral probing."
                affectedDevices={[
                  'Office Smart Plug — likely compromised',
                  'Main Thermostat — probed as a peer target',
                ]}
              />
            ) : null}

            <ContainmentPanel
              key={selectedDevice?.id ?? 'none'}
              device={selectedDevice}
              appliedLevel={
                selectedDevice
                  ? (containment[selectedDevice.id] ?? 0)
                  : 0
              }
              onApply={applyContainment}
              onUndo={undoContainment}
            />

            <ActivityLog events={events} />
          </>
        ) : (
          <>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetAll}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 active:bg-zinc-600"
              >
                Reset
              </button>
            </div>
            <AccessPanel
              currentHour={currentHour}
              passes={passes}
              onAdvance={advanceClock}
              onIssue={issueGuest}
              onAttempt={attemptAccess}
              onRevoke={revokePass}
            />
            <ActivityLog events={events} title="Audit log" />
          </>
        )}
      </main>

      <footer className="border-t border-zinc-800 px-6 py-4">
        <p className="mx-auto max-w-6xl text-center text-xs text-zinc-500">
          All traffic, scores, nftables, clocks, and access checks are
          simulated. No packets are sent and no real credentials are stored.
        </p>
      </footer>
    </div>
  )
}

export default App
