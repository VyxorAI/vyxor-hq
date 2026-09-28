import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button, IconButton } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { errorMessage } from '@/lib/errors';
import { useFormState } from '@/lib/useFormState';
import { useCreateProject, useDeleteProject, useUpdateProject } from './api';
import { ProjectForm } from './form/ProjectForm';
import { toProjectFormValues, toProjectPayload, validateProject } from './form/projectFormModel';
import type { Project } from './types';

const FORM_ID = 'project-form';

interface ProjectDrawerProps {
  /** Undefined when adding a new project. */
  project: Project | undefined;
  defaultClientId?: string;
  onClose: () => void;
}

/** Add or edit a project. A new project opens its page once saved. */
export function ProjectDrawer({ project, defaultClientId, onClose }: ProjectDrawerProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const form = useFormState(() => toProjectFormValues(project, defaultClientId), validateProject);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const saving = createProject.isPending || updateProject.isPending;

  function save() {
    const values = form.check();
    if (!values) return;
    const payload = toProjectPayload(values);
    if (project) {
      updateProject.mutate(
        { id: project.id, changes: payload },
        {
          onSuccess: () => {
            toast.success('Changes saved.');
            onClose();
          },
          onError: (error) => toast.error(`Couldn't save changes. ${errorMessage(error)}`),
        },
      );
    } else {
      createProject.mutate(payload, {
        onSuccess: (created) => {
          toast.success('Project added.');
          navigate(`/projects/${created.id}`);
        },
        onError: (error) => toast.error(`Couldn't add the project. ${errorMessage(error)}`),
      });
    }
  }

  function handleDelete() {
    if (!project) return;
    deleteProject.mutate(project.id, {
      onSuccess: () => {
        toast.success('Project deleted.');
        navigate('/projects', { replace: true });
      },
      onError: (error) => toast.error(`Couldn't delete the project. ${errorMessage(error)}`),
    });
  }

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        title={project ? 'Edit project' : 'New project'}
        footer={
          <>
            {project && (
              <IconButton
                icon={Trash2}
                label="Delete project"
                onClick={() => setConfirmDelete(true)}
                className="hover:bg-danger/15 hover:text-danger"
              />
            )}
            <div className="ml-auto flex gap-2">
              <Button onClick={onClose}>Cancel</Button>
              <Button type="submit" form={FORM_ID} variant="primary" loading={saving}>
                {project ? 'Save changes' : 'Add project'}
              </Button>
            </div>
          </>
        }
      >
        <ProjectForm id={FORM_ID} values={form.values} errors={form.errors} onChange={form.change} onSubmit={save} />
      </Drawer>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this project?"
        description={`This permanently removes ${project?.name ?? 'the project'} and all of its tasks. It can't be undone.`}
        footer={
          <>
            <Button onClick={() => setConfirmDelete(false)}>Keep project</Button>
            <Button variant="danger" icon={Trash2} loading={deleteProject.isPending} onClick={handleDelete}>
              Delete project
            </Button>
          </>
        }
      />
    </>
  );
}
