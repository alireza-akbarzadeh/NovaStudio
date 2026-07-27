const WEBCONTAINER_COMMAND_RE = /^\s*(npm|pnpm|yarn|npx|node|bun)\b/;

export function isWebContainerShellCommand(command: string): boolean {
  return WEBCONTAINER_COMMAND_RE.test(command.trim());
}
