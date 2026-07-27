export function normalizeBranchName(raw: string): string {
  return raw
    .trim()
    .replace(/^refs\/heads\//, "")
    .replace(/\s+/g, "");
}

export function validateBranchName(raw: string): string | null {
  const name = normalizeBranchName(raw);
  if (!name) {
    return "Branch name is required";
  }
  if (!/^[A-Za-z0-9._/-]+$/.test(name) || name.includes("..")) {
    return "Invalid branch name. Use letters, numbers, /, -, _, and .";
  }
  if (name.endsWith(".") || name.endsWith(".lock")) {
    return "Branch name cannot end with . or .lock";
  }
  if (name.startsWith("/") || name.endsWith("/")) {
    return "Branch name cannot start or end with /";
  }
  return null;
}
