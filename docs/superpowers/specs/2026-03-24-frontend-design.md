# FlowForge Frontend — Design Spec
**Date:** 2026-03-24
**Approach:** Shell-first (full app shell + routing scaffolded first, then sections filled in sequence)
**Stack:** Next.js 14 App Router · TypeScript strict · TailwindCSS · Shadcn UI · Framer Motion · React Flow v12 · Three.js/R3F · Apollo Client · Firebase Auth · cmdk

---

## 1. App Shell & Routing

### Next.js App Router Structure
```
app/
├── layout.tsx                        # Root: Geist fonts, Apollo, Firebase providers
├── page.tsx                          # Landing page (public)
├── (auth)/
│   └── login/page.tsx               # Sign in / Sign up (combined)
└── (app)/                            # Protected route group
    ├── layout.tsx                    # Auth guard + FloatingActionMenu + MeshGradient bg
    ├── dashboard/page.tsx            # Workspace + template gallery
    └── canvas/
        ├── new/page.tsx              # Blank canvas (reads ?template param)
        └── [workflowId]/page.tsx    # Existing workflow canvas
```

### Provider Stack (root layout)
- `ApolloProvider` — wraps the entire app
- `FirebaseAuthProvider` — custom context over `onAuthStateChanged`
- `next/font` — Geist Sans + Geist Mono loaded once at root

### Route Protection
- `(app)/layout.tsx` reads Firebase auth state
- Unauthenticated users → redirect to `/login`
- Client-side auth guard (no middleware needed for Firebase)

---

## 2. Design System & Shared Components

### Location: `apps/web/src/components/ui/`

| Component | Source Spec | Used In |
|---|---|---|
| `HeroGeometric` + `ElegantShape` | `UI/background.md` | Landing hero |
| `TextRevealByWord` | `UI/textreveal.md` | Landing scroll section |
| `HoverBorderGradient` | `UI/hoverborder.md` | All primary CTAs |
| `FloatingActionMenu` | `UI/floatingactionmenu.md` | All authenticated views |
| `MeshGradient` | `UI/shader.md` | Canvas + app shell background (Three.js/R3F) |
| `DotOrbit` | `UI/shader.md` | Dashboard background |
| `CommandPalette` | `UI/commandpalette.md` | Canvas + Dashboard (Cmd/Ctrl+K) |

### FloatingActionMenu Options
```typescript
options: [
  { label: "Workspace", icon: BuildingIcon },
  { label: "Settings",  icon: SettingsIcon },
  { label: "Logout",    icon: LogOutIcon }
]
// Position: fixed bottom-8 right-8 on ALL authenticated views
```

### MeshGradient Props
```typescript
// Canvas + app shell
colors={["#000000", "#0a0a1a", "#050510", "#000000"]}
speed={0.2}
// Always wrapped in React.memo, placed at DOM root — never re-renders on canvas updates
```

### DotOrbit Props
```typescript
// Dashboard background
dotColor="#333333"
orbitColor="#1a1a1a"
speed={0.3}
intensity={0.4}
```

### CommandPalette (Cmd/Ctrl+K)
- `cmdk` package as base, wrapped with Framer Motion
- Animation: `scale(0.95) + opacity(0)` → `scale(1) + opacity(1)` on open
- Overlay: `fixed inset-0 bg-black/60 backdrop-blur-sm z-50`
- Panel: `bg-[#0a0a0a] border border-white/10 rounded-2xl w-[560px] shadow-2xl`
- **v1 scope — canvas controls only** (no export commands; export backend not built):

| Section | Command | Shortcut |
|---|---|---|
| WORKFLOW | Run Workflow | `⌘↵` |
| WORKFLOW | Pause Workflow | — |
| WORKFLOW | Add Node | `⌘N` |
| WORKFLOW | Save | `⌘S` |
| VIEW | Toggle Console | `⌘\`` |
| VIEW | Toggle Minimap | — |
| VIEW | Fit View | `⌘⇧F` |

### Shared Utilities: `apps/web/src/lib/`
- `cn.ts` — `clsx` + `tailwind-merge`
- `firebase-client.ts` — Firebase app init + auth instance
- `apollo-client.ts` — Apollo Client with WebSocket split link for subscriptions
- `auth-context.tsx` — React context exposing current user + active org

