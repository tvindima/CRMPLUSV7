'use client';

import { useEffect, useState } from "react";
import {
  SparklesIcon,
  BoltIcon,
  CalendarIcon,
  HomeIcon,
  CheckCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { BackofficeLayout } from "@/components/BackofficeLayout";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { getSession } from "../../../src/services/auth";
import {
  getAgentKPIs,
  getAgentLeads,
  getAgentTasks,
  getAgentActivities,
  getPropertiesByTipologia,
  getPropertiesByStatus,
} from "@/src/services/dashboardApi";
import Image from "next/image";

type KPI = {
  title: string;
  value: string | number;
  icon: any;
  iconColor: string;
  bgGradient: string;
  trend?: string;
  trendUp?: boolean;
};

type Lead = {
  id: number;
  cliente: string;
  tipo: string;
  status: 'nova' | 'qualificada' | 'contacto' | 'pendente';
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

export default function DashboardAgentePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const session = await getSession();
      if (!session) {
        router.push("/backoffice/login");
      } else {
        setUser(session);
      }
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0B0B0D]">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#E10600] border-t-transparent mx-auto"></div>
          <p className="text-white">A carregar...</p>
        </div>
      </div>
    );
  }

  return (
    <BackofficeLayout title="Dashboard do Agente">
      <DashboardAgenteInner user={user} />
    </BackofficeLayout>
  );
}

