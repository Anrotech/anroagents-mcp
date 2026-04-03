import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AnroAgentsClient } from '../api-client.js';

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
