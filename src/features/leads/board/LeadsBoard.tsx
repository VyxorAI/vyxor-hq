import { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { dropAnimation, KanbanColumns } from '@/components/kanban/KanbanColumn';
import { useKanbanBoard, type KanbanMove } from '@/components/kanban/useKanbanBoard';
import { useProfileMap } from '@/features/auth/profiles';
import { useClientsByLead } from '@/features/clients/api';
import { ConvertLeadDrawer } from '@/features/clients/ConvertLeadDrawer';
import { clientValuesFromLead } from '@/features/clients/form/clientFormModel';
import { useMoveLead } from '../api';
import { STAGE_META, STAGE_ORDER, STAGES } from '../constants';
import { toFormValues } from '../drawer/leadFormModel';
import { LostReasonModal } from '../LostReasonModal';
import type { Lead, LeadMove, LeadStage } from '../types';
import { BoardColumn } from './BoardColumn';
import { LeadCard } from './LeadCard';

const leadStage = (lead: Lead) => lead.stage;
const leadName = (lead: Lead) => lead.business_name;
const stageLabel = (stage: LeadStage) => STAGE_META[stage].label;

interface LeadsBoardProps {
  leads: Lead[];
  onOpenLead: (id: string) => void;
}

export function LeadsBoard({ leads, onOpenLead }: LeadsBoardProps) {
  const profiles = useProfileMap();
  const clientsByLead = useClientsByLead();
  const moveLead = useMoveLead();
  const [pendingLost, setPendingLost] = useState<LeadMove | null>(null);
  const [pendingWon, setPendingWon] = useState<LeadMove | null>(null);

  function handleMove({ id, column, index }: KanbanMove<LeadStage>, lead: Lead) {
    const move: LeadMove = { id, stage: column, index };
    // Lost asks for a reason; Won (without a client yet) asks for the client details.
    // The card stays in its new column meanwhile.
    if (column === 'lost' && lead.stage !== 'lost') {
      setPendingLost(move);
      return 'hold' as const;
    }
    if (column === 'won' && lead.stage !== 'won' && !clientsByLead.has(id)) {
      setPendingWon(move);
      return 'hold' as const;
    }
    moveLead(move);
  }

  const board = useKanbanBoard({
    items: leads,
    columnOrder: STAGE_ORDER,
    getColumn: leadStage,
    onMove: handleMove,
    itemLabel: leadName,
    columnLabel: stageLabel,
    noun: 'lead',
  });
  const openLead = board.guardOpen(onOpenLead);

  function confirmLost(reason: string) {
    if (pendingLost) moveLead({ ...pendingLost, lostReason: reason });
    setPendingLost(null);
    board.release();
  }

  function cancelLost() {
    setPendingLost(null);
    board.release();
  }

  // Converting succeeded (the cache already has the card in Won) or was cancelled
  function closeWon() {
    setPendingWon(null);
    board.release();
  }

  const leadById = (id: string | undefined) => leads.find((lead) => lead.id === id);
  const activeLead = board.activeItem;
  const lostLead = leadById(pendingLost?.id);
  const wonLead = leadById(pendingWon?.id);

  return (
    <>
      <DndContext {...board.contextProps}>
        <KanbanColumns>
          {STAGES.map((stage) => (
            <BoardColumn
              key={stage.value}
              stage={stage}
              leads={board.itemsIn(stage.value)}
              profiles={profiles}
              onOpenLead={openLead}
            />
          ))}
        </KanbanColumns>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeLead && (
            <LeadCard
              lead={activeLead}
              owner={activeLead.owner_id ? profiles.get(activeLead.owner_id) : undefined}
              lifted
              className="w-[262px] cursor-grabbing"
            />
          )}
        </DragOverlay>
      </DndContext>

      <LostReasonModal
        open={pendingLost !== null}
        leadName={lostLead?.business_name ?? ''}
        onConfirm={confirmLost}
        onCancel={cancelLost}
      />

      {pendingWon && wonLead && (
        <ConvertLeadDrawer
          lead={wonLead}
          initialValues={clientValuesFromLead(toFormValues(wonLead, undefined))}
          index={pendingWon.index}
          onCancel={closeWon}
          onConverted={closeWon}
        />
      )}
    </>
  );
}
