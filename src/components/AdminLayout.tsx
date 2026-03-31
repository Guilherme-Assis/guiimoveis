import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Building2, Users, Home, LogOut, LayoutDashboard, UserCircle, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin", roles: ["admin", "broker"] },
  { label: "Imóveis", icon: Building2, path: "/admin/properties", roles: ["admin", "broker"] },
  { label: "Corretores", icon: Users, path: "/admin/brokers", roles: ["admin"] },
  { label: "Blog", icon: BookOpen, path: "/admin/blog", roles: ["admin"] },
  { label: "Meu Perfil", icon: UserCircle, path: "/admin/profile", roles: ["admin", "broker"] },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const filteredNav = navItems.filter((item) => role && item.roles.includes(role));

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-gradient-gold">ÉLITE</span>
            <span className="font-body text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {filteredNav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded px-3 py-2.5 font-body text-sm transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {active && <ChevronRight className="ml-auto h-3 w-3" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3 px-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-body text-xs font-semibold text-primary">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-xs text-foreground">{user?.email}</p>
              <p className="font-body text-[10px] uppercase tracking-wider text-primary">
                {role === "admin" ? "Administrador" : "Corretor"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex-1 font-body text-xs text-muted-foreground"
            >
              <Home className="mr-1 h-3 w-3" /> Site
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex-1 font-body text-xs text-muted-foreground"
            >
              <LogOut className="mr-1 h-3 w-3" /> Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
};

export default AdminLayout;
