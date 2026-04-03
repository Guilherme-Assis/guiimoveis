import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications, formatRelativeDate } from "@/hooks/useNotifications";
import {
  Building2, Users, Home, LogOut, LayoutDashboard, UserCircle, ChevronRight, BookOpen, Contact, Menu, X, Bell, Clock, Check, CheckCheck,
  BarChart3, Columns3, CheckSquare, CalendarDays, FileText, Calendar, Download, Award, MessageSquare, ChevronDown,
  FileSignature, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const crmSubItems = [
  { label: "Dashboard", icon: BarChart3, tab: "dashboard" },
  { label: "Leads", icon: Users, tab: "leads" },
  { label: "Kanban", icon: Columns3, tab: "kanban" },
  { label: "Tarefas", icon: CheckSquare, tab: "tasks" },
  { label: "Visitas", icon: CalendarDays, tab: "visits" },
  { label: "Propostas", icon: FileText, tab: "proposals" },
  { label: "Calendário", icon: Calendar, tab: "calendar" },
  { label: "Relatórios", icon: Download, tab: "reports" },
  { label: "Comissões", icon: Award, tab: "commissions" },
  { label: "Templates", icon: MessageSquare, tab: "templates" },
  { label: "Contratos", icon: FileSignature, tab: "contracts" },
  { label: "Performance", icon: Trophy, tab: "performance" },
];

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin", roles: ["admin", "broker"] },
  { label: "Imóveis", icon: Building2, path: "/admin/properties", roles: ["admin", "broker"] },
  { label: "CRM", icon: Contact, path: "/admin/crm", roles: ["admin", "broker"], subItems: crmSubItems },
  { label: "Corretores", icon: Users, path: "/admin/brokers", roles: ["admin"] },
  { label: "Blog", icon: BookOpen, path: "/admin/blog", roles: ["admin"] },
  { label: "Meu Perfil", icon: UserCircle, path: "/admin/profile", roles: ["admin", "broker"] },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [crmOpen, setCrmOpen] = useState(location.pathname.startsWith("/admin/crm"));
  const { notifications, count, markAsRead, markAllAsRead } = useNotifications();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const filteredNav = navItems.filter((item) => role && item.roles.includes(role));

  const NotificationBell = () => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-border/50 bg-card" align="end" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
          <h4 className="text-sm font-semibold text-foreground">Notificações</h4>
          {count > 0 ? (
            <button
              onClick={() => markAllAsRead(notifications.map((n) => n.id))}
              className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <CheckCheck className="h-3 w-3" /> Marcar todas como lidas
            </button>
          ) : (
            <span className="text-[10px] font-medium text-muted-foreground">0 alertas</span>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Bell className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">Tudo em dia!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {notifications.slice(0, 15).map((notif) => (
                <div key={notif.id} className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${notif.color}`}>
                    <notif.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground leading-tight">{notif.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug truncate">{notif.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground whitespace-nowrap">
                      <Clock className="h-2.5 w-2.5" />
                      {formatRelativeDate(notif.date)}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                      className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground opacity-0 transition-all hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                      title="Marcar como lida"
                    >
                      <Check className="h-2.5 w-2.5" /> Lida
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold text-gradient-gold">ÉLITE</span>
          <span className="font-body text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Admin</span>
        </Link>
        <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <nav className="space-y-1 p-4">
          {filteredNav.map((item) => {
            const active = location.pathname === item.path && !item.subItems;
            const isCrmParent = !!item.subItems;
            const isCrmActive = isCrmParent && location.pathname.startsWith(item.path);

            if (isCrmParent) {
              return (
                <div key={item.path}>
                  <button
                    onClick={() => setCrmOpen((o) => !o)}
                    className={`flex w-full items-center gap-3 rounded px-3 py-2.5 font-body text-sm transition-colors ${
                      isCrmActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform duration-200 ${crmOpen ? "rotate-180" : ""}`} />
                  </button>
                  {crmOpen && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-border/40 pl-3">
                      {item.subItems!.map((sub) => {
                        const subActive = location.pathname === item.path && new URLSearchParams(location.search).get("tab") === sub.tab;
                        const isDefault = sub.tab === "dashboard" && location.pathname === item.path && !new URLSearchParams(location.search).get("tab");
                        const highlighted = subActive || isDefault;
                        return (
                          <Link
                            key={sub.tab}
                            to={`${item.path}?tab=${sub.tab}`}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2.5 rounded px-2.5 py-2 font-body text-xs transition-colors ${
                              highlighted
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            <sub.icon className="h-3.5 w-3.5" />
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
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
      </ScrollArea>

      <div className="border-t border-border p-4">
        <div className="mb-3 flex items-center gap-3 px-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 font-body text-xs font-semibold text-primary">
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="flex-1 font-body text-xs text-muted-foreground">
            <Home className="mr-1 h-3 w-3" /> Site
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex-1 font-body text-xs text-muted-foreground">
            <LogOut className="mr-1 h-3 w-3" /> Sair
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile top bar */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <button onClick={() => setSidebarOpen(true)} className="text-foreground">
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="font-display text-lg font-bold text-gradient-gold">ÉLITE</Link>
        <NotificationBell />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {sidebarContent}
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1 pt-14 lg:ml-64 lg:pt-0">
        {/* Desktop top bar with bell */}
        <div className="hidden lg:flex h-14 items-center justify-end border-b border-border bg-card px-6">
          <NotificationBell />
        </div>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
