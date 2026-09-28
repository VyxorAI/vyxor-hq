export interface PulseValue {
  label: string;
  value: string;
  suffix?: string;
  hint: string;
}

/**
 * The one signature element: a wide glass panel with MRR, pipeline value and
 * tasks due, over a soft blue-to-teal glow.
 */
export function PulseStrip({ items }: { items: PulseValue[] }) {
  return (
    <section aria-label="Pulse" className="relative isolate">
      {/* Glow behind the glass */}
      <div
        aria-hidden
        className="bg-signature pointer-events-none absolute inset-x-6 -inset-y-3 -z-10 rounded-modal opacity-40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-1/3 inset-y-2 -z-10 rounded-full bg-accent-purple/35 blur-3xl"
      />

      <dl className="glass grid grid-cols-1 divide-y divide-[rgb(120_150_255/0.15)] rounded-modal sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1 px-5 py-4 sm:py-5">
            <dt className="text-sm text-muted">{item.label}</dt>
            <dd className="font-display text-2xl font-semibold tabular-nums sm:text-3xl">
              {item.value}
              {item.suffix && <span className="ml-1 font-sans text-sm font-normal text-muted">{item.suffix}</span>}
            </dd>
            <dd className="text-xs text-muted">{item.hint}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
