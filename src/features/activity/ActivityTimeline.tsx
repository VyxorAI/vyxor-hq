import { useState } from 'react';
import { History } from 'lucide-react';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { useProfileMap } from '@/features/auth/profiles';
import { errorMessage } from '@/lib/errors';
import { ActivityComposer } from './ActivityComposer';
import { ActivityItem } from './ActivityItem';
import { useActivities, useDeleteActivity } from './api';
import type { Activity, ActivityEntity } from './types';

interface ActivityTimelineProps {
  entityType: ActivityEntity;
  entityId: string;
  /** Also show history from a related record, e.g. the lead a client came from. */
  related?: { id: string; label: string };
}

/** Composer plus newest-first history of notes, calls, emails and changes. */
export function ActivityTimeline({ entityType, entityId, related }: ActivityTimelineProps) {
  const toast = useToast();
  const profiles = useProfileMap();
  const ids = related ? [entityId, related.id] : [entityId];
  const { data: activities, isPending, error } = useActivities(ids);
  const deleteActivity = useDeleteActivity();
  const [deleting, setDeleting] = useState<Activity | null>(null);

  function confirmDelete() {
    if (!deleting) return;
    deleteActivity.mutate(deleting.id, {
      onSuccess: () => setDeleting(null),
      onError: (err) => toast.error(`Couldn't delete that. ${errorMessage(err)}`),
    });
  }

  let history;
  if (isPending) {
    history = (
      <div className="flex justify-center py-8">
        <Spinner label="Loading activity" />
      </div>
    );
  } else if (!activities) {
    history = <p className="py-6 text-center text-sm text-danger">Couldn't load activity. {error?.message}</p>;
  } else if (activities.length === 0) {
    history = (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-muted">
        <History className="size-5" aria-hidden />
        <p className="text-sm">No activity yet. Notes, calls and changes will show up here.</p>
      </div>
    );
  } else {
    history = (
      <ol className="flex flex-col">
        {activities.map((activity) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            author={activity.user_id ? profiles.get(activity.user_id) : undefined}
            origin={related && activity.entity_id === related.id ? related.label : undefined}
            onDelete={setDeleting}
          />
        ))}
      </ol>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ActivityComposer entityType={entityType} entityId={entityId} />
      {history}

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Delete this ${deleting?.kind ?? 'entry'}?`}
        description="It's removed from the history for both of you. This can't be undone."
        footer={
          <>
            <Button onClick={() => setDeleting(null)}>Keep it</Button>
            <Button variant="danger" loading={deleteActivity.isPending} onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
