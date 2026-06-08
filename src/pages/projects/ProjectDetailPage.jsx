"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Calendar, Clock, Flag,
    FileText, Trash2, Edit, MessageSquare,
    Users, CheckCircle2, AlertTriangle,
    Layers, TrendingUp, Timer, Hash,
    ExternalLink, ChevronDown, ChevronUp,
    Loader2,
} from "lucide-react";
import { apiFetch, API_BASE, getToken } from "@/lib/api";
import { useApi }  from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { Button }  from "@/components/ui/button";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { ProjectForm } from "@/components/projects/ProjectForm";
import {
    Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* ── helpers ── */
function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "2-digit", year: "numeric",
    });
}

function daysElapsed(start) {
    if (!start) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(start)) / (1000 * 60 * 60 * 24)));
}

function daysRemaining(end) {
    if (!end) return 0;
    return Math.max(0, Math.floor((new Date(end) - Date.now()) / (1000 * 60 * 60 * 24)));
}

const STATUS_STYLES = {
    not_started: { badge: "bg-slate-500/10 text-slate-500  border-slate-200",  dot: "bg-slate-400",  label: "Not Started" },
    in_progress: { badge: "bg-blue-500/10  text-blue-600   border-blue-200",   dot: "bg-blue-500",   label: "In Progress" },
    completed:   { badge: "bg-green-500/10 text-green-600  border-green-200",  dot: "bg-green-500",  label: "Completed"   },
    on_hold:     { badge: "bg-amber-500/10 text-amber-600  border-amber-200",  dot: "bg-amber-400",  label: "On Hold"     },
    cancelled:   { badge: "bg-red-500/10   text-red-600    border-red-200",    dot: "bg-red-500",    label: "Cancelled"   },
};

const PRIORITY_STYLES = {
    low:      "bg-slate-500/10 text-slate-500  border-slate-200",
    medium:   "bg-blue-500/10  text-blue-600   border-blue-200",
    high:     "bg-amber-500/10 text-amber-600  border-amber-200",
    critical: "bg-red-500/10   text-red-600    border-red-200",
};

const FILE_ICONS = {
    "application/pdf": { bg: "bg-red-100",    color: "text-red-600",    label: "PDF"  },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                        { bg: "bg-blue-100",   color: "text-blue-600",   label: "DOCX" },
    "image/png":        { bg: "bg-purple-100", color: "text-purple-600", label: "PNG"  },
    "image/jpeg":       { bg: "bg-purple-100", color: "text-purple-600", label: "JPG"  },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                        { bg: "bg-green-100",  color: "text-green-600",  label: "XLSX" },
};

function getFileIcon(fileType) {
    return FILE_ICONS[fileType] ??
        { bg: "bg-muted", color: "text-muted-foreground", label: "FILE" };
}

