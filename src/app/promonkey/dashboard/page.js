"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  FolderKanban, CheckCircle2, AlertTriangle, Clock,
  Users, Loader2, Calendar, Target, Zap, Timer,
  User, Building2, Mail, Phone, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── HELPERS & CONSTANTS ── */
function fmt(n) { return String(n ?? 0).padStart(2, "0"); }

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
	month: "short", day: "2-digit", year: "numeric",
  });
}

const COLORS = {
  not_started: "#94a3b8",
  in_progress: "#3b82f6",
  completed:   "#22c55e",
  on_hold:     "#f59e0b",
  cancelled:   "#ef4444",
  low:         "#22c55e",
  medium:      "#3b82f6",
  high:        "#f59e0b",
  critical:    "#ef4444"
};

/* ── SHARED COMPONENTS ── */
function StatCard({ icon: Icon, label, value, sub, subColor = "text-muted-foreground", bg = "bg-primary/10", iconColor = "text-primary" }) {
  return (
	<div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
	  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", bg)}>
		<Icon size={18} className={iconColor} />
	  </div>
	  <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
	  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
	  {sub && <p className={cn("text-[11px] font-semibold mt-1", subColor)}>{sub}</p>}
	</div>
  );
}

function SectionHeader({ title, sub }) {
  return (
	<div className="mb-4">
	  <h2 className="text-sm font-bold text-foreground tracking-wide uppercase">{title}</h2>
	  {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
	</div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
	<div className="bg-popover border border-border rounded-xl p-3 shadow-lg text-xs space-y-1">
	  {label && <p className="font-semibold text-foreground mb-1 capitalize">{label.replace(/_/g, " ")}</p>}
	  {payload.map((p, i) => (
		<p key={i} style={{ color: p.color }} className="font-medium">
		  {p.name}: <span className="text-foreground font-bold">{p.value}</span>
		</p>
	  ))}
	</div>
  );
}

/* ════════════════════════════════════════════
   ADMIN DASHBOARD
   ════════════════════════════════════════════ */
function AdminDashboard({ data }) {
  const stats = data.stats || {};
  
  const statusData = Object.entries(data.projectsByStatus || {}).map(([name, value]) => ({ name, value }));
  const priorityData = Object.entries(data.projectsByPriority || {}).map(([name, value]) => ({ name, value }));
  const taskStatusData = Object.entries(data.tasksByStatus || {}).map(([name, value]) => ({ name, value }));

  return (
	<div className="space-y-6">
	  {/* KPI Stats */}
	  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard icon={FolderKanban} label="Total Projects" value={fmt(stats.totalProjects)} sub={`${data.projectsByStatus?.in_progress || 0} In Progress`} bg="bg-blue-500/10" iconColor="text-blue-600" subColor="text-blue-600" />
		<StatCard icon={Users} label="Total Employees" value={fmt(stats.totalEmployees)} sub={`Logged ${stats.totalHoursLogged || 0} hrs total`} bg="bg-emerald-500/10" iconColor="text-emerald-600" subColor="text-emerald-600" />
		<StatCard icon={AlertTriangle} label="At Risk Projects" value={fmt(stats.atRiskProjectsCount)} sub="Requires immediate review" bg="bg-red-500/10" iconColor="text-red-600" subColor="text-red-600" />
		<StatCard icon={Target} label="Overdue Tasks" value={fmt(stats.overdueTasksCount)} sub="Action needed" bg="bg-amber-500/10" iconColor="text-amber-600" subColor="text-amber-600" />
	  </div>

	  {/* Visual Analytics Charts */}
	  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
		{/* Projects Status Ring */}
		<div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between">
		  <SectionHeader title="Project Statuses" sub="Overall distribution" />
		  <ResponsiveContainer width="100%" height={160}>
			<PieChart>
			  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" strokeWidth={0}>
				{statusData.map((entry, i) => <Cell key={i} fill={COLORS[entry.name] || "#ccc"} />)}
			  </Pie>
			  <Tooltip content={<ChartTooltip />} />
			</PieChart>
		  </ResponsiveContainer>
		  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
			{statusData.map((d) => (
			  <div key={d.name} className="flex items-center gap-1.5">
				<div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[d.name] }} />
				<span className="text-muted-foreground capitalize truncate">{d.name.replace(/_/g, " ")} ({d.value})</span>
			  </div>
			))}
		  </div>
		</div>

		{/* Priority Status Bar Chart */}
		<div className="bg-card border border-border rounded-2xl p-5">
		  <SectionHeader title="Projects by Priority" sub="Severity level allocation" />
		  <ResponsiveContainer width="100%" height={210}>
			<BarChart data={priorityData}>
			  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => v.toUpperCase()} />
			  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
			  <Tooltip content={<ChartTooltip />} />
			  <Bar dataKey="value" name="Projects" radius={[6, 6, 0, 0]}>
				{priorityData.map((entry, i) => <Cell key={i} fill={COLORS[entry.name] || "#3b82f6"} />)}
			  </Bar>
			</BarChart>
		  </ResponsiveContainer>
		</div>

		{/* Global Task Volume Summary */}
		<div className="bg-card border border-border rounded-2xl p-5">
		  <SectionHeader title="Global Tasks Status" sub="Current operational load" />
		  <ResponsiveContainer width="100%" height={210}>
			<BarChart data={taskStatusData} layout="vertical">
			  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
			  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={75} tickFormatter={(v) => v.replace(/_/g, " ")} />
			  <Tooltip content={<ChartTooltip />} />
			  <Bar dataKey="value" name="Tasks" fill="#7c3aed" radius={[0, 6, 6, 0]} />
			</BarChart>
		  </ResponsiveContainer>
		</div>
	  </div>

	  {/* Lists Section */}
	  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
		{/* At Risk Projects */}
		<div className="bg-card border border-border rounded-2xl overflow-hidden">
		  <div className="p-5 border-b border-border bg-muted/20">
			<h3 className="text-xs font-bold text-red-600 tracking-wider uppercase flex items-center gap-2">
			  <AlertTriangle size={14} /> At Risk Projects
			</h3>
		  </div>
		  <div className="divide-y divide-border">
			{data.atRiskProjects?.map((proj) => (
			  <div key={proj._id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
				<div>
				  <h4 className="text-sm font-semibold text-foreground">{proj.name}</h4>
				  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
					<Building2 size={12} /> {proj.client?.companyName} ({proj.client?.clientName})
				  </p>
				</div>
				<div className="text-right">
				  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-600 border border-red-200">
					{proj.priority}
				  </span>
				  <p className="text-[10px] text-muted-foreground mt-1.5">Ends: {formatDate(proj.estimatedEndDate)}</p>
				</div>
			  </div>
			)) || <p className="p-4 text-xs text-muted-foreground">No active threats detected.</p>}
		  </div>
		</div>

		{/* Top Productive Performers */}
		<div className="bg-card border border-border rounded-2xl overflow-hidden">
		  <div className="p-5 border-b border-border bg-muted/20">
			<h3 className="text-xs font-bold text-indigo-600 tracking-wider uppercase flex items-center gap-2">
			  <Clock size={14} /> Top Employees By Logged Hours
			</h3>
		  </div>
		  <div className="divide-y divide-border">
			{data.topEmployeesByHours?.map((emp) => (
			  <div key={emp._id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
				<div className="flex items-center gap-3">
				  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-600">
					{emp.name?.[0]}
				  </div>
				  <div>
					<h4 className="text-sm font-semibold text-foreground">{emp.name}</h4>
					<p className="text-xs text-muted-foreground">{emp.department} • ID: {emp.employeeId}</p>
				  </div>
				</div>
				<div className="text-right">
				  <span className="text-sm font-bold text-foreground">{emp.totalHours} hrs</span>
				  <p className="text-[10px] text-muted-foreground mt-0.5">Logged</p>
				</div>
			  </div>
			))}
		  </div>
		</div>
	  </div>
	</div>
  );
}

