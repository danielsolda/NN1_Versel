import { useState } from "react";
import {
  MessageCircle,
  BookOpen,
  UtensilsCrossed,
  CalendarPlus,
  Settings,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Target,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import logoFull from "@/assets/logo-full.png";
import logoIcon from "@/assets/logo-icon.png";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useUnreadFeedback } from "@/hooks/useNotificationBadges";

const acompanhamentoItems = [
  { title: "Chat", url: "/p/chat", icon: MessageCircle },
  { title: "Diário Alimentar", url: "/p/diario", icon: BookOpen },
];

const alimentacaoItems = [
  { title: "Meus Planos", url: "/p/planos", icon: UtensilsCrossed },
  { title: "Minhas Metas", url: "/p/metas", icon: Target },
];

const atendimentoItems = [
  { title: "Solicitar Agendamento", url: "/p/agendamento", icon: CalendarPlus },
];

interface SectionProps {
  title: string;
  items: { title: string; url: string; icon: React.ElementType }[];
  collapsed: boolean;
  defaultOpen?: boolean;
}

function SidebarSection({ title, items, collapsed, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const location = useLocation();
  const unreadCount = useUnreadMessages();
  const feedbackCount = useUnreadFeedback();

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 py-2">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.url);
          const badgeCount = item.url === "/p/chat" ? unreadCount : item.url === "/p/diario" ? feedbackCount : 0;
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
              const badgeCount = item.url === "/p/chat" ? unreadCount : item.url === "/p/diario" ? feedbackCount : 0;
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

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

export function PatientSidebar({ collapsed, onToggle }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboardActive = location.pathname === "/p";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

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
            <button onClick={onToggle} className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/50 hover:bg-surface-hover hover:text-surface-hover-foreground transition-colors">
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        )}
        {collapsed && (
          <div className="flex flex-col items-center gap-2">
            <img src={logoIcon} alt="NotionDiet" className="h-8 w-8" />
            <button onClick={onToggle} className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/50 hover:bg-surface-hover hover:text-surface-hover-foreground transition-colors">
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Link */}
      <div className={cn(collapsed ? "flex justify-center py-2" : "px-3 py-2")}>
        {collapsed ? (
          <NavLink
            to="/p"
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
            to="/p"
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
        <SidebarSection title="Meu Acompanhamento" items={acompanhamentoItems} collapsed={collapsed} />
        <SidebarSection title="Alimentação" items={alimentacaoItems} collapsed={collapsed} />
        <SidebarSection title="Atendimento" items={atendimentoItems} collapsed={collapsed} />
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-sidebar-border", collapsed ? "flex flex-col items-center gap-1 py-2" : "px-3 py-2 space-y-0.5")}>
        {collapsed ? (
          <>
            <NavLink
              to="/p/configuracoes"
              className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/50 hover:bg-surface-hover hover:text-surface-hover-foreground transition-colors"
              title="Configurações"
            >
                <Settings className="h-4 w-4" />
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/50 hover:bg-surface-hover hover:text-surface-hover-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/p/configuracoes"
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/50 hover:bg-surface-hover hover:text-surface-hover-foreground transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/50 hover:bg-surface-hover hover:text-surface-hover-foreground transition-colors"
            >
                <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
