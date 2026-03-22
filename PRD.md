### 1. Overview

FlowForge is a **no-code autonomous AI agent workflow builder** that lets users visually design, execute, and monitor complex multi-agent workflows, combining a React-based canvas with a custom FSM runtime running on Node.js. [file:1]  
Target user is a solo developer/student initially, but the system is architected as a multi-tenant SaaS with OAuth2-style auth via Firebase, RBAC, and team isolation for future expansion. [file:1]

---

### 2. Goals & Non‑Goals

- Build a visual workflow canvas where users compose AI workflows using drag-and-drop nodes (Trigger, AI, Tool, Condition, Loop, Human Gate, SubWorkflow). [file:1]  
- Implement a DAG-based custom FSM runtime with robust retry + fallback logic, pause/resume, and real-time execution traces over GraphQL subscriptions. [file:1]

- Support Groq (llama-3.3-70b-versatile) for LLM calls, with infrastructure for adding other providers later. [file:1]  
- Deliver a working demo deployment on AWS (EC2 + RDS Postgres with pgvector) plus Docker Compose for local development, following the tech stack in the package work file. [file:1]

Non-goals v1:
- No full billing/subscription system.  
- No community marketplace with submissions/moderation (only internal template gallery for now). [file:1]

---

### 3. Personas & Use Cases

**Persona 1: Student/Developer (Primary)**  
- Wants to automate internship/job workflows like monitoring mails, extracting skills, generating prep roadmaps, and syncing to tools (Notion/Slack/email).  
- Comfortable with JSON/YAML and developer tools, but prefers a visual canvas for experimentation. [file:1]

**Persona 2: Small Tech Team (Future‑ready)**  
- Wants internal research automation, lead qualification, and content pipelines without writing full backend orchestration code. [file:1]  
- Needs RBAC, audit trails, and multi-tenant isolation for teams. [file:1]

---

### 4. Core User Flows

#### 4.1 Workspace & Auth

- User signs in via Firebase Auth using Google OAuth or Email/Password.  
- Each user belongs to one or more “organizations” / workspaces.  
- Role per workspace: Owner, Editor, Viewer (RBAC).  
  - Owner: manage org, users, billing (future), delete workflows.  
  - Editor: create/edit workflows, run, pause, resume.  
  - Viewer: view workflows and execution traces, cannot modify.  

#### 4.2 Create Workflow

1. User clicks “New Workflow” → chooses:
   - Blank workflow, or  
   - Template from gallery (Internship Hunter, Research, Lead Qualification, Content Pipeline).  
2. Visual canvas opens (React + @xyflow/react) with:
   - Sidebar palette of nodes.  
   - Properties panel for selected node.  
   - Mini-map and zoom controls.  
3. User drags nodes, connects edges to form a DAG; cycles are blocked at validation time.  

#### 4.3 Configure Nodes

Each node type has a configuration panel:

- **Trigger Node**
  - Types: Cron, Webhook, Email/Gmail poll (for Internship Hunter), RSS, Manual trigger.  
  - For PSG Internship Hunter template: both daily cron and manual run are supported triggers.  

- **AI Node**
  - Model provider: Groq.  
  - Model: `llama-3.3-70b-versatile`.  
  - Fields: system prompt, input mapping (from previous node outputs), output schema (JSON schema / free text).  

- **Tool Node**
  - HTTP API call configuration (URL, method, headers, body templating).  
  - Preconfigured integrations: Gmail (read), LinkedIn/Serper-like search, Naukri-like search (abstracted as HTTP tools), Notion API, Slack API, GitHub API.  
  - Ability to map previous node outputs into request body using simple templating.  

- **Condition Node**
  - Expression builder (e.g., `score > 0.8`, `status == "success"`).  
  - Outputs: true path, false path.  

- **Loop Node**
  - Iterate over a list (e.g., list of leads, list of search results).  
  - Max iterations and optional early break condition.  

- **Human Gate Node**
  - Pauses workflow and surfaces context + AI recommendation.  
  - User can approve/reject/edit result, then resume workflow from this node.  

- **SubWorkflow Node**
  - References another workflow as a reusable subroutine.  
  - Input mapping & output mapping defined in configuration.  

- **Output Node**
  - Terminal node that writes final results to external channels (email, Notion, Slack, webhooks) or marks workflow as complete.  

#### 4.4 Execution & Monitoring

- User clicks “Run” (or cron triggers) to start workflow instance.  
- Orchestrator service converts the workflow definition (JSON/YAML) into an execution graph for the FSM runtime.  
- FSM executes nodes based on DAG topology:
  - Supports parallel branches (fan out) and join/merge nodes (fan in).  
- Every significant state change is broadcast via GraphQL subscriptions to the frontend:
  - Node started, node succeeded, node failed, retries, fallbacks, human-gate wait, resume.  

Users can:
- Pause workflow mid-execution and resume from the exact node for any running instance.  
- Inspect decision traces, inputs/outputs per node, and logs.  

---

### 5. Example Templates

#### 5.1 PSG Internship Hunter

**Goal:** Continuously monitor JPMorgan (and similar) internship emails, extract skills, research matching profiles, generate a prep roadmap, and notify via Email + Notion + Slack.

Nodes (typical layout):

