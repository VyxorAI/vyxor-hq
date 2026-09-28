import { LogOut } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/Button';
import { useAuth } from '@/features/auth/useAuth';
import { useCurrentProfile } from '@/features/auth/profiles';
import { cn } from '@/lib/cn';

/** Logged-in founder with a sign-out button. Collapses to the avatar only. */
export function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { user, signOut } = useAuth();
  const profile = useCurrentProfile();
  const name = profile?.full_name ?? user?.email ?? 'You';

  return (
    <div className={cn('flex items-center gap-2.5', collapsed ? 'flex-col' : 'px-2')}>
      <Avatar name={name} src={profile?.avatar_url} size="md" />
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{name}</p>
          <p className="truncate text-xs text-muted">{user?.email}</p>
        </div>
      )}
      <IconButton icon={LogOut} label="Sign out" size="sm" onClick={() => void signOut()} />
    </div>
  );
}
