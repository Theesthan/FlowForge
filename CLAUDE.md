# CLAUDE.md — FlowForge Project Intelligence

> This is the **master context file** for Claude Code. Read this before every session.
> Keep it updated after every major implementation. Treat it as source of truth.

---

## 1. Project Identity

- **Name:** FlowForge
- **Type:** No-code autonomous AI agent workflow builder — visual DAG editor + custom FSM runtime.
- **Owner:** Solo developer — Eko, PSG College of Technology, Coimbatore.
- **One-liner:** "Zapier meets LangGraph, but self-hosted, DAG-based, with custom FSM, using Groq and React Flow."
- **Stage:** Pre-alpha. Architecture fully planned. Implementation starting now.
- **Repo:** https://github.com/Theesthan/FlowForge

---

## 2. Full Tech Stack

### Frontend
- React + TypeScript (strict mode)
- TailwindCSS for all styling
- @xyflow/react (React Flow v12) for canvas
- Apollo Client for GraphQL queries + subscriptions
- Framer Motion for all animations
- Shadcn UI for base components (dark theme)
- Three.js / React Three Fiber for WebGL backgrounds (shader.md)
- Geist Sans + Geist Mono typography
- `cn()` (clsx + tailwind-merge) for all className merging

### Backend (Microservices — Node.js + TypeScript)
- API Gateway → GraphQL Server (Apollo Server + subscriptions)
- Orchestrator Service → workflow CRUD, DAG validation, run management
- Agent Runtime / FSM Engine → custom state machine node executor
- Queue Worker → BullMQ (Redis-backed) for async node tasks

### Data Layer
- PostgreSQL + pgvector (Prisma ORM)
- Redis — BullMQ queues, pub/sub for GraphQL subscriptions, cache, active run state

### Auth & RBAC
- Firebase Auth (Google OAuth + Email/Password)
- Roles per org: Owner > Editor > Viewer
- Backend enforces role checks on every mutation

### LLM Provider
- Groq: `llama-3.3-70b-versatile` (primary, only model for v1)
- Infrastructure must support adding OpenAI, Anthropic later

### DevOps
- Local: Docker Compose (frontend, API gateway, orchestrator, runtime, worker, postgres+pgvector, redis)
- Production: AWS EC2 (Docker) + RDS PostgreSQL + pgvector extension
- IaC: Terraform
- CI/CD: GitHub Actions
- Monitoring: Prometheus + Grafana, OpenTelemetry + Jaeger

---

## 3. Core Architecture Decisions (NEVER violate these)

1. **Workflow graph is a strict DAG** — cycles are FORBIDDEN at validation time. Reject any edge that creates a cycle.
2. **Custom FSM runtime** — do NOT use any external workflow engine (no Temporal, no n8n internals). Build the FSM from scratch.
3. **Node lifecycle states:** `PENDING → RUNNING → SUCCESS | FAILED | FALLBACK`
4. **Failure policy:**
   - Retry up to 3 times with exponential backoff
   - On repeated failure → use configured fallback output
   - Workflow continues after fallback UNLESS node is marked `hardFail: true`
5. **Pause/Resume** — store exact node pointer + state in Redis AND Postgres. Resume must continue from exact paused node.
6. **Real-time** — ALL node state changes must emit via GraphQL subscriptions (WebSocket). Never poll from frontend.
7. **Parallel execution** — FSM must support fan-out (parallel branches) and fan-in (merge/join nodes).
8. **All secrets via env vars** — NEVER hard-code API keys, tokens, or credentials anywhere.
9. **TypeScript strict mode** everywhere — no `any`, no implicit types.
10. **No Supabase** — we use PostgreSQL + Firebase, not Supabase.

---

## 4. Node Types (Complete Spec)

| Node Type | Description | Header Color |
|---|---|---|
| `TriggerNode` | Entry point. Types: Cron, Webhook, Gmail poll, RSS, Manual. | Green dot |
| `AINode` | LLM call via Groq. Fields: system prompt, input mapping, output schema. | Purple dot |
| `ToolNode` | HTTP API calls. Preconfigured: Gmail, Notion, Slack, GitHub, generic HTTP. | Blue dot |
| `ConditionNode` | Expression evaluator. Two outputs: true path, false path. | Yellow dot |
| `LoopNode` | Iterates over a list. Max iterations + early break condition. | Orange dot |
| `HumanGateNode` | Pauses workflow, surfaces context + AI recommendation. User approve/reject/edit then resume. | Red dot |
| `SubWorkflowNode` | References another workflow as subroutine. Input + output mapping. | Gray dot |
| `OutputNode` | Terminal node. Writes to email/Notion/Slack/webhook or marks complete. | White dot |