- Trigger:  
  - Cron (daily at fixed time) + Manual trigger option.  
  - Gmail poll node: “new mails with subject/body matching filters”.  

- Extract (AI Node):  
  - Parse job description → extract skills, keywords, role type, location.  

- Research (Tool + AI combination):  
  - Tool nodes calling search APIs (LinkedIn-style, Naukri-style, or general search) to find similar profiles.  
  - AI node to score “fit percentage” and summarize top matches.  

- Generate Plan (AI Node):  
  - Uses job requirements + your GitHub/DSA/ML context (from pgvector memory) to generate DSA/ML roadmap and project suggestions.  

- Validate (Tool + AI Node):  
  - Tool node to fetch GitHub repos and perform simple AST/metadata analysis (language breakdown, stars, topics).  
  - AI node validates if roadmap matches your current skills, suggests adjustments.  

- Notify (Output Nodes):  
  - Email notification with summary and roadmap.  
  - Notion page creation/update (Notion API) with full roadmap.  
  - Slack message to configured channel with concise summary and key metrics.  

---

#### 5.2 Research Automation

- Trigger: Cron or RSS new item.  
- Nodes:  
  - Fetch arXiv papers → AI summarize → classify by topic → post to Slack channel.  

#### 5.3 Lead Qualification

- Trigger: Webhook for new form submission or CRM event.  
- Nodes:  
  - Parse form → AI score intent/fit → Condition node for thresholds → CRM update and Slack/email notification.  

#### 5.4 Content Pipeline

- Trigger: RSS or webhook.  
- Nodes:  
  - Classify content → AI rewrite/shorten → schedule post to LinkedIn (via API tool) or other channels.  

---

### 6. Architecture

#### 6.1 Frontend

- Tech: React + TypeScript + TailwindCSS + @xyflow/react (React Flow). [file:1]  
- State management: Apollo Client for GraphQL queries & subscriptions; local stores for canvas state. [file:1]

Key components:
- Canvas view (workflow editor).  
- Node palette + configuration drawer.  
- Execution console (logs, node IO, run history).  
- Template gallery page.  

#### 6.2 Backend

Microservices (Node.js + Express + GraphQL federation style): [file:1]

1. **API Gateway / GraphQL Server**
   - Exposes GraphQL API (queries, mutations, subscriptions).  
   - Handles Firebase Auth token validation and passes user/org/role context downstream.  

2. **Orchestrator Service**
   - Stores/retrieves workflow definitions from PostgreSQL.  
   - Validates DAG (no cycles, required fields).  
   - Converts workflow definitions (JSON/YAML) to execution graphs.  
   - Creates “run” records and nodes’ execution state entries.  

3. **Agent Runtime / FSM Engine**
   - Custom FSM that executes nodes according to DAG topology.  
   - Per-node execution lifecycle: PENDING → RUNNING → SUCCESS/FAILED/FALLBACK.  
   - Node failure policy:
     - Retry up to 3 times with exponential backoff.  
     - On repeated failure, use a configured fallback:
       - Default output (e.g., “no results” or default object).  
     - Continue workflow even after fallback, unless marked as “hard failure” in node config.  
   - Handles pause/resume:
     - Stores current state and node pointers in Redis and Postgres.  
     - On resume, reloads state and continues from the paused node.  

4. **Queue Worker**
   - BullMQ (Redis-backed) for async and long-running node tasks.  
   - Enables horizontal scaling of node execution.  

#### 6.3 Data Layer

- PostgreSQL:
  - Tables for users, organizations, memberships, roles.  
  - Workflows, workflow versions, runs, node executions, templates.  
- pgvector:
  - For agent memory and context: e.g., store past job descriptions, your GitHub metadata, and roadmap snippets.  
- Redis:
  - For active runs, locks, pub/sub for GraphQL subscriptions integration, and caching.  

#### 6.4 Auth & RBAC

- Firebase Auth for identity:
  - Sign-in methods: Google OAuth + Email/Password.  
- Roles (per organization): Owner, Editor, Viewer.  
- Backend enforces:
  - Only Owners can manage org membership.  
  - Editors can create/update workflows; Viewers only read.  

---

### 7. DevOps & Deployment

- Local dev: Docker Compose running:
  - Frontend, API Gateway, Orchestrator, Runtime worker, Postgres+pgvector, Redis, pgAdmin (optional).  
- Production demo: AWS deployment:
  - EC2 for Node.js services with Docker. [file:1]  
  - RDS PostgreSQL with pgvector extension. [file:1]  
  - S3 + CloudFront for static frontend hosting (optional) or serve from EC2. [file:1]  

- IaC: Terraform to provision AWS resources (EC2, RDS, networking). [file:1]  
- CI/CD: GitHub Actions to run tests, build Docker images, and deploy to AWS. [file:1]  

- Monitoring:
  - Prometheus + Grafana for metrics. [file:1]  
  - OpenTelemetry + Jaeger traces for node execution and agent decisions. [file:1]  

---

### 8. JSON/YAML Workflow Definition

- Canonical storage format: JSON.  
- Editable alternative: YAML view in UI (switch between canvas, JSON, YAML).  
- Export/import:
  - Export workflow as JSON or YAML file.  
  - Shareable link support with one-click “Fork” to copy into own workspace.  
