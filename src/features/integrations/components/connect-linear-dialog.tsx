"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LinearConnectForm } from "@/features/integrations/components/linear-connect-form";

type ConnectLinearDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (apiKey: string) => Promise<unknown>;
  isConnecting: boolean;
};

export function ConnectLinearDialog({
  open,
  onOpenChange,
  onConnect,
  isConnecting,
}: ConnectLinearDialogProps) {
  const handleConnect = async (apiKey: string) => {
    await onConnect(apiKey);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Connect Linear</DialogTitle>
          <DialogDescription>
            Paste a personal API key from Linear settings. NovaStudio uses it to
            link issues and sync status when you push or deploy.
          </DialogDescription>
        </DialogHeader>

        <div className="py-1">
          <LinearConnectForm
            onConnect={handleConnect}
            isConnecting={isConnecting}
            autoFocus={open}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
