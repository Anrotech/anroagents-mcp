# AnroAgents MCP Server

[![npm version](https://img.shields.io/npm/v/@anroagents/mcp-server.svg)](https://www.npmjs.com/package/@anroagents/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for managing AI agents on the [AnroAgents](https://anroagents.com) platform. Control your agents directly from Claude, ChatGPT, Gemini, Cursor, Windsurf, and other AI tools.

## Features

| Tool | Description |
|------|-------------|
| `list-agents` | List all your AI agents (with optional status filter) |
| `get-agent` | Get full details of a specific agent |
| `create-agent` | Create a new AI agent for your business |
| `update-agent` | Update agent configuration (name, services, FAQ, etc.) |
| `delete-agent` | Delete a draft agent |
| `submit-agent-for-review` | Submit agent for moderation and catalog listing |
| `toggle-agent` | Enable or disable an active agent |
| `get-embed-code` | Get HTML widget embed code for any website |
| `regenerate-agent-key` | Regenerate the agent's API key |

## Quick Start

### 1. Get a Personal Access Token

1. Log in to [app.anroagents.com](https://app.anroagents.com)
2. Go to **Settings** > **API Tokens**
3. Click **Create Token**, give it a name (e.g., "Claude Desktop")
4. Copy the token (it starts with `pat_` and is shown only once)

### 2. Configure your AI client

Choose your client below and follow the instructions.

---

## Setup by Client

### Claude Desktop

Edit your config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "anroagents": {
      "command": "npx",
      "args": ["-y", "@anroagents/mcp-server"],
      "env": {
        "ANROAGENTS_TOKEN": "pat_your_token_here"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

### Claude Code (CLI)

Add to your project's `.claude/settings.json` or global `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "anroagents": {
      "command": "npx",
      "args": ["-y", "@anroagents/mcp-server"],
      "env": {
        "ANROAGENTS_TOKEN": "pat_your_token_here"
      }
    }
  }
}
```

### Cursor

Open **Settings** > **MCP** > **Add new MCP server** and configure:

- **Name:** `anroagents`
- **Command:** `npx -y @anroagents/mcp-server`
- **Environment:** `ANROAGENTS_TOKEN=pat_your_token_here`

### Windsurf

Open **Settings** > **MCP** > **Add Server**:

```json
{
  "anroagents": {
    "command": "npx",
    "args": ["-y", "@anroagents/mcp-server"],
    "env": {
      "ANROAGENTS_TOKEN": "pat_your_token_here"
    }
  }
}
```

### VS Code (with Continue or Copilot Chat MCP)

Add to your MCP configuration:

```json
{
  "servers": {
    "anroagents": {
      "command": "npx",
      "args": ["-y", "@anroagents/mcp-server"],
      "env": {
        "ANROAGENTS_TOKEN": "pat_your_token_here"
      }
    }
  }
}
```

### ChatGPT (Custom GPTs)

ChatGPT doesn't support MCP, but you can use our OpenAPI-compatible API:

1. Create a **Custom GPT** at [chat.openai.com](https://chat.openai.com)
2. Go to **Configure** > **Actions** > **Import from URL**
3. Enter: `https://api.anroagents.com/mcp/openapi.json`
4. Set **Authentication**: API Key
   - **Header:** `Authorization`
   - **Value:** `Bearer pat_your_token_here`
5. Save and test

### Gemini (Extensions)

Use the same OpenAPI endpoint:

1. Open Google AI Studio or Gemini settings
2. Add a custom extension with URL: `https://api.anroagents.com/mcp/openapi.json`
3. Set Bearer authentication with your PAT token

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANROAGENTS_TOKEN` | Yes | Personal Access Token (`pat_...`) |
| `ANROAGENTS_API_URL` | No | API base URL (default: `https://api.anroagents.com`) |

---

## Tool Reference

### list-agents

List all agents owned by the authenticated user.

**Parameters:**
- `status` (optional): Filter by status — `draft`, `review`, `active`, or `disabled`

### get-agent

Get full details of a specific agent.

**Parameters:**
- `agentId` (required): The agent's unique ID

### create-agent

Create a new AI agent. The agent starts in `draft` status.

**Parameters:**
- `businessName` (required): Name of the business
- `businessDescription` (optional): Description of what the business does
- `defaultGreeting` (optional): Greeting message shown to visitors
- `defaultLanguage` (optional): Language code (default: `en`)
- `communicationTone` (optional): `formal`, `friendly`, or `neutral`
- `businessHours` (optional): e.g., "Mon-Fri 9am-5pm"
- `widgetTitle` (optional): Title shown in the chat widget
- `escalationRules` (optional): When to escalate to a human
- `restrictions` (optional): Topics the agent should avoid
- `bookingUrl` (optional): Online booking URL
- `services` (optional): Array of `{ name, price, description }`
- `contacts` (optional): `{ website, email, phone, address }`
- `faq` (optional): Array of `{ question, answer }`

### update-agent

Update an existing agent. Only provide fields you want to change.

**Parameters:** Same as `create-agent`, plus `agentId` (required).

### delete-agent

Delete an agent. Only agents in `draft` status can be deleted.

**Parameters:**
- `agentId` (required): The agent's unique ID

### submit-agent-for-review

Submit an agent for review and catalog listing. Requires a paid plan and active subscription.

**Parameters:**
- `agentId` (required): The agent's unique ID

### toggle-agent

Enable or disable an active agent.

**Parameters:**
- `agentId` (required): The agent's unique ID

### get-embed-code

Get the HTML snippet to embed the chat widget on any website.

**Parameters:**
- `agentId` (required): The agent's unique ID

### regenerate-agent-key

Regenerate the agent's API key. The old key stops working immediately.

**Parameters:**
- `agentId` (required): The agent's unique ID

---

## Usage Examples

Once configured, you can ask your AI assistant things like:

- "List my AnroAgents agents"
- "Create a new agent for a pizza restaurant called Mario's Pizza"
- "Update my agent's business hours to Mon-Sat 11am-10pm"
- "Add a FAQ to my agent: Q: Do you deliver? A: Yes, within 5 miles"
- "What's the embed code for my Mario's Pizza agent?"
- "Disable my test agent"
- "Delete my draft agent"

---

## Development

```bash
# Clone the repository
git clone https://github.com/Anrotech/anroagents-mcp.git
cd anroagents-mcp

# Install dependencies
npm install

# Run locally (requires token)
ANROAGENTS_TOKEN=pat_... npm run dev

# Build for production
npm run build

# Test with MCP Inspector
ANROAGENTS_TOKEN=pat_... npx @modelcontextprotocol/inspector npx tsx src/bin/anroagents-mcp.ts
```

---

## License

MIT - see [LICENSE](LICENSE) for details.
