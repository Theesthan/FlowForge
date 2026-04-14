# FlowForge — Test Workflows

These JSON files can be imported directly into the canvas via the **Upload (↑) button** in the top bar.

## How to test

1. Start the stack: `docker compose up` from `infrastructure/`
2. Open the canvas for any workflow
3. Click the **↑ Import** button in the top bar
4. Select one of the JSON files below
5. Click **Run** (▶)
6. Watch the Execution Console at the bottom for live logs
7. Check node border colors: cyan = RUNNING, green = SUCCESS, red = FAILED, yellow = FALLBACK

## Test cases

| File | Tests | Requires |
|------|-------|----------|
| `01-trigger-manual.json` | TriggerNode + OutputNode basic run | Nothing |
| `02-ai-node.json` | Groq LLM streaming + console output | `GROQ_API_KEY` |
| `03-tool-node-http.json` | ToolNode GET request to public API | Nothing |
| `04-condition-node-true-branch.json` | ConditionNode routing — true path only | Nothing |
| `05-loop-node.json` | LoopNode list slicing + pass-through | Nothing |
| `06-human-gate-node.json` | HumanGate pause → approve → resume | `GROQ_API_KEY` |
| `07-ai-condition-fanout.json` | Full: Trigger→Tool→AI→Condition→2×Output | `GROQ_API_KEY` |
| `08-fallback-retry.json` | Retry exhaustion → FALLBACK → continue | Nothing |

## Expected behavior per node

### TriggerNode
- Canvas: no incoming connections, green dot
- Executor: passes through input + adds `triggerTime`
- Status: PENDING → RUNNING → SUCCESS in ~100ms

### AINode
- Canvas: purple dot
- Executor: streams tokens to Execution Console in real time
- Status: RUNNING while streaming, SUCCESS when done

### ToolNode
- Canvas: blue dot
- Executor: HTTP call, output includes `{ status, data, url, method }`
- Status: FAILED if non-2xx, SUCCESS if ok

### ConditionNode
- Canvas: yellow dot, TWO output handles (true / false)
- Connect the `true` handle to one node, `false` handle to another
- Only the matching branch executes

### LoopNode
- Canvas: orange dot
- Executor: resolves `iterateOver` dot-path from input to an array, slices to `maxIterations`
- Output: `{ items, totalItems, iterationsPlanned, currentIndex }`
- Note: loop does not re-execute downstream per-item (it passes the sliced array)

### HumanGateNode
- Canvas: red dot
- Run enters PAUSED state → dialog appears in UI
- Click Approve (or edit + approve) → run resumes from next node
- Click Reject → run stays PAUSED (call resumeRun with `{ decision: 'rejected' }` to cancel)

### SubWorkflowNode
- Canvas: gray dot
- Dispatches to Orchestrator's `/runs` endpoint with the referenced workflow ID
- Polls Postgres for completion (2s interval, 10min timeout)

### OutputNode
- Canvas: white dot
- `complete`: logs to console
- `slack`: posts via SLACK_WEBHOOK_URL or SLACK_BOT_TOKEN
- `email`: sends via SMTP_* env vars
- `notion`: creates page via NOTION_API_KEY
- `webhook`: HTTP POST to configured URL
