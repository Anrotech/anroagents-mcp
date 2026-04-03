import type { ApiResponse } from './types.js';

const DEFAULT_API_URL = 'https://api.anroagents.com';

export class AnroAgentsClient {
  private baseUrl: string;
  private token: string;

  constructor(token: string, apiUrl?: string) {
    this.token = token;
    this.baseUrl = (apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/mcp${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json() as ApiResponse<T>;

    if (!response.ok && !data.error) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  }

  async listAgents() {
    return this.request<unknown[]>('GET', '/agents');
  }

  async getAgent(agentId: string) {
    return this.request('GET', `/agents/${agentId}`);
  }

  async createAgent(data: Record<string, unknown>) {
    return this.request('POST', '/agents', data);
  }

  async updateAgent(agentId: string, data: Record<string, unknown>) {
    return this.request('PUT', `/agents/${agentId}`, data);
  }

  async deleteAgent(agentId: string) {
    return this.request('DELETE', `/agents/${agentId}`);
  }

  async submitAgent(agentId: string) {
    return this.request('POST', `/agents/${agentId}/submit`);
  }

  async toggleAgent(agentId: string) {
    return this.request<{ enabled: boolean }>('POST', `/agents/${agentId}/toggle`);
  }

  async getEmbedCode(agentId: string) {
    return this.request<{ embedCode: string }>('GET', `/agents/${agentId}/embed-code`);
  }

  async regenerateKey(agentId: string) {
    return this.request<{ apiKey: string }>('POST', `/agents/${agentId}/regenerate-key`);
  }
}