function DashboardAgenteInner({ user }: { user: any }) {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [statusChartData, setStatusChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // 1. KPIs pessoais
      try {
        const kpisData = await getAgentKPIs();
        const newKpis: KPI[] = [
          {
            title: "Minhas Propriedades",
            value: kpisData.propriedades_ativas,
            icon: HomeIcon,
            iconColor: "text-blue-400",
            bgGradient: "from-blue-500/20 to-blue-600/20",
            trend: kpisData.trends.propriedades,
            trendUp: kpisData.trends.propriedades_up,
          },
          {
            title: "Minhas Leads (7d)",
            value: kpisData.novas_leads_7d,
            icon: SparklesIcon,
            iconColor: "text-purple-400",
            bgGradient: "from-purple-500/20 to-purple-600/20",
            trend: kpisData.trends.leads,
            trendUp: kpisData.trends.leads_up,
          },
          {
            title: "Propostas Abertas",
            value: kpisData.propostas_abertas,
            icon: DocumentTextIcon,
            iconColor: "text-yellow-400",
            bgGradient: "from-yellow-500/20 to-yellow-600/20",
            trend: kpisData.trends.propostas,
            trendUp: kpisData.trends.propostas_up,
          },
          {
            title: "Visitas Agendadas",
            value: kpisData.visitas_agendadas || 0,
            icon: CalendarIcon,
            iconColor: "text-green-400",
            bgGradient: "from-green-500/20 to-green-600/20",
          },
        ];
        setKpis(newKpis);
      } catch (error) {
        console.error("Erro ao carregar KPIs:", error);
      }

      // 2. Minhas Leads
      try {
        const leadsData = await getAgentLeads(4);
        const mappedLeads: Lead[] = leadsData.map((l: any) => ({
          id: l.id,
          cliente: l.nome,
          tipo: l.origem,
          status: l.status || 'nova',
          responsavel: l.responsavel,
          data: l.timestamp || new Date().toISOString(),
          tempo: l.tempo || 'Agora',
        }));
        setLeads(mappedLeads);
      } catch (error) {
        console.error("Erro ao carregar leads:", error);
      }

      // 3. Minhas Tarefas
      try {
        const tasksData = await getAgentTasks();
        const mappedTasks: Task[] = tasksData.map((t: any) => ({
          id: t.id,
          tipo: t.tipo,
          titulo: t.titulo,
          responsavel: user?.email || "Você",
          hora: t.hora,
          urgente: t.prioridade === 'high',
        }));
        setTasks(mappedTasks);
      } catch (error) {
        console.error("Erro ao carregar tarefas:", error);
      }

      // 4. Minhas Atividades
      try {
        const activitiesData = await getAgentActivities(4);
        const mappedActivities: Activity[] = activitiesData.map((a: any) => ({
          id: a.id,
          user: a.user,
          avatar: a.avatar,
          acao: a.acao,
          tipo: a.tipo,
          time: a.time,
        }));
        setActivities(mappedActivities);
      } catch (error) {
        console.error("Erro ao carregar atividades:", error);
      }

      // 5. Gráfico Tipologia
      try {
        const tipologia = await getPropertiesByTipologia();
        const pieData = tipologia.map((t: any) => ({
          ...t,
          color: t.color || "#6b7280"
        }));
        setPieChartData(pieData);
      } catch (error) {
        console.error("Erro ao carregar tipologia:", error);
      }

      // 6. Gráfico Status
      try {
        const status = await getPropertiesByStatus();
        const statusData = status.map((s: any) => ({
          ...s,
          color: s.color || "#6b7280"
        }));
        setStatusChartData(statusData);
      } catch (error) {
        console.error("Erro ao carregar status:", error);
      }

    } catch (error) {
      console.error("Erro geral ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#E10600] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Meu Dashboard</h1>
          <p className="text-sm text-[#C5C5C5] mt-1">
            Bem-vindo, {user?.email || "Agente"}
          </p>
        </div>
      </div>

      {/* KPIs Pessoais */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative overflow-hidden rounded-xl border border-[#2A2A2E] bg-gradient-to-br from-[#1A1A1E] to-[#0B0B0D] p-6 group hover:border-[#E10600]/50 transition-all"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <kpi.icon className={`h-8 w-8 ${kpi.iconColor}`} />
                {kpi.trend && (
                  <div className={clsx(
                    "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                    kpi.trendUp ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  )}>
                    <ArrowTrendingUpIcon className={clsx("h-3 w-3", !kpi.trendUp && "rotate-180")} />
                    {kpi.trend}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-white mb-1">{kpi.value}</div>
              <div className="text-sm text-[#C5C5C5]">{kpi.title}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Coluna Esquerda */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Minhas Leads */}
          <div className="rounded-xl border border-[#2A2A2E] bg-[#1A1A1E] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <SparklesIcon className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Minhas Leads</h2>
                  <p className="text-xs text-[#C5C5C5]">Últimas leads atribuídas a mim</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {leads.length === 0 ? (
                <p className="text-sm text-[#C5C5C5] text-center py-8">Nenhuma lead atribuída</p>
              ) : (
                leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] p-4 hover:border-[#E10600]/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                        <span className="text-sm font-semibold text-purple-400">
                          {lead.cliente.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{lead.cliente}</span>
                          <span className={clsx(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            lead.status === 'nova' && "bg-blue-500/10 text-blue-400",
                            lead.status === 'qualificada' && "bg-green-500/10 text-green-400",
                            lead.status === 'contacto' && "bg-yellow-500/10 text-yellow-400",
                            lead.status === 'pendente' && "bg-red-500/10 text-red-400"
                          )}>
                            {lead.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[#C5C5C5]">
                          <span>{lead.tipo}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {lead.tempo}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg border border-[#2A2A2E] bg-[#1A1A1E] px-3 py-1.5 text-xs font-medium text-white hover:border-[#E10600] transition-all">
                        <PhoneIcon className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg border border-[#2A2A2E] bg-[#1A1A1E] px-3 py-1.5 text-xs font-medium text-white hover:border-[#E10600] transition-all">
                        <EnvelopeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Gráficos de Distribuição */}
          <div className="grid grid-cols-2 gap-4">
            {/* Tipologia */}
            <div className="rounded-xl border border-[#2A2A2E] bg-[#1A1A1E] p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Tipologia</h3>
              <div className="space-y-3">
                {pieChartData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs text-[#C5C5C5]">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="rounded-xl border border-[#2A2A2E] bg-[#1A1A1E] p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Status</h3>
              <div className="space-y-3">
                {statusChartData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs text-[#C5C5C5]">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Coluna Direita */}
        <div className="space-y-6">
          
          {/* Minhas Tarefas */}
          <div className="rounded-xl border border-[#2A2A2E] bg-[#1A1A1E] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Minhas Tarefas</h2>
                  <p className="text-xs text-[#C5C5C5]">Hoje</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-sm text-[#C5C5C5] text-center py-8">Sem tarefas para hoje</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-lg border border-[#2A2A2E] bg-[#0B0B0D] p-4 hover:border-[#E10600]/50 transition-all"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-[#2A2A2E] bg-transparent text-[#E10600] focus:ring-[#E10600] focus:ring-offset-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{task.titulo}</span>
                        {task.urgente && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-medium">
                            Urgente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#C5C5C5]">
                        <ClockIcon className="h-3 w-3" />
                        <span>{task.hora}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Atividade Recente */}
          <div className="rounded-xl border border-[#2A2A2E] bg-[#1A1A1E] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Minha Atividade</h2>
                  <p className="text-xs text-[#C5C5C5]">Histórico recente</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-[#C5C5C5] text-center py-8">Sem atividades recentes</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <Image
                        src={activity.avatar}
                        alt={activity.user}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        <span className="font-medium">{activity.user}</span>{' '}
                        <span className="text-[#C5C5C5]">{activity.acao}</span>
                      </p>
                      <p className="text-xs text-[#C5C5C5] mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