---

## 5. Design System (STRICT — follow exactly)

### Color Palette
- Background base: `#000000` to `#030303`
- Card/Surface: `rgba(255,255,255,0.03)` to `rgba(255,255,255,0.08)` + `backdrop-blur`
- Text Primary: `#ffffff`
- Text Secondary: `text-white/60` or `text-gray-400`
- Accent Indigo: `#6366f1`
- Accent Cyan: `#06b6d4`
- Accent Rose: `#f43f5e`
- Borders: `border-white/[0.08]`

### Node Card CSS (use exactly)
```
bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl
```

### Node State Visual Feedback
- `RUNNING` → `animate-pulse border-cyan-500`
- `FAILED` → flash `border-red-500` (retry visual triggers)
- `SUCCESS` → flash `border-green-500` → return to default
- `FALLBACK` → `border-yellow-500`

### Typography
- UI elements / node titles → Geist Sans (fallback: Inter)
- JSON, YAML, logs, code → Geist Mono (fallback: JetBrains Mono)

### Animations
- ALL dialogs, panels, menus → Framer Motion slide/fade (never instant snap)
- Canvas background → MeshGradient colors `["#000000", "#0a0a1a", "#050510", "#000000"]`, speed `0.2`
- React Flow background → `variant="dots"` with `color="#ffffff20"`
- WebGL background (Three.js/shader.md) → wrap in React.memo at DOM root, never re-render on canvas updates

---

## 6. UI Components Mapping (from UI/ folder)

| View | Component | Source File |
|---|---|---|
| Landing Hero | `HeroGeometric` + `ElegantShape` | `UI/background.md` |
| Landing scroll reveal | `TextRevealByWord` | `UI/textreveal.md` |
| All CTAs / primary buttons | `HoverBorderGradient` | `UI/hoverborder.md` |
| Global nav (all auth views) | `FloatingActionMenu` fixed bottom-right | `UI/floatingactionmenu.md` |
| App + canvas background | `DotOrbit` / `MeshGradient` | `UI/shader.md` |
| Feature section items | `FeatureItem` glowing dots | `UI/hero.md` |

### FloatingActionMenu Config
```typescript
// Position: fixed bottom-8 right-8 on ALL authenticated views
options: [
  { label: "Workspace", icon: BuildingIcon },
  { label: "Settings",  icon: SettingsIcon },
  { label: "Logout",    icon: LogOutIcon }
]
```

### Landing Page HeroGeometric Config
```typescript
badge="FlowForge AI"
title1="Autonomous Agent"
title2="Workflows, Visualized."
// ElegantShape gradient colors: Indigo (#6366f1), Cyan (#06b6d4), Rose (#f43f5e)
```

### HoverBorderGradient Usage
- Landing: "Start Building Free" / "Sign In"
- Dashboard: "Create New Workflow"
- Canvas: "Run Workflow" (play button), "Deploy"
- Style: `backdrop-blur-sm bg-black/40`

### TextRevealByWord Config
```typescript
text="FlowForge transforms static automations into intelligent, adaptive systems where AI agents collaborate autonomously."
// Container needs h-[200vh] for smooth scroll reveal
```

---

## 7. Core App Views

### Canvas View (React Flow)
- 100% viewport height minus minimal top header
- Transparent React Flow background — MeshGradient shows through
- React Flow `Background` → `variant="dots"` color `#ffffff20`
- Top right → `HoverBorderGradient` Run/Pause button
- Bottom right → `FloatingActionMenu`
- Bottom left → React Flow zoom/pan controls

### Execution Console
- Resizable drawer panel (bottom or right of canvas)
- Monospace font for all logs
- Real-time streaming via GraphQL subscription `nodeLogStream`
- Framer Motion slide-up animation on open

### Dashboard + Template Gallery
- Grid layout with sidebar
- Background: `DotOrbit` subtle starfield
- Template cards with `group-hover:opacity-100` glowing border reveal
- Cards: PSG Internship Hunter, Research Automation, Lead Qualification, Content Pipeline

---

## 8. GraphQL Schema Domains

