import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Pencil, Plus, SearchX } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { useCurrentProfile } from '@/features/auth/profiles';
import { useClients } from '@/features/clients/api';
import { useTasks } from '@/features/tasks/api';
import { TaskBoard } from '@/features/tasks/board/TaskBoard';
import { TaskDrawerHost, useTaskDrawerLinks } from '@/features/tasks/TaskDrawerHost';
import { formatDate } from '@/lib/format';
import { useProjects } from './api';
import { PROJECT_STATUS_META, PROJECT_TYPE_LABELS } from './constants';
import { ProjectDrawer } from './ProjectDrawer';

/** /projects/:projectId: header plus the project's task board. */
export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const currentProfile = useCurrentProfile();
  const { data: projects, isPending, error, refetch } = useProjects();
  const { data: clients = [] } = useClients();
  const { data: tasks = [] } = useTasks();
  const { openTask, openNewTask } = useTaskDrawerLinks();
  const [editing, setEditing] = useState(false);

  if (isPending) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading project" />
      </div>
    );
  }
  if (!projects) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load this project"
        description={error?.message}
        action={<Button onClick={() => void refetch()}>Try again</Button>}
      />
    );
  }

  const project = projects.find((item) => item.id === projectId);
  if (!project) {
    return (
      <EmptyState
        icon={SearchX}
        title="Project not found"
        description="It may have been deleted."
        action={
          <Link to="/projects" className="font-medium text-accent-blue hover:underline">
            Back to projects
          </Link>
        }
      />
    );
  }

  const client = clients.find((item) => item.id === project.client_id);
  const projectTasks = tasks.filter((task) => task.project_id === project.id);
  const done = projectTasks.filter((task) => task.status === 'done').length;
  const status = PROJECT_STATUS_META[project.status];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Link to="/projects" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-primary">
          <ArrowLeft className="size-4" aria-hidden />
          Projects
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="min-w-0 truncate text-xl">{project.name}</h2>
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              {client && (
                <Link to={`/clients/${client.id}`} className="text-accent-blue hover:underline">
                  {client.business_name}
                </Link>
              )}
              <span>{PROJECT_TYPE_LABELS[project.type]}</span>
              {(project.start_date || project.due_date) && (
                <span className="tabular-nums">
                  {formatDate(project.start_date)} to {formatDate(project.due_date)}
                </span>
              )}
              <span className="tabular-nums">
                {done} of {projectTasks.length} tasks done
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button icon={Pencil} onClick={() => setEditing(true)}>
              Edit project
            </Button>
            <Button variant="primary" icon={Plus} onClick={openNewTask}>
              Add task
            </Button>
          </div>
        </div>
        {project.description && (
          <p className="max-w-3xl whitespace-pre-line text-muted">{project.description}</p>
        )}
      </div>

      <TaskBoard tasks={projectTasks} projectId={project.id} onOpenTask={openTask} />

      <TaskDrawerHost defaults={{ projectId: project.id, assigneeId: currentProfile?.id }} />
      {editing && <ProjectDrawer project={project} onClose={() => setEditing(false)} />}
    </div>
  );
}
