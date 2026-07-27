"use node";

import { gunzipSync } from "zlib";

import {
  createOctokit,
  GITHUB_API_VERSION,
  MAX_FILE_BYTES,
  MAX_IMPORT_FILES,
  shouldIgnorePath,
  type GitHubImportFile,
} from "./github";

const BLOB_CONCURRENCY = 32;

type TreeBlob = {
  path: string;
  sha: string;
  size?: number;
};

function isLikelyText(content: string) {
  // Skip obvious binaries — null bytes aren't valid in our text file store.
  return !content.includes("\u0000");
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]!, index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(items.length, 1)) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

function parseTarBuffer(buffer: Buffer): GitHubImportFile[] {
  const files: GitHubImportFile[] = [];
  let offset = 0;

  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512);
    offset += 512;

    // Two empty blocks mark the end of the archive.
    if (header.every((byte) => byte === 0)) {
      break;
    }

    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    const sizeOctal = header
      .subarray(124, 136)
      .toString("utf8")
      .replace(/\0.*$/, "")
      .trim();
    const typeFlag = String.fromCharCode(header[156] ?? 0);
    const prefix = header
      .subarray(345, 500)
      .toString("utf8")
      .replace(/\0.*$/, "");
    const size = Number.parseInt(sizeOctal, 8) || 0;
    const dataEnd = offset + size;
    const data = buffer.subarray(offset, dataEnd);
    offset += Math.ceil(size / 512) * 512;

    // Regular files only.
    if (typeFlag !== "0" && typeFlag !== "\0") {
      continue;
    }

    const fullPath = prefix ? `${prefix}/${name}` : name;
    // GitHub tarballs are rooted at `owner-repo-sha/...`
    const slash = fullPath.indexOf("/");
    const relative = slash >= 0 ? fullPath.slice(slash + 1) : fullPath;
    if (!relative || shouldIgnorePath(relative)) {
      continue;
    }
    if (size > MAX_FILE_BYTES) {
      continue;
    }

    const content = data.toString("utf8");
    if (!isLikelyText(content)) {
      continue;
    }

    files.push({ path: relative, content });
    if (files.length > MAX_IMPORT_FILES) {
      throw new Error(
        `Repository has too many files. Limit is ${MAX_IMPORT_FILES}.`,
      );
    }
  }

  return files;
}

async function fetchRepoFilesFromTarball(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<GitHubImportFile[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/tarball/${encodeURIComponent(branch)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        "User-Agent": "NovaStudio",
      },
      redirect: "follow",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub tarball download failed (${response.status}): ${body.slice(0, 200)}`,
    );
  }

  const compressed = Buffer.from(await response.arrayBuffer());
  const tar = gunzipSync(compressed);
  return parseTarBuffer(tar);
}

async function listTreeBlobs(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<{ blobs: TreeBlob[]; commitSha: string }> {
  const octokit = createOctokit(token);

  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const commitSha = refData.object.sha;

  const { data: treeData } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: commitSha,
    recursive: "true",
  });

  const blobs = treeData.tree
    .filter(
      (item): item is typeof item & { path: string; sha: string } =>
        item.type === "blob" &&
        Boolean(item.path) &&
        Boolean(item.sha) &&
        !shouldIgnorePath(item.path!),
    )
    .filter((item) => item.size === undefined || item.size <= MAX_FILE_BYTES)
    .map((item) => ({
      path: item.path,
      sha: item.sha,
      size: item.size,
    }));

  if (blobs.length > MAX_IMPORT_FILES) {
    throw new Error(
      `Repository has too many files (${blobs.length}). Limit is ${MAX_IMPORT_FILES}.`,
    );
  }

  return { blobs, commitSha };
}

async function fetchRepoFilesFromBlobs(
  token: string,
  owner: string,
  repo: string,
  blobs: TreeBlob[],
): Promise<GitHubImportFile[]> {
  const octokit = createOctokit(token);

  const fetched = await mapPool(blobs, BLOB_CONCURRENCY, async (blob) => {
    const { data: blobData } = await octokit.rest.git.getBlob({
      owner,
      repo,
      file_sha: blob.sha,
    });

    if (blobData.size != null && blobData.size > MAX_FILE_BYTES) {
      return null;
    }

    const content =
      blobData.encoding === "base64"
        ? Buffer.from(blobData.content, "base64").toString("utf8")
        : blobData.content;

    if (!isLikelyText(content)) {
      return null;
    }

    return { path: blob.path, content } satisfies GitHubImportFile;
  });

  return fetched.filter((file): file is GitHubImportFile => file != null);
}

/** Fetch text files from a GitHub branch. Call only from `"use node"` actions. */
export async function fetchRepoFiles(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<{ files: GitHubImportFile[]; commitSha: string }> {
  const { blobs, commitSha } = await listTreeBlobs(token, owner, repo, branch);

  // Prefer one-shot tarball download (much faster than N blob API calls).
  try {
    const files = await fetchRepoFilesFromTarball(token, owner, repo, branch);
    if (files.length > 0) {
      return { files, commitSha };
    }
  } catch {
    // Fall through to parallel blob fetch.
  }

  const files = await fetchRepoFilesFromBlobs(token, owner, repo, blobs);
  return { files, commitSha };
}
