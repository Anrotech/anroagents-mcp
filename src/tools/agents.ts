import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AnroAgentsClient } from '../api-client.js';

// Proactive trigger — rule that auto-opens the widget on visitor behavior.
// Mirrors the server validator in api/src/lib/triggers.ts. Server has final word.
const proactiveTriggerSchema = z.object({
  id: z.string().optional().describe('Optional. Server assigns one if omitted.'),
  enabled: z.boolean(),
  type: z.enum([
    'time_on_page',
    'url_match',
    'exit_intent',
    'returning_visitor',
    'scroll_depth',
    'utm_match',
    'referrer_match',
    'idle',
  ]),
  priority: z.number().int().min(0).max(100).describe('Higher wins when multiple triggers fire at once.'),
  frequency: z.enum(['once_per_session', 'once_per_visitor', 'always']),
  device: z.enum(['all', 'desktop', 'mobile']),
  action: z.enum(['open_widget', 'show_greeting_bubble']),
  cooldownSeconds: z.number().int().min(60).max(86400).optional().describe('Only for frequency=always.'),
  conditions: z.object({
    urlPattern: z.string().optional().describe('Glob: * any, ? one char. Required for url_match.'),
    delaySeconds: z.number().int().optional().describe('1..3600 for time_on_page, 5..3600 for idle.'),
    minVisits: z.number().int().min(2).max(100).optional().describe('For returning_visitor.'),
    scrollPercent: z.number().int().min(1).max(100).optional().describe('For scroll_depth.'),
    utm: z.object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
    }).optional().describe('At least one field required for utm_match.'),
    referrerPattern: z.string().optional().describe('Glob against referrer hostname. Required for referrer_match.'),
  }),
  greeting: z.union([
    z.string(),
    z.record(z.string(), z.string()),
  ]).optional().describe('Custom greeting shown when this trigger fires. String or {lang: text} map.'),
});

const proactiveTriggersField = z.array(proactiveTriggerSchema)
  .max(10)
  .optional()
  .describe('Rules that auto-open the widget on visitor behavior. Max 10 per agent.');

// Lead qualification config — mirrors api/src/lib/qualification.ts.
const qualificationSchema = z.object({
  enabled: z.boolean(),
  framework: z.enum(['bant', 'meddic', 'custom']),
  completionMode: z.enum(['soft', 'persistent', 'strict'])
    .describe('soft = opportunistic, persistent = circles back every 2-3 turns, strict = blocks off-topic until required fields are answered'),
  qualifyThreshold: z.number().int().min(1).max(100)
    .describe('Minimum normalized score for the lead.qualified webhook to fire'),
  fields: z.array(z.object({
    id: z.string().optional(),
    key: z.string().regex(/^[a-z][a-z0-9_]*$/, 'lowercase, snake_case, 1-40 chars'),
    label: z.string().max(80),
    hint: z.string().max(400).describe('Free-form instruction handed to the LLM: what to extract, how to ask.'),
    required: z.boolean(),
    weight: z.number().int().min(1).max(100),
    buckets: z.array(z.object({
      label: z.string().max(60),
      score: z.number().int().min(0).max(100),
    })).max(10).optional(),
  })).max(12),
}).optional().describe('Structured lead qualification (BANT/MEDDIC-style). AI weaves questions into chat, classifier extracts answers, score fires a webhook on threshold crossing.');

