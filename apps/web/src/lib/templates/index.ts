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
        { id: 'tool-gmail', type: 'ToolNode', position: { x: 300, y: 200 }, data: { label: 'Gmail Poll', toolType: 'gmail', filter: 'subject:internship', fallbackOutput: { emails: [], message: 'Gmail OAuth not configured — using stub data', stub: true, subject: 'Software Engineering Internship at Acme Corp', body: 'We are looking for interns skilled in Python, ML, and system design.' } } },
        { id: 'ai-extract', type: 'AINode', position: { x: 500, y: 200 }, data: { label: 'Extract Skills', systemPrompt: 'Extract job skills, keywords, role type, and location from the email.', model: 'llama-3.3-70b-versatile' } },
        { id: 'tool-search', type: 'ToolNode', position: { x: 700, y: 200 }, data: { label: 'Search Profiles', toolType: 'http', url: 'https://api.serper.dev/search', fallbackOutput: { results: [], message: 'Serper API key not configured — skipped profile search' } } },
        { id: 'ai-score', type: 'AINode', position: { x: 900, y: 200 }, data: { label: 'Score Fit %', systemPrompt: 'Score the fit percentage for each profile and summarize top matches.', model: 'llama-3.3-70b-versatile' } },
        { id: 'ai-plan', type: 'AINode', position: { x: 1100, y: 200 }, data: { label: 'Generate Roadmap', systemPrompt: 'Generate a DSA+ML prep roadmap based on the job requirements.', model: 'llama-3.3-70b-versatile' } },
        { id: 'tool-github', type: 'ToolNode', position: { x: 1300, y: 200 }, data: { label: 'GitHub Analysis', toolType: 'http', url: 'https://api.github.com/users/Theesthan/repos', method: 'GET', fallbackOutput: { repos: [], message: 'GitHub API rate limited or unavailable' } } },
        { id: 'ai-validate', type: 'AINode', position: { x: 1500, y: 200 }, data: { label: 'Validate Roadmap', systemPrompt: 'Validate if roadmap matches current skills. Suggest adjustments.', model: 'llama-3.3-70b-versatile' } },
        { id: 'output-1', type: 'OutputNode', position: { x: 1700, y: 200 }, data: { label: 'Notify All', outputType: 'complete', outputTargets: ['complete'] } },
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
        { id: 'trigger-1', type: 'TriggerNode', position: { x: 100, y: 200 }, data: { label: 'RSS Feed', triggerType: 'rss', rssUrl: 'https://arxiv.org/rss/cs.AI', url: 'https://arxiv.org/rss/cs.AI' } },
        { id: 'tool-fetch', type: 'ToolNode', position: { x: 300, y: 200 }, data: { label: 'Fetch Paper', toolType: 'http', url: '{{item.link}}', method: 'GET', fallbackOutput: { skipped: true, reason: 'Could not fetch paper page' } } },
        { id: 'ai-summarize', type: 'AINode', position: { x: 500, y: 200 }, data: { label: 'Summarize', systemPrompt: 'You receive data from an arXiv RSS feed item and optionally a fetched page. Summarize the research paper in exactly 3 concise bullet points for a developer audience. Focus on: what problem is solved, how it is solved, and the key result.', model: 'llama-3.3-70b-versatile' } },
        { id: 'ai-classify', type: 'AINode', position: { x: 700, y: 200 }, data: { label: 'Classify Topic', systemPrompt: 'Classify this research paper into exactly one of these categories: LLM, CV, Robotics, Systems, Theory. Return JSON: {"classification": "<category>", "confidence": 0.0-1.0}', model: 'llama-3.3-70b-versatile' } },
        { id: 'output-1', type: 'OutputNode', position: { x: 900, y: 200 }, data: { label: 'Log Output', outputType: 'complete', outputTargets: ['complete'] } },
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
        { id: 'trigger-1', type: 'TriggerNode', position: { x: 100, y: 200 }, data: { label: 'Webhook', triggerType: 'webhook', webhookPath: '/leads' } },
        { id: 'ai-parse', type: 'AINode', position: { x: 300, y: 200 }, data: { label: 'Parse Lead', systemPrompt: 'Parse the input and extract lead details. Return JSON: {"name": "...", "company": "...", "intent": "...", "budget": "..."}', model: 'llama-3.3-70b-versatile' } },
        { id: 'ai-score', type: 'AINode', position: { x: 500, y: 200 }, data: { label: 'Score Lead', systemPrompt: 'Score this lead\'s intent and fit on a scale 0.0 to 1.0. Return only valid JSON with no markdown: {"score": 0.0, "reasoning": "..."}', model: 'llama-3.3-70b-versatile' } },
        { id: 'condition-1', type: 'ConditionNode', position: { x: 700, y: 200 }, data: { label: 'Score > 0.7?', expression: 'typeof score === "number" ? score > 0.7 : parseFloat(score) > 0.7' } },
        { id: 'tool-crm', type: 'ToolNode', position: { x: 900, y: 100 }, data: { label: 'Log High Score', toolType: 'complete', fallbackOutput: { logged: true, reason: 'CRM not configured' } } },
        { id: 'output-1', type: 'OutputNode', position: { x: 900, y: 300 }, data: { label: 'Log Output', outputType: 'complete', outputTargets: ['complete'] } },
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
        { id: 'trigger-1', type: 'TriggerNode', position: { x: 100, y: 200 }, data: { label: 'RSS Feed', triggerType: 'rss', rssUrl: 'https://feeds.feedburner.com/techcrunch', url: 'https://feeds.feedburner.com/techcrunch' } },
        { id: 'ai-classify', type: 'AINode', position: { x: 300, y: 200 }, data: { label: 'Classify Content', systemPrompt: 'Classify this article as relevant or not_relevant for a developer audience. Return only valid JSON with no markdown: {"classification": "relevant"} or {"classification": "not_relevant"}', model: 'llama-3.3-70b-versatile' } },
        { id: 'condition-1', type: 'ConditionNode', position: { x: 500, y: 200 }, data: { label: 'Relevant?', expression: 'classification === "relevant"' } },
        { id: 'ai-rewrite', type: 'AINode', position: { x: 700, y: 100 }, data: { label: 'Rewrite for LinkedIn', systemPrompt: 'Rewrite this article as a punchy 3-paragraph LinkedIn post for developers. Be concise and engaging.', model: 'llama-3.3-70b-versatile' } },
        { id: 'output-1', type: 'OutputNode', position: { x: 900, y: 100 }, data: { label: 'Log Post', outputType: 'complete' } },
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
