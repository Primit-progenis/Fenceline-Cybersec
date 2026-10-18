export type AppEventKind =
  | 'info'
  | 'alert'
  | 'containment'
  | 'access'
  | 'clock'

export interface AppEvent {
  id: string
  /** Simulated clock label, e.g. "Day 1, 08:00". */
  when: string
  kind: AppEventKind
  message: string
}

let eventSeq = 0

export function formatSimTime(currentHour: number): string {
  const day = Math.floor(currentHour / 24) + 1
  const hour = currentHour % 24
  return `Day ${day}, ${String(hour).padStart(2, '0')}:00`
}

export function makeEvent(
  kind: AppEventKind,
  message: string,
  currentHour: number,
): AppEvent {
  eventSeq += 1
  return {
    id: `evt-${eventSeq}`,
    when: formatSimTime(currentHour),
    kind,
    message,
  }
}

export function resetEventSeq() {
  eventSeq = 0
}
