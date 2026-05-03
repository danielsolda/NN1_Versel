import { useState, useEffect, useRef } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { MobileBottomNav } from "./MobileBottomNav";
import { AppSidebar } from "./AppSidebar";
import { PatientSidebar } from "./PatientSidebar";
import { PatientMobileNav } from "./PatientMobileNav";
import { PageBreadcrumb } from "@/components/shared/PageBreadcrumb";
import { Loader2 } from "lucide-react";
import { useAppointmentReminders } from "@/hooks/useAppointmentReminders";
import foodPatternBg from "@/assets/food-pattern-bg.png";


function AnimatedOutlet() {
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("page-transition-enter");
    // Force reflow
    void el.offsetWidth;
    el.classList.add("page-transition-enter");
  }, [location.pathname]);

  return (
    <div ref={ref} className="page-transition-enter">
      <Outlet />
    </div>
  );
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const isPatientChatRoute = location.pathname.startsWith("/p/chat");
  useAppointmentReminders();

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Redirect patients accessing "/" to "/p"
  if (role === "patient" && window.location.pathname === "/") {
    return <Navigate to="/p" replace />;
  }

  // Admin portal
  if (role === "admin") {
    if (location.pathname !== "/admin") {
      return <Navigate to="/admin" replace />;
    }

    return (
      <div className="flex min-h-screen w-full bg-background">
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.08]"
          style={{
            backgroundImage: `url(${foodPatternBg})`,
            backgroundSize: "1400px",
            backgroundRepeat: "repeat",
            maskImage: "linear-gradient(to bottom, transparent 5%, black 35%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 5%, black 35%)",
          }}
        />
        <main className="relative z-10 flex-1 overflow-x-hidden overflow-y-auto min-w-0">
          <PageBreadcrumb role={role} />
          <AnimatedOutlet />
        </main>
      </div>
    );
  }

  // Patient portal
  if (role === "patient") {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.08]"
          style={{
            backgroundImage: `url(${foodPatternBg})`,
            backgroundSize: "1400px",
            backgroundRepeat: "repeat",
            maskImage: "linear-gradient(to bottom, transparent 5%, black 35%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 5%, black 35%)",
          }}
        />
        <div className="hidden md:block relative z-10">
          <PatientSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>
        <main className={`relative z-10 flex-1 overflow-x-hidden overflow-y-auto ${isPatientChatRoute ? "pb-0" : "pb-20"} md:pb-0 min-w-0`}>
          <PageBreadcrumb role={role} />
          <AnimatedOutlet />
        </main>
        <PatientMobileNav />
      </div>
    );
  }

  // Nutritionist portal
  return (
    <div className="flex min-h-screen w-full bg-background">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.08]"
        style={{
          backgroundImage: `url(${foodPatternBg})`,
          backgroundSize: "1400px",
          backgroundRepeat: "repeat",
          maskImage: "linear-gradient(to bottom, transparent 5%, black 35%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 5%, black 35%)",
        }}
      />
      <div className="hidden md:block relative z-10">
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      <main className="relative z-10 flex-1 overflow-x-hidden overflow-y-auto pb-20 md:pb-0 min-w-0">
        <PageBreadcrumb role={role} />
        <AnimatedOutlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}
