import { Link } from 'react-router-dom';
import { ArrowLeft, Target } from 'lucide-react';
import { formatDate, formatZAR } from '@/lib/format';
import { StatusBadge } from '../components/StatusBadge';
import type { Client } from '../types';

export function ClientHeader({ client }: { client: Client }) {
  return (
    <div className="flex flex-col gap-3">
      <Link to="/clients" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden />
        Clients
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="min-w-0 truncate text-xl">{client.business_name}</h2>
            <StatusBadge status={client.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {client.package && <span>{client.package}</span>}
            {client.start_date && <span>Since {formatDate(client.start_date)}</span>}
            {client.lead_id && (
              <Link
                to={`/leads?lead=${client.lead_id}`}
                className="inline-flex items-center gap-1 text-accent-blue hover:underline"
              >
                <Target className="size-3.5" aria-hidden />
                Original lead
              </Link>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex flex-col">
            <span className="text-xs text-muted">Retainer</span>
            <span className="font-display text-xl font-semibold tabular-nums">
              {formatZAR(client.monthly_retainer)}
              {client.monthly_retainer ? <span className="text-sm font-normal text-muted">/mo</span> : null}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted">Setup fee</span>
            <span className="font-display text-xl font-semibold tabular-nums">{formatZAR(client.setup_fee)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