/* ════════════════════════════════════════════
   EMPLOYEE DASHBOARD
   ════════════════════════════════════════════ */
function EmployeeDashboard({ data }) {
  const stats = data.stats || {};
  const taskStatusData = Object.entries(data.tasksByStatus || {}).map(([name, value]) => ({ name, value }));

  return (
	<div className="space-y-6">
	  {/* Metrics Row */}
	  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<StatCard icon={Briefcase} label="Assigned Projects" value={fmt(stats.totalAssignedProjects)} sub="Active associations" bg="bg-blue-500/10" iconColor="text-blue-600" subColor="text-blue-600" />
		<StatCard icon={Zap} label="Assigned Phases" value={fmt(stats.totalAssignedPhases)} sub="Development milestones" bg="bg-violet-500/10" iconColor="text-violet-600" subColor="text-violet-600" />
		<StatCard icon={Clock} label="Hours Tracked" value={`${stats.totalHoursLogged || 0}h`} sub="Accumulated log time" bg="bg-emerald-500/10" iconColor="text-emerald-600" subColor="text-emerald-600" />
		<StatCard icon={AlertTriangle} label="Overdue Milestones" value={fmt(stats.overdueTasksCount)} sub="Requires quick action" bg="bg-rose-500/10" iconColor="text-rose-600" subColor="text-rose-600" />
	  </div>

	  {/* Task Distribution Analysis */}
	  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div className="bg-card border border-border rounded-2xl p-5 lg:col-span-1 flex flex-col justify-between">
		  <SectionHeader title="Your Task Pipeline" sub="Task distribution statuses" />
		  <ResponsiveContainer width="100%" height={160}>
			<PieChart>
			  <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" strokeWidth={0}>
				{taskStatusData.map((entry, i) => <Cell key={i} fill={COLORS[entry.name] || "#7c3aed"} />)}
			  </Pie>
			  <Tooltip content={<ChartTooltip />} />
			</PieChart>
		  </ResponsiveContainer>
		  <div className="space-y-1.5 mt-4">
			{taskStatusData.map((d) => (
			  <div key={d.name} className="flex items-center justify-between text-xs">
				<div className="flex items-center gap-1.5">
				  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[d.name] }} />
				  <span className="text-muted-foreground capitalize">{d.name.replace(/_/g, " ")}</span>
				</div>
				<span className="font-semibold text-foreground">{d.value} Tasks</span>
			  </div>
			))}
		  </div>
		</div>

		{/* Recent Active Tasks Queue */}
		<div className="bg-card border border-border rounded-2xl overflow-hidden lg:col-span-2">
		  <div className="p-5 border-b border-border bg-muted/20">
			<h3 className="text-xs font-bold text-foreground tracking-wider uppercase">Active Task Queue</h3>
		  </div>
		  <div className="divide-y divide-border">
			{data.recentTasks?.map((task) => (
			  <div key={task._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
				<div>
				  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
					<div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {task.name}
				  </h4>
				  <p className="text-xs text-muted-foreground mt-0.5">
					{task.project?.name} • <span className="italic">{task.phase?.name}</span>
				  </p>
				</div>
				<div className="flex items-center gap-4 justify-between sm:justify-end">
				  <div className="text-left sm:text-right">
					<p className="text-xs font-medium text-foreground flex items-center gap-1"><Timer size={12} /> {task.estimatedHours} hrs</p>
					<p className="text-[10px] text-muted-foreground mt-0.5">Due: {formatDate(task.dueDate)}</p>
				  </div>
				  <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 uppercase border border-blue-200">
					{task.status}
				  </span>
				</div>
			  </div>
			)) || <p className="p-4 text-xs text-muted-foreground">No tasks assigned.</p>}
		  </div>
		</div>
	  </div>
	</div>
  );
}

