# UI/UX Design Document: FlowForge

This document outlines the UI/UX architecture, component mapping, and styling guidelines for FlowForge. It serves as the visual implementation guide for Claude to build the frontend alongside the `PRD.md` and `Agent.md`.

## 1. Global Design System & Theming

FlowForge is a premium, developer-focused application utilizing a strict **Pure Dark Mode** theme. The aesthetic is heavily inspired by modern AI dev tools (like Vercel, LangChain, or Cursor), relying on deep blacks, subtle gradients, and high-performance WebGL/canvas animations.

### 1.1 Color Palette
- **Background Base:** Deep Black (`#000000` to `#030303`)
- **Card/Surface:** Dark Gray/Translucent (`rgba(255,255,255,0.03)` to `rgba(255,255,255,0.08)`) with `backdrop-blur`
- **Text Primary:** Pure White (`#ffffff`)
- **Text Secondary:** Slate/Gray (`text-white/60` or `text-gray-400`)
- **Accents/Glows:** Indigo (`#6366f1`), Cyan (`#06b6d4`), and Rose (`#f43f5e`)
- **Borders:** Subtle white/gray (`border-white/[0.08]`)

### 1.2 Global Background (App Canvas & Dashboard)
- **Component:** `DotOrbit` and `MeshGradient` (from `shader.md`)
- **Implementation:** The entire authenticated app (dashboard, template gallery, and React Flow canvas) will sit on top of a highly subdued version of the `DotOrbit` or `MeshGradient` background. 
- **Configuration:** 
  - `MeshGradient` colors: `["#000000", "#0a0a1a", "#050510", "#000000"]` (extremely dark to not distract from the canvas).
  - Speed should be set very low (`speed={0.2}`).

### 1.3 Typography
- **Sans-serif:** `Geist Sans` (or Inter as fallback) for UI elements, buttons, and node titles.
- **Monospace:** `Geist Mono` (or JetBrains Mono) for JSON, YAML, code blocks, and execution logs.

---

## 2. UI Component Mapping & Usage

The specific components provided in the Markdown files will be utilized in the following structure:

### 2.1 Landing Page Architecture
The public-facing landing page will be highly animated to sell the "premium enterprise" feel.

**A. Hero Section (`background.md`)**
- **Component:** `HeroGeometric`
- **Location:** Very top of the landing page.
- **Customization:** 
  - `badge`: "FlowForge AI"
  - `title1`: "Autonomous Agent"
  - `title2`: "Workflows, Visualized."
  - The animated `ElegantShape` elements will use the Indigo, Cyan, and Rose gradients to create a floating, glowing aesthetic.

**B. Value Proposition Scroll Reveal (`textreveal.md`)**
- **Component:** `TextRevealByWord`
- **Location:** Immediately below the Hero section.
- **Customization:** 
  - `text="FlowForge transforms static automations into intelligent, adaptive systems where AI agents collaborate autonomously."`
  - Requires `h-[200vh]` to allow the user to smoothly scroll and read the text as it turns from `opacity-30` to `opacity-100`.

**C. Feature Showcase (Optional Integration of `hero.md`)**
- **Component:** Features from `hero-odyssey.tsx` (Specifically the `FeatureItem` glowing dots and text).
- **Location:** Below the text reveal, listing the tech stack or core features (e.g., "Custom FSM", "Groq LLMs", "PostgreSQL Vector").

### 2.2 Global App Navigation & Auth
**A. User Profile & Quick Actions (`floatingactionmenu.md`)**
- **Component:** `FloatingActionMenu`
- **Location:** `fixed bottom-8 right-8` across all authenticated views (Dashboard, Template Gallery, Canvas).
- **Customization:** 
  - Used for User Profile / Auth actions.
  - Options array:
    1. **Workspace:** Switch between multi-tenant orgs (RBAC).
    2. **Settings:** Open user/org configuration.
    3. **Logout:** Trigger Firebase sign-out.
  - Icon: User avatar or standard Menu icon.

### 2.3 Interactive Elements
**A. Primary Call-to-Actions (`hoverborder.md`)**
- **Component:** `HoverBorderGradient`
- **Location:** Everywhere a primary action is required.
  - Landing Page: "Start Building Free" / "Sign In"
  - Dashboard: "Create New Workflow"
  - Canvas: "Run Workflow" (Play button) and "Deploy"
- **Customization:** 
  - Container should have `backdrop-blur-sm` and `bg-black/40`.
  - The moving gradient will use the default `movingMap` (white/gray radial gradient) for a sleek, metallic button feel.

---

## 3. Core App Views (Authenticated)

### 3.1 Workspace Dashboard & Template Gallery
- **Layout:** Standard grid layout with a sidebar.
- **Background:** `DotOrbit` (`shader.md`) acting as a subtle starry backdrop.
- **Template Gallery:** Cards displaying "PSG Internship Hunter", "Research Automation", etc.
- **Hover Effects:** Cards should use the `group-hover:opacity-100` pattern (seen in `hero.md`'s `FeatureItem`) to reveal glowing borders when hovered.

### 3.2 The Canvas (React Flow / @xyflow/react)
- **Base UI:** Takes up 100% of the viewport height (minus a minimal top header).
- **Background:** Transparent React Flow background, allowing the `MeshGradient` to show through. React Flow's `Background` component can be set to `variant="dots"` with very low opacity (`#ffffff20`).
- **Node Design:**
  - Nodes must look like premium cards (dark background, border, blur).
  - CSS: `bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl`.
  - Headers of nodes should have a subtle colored dot indicating the type (Trigger = Green, AI = Purple, Tool = Blue).
- **Controls:**
  - Zoom/Pan controls at the bottom left.
  - `HoverBorderGradient` button for "Run / Pause" at the top right.
  - `FloatingActionMenu` for Profile at the bottom right.

### 3.3 Live Execution & GraphQL Subscriptions UI
- **Execution Console:** A drawer or resizable panel at the bottom or right side of the canvas.
- **Visual Feedback:** 
  - When a node is `RUNNING`, apply a subtle CSS pulse animation to its border (e.g., `animate-pulse border-cyan-500`).
  - When a node `FAILS` (triggering the FSM retry logic), flash the border red.
  - When a node `SUCCEEDS`, flash green and return to default gray.
- **Logs:** Monospace text streaming in real-time, matching the dark IDE aesthetic.

---

## 4. Implementation Guidelines for Claude

When building the UI components, Claude must adhere to the following rules:

1. **Shadcn UI Base:** Initialize all basic components (inputs, dialogs, dropdowns) using Shadcn UI. Apply the dark theme variables provided in `shader.md` to `globals.css` to ensure Shadcn components match the Pure Dark Mode aesthetic.
2. **Framer Motion:** heavily rely on `framer-motion` for transitions. Dialogs, menus, and the execution console should slide/fade in, not snap instantly.
3. **Tailwind Merging:** Use `cn()` (clsx + tailwind-merge) utility for all custom components to allow easy prop overriding.
4. **WebGL Performance:** Because `shader.md` (Three.js/Fiber) is used as a global background, ensure it is wrapped in a React `memo` or placed at the absolute root of the DOM tree so it does not re-render when React Flow nodes update.
5. **Responsive Design:** While the canvas is primarily a desktop experience, the landing page (`HeroGeometric` + `TextRevealByWord`) must be perfectly responsive on mobile devices using standard Tailwind `sm:`, `md:`, `lg:` breakpoints.
