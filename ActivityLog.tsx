import type { AppEvent } from '../data/events'

const KIND_CLASS: Record<AppEvent['kind'], string> = {
  info: 'text-zinc-300',
  alert: 'text-red-300',
  containment: 'text-sky-300',
  access: 'text-amber-200',
  clock: 'text-zinc-400',
}

interface ActivityLogProps {
  events: AppEvent[]
  title?: string
}

export function ActivityLog({
  events,
  title = 'Activity',
}: ActivityLogProps) {
  const newestFirst = [...events].reverse()

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {title}
      </h2>
      {newestFirst.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">No events yet.</p>
      ) : (
        <ol className="mt-3 max-h-56 space-y-2 overflow-auto pr-1">
          {newestFirst.map((event) => (
            <li
              key={event.id}
              className={`rounded-md border border-zinc-800/80 bg-zinc-950/50 px-3 py-2 text-sm ${KIND_CLASS[event.kind]}`}
            >
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                {event.when}
                {event.kind === 'alert' ? ' · alert' : ''}
              </p>
              <p className="mt-0.5 leading-relaxed">{event.message}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
