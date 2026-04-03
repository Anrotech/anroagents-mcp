import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { AnroAgentsClient } from './api-client.js';
import { registerAgentTools } from './tools/agents.js';
import { registerActionTools } from './tools/actions.js';

export function createServer(token: string, apiUrl?: string): McpServer {
  const client = new AnroAgentsClient(token, apiUrl);

  const server = new McpServer({
    name: 'anroagents',
    version: '0.1.0',
  });

  registerAgentTools(server, client);
  registerActionTools(server, client);

  return server;
}

export async function main() {
  const token = process.env.ANROAGENTS_TOKEN;
  if (!token) {
    console.error('Error: ANROAGENTS_TOKEN environment variable is required.');
    console.error('Get your token at https://app.anroagents.com/settings');
    process.exit(1);
  }

  const apiUrl = process.env.ANROAGENTS_API_URL;
  const server = createServer(token, apiUrl);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
