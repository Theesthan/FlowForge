export interface WorkflowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  nodeCount: number
  definition: WorkflowDefinition
}

export const TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'psg-internship-hunter',
    name: 'PSG Internship Hunter',
    description: 'Monitor internship emails, extract skills, generate prep roadmap, and notify via Notion + Slack.',
    category: 'Career',
    icon: '🎯',
    nodeCount: 9,
    definition: {
      nodes: [
        { id: 'trigger-1', type: 'TriggerNode', position: { x: 100, y: 200 }, data: { label: 'Daily Cron', triggerType: 'cron', cronExpression: '0 9 * * *' } },
        { id: 'tool-gmail', type: 'ToolNode', position: { x: 300, y: 200 }, data: { label: 'Gmail Poll', toolType: 'gmail', filter: 'subject:internship' } },
        { id: 'ai-extract', type: 'AINode', position: { x: 500, y: 200 }, data: { label: 'Extract Skills', systemPrompt: 'Extract job skills, keywords, role type, and location from the email.', model: 'llama-3.3-70b-versatile' } },
        { id: 'tool-search', type: 'ToolNode', position: { x: 700, y: 200 }, data: { label: 'Search Profiles', toolType: 'http', url: 'https://api.serper.dev/search' } },
        { id: 'ai-score', type: 'AINode', position: { x: 900, y: 200 }, data: { label: 'Score Fit %', systemPrompt: 'Score the fit percentage for each profile and summarize top matches.', model: 'llama-3.3-70b-versatile' } },
        { id: 'ai-plan', type: 'AINode', position: { x: 1100, y: 200 }, data: { label: 'Generate Roadmap', systemPrompt: 'Generate a DSA+ML prep roadmap based on the job requirements.', model: 'llama-3.3-70b-versatile' } },
        { id: 'tool-github', type: 'ToolNode', position: { x: 1300, y: 200 }, data: { label: 'GitHub Analysis', toolType: 'http', url: 'https://api.github.com/repos' } },
        { id: 'ai-validate', type: 'AINode', position: { x: 1500, y: 200 }, data: { label: 'Validate Roadmap', systemPrompt: 'Validate if roadmap matches current skills. Suggest adjustments.', model: 'llama-3.3-70b-versatile' } },
        { id: 'output-1', type: 'OutputNode', position: { x: 1700, y: 200 }, data: { label: 'Notify All', outputType: 'multi', channels: ['email', 'notion', 'slack'] } },
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'tool-gmail' },
        { id: 'e2', source: 'tool-gmail', target: 'ai-extract' },
        { id: 'e3', source: 'ai-extract', target: 'tool-search' },
        { id: 'e4', source: 'tool-search', target: 'ai-score' },
        { id: 'e5', source: 'ai-score', target: 'ai-plan' },
        { id: 'e6', source: 'ai-plan', target: 'tool-github' },
        { id: 'e7', source: 'tool-github', target: 'ai-validate' },
        { id: 'e8', source: 'ai-validate', target: 'output-1' },
      ],
    },
  },
  {
    id: 'research-automation',
    name: 'Research Automation',
    description: 'Fetch arXiv papers, summarize with AI, classify by topic, and post to Slack.',
    category: 'Research',
    icon: '🔬',
    nodeCount: 5,
    definition: {
      nodes: [
        { id: 'trigger-1', type: 'TriggerNode', position: { x: 100, y: 200 }, data: { label: 'RSS Feed', triggerType: 'rss', url: 'https://arxiv.org/rss/cs.AI' } },
        { id: 'tool-fetch', type: 'ToolNode', position: { x: 300, y: 200 }, data: { label: 'Fetch Paper', toolType: 'http', url: 'https://arxiv.org/abs' } },
        { id: 'ai-summarize', type: 'AINode', position: { x: 500, y: 200 }, data: { label: 'Summarize', systemPrompt: 'Summarize this research paper in 3 bullet points for a developer audience.', model: 'llama-3.3-70b-versatile' } },
        { id: 'ai-classify', type: 'AINode', position: { x: 700, y: 200 }, data: { label: 'Classify Topic', systemPrompt: 'Classify this paper into one of: LLM, CV, Robotics, Systems, Theory.', model: 'llama-3.3-70b-versatile' } },
        { id: 'output-1', type: 'OutputNode', position: { x: 900, y: 200 }, data: { label: 'Post to Slack', outputType: 'slack', channel: '#research' } },
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'tool-fetch' },
        { id: 'e2', source: 'tool-fetch', target: 'ai-summarize' },
        { id: 'e3', source: 'ai-summarize', target: 'ai-classify' },
        { id: 'e4', source: 'ai-classify', target: 'output-1' },
      ],
    },
  },
  {
    id: 'lead-qualification',
    name: 'Lead Qualification',
    description: 'Parse form submissions, AI-score intent and fit, route by threshold to CRM and Slack.',
    category: 'Sales',
    icon: '📊',
    nodeCount: 6,
    definition: {
      nodes: [
        { id: 'trigger-1', type: 'TriggerNode', position: { x: 100, y: 200 }, data: { label: 'Webhook', triggerType: 'webhook', path: '/leads' } },
        { id: 'ai-parse', type: 'AINode', position: { x: 300, y: 200 }, data: { label: 'Parse Lead', systemPrompt: 'Parse the form submission and extract name, company, intent, and budget.', model: 'llama-3.3-70b-versatile' } },
        { id: 'ai-score', type: 'AINode', position: { x: 500, y: 200 }, data: { label: 'Score Lead', systemPrompt: 'Score lead intent and fit on a scale 0-1. Return JSON: { score, reasoning }.', model: 'llama-3.3-70b-versatile' } },
        { id: 'condition-1', type: 'ConditionNode', position: { x: 700, y: 200 }, data: { label: 'Score > 0.7?', expression: 'score > 0.7' } },
        { id: 'tool-crm', type: 'ToolNode', position: { x: 900, y: 100 }, data: { label: 'Update CRM', toolType: 'http', url: 'https://api.hubspot.com/contacts' } },
        { id: 'output-1', type: 'OutputNode', position: { x: 900, y: 300 }, data: { label: 'Slack Notify', outputType: 'slack', channel: '#leads' } },
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'ai-parse' },
        { id: 'e2', source: 'ai-parse', target: 'ai-score' },
        { id: 'e3', source: 'ai-score', target: 'condition-1' },
        { id: 'e4', source: 'condition-1', target: 'tool-crm', sourceHandle: 'true' },
        { id: 'e5', source: 'condition-1', target: 'output-1', sourceHandle: 'false' },
      ],
    },
  },
  {
    id: 'content-pipeline',
    name: 'Content Pipeline',
    description: 'Monitor RSS, classify content, AI-rewrite for audience, and schedule LinkedIn posts.',
    category: 'Marketing',
    icon: '✍️',
    nodeCount: 5,
    definition: {
      nodes: [
        { id: 'trigger-1', type: 'TriggerNode', position: { x: 100, y: 200 }, data: { label: 'RSS Feed', triggerType: 'rss', url: 'https://feeds.feedburner.com/techcrunch' } },
        { id: 'ai-classify', type: 'AINode', position: { x: 300, y: 200 }, data: { label: 'Classify Content', systemPrompt: 'Classify this article as: relevant or not_relevant for a developer audience.', model: 'llama-3.3-70b-versatile' } },
        { id: 'condition-1', type: 'ConditionNode', position: { x: 500, y: 200 }, data: { label: 'Relevant?', expression: 'classification === "relevant"' } },
        { id: 'ai-rewrite', type: 'AINode', position: { x: 700, y: 100 }, data: { label: 'Rewrite for LinkedIn', systemPrompt: 'Rewrite this article as a punchy 3-paragraph LinkedIn post for developers.', model: 'llama-3.3-70b-versatile' } },
        { id: 'output-1', type: 'OutputNode', position: { x: 900, y: 100 }, data: { label: 'Post to LinkedIn', outputType: 'http', url: 'https://api.linkedin.com/v2/shares' } },
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'ai-classify' },
        { id: 'e2', source: 'ai-classify', target: 'condition-1' },
        { id: 'e3', source: 'condition-1', target: 'ai-rewrite', sourceHandle: 'true' },
        { id: 'e4', source: 'ai-rewrite', target: 'output-1' },
      ],
    },
  },
]
