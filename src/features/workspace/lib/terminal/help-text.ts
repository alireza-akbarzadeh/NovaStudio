export const HELP_TEXT = `Polaris terminal — git + filesystem are simulated; npm runs in WebContainer.

Shortcuts:
  Tab                        Autocomplete command / path / npm script
  → (right arrow)            Accept dim suggestion
  ↑ / ↓                      Browse command history
  Ctrl+V / Cmd+V             Paste into the current line
  Ctrl+L                     Clear screen
  Ctrl+U                     Clear line
  Ctrl+W                     Delete last word

Available commands:
  help                      Show this help message
  clear                     Clear the terminal
  pwd                       Print working directory
  ls [path]                 List files and folders
  cat <file>                Print file contents
  cd <path>                 Change directory
  echo <text>               Print text
  npm|npx|pnpm|yarn|bun …  Real install/run via WebContainer (when ready)

Git (backed by GitHub API):
  git status                Show working tree status
  git init [name]           Open init dialog, or create repo with <name>
  git pull                  Pull latest files from GitHub
  git commit -m "message"   Commit local changes and push to GitHub
  git push -m "message"     Alias for commit + push
  git branch                List branches
  git checkout <branch>     Switch branch
  git checkout -b <name>    Create and switch to a new branch
  git switch <branch>       Switch branch
  git switch -c <name>      Create and switch to a new branch
  git log [-n <count>]      Show recent commits`;