Core entities:
- `User` → Firebase UID, email, orgs
- `Organization` → id, name, members (with roles)
- `Workflow` → id, orgId, name, definition (JSON), version, createdAt
- `Run` → id, workflowId, status, startedAt, endedAt, triggeredBy
- `NodeExecution` → id, runId, nodeId, status, input, output, retries, startedAt, endedAt
- `Template` → id, name, description, definition (JSON), category
- `Memory` → id, orgId, content, embedding (pgvector), metadata

Required Subscriptions:
- `workflowRunUpdated(runId)` → streams Run status changes
- `nodeExecutionUpdated(runId)` → streams NodeExecution state (RUNNING/SUCCESS/FAILED/FALLBACK)
- `nodeLogStream(runId, nodeId)` → streams token-level logs from AI nodes

---

## 9. Prisma Schema Summary

Tables to define:
- `users`, `organizations`, `memberships` (userId, orgId, role)
- `workflows`, `workflow_versions`, `runs`, `node_executions`
- `templates`, `memories` (with pgvector embedding column), `audit_logs`

Rules:
- `memories.embedding` → `Unsupported("vector(1536)")` in Prisma schema
- Every table needs `createdAt`, `updatedAt` timestamps
- Soft deletes on `workflows` with `deletedAt`
- All IDs → CUID or UUID (never auto-increment integers)

---

## 10. Environment Variables (never hard-code any of these)

```
# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Groq
GROQ_API_KEY=

# Tool Integrations
NOTION_API_KEY=
SLACK_BOT_TOKEN=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GITHUB_TOKEN=

# App
JWT_SECRET=
PORT=4000
NODE_ENV=development
```

---

## 11. Target Folder Structure

```
FlowForge/
├── apps/
│   ├── web/                        # Next.js/React frontend
│   │   └── src/
│   │       ├── app/                # Next.js app router pages
│   │       ├── components/
│   │       │   ├── canvas/         # React Flow nodes, edges, controls
│   │       │   ├── ui/             # Shadcn + custom UI primitives
│   │       │   ├── landing/        # HeroGeometric, TextReveal, etc.
│   │       │   └── execution/      # Execution console, logs drawer
│   │       ├── lib/                # Apollo client, Firebase client, cn(), utils
│   │       └── hooks/              # Custom React hooks
│   └── api/                        # API Gateway (GraphQL)
│       └── src/
│           ├── graphql/            # schema.graphql, resolvers, subscriptions
│           ├── middleware/         # Firebase auth verification, RBAC enforcement
│           └── services/           # Calls to Orchestrator + Runtime
├── services/
│   ├── orchestrator/               # Workflow CRUD + DAG validation
│   ├── runtime/                    # Custom FSM engine
│   └── worker/                     # BullMQ queue worker
├── packages/
│   ├── db/                         # Prisma schema + migrations
│   ├── types/                      # Shared TypeScript types/interfaces
│   └── config/                     # Shared env config loader
├── infrastructure/
│   ├── docker/                     # Dockerfiles per service
│   ├── docker-compose.yml          # Local dev stack
│   └── terraform/                  # AWS IaC (EC2, RDS, networking)
├── UI/                             # UI component specs (read-only reference)
│   ├── background.md
│   ├── shader.md
│   ├── hero.md
│   ├── hoverborder.md
│   ├── floatingactionmenu.md
│   └── textreveal.md
├── .claude/
│   ├── settings.json
│   ├── commands/                   # Slash command agents
│   └── skills/                     # Skill knowledge bases
├── Agent.md                        # Living feature checklist (update after every feature)
├── PRD.md                          # Product requirements (read-only reference)
├── DesignDoc.md                    # UI/UX spec (read-only reference)
└── CLAUDE.md                       # This file
```

---

## 12. Templates (v1 must ship all four)

### PSG Internship Hunter (build this first)
```
CronTrigger → GmailPoll → AIExtract(skills/keywords) → ToolSearch(LinkedIn/Naukri)
→ AIScore(fit%) → AIGeneratePlan(DSA+ML roadmap) → ToolGitHub(repo analysis)
→ AIValidate(roadmap vs skills) → OutputEmail + OutputNotion + OutputSlack
```

### Research Automation
```
CronTrigger/RSSFeed → ToolFetchArXiv → AISummarize → AIClassify → OutputSlack
```

### Lead Qualification
```
WebhookTrigger → AIParse → AIScore → ConditionNode(threshold) → ToolCRM + OutputSlack
```

### Content Pipeline
```
RSSorWebhookTrigger → AIClassify → AIRewrite → ToolSchedulePost(LinkedIn/social)
```

