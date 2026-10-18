import { useState, type ReactNode } from 'react'

interface HowThisWorksProps {
  title?: string
  children: ReactNode
  defaultOpen?: boolean
}

export function HowThisWorks({
  title = 'How this works',
  children,
  defaultOpen = false,
}: HowThisWorksProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-zinc-800 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left text-sm font-medium text-zinc-300 transition hover:bg-zinc-800/80 hover:text-zinc-100 active:bg-zinc-800"
        aria-expanded={open}
      >
        {title}
        <span className="text-zinc-500">{open ? '−' : '+'}</span>
      </button>
      {open ? (
        <div className="mt-2 text-sm leading-relaxed text-zinc-400">
          {children}
        </div>
      ) : null}
    </div>
  )
}
