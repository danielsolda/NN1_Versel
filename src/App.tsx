import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Pacientes from "@/pages/Pacientes";
import PacienteDetalhe from "@/pages/PacienteDetalhe";
import Agenda from "@/pages/Agenda";
import Planos from "@/pages/Planos";
import Chat from "@/pages/Chat";
import Diario from "@/pages/Diario";
import Indicadores from "@/pages/Indicadores";
import Financeiro from "@/pages/Financeiro";
import Metas from "@/pages/Metas";
import Alimentos from "@/pages/Alimentos";
import Receitas from "@/pages/Receitas";
import Configuracoes from "@/pages/Configuracoes";
import Painel from "@/pages/Painel";
import Admin from "@/pages/Admin";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import PatientChat from "@/pages/patient/PatientChat";
import PatientDiario from "@/pages/patient/PatientDiario";
import PatientPlanos from "@/pages/patient/PatientPlanos";
import PatientAgendamento from "@/pages/patient/PatientAgendamento";
import PatientConfiguracoes from "@/pages/patient/PatientConfiguracoes";
import PatientDashboard from "@/pages/patient/PatientDashboard";
import PatientMetas from "@/pages/patient/PatientMetas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<AppLayout />}>
            {/* Nutritionist routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/pacientes/:patientId" element={<PacienteDetalhe />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/planos" element={<Planos />} />
            <Route path="/receitas" element={<Receitas />} />
            <Route path="/alimentos" element={<Alimentos />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/diario" element={<Diario />} />
            <Route path="/indicadores" element={<Indicadores />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/metas" element={<Metas />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/painel" element={<Painel />} />
            <Route path="/admin" element={<Admin />} />
            {/* Patient routes */}
            <Route path="/p" element={<PatientDashboard />} />
            <Route path="/p/chat" element={<PatientChat />} />
            <Route path="/p/diario" element={<PatientDiario />} />
            <Route path="/p/planos" element={<PatientPlanos />} />
            <Route path="/p/agendamento" element={<PatientAgendamento />} />
            <Route path="/p/configuracoes" element={<PatientConfiguracoes />} />
            <Route path="/p/metas" element={<PatientMetas />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
