import type { DeviceScore } from '../logic/scoring'

interface UpdateDetectedCardProps {
  smartScore: DeviceScore
  basicScore: DeviceScore
}

export function UpdateDetectedCard({
  smartScore,
  basicScore,
}: UpdateDetectedCardProps) {
  const reasoning =
    smartScore.factors.find((f) => f.key === 'volumeSpike')?.detail ??
    'Update pattern recognized from traffic shape.'

  return (
    <div className="rounded-xl border border-emerald-600/30 bg-emerald-950/40 p-5">
      <h2 className="text-lg font-semibold text-emerald-200">
        Firmware update detected. Not flagged.
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-emerald-100/90">
        {reasoning}
      </p>
      <p className="mt-3 text-sm text-zinc-400">
        A basic rule-based system would have scored {basicScore.total}
        {basicScore.level === 'alert'
          ? ' and raised a false alarm'
          : ' (still below the alert threshold)'}
        .
      </p>
    </div>
  )
}