/* ════════════════════════════════════════════
   CLIENT DASHBOARD
   ════════════════════════════════════════════ */
function ClientDashboard({ data }) {
  const stats = data.stats || {};
  const clientInfo = data.client || {};
  
  const projectStatusData = Object.entries(data.projectsByStatus || {}).map(([name, value]) => ({ name, value }));
  const phaseStatusData = Object.entries(data.phasesByStatus || {}).map(([name, value]) => ({ name, value }));

  return (
	<div className="space-y-6">
	  {/* Profile Info Summary Card */}
	  <div className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
		<div className="flex items-center gap-4">
		  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
			{clientInfo.clientName?.[0]}
		  </div>
		  <div>
			<h2 className="text-lg font-bold text-foreground flex items-center gap-2">{clientInfo.clientName}</h2>
			<p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
			  <Building2 size={13} /> {clientInfo.companyName} • <span className="italic">{clientInfo.address}</span>
			</p>
		  </div>
		</div>
		<div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-6 w-full md:w-auto">
		  <p className="flex items-center gap-1.5"><Mail size={13} /> {clientInfo.email}</p>
		  <p className="flex items-center gap-1.5"><Phone size={13} /> {clientInfo.phone}</p>
		</div>
	  </div>

	  {/* Metrics Row */}
	  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
		<StatCard icon={FolderKanban} label="Total Managed Projects" value={fmt(stats.totalProjects)} sub="Contractual pipelines" bg="bg-blue-500/10" iconColor="text-blue-600" subColor="text-blue-600" />
		<StatCard icon={Zap} label="Phases Logged" value={fmt(Object.values(data.phasesByStatus || {}).reduce((a, b) => a + b, 0))} sub={`${data.phasesByStatus?.completed || 0} Fully Done`} bg="bg-emerald-500/10" iconColor="text-emerald-600" subColor="text-emerald-600" />
		<StatCard icon={CheckCircle2} label="Active Tracked Workflows" value={fmt(data.projectsByStatus?.in_progress)} sub="Currently operational" bg="bg-purple-500/10" iconColor="text-purple-600" subColor="text-purple-600" />
	  </div>

	  {/* Charts breakdown */}
	  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<div className="bg-card border border-border rounded-2xl p-5">
		  <SectionHeader title="Your Contracted Projects" sub="Structural distribution" />
		  <ResponsiveContainer width="100%" height={200}>
			<BarChart data={projectStatusData}>
			  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => v.replace(/_/g, " ")} />
			  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
			  <Tooltip content={<ChartTooltip />} />
			  <Bar dataKey="value" name="Projects" radius={[6, 6, 0, 0]}>
				{projectStatusData.map((entry, i) => <Cell key={i} fill={COLORS[entry.name] || "#2563eb"} />)}
			  </Bar>
			</BarChart>
		  </ResponsiveContainer>
		</div>

		<div className="bg-card border border-border rounded-2xl p-5">
		  <SectionHeader title="Development Phases Overview" sub="Granular milestone records" />
		  <ResponsiveContainer width="100%" height={200}>
			<AreaChart data={phaseStatusData}>
			  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => v.replace(/_/g, " ")} />
			  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
			  <Tooltip content={<ChartTooltip />} />
			  <Area type="monotone" dataKey="value" name="Phases" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
			</AreaChart>
		  </ResponsiveContainer>
		</div>
	  </div>

	  {/* Recent Project Summary */}
	  <div className="bg-card border border-border rounded-2xl overflow-hidden">
		<div className="p-5 border-b border-border bg-muted/20">
		  <h3 className="text-xs font-bold text-foreground tracking-wider uppercase">Project Master Log</h3>
		</div>
		<div className="divide-y divide-border">
		  {data.recentProjects?.map((proj) => (
			<div key={proj._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
			  <div className="flex items-center gap-3">
				<div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 font-bold flex items-center justify-center text-sm border border-blue-200">
				  {proj.name?.[0]}
				</div>
				<div>
				  <h4 className="text-sm font-semibold text-foreground">{proj.name}</h4>
				  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
					<Calendar size={12} /> {formatDate(proj.startDate)} — {formatDate(proj.estimatedEndDate)}
				  </p>
				</div>
			  </div>
			  <div className="flex items-center gap-3 justify-end">
				<span className={cn(
				  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-md",
				  proj.priority === "high" ? "bg-red-500/10 text-red-600 border-red-200" : "bg-muted text-muted-foreground"
				)}>
				  {proj.priority} Priority
				</span>
				<span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 border border-blue-200">
				  {proj.status?.replace(/_/g, " ")}
				</span>
			  </div>
			</div>
		  ))}
		</div>
	  </div>
	</div>
  );
}

