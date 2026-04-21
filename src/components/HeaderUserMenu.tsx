import { Link } from "react-router-dom";
import { LayoutDashboard, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderUserMenuProps {
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
  email?: string;
  role: "admin" | "broker" | null;
  onSignOut: () => void;
}

export default function HeaderUserMenu({
  displayName,
  initials,
  avatarUrl,
  email,
  role,
  onSignOut,
}: HeaderUserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-border bg-card/80 py-1.5 pl-1.5 pr-3 transition-colors hover:border-primary/50">
          <Avatar className="h-7 w-7">
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <span className="max-w-[100px] truncate font-body text-sm text-foreground">{displayName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="font-body text-sm font-medium text-foreground">{displayName}</p>
          <p className="font-body text-xs text-muted-foreground">{email}</p>
          {role && (
            <span className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-primary">
              {role}
            </span>
          )}
        </div>
        <DropdownMenuSeparator />
        {role && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="flex cursor-pointer items-center gap-2">
              <LayoutDashboard className="h-4 w-4" /> Painel Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/admin/profile" className="flex cursor-pointer items-center gap-2">
            <User className="h-4 w-4" /> Meu Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
