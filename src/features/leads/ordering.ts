import type { Lead, LeadMove } from './types';

export function byPosition(a: Lead, b: Lead): number {
  return a.position - b.position || a.created_at.localeCompare(b.created_at);
}

/**
 * Apply a move locally, mirroring the move_lead() SQL function, so the board
 * updates instantly while the request is in flight.
 */
export function applyMove(leads: Lead[], move: LeadMove): Lead[] {
  const moving = leads.find((lead) => lead.id === move.id);
  if (!moving) return leads;

  const updates = new Map<string, Lead>();
  const target = leads.filter((lead) => lead.stage === move.stage && lead.id !== move.id).sort(byPosition);
  const index = Math.min(Math.max(move.index, 0), target.length);
  target.splice(index, 0, {
    ...moving,
    stage: move.stage,
    lost_reason: move.lostReason ?? moving.lost_reason,
  });
  target.forEach((lead, position) => updates.set(lead.id, { ...lead, position }));

  if (moving.stage !== move.stage) {
    leads
      .filter((lead) => lead.stage === moving.stage && lead.id !== move.id)
      .sort(byPosition)
      .forEach((lead, position) => updates.set(lead.id, { ...lead, position }));
  }

  return leads.map((lead) => updates.get(lead.id) ?? lead);
}
