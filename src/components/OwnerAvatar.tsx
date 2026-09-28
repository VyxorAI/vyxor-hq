import { Avatar } from '@/components/Avatar';
import type { Profile } from '@/features/auth/profiles';

interface OwnerAvatarProps {
  owner: Profile | undefined;
  size?: 'xs' | 'sm';
  /** Label for the empty circle, e.g. "Unassigned". */
  emptyLabel?: string;
}

/** A founder's avatar, or a dashed circle when nobody is set. */
export function OwnerAvatar({ owner, size = 'sm', emptyLabel = 'No owner' }: OwnerAvatarProps) {
  if (!owner) {
    return (
      <span
        className="inline-flex size-6 shrink-0 rounded-full border border-dashed border-border"
        title={emptyLabel}
        role="img"
        aria-label={emptyLabel}
      />
    );
  }
  return <Avatar name={owner.full_name} src={owner.avatar_url} size={size} />;
}