/* ── Phase card ── */
function PhaseCard({ phase, canChat, currentUser, isExpanded, onToggle }) {
    const [chat, setChat] = useState(false);
    const status = STATUS_STYLES[phase.status] ?? STATUS_STYLES.not_started;

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">

            {/* Phase header */}
            <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={onToggle}
            >
                {/* Order badge */}
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{phase.order}</span>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-foreground">{phase.name}</p>
                        <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border",
                            status.badge
                        )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                            {status.label}
                        </span>
                    </div>
                    {phase.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                            {phase.description}
                        </p>
                    )}
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6 shrink-0">
                    <div className="text-center">
                        <p className="text-xs font-bold text-foreground">{phase.estimatedDuration ?? "—"}</p>
                        <p className="text-[10px] text-muted-foreground">Est. hrs</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold text-foreground">{phase.progressPercent ?? 0}%</p>
                        <p className="text-[10px] text-muted-foreground">Progress</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold text-foreground">
                            {phase.taskSummary?.completed ?? 0}/{phase.taskSummary?.total ?? 0}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Tasks</p>
                    </div>
                </div>

                {/* Chat + expand */}
                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    {canChat && (
                        <button
                            onClick={() => setChat(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
                        >
                            <MessageSquare size={13} />
                            Chat
                        </button>
                    )}
                    <button
                        onClick={onToggle}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                    >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-muted mx-5 rounded-full overflow-hidden mb-0">
                <div
                    className={cn("h-full rounded-full transition-all", status.dot)}
                    style={{ width: `${phase.progressPercent ?? 0}%` }}
                />
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div className="px-5 pb-5 pt-4 border-t border-border/60 mt-0 space-y-4">

                    {/* Dates row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: "Est. End Date",   value: formatDate(phase.estimatedEndDate) },
                            { label: "Actual Start",    value: formatDate(phase.actualStart)      },
                            { label: "Actual End",      value: formatDate(phase.actualEnd)        },
                            { label: "Est. Duration",   value: phase.estimatedDuration ? `${phase.estimatedDuration} hrs` : "—" },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-muted/30 rounded-xl p-3">
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                                    {label}
                                </p>
                                <p className="text-xs font-semibold text-foreground mt-0.5">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Task summary */}
                    {phase.taskSummary && (
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { label: "Total",       value: phase.taskSummary.total,       color: "text-foreground"  },
                                { label: "Completed",   value: phase.taskSummary.completed,   color: "text-green-600"   },
                                { label: "In Progress", value: phase.taskSummary.inProgress,  color: "text-blue-600"    },
                                { label: "Not Started", value: phase.taskSummary.notStarted,  color: "text-slate-500"   },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="bg-muted/30 rounded-xl p-3 text-center">
                                    <p className={cn("text-lg font-bold", color)}>{value}</p>
                                    <p className="text-[10px] text-muted-foreground">{label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Assignees */}
                    {(phase.assignees ?? []).length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                                Assignees
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {phase.assignees.map((a) => {
                                    const u      = a.user ?? {};
                                    const name   = u.name ?? "—";
                                    const avatar = u.profileImage?.url ?? null;
                                    return (
                                        <div
                                            key={a._id}
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background border border-border"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
                                                {avatar ? (
                                                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[9px] font-bold text-primary">
                                                        {name[0]?.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-foreground truncate">{name}</p>
                                                <p className="text-[10px] text-muted-foreground">{a.role?.name ?? a.department ?? ""}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Chat drawer for this phase */}
            <ChatDrawer
                open={chat}
                onClose={() => setChat(false)}
                type="phase"
                id={phase._id}
                title={`${phase.name} — Discussion`}
                currentUser={currentUser}
            />
        </div>
    );
}

/* ════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════ */
export default function ProjectDetailPage({ id }) {
    const router = useRouter();
    const { user }           = useAuth();
    const { data: clients }  = useApi("/api/clients");

    const [project,      setProject]      = useState(null);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState("");
    const [editOpen,     setEditOpen]     = useState(false);
    const [deletingDoc,  setDeletingDoc]  = useState(null);
    const [expandedPhase,setExpandedPhase]= useState(null);

    const role     = user?.role?.toLowerCase() ?? "employee";
    const isClient = role === "client";
    const canChat  = ["admin", "employee"].includes(role);

    async function load() {
        setLoading(true);
        setError("");
        try {
            const data = await apiFetch(`/api/projects/${id}`);
            setProject(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { if (id) load(); }, [id]);

    async function handleUpdate(formData) {
        const res = await fetch(`${API_BASE}/api/projects/${id}`, {
            method:  "PUT",
            headers: { Authorization: `Bearer ${getToken()}` },
            body:    formData,
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
        setEditOpen(false);
        load();
    }

    async function handleDeleteDoc(docId) {
        setDeletingDoc(docId);
        try {
            await apiFetch(`/api/projects/${id}/docs/${docId}`, { method: "DELETE" });
            load();
        } finally {
            setDeletingDoc(null);
        }
    }

    /* ── loading ── */
    if (!id || loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading project...</p>
            </div>
        </div>
    );

    /* ── error ── */
    if (error) return (
        <div className="space-y-4 max-w-5xl">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft size={16} /> Back
            </button>
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium">
                {error}
            </div>
        </div>
    );

    if (!project) return null;

    const client   = project.client  ?? {};
    const phases   = project.phases  ?? [];
    const docs     = project.requirementDocs ?? [];
    const status   = STATUS_STYLES[project.status] ?? STATUS_STYLES.not_started;
    const elapsed  = daysElapsed(project.startDate);
    const remaining= daysRemaining(project.estimatedEndDate);

    /* ════════════════════
       CLIENT VIEW
       ════════════════════ */
    if (isClient) return (
        <div className="space-y-6 max-w-5xl">

            {/* Back */}
            <div>
                <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
                    <ArrowLeft size={16} /> Back to Projects
                </button>
                <p className="text-xs text-muted-foreground">
                    <button onClick={() => router.push("/promonkey/projects")} className="hover:text-primary transition-colors">Projects</button>
                    {" "}&rsaquo;{" "}
                    <span className="text-foreground font-medium">{project.name}</span>
                </p>
            </div>

            {/* Hero */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className={cn("px-3 py-1 rounded-full text-xs font-bold border capitalize", status.badge)}>
                                {status.label}
                            </span>
                            <span className={cn("px-3 py-1 rounded-full text-xs font-bold border capitalize", PRIORITY_STYLES[project.priority] ?? "bg-muted text-muted-foreground")}>
                                {project.priority} Priority
                            </span>
                        </div>
                    </div>
                    {/* Progress circle */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                        <div className="relative w-16 h-16">
                            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/40" />
                                <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 26}`}
                                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - (project.progressPercent ?? 0) / 100)}`}
                                    className="text-primary transition-all duration-500"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">{project.progressPercent ?? 0}%</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Progress</p>
                    </div>
                </div>
            </div>

            {/* Timeline cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Start Date",     value: formatDate(project.startDate),        icon: Calendar },
                    { label: "Est. Completion",value: formatDate(project.estimatedEndDate), icon: Clock    },
                    { label: "Days Remaining", value: `${remaining} days`,                  icon: Flag, highlight: remaining < 14 },
                ].map(({ label, value, icon: Icon, highlight }) => (
                    <div key={label} className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon size={14} className="text-muted-foreground" />
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                        </div>
                        <p className={cn("text-lg font-bold", highlight ? "text-destructive" : "text-foreground")}>
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Task summary — simple for client */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Tasks Overview</p>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-foreground">{project.completedTasks ?? 0}</p>
                        <p className="text-sm text-muted-foreground mb-1">of {project.totalTasks ?? 0} done</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0}%` }}
                        />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Phases</p>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-foreground">
                            {phases.filter(p => p.status === "completed").length}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">of {phases.length} complete</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${phases.length > 0 ? Math.round((phases.filter(p => p.status === "completed").length / phases.length) * 100) : 0}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Phases — client only sees name + status + progress */}
            {phases.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-foreground">Project Phases</h2>
                    {phases.map((phase) => {
                        const ps = STATUS_STYLES[phase.status] ?? STATUS_STYLES.not_started;
                        return (
                            <div key={phase._id} className="bg-card border border-border rounded-2xl p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-[10px] font-bold text-primary">{phase.order}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground">{phase.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{formatDate(phase.estimatedEndDate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs font-bold text-primary">{phase.progressPercent ?? 0}%</span>
                                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold border", ps.badge)}>
                                            {ps.label}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all", ps.dot)}
                                        style={{ width: `${phase.progressPercent ?? 0}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    /* ════════════════════
       ADMIN / EMPLOYEE VIEW
       ════════════════════ */
    return (
        <div className="space-y-6 max-w-6xl">

            {/* Back + breadcrumb */}
            <div className="flex items-center justify-between">
                <div>
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-1">
                        <ArrowLeft size={16} /> Back
                    </button>
                    <p className="text-xs text-muted-foreground">
                        <button onClick={() => router.push("/promonkey/projects")} className="hover:text-primary transition-colors">Projects</button>
                        {" "}&rsaquo;{" "}
                        <span className="text-foreground font-medium">{project.name}</span>
                    </p>
                </div>
                {role === "admin" && (
                    <Button variant="outline" className="rounded-xl gap-2" onClick={() => setEditOpen(true)}>
                        <Edit size={14} /> Edit Project
                    </Button>
                )}
            </div>

            {/* ── Hero card ── */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
                            <span className={cn("px-3 py-1 rounded-full text-xs font-bold border capitalize", status.badge)}>
                                {status.label}
                            </span>
                            <span className={cn("px-3 py-1 rounded-full text-xs font-bold border capitalize", PRIORITY_STYLES[project.priority] ?? "bg-muted text-muted-foreground")}>
                                {project.priority} Priority
                            </span>
                        </div>

                        {/* Client */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                {(client.clientName ?? "C")[0]?.toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-foreground">{client.clientName ?? "—"}</p>
                                {client.companyName && <p className="text-[10px] text-muted-foreground">{client.companyName}</p>}
                            </div>
                        </div>

                        {/* Description — renders HTML from Quill */}
                        {project.description && (
                        <div
                            className="
                                prose prose-sm max-w-none
                                prose-h1:text-3xl prose-h1:font-bold
                                prose-h2:text-2xl prose-h2:font-bold
                                prose-h3:text-xl prose-h3:font-semibold
                                prose-h4:text-lg prose-h4:font-semibold
                                prose-h5:text-base prose-h5:font-medium
                                prose-h6:text-sm prose-h6:font-medium

                                prose-p:text-foreground
                                prose-strong:font-bold
                                prose-ul:list-disc
                                prose-ol:list-decimal
                                prose-li:my-1
                                prose-blockquote:border-l-4
                                prose-blockquote:pl-4
                                prose-blockquote:italic

                                max-h-96 overflow-y-auto
                            "
                            dangerouslySetInnerHTML={{ __html: project.description }}
                        />
                        )}
                    </div>

                    {/* Progress circle */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                        <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                                <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="7" className="text-muted/40" />
                                <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 32}`}
                                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - (project.progressPercent ?? 0) / 100)}`}
                                    className="text-primary transition-all duration-500"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-base font-bold text-primary">{project.progressPercent ?? 0}%</span>
                                <span className="text-[9px] text-muted-foreground">done</span>
                            </div>
                        </div>
                        <div className="text-center mt-1">
                            <p className="text-xs font-semibold text-foreground">{project.completedTasks ?? 0}/{project.totalTasks ?? 0}</p>
                            <p className="text-[10px] text-muted-foreground">tasks</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Start Date",      value: formatDate(project.startDate),        icon: Calendar, highlight: false },
                    { label: "Est. Completion", value: formatDate(project.estimatedEndDate), icon: Clock,    highlight: false },
                    { label: "Days Elapsed",    value: `${elapsed} days`,                   icon: Timer,    highlight: false },
                    { label: "Days Remaining",  value: `${remaining} days`,                 icon: Flag,     highlight: remaining < 14 },
                ].map(({ label, value, icon: Icon, highlight }) => (
                    <div key={label} className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Icon size={13} className="text-muted-foreground" />
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                        </div>
                        <p className={cn("text-base font-bold", highlight ? "text-destructive" : "text-foreground")}>
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Two column: Phases + Docs ── */}
            <div className="grid grid-cols-3 gap-4">

                {/* Phases — 2 cols */}
                <div className="col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-foreground">
                            Project Phases
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                                ({phases.filter(p => p.status === "completed").length}/{phases.length} completed)
                            </span>
                        </h2>
                    </div>

                    {phases.length === 0 ? (
                        <div className="flex items-center justify-center h-32 rounded-2xl border border-dashed border-border">
                            <p className="text-sm text-muted-foreground">No phases defined.</p>
                        </div>
                    ) : (
                        phases.map((phase) => (
                            <PhaseCard
                                key={phase._id}
                                phase={phase}
                                canChat={canChat}
                                currentUser={user}
                                isExpanded={expandedPhase === phase._id}
                                onToggle={() => setExpandedPhase(
                                    expandedPhase === phase._id ? null : phase._id
                                )}
                            />
                        ))
                    )}
                </div>

                {/* Right column: Docs + Created by */}
                <div className="space-y-4">

                    {/* Documents */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                            Documents ({docs.length})
                        </h2>

                        {docs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-24 rounded-xl border border-dashed border-border">
                                <FileText size={20} className="text-muted-foreground mb-1" />
                                <p className="text-xs text-muted-foreground">No documents</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {docs.map((doc) => {
                                    const fi = getFileIcon(doc.fileType);
                                    return (
                                        <div
                                            key={doc._id}
                                            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors group"
                                        >
                                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px]", fi.bg, fi.color)}>
                                                {fi.label}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-foreground truncate">{doc.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{formatDate(doc.uploadedAt)}</p>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <ExternalLink size={12} />
                                                </a>
                                                {role === "admin" && (
                                                    <button
                                                        onClick={() => handleDeleteDoc(doc._id)}
                                                        disabled={deletingDoc === doc._id}
                                                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                    >
                                                        {deletingDoc === doc._id
                                                            ? <Loader2 size={11} className="animate-spin" />
                                                            : <Trash2 size={11} />
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Project meta */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                            Project Info
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Created By</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                                        {project.createdBy?.name?.[0]?.toUpperCase() ?? "?"}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">{project.createdBy?.name ?? "—"}</p>
                                        <p className="text-[10px] text-muted-foreground">{project.createdBy?.email ?? ""}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="h-px bg-border" />
                            <div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Created</p>
                                <p className="text-xs font-semibold text-foreground mt-0.5">{formatDate(project.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Last Updated</p>
                                <p className="text-xs font-semibold text-foreground mt-0.5">{formatDate(project.updatedAt)}</p>
                            </div>
                            <div className="h-px bg-border" />
                            <div>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Client</p>
                                <p className="text-xs font-semibold text-foreground mt-0.5">{client.clientName ?? "—"}</p>
                                {client.email && <p className="text-[10px] text-muted-foreground">{client.email}</p>}
                                {client.phone && <p className="text-[10px] text-muted-foreground">{client.phone}</p>}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Edit dialog ── */}
            <Dialog open={editOpen} onOpenChange={(o) => { if (!o) setEditOpen(false); }}>
                <DialogContent className="sm:max-w-[940px] rounded-3xl p-0 overflow-hidden max-h-[90vh]">
                    <DialogHeader className="px-8 pt-8 pb-0">
                        <DialogTitle className="text-2xl font-bold">Edit Project</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            Update project details, phases and documents.
                        </DialogDescription>
                    </DialogHeader>
                    <ProjectForm
                        defaultValues={{
                            ...project,
                            client: typeof project.client === "object"
                                ? project.client._id
                                : project.client,
                            startDate:        project.startDate?.split("T")[0]        ?? "",
                            estimatedEndDate: project.estimatedEndDate?.split("T")[0] ?? "",
                            phases: (project.phases ?? []).map(p => ({
                                ...p,
                                estimatedEndDate: p.estimatedEndDate?.split("T")[0] ?? "",
                                assignees: (p.assignees ?? []).map(a =>
                                    typeof a === "object" ? a._id : a
                                ),
                            })),
                        }}
                        clients={clients}
                        onSave={handleUpdate}
                        onCancel={() => setEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>

        </div>
    );
}