---

## 13. Skills Available (load when relevant)

```
.claude/skills/agentic-engineering       → FSM engine, AI node execution pipeline
.claude/skills/api-design                → GraphQL + REST API design patterns
.claude/skills/backend-patterns          → Node.js/Express service architecture
.claude/skills/frontend-patterns         → React component patterns
.claude/skills/postgres-patterns         → pgvector queries, schema optimization
.claude/skills/database-migrations       → Prisma migration best practices
.claude/skills/docker-patterns           → Containerizing services
.claude/skills/deployment-patterns       → Vercel + Railway + AWS deployment
.claude/skills/security-review           → Firebase auth, RBAC, token handling
.claude/skills/security-scan             → Secrets and vulnerability scanning
.claude/skills/nextjs-turbopack          → Faster Next.js builds with Turbopack
.claude/skills/cost-aware-llm-pipeline   → Groq/token cost management
.claude/skills/claude-api                → Anthropic Claude as AI node provider
.claude/skills/prompt-optimizer          → Prompt design for AI nodes
.claude/skills/continuous-agent-loop     → FSM retry/loop logic
.claude/skills/autonomous-loops          → Autonomous execution patterns
.claude/skills/verification-loop         → Self-checking execution cycles
.claude/skills/python-patterns           → Python ML/script nodes
.claude/skills/pytorch-patterns          → PyTorch model integration nodes
.claude/skills/mcp-server-patterns       → If FlowForge becomes an MCP server
.claude/skills/context-budget            → Context window management for long runs
.claude/skills/architecture-decision-records → Recording ADRs for big decisions
.claude/skills/coding-standards          → TypeScript + ESLint standards
```

---

## 14. Slash Commands Available

```
/planner              → Break down any large feature into ordered tasks
/architect            → Design system/service/microservice architecture
/feature              → End-to-end feature build workflow
/node                 → Build a new React Flow canvas node component
/code-reviewer        → General code review before committing
/typescript-reviewer  → TypeScript strictness + type safety review
/security-reviewer    → Auth, RBAC, secrets, and API security audit
/database-reviewer    → Prisma schema and query review
/database-migration   → Safe Prisma migration workflow
/refactor-cleaner     → Refactor + clean up messy or duplicated code
/tdd-guide            → Write tests before implementation
/e2e-runner           → Playwright E2E test generation and execution
/doc-updater          → Update Agent.md checklist after completing a feature
/build-error-resolver → Diagnose and fix build/compile errors
/docs-lookup          → Look up React Flow / Apollo / Prisma / BullMQ docs
```

---

## 15. Coding Conventions

- **TypeScript:** strict mode always, no `any`, explicit return types on all exported functions
- **Formatting:** Prettier + ESLint — run before every commit, no exceptions
- **CSS:** Tailwind only — no inline styles, no CSS modules unless absolutely necessary
- **ClassName merging:** always use `cn()` (clsx + tailwind-merge) for conditional classes
- **API:** always use typed GraphQL operations — use codegen if schema is finalized
- **Error handling:** never swallow errors silently — always log with full context
- **Commits:** conventional commits — `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- **File naming:** kebab-case for all files, PascalCase for React components
- **No Supabase** — PostgreSQL + Firebase only
- **No hardcoded secrets** — all config via env vars
- **No `console.log` in production code** — use a proper logger (pino or winston)
- **WebGL/Three.js components** — always wrap in `React.memo`, place at DOM root

---

## 16. How Claude Must Use This File

1. **Read this fully at the start of every session** before writing any code.
2. **Check `Agent.md`** for current checklist status before starting any feature — never duplicate work.
3. **Check `DesignDoc.md`** before building any UI component — match the design system exactly.
4. **Check `PRD.md`** when requirements are unclear — it is the source of truth for product decisions.
5. **Load the relevant skill** from `.claude/skills/` before domain-specific work.
6. **After implementing any feature:**
   - Mark affected checklist items `[x]` in `Agent.md`
   - Add a changelog entry at the bottom of `Agent.md`:
     ```
     ### YYYY-MM-DD
     - Feature: [name]
     - Files touched: [list key files]
     - Notes: [decisions made, deviations from spec, future TODOs]
     ```
7. **Never deviate** from the design system, node lifecycle states, or FSM architecture without explicit instruction from the developer.
8. **When in doubt** about product scope — check `PRD.md`. When in doubt about UI — check `DesignDoc.md`. When in doubt about what's been built — check `Agent.md`.