### Shadcn Components to Initialize
`Button`, `Input`, `Dialog`, `Drawer`, `DropdownMenu`, `Select`, `Textarea`, `Tooltip`, `Badge`, `ScrollArea`, `ResizablePanel`, `Skeleton`

All themed via CSS variables in `globals.css`:
```
Background base:   #000000 → #030303
Card/Surface:      rgba(255,255,255,0.03) → rgba(255,255,255,0.08) + backdrop-blur
Text primary:      #ffffff
Text secondary:    text-white/60
Accent Indigo:     #6366f1
Accent Cyan:       #06b6d4
Accent Rose:       #f43f5e
Borders:           border-white/[0.08]
Node card:         bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl
Node panel:        bg-[#080808] border-l border-white/[0.08]
```

---

## 3. Landing Page

**Route:** `app/page.tsx` (public, fully responsive)

### Sections (top to bottom)

**Hero — `HeroGeometric`**
- Badge: `"FlowForge AI"`
- Title: `"Autonomous Agent"` / `"Workflows, Visualized."`
- `ElegantShape` floating shapes: Indigo `#6366f1`, Cyan `#06b6d4`, Rose `#f43f5e`
- CTAs: `"Start Building Free"` → `/login`, `"Sign In"` → `/login` (both `HoverBorderGradient`)

**Scroll Reveal — `TextRevealByWord`**
- Text: `"FlowForge transforms static automations into intelligent, adaptive systems where AI agents collaborate autonomously."`
- Container `h-[200vh]` for smooth scroll-triggered word reveal

**Feature Strip**
- 6 `FeatureItem` glowing dot items: `Custom FSM Engine`, `Groq LLMs`, `Visual DAG Canvas`, `Real-time Execution`, `PostgreSQL + pgvector`, `Self-hosted`
- `group-hover:opacity-100` border glow on hover

**Footer**
- Logo + `"Built by Eko, PSG College of Technology"` + GitHub link

---

## 4. Auth Flow

**Route:** `app/(auth)/login/page.tsx`

### Layout
- Full-viewport dark page, centered card
- Card: `bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-xl p-8 shadow-xl`
- `MeshGradient` in background

### Sign-in Methods
1. **Google OAuth** — `HoverBorderGradient` button → Firebase `signInWithPopup(GoogleAuthProvider)`
2. **Email/Password** — Shadcn `Input` fields + submit → Firebase `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`

### Post-Auth Flow
1. Firebase returns user (`uid`, `email`, `displayName`)
2. Apollo mutation `upsertUser` → creates/fetches user record + orgs
3. No org → auto-create default personal org
4. Redirect to `/dashboard`

### Error Handling
- Wrong password, email not found, network error → friendly messages inline (Shadcn `Badge`, rose)
- Never expose raw Firebase error codes

### Sign-Out
- `FloatingActionMenu` → Logout → Firebase `signOut()` → redirect to `/`

---

## 5. Dashboard + Template Gallery

**Route:** `app/(app)/dashboard/page.tsx`

### Layout: Two-column (sidebar + main)

**Left Sidebar**
- Org name + role badge (`Owner` / `Editor` / `Viewer`)
- Nav: `Workflows`, `Templates`, `Settings`
- `HoverBorderGradient` `"+ New Workflow"` → Apollo mutation → redirect to `/canvas/[workflowId]`

**Workflows Tab**
- Loading state: Shadcn `Skeleton` cards (3 placeholder cards)
- Error state: inline error banner (`border-rose-500/20 bg-rose-500/5 text-rose-400`)
- Grid of workflow cards: name + last run status badge + last edited timestamp
- Card hover: `group-hover:border-white/20` border glow
- Click → `/canvas/[workflowId]`
- Empty state: centered illustration + `"Create your first workflow"` CTA

**Templates Tab**
- 4 template cards using the `TemplateCard` component (see `UI/templatecard.md`):

| Template | Icon | Tag | Node Count |
|---|---|---|---|
| PSG Internship Hunter | `BriefcaseIcon` (indigo) | `#internship` | 9 |
| Research Automation | `FlaskIcon` (cyan) | `#research` | 5 |
| Lead Qualification | `TargetIcon` (rose) | `#sales` | 6 |
| Content Pipeline | `RssIcon` (orange) | `#content` | 5 |

