export function fileBaseName(path: string) {
  return path.split("/").filter(Boolean).pop() ?? path;
}
