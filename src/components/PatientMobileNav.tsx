import { LayoutDashboard, MessageCircle, BookOpen, UtensilsCrossed, CalendarPlus, MoreHorizontal, Settings, LogOut, Target } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useUnreadFeedback } from "@/hooks/useNotificationBadges";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tabs = [
  { title: "Início", url: "/p", icon: LayoutDashboard, exact: true },
  { title: "Chat", url: "/p/chat", icon: MessageCircle },
  { title: "Diário", url: "/p/diario", icon: BookOpen },
  { title: "Planos", url: "/p/planos", icon: UtensilsCrossed },
];

export function PatientMobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const unreadCount = useUnreadMessages();
  const feedbackCount = useUnreadFeedback();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      {tabs.map((tab) => {
        const isActive = tab.exact ? location.pathname === tab.url : location.pathname.startsWith(tab.url);
        const badgeCount = tab.url === "/p/chat" ? unreadCount : tab.url === "/p/diario" ? feedbackCount : 0;
        const showBadge = badgeCount > 0;
        return (
          <NavLink
            key={tab.url}
            to={tab.url}
            className={cn(
              "mobile-nav-item flex flex-col items-center gap-0.5 rounded-md px-2 py-1 text-[10px] transition-colors",
              isActive ? "text-primary font-medium mobile-nav-active" : "text-muted-foreground"
            )}
          >
            <div className="relative">
              <tab.icon className={cn("nav-icon h-5 w-5")} />
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-md px-2 py-1 text-[10px] transition-colors text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="mb-2">
          <DropdownMenuItem onClick={() => navigate("/p/metas")}>
            <Target className="mr-2 h-4 w-4" />
            Minhas Metas
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/p/agendamento")}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Agendar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/p/configuracoes")}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
