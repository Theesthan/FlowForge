# FSM Node Executor Builder

When asked to build a new FSM node executor, follow this exact pattern:

## Steps
1. Create the file at `services/runtime/src/executors/<NodeType>Executor.ts`
2. Implement the `NodeExecutor` interface:

```typescript
import { NodeExecutor, ExecutionContext, NodeResult } from '../types';

export class <NodeType>Executor implements NodeExecutor {
  async execute(context: ExecutionContext): Promise<NodeResult> {
    const { node, inputs, runId } = context;

    try {
      // 1. Validate required config fields
      // 2. Execute the node logic
      // 3. Return typed output
      return {
        status: 'SUCCESS',
        output: {},
        logs: []
      };
    } catch (error) {
      return {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
        logs: []
      };
    }
  }
}
Register the executor in:

services/runtime/src/executors/index.ts

Add the node type to:

packages/types/src/nodes.ts

Write a unit test in:

services/runtime/src/executors/__tests__/<NodeType>Executor.test.ts

Node Lifecycle
PENDING → RUNNING → SUCCESS | FAILED | FALLBACK

Max 3 retries with exponential backoff.

On repeated failure → use fallback output if configured.

Emit state via Redis pub/sub after every transition.