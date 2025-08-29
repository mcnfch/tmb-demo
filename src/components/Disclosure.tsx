'use client';

import { useState, ReactNode } from 'react';

type Props = { title: string; children: ReactNode };

export default function Disclosure({ title, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10"
      >
        <span className="font-medium">{title}</span>
        <span className="text-xs opacity-70">{open ? 'Hide' : 'Details ▸'}</span>
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}
