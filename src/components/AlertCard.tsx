import { useState } from 'react'
import {
  SCORING_CONSTANTS,
  type DeviceScore,
} from '../logic/scoring'

interface AlertCardProps {
  title: string
  score: DeviceScore
  whatHappened: string
  affectedDevices: string[]
}

export function AlertCard({
  title,
  score,
  whatHappened,
  affectedDevices,
}: AlertCardProps) {
  const [showScoring, setShowScoring] = useState(false)

  return (
    <div className="rounded-xl border border-red-600/40 bg-red-950/30 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-red-100">{title}</h2>
        <p className="text-sm font-medium text-red-200">
          Score:{' '}
          <span className="text-xl font-semibold tabular-nums">
            {score.total}
          </span>
          <span className="text-red-300/80"> / 100</span>
        </p>
      </div>

      <section className="mt-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          What happened
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-zinc-200">
          {whatHappened}
        </p>
      </section>

      <section className="mt-4 overflow-x-auto">
        <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Factors
        </h3>
        <table className="mt-2 w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500">
              <th className="pb-2 pr-4 font-medium">Factor</th>
              <th className="pb-2 pr-4 font-medium">Points</th>
              <th className="pb-2 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {score.factors.map((factor) => (
              <tr
                key={factor.key}
                className="border-b border-zinc-800/80 align-top"
              >
                <td className="py-2 pr-4 text-zinc-200">{factor.label}</td>
                <td className="py-2 pr-4 tabular-nums text-zinc-300">
                  {factor.points}
                </td>
                <td className="py-2 text-zinc-400">{factor.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Affected devices
        </h3>
        <ul className="mt-2 list-inside list-disc text-sm text-zinc-300">
          {affectedDevices.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="mt-4 border-t border-zinc-800 pt-4">
        <button
          type="button"
          onClick={() => setShowScoring((open) => !open)}
          className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left text-sm font-medium text-zinc-300 transition hover:bg-zinc-800/80 hover:text-zinc-100 active:bg-zinc-800"
          aria-expanded={showScoring}
        >
          How scoring works
          <span className="text-zinc-500">{showScoring ? '−' : '+'}</span>
        </button>
        {showScoring ? (
          <dl className="mt-3 space-y-2 text-sm text-zinc-400">
            <div className="flex justify-between gap-4">
              <dt>New destination</dt>
              <dd className="tabular-nums text-zinc-300">
                {SCORING_CONSTANTS.weights.newDestination} pts
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Volume spike (max)</dt>
              <dd className="tabular-nums text-zinc-300">
                {SCORING_CONSTANTS.weights.volumeSpike} pts
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>New peer</dt>
              <dd className="tabular-nums text-zinc-300">
                {SCORING_CONSTANTS.weights.newPeer} pts
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Odd hour</dt>
              <dd className="tabular-nums text-zinc-300">
                {SCORING_CONSTANTS.weights.oddHour} pts
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-zinc-800 pt-2 font-medium text-zinc-300">
              <dt>Alert threshold</dt>
              <dd className="tabular-nums">
                {SCORING_CONSTANTS.alertThreshold}+ pts
              </dd>
            </div>
          </dl>
        ) : null}
      </div>
    </div>
  )
}