- Card hover reveals `HoverBorderGradient` `"Use Template"` button (bottom-right, `opacity-0 group-hover:opacity-100`)
- Gradient overlay on hover: `bg-gradient-to-br from-indigo-500/5 to-cyan-500/5`
- Click card → `/canvas/new?template=[id]`
- Template `WorkflowDefinition` JSONs are hardcoded constants in `lib/templates/`

**Background:** `DotOrbit` subtle starfield

---

## 6. Canvas + Node Types

**Routes:** `app/(app)/canvas/new/page.tsx` + `app/(app)/canvas/[workflowId]/page.tsx`

### Template Loading (`canvas/new`)
- Read `searchParams.template` (async in Next.js 14: `const { template } = await searchParams`)
- If `template` param present → look up constant in `lib/templates/[id].ts` → initialize React Flow `nodes` + `edges` from `WorkflowDefinition` → trigger autosave immediately to create the workflow record and get a `workflowId` → redirect to `/canvas/[workflowId]`
- If `template` param absent or invalid → render blank canvas, no autosave until user adds a node

### Layout
- 100vh minus minimal top header
- `MeshGradient` fills entire background (React.memo, at DOM root — never re-renders on canvas changes)
- React Flow `Background`: `variant="dots"`, `color="#ffffff20"`

### Top Header Bar
- Left: workflow name (inline-editable) + autosave indicator (`"Saving..."` / `"Saved"`)
- Right: `HoverBorderGradient` Run / Pause button + `"Logs"` toggle button

### Controls
- Bottom-left: `<Controls />` + `<MiniMap />` (dark styled)
- Bottom-right: `FloatingActionMenu`
- Left sidebar: collapsible node palette — all 8 types, draggable onto canvas
- `CommandPalette` available via Cmd/Ctrl+K

### Node Cards (all 8)
Base CSS: `bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl`

| Node | Dot Color | Input Handles | Output Handles |
|---|---|---|---|
| `TriggerNode` | Green | 0 | 1 |
| `AINode` | Purple | 1 | 1 |
| `ToolNode` | Blue | 1 | 1 |
| `ConditionNode` | Yellow | 1 | 2 (`true` / `false`) |
| `LoopNode` | Orange | 1 | 2 (`item` / `done`) |
| `HumanGateNode` | Red | 1 | 1 |
| `SubWorkflowNode` | Gray | 1 | 1 |
| `OutputNode` | White | 1 | 0 |

### DAG Validation
- Every new edge → client-side DFS cycle detection
- Cycle detected → reject edge + toast: `"Cycles are not allowed in this workflow"`

### Node Execution State Visuals
- `RUNNING` → `animate-pulse border-cyan-500`
- `SUCCESS` → flash `border-green-500` 2s → return to default
- `FAILED` → flash `border-red-500`
- `FALLBACK` → `border-yellow-500`

### Workflow Save
- Debounced autosave (1.5s after last change)
- Apollo mutation `updateWorkflow` — serializes React Flow nodes + edges to `WorkflowDefinition` JSON

---

## 7. Node Configuration Panels

**Pattern:** Clicking any node opens a fixed right-side panel (380px wide) that slides in from the right with Framer Motion (`x: 380 → 0`). Closes on canvas click or `[×]` button. Components in `components/canvas/config/`.

### Panel Styling
- Background: `bg-[#080808] border-l border-white/[0.08]`
- Section headers: `text-white/40 text-xs uppercase tracking-widest`
- Inputs: Shadcn `Input` with dark theme
- Textareas: `bg-white/[0.03] border border-white/10 rounded-lg font-mono text-sm` (Geist Mono)
- Save button: `HoverBorderGradient`
- Unsaved changes → yellow dot indicator on panel header

### Shared Sections in Every Panel
1. **Header** — colored dot + node type name + `[×]` close + node title (editable `Input`)
2. **CONFIGURATION** — node-specific fields (see below)
3. **FAILURE POLICY** — shared across all non-Trigger, non-Output nodes:
   - Retries: number input 0–3 (default 3)
   - Hard Fail: toggle — if ON, workflow stops on repeated failure
   - Fallback output: `Input` — default value used if all retries fail
