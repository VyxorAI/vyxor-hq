import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

type Size = 'xs' | 'sm' | 'md';

const sizes: Record<Size, string> = {
  xs: 'size-5 text-[10px]',
  sm: 'size-6 text-xs',
  md: 'size-8 text-xs',
};

// Stable colour per person so Carl and Vian are easy to tell apart at a glance
const palette = ['bg-accent-blue/20 text-accent-blue', 'bg-accent-purple/20 text-accent-purple', 'bg-accent-teal/20 text-accent-teal'];

function colourFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % palette.length;
  return palette[hash];
}

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: Size;
  className?: string;
}

export function Avatar({ name, src, size = 'sm', className }: AvatarProps) {
  const classes = cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', sizes[size], className);

  if (src) {
    return <img src={src} alt={name} title={name} className={cn(classes, 'object-cover')} />;
  }

  return (
    <span className={cn(classes, colourFor(name))} title={name} role="img" aria-label={name}>
      {initials(name)}
    </span>
  );
}
