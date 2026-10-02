import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AnroAgentsClient } from '../api-client.js';

function text(t: string) {
  return { content: [{ type: 'text' as const, text: t }] };
}

export function registerKnowledgeTools(server: McpServer, client: AnroAgentsClient) {
  server.tool(
    'list-knowledge',
    'List an agent\'s knowledge base sources (uploaded files, pages, whole websites) with their status — pending, processing, ready or error — plus the plan limits. Use it to check whether a website added with add-website-knowledge has finished reading.',
    { agentId: z.string().describe('The agent ID') },
    async ({ agentId }) => {
      const result = await client.listKnowledge(agentId);
      if (!result.success) return text(`Error: ${result.error}`);
      return text(JSON.stringify(result.data, null, 2));
    },
  );

  server.tool(
    'add-website-knowledge',
    'Add a whole website to an agent\'s knowledge base. The site is read in the background (pages within the plan\'s page and character budgets) and becomes one knowledge source; it starts as "pending" — call list-knowledge to see when it is "ready". One source per site: to read a site again, use resync-knowledge.',
    {
      agentId: z.string().describe('The agent ID'),
      url: z.string().describe('Website address, e.g. "https://example.com" or "example.com"'),
    },
    async ({ agentId, url }) => {
      const result = await client.addWebsiteKnowledge(agentId, url);
      if (!result.success) return text(`Error: ${result.error}`);
      return text(`Website queued for reading (source ${result.data?.fileId}). It shows as "pending" until done — check with list-knowledge.`);
    },
  );

  server.tool(
    'resync-knowledge',
    'Read a knowledge source again: a website is crawled again from the web (e.g. after the site changed), a file is re-indexed. Get the fileId from list-knowledge.',
    {
      agentId: z.string().describe('The agent ID'),
      fileId: z.string().describe('The knowledge source ID (fileId from list-knowledge)'),
    },
    async ({ agentId, fileId }) => {
      const result = await client.reindexKnowledge(agentId, fileId);
      if (!result.success) return text(`Error: ${result.error}`);
      return text('Queued. The source shows as "pending" until it has been read again — check with list-knowledge.');
    },
  );
}
