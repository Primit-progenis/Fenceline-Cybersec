import { HowThisWorks } from './HowThisWorks'
import { SCORING_CONSTANTS } from '../logic/scoring'

interface ScenarioPanelProps {
  onReset: () => void
  onRunUpdate: () => void
  onRunCompromise: () => void
}

export function ScenarioPanel({
  onReset,
  onRunUpdate,
  onRunCompromise,
}: ScenarioPanelProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        Demo scenarios
      </p>
      <p className="mt-1 text-sm text-zinc-400">
        Simulated traffic only — no real network calls.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 active:bg-zinc-600"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onRunUpdate}
          className="rounded-lg border border-emerald-600/40 bg-emerald-600/15 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-600/25 active:bg-emerald-600/35"
        >
          Run firmware update
        </button>
        <button
          type="button"
          onClick={onRunCompromise}
          className="rounded-lg border border-red-600/40 bg-red-600/15 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-600/25 active:bg-red-600/35"
        >
          Compromise the plug
        </button>
      </div>
      <div className="mt-4">
        <HowThisWorks title="How scoring works">
          <ul className="list-inside list-disc space-y-1">
            <li>
              New destination: {SCORING_CONSTANTS.weights.newDestination} pts
            </li>
            <li>
              Volume spike (largest flow in either direction):{' '}
              {SCORING_CONSTANTS.weights.volumeSpike} pts
            </li>
            <li>New peer: {SCORING_CONSTANTS.weights.newPeer} pts</li>
            <li>Odd hour: {SCORING_CONSTANTS.weights.oddHour} pts</li>
            <li>
              Alert if total ≥ {SCORING_CONSTANTS.alertThreshold}. A firmware
              update discriminator can zero volume and odd-hour points when
              traffic looks like a vendor download.
            </li>
          </ul>
        </HowThisWorks>
      </div>
    </div>
  )
}
