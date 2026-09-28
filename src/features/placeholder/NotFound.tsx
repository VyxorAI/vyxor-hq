import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

export function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Page not found"
      description="That link doesn't match anything in Vyxor HQ."
      action={
        <Link to="/" className="font-medium text-accent-blue hover:underline">
          Go home
        </Link>
      }
    />
  );
}
