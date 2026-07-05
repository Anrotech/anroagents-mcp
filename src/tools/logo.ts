import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AnroAgentsClient } from '../api-client.js';

// Image types the platform accepts for a logo. Keep in sync with the server's
// LOGO_ALLOWED_TYPES (api/src/lib/uploads.ts).
const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

const MAX_LOGO_SIZE = 10 * 1024 * 1024; // 10 MB — mirrors the server limit.

function mimeFromName(name: string): string | undefined {
  const ext = name.split('.').pop()?.toLowerCase();
  return ext ? MIME_BY_EXT[ext] : undefined;
}

function text(t: string) {
  return { content: [{ type: 'text' as const, text: t }] };
}

export function registerLogoTools(server: McpServer, client: AnroAgentsClient) {
  server.tool(
    'set-agent-logo',
    'Upload a logo image and attach it to an agent. Provide either filePath (a local image file) or imageUrl (a public image URL). Accepts PNG, JPEG, WebP, or SVG up to 10 MB.',
    {
      agentId: z.string().describe('The agent ID to set the logo on'),
      filePath: z.string().optional().describe('Absolute path to a local image file (png, jpg, webp, or svg). Provide this OR imageUrl.'),
      imageUrl: z.string().optional().describe('Public URL of an image to fetch and use as the logo. Provide this OR filePath.'),
    },
    async ({ agentId, filePath, imageUrl }) => {
      try {
        if ((!filePath && !imageUrl) || (filePath && imageUrl)) {
          return text('Error: provide exactly one of filePath or imageUrl.');
        }

        let bytes: Uint8Array;
        let fileName: string;
        let contentType: string | undefined;

        if (filePath) {
          const buf = await readFile(filePath);
          bytes = new Uint8Array(buf);
          fileName = basename(filePath);
          contentType = mimeFromName(fileName);
        } else {
          const res = await fetch(imageUrl!);
          if (!res.ok) return text(`Error: failed to fetch imageUrl (HTTP ${res.status}).`);
          bytes = new Uint8Array(await res.arrayBuffer());
          let urlPath = imageUrl!;
          try { urlPath = new URL(imageUrl!).pathname; } catch { /* keep raw */ }
          fileName = basename(urlPath) || 'logo';
          contentType = mimeFromName(fileName);
          // Fall back to the response's Content-Type when the URL has no usable extension.
          if (!contentType) {
            const header = res.headers.get('content-type')?.split(';')[0]?.trim();
            const ext = header && Object.keys(MIME_BY_EXT).find((k) => MIME_BY_EXT[k] === header);
            if (ext) {
              contentType = header!;
              if (!fileName.includes('.')) fileName = `${fileName}.${ext}`;
            }
          }
        }

        if (!contentType) {
          return text('Error: unsupported image type. Use PNG, JPEG, WebP, or SVG.');
        }
        if (bytes.byteLength > MAX_LOGO_SIZE) {
          return text(`Error: image exceeds the 10 MB limit (${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB).`);
        }

        // 1) Get a presigned upload URL, 2) PUT the bytes to S3, 3) attach the key to the agent.
        const upload = await client.createUpload({ fileName, contentType, fileSize: bytes.byteLength });
        if (!upload.success || !upload.data) {
          return text(`Error: ${upload.error || 'failed to create upload URL'}`);
        }

        await client.uploadToPresignedUrl(upload.data.uploadUrl, bytes, contentType);

        const result = await client.updateAgent(agentId, { logoKey: upload.data.key });
        if (!result.success) {
          return text(`Uploaded the image, but attaching it to the agent failed: ${result.error}`);
        }

        const logoUrl = (result.data as { logoUrl?: string } | undefined)?.logoUrl;
        return text(`Logo set on agent ${agentId}.${logoUrl ? `\n\nPreview (link expires shortly): ${logoUrl}` : ''}`);
      } catch (err) {
        return text(`Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  );
}