export function registerAgentTools(server: McpServer, client: AnroAgentsClient) {

  server.tool(
    'list-agents',
    'List all your AI agents. Optionally filter by status.',
    { status: z.enum(['draft', 'review', 'active', 'disabled']).optional().describe('Filter by agent status') },
    async ({ status }) => {
      const result = await client.listAgents();
      if (!result.success) {
        return { content: [{ type: 'text', text: `Error: ${result.error}` }] };
      }
      let agents = result.data || [];
      if (status) {
        agents = agents.filter((a: any) => a.status === status);
      }
      return {
        content: [{
          type: 'text',
          text: agents.length
            ? JSON.stringify(agents, null, 2)
            : 'No agents found.',
        }],
      };
    },
  );

  server.tool(
    'get-agent',
    'Get full details of a specific agent.',
    { agentId: z.string().describe('The agent ID') },
    async ({ agentId }) => {
      const result = await client.getAgent(agentId);
      if (!result.success) {
        return { content: [{ type: 'text', text: `Error: ${result.error}` }] };
      }
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    },
  );

  server.tool(
    'create-agent',
    'Create a new AI agent. Only businessName is required, all other fields are optional.',
    {
      businessName: z.string().describe('Name of the business (required)'),
      businessDescription: z.string().optional().describe('Description of the business'),
      defaultGreeting: z.string().optional().describe('Greeting message for visitors'),
      defaultLanguage: z.string().optional().describe('Language code (e.g. "en", "ru", "es")'),
      communicationTone: z.enum(['formal', 'friendly', 'neutral']).optional().describe('Communication style'),
      businessHours: z.string().optional().describe('Business hours (e.g. "Mon-Fri 9am-5pm")'),
      widgetTitle: z.string().optional().describe('Title displayed in the chat widget'),
      escalationRules: z.string().optional().describe('Rules for when to escalate to a human'),
      restrictions: z.string().optional().describe('Topics or actions the agent should avoid'),
      bookingUrl: z.string().optional().describe('URL for online booking'),
      services: z.array(z.object({
        name: z.string(),
        price: z.string(),
        description: z.string(),
      })).optional().describe('List of services offered'),
      contacts: z.object({
        website: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      }).optional().describe('Contact information'),
      faq: z.array(z.object({
        question: z.string(),
        answer: z.string(),
      })).optional().describe('Frequently asked questions'),
      proactiveTriggers: proactiveTriggersField,
      qualification: qualificationSchema,
    },
    async (params) => {
      const result = await client.createAgent(params);
      if (!result.success) {
        return { content: [{ type: 'text', text: `Error: ${result.error}` }] };
      }
      return { content: [{ type: 'text', text: `Agent created successfully!\n\n${JSON.stringify(result.data, null, 2)}` }] };
    },
  );

  server.tool(
    'update-agent',
    'Update an existing agent\'s configuration. Only provide fields you want to change.',
    {
      agentId: z.string().describe('The agent ID to update'),
      businessName: z.string().optional(),
      businessDescription: z.string().optional(),
      defaultGreeting: z.string().optional(),
      defaultLanguage: z.string().optional(),
      communicationTone: z.enum(['formal', 'friendly', 'neutral']).optional(),
      businessHours: z.string().optional(),
      widgetTitle: z.string().optional(),
      escalationRules: z.string().optional(),
      restrictions: z.string().optional(),
      bookingUrl: z.string().optional(),
      services: z.array(z.object({
        name: z.string(),
        price: z.string(),
        description: z.string(),
      })).optional(),
      contacts: z.object({
        website: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      }).optional(),
      faq: z.array(z.object({
        question: z.string(),
        answer: z.string(),
      })).optional(),
      proactiveTriggers: proactiveTriggersField,
      qualification: qualificationSchema,
    },
    async ({ agentId, ...updates }) => {
      const result = await client.updateAgent(agentId, updates);
      if (!result.success) {
        return { content: [{ type: 'text', text: `Error: ${result.error}` }] };
      }
      return { content: [{ type: 'text', text: `Agent updated successfully!\n\n${JSON.stringify(result.data, null, 2)}` }] };
    },
  );

  server.tool(
    'delete-agent',
    'Delete a draft agent. Only agents in "draft" status can be deleted.',
    { agentId: z.string().describe('The agent ID to delete') },
    async ({ agentId }) => {
      const result = await client.deleteAgent(agentId);
      if (!result.success) {
        return { content: [{ type: 'text', text: `Error: ${result.error}` }] };
      }
      return { content: [{ type: 'text', text: result.message || 'Agent deleted successfully.' }] };
    },
  );
}
