import { Link, matchPath, useLocation } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import type { UserRole } from "@/hooks/useUserRole";

type Crumb = {
  label: string;
  href?: string;
};

function makeHomeCrumb(role: UserRole): Crumb {
  if (role === "patient") return { label: "Página inicial", href: "/p" };
  if (role === "admin") return { label: "Página inicial", href: "/admin" };
  return { label: "Página inicial", href: "/" };
}

function getNutritionistCrumbs(pathname: string, home: Crumb): Crumb[] {
  if (matchPath({ path: "/pacientes/:patientId", end: true }, pathname)) {
    return [home, { label: "Cadastros", href: "/pacientes" }, { label: "Pacientes", href: "/pacientes" }, { label: "Detalhe do paciente" }];
  }

  if (pathname === "/pacientes") return [home, { label: "Cadastros", href: "/pacientes" }, { label: "Pacientes" }];
  if (pathname === "/receitas") return [home, { label: "Cadastros", href: "/pacientes" }, { label: "Receitas" }];
  if (pathname === "/alimentos") return [home, { label: "Cadastros", href: "/pacientes" }, { label: "Alimentos" }];
  if (pathname === "/planos") return [home, { label: "Planejamento", href: "/planos" }, { label: "Planos Alimentares" }];
  if (pathname === "/metas") return [home, { label: "Planejamento", href: "/planos" }, { label: "Metas" }];
  if (pathname === "/agenda") return [home, { label: "Consultório", href: "/pacientes" }, { label: "Agenda" }];
  if (pathname === "/chat") return [home, { label: "Consultório", href: "/pacientes" }, { label: "Chat" }];
  if (pathname === "/diario") return [home, { label: "Consultório", href: "/pacientes" }, { label: "Diário Alimentar" }];
  if (pathname === "/indicadores") return [home, { label: "Gestão", href: "/indicadores" }, { label: "Indicadores" }];
  if (pathname === "/financeiro") return [home, { label: "Gestão", href: "/indicadores" }, { label: "Financeiro" }];
  if (pathname === "/configuracoes") return [home, { label: "Configurações" }];
  if (pathname === "/painel") return [home, { label: "Painel" }];
  if (pathname === "/admin") return [home, { label: "Admin" }];

  return [home];
}

function getPatientCrumbs(pathname: string, home: Crumb): Crumb[] {
  if (pathname === "/p") return [home];
  if (pathname === "/p/chat") return [home, { label: "Chat" }];
  if (pathname === "/p/diario") return [home, { label: "Diário Alimentar" }];
  if (pathname === "/p/planos") return [home, { label: "Meus Planos Alimentares" }];
  if (pathname === "/p/agendamento") return [home, { label: "Solicitar Agendamento" }];
  if (pathname === "/p/configuracoes") return [home, { label: "Configurações" }];
  if (pathname === "/p/metas") return [home, { label: "Minhas Metas" }];

  return [home];
}

function getCrumbs(pathname: string, role: UserRole): Crumb[] {
  const home = makeHomeCrumb(role);

  if (pathname === "/chat" || pathname === "/p/chat") {
    return [];
  }

  if (role === "patient") {
    return getPatientCrumbs(pathname, home);
  }

  return getNutritionistCrumbs(pathname, home);
}

export function PageBreadcrumb({ role }: { role: UserRole }) {
  const { pathname } = useLocation();
  const crumbs = getCrumbs(pathname, role);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb className="hidden sticky top-2 z-20 w-fit px-3 pt-2 text-[11px] sm:block sm:px-6 sm:pt-3 sm:text-xs">
      <BreadcrumbList className="gap-1 text-muted-foreground sm:gap-2">
        {crumbs.flatMap((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const items = [
            <BreadcrumbItem key={`crumb-${index}`}>
              {isLast || !crumb.href ? (
                <BreadcrumbPage className="text-primary/80">{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>,
          ];

          if (!isLast) {
            items.push(<BreadcrumbSeparator key={`separator-${index}`} />);
          }

          return items;
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default PageBreadcrumb;