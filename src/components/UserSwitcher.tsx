import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Profile } from "@/types";

interface UserSwitcherProps {
  profiles: Profile[];
  currentUser: Profile;
  onSwitch: (profile: Profile) => void;
}

export function UserSwitcher({ profiles, currentUser, onSwitch }: UserSwitcherProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium px-1 mb-2">Switch Account</p>
      {profiles.map((p) => (
        <button
          key={p.id}
          onClick={() => onSwitch(p)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            p.id === currentUser.id
              ? "bg-primary/10 ring-1 ring-primary/30"
              : "hover:bg-muted"
          }`}
        >
          <Avatar className="h-9 w-9 ring-2 ring-border">
            <AvatarImage src={p.avatar_url || ""} />
            <AvatarFallback className="bg-muted text-xs">
              {p.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-left min-w-0">
            <p className="text-sm font-medium truncate">{p.username}</p>
            <p className="text-xs text-muted-foreground truncate">{p.display_name}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
