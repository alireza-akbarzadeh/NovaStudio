"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FileTreeDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeName: string;
  isFolder: boolean;
  onConfirm: () => void;
};

export function FileTreeDeleteDialog({
  open,
  onOpenChange,
  nodeName,
  isFolder,
  onConfirm,
}: FileTreeDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-ws-border bg-ws-panel text-ws-text">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {nodeName}?</AlertDialogTitle>
          <AlertDialogDescription className="text-ws-text-muted">
            {isFolder
              ? "This will permanently delete this folder and all its contents."
              : "This will permanently delete this file."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-ws-border bg-ws-hover text-ws-text hover:bg-ws-border">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-ws-danger-bg text-white hover:bg-ws-danger-bg-hover"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
