"use client";

import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";

import type { FileTreeMenuContentProps } from "./types";

export function FileTreeMenuContent({
  isFolder,
  canPaste,
  canEdit = true,
  onNewFile,
  onNewFolder,
  onOpen,
  onOpenInTerminal,
  onAddToChat,
  onAddToNewChat,
  onFindInFolder,
  onCut,
  onCopy,
  onPaste,
  onDuplicate,
  onCopyPath,
  onCopyRelativePath,
  onRename,
  onDelete,
  menuType = "context",
  showItemActions = true,
}: FileTreeMenuContentProps) {
  const itemClassName =
    "cursor-default gap-0 py-1 text-[12px] text-ws-text focus:bg-ws-menu-focus focus:text-white data-[disabled]:text-ws-text-muted";
  const destructiveClassName =
    "cursor-default gap-0 py-1 text-[12px] text-ws-text focus:bg-ws-danger-focus focus:text-ws-danger";
  const shortcutClassName = "pl-6 text-[11px] tracking-normal text-ws-text-muted";
  const separatorClassName = "mx-0 my-1 bg-ws-border";

  const Item = menuType === "dropdown" ? DropdownMenuItem : ContextMenuItem;
  const Separator =
    menuType === "dropdown" ? DropdownMenuSeparator : ContextMenuSeparator;
  const Shortcut =
    menuType === "dropdown" ? DropdownMenuShortcut : ContextMenuShortcut;
  const Content =
    menuType === "dropdown" ? DropdownMenuContent : ContextMenuContent;

  return (
    <Content className="min-w-56 rounded-md border-ws-border bg-ws-hover p-1 text-ws-text shadow-lg">
      {isFolder ? (
        <>
          {canEdit ? (
            <>
              <Item onClick={onNewFile} className={itemClassName}>
                New File...
                <Shortcut className={shortcutClassName}>A</Shortcut>
              </Item>
              <Item onClick={onNewFolder} className={itemClassName}>
                New Folder...
                <Shortcut className={shortcutClassName}>F</Shortcut>
              </Item>
              <Separator className={separatorClassName} />
            </>
          ) : null}
          {showItemActions ? (
            <>
              <Item onClick={onOpenInTerminal} className={itemClassName}>
                Open in Integrated Terminal
              </Item>
              <Separator className={separatorClassName} />
              <Item onClick={onAddToChat} className={itemClassName}>
                Add Directory to Chat
              </Item>
              <Item onClick={onAddToNewChat} className={itemClassName}>
                Add Directory to New Chat
              </Item>
              <Separator className={separatorClassName} />
              <Item onClick={onFindInFolder} className={itemClassName}>
                Find in Folder...
                <Shortcut className={shortcutClassName}>Shift+Alt+F</Shortcut>
              </Item>
              <Separator className={separatorClassName} />
            </>
          ) : (
            <>
              <Item onClick={onOpenInTerminal} className={itemClassName}>
                Open in Integrated Terminal
              </Item>
              <Separator className={separatorClassName} />
              <Item onClick={onFindInFolder} className={itemClassName}>
                Find in Folder...
                <Shortcut className={shortcutClassName}>Shift+Alt+F</Shortcut>
              </Item>
              <Separator className={separatorClassName} />
            </>
          )}
        </>
      ) : (
        <>
          <Item onClick={onOpen} className={itemClassName}>
            Open
          </Item>
          <Separator className={separatorClassName} />
          <Item onClick={onAddToChat} className={itemClassName}>
            Add File to Chat
          </Item>
          <Item onClick={onAddToNewChat} className={itemClassName}>
            Add File to New Chat
          </Item>
          <Separator className={separatorClassName} />
        </>
      )}

      {showItemActions ? (
        <>
          {canEdit ? (
            <Item onClick={onCut} className={itemClassName}>
              Cut
              <Shortcut className={shortcutClassName}>X</Shortcut>
            </Item>
          ) : null}
          <Item onClick={onCopy} className={itemClassName}>
            Copy
            <Shortcut className={shortcutClassName}>Y</Shortcut>
          </Item>
          {canEdit ? (
            <Item
              onClick={onPaste}
              disabled={!canPaste}
              className={itemClassName}
            >
              Paste
              <Shortcut className={shortcutClassName}>P</Shortcut>
            </Item>
          ) : null}
          {canEdit && !isFolder ? (
            <Item onClick={onDuplicate} className={itemClassName}>
              Duplicate
            </Item>
          ) : null}
          <Separator className={separatorClassName} />
          <Item onClick={onCopyPath} className={itemClassName}>
            Copy Path
            <Shortcut className={shortcutClassName}>Shift+Alt+C</Shortcut>
          </Item>
          <Item onClick={onCopyRelativePath} className={itemClassName}>
            Copy Relative Path
            <Shortcut className={shortcutClassName}>
              Ctrl+M Ctrl+Shift+C
            </Shortcut>
          </Item>
          {canEdit ? (
            <>
              <Separator className={separatorClassName} />
              <Item onClick={onRename} className={itemClassName}>
                Rename...
                <Shortcut className={shortcutClassName}>R</Shortcut>
              </Item>
              <Item
                variant={menuType === "context" ? "destructive" : undefined}
                onClick={onDelete}
                className={destructiveClassName}
              >
                Delete
                <Shortcut className={shortcutClassName}>Delete</Shortcut>
              </Item>
            </>
          ) : null}
        </>
      ) : canPaste && canEdit ? (
        <Item onClick={onPaste} className={itemClassName}>
          Paste
          <Shortcut className={shortcutClassName}>P</Shortcut>
        </Item>
      ) : null}
    </Content>
  );
}
