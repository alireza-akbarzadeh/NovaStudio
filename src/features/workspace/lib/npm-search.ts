/**
 * Search the public npm registry (CORS-friendly).
 */

export type NpmSearchHit = {
  name: string;
  version: string;
  description: string;
};

type NpmSearchResponse = {
  objects?: Array<{
    package?: {
      name?: string;
      version?: string;
      description?: string;
    };
  }>;
};

export async function searchNpmPackages(
  query: string,
  options?: { size?: number; signal?: AbortSignal },
): Promise<NpmSearchHit[]> {
  const text = query.trim();
  if (!text) return [];

  const size = options?.size ?? 12;
  const url = new URL("https://registry.npmjs.org/-/v1/search");
  url.searchParams.set("text", text);
  url.searchParams.set("size", String(size));

  const res = await fetch(url.toString(), {
    signal: options?.signal,
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`npm search failed (${res.status})`);
  }

  const data = (await res.json()) as NpmSearchResponse;
  return (data.objects ?? [])
    .map((obj) => {
      const pkg = obj.package;
      if (!pkg?.name) return null;
      return {
        name: pkg.name,
        version: pkg.version ?? "latest",
        description: pkg.description?.trim() || "",
      } satisfies NpmSearchHit;
    })
    .filter((hit): hit is NpmSearchHit => hit != null);
}