/* ════════════════════════════════════════════
   MAIN EXPORT / CONTAINER
   ════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user, ready } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
	if (!ready) return;
	async function load() {
	  setLoading(true);
	  setError("");
	  try {
		// Targets your combined profile context statistics block directly
		const json = await apiFetch("/api/dashboard");
		setData(json);
	  } catch (e) {
		setError(e.message);
	  } finally {
		setLoading(false);
	  }
	}
	load();
  }, [ready]);

  const role = user?.role?.toLowerCase() || data?.role || "employee";

  if (!ready || loading) return (
	<div className="flex items-center justify-center h-64">
	  <div className="flex flex-col items-center gap-3">
		<Loader2 size={28} className="animate-spin text-primary" />
		<p className="text-sm text-muted-foreground">Assembling dashboard data structure...</p>
	  </div>
	</div>
  );

  if (error) return (
	<div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium m-4">
	  Failed to synchronize view configuration: {error}
	</div>
  );

  return (
	<div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-6">
	  {/* Header Profile Title section */}
	  <div className="flex items-center justify-between border-b border-border/60 pb-5">
		<div>
		  <h1 className="text-2xl font-black text-foreground tracking-tight">
			{role === "admin" ? "Corporate Workspace Operations" :
			 role === "client" ? "Your Project Workspace" :
			 "Your Operational Board"}
		  </h1>
		  <p className="text-sm text-muted-foreground mt-0.5">
			{role === "admin"  ? "Enterprise metrics tracking, team outputs, and systemic risks." :
			 role === "client" ? "Real-time auditing of your active development milestones." :
			 "Manage assigned components and cross-reference productivity windows."}
		  </p>
		</div>
		<div className="hidden sm:block text-xs text-muted-foreground bg-muted border border-border px-3 py-1.5 rounded-xl font-semibold shadow-sm">
		  Node Sync: <span className="text-foreground">{new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit" })}</span>
		</div>
	  </div>

	  {/* Conditional Dashboard Router */}
	  {role === "admin" && <AdminDashboard data={data} />}
	  {role === "client" && <ClientDashboard data={data} />}
	  {role === "employee" && <EmployeeDashboard data={data} />}
	</div>
  );
}