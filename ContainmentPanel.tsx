import { useMemo, useState } from 'react'
import type { Device } from '../data/devices'
import {
  LEVELS,
  getEffect,
  nftablesPreview,
  previewImpact,
  reachability,
  requiresConfirmation,
  type ContainmentLevel,
} from '../logic/containment'
import { HowThisWorks } from './HowThisWorks'

const LEVEL_IDS = [1, 2, 3, 4] as const

function yn(value: boolean) {
  return value ? 'Reachable' : 'Blocked'
}

interface ContainmentPanelProps {
  device: Device | null
  appliedLevel: ContainmentLevel
  onApply: (level: ContainmentLevel) => void
  onUndo: () => void
}

export function ContainmentPanel({
  device,
  appliedLevel,
  onApply,
  onUndo,
}: ContainmentPanelProps) {
  const [draft, setDraft] = useState<ContainmentLevel>(
    appliedLevel === 0 ? 2 : appliedLevel,
  )
  const [confirming, setConfirming] = useState(false)

  const impact = useMemo(
    () => (device ? previewImpact(device.id, draft) : null),
    [device, draft],
  )
  const before = reachability(0)
  const after = reachability(draft)
  const needsConfirm = device ? requiresConfirmation(device, draft) : false
  const rules = device ? nftablesPreview(device, draft) : ''

  if (!device) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="text-sm font-semibold text-zinc-200">Containment</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Select a device on the graph to preview what a containment level
          would break.
        </p>
      </section>
    )
  }

  function tryApply() {
    if (needsConfirm && !confirming) {
      setConfirming(true)
      return
    }
    onApply(draft)
    setConfirming(false)
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">
            Containment — {device.name}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Applied:{' '}
            {appliedLevel === 0 ? 'none (L0)' : `L${appliedLevel}`}
            {' · '}
            SIMULATED only
          </p>
        </div>
        <button
          type="button"
          onClick={onUndo}
          disabled={appliedLevel === 0}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 active:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Undo
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {LEVEL_IDS.map((level) => {
          const selected = draft === level
          return (
            <button
              key={level}
              type="button"
              onClick={() => {
                setDraft(level)
                setConfirming(false)
              }}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                selected
                  ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600'
              }`}
            >
              <span className="font-semibold">L{level}</span>
              <span className="mt-0.5 block text-xs text-zinc-400">
                {LEVELS[level].name}
              </span>
            </button>
          )
        })}
      </div>

      {impact ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ImpactList
            title="Breaks"
            empty="Nothing fully breaks."
            items={impact.broken.map((fn) => fn.name)}
            tone="red"
          />
          <ImpactList
            title="Slowed"
            empty="Nothing is rate-limited."
            items={impact.slowed.map((fn) => fn.name)}
            tone="amber"
          />
          <ImpactList
            title="Kept"
            empty="No functions remain."
            items={impact.kept.map((fn) => fn.name)}
            tone="emerald"
          />
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Reachability
        </h3>
        <table className="mt-2 w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500">
              <th className="pb-2 pr-4 font-medium">Path</th>
              <th className="pb-2 pr-4 font-medium">Before</th>
              <th className="pb-2 font-medium">After L{draft}</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ['Internet', before.internet, after.internet],
                ['Hub', before.hub, after.hub],
                ['Other devices', before.peers, after.peers],
              ] as const
            ).map(([label, b, a]) => (
              <tr key={label} className="border-b border-zinc-800/80">
                <td className="py-2 pr-4 text-zinc-300">{label}</td>
                <td className="py-2 pr-4 text-emerald-300/90">{yn(b)}</td>
                <td
                  className={
                    a ? 'py-2 text-emerald-300/90' : 'py-2 text-red-300'
                  }
                >
                  {yn(a)}
                  {draft === 1 && label === 'Internet' && getEffect(1).rateLimited
                    ? ' (rate-limited)'
                    : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          nftables preview — SIMULATED, not executed
        </h3>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-300">
          {rules}
        </pre>
      </div>

      {confirming ? (
        <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          {device.name} is safety-critical. Applying L{draft} can cut remote
          or hub paths. Confirm only if you still want this simulated rule.
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={tryApply}
              className="rounded-lg border border-amber-400/50 bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-50 transition hover:bg-amber-500/30 active:bg-amber-500/40"
            >
              Confirm apply L{draft}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={tryApply}
          className="mt-4 rounded-lg border border-sky-500/40 bg-sky-600/20 px-3 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-600/30 active:bg-sky-600/40"
        >
          Apply Level {draft}
        </button>
      )}

      <div className="mt-4">
        <HowThisWorks>
          <p>
            Levels stack: L1 throttles, L2 cuts the internet, L3 also cuts
            other devices, L4 also cuts the hub. Previews are from a
            hand-authored function list — no packets are sent.
          </p>
        </HowThisWorks>
      </div>
    </section>
  )
}

function ImpactList({
  title,
  empty,
  items,
  tone,
}: {
  title: string
  empty: string
  items: string[]
  tone: 'red' | 'amber' | 'emerald'
}) {
  const color = {
    red: 'border-red-900/60 text-red-200',
    amber: 'border-amber-900/60 text-amber-200',
    emerald: 'border-emerald-900/60 text-emerald-200',
  }[tone]

  return (
    <div className={`rounded-lg border bg-zinc-950/40 p-3 ${color}`}>
      <h3 className="text-xs font-medium uppercase tracking-wider opacity-80">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-500">{empty}</p>
      ) : (
        <ul className="mt-2 list-inside list-disc text-xs">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
