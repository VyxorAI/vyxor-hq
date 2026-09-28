import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import {
  CornerDownLeft,
  FileText,
  FolderKanban,
  LibraryBig,
  ListChecks,
  Plus,
  Receipt,
  Search,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { navItems } from '@/components/shell/navItems';
import { useClients } from '@/features/clients/api';
import { STATUS_META } from '@/features/clients/constants';
import { useLeads } from '@/features/leads/api';
import { STAGE_META } from '@/features/leads/constants';
import { useAssets } from '@/features/library/api';
import { ASSET_TYPE_META } from '@/features/library/constants';
import { useProjects } from '@/features/projects/api';
import { useTasks } from '@/features/tasks/api';

interface PaletteItem {
  key: string;
  label: string;
  /** Secondary text, also searchable. */
  hint?: string;
  keywords?: string[];
  icon: LucideIcon;
  to: string;
}

const ACTIONS: PaletteItem[] = [
  { key: 'new-lead', label: 'New lead', icon: Plus, to: '/leads?new=1', keywords: ['add', 'create'] },
  { key: 'new-client', label: 'New client', icon: Plus, to: '/clients?new=1', keywords: ['add', 'create'] },
  { key: 'new-project', label: 'New project', icon: Plus, to: '/projects?new=1', keywords: ['add', 'create'] },
  { key: 'new-task', label: 'New task', icon: Plus, to: '/my-week?newTask=1', keywords: ['add', 'create', 'todo'] },
  { key: 'new-invoice', label: 'New invoice', icon: FileText, to: '/money?newInvoice=1', keywords: ['add', 'create', 'bill'] },
  { key: 'new-expense', label: 'Add expense', icon: Receipt, to: '/money?tab=expenses&newExpense=1', keywords: ['cost', 'create'] },
  { key: 'new-asset', label: 'Add to library', icon: LibraryBig, to: '/library?new=1', keywords: ['upload', 'sop', 'prompt', 'file'] },
];

const PAGES: PaletteItem[] = navItems.map((item) => ({
  key: `page-${item.to}`,
  label: item.label,
  hint: 'Page',
  icon: item.icon,
  to: item.to,
  keywords: ['go', 'open'],
}));

const itemClass =
  'flex cursor-pointer items-center gap-3 rounded-control px-3 py-2 text-sm text-primary data-[selected=true]:bg-raised aria-disabled:opacity-50';

function Item({ item, onSelect }: { item: PaletteItem; onSelect: (item: PaletteItem) => void }) {
  const Icon = item.icon;
  return (
    <Command.Item
      // Unique value so identical names don't merge; keywords carry the searchable extras
      value={`${item.label} ${item.key}`}
      keywords={[item.label, item.hint ?? '', ...(item.keywords ?? [])]}
      onSelect={() => onSelect(item)}
      className={itemClass}
    >
      <Icon className="size-4 shrink-0 text-muted" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.hint && <span className="max-w-[45%] shrink-0 truncate text-xs text-muted">{item.hint}</span>}
    </Command.Item>
  );
}

/** Records are only searched once something is typed, so the empty palette stays short. */
function useRecordGroups(): Array<{ heading: string; items: PaletteItem[] }> {
  const { data: leads = [] } = useLeads();
  const { data: clients = [] } = useClients();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const { data: assets = [] } = useAssets();
  const clientName = new Map(clients.map((client) => [client.id, client.business_name]));

  return [
    {
      heading: 'Leads',
      items: leads.map((lead) => ({
        key: `lead-${lead.id}`,
        label: lead.business_name,
        hint: STAGE_META[lead.stage].label,
        keywords: [lead.contact_name ?? '', lead.email ?? '', lead.phone ?? ''],
        icon: Target,
        to: `/leads?lead=${lead.id}`,
      })),
    },
    {
      heading: 'Clients',
      items: clients.map((client) => ({
        key: `client-${client.id}`,
        label: client.business_name,
        hint: STATUS_META[client.status].label,
        keywords: [client.contact_name ?? '', client.email ?? '', client.package ?? ''],
        icon: Users,
        to: `/clients/${client.id}`,
      })),
    },
    {
      heading: 'Projects',
      items: projects.map((project) => ({
        key: `project-${project.id}`,
        label: project.name,
        hint: clientName.get(project.client_id),
        icon: FolderKanban,
        to: `/projects/${project.id}`,
      })),
    },
    {
      heading: 'Tasks',
      items: tasks
        .filter((task) => task.status !== 'done')
        .map((task) => ({
          key: `task-${task.id}`,
          label: task.title,
          hint: task.client_id ? clientName.get(task.client_id) : 'General',
          icon: ListChecks,
          to: `/projects/${task.project_id ?? 'general'}?task=${task.id}`,
        })),
    },
    {
      heading: 'Library',
      items: assets.map((asset) => ({
        key: `asset-${asset.id}`,
        label: asset.title,
        hint: ASSET_TYPE_META[asset.type].label,
        keywords: asset.tags,
        icon: ASSET_TYPE_META[asset.type].icon,
        to: `/library/${asset.id}`,
      })),
    },
  ];
}

function PaletteContent({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const groups = useRecordGroups();
  const searching = search.trim().length > 0;

  function select(item: PaletteItem) {
    onClose();
    navigate(item.to);
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b border-[rgb(120_150_255/0.15)] px-4">
        <Search className="size-4 shrink-0 text-muted" aria-hidden />
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Search leads, clients, projects, tasks, library… or type a command"
          className="h-12 w-full bg-transparent text-sm text-primary outline-none placeholder:text-muted"
        />
        <kbd className="hidden shrink-0 rounded-[4px] border border-border px-1.5 py-0.5 text-[10px] text-muted sm:inline">Esc</kbd>
      </div>

      <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted">
        <Command.Empty className="px-3 py-8 text-center text-sm text-muted">
          Nothing found for “{search.trim()}”.
        </Command.Empty>

        <Command.Group heading="Actions">
          {ACTIONS.map((item) => (
            <Item key={item.key} item={item} onSelect={select} />
          ))}
        </Command.Group>

        {searching &&
          groups.map(
            (group) =>
              group.items.length > 0 && (
                <Command.Group key={group.heading} heading={group.heading}>
                  {group.items.map((item) => (
                    <Item key={item.key} item={item} onSelect={select} />
                  ))}
                </Command.Group>
              ),
          )}

        <Command.Group heading="Go to">
          {PAGES.map((item) => (
            <Item key={item.key} item={item} onSelect={select} />
          ))}
        </Command.Group>
      </Command.List>

      <div className="flex items-center gap-4 border-t border-[rgb(120_150_255/0.15)] px-4 py-2 text-xs text-muted">
        <span className="flex items-center gap-1">
          <kbd className="rounded-[4px] border border-border px-1">↑</kbd>
          <kbd className="rounded-[4px] border border-border px-1">↓</kbd>
          to move
        </span>
        <span className="flex items-center gap-1">
          <CornerDownLeft className="size-3" aria-hidden /> to open
        </span>
      </div>
    </>
  );
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Ctrl/Cmd + K: search every record and run common actions. Glass, per the design system. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      loop
      overlayClassName="fixed inset-0 z-50 animate-fade-in bg-base/70"
      contentClassName="glass fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 animate-modal-in overflow-hidden rounded-modal shadow-overlay focus:outline-none"
    >
      {/* Mounted only while open, so record queries run on demand */}
      {open && <PaletteContent onClose={() => onOpenChange(false)} />}
    </Command.Dialog>
  );
}
