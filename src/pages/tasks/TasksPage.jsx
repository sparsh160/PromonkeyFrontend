"use client";
import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { useApi }   from "@/hooks/useApi";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { TaskForm }  from "@/components/tasks/TaskForm";
import { TaskTable } from "@/components/tasks/TaskTable";
import {
    Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function TasksPage() {
    const [filterProject, setFilterProject] = useState("all");
    const [filterPhase,   setFilterPhase]   = useState("all");
    const [dialogOpen,    setDialogOpen]    = useState(false);
    const [editTarget,    setEditTarget]    = useState(null);
    

    /* ── fetch tasks based on filter ── */
    const taskUrl = filterPhase !== "all"
        ? `/api/tasks?phase=${filterPhase}`
        : filterProject !== "all"
        ? `/api/tasks?project=${filterProject}`
        : "/api/tasks";

    const { data: tasks, loading, error, refetch } = useApi(taskUrl);

    /* ── fetch projects + employees for form ── */
    const { data: projects   } = useApi("/api/projects");
    const { data: employees  } = useApi("/api/employees");

    /* ── phases from selected project ── */
    const [phases, setPhases] = useState([]);
    useEffect(() => {
        if (filterProject === "all") { setPhases([]); return; }
        const proj = projects.find(p => p._id === filterProject);
        setPhases(proj?.phases ?? []);
    }, [filterProject, projects]);

    /* ── stat counts ── */
    const total      = tasks.length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const completed  = tasks.filter(t => t.status === "completed").length;
    const overdue    = tasks.filter(t =>
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed"
    ).length;

    /* ── POST /api/tasks ── */
    async function handleCreate(body) {
        await apiFetch("/api/tasks", {
            method: "POST",
            body:   JSON.stringify(body),
        });
        closeDialog();
        refetch();
    }

    /* ── PUT /api/tasks/:id ── */
    async function handleUpdate(body) {
        await apiFetch(`/api/tasks/${editTarget._id}`, {
            method: "PUT",
            body:   JSON.stringify(body),
        });
        closeDialog();
        refetch();
    }

    /* ── DELETE /api/tasks/:id ── */
    async function handleDelete(id) {
        await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
        refetch();
    }

    /* ── PATCH /api/tasks/:id/steps/:stepId ── */
    async function handleStepToggle(taskId, stepId) {
        await apiFetch(`/api/tasks/${taskId}/steps/${stepId}`, { method: "PATCH" });
        refetch();
        /* also refresh view if open */
        if (viewTarget?._id === taskId) {
            const updated = await apiFetch(`/api/tasks/${taskId}`).catch(() => null);
            if (updated) setViewTarget(updated);
        }
    }

    async function handleSave(body) {
        if (editTarget) await handleUpdate(body);
        else            await handleCreate(body);
    }

    function openCreate() { setEditTarget(null); setDialogOpen(true); }
    function openEdit(task) { setEditTarget(task); setDialogOpen(true); }
    

    function closeDialog() { setDialogOpen(false); setEditTarget(null); }
    

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage and track all project tasks.
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2 rounded-xl shadow shadow-primary/20 cursor-pointer">
                    <Plus size={16} /> Add Task
                </Button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Total Tasks",  value: total,      color: "text-blue-600",  bg: "bg-blue-500/10"  },
                    { label: "In Progress",  value: inProgress, color: "text-amber-600", bg: "bg-amber-500/10" },
                    { label: "Completed",    value: completed,  color: "text-green-600", bg: "bg-green-500/10" },
                    { label: "Overdue",      value: overdue,    color: "text-red-600",   bg: "bg-red-500/10"   },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`rounded-2xl border border-border ${bg} p-4`}>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            {label}
                        </p>
                        <p className={`text-3xl font-bold mt-1 ${color}`}>
                            {String(value).padStart(2, "0")}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                {/* Project filter */}
                <Select
                    value={filterProject}
                    onValueChange={(v) => { setFilterProject(v); setFilterPhase("all"); }}
                >
                    <SelectTrigger className="w-48 h-9 text-sm rounded-lg bg-card">
                        <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-background">
                        <SelectItem value="all" className="text-sm">All Projects</SelectItem>
                        {projects.map(p => (
                            <SelectItem key={p._id} value={p._id} className="text-sm">
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Phase filter — only when project selected */}
                {filterProject !== "all" && phases.length > 0 && (
                    <Select value={filterPhase} onValueChange={setFilterPhase}>
                        <SelectTrigger className="w-48 h-9 text-sm rounded-lg bg-card">
                            <SelectValue placeholder="All Phases" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-background">
                            <SelectItem value="all" className="text-sm">All Phases</SelectItem>
                            {phases.map(p => (
                                <SelectItem key={p._id} value={p._id} className="text-sm">
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm font-medium text-destructive">
                    {error}
                </div>
            )}

            {/* Loading / Table */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={28} className="animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading tasks...</p>
                    </div>
                </div>
            ) : (
                <TaskTable
                    tasks={tasks}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    
                />
            )}

            {/* ── Create / Edit Dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
                <DialogContent className="sm:max-w-[620px] rounded-3xl p-0 overflow-hidden max-h-[90vh] bg-white">
                    <DialogHeader className="px-8 pt-8 pb-0 shrink-0">
                        <DialogTitle className="text-2xl font-bold">
                            {editTarget ? "Edit Task" : "Create New Task"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            {editTarget
                                ? "Update task details and steps."
                                : "Fill in the details to create a new task."}
                        </DialogDescription>
                    </DialogHeader>
                    <TaskForm
                        defaultValues={editTarget}
                        projects={projects}
                        employees={employees}
                        onSave={handleSave}
                        onCancel={closeDialog}
                    />
                </DialogContent>
            </Dialog>


        </div>
    );
}


