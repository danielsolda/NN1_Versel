import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  UtensilsCrossed,
  MessageCircle,
  BookOpen,
  BarChart3,
  DollarSign,
  Target,
  ChevronDown,
  ChevronRight,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  LayoutGrid,
  ChefHat,
  Apple,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import logoFull from "@/assets/logo-full.png";
import logoIcon from "@/assets/logo-icon.png";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { usePendingAppointments } from "@/hooks/useNotificationBadges";

const consultorioItems = [
  { title: "Pacientes", url: "/pacientes", icon: Users },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Chat", url: "/chat", icon: MessageCircle },
  { title: "Jornal Alimentar", url: "/diario", icon: BookOpen },
];

const planejamentoItems = [
  { title: "Planos Alimentares", url: "/planos", icon: UtensilsCrossed },
  { title: "Metas", url: "/metas", icon: Target },
];

const receitaAlimentosItems = [
  { title: "Receitas", url: "/receitas", icon: ChefHat },
  { title: "Alimentos", url: "/alimentos", icon: Apple },
];

const gestaoItems = [
  { title: "Indicadores", url: "/indicadores", icon: BarChart3 },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
];

interface SidebarSectionProps {
  title: string;
  items: { title: string; url: string; icon: React.ElementType }[];
  collapsed: boolean;
  defaultOpen?: boolean;
  unreadCount: number;
  pendingAppointments: number;
}

function SidebarSection({ title, items, collapsed, defaultOpen = true, unreadCount, pendingAppointments }: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const location = useLocation();

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 py-2">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.url);
          const badgeCount = item.url === "/chat" ? unreadCount : item.url === "/agenda" ? pendingAppointments : 0;
          const showBadge = badgeCount > 0;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                isActive
                  ? "bg-surface-active text-surface-active-foreground"
                  : "text-sidebar-foreground/70 hover:bg-surface-hover hover:text-surface-hover-foreground"
              )}
              title={item.title}
            >
              <item.icon className="nav-icon h-4 w-4" />
              {showBadge && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                  {badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    );
  }

  return (
    <div className="px-3 py-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1 py-1.5 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {title}
      </button>
      {open && (
        <div className="mt-0.5 flex flex-col gap-0.5">
          {items.map((item) => {
            const isActive = location.pathname.startsWith(item.url);
            const badgeCount = item.url === "/chat" ? unreadCount : item.url === "/agenda" ? pendingAppointments : 0;
            const showBadge = badgeCount > 0;
            return (
              <NavLink
                key={item.url}
                to={item.url}
                className={cn(
                  "nav-item-hover flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm",
                  isActive
                    ? "nav-item-active bg-surface-active text-surface-active-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-surface-hover hover:text-surface-hover-foreground"
                )}
              >
                <item.icon className="nav-icon h-4 w-4 shrink-0" />
                <span className="flex-1">{item.title}</span>
                {showBadge && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const isDashboardActive = location.pathname === "/";
  const unreadCount = useUnreadMessages();
  const pendingAppointments = usePendingAppointments();

  return (
    <aside
      className={cn(
        "flex h-screen sticky top-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center border-b border-sidebar-border", collapsed ? "justify-center p-2" : "justify-between px-4 py-3")}>
        {!collapsed && (
          <>
            <div className="flex items-center gap-2">
              <img src={logoIcon} alt="NotionDiet" className="h-8 w-8" />
              <span className="text-base font-semibold text-sidebar-foreground tracking-tight">NotionDiet</span>
            </div>
            <button
              onClick={onToggle}
              className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/50 hover:bg-surface-hover hover:text-surface-hover-foreground transition-colors"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        )}
        {collapsed && (
          <div className="flex flex-col items-center gap-2">
            <img src={logoIcon} alt="NotionDiet" className="h-8 w-8" />
            <button
              onClick={onToggle}
              className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/50 hover:bg-surface-hover hover:text-surface-hover-foreground transition-colors"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Link */}
      <div className={cn(collapsed ? "flex justify-center py-2" : "px-3 py-2")}>
        {collapsed ? (
          <NavLink
            to="/"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              isDashboardActive
                ? "bg-surface-active text-surface-active-foreground"
                : "text-sidebar-foreground/70 hover:bg-surface-hover hover:text-surface-hover-foreground"
            )}
            title="Início"
          >
            <LayoutDashboard className="nav-icon h-4 w-4" />
          </NavLink>
        ) : (
          <NavLink
            to="/"
            end
            className={cn(
              "nav-item-hover flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm",
              isDashboardActive
                ? "nav-item-active bg-surface-active text-surface-active-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-surface-hover hover:text-surface-hover-foreground"
            )}
          >
            <LayoutDashboard className="nav-icon h-4 w-4" />
            <span>Início</span>
          </NavLink>
        )}
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto">
        <SidebarSection
          title="Consultório"
          items={consultorioItems}
          collapsed={collapsed}
          unreadCount={unreadCount}
          pendingAppointments={pendingAppointments}
        />
        <SidebarSection
          title="Planejamento"
          items={planejamentoItems}
          collapsed={collapsed}
          unreadCount={unreadCount}
          pendingAppointments={pendingAppointments}
        />
        <SidebarSection
          title="Receitas e Alimentos"
          items={receitaAlimentosItems}
          collapsed={collapsed}
          unreadCount={unreadCount}
          pendingAppointments={pendingAppointments}
        />
        <SidebarSection
          title="Gestão"
          items={gestaoItems}
          collapsed={collapsed}
          unreadCount={unreadCount}
          pendingAppointments={pendingAppointments}
        />
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-sidebar-border", collapsed ? "flex flex-col items-center gap-1 py-2" : "px-3 py-2 space-y-0.5")}>
        {collapsed ? (
          <>
            <NavLink
              to="/painel"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                location.pathname === "/painel"
                  ? "bg-surface-active text-surface-active-foreground"
                  : "text-sidebar-foreground/50 hover:bg-surface-hover hover:text-surface-hover-foreground"
              )}
              title="Painel"
            >
              <LayoutGrid className="h-4 w-4" />
            </NavLink>
            <NavLink
              to="/configuracoes"
              className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/50 hover:bg-surface-hover hover:text-surface-hover-foreground transition-colors"
              title="Configurações"
            >
              <Settings className="h-4 w-4" />
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/painel"
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                location.pathname === "/painel"
                  ? "bg-surface-active text-surface-active-foreground font-medium"
                  : "text-sidebar-foreground/50 hover:bg-surface-hover hover:text-surface-hover-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Painel</span>
            </NavLink>
            <NavLink
              to="/configuracoes"
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/50 hover:bg-surface-hover hover:text-surface-hover-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </NavLink>
          </>
        )}
      </div>
    </aside>
  );
}
