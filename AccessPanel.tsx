import { useMemo, useState, type FormEvent } from 'react'
import type { AccessPass, AccessPermission, AccessRole } from '../data/access'
import { devices } from '../data/devices'
import { formatSimTime } from '../data/events'
import {
  checkAccess,
  issuePass,
  passStatus,
  STALE_AFTER_DAYS,
} from '../logic/access'
import { HowThisWorks } from './HowThisWorks'

interface AccessPanelProps {
  currentHour: number
  passes: AccessPass[]
  onAdvance: (hours: number) => void
  onIssue: (pass: AccessPass) => void
  onAttempt: (pass: AccessPass, deviceId: string) => void
  onRevoke: (pass: AccessPass) => void
}

const STATUS_CLASS = {
  active: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
  stale: 'bg-amber-500/15 text-amber-300 ring-amber-500/40',
  expired: 'bg-red-500/15 text-red-300 ring-red-500/40',
  revoked: 'bg-red-500/15 text-red-300 ring-red-500/40',
} as const

export function AccessPanel({
  currentHour,
  passes,
  onAdvance,
  onIssue,
  onAttempt,
  onRevoke,
}: AccessPanelProps) {
  const [targetId, setTargetId] = useState(devices[0]?.id ?? '')
  const [name, setName] = useState('')
  const [role, setRole] = useState<AccessRole>('staff')
  const [permission, setPermission] = useState<AccessPermission>('view')
  const [durationHours, setDurationHours] = useState(24)
  const [selectedDevices, setSelectedDevices] = useState<string[]>([
    'lock-front',
  ])

  const target = useMemo(
    () => devices.find((d) => d.id === targetId) ?? devices[0],
    [targetId],
  )

  function toggleDevice(id: string) {
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function submitPass(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || selectedDevices.length === 0) return
    onIssue(
      issuePass({
        person: name,
        role,
        deviceIds: selectedDevices,
        permission,
        durationHours,
        currentHour,
      }),
    )
    setName('')
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">SimClock</h2>
            <p className="mt-1 text-sm text-zinc-300">
              Simulated time: {formatSimTime(currentHour)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAdvance(1)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 active:bg-zinc-600"
            >
              +1 hour
            </button>
            <button
              type="button"
              onClick={() => onAdvance(24)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 active:bg-zinc-600"
            >
              +1 day
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">People</h2>
          <label className="flex flex-col text-xs text-zinc-500">
            Attempt access on
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="mt-1 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="pb-2 pr-3 font-medium">Person</th>
                <th className="pb-2 pr-3 font-medium">Role</th>
                <th className="pb-2 pr-3 font-medium">Devices</th>
                <th className="pb-2 pr-3 font-medium">Permission</th>
                <th className="pb-2 pr-3 font-medium">Expires</th>
                <th className="pb-2 pr-3 font-medium">Status</th>
                <th className="pb-2 font-medium">Try</th>
                <th className="pb-2 font-medium">Revoke</th>
              </tr>
            </thead>
            <tbody>
              {passes.map((pass) => {
                const status = passStatus(pass)
                const names = pass.deviceIds
                  .map((id) => devices.find((d) => d.id === id)?.name ?? id)
                  .join(', ')
                const expires =
                  pass.expiresAtHour == null
                    ? 'Never'
                    : formatSimTime(pass.expiresAtHour)
                return (
                  <tr key={pass.id} className="border-b border-zinc-800/80">
                    <td className="py-2 pr-3 text-zinc-200">{pass.person}</td>
                    <td className="py-2 pr-3 capitalize text-zinc-400">
                      {pass.role}
                    </td>
                    <td className="py-2 pr-3 text-zinc-400">{names}</td>
                    <td className="py-2 pr-3 capitalize text-zinc-400">
                      {pass.permission}
                    </td>
                    <td className="py-2 pr-3 text-zinc-400">{expires}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_CLASS[status]}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => onAttempt(pass, target.id)}
                        className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700 active:bg-zinc-600"
                      >
                        Try {pass.permission}
                      </button>
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => onRevoke(pass)}
                        disabled={pass.revoked}
                        className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-200 transition hover:bg-red-500/20 active:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {pass.revoked ? 'Revoked' : 'Revoke'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Preview of {target?.name}:{' '}
          {passes
            .map((p) => {
              const r = checkAccess(p, target.id, currentHour, p.permission)
              return `${p.person} ${r.allowed ? 'ok' : r.reason}`
            })
            .join(' · ')}
        </p>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-sm font-semibold text-zinc-200">
          Issue guest pass
        </h2>
        <form
          onSubmit={submitPass}
          className="mt-3 grid gap-3 sm:grid-cols-2"
        >
          <label className="text-xs text-zinc-500">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200"
              placeholder="Guest name"
              required
            />
          </label>
          <label className="text-xs text-zinc-500">
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AccessRole)}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200"
            >
              <option value="staff">staff</option>
              <option value="vendor">vendor</option>
              <option value="family">family</option>
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Permission
            <select
              value={permission}
              onChange={(e) =>
                setPermission(e.target.value as AccessPermission)
              }
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200"
            >
              <option value="view">view</option>
              <option value="control">control</option>
            </select>
          </label>
          <label className="text-xs text-zinc-500">
            Duration (simulated hours)
            <input
              type="number"
              min={1}
              max={720}
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200"
            />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-xs text-zinc-500">Devices</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {devices.map((d) => (
                <label
                  key={d.id}
                  className="flex items-center gap-2 text-sm text-zinc-300"
                >
                  <input
                    type="checkbox"
                    checked={selectedDevices.includes(d.id)}
                    onChange={() => toggleDevice(d.id)}
                  />
                  {d.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={!name.trim() || selectedDevices.length === 0}
              className="rounded-lg border border-sky-500/40 bg-sky-600/20 px-3 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-600/30 active:bg-sky-600/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Issue pass
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <HowThisWorks>
          <p>
            Passes are time-boxed and expire automatically when the simulated
            clock reaches their expiry hour. Owner and family never go stale.
            Staff and vendor passes go stale if unused for more than{' '}
            {STALE_AFTER_DAYS} days. An attempt with an expired pass is always
            denied and logged as a red alert. Nothing here talks to a real
            lock or camera.
          </p>
        </HowThisWorks>
      </section>
    </div>
  )
}
