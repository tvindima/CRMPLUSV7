'use client';

import { useEffect, useState, useMemo } from "react";
import {
  SparklesIcon,
  BoltIcon,
  CalendarIcon,
  UserGroupIcon,
  HomeIcon,
  CheckCircleIcon,
  UserIcon,
  ChartBarIcon,
  MegaphoneIcon,
  CalculatorIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CurrencyEuroIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowsRightLeftIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getBackofficeProperties } from "@/src/services/backofficeApi";
import { getSession } from "../../../src/services/auth";
import {
  getDashboardKPIs,
  getPropertiesByConcelho,
  getPropertiesByTipologia,
  getPropertiesByStatus,
  getAgentsRanking,
  getRecentLeads,
  getTodayTasks,
  getRecentActivities,
  distributeLeadsAuto,
  assignLeadToAgent,
} from "@/src/services/dashboardApi";
import Image from "next/image";
import { useTenant } from "@/context/TenantContext";
import { useTerminology } from "@/context/TerminologyContext";

type KPI = {
  title: string;
  value: string | number;
  icon: any;
  iconColor: string;
  bgGradient: string;
  trend?: string;
  trendUp?: boolean;
};

type Agent = {
  id: number;
  name: string;
  avatar: string;
  role: string;
  leads: number;
  propostas: number;
  visitas: number;
  performance: number;
  rank: number;
};

type Lead = {
  id: number;
  cliente: string;
  tipo: string;
  status: string; // Aceita qualquer status (new, contacted, qualified, etc.)
  responsavel?: string;
  data: string;
  tempo: string;
};

type Task = {
  id: number;
  tipo: 'reuniao' | 'chamada' | 'visita' | 'revisao';
  titulo: string;
  responsavel: string;
  hora: string;
  urgente: boolean;
};

type Activity = {
  id: number;
  user: string;
  avatar: string;
  acao: string;
  tipo: 'criou' | 'editou' | 'completou' | 'atribuiu';
  time: string;
};

// Dados vazios como fallback - sem mocks
const emptyAgents: Agent[] = [];
const emptyLeads: Lead[] = [];
const emptyTasks: Task[] = [];
const emptyActivities: Activity[] = [];

// Dados vazios para gráficos - serão preenchidos pela API
const emptyBarData: { label: string; value: number }[] = [];
const emptyPieData: { label: string; value: number; color: string }[] = [];
const emptyStatusData: { label: string; value: number; color: string }[] = [];