4. **Save Changes** — `HoverBorderGradient` button → updates React Flow node `data` → triggers debounced autosave

---

### Panel Specs

**TriggerNode Config** (no Failure Policy section)
- Type selector: `Cron` / `Webhook` / `Gmail Poll` / `RSS` / `Manual`
- Cron: expression input + human-readable preview (e.g. `"Every day at 9am"`)
- Webhook: generated URL `${NEXT_PUBLIC_API_BASE_URL}/webhooks/${workflowId}` — read-only + Copy icon button. URL available only after first save.
- Gmail Poll: subject filter + label filter
- RSS: feed URL input
- Manual: description label only

**AINode Config**
- Model display: `Groq — llama-3.3-70b-versatile` (locked, read-only for v1)
- System prompt: `Textarea` (Geist Mono)
- Input mapping: key-value pairs mapping previous node outputs → prompt variables (`{{nodeId.field}}` syntax)
- Output schema: JSON schema `Textarea` or `"free text"` toggle
- Temperature slider: 0.0 → 1.0
- + Failure Policy section

**ToolNode Config**
- Integration selector: `HTTP` / `Gmail` / `Notion` / `Slack` / `GitHub`
- HTTP: method dropdown + URL + headers + body (all support `{{nodeId.field}}` templating)
- Notion: operation + page ID + content mapping
- Slack: channel + message template
- Gmail: to + subject + body template
- GitHub: repo + operation (create issue / fetch repos)
- + Failure Policy section

**ConditionNode Config** (no Failure Policy — branching is not failable)
- Expression input (Geist Mono): e.g. `score > 0.8`
- True path label + False path label (used to label edges on canvas)

**LoopNode Config**
- Input list: maps to a previous node array output field
- Max iterations: number input (default 10)
- Break condition: optional expression (Geist Mono)
- + Failure Policy section

**HumanGateNode Config**
- Context template: what to surface to the human when paused
- AI recommendation source: dropdown of upstream AI nodes — shows that node's output as the suggestion
- Timeout (minutes): number input — auto-fail if no human response within this window
- + Failure Policy section

**SubWorkflowNode Config**
- Workflow selector: dropdown of org workflows
- Input mapping: current node inputs → sub-workflow trigger inputs
- Output mapping: sub-workflow output fields → this node's output fields
- + Failure Policy section

**OutputNode Config** (no Failure Policy — terminal node)
- Output type: `Email` / `Notion` / `Slack` / `Webhook` / `Mark Complete`
- Per-type: same fields as ToolNode (destination + content template)
- `hardFail` toggle: if ON, workflow stops on this node's failure (surfaced here instead of Failure Policy since OutputNode has no retries)

---

## 8. Execution Console + Live Subscriptions

### Layout
- Shadcn `ResizablePanel` at bottom of canvas, default height `h-64`
- **Opens automatically when a Run starts** (not just on toggle)
- Can also be toggled via `"Logs"` button in header or `Cmd/Ctrl+\`` via CommandPalette
- Framer Motion slide-up from bottom on open, slide-down on close
- Background: `bg-black/90 backdrop-blur-md border-t border-white/[0.08]`

### GraphQL Subscriptions (Apollo `useSubscription`)

| Subscription | Payload | Effect |
|---|---|---|
| `workflowRunUpdated(runId)` | Run status | Updates Run/Pause button; toast on complete/fail |
| `nodeExecutionUpdated(runId)` | NodeExecution state | Updates node `data.status` → triggers canvas visuals |
| `nodeLogStream(runId, nodeId)` | Log tokens | Streams into log panel for selected node |

`nodeLogStream` activates only when a node is selected during an active run.

### Console UI
- **Top bar:** `[▼ Execution Console]` label + Run ID + status badge (colored node pill) + elapsed timer + `[×]` close
- **Node pills row:** All nodes in run order — each pill colored by status (cyan=running, green=success, red=failed, yellow=fallback), click to select
- **Log stream:** Monospace Geist Mono `text-xs text-white/70`, timestamps in `text-white/30`, tokens append in real-time, dark scrollable area
- Log format: `12:03:01 [NodeName] RUNNING` / `12:03:02 [NodeName] Token: "..."` / `12:03:04 [NodeName] SUCCESS → {...}`

