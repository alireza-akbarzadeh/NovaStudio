"use client";

import { BellIcon, BellOffIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { usePushSubscription } from "@/features/notifications/hooks/use-push-subscription";
import {
  getSoundPrefs,
  playSoundIfEnabled,
  setSoundPrefs,
} from "@/features/notifications/lib/play-sound";
import { cn } from "@/lib/utils";

export function NotificationControls({ className }: { className?: string }) {
  const push = usePushSubscription();
  const [soundsOn, setSoundsOn] = useState(true);

  useEffect(() => {
    setSoundsOn(getSoundPrefs().enabled);
  }, []);

  const toggleSounds = () => {
    const next = setSoundPrefs({ enabled: !soundsOn });
    setSoundsOn(next.enabled);
    if (next.enabled) void playSoundIfEnabled("aiDone");
  };

  const togglePush = async () => {
    try {
      if (push.subscribed) {
        await push.disablePush();
        toast.success("Push notifications disabled");
      } else {
        await push.enablePush();
        toast.success("Push notifications enabled");
        void playSoundIfEnabled("success");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update push",
      );
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-9 rounded-xl"
        aria-label={soundsOn ? "Mute notification sounds" : "Enable sounds"}
        onClick={toggleSounds}
      >
        {soundsOn ? (
          <Volume2Icon className="size-4" />
        ) : (
          <VolumeXIcon className="size-4" />
        )}
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-9 rounded-xl"
        aria-label={
          push.subscribed ? "Disable push notifications" : "Enable push"
        }
        disabled={push.busy || !push.configured}
        onClick={() => void togglePush()}
      >
        {push.subscribed ? (
          <BellIcon className="size-4 text-primary" />
        ) : (
          <BellOffIcon className="size-4" />
        )}
      </Button>
    </div>
  );
}