const GlowCard = ({ children, className = "", onClick, tooltip }: { children: React.ReactNode; className?: string; onClick?: () => void; tooltip?: string }) => (
  <div
    onClick={onClick}
    className={clsx(
      "relative group rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 p-[1px]",
      "transition-all duration-300",
      "hover:scale-[1.02]",
      onClick && "cursor-pointer",
      className
    )}
    title={tooltip}
  >
    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
    <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-xl p-3 sm:p-4 md:p-6 backdrop-blur-xl border border-white/5">
      {children}
    </div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { sector, isAutomotive, isRealEstate } = useTenant();
  const { term } = useTerminology();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Coordenadora");
  const [userRole, setUserRole] = useState<'agent' | 'coordinator' | 'admin'>('coordinator');
  
  // Labels dinâmicos baseados no sector
  const itemsLabel = term('items', 'Propriedades');
  const itemsActiveLabel = `${itemsLabel} ${sector === 'automotive' ? 'em Stock' : 'Ativas'}`;
  const itemIcon = isAutomotive ? TruckIcon : HomeIcon;
  const agentsLabel = term('agents', 'Agentes');
  const visitsLabel = term('visits', 'Visitas');
  
  const [kpis, setKpis] = useState<KPI[]>([
    { title: itemsActiveLabel, value: "0", icon: itemIcon, iconColor: "text-purple-400", bgGradient: "from-purple-500/20 to-pink-500/20", trend: "0%", trendUp: false },
    { title: "Novas Leads (7d)", value: "0", icon: SparklesIcon, iconColor: "text-blue-400", bgGradient: "from-blue-500/20 to-cyan-500/20", trend: "0%", trendUp: false },
    { title: "Propostas em Aberto", value: "0", icon: DocumentTextIcon, iconColor: "text-orange-400", bgGradient: "from-orange-500/20 to-red-500/20", trend: "0%", trendUp: false },
    { title: `${agentsLabel} Ativos`, value: "0", icon: UserGroupIcon, iconColor: "text-green-400", bgGradient: "from-green-500/20 to-emerald-500/20" },
  ]);
  
  // Estados para dados da API (inicializar vazios)
  const [agents, setAgents] = useState<Agent[]>(emptyAgents);
  const [leads, setLeads] = useState<Lead[]>(emptyLeads);
  const [tasks, setTasks] = useState<Task[]>(emptyTasks);
  const [activities, setActivities] = useState<Activity[]>(emptyActivities);
  const [barChartData, setBarChartData] = useState(emptyBarData);
  const [pieChartData, setPieChartData] = useState(emptyPieData);
  const [statusChartData, setStatusChartData] = useState(emptyStatusData);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  
  // Estado para escrituras
  const [escriturasStats, setEscriturasStats] = useState({
    agendadas: 0,
    docs_ok: 0,
    docs_pendentes: 0,
  });

  // Calcular progresso das tarefas
  const tasksProgress = tasks.length > 0 
    ? `${completedTasks.length}/${tasks.length} realizadas`
    : 'Nenhuma tarefa para hoje';
  const tasksProgressPercent = tasks.length > 0 
    ? (completedTasks.length / tasks.length) * 100 
    : 0;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const session = await getSession();
      if (session?.email) {
        const emailName = session.email.split('@')[0];
        const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        setUserName(displayName);
        const role = session.role || 'coordinator';
        setUserRole(role as 'agent' | 'coordinator' | 'admin');
      }

      // Carregar KPIs
      try {
        const kpisData = await getDashboardKPIs();
        setKpis([
          { 
            title: itemsActiveLabel, 
            value: kpisData.propriedades_ativas.toString(), 
            icon: itemIcon, 
            iconColor: "text-purple-400", 
            bgGradient: "from-purple-500/20 to-pink-500/20",
            trend: kpisData.trends.propriedades,
            trendUp: kpisData.trends.propriedades_up
          },
          { 
            title: "Novas Leads (7d)", 
            value: kpisData.novas_leads_7d.toString(), 
            icon: SparklesIcon, 
            iconColor: "text-blue-400", 
            bgGradient: "from-blue-500/20 to-cyan-500/20",
            trend: kpisData.trends.leads,
            trendUp: kpisData.trends.leads_up
          },
          { 
            title: "Propostas em Aberto", 
            value: kpisData.propostas_abertas.toString(),
            icon: DocumentTextIcon, 
            iconColor: "text-orange-400", 
            bgGradient: "from-orange-500/20 to-red-500/20",
            trend: kpisData.trends.propostas,
            trendUp: kpisData.trends.propostas_up
          },
          { 
            title: `${agentsLabel} Ativos`, 
            value: kpisData.agentes_ativos.toString(), 
            icon: UserGroupIcon, 
            iconColor: "text-green-400", 
            bgGradient: "from-green-500/20 to-emerald-500/20"
          },
        ]);
        
        // Atualizar estatísticas de escrituras
        setEscriturasStats({
          agendadas: kpisData.escrituras_agendadas || 0,
          docs_ok: kpisData.escrituras_docs_ok || 0,
          docs_pendentes: kpisData.escrituras_docs_pendentes || 0,
        });
      } catch (error) {
        console.error("Erro ao carregar KPIs:", error);
      }

      // Carregar distribuições
      try {
        const concelho = await getPropertiesByConcelho();
        setBarChartData(concelho);
      } catch (error) {
        console.error("Erro ao carregar distribuição por concelho:", error);
      }

      try {
        const tipologia = await getPropertiesByTipologia();
        setPieChartData(tipologia.map(t => ({
          ...t,
          color: t.color || "#6b7280"
        })));
      } catch (error) {
        console.error("Erro ao carregar distribuição por tipologia:", error);
      }

      try {
        const status = await getPropertiesByStatus();
        setStatusChartData(status.map(s => ({
          ...s,
          color: s.color || "#6b7280"
        })));
      } catch (error) {
        console.error("Erro ao carregar distribuição por status:", error);
      }

      // Carregar ranking de agentes
      try {
        const ranking = await getAgentsRanking();
        setAgents(ranking);
      } catch (error) {
        console.error("Erro ao carregar ranking:", error);
      }

      // Carregar leads recentes
      try {
        const recentLeads = await getRecentLeads(4);
        setLeads(recentLeads.map(l => ({
          id: l.id,
          cliente: l.cliente,
          tipo: l.tipo,
          status: l.status as Lead['status'],
          responsavel: l.responsavel || undefined,
          data: l.tempo,
          tempo: l.tempo
        })));
      } catch (error) {
        console.error("Erro ao carregar leads:", error);
      }

      // Carregar tarefas
      try {
        const todayTasks = await getTodayTasks();
        setTasks(todayTasks.map(t => ({
          id: t.id,
          tipo: t.tipo as 'reuniao' | 'chamada' | 'visita' | 'revisao',
          titulo: t.titulo,
          responsavel: t.responsavel,
          hora: t.hora,
          urgente: t.urgente
        })));
      } catch (error) {
        console.error("Erro ao carregar tarefas:", error);
      }

      // Carregar atividades
      try {
        const recentActivities = await getRecentActivities(4);
        setActivities(recentActivities.map(a => ({
          id: parseInt(a.id.split('_')[1]) || 0,
          user: a.user,
          avatar: a.avatar,
          acao: a.acao,
          tipo: a.tipo as 'criou' | 'editou' | 'completou' | 'atribuiu',
          time: a.time
        })));
      } catch (error) {
        console.error("Erro ao carregar atividades:", error);
      }

    } catch (error) {
      console.error("Erro geral ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeAuto = async () => {
    try {
      const result = await distributeLeadsAuto("workload-balanced");
      alert(`✅ ${result.distributed} leads distribuídas com sucesso!`);
      // Recarregar dados
      loadDashboardData();
    } catch (error) {
      console.error("Erro ao distribuir leads:", error);
      alert("❌ Erro ao distribuir leads automaticamente");
    }
  };

  const getStatusBadge = (status: Lead['status']) => {
    const badges: Record<string, { text: string; color: string }> = {
      // Status em português
      nova: { text: "Nova", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      qualificada: { text: "Qualificada", color: "bg-green-500/20 text-green-400 border-green-500/30" },
      contacto: { text: "Contacto", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
      pendente: { text: "Pendente", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
      // Status em inglês (vindo do backend)
      new: { text: "Nova", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
      contacted: { text: "Contactada", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
      qualified: { text: "Qualificada", color: "bg-green-500/20 text-green-400 border-green-500/30" },
      proposal_sent: { text: "Proposta Enviada", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
      visit_scheduled: { text: `${visitsLabel.slice(0, -1)} Agendada`, color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
      negotiation: { text: "Em Negociação", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
      converted: { text: "Convertida", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
      lost: { text: "Perdida", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    };
    return badges[status] || { text: status, color: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
  };

  const getTaskIcon = (tipo: Task['tipo']) => {
    const icons = {
      reuniao: UserGroupIcon,
      chamada: PhoneIcon,
      visita: itemIcon,
      revisao: DocumentTextIcon,
    };
    return icons[tipo];
  };

  const getActivityColor = (tipo: Activity['tipo']) => {
    const colors = {
      criou: "text-green-400",
      editou: "text-blue-400",
      completou: "text-purple-400",
      atribuiu: "text-orange-400",
    };
    return colors[tipo];
  };

  const toggleTaskComplete = (taskId: number) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleKpiClick = (kpiTitle: string) => {
    // Navegar baseado no título do KPI (considera terminologia dinâmica)
    if (kpiTitle.includes(agentsLabel)) {
      router.push('/backoffice/agents');
    } else if (kpiTitle.includes('Leads')) {
      router.push('/backoffice/leads');
    } else if (kpiTitle.includes(itemsLabel) || kpiTitle.includes('Stock') || kpiTitle.includes('Ativ')) {
      router.push('/backoffice/properties');
    }
  };

  if (loading) {
    return (
      <BackofficeLayout title="Dashboard">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </BackofficeLayout>
    );
  }

  return (
    <BackofficeLayout title="Dashboard">
      <div className="p-6 max-w-[1920px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-2">
              Visão geral
            </h1>
            <p className="text-neutral-400 text-lg">
              Dashboard de gestão e monitorização da agência
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {/* Implementar exportação CSV */}}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all"
              title="Exportar dados do dashboard para CSV"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Exportar</span>
            </button>
            <button
              onClick={() => router.push('/backoffice/settings')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all"
              title="Configurações do sistema"
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Configurações</span>
            </button>
            <button
              onClick={async () => {
                if (confirm('⚠️ Tem certeza que deseja sair?')) {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    router.push('/backoffice/login');
                  } catch (error) {
                    console.error('Erro ao fazer logout:', error);
                  }
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-all border border-red-500/30"
              title="Sair do sistema"
            >
              <UserIcon className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Logout</span>
            </button>
          </div>
        </motion.div>

        {/* KPIs Principais */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
        >
          {kpis.map((kpi, index) => {
            const isZero = kpi.value === "0" || kpi.value === 0;
            const tooltipText = isZero 
              ? `Clique para ir para ${kpi.title.toLowerCase()}` 
              : `${kpi.value} ${kpi.title.toLowerCase()} - Clique para detalhes`;
            
            return (
              <GlowCard 
                key={index} 
                onClick={() => handleKpiClick(kpi.title)}
                tooltip={tooltipText}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "p-2 sm:p-3 rounded-lg bg-gradient-to-br flex-shrink-0",
                      kpi.bgGradient
                    )}>
                      <kpi.icon className={clsx("w-6 h-6 sm:w-8 sm:h-8", kpi.iconColor)} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-neutral-400">{kpi.title}</p>
                      <p className="text-2xl sm:text-3xl font-bold text-white">
                        {kpi.value}
                      </p>
                      {isZero && (
                        <p className="text-xs text-neutral-500 mt-1">Nenhum registo</p>
                      )}
                    </div>
                  </div>
                  {kpi.trend && !isZero && (
                    <div className={clsx(
                      "flex items-center gap-1 text-xs sm:text-sm font-medium self-end sm:self-auto",
                      kpi.trendUp ? "text-green-400" : "text-red-400"
                    )}>
                      <ArrowTrendingUpIcon className={clsx("w-3 h-3 sm:w-4 sm:h-4", !kpi.trendUp && "rotate-180")} />
                      <span>{kpi.trend}</span>
                    </div>
                  )}
                </div>
              </GlowCard>
            );
          })}
        </motion.div>

        {/* Cartões de Escrituras */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6"
        >
          {/* Total Escrituras Agendadas */}
          <GlowCard 
            onClick={() => router.push('/backoffice/escrituras')}
            tooltip="Ver todas as escrituras agendadas"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex-shrink-0">
                <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-neutral-400">📜 Escrituras Agendadas</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-400">
                  {escriturasStats.agendadas}
                </p>
              </div>
            </div>
          </GlowCard>

          {/* Dossiers Prontos */}
          <GlowCard 
            onClick={() => router.push('/backoffice/escrituras?status=documentacao_ok')}
            tooltip="Escrituras com documentação completa"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex-shrink-0">
                <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-neutral-400">✅ Dossier Pronto</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-400">
                  {escriturasStats.docs_ok}
                </p>
              </div>
            </div>
          </GlowCard>

          {/* Dossiers Pendentes */}
          <GlowCard 
            onClick={() => router.push('/backoffice/escrituras?pendentes_documentacao=true')}
            tooltip="Escrituras que precisam de documentação - ATENÇÃO"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex-shrink-0">
                <ClockIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-neutral-400">⚠️ Falta Preparar Dossier</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-400">
                  {escriturasStats.docs_pendentes}
                </p>
                {escriturasStats.docs_pendentes > 0 && (
                  <p className="text-xs text-red-400/70 mt-1">Requer atenção!</p>
                )}
              </div>
            </div>
          </GlowCard>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Coluna Principal (2/3) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Gráficos de Distribuição */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
            >
              {/* Items por Concelho */}
              <GlowCard tooltip={`Distribuição de ${term('item_plural', 'propriedades')} por concelho`}>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-purple-400" />
                  Por Concelho
                </h3>
                <div className="space-y-3">
                  {barChartData.length === 0 ? (
                    <p className="text-xs text-neutral-500 text-center py-4">Sem dados disponíveis</p>
                  ) : (
                    barChartData.map((item, index) => {
                      const maxValue = Math.max(...barChartData.map((d) => d.value));
                      const percentage = (item.value / maxValue) * 100;
                      return (
                        <div key={index} title={`${item.label}: ${item.value} ${term('item_plural', 'propriedades')}`}>
                          <div className="flex justify-between mb-1 text-xs">
                            <span className="text-neutral-300">{item.label}</span>
                            <span className="text-neutral-400">{item.value}</span>
                          </div>
                          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </GlowCard>

              {/* Distribuição por Tipologia */}
              <GlowCard tooltip={`Distribuição de ${term('item_plural', 'propriedades')} por ${isAutomotive ? 'segmento' : 'tipologia'}`}>
                <h3 className="text-sm font-semibold text-white mb-4">
                  Por {isAutomotive ? 'Segmento' : 'Tipologia'}
                </h3>
                <div className="space-y-2">
                  {pieChartData.length === 0 ? (
                    <p className="text-xs text-neutral-500 text-center py-4">Sem dados disponíveis</p>
                  ) : (
                    pieChartData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between" title={`${item.label}: ${item.value}%`}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-neutral-300">{item.label}</span>
                        </div>
                        <span className="text-xs font-medium text-white">{item.value}%</span>
                      </div>
                    ))
                  )}
                </div>
              </GlowCard>

              {/* Distribuição por Estado */}
              <GlowCard tooltip={`Distribuição de ${term('item_plural', 'propriedades')} por estado (Disponível, Reservado, ${isAutomotive ? 'Vendido' : 'Vendido'})`}>
                <h3 className="text-sm font-semibold text-white mb-4">
                  Por Estado
                </h3>
                <div className="space-y-2">
                  {statusChartData.length === 0 ? (
                    <p className="text-xs text-neutral-500 text-center py-4">Sem dados disponíveis</p>
                  ) : (
                    statusChartData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between" title={`${item.label}: ${item.value}%`}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-neutral-300">{item.label}</span>
                        </div>
                        <span className="text-xs font-medium text-white">{item.value}%</span>
                      </div>
                    ))
                  )}
                </div>
              </GlowCard>
            </motion.div>

            {/* Gestão da Equipa - Ranking Semanal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <GlowCard>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TrophyIcon className="w-5 h-5 text-yellow-400" />
                    Ranking Semanal da Equipa
                  </h3>
                  <button
                    onClick={() => router.push('/backoffice/equipa')}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Ver todos →
                  </button>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-all cursor-pointer"
                      onClick={() => router.push(`/backoffice/equipa/${agent.id}`)}
                    >
                      {/* Rank Badge */}
                      <div className={clsx(
                        "flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full font-bold text-xs sm:text-sm flex-shrink-0",
                        agent.rank === 1 && "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900",
                        agent.rank === 2 && "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900",
                        agent.rank === 3 && "bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900",
                        agent.rank > 3 && "bg-neutral-700 text-neutral-300"
                      )}>
                        {agent.rank}
                      </div>

                      {/* Avatar */}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-400" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-white truncate">{agent.name}</p>
                        <p className="text-xs text-neutral-400 hidden sm:block">{agent.role}</p>
                      </div>

                      {/* Stats - ocultar em mobile */}
                      <div className="hidden md:flex items-center gap-3 lg:gap-6 text-xs">
                        <div className="text-center">
                          <p className="font-bold text-white">{agent.leads}</p>
                          <p className="text-neutral-400">Leads</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-white">{agent.propostas}</p>
                          <p className="text-neutral-400">Propostas</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-white">{agent.visitas}</p>
                          <p className="text-neutral-400">{visitsLabel}</p>
                        </div>
                      </div>

                      {/* Performance Bar */}
                      <div className="hidden lg:block w-20 xl:w-24">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-neutral-400">Performance</span>
                          <span className="text-xs font-medium text-white">{agent.performance}%</span>
                        </div>
                        <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                            style={{ width: `${agent.performance}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlowCard>
            </motion.div>

            {/* Leads Recentes com Distribuição */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlowCard>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-blue-400" />
                    Leads Recentes
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDistributeAuto}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                    >
                      <ArrowsRightLeftIcon className="w-4 h-4" />
                      Distribuir Auto
                    </button>
                    <button
                      onClick={() => router.push('/backoffice/leads')}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Ver todas →
                    </button>
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {leads.map((lead) => {
                    const badge = getStatusBadge(lead.status);
                    return (
                      <div
                        key={lead.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 w-full">
                          <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-white truncate">{lead.cliente}</p>
                            <p className="text-xs text-neutral-400">{lead.tipo}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                          {lead.responsavel && (
                            <span className="text-xs text-neutral-500 bg-neutral-700/50 px-2 py-1 rounded">
                              {lead.responsavel}
                            </span>
                          )}
                          <span className={clsx("text-xs px-2 py-1 rounded-full border", badge.color)}>
                            {badge.text}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-neutral-500">
                            <ClockIcon className="w-3 h-3" />
                            <span className="hidden sm:inline">{lead.tempo}</span>
                          </div>
                          {!lead.responsavel && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                /* Implementar atribuição manual */
                              }}
                              className="px-2 sm:px-3 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-colors"
                            >
                              Atribuir
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlowCard>
            </motion.div>

            {/* Tarefas Pendentes do Dia */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <GlowCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                    Tarefas Pendentes Hoje
                  </h3>
                  <button
                    onClick={() => router.push('/backoffice/tarefas')}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Ver todas →
                  </button>
                </div>
                
                {/* Barra de Progresso */}
                <div className="mb-4 p-3 rounded-lg bg-neutral-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-neutral-400">Progresso do dia</span>
                    <span className="text-xs font-medium text-white">{tasksProgress}</span>
                  </div>
                  <div className="h-2 bg-neutral-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${tasksProgressPercent}%` }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-neutral-400">
                      <CheckCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma tarefa para hoje</p>
                    </div>
                  ) : (
                    tasks.map((task) => {
                      const Icon = getTaskIcon(task.tipo);
                      const isCompleted = completedTasks.includes(task.id);
                      
                      return (
                        <div
                          key={task.id}
                          className={clsx(
                            "flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors",
                            isCompleted && "opacity-50",
                            task.urgente && !isCompleted ? "bg-red-500/10 border border-red-500/20 hover:bg-red-500/20" : "bg-neutral-800/50 hover:bg-neutral-800"
                          )}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 w-full">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => toggleTaskComplete(task.id)}
                              className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
                            />
                            <Icon className={clsx(
                              "w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0", 
                              isCompleted ? "text-neutral-600" : task.urgente ? "text-red-400" : "text-neutral-400"
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className={clsx(
                                "text-xs sm:text-sm font-medium truncate",
                                isCompleted ? "text-neutral-500 line-through" : "text-white"
                              )}>
                                {task.titulo}
                              </p>
                              <p className="text-xs text-neutral-400">{task.responsavel}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center gap-1 text-xs text-neutral-400">
                              <ClockIcon className="w-3 h-3" />
                              {task.hora}
                            </div>
                            {task.urgente && !isCompleted && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                                Urgente
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </GlowCard>
            </motion.div>
          </div>

          {/* Sidebar Direita (1/3) */}
          <div className="space-y-6">
            {/* Atividades Recentes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <GlowCard>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <BoltIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                  Atividades Recentes
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                    >
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white">
                          <span className="font-medium">{activity.user}</span>{" "}
                          <span className={getActivityColor(activity.tipo)}>{activity.acao}</span>
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlowCard>
            </motion.div>

            {/* Quick Actions - Gestão */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <GlowCard>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Gestão Rápida</h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => router.push('/backoffice/properties/new')}
                    className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/20 transition-all group"
                    title={term('new_item', 'Criar novo item')}
                  >
                    {isAutomotive ? (
                      <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                    ) : (
                      <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm font-medium text-white">{term('new_item', 'Nova Propriedade')}</span>
                  </button>
                  <button
                    onClick={() => router.push('/backoffice/leads/new')}
                    className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/20 transition-all group"
                    title="Criar nova lead"
                  >
                    <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-white">Nova Lead</span>
                  </button>
                  <button
                    onClick={() => router.push('/backoffice/agents/new')}
                    className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/20 transition-all group"
                    title={`Adicionar novo ${term('agent', 'agente').toLowerCase()} à equipa`}
                  >
                    <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-white">Adicionar {term('agent', 'Agente')}</span>
                  </button>
                </div>
              </GlowCard>
            </motion.div>

            {/* Ferramentas & Relatórios */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <GlowCard>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Ferramentas & Análises</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push('/backoffice/reports')}
                    className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-all group"
                  >
                    <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium text-white text-center leading-tight">Relatórios</span>
                  </button>
                  <button
                    onClick={() => router.push('/backoffice/calculator/expenses')}
                    className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-all group"
                  >
                    <CalculatorIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium text-white text-center leading-tight">Calculadora</span>
                  </button>
                  <button
                    onClick={() => router.push('/backoffice/proposals')}
                    className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-all group"
                  >
                    <DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium text-white text-center leading-tight">Propostas</span>
                  </button>
                  <button
                    onClick={() => router.push('/backoffice/automation')}
                    className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-all group"
                  >
                    <Cog6ToothIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium text-white text-center leading-tight">Automação</span>
                  </button>
                </div>
              </GlowCard>
            </motion.div>
          </div>
        </div>
      </div>
    </BackofficeLayout>
  );
}
