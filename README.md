# AnroAgents MCP Server

[![npm version](https://img.shields.io/npm/v/@anroagents/mcp-server.svg)](https://www.npmjs.com/package/@anroagents/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server for managing AI agents on the [AnroAgents](https://anroagents.com) platform. Control your agents directly from Claude, Cursor, Windsurf, Gemini CLI and other MCP clients — and from ChatGPT through the same API.

The server runs on your own computer: your AI client starts it with `npx`, so it needs **Node.js 18 or newer**. It works in desktop apps, CLIs and code editors, not in web chats such as claude.ai in the browser.

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
| `set-agent-logo` | Upload a logo (local file or image URL) and attach it to an agent |
| `list-knowledge` | List an agent's knowledge sources and their status |
| `add-website-knowledge` | Add a whole website to an agent's knowledge base |
| `resync-knowledge` | Read a knowledge source (e.g. a website) again |
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

Open **Settings** > **Developer** > **Edit Config**, or edit the file directly:

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

Quit Claude Desktop completely (Cmd+Q on macOS) and open it again — closing the window is not enough.

### Claude Code (CLI)

Claude Code registers MCP servers with its own command — it does **not** read `mcpServers` from `settings.json`:

```bash
claude mcp add anroagents --scope user -e ANROAGENTS_TOKEN=pat_your_token_here -- npx -y @anroagents/mcp-server
```

`--scope user` makes it available in every project. Check with `claude mcp list`. To share it with a team through the repository instead, put the same `mcpServers` block as for Claude Desktop into `.mcp.json` at the project root (and keep the token out of git).

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

### Gemini CLI

Add to `~/.gemini/settings.json`:

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

### ChatGPT (Custom GPT Actions)

ChatGPT cannot start a local MCP server like this one. Instead, point a Custom GPT at the same API through its OpenAPI spec:

1. Create a **Custom GPT** at [chatgpt.com](https://chatgpt.com)
2. Go to **Configure** > **Actions** > **Import from URL**
3. Enter: `https://api.anroagents.com/mcp/openapi.json`
4. Set **Authentication**: API Key, auth type **Bearer**, value `pat_your_token_here`
5. Save and test

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANROAGENTS_TOKEN` | Yes | Personal Access Token (`pat_...`) |
| `ANROAGENTS_API_URL` | No | API base URL (default: `https://api.anroagents.com`) |

---

## Troubleshooting

If your client shows the server as **failed** or **disconnected**, the cause is almost always on your computer, not in your AnroAgents account:

- **`npx: command not found` / `spawn npx ENOENT`** — Node.js is missing or the app can't see it. Install Node.js 18+ from [nodejs.org](https://nodejs.org). If you installed it with nvm or Homebrew, GUI apps may not see it: set `"command"` to the full path from `which npx`.
- **`ANROAGENTS_TOKEN environment variable is required`** — the `env` block is missing or misspelled in the config.
- **`HTTP 401` or `HTTP 403` on every tool call** — the token was deleted or mistyped. A token is shown only once; create a new one in **Settings** > **API Tokens** and paste it into the config.
- **Logs** — Claude Desktop writes the reason to `~/Library/Logs/Claude/mcp-server-anroagents.log` (macOS) or `%APPDATA%\Claude\logs\mcp-server-anroagents.log` (Windows).

Connection instructions are also always available in the dashboard under **Settings** > **API Tokens** > **How to connect an AI assistant**.

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
- `attachmentsEnabled` (optional): Let visitors send photos (the agent sees them) and files in chat — Starter plan or higher
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

### set-agent-logo

Upload a logo image and attach it to an agent. Provide **either** a local file or a public image URL. Accepts PNG, JPEG, WebP, or SVG up to 10 MB. The image is uploaded to secure storage and the agent is updated in one step.

**Parameters:**
- `agentId` (required): The agent's unique ID
- `filePath` (optional): Absolute path to a local image file. Use this **or** `imageUrl`.
- `imageUrl` (optional): Public URL of an image to fetch. Use this **or** `filePath`.

### list-knowledge

List an agent's knowledge base sources — uploaded files, pages and whole websites — with their status (`pending`, `processing`, `ready`, `error`), page counts for websites, and the plan limits.

**Parameters:**
- `agentId` (required): The agent's unique ID

### add-website-knowledge

Add a whole website to the agent's knowledge base. The pages are read in the background within the plan's page and character budgets, and the site becomes one knowledge source. It starts as `pending`; use `list-knowledge` to see when it is `ready`. Addresses on internal networks are refused, and each site can be added once — use `resync-knowledge` to read it again.

**Parameters:**
- `agentId` (required): The agent's unique ID
- `url` (required): Website address, e.g. `https://example.com` or `example.com`

### resync-knowledge

Read a knowledge source again: a website is crawled again from the web, a file is re-indexed.

**Parameters:**
- `agentId` (required): The agent's unique ID
- `fileId` (required): The source ID from `list-knowledge`

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
- "Set the logo for my Mario's Pizza agent from ~/Downloads/logo.png"
- "Teach my Mario's Pizza agent everything on mariospizza.com"
- "Let visitors send photos to my carpentry agent"
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
