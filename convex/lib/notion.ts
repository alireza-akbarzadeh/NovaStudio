const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

type NotionRichText = {
  type: "text";
  text: { content: string };
};

type NotionBlock = {
  object: "block";
  type: string;
  [key: string]: unknown;
};

type NotionResponse<T> = T & {
  message?: string;
};

async function notionFetch<T>(
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as NotionResponse<T>;
  if (!response.ok) {
    throw new Error(payload.message || `Notion API failed (${response.status})`);
  }
  return payload;
}

export function normalizeNotionPageId(raw: string) {
  const trimmed = raw.trim();
  const fromUrl = trimmed.match(/([0-9a-f]{32})(?:[?#]|$)/i)?.[1];
  const hex = (fromUrl ?? trimmed).replace(/-/g, "");
  if (!/^[0-9a-f]{32}$/i.test(hex)) {
    throw new Error(
      "Paste a Notion page URL or page ID — new exports will be created under that page",
    );
  }
  return formatNotionUuid(hex);
}

function formatNotionUuid(hex: string) {
  const normalized = hex.toLowerCase();
  return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20)}`;
}

function richText(content: string): NotionRichText[] {
  if (!content) return [{ type: "text", text: { content: "" } }];
  const chunks: NotionRichText[] = [];
  for (let index = 0; index < content.length; index += 2000) {
    chunks.push({
      type: "text",
      text: { content: content.slice(index, index + 2000) },
    });
  }
  return chunks;
}

function paragraphBlock(text: string): NotionBlock {
  return {
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: richText(text) },
  };
}

function headingBlock(level: 1 | 2 | 3, text: string): NotionBlock {
  const type = `heading_${level}` as const;
  return {
    object: "block",
    type,
    [type]: { rich_text: richText(text) },
  };
}

function bulletedListItemBlock(text: string): NotionBlock {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: richText(text) },
  };
}

function codeBlock(text: string, language?: string): NotionBlock {
  return {
    object: "block",
    type: "code",
    code: {
      rich_text: richText(text),
      language: language?.trim().slice(0, 48) || "plain text",
    },
  };
}

function dividerBlock(): NotionBlock {
  return { object: "block", type: "divider", divider: {} };
}

export function markdownToNotionBlocks(markdown: string): NotionBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: NotionBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();

    const codeFence = trimmed.match(/^```(\w+)?$/);
    if (codeFence) {
      index += 1;
      const codeLines: string[] = [];
      while (index < lines.length && !/^```/.test(lines[index]?.trim() ?? "")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(codeBlock(codeLines.join("\n"), codeFence[1]));
      continue;
    }

    if (!trimmed) {
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push(headingBlock(level, headingMatch[2].trim()));
      index += 1;
      continue;
    }

    if (/^(-|\*)\s+/.test(trimmed)) {
      blocks.push(bulletedListItemBlock(trimmed.replace(/^(-|\*)\s+/, "")));
      index += 1;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push(dividerBlock());
      index += 1;
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (index < lines.length) {
      const next = lines[index]?.trim() ?? "";
      if (
        !next ||
        /^```/.test(next) ||
        /^#{1,3}\s+/.test(next) ||
        /^(-|\*)\s+/.test(next) ||
        /^---+$/.test(next)
      ) {
        break;
      }
      paragraphLines.push(next);
      index += 1;
    }
    blocks.push(paragraphBlock(paragraphLines.join("\n")));
  }

  return blocks.length > 0 ? blocks : [paragraphBlock("")];
}

function extractPageTitle(page: {
  properties?: Record<
    string,
    { type?: string; title?: Array<{ plain_text?: string }> }
  >;
}) {
  const properties = page.properties ?? {};
  for (const value of Object.values(properties)) {
    if (value.type === "title") {
      return value.title?.map((part) => part.plain_text ?? "").join("") || undefined;
    }
  }
  return undefined;
}

export async function verifyNotionConnection(args: {
  apiKey: string;
  parentPageId: string;
}) {
  const parentPageId = normalizeNotionPageId(args.parentPageId);
  const viewer = await notionFetch<{
    id: string;
    name?: string;
    type: string;
    bot?: { owner?: { type?: string; workspace?: boolean } };
  }>(args.apiKey, "/users/me");

  const page = await notionFetch<{
    id: string;
    url?: string;
    properties?: Record<
      string,
      { type?: string; title?: Array<{ plain_text?: string }> }
    >;
  }>(args.apiKey, `/pages/${parentPageId}`);

  return {
    parentPageId,
    parentPageTitle: extractPageTitle(page),
    viewerName: viewer.name ?? "Notion integration",
    workspaceName: viewer.type === "bot" ? "Workspace" : undefined,
  };
}

export async function createNotionPageFromMarkdown(args: {
  apiKey: string;
  parentPageId: string;
  title: string;
  markdown: string;
  footer?: string;
}) {
  const parentPageId = normalizeNotionPageId(args.parentPageId);
  const title = args.title.trim().slice(0, 200) || "NovaStudio export";
  const children = markdownToNotionBlocks(args.markdown);
  if (args.footer?.trim()) {
    children.push(dividerBlock(), paragraphBlock(args.footer.trim()));
  }

  const page = await notionFetch<{ id: string; url?: string }>(
    args.apiKey,
    "/pages",
    {
      method: "POST",
      body: JSON.stringify({
        parent: { page_id: parentPageId },
        properties: {
          title: {
            title: richText(title),
          },
        },
        children: children.slice(0, 100),
      }),
    },
  );

  return {
    pageId: page.id,
    url: page.url,
  };
}
