import { cn } from '@/lib/cn';

/** Vyxor AI mark (public/logo.png, transparent background). Decorative: the name sits beside it. */
export function Logo({ className }: { className?: string }) {
  return <img src="/logo.png" alt="" aria-hidden className={cn('object-contain select-none', className)} draggable={false} />;
}
