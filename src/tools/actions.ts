import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AnroAgentsClient } from '../api-client.js';

export function registerActionTools(server: McpServer, client: AnroAgentsClient) {

  server.tool(
    'submit-agent-for-review',
    'Submit an agent for review and AGNTCY catalog listing. Requires a paid plan and active subscription.',
    { agentId: z.string().describe('The agent ID to submit') },
    async ({ agentId }) => {
      const result = await client.submitAgent(agentId);
      if (!result.success) {
        return { content: [{ type: 'text', text: `Error: ${result.error}` }] };
      }
      return { content: [{ type: 'text', text: result.message || 'Agent submitted for review.' }] };
    },
  );

  server.tool(
    'toggle-agent',
    'Enable or disable an active agent. Only agents with "active" status can be toggled.',
    { agentId: z.string().describe('The agent ID to toggle') },
    async ({ agentId }) => {
      const result = await client.toggleAgent(agentId);
      if (!result.success) {
        return { content: [{ type: 'text', text: `Error: ${result.error}` }] };
      }
      const enabled = result.data?.enabled;
      return { content: [{ type: 'text', text: `Agent ${enabled ? 'enabled' : 'disabled'} successfully.` }] };
    },
  );

  server.tool(
    'get-embed-code',
    'Get the HTML embed code for the chat widget. Use this code to add the agent to any website.',
    { agentId: z.string().describe('The agent ID') },
    async ({ agentId }) => {
      const result = await client.getEmbedCode(agentId);
      if (!result.success) {
        return { content: [{ type: 'text', text: `Error: ${result.error}` }] };
      }
      return { content: [{ type: 'text', text: `Embed code:\n\n\`\`\`html\n${result.data?.embedCode}\n\`\`\`` }] };
    },
  );

  server.tool(
    'regenerate-agent-key',
    'Regenerate the API key for an agent. The old key will stop working immediately.',
    { agentId: z.string().describe('The agent ID') },
    async ({ agentId }) => {
      const result = await client.regenerateKey(agentId);
      if (!result.success) {
        return { content: [{ type: 'text', text: `Error: ${result.error}` }] };
      }
      return { content: [{ type: 'text', text: `New API key generated: ${result.data?.apiKey}\n\nNote: The previous key no longer works. Update your embed code if needed.` }] };
    },
  );
}
