# Vyxor HQ: Internal Operating System

## 1. What this is

Vyxor HQ is a private web app used only by the two Vyxor AI co-founders, Carl and Vian. It replaces scattered tools with one place to run the agency: leads, clients, projects, tasks, money, and assets.

- Users: exactly two, both admins. No public sign-up.
- Not a commercial product. No multi-tenancy, billing, or onboarding flows.
- Priorities: fast to use daily, clear at a glance, easy to maintain.

## 2. Tech stack

- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS with custom design tokens (section 4)
- Routing: React Router
- Data fetching: TanStack Query
- Drag and drop: dnd-kit (pipeline and task boards)
- Charts: Recharts
- Icons: lucide-react
- Backend: Supabase (Postgres, Auth, Storage, Row Level Security)
- Hosting: Netlify
- Later phases: n8n (already self-hosted on DigitalOcean) for automations, Claude API for the assistant

## 3. Build phases

### Phase 1 (V1, build first)
1. Auth: email + password login via Supabase. Sign-up disabled. Only Carl and Vian's accounts exist.
2. App shell: sidebar navigation, top bar, responsive layout.
3. Leads pipeline: kanban board plus table view.
4. Clients: list and detail pages.
5. Projects and tasks: per-client projects, task board, "My week" view.

### Phase 2
6. Finances: retainers, setup fees, invoices, expenses, MRR.
7. Home dashboard with live numbers.

### Phase 3
8. Assets and SOPs library (file uploads plus markdown SOPs).
9. Activity log and notes across all records.

### Phase 4
10. n8n automations (website form to new lead, weekly summary to WhatsApp).
11. AI assistant powered by the Claude API with context from the database.

## 4. Design system

Inspired by the Vyxor AI website. Replace the hex values below with the exact values from the website's Tailwind config or CSS if they differ.

### Colour tokens
| Token | Hex | Use |
|---|---|---|
| `bg-base` | `#070B1A` | App background (deep navy, not grey-black) |
| `bg-surface` | `#0E1530` | Cards, tables, sidebar |
| `bg-raised` | `#16204A` | Hover rows, inputs, dropdowns |
| `border` | `#22305E` | Hairline borders and dividers |
| `text-primary` | `#EAF0FF` | Main text |
| `text-muted` | `#8A96BF` | Secondary text, metadata |
| `accent-blue` | `#2F7BFF` | Primary actions, links, focus rings |
| `accent-teal` | `#14E0C4` | Positive states: won, paid, done |
| `accent-purple` | `#8B5CF6` | Highlights, AI features, selected items |
| `warning` | `#F5B544` | Overdue, needs attention |
| `danger` | `#F4587A` | Lost, errors, delete |

Signature gradient (use sparingly): `linear-gradient(135deg, #2F7BFF, #14E0C4)` with a purple glow.

### Typography
- Headings and big numbers: Space Grotesk (600 and 700)
- Body, tables, forms: Inter (400, 500, 600)
- Scale: 12 / 14 / 16 / 20 / 24 / 32 / 44 px
- Sentence case everywhere. No all-caps labels.
- Use tabular numbers (`font-variant-numeric: tabular-nums`) for money and counts.

### Glassmorphism rules
The website uses glass cards. In a daily-use dashboard, glass everywhere hurts readability, so:
- Use glass only on: the home dashboard top strip, modals, the command palette, and toasts.
- Glass recipe: `background: rgba(14, 21, 48, 0.6)`, `backdrop-filter: blur(16px)`, 1px border `rgba(120, 150, 255, 0.15)`.
- Tables, forms, and boards sit on solid `bg-surface` for clarity.

### The one signature element
The home screen "pulse" strip: a wide glass panel at the top showing MRR, pipeline value, and tasks due, with a soft blue-to-teal glow behind it. Everything else stays calm and disciplined.

### Layout
```
+-----------+-------------------------------------------+
| Vyxor HQ  |  Top bar: page title, search, + New       |
|           +-------------------------------------------+
| Home      |                                           |
| Leads     |           Page content                    |
| Clients   |                                           |
| Projects  |                                           |
| Money     |                                           |
| Library   |                                           |
|           |                                           |
| Carl  (o) |                                           |
+-----------+-------------------------------------------+
```
- Sidebar: 240px, collapsible to icons. Bottom sidebar shows the logged-in user.
- Content max width 1400px, left aligned.
- Border radius: 6px for inputs and buttons, 10px for cards, 14px for modals. Hierarchy, not one radius for everything.
- Mobile: sidebar becomes a bottom tab bar with Home, Leads, Clients, Projects, More.

### Interaction
- Keyboard: `Cmd/Ctrl + K` opens a command palette (search anything, create lead, create task).
- Motion only in response to actions: card drag, modal open, toast confirm. No decorative entrance animations.
- Visible focus rings in `accent-blue`. Respect `prefers-reduced-motion`.

