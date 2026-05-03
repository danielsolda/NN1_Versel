import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageCircle,
  UtensilsCrossed,
  ChevronUp,
  BookOpen,
  BarChart3,
  DollarSign,
  Target,
  LayoutGrid,
  Settings,
  ChefHat,
  Apple,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { usePendingAppointments } from "@/hooks/useNotificationBadges";

const mainTabs = [
  { title: "Início", url: "/", icon: LayoutDashboard, exact: true },
  { title: "Pacientes", url: "/pacientes", icon: Users },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Chat", url: "/chat", icon: MessageCircle },
  { title: "Planos", url: "/planos", icon: UtensilsCrossed },
];

const extraTabs = [
  { title: "Diário", url: "/diario", icon: BookOpen },
  { title: "Receitas", url: "/receitas", icon: ChefHat },
  { title: "Alimentos", url: "/alimentos", icon: Apple },
  { title: "Indicadores", url: "/indicadores", icon: BarChart3 },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Metas", url: "/metas", icon: Target },
  { title: "Painel", url: "/painel", icon: LayoutGrid },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const unreadCount = useUnreadMessages();
  const pendingAppointments = usePendingAppointments();
  const isActive = (url: string, exact?: boolean) =>
    exact ? location.pathname === url : location.pathname.startsWith(url);

  const isExtraActive = extraTabs.some((tab) => isActive(tab.url));

  return (
    <>
      {/* Overlay */}
      {expanded && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Extra tabs panel */}
      <div
        className={cn(
          "fixed left-0 right-0 z-50 md:hidden transition-all duration-300 ease-out border-t border-border bg-background rounded-t-2xl",
          expanded
            ? "bottom-[calc(3.25rem+env(safe-area-inset-bottom))] translate-y-0 opacity-100"
            : "bottom-[calc(3.25rem+env(safe-area-inset-bottom))] translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="grid grid-cols-3 gap-1 px-4 py-3">
          {extraTabs.map((tab) => {
            const active = isActive(tab.url);
            return (
              <NavLink
                key={tab.url}
                to={tab.url}
                onClick={() => setExpanded(false)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] transition-colors",
                  active
                    ? "bg-primary/10 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent"
                )}
              >
                <tab.icon className={cn("h-5 w-5", active && "text-primary")} />
                <span>{tab.title}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Main bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
        {mainTabs.map((tab) => {
          const active = isActive(tab.url, tab.exact);
          const badgeCount = tab.url === "/chat" ? unreadCount : tab.url === "/agenda" ? pendingAppointments : 0;
          const showBadge = badgeCount > 0;
          return (
            <NavLink
              key={tab.url}
              to={tab.url}
              end={tab.exact}
              className={cn(
                "mobile-nav-item relative flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] transition-colors",
                active
                  ? "text-foreground font-medium mobile-nav-active"
                  : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <tab.icon className={cn("nav-icon h-5 w-5", active && "text-primary")} />
                {showBadge && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                    {badgeCount}
                  </span>
                )}
              </div>
              <span>{tab.title}</span>
            </NavLink>
          );
        })}

        {/* Expand button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] transition-colors",
            expanded || isExtraActive
              ? "text-foreground font-medium"
              : "text-muted-foreground"
          )}
        >
          <ChevronUp
            className={cn(
              "h-5 w-5 transition-transform duration-300",
              expanded && "rotate-180",
              (expanded || isExtraActive) && "text-primary"
            )}
          />
          <span>Mais</span>
        </button>
      </nav>
    </>
  );
}
