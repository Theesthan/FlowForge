> This file is the **project memory** for the FlowForge codebase. Claude should keep it updated whenever new features, decisions, or implementations are added.

### 1. Project Identity

- **Name:** FlowForge  
- **Type:** No-code autonomous AI agent workflow builder with visual DAG editor and custom FSM runtime.  
- **Owner:** Solo developer (student, PSG College of Technology).  

High-level analogy: “Zapier meets LangGraph, but self-hosted, DAG-based, with custom FSM, using Groq and React Flow.”  

---

### 2. Current Tech Stack

**Frontend**  
- React + TypeScript. [file:1]  
- TailwindCSS for styling. [file:1]  
- @xyflow/react (React Flow) for canvas.  
- Apollo Client (GraphQL queries + subscriptions).  

**Backend**  
- Node.js + Express. [file:1]  
- GraphQL API (Apollo Server or similar) with subscriptions. [file:1]  
- Microservices: API Gateway, Orchestrator, Agent Runtime, Queue Worker.  

**Data & Infra**  
- PostgreSQL + pgvector. [file:1]  
- Redis (BullMQ, cache, pub/sub). [file:1]  
- Docker, Docker Compose (dev). [file:1]  
- AWS (EC2 + RDS) for demo deployment. [file:1]  
- Terraform for IaC, GitHub Actions for CI/CD. [file:1]  
- Monitoring: Prometheus + Grafana, tracing with OpenTelemetry/Jaeger. [file:1]  

**Auth & Roles**  
- Firebase Auth (Google OAuth + Email/Password).  
- RBAC: Owner, Editor, Viewer per organization/workspace.  

**LLM Provider**  
- Groq: `llama-3.3-70b-versatile` (only model for now).  

---

### 3. Core Design Decisions

- Workflow graph is a **DAG**; cycles are forbidden at validation time.  
- Execution engine is a **custom FSM**:
  - Node lifecycle: PENDING → RUNNING → SUCCESS/FAILED/FALLBACK.  
  - Supports parallel branches and merges.  
  - Pause/resume supported at arbitrary node (resume from exact node state).  
- Failure policy:
  - Retry up to 3 times with exponential backoff.  
  - On repeated failure → use configured default/fallback output.  
  - Workflow continues after fallback unless node marked as hard-fail.  

- Real-time updates:
  - GraphQL subscriptions with WebSockets to stream node state, tokens/logs, and decision traces.  
- Workflow definitions:
  - Canonical JSON format; YAML view for editing and export.  
  - Export: JSON + YAML; shareable link; one-click fork.  

---

### 4. Feature Checklist (Status To Be Updated)

Use this section as a **living checklist**. Every time something is implemented, update `Status`, `Notes`, and optionally link to code modules.

#### 4.1 Frontend

- [ ] Auth flow (Firebase integration, role-aware UI).  
- [ ] Workspace selector (orgs, roles).  
- [ ] Canvas with @xyflow/react:
  - [ ] Node palette.  
  - [ ] Connection creation and validation (DAG).  
  - [ ] Mini-map and zoom.  
- [ ] Node configuration panel:
  - [ ] Trigger node config.  
  - [ ] AI node config (Groq model, prompts, mapping).  
  - [ ] Tool node config (HTTP/Notion/Slack/Gmail/GitHub).  
  - [ ] Condition node config.  
  - [ ] Loop node config.  
  - [ ] Human Gate node config.  
  - [ ] SubWorkflow node config.  
  - [ ] Output node config.  
- [ ] Run history & execution console.  
- [ ] GraphQL subscription integration for live traces.  
- [ ] Template gallery page (templates preview + create-from-template).  
- [ ] Export/import UI (JSON/YAML + shareable link + fork).  

#### 4.2 Backend

- [ ] GraphQL schema design (workflows, runs, nodes, templates, auth context).  
- [ ] Firebase token verification middleware.  
- [ ] Orchestrator:
  - [ ] Workflow CRUD.  
  - [ ] DAG validation.  
  - [ ] Run creation and management.  
- [ ] FSM Runtime:
  - [ ] Execution graph builder.  
  - [ ] Node executor interface.  
  - [ ] Retry + fallback logic.  
  - [ ] Pause/resume state storage.  
- [ ] Node executors:
  - [ ] Trigger nodes (cron, webhook, Gmail, RSS, manual).  
  - [ ] AI nodes (Groq).  
  - [ ] Tool nodes (HTTP, Notion, Slack, Gmail, GitHub).  
  - [ ] Condition, Loop, Human Gate, SubWorkflow, Output.  
- [ ] BullMQ integration for async node tasks.  
- [ ] Postgres schema with Prisma models (users, orgs, workflows, runs, node executions, templates, memories).  
- [ ] pgvector integration for memory search.  
- [ ] Redis integration for active runs and pub/sub.  
- [ ] GraphQL subscriptions (WebSocket server + Redis pub/sub).  

#### 4.3 Templates

- [ ] PSG Internship Hunter template.  
- [ ] Research Automation template.  
- [ ] Lead Qualification template.  
- [ ] Content Pipeline template.  

Each template should have:
- Example workflow JSON/YAML.  
- Default prompts and sample node configurations.  

---

### 5. Implementation Conventions

- Language: TypeScript for both frontend and backend services.  
- Code style: Prettier + ESLint, strict TypeScript wherever possible.  
- Environment separation:
  - `dev` (Docker Compose) vs `prod` (AWS).  
- Sensitive config:
  - All API keys (Groq, Gmail/Notion/Slack etc.) via env vars, never hard-coded.  

---

### 6. How Claude Should Use This File

- Treat this file as **source of truth** for project context and decisions.  
- Before implementing a new feature, check:
  - Is it already defined here?  
  - Does it align with the design decisions and tech stack listed?  
- After implementing:
  - Update affected checklist items to `[x]`.  
  - Add short notes under a new `Changelog` section (create it when first needed) describing:
    - Date, feature, high-level modules touched.  

Example Changelog entry (template):

```markdown
### 2026-03-22
- Implemented basic workflow CRUD in Orchestrator (GraphQL).
- Added Prisma models for Workflow and Run.
- Integrated Firebase Auth context into GraphQL resolvers.