### Copy tone
Plain, direct, sentence case. Buttons say exactly what happens ("Add lead", "Mark as won", "Save changes"). Empty states tell you what to do next ("No leads yet. Add your first one or connect the website form.").

## 5. Data model (Supabase)

All tables have `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz`.

### profiles
- `user_id` (references auth.users), `full_name`, `avatar_url`, `role` ('founder')

### leads
- `business_name`, `contact_name`, `phone`, `email`, `website`
- `industry` (enum: salon, dental, medical, guest_house, construction, bookkeeping, real_estate, cleaning, driving_school, gym, legal, other)
- `offer` (enum: whatsapp_automation, website, voice_agent, other)
- `stage` (enum: new, contacted, call_booked, proposal_sent, won, lost)
- `estimated_setup_fee` numeric, `estimated_monthly` numeric
- `source` (enum: outreach, referral, website_form, social, other)
- `owner_id` (references profiles)
- `next_follow_up` date, `notes` text, `lost_reason` text
- `position` integer (ordering within a stage)

### clients
- `lead_id` (nullable, links back to original lead)
- `business_name`, `contact_name`, `phone`, `email`, `website`, `industry`
- `package` text, `setup_fee` numeric, `monthly_retainer` numeric
- `status` (enum: onboarding, active, paused, churned)
- `start_date` date, `owner_id`, `notes` text
- `vault_link` text: link to the client's entry in a password manager. Never store client passwords in this app.

### projects
- `client_id`, `name`, `type` (enum: whatsapp_agent, website, voice_agent, automation, other)
- `status` (enum: planning, building, review, live, on_hold)
- `start_date`, `due_date`, `description`

### tasks
- `project_id` (nullable, for general agency tasks), `client_id` (nullable)
- `title`, `description`, `assignee_id`, `due_date`
- `status` (enum: todo, doing, done), `priority` (enum: low, medium, high), `position` integer

### invoices (Phase 2)
- `client_id`, `number`, `type` (enum: setup, retainer, other), `amount` numeric, `issued_on`, `due_on`, `paid_on` (nullable)
- `status` (enum: draft, sent, paid, overdue)

### expenses (Phase 2)
- `description`, `category` (enum: hosting, api, software, marketing, other), `amount` numeric, `recurring` boolean, `date`, `client_id` (nullable, for per-client cost)

### assets (Phase 3)
- `title`, `type` (enum: proposal, questionnaire, guide, prompt, sop, template, other), `file_path` (Supabase Storage), `content` (markdown, for SOPs and prompts), `tags` text[]

### activities (Phase 3)
- `entity_type` (lead, client, project), `entity_id`, `user_id`, `kind` (note, call, email, stage_change, status_change), `body` text

### Security
- Enable Row Level Security on every table.
- Policy: any authenticated user can select, insert, update, delete. (Only two accounts exist.)
- Disable sign-ups in Supabase Auth settings.
- Keys in `.env` only. Never commit them.
- Currency is ZAR. Format as `R 12,500`.

## 6. Screens

### Leads (Phase 1)
- Kanban board with columns per stage. Drag cards between stages.
- Card shows: business name, industry, offer, estimated monthly value, next follow-up (amber if due today, red if overdue), owner avatar.
- Column header shows count and total estimated monthly value.
- Toggle to table view with sort and filter (industry, offer, owner, stage).
- Lead drawer (slide-in panel) for editing all fields.
- "Mark as won" converts the lead into a client and pre-fills the client record.
- Moving a card to "Lost" asks for a short lost reason.

### Clients (Phase 1)
- Table: name, industry, package, retainer, status, start date, owner.
- Client detail page with tabs: Overview, Projects, Tasks, Invoices (Phase 2), Notes (Phase 3).

### Projects and tasks (Phase 1)
- Projects list grouped by status.
- Project page with task board (todo, doing, done).
- "My week" page: tasks assigned to the logged-in user, due in the next 7 days, plus overdue.

### Money (Phase 2)
- MRR (sum of active client retainers), setup fees this month, outstanding invoices, expenses this month, profit this month.
- 12-month revenue chart.
- Invoice and expense tables.

### Home (Phase 2)
- Pulse strip: MRR, pipeline value, tasks due this week.
- Follow-ups due today.
- My tasks.
- Recent activity.

### Library (Phase 3)
- Grid of assets filterable by type and tags. Upload files, write markdown SOPs, copy prompts in one click.

## 7. Project structure
```
src/
  components/   shared UI (Button, Input, Drawer, Modal, Badge, Avatar)
  features/
    auth/
    leads/
    clients/
    projects/
    tasks/
    money/
    library/
  lib/          supabase client, formatters, query client
  styles/       tokens and global CSS
  routes.tsx
supabase/
  migrations/   SQL schema files
```

## 8. Definition of done for V1
- Both founders can log in; nobody else can.
- Leads can be created, edited, dragged between stages, filtered, and converted to clients.
- Clients, projects, and tasks work end to end.
- Works well on desktop and phone.
- Deployed to Netlify with environment variables set.
