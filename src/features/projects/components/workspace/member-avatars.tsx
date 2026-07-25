import { cn } from "@/lib/utils";

type Member = {
  name: string;
  initials: string;
  color: string;
};

type MemberAvatarsProps = {
  members: Member[];
  max?: number;
  size?: "sm" | "md";
};

export function MemberAvatars({
  members,
  max = 3,
  size = "sm",
}: MemberAvatarsProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;
  const dim = size === "sm" ? "size-6 text-[9px]" : "size-7 text-[10px]";

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((member) => (
        <span
          key={member.name}
          title={member.name}
          className={cn(
            "inline-flex items-center justify-center rounded-full border-2 border-card font-semibold text-white shadow-sm",
            dim,
          )}
          style={{ backgroundColor: member.color }}
        >
          {member.initials}
        </span>
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full border-2 border-card bg-muted font-semibold text-muted-foreground",
            dim,
          )}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