### Run Button Flow
1. `"Run Workflow"` → `createRun(workflowId)` mutation → returns `runId`
2. All 3 subscriptions activate with `runId`; console opens automatically
3. Button switches to `"Pause"` → clicking sends `pauseRun(runId)` mutation
4. HumanGate pause → Shadcn `Dialog` (Framer Motion fade-in) shows:
   - Context from `HumanGateNode` config
   - AI recommendation (output of configured upstream AI node)
   - Three buttons: `Approve` / `Reject` / `Edit` (edit opens a `Textarea` for custom response)
   - On any action → `resumeRun(runId, decision)` mutation → Dialog closes → `nodeExecutionUpdated` subscription handles all subsequent canvas state transitions (no polling needed)

---

## File Structure

```
apps/web/src/
├── app/
│   ├── layout.tsx                        # Root providers
│   ├── page.tsx                          # Landing
│   ├── (auth)/login/page.tsx
│   └── (app)/
│       ├── layout.tsx                    # Auth guard + shell
│       ├── dashboard/page.tsx
│       └── canvas/
│           ├── new/page.tsx              # Template loading
│           └── [workflowId]/page.tsx
├── components/
│   ├── ui/                               # Design system primitives
│   │   ├── hero-geometric.tsx
│   │   ├── text-reveal-by-word.tsx
│   │   ├── hover-border-gradient.tsx
│   │   ├── floating-action-menu.tsx
│   │   ├── mesh-gradient.tsx
│   │   ├── dot-orbit.tsx
│   │   └── command-palette.tsx
│   ├── canvas/
│   │   ├── nodes/                        # 8 node card components
│   │   │   ├── trigger-node.tsx
│   │   │   ├── ai-node.tsx
│   │   │   ├── tool-node.tsx
│   │   │   ├── condition-node.tsx
│   │   │   ├── loop-node.tsx
│   │   │   ├── human-gate-node.tsx
│   │   │   ├── sub-workflow-node.tsx
│   │   │   └── output-node.tsx
│   │   ├── config/                       # 8 config panel components
│   │   │   ├── failure-policy-section.tsx  # Shared sub-component
│   │   │   ├── trigger-config.tsx
│   │   │   ├── ai-config.tsx
│   │   │   ├── tool-config.tsx
│   │   │   ├── condition-config.tsx
│   │   │   ├── loop-config.tsx
│   │   │   ├── human-gate-config.tsx
│   │   │   ├── sub-workflow-config.tsx
│   │   │   └── output-config.tsx
│   │   ├── node-palette.tsx
│   │   ├── execution-console.tsx
│   │   └── human-gate-dialog.tsx
│   ├── dashboard/
│   │   ├── workflow-card.tsx
│   │   └── template-card.tsx
│   └── landing/
│       └── feature-strip.tsx
├── lib/
│   ├── cn.ts
│   ├── firebase-client.ts
│   ├── apollo-client.ts
│   ├── auth-context.tsx
│   └── templates/                        # 4 WorkflowDefinition JSONs
│       ├── psg-internship-hunter.ts
│       ├── research-automation.ts
│       ├── lead-qualification.ts
│       └── content-pipeline.ts
└── hooks/
    ├── use-workflow-run.ts               # Subscription management + run controls
    └── use-dag-validation.ts            # Client-side cycle detection (DFS)
```

---

## Constraints & Non-Goals

- Canvas is desktop-only; landing page is fully responsive (`sm:` / `md:` / `lg:` breakpoints)
- Only Groq `llama-3.3-70b-versatile` for v1 — model selector is read-only display
- No billing UI, no community marketplace
- No export/import UI in v1 (export commands excluded from CommandPalette)
- `WebGL/Three.js` (`MeshGradient`) always wrapped in `React.memo`, placed at DOM root
- All className merging via `cn()` — no inline styles, no CSS modules
- TypeScript strict mode throughout — no `any`, explicit return types on all exports
- Dashboard loading state: Skeleton cards only; error state: inline banner only
