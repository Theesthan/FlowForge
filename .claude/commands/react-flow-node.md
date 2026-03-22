
***

### 4) `.claude/commands/react-flow-node.md`

```markdown
# React Flow Canvas Node Builder

When asked to build a new canvas node component, follow this pattern.

## Steps

1. Create at:

`apps/web/src/components/canvas/nodes/<NodeType>Node.tsx`

2. Use this structure:

```typescript
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface <NodeType>NodeData {
  label: string;
  config: <NodeType>Config;
  status?: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'FALLBACK';
}

export const <NodeType>Node = memo(({ data, selected }: NodeProps<<NodeType>NodeData>) => {
  return (
    <div
      className={cn(
        'bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-xl min-w-[200px]',
        selected && 'border-white/30',
        data.status === 'RUNNING' && 'animate-pulse border-cyan-500',
        data.status === 'FAILED' && 'border-red-500',
        data.status === 'SUCCESS' && 'border-green-500',
        data.status === 'FALLBACK' && 'border-yellow-500'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-<color>-500" />
        <span className="text-white text-sm font-medium font-[Geist_Sans]">
          {data.label}
        </span>
      </div>

      {/* Content */}

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-white/20 !border-white/10"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-white/20 !border-white/10"
      />
    </div>
  );
});

<NodeType>Node.displayName = '<NodeType>Node';
Register in:

apps/web/src/components/canvas/nodeTypes.ts

Add to the node palette in:

apps/web/src/components/canvas/NodePalette.tsx

Add config panel in:

apps/web/src/components/canvas/panels/<NodeType>Panel.tsx

Node Header Dot Colors
Trigger → bg-green-500

AI → bg-purple-500

Tool → bg-blue-500

Condition → bg-yellow-500

Loop → bg-orange-500

HumanGate → bg-red-500

SubWorkflow → bg-gray-500

Output → bg-white