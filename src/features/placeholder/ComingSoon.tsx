import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

interface ComingSoonProps {
  title: string;
  phase: string;
}

/** Placeholder for sections that land in later build steps. */
export function ComingSoon({ title, phase }: ComingSoonProps) {
  return (
    <EmptyState
      icon={Construction}
      title={`${title} isn't built yet`}
      description={`This arrives in ${phase}. Leads are ready to use now.`}
      action={
        <Link to="/leads" className="font-medium text-accent-blue hover:underline">
          Go to leads
        </Link>
      }
    />
  );
}

export function NotFound() {
  return (
    <EmptyState
      icon={Construction}
      title="Page not found"
      description="That link doesn't match anything in Vyxor HQ."
      action={
        <Link to="/leads" className="font-medium text-accent-blue hover:underline">
          Go to leads
        </Link>
      }
    />
  );
}
