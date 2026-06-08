"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Calendar, Clock, User,
    Briefcase, FolderKanban, Layers,
    CheckCircle2, Circle, Loader2,
    Mail, Hash, Timer, AlertCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        month: "long", day: "2-digit", year: "numeric",
    });
}

const STATUS_STYLES = {
    not_started: "bg-slate-500/10 text-slate-500  border-slate-200",
    in_progress: "bg-blue-500/10  text-blue-600   border-blue-200",
    completed:   "bg-green-500/10 text-green-600  border-green-200",
    on_hold:     "bg-amber-500/10 text-amber-600  border-amber-200",
};

function InfoCard({ title, children }) {
    return (
        <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                {title}
            </h3>
            {children}
        </div>
    );
}

function InfoRow({ icon: Icon, label, value, valueClass = "" }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-border/60 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={14} className="text-primary" />
            </div>
            <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                    {label}
                </p>
                <p className={cn("text-sm font-semibold text-foreground mt-0.5", valueClass)}>
                    {value || "—"}
                </p>
            </div>
        </div>
    );
}

export default function TaskDetailPage({ id }) {
    const router = useRouter();
    const [task,     setTask]     = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState("");
    const [toggling, setToggling] = useState(null);

    async function load() {
        setLoading(true);
        setError("");
        try {
            const data = await apiFetch(`/api/tasks/${id}`);
            setTask(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { if (id) load(); }, [id]);

    async function handleStepToggle(stepId) {
        setToggling(stepId);
        try {
            await apiFetch(`/api/tasks/${id}/steps/${stepId}`, { method: "PATCH" });
            await load(); // refresh
        } catch (e) {
            console.error(e);
        } finally {
            setToggling(null);
        }
    }

    /* ── loading ── */
    if (!id || loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading task...</p>
            </div>
        </div>
    );

    /* ── error ── */
    if (error) return (
        <div className="space-y-4 max-w-4xl">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={16} /> Back
            </button>
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium">
                {error}
            </div>
        </div>
    );

    if (!task) return null;

    const assignee  = task.assignedTo ?? {};
    const user      = assignee.user   ?? {};
    const role      = assignee.role   ?? {};
    const phase     = task.phase      ?? {};
    const project   = task.project    ?? {};
    const steps     = task.steps      ?? [];
    const done      = steps.filter(s => s.isCompleted).length;
    const progress  = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;

    const isOverdue = task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        task.status !== "completed";

    return (
        <div className="space-y-6 max-w-5xl">

            {/* ── Back + Breadcrumb ── */}
            <div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                    <ArrowLeft size={16} />
                    Back to Tasks
                </button>
                <p className="text-xs text-muted-foreground">
                    <button
                        onClick={() => router.push("/promonkey/tasks")}
                        className="hover:text-primary transition-colors"
                    >
                        Tasks
                    </button>
                    {project.name && (
                        <>
                            {" "}&rsaquo;{" "}
                            <button
                                onClick={() => router.push(`/promonkey/projects/${project._id}`)}
                                className="hover:text-primary transition-colors"
                            >
                                {project.name}
                            </button>
                        </>
                    )}
                    {phase.name && (
                        <>{" "}&rsaquo; <span className="text-foreground font-medium">{phase.name}</span></>
                    )}
                    {" "}&rsaquo; <span className="text-foreground font-medium">{task.name}</span>
                </p>
            </div>

            {/* ── Hero Card ── */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-foreground leading-tight">
                            {task.name}
                        </h1>
                        {task.description && (
                            <div
                                className="prose prose-sm max-w-none text-muted-foreground mt-2 leading-relaxed
                                        prose-headings:text-foreground prose-strong:text-foreground
                                        prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-xs
                                        prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                                        prose-a:text-primary prose-ul:text-foreground prose-ol:text-foreground"
                                dangerouslySetInnerHTML={{ __html: task.description }}
                            />
                        )}

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                            <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold border capitalize",
                                STATUS_STYLES[task.status] ?? "bg-muted text-muted-foreground"
                            )}>
                                {task.status?.replace(/_/g, " ")}
                            </span>

                            {isOverdue && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
                                    <AlertCircle size={11} />
                                    Overdue
                                </span>
                            )}

                            {project.name && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                                    <FolderKanban size={11} />
                                    {project.name}
                                </span>
                            )}

                            {phase.name && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                    <Layers size={11} />
                                    {phase.name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Progress circle */}
                    {steps.length > 0 && (
                        <div className="shrink-0 flex flex-col items-center gap-1">
                            <div className="relative w-16 h-16">
                                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                                    <circle
                                        cx="32" cy="32" r="26"
                                        fill="none" stroke="currentColor"
                                        strokeWidth="6"
                                        className="text-muted/40"
                                    />
                                    <circle
                                        cx="32" cy="32" r="26"
                                        fill="none" stroke="currentColor"
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 26}`}
                                        strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`}
                                        className="text-primary transition-all duration-500"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-bold text-primary">{progress}%</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium">
                                {done}/{steps.length} steps
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Two column ── */}
            <div className="grid grid-cols-2 gap-4">

                {/* LEFT: Task Details + Assignee */}
                <div className="col-span-1 space-y-4">

                    {/* Task details */}
                    <InfoCard title="Task Details">
                        <InfoRow
                            icon={Calendar}
                            label="Due Date"
                            value={formatDate(task.dueDate)}
                            valueClass={isOverdue ? "text-destructive" : ""}
                        />
                        <InfoRow
                            icon={Timer}
                            label="Estimated Hours"
                            value={task.estimatedHours ? `${task.estimatedHours} hrs` : null}
                        />
                        <InfoRow
                            icon={Clock}
                            label="Actual Hours Logged"
                            value={`${task.actualHoursLogged ?? 0} hrs`}
                        />
                        <InfoRow
                            icon={Calendar}
                            label="Created At"
                            value={formatDate(task.createdAt)}
                        />
                        <InfoRow
                            icon={Calendar}
                            label="Updated At"
                            value={formatDate(task.updatedAt)}
                        />
                    </InfoCard>

                    {/* Assignee */}
                    <InfoCard title="Assigned To">
                        {task.assignedTo ? (
                            <div className="space-y-0">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                                        {user.name?.[0]?.toUpperCase() ?? "?"}
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">{user.name ?? "—"}</p>
                                        <p className="text-xs text-primary font-semibold">{role.name ?? "—"}</p>
                                    </div>
                                </div>
                                <InfoRow icon={Mail}     label="Email"      value={user.email} />
                                <InfoRow icon={Briefcase} label="Department" value={assignee.department} />
                                <InfoRow icon={Hash}     label="Employee ID" value={assignee.employeeId} />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-16 text-sm text-muted-foreground italic">
                                No assignee
                            </div>
                        )}
                    </InfoCard>

                    {/* Phase info */}
                    <InfoCard title="Phase Info">
                        <InfoRow icon={Layers}      label="Phase"   value={phase.name} />
                        <InfoRow icon={FolderKanban} label="Project" value={project.name} />
                    </InfoCard>
                </div>

                {/* RIGHT: Steps checklist */}
                <div className="col-span-2">
                    <div className="bg-card border border-border rounded-2xl p-5 h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                Steps / Checklist
                            </h3>
                            {steps.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        {done} of {steps.length} completed
                                    </span>
                                    {/* Progress bar */}
                                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-primary">{progress}%</span>
                                </div>
                            )}
                        </div>

                        {steps.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-dashed border-border">
                                <CheckCircle2 size={28} className="text-muted-foreground mb-2" />
                                <p className="text-sm font-semibold text-foreground">No steps defined</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    This task has no checklist items.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {steps.map((step, i) => (
                                    <button
                                        key={step._id}
                                        type="button"
                                        onClick={() => handleStepToggle(step._id)}
                                        disabled={toggling === step._id}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-150",
                                            step.isCompleted
                                                ? "bg-green-500/5 border-green-200 hover:bg-green-500/10"
                                                : "bg-background border-border hover:bg-muted/30 hover:border-primary/30"
                                        )}
                                    >
                                        {/* Checkbox */}
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200",
                                            step.isCompleted
                                                ? "bg-green-500 border-green-500"
                                                : "border-border bg-background"
                                        )}>
                                            {toggling === step._id ? (
                                                <Loader2 size={10} className="animate-spin text-muted-foreground" />
                                            ) : step.isCompleted ? (
                                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                </svg>
                                            ) : null}
                                        </div>

                                        {/* Step number */}
                                        <span className={cn(
                                            "text-[10px] font-bold shrink-0 w-5 text-center",
                                            step.isCompleted ? "text-green-500" : "text-muted-foreground"
                                        )}>
                                            {i + 1}
                                        </span>

                                        {/* Title */}
                                        <span className={cn(
                                            "flex-1 text-sm font-medium",
                                            step.isCompleted
                                                ? "line-through text-muted-foreground"
                                                : "text-foreground"
                                        )}>
                                            {step.title}
                                        </span>

                                        {/* Completed badge */}
                                        {step.isCompleted && (
                                            <span className="text-[10px] font-bold text-green-600 shrink-0">
                                                Done ✓
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Summary footer */}
                        {steps.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                        {done} Completed
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                                        {steps.length - done} Remaining
                                    </span>
                                </div>
                                <span className={cn(
                                    "text-xs font-bold",
                                    progress === 100 ? "text-green-600" : "text-primary"
                                )}>
                                    {progress === 100 ? "All done! 🎉" : `${progress}% complete`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}