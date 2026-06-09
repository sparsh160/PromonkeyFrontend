"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    MoreVertical, Trash2, Eye, Pencil,
    Loader2, Calendar,MessageSquare,
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { DataTable } from "../Datatable";
import { ChatDrawer }  from "@/components/chat/ChatDrawer";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { cn } from "@/lib/utils";
import { apiFetch, API_BASE, getToken } from "@/lib/api";
import { useAuth }     from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "2-digit", year: "numeric",
    });
}

const STATUS_STYLES = {
    not_started: "bg-slate-500/10 text-slate-500  border-slate-200",
    in_progress: "bg-blue-500/10  text-blue-600   border-blue-200",
    completed:   "bg-green-500/10 text-green-600  border-green-200",
    on_hold:     "bg-amber-500/10 text-amber-600  border-amber-200",
    cancelled:   "bg-red-500/10   text-red-600    border-red-200",
};

const PRIORITY_STYLES = {
    low:      "bg-slate-500/10 text-slate-500",
    medium:   "bg-blue-500/10  text-blue-600",
    high:     "bg-amber-500/10 text-amber-600",
    critical: "bg-red-500/10   text-red-600",
};

function getProgress(project) {
    return project.progressPercent ?? 0;
}

export function ProjectList({ projects, onDelete, onRefetch }) {
    const router = useRouter();
    const { user } = useAuth();
    const { data: clients } = useApi("/api/clients");

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting]     = useState(false);
    const [deleteError,  setDeleteError]  = useState("");

    const [editTarget,   setEditTarget]   = useState(null);
    const [editOpen,     setEditOpen]     = useState(false);
    const [chat, setChat] = useState(null);
    const canChat = ["admin", "employee"].includes(user?.role?.toLowerCase());

    function openProjectChat(project) {
        setChat({
            type:  "project",
            id:    project._id,
            title: project.name,
        });
    }

    function openPhaseChat(phase, projectName) {
        setChat({
            type:  "phase",
            id:    phase._id,
            title: `${projectName} › ${phase.name}`,
        });
    }

    /* ── PUT /api/projects/:id ── */
  //  async function handleUpdate(formData) {
       // const res = await fetch(`${API_BASE}/api/projects/${editTarget._id}`, {
    //        method: "PUT",
     //       headers: { Authorization: `Bearer ${getToken()}` },
          //  body: formData,
       // });
      //  const json = await res.json().catch(() => ({}));
      //  if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
       // setEditOpen(false);
      //  setEditTarget(null);
      //  onRefetch?.();
   // }

    async function handleUpdate(formData) {     
        const res = await fetch(`${API_BASE}/api/projects/${editTarget._id}`, {         
            method: "PUT",        
            headers: { Authorization: `Bearer ${getToken()}` },         
            body: formData,     
        });     
        const json = await res.json().catch(() => ({}));     
        if (!res.ok) throw new Error(json.message || `Error ${res.status}`);     
        setEditOpen(false);     
        setEditTarget(null);     
        onRefetch?.(); 
    }

    const columns = useMemo(() => [
        {
            accessorKey: "name",
            header: "Project Name",
            cell: ({ row }) => {
                const p = row.original;
                return (
                    <div
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => router.push(`/promonkey/projects/${p._id}`)}
                    >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                                {p.name?.[0]?.toUpperCase() ?? "P"}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                                {p.name}
                            </p>

                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "client",
            header: "Client",
            accessorFn: (row) => {
                const c = row.client ?? {};
                return c.clientName ?? c.name ?? "";
            },
            cell: ({ row }) => {
                const c    = row.original.client ?? {};
                const name = c.clientName ?? c.name ?? "—";
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {name[0]?.toUpperCase() ?? "C"}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                                {name}
                            </p>
                            {c.companyName && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                    {c.companyName}
                                </p>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const p = row.original;
                return (
                    <div className="flex flex-col gap-1">
                        <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border capitalize w-fit",
                            STATUS_STYLES[p.status] ?? "bg-muted text-muted-foreground border-border"
                        )}>
                            {p.status?.replace(/_/g, " ")}
                        </span>
                        <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize w-fit",
                            PRIORITY_STYLES[p.priority] ?? "bg-muted text-muted-foreground"
                        )}>
                            {p.priority}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "startDate",
            header: "Timeline",
            cell: ({ row }) => {
                const p = row.original;
                return (
                    <div className="flex items-start gap-1.5 text-xs">
                        <Calendar size={11} className="text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                            <p className="font-semibold text-foreground">
                                {formatDate(p.startDate)}
                            </p>
                            <p className="text-muted-foreground text-[10px]">
                                → {formatDate(p.estimatedEndDate)}
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "progress",
            header: "Progress",
            enableColumnFilter: false,
            accessorFn: (row) => row.progressPercent || 0,
            cell: ({ row }) => {
                const progress = row.original.progressPercent || 0;

                return (
                    <div className="space-y-1 min-w-[110px]">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-muted-foreground">
                                {row.original.completedTasks || 0}/
                                {row.original.totalTasks || 0} tasks
                            </span>

                            <span className="text-xs font-bold text-primary">
                                {progress}%
                            </span>
                        </div>

                        <Progress
                            value={progress}
                            className="h-1.5"
                        />
                    </div>
                );
            },
        },
        /* ── Chat column ── */
        ...(canChat ? [{
            id: "chat_col",
            header: "",
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ row }) => {
                const p = row.original;
                return (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>

                        {/* Project chat */}
                        <button
                            onClick={() => openProjectChat(p)}
                            title="Project chat"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
                        >
                            <MessageSquare size={14} />
                        </button>


                    </div>
                );
            },
        }] : []),
        {
            id: "actions_col",
            header: "",
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ row }) => {
                const p = row.original;
                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground cursor-pointer">
                                    <MoreVertical size={15} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl bg-white">

                                {/* View */}
                                <DropdownMenuItem
                                    onClick={() => router.push(`/promonkey/projects/${p._id}`)}
                                    className="gap-2 text-sm cursor-pointer"
                                >
                                    <Eye size={13} />
                                    View
                                </DropdownMenuItem>

                                {/* Edit */}
                                <DropdownMenuItem
                                    onClick={() => {
                                        setEditTarget(p);
                                        setEditOpen(true);
                                    }}
                                    className="gap-2 text-sm cursor-pointer"
                                >
                                    <Pencil size={13} />
                                    Edit
                                </DropdownMenuItem>

                                {/* Divider */}
                                <div className="h-px bg-border my-1" />

                                {/* Delete */}
                                <DropdownMenuItem
                                    onClick={() => {
                                        setDeleteError("");
                                        setDeleteTarget(p);
                                    }}
                                    className="gap-2 text-sm cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                    <Trash2 size={13} />
                                    Delete
                                </DropdownMenuItem>

                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ], [router,canChat]);

    async function confirmDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        setDeleteError("");
        try {
            await onDelete(deleteTarget._id);
            setDeleteTarget(null);
        } catch (e) {
            setDeleteError(e.message);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <>
            {/* DataTable */}
            <DataTable
                columns={columns}
                data={projects}
                searchPlaceholder="Search projects..."
                pageSize={8}
            />

            {/* ── Edit Dialog ── */}
            <Dialog
                open={editOpen}
                onOpenChange={(o) => {
                    if (!o) {
                        setEditOpen(false);
                        setEditTarget(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 bg-white overflow-hidden">
                    <DialogHeader className="px-8 pt-8 pb-0">
                        <DialogTitle className="text-2xl font-bold">
                            Edit Project
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            Update project details, phases and documents.
                        </DialogDescription>
                    </DialogHeader>
                    {editTarget && (
                        <ProjectForm
                            defaultValues={editTarget}
                            clients={clients}
                            onSave={handleUpdate}
                            onCancel={() => {
                                setEditOpen(false);
                                setEditTarget(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Delete Dialog ── */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(o) => {
                    if (!o) {
                        setDeleteTarget(null);
                        setDeleteError("");
                    }
                }}
            >
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-foreground">
                                {deleteTarget?.name}
                            </span>
                            ? This will permanently remove all phases and documents.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deleteError && (
                        <div className="mx-1 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive">
                            {deleteError}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            className="rounded-xl cursor-pointer"
                            disabled={deleting}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmDelete(); }}
                            disabled={deleting}
                            className="rounded-xl  hover:bg-red-500 cursor-pointer"
                        >
                            {deleting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={14} className="animate-spin" />
                                    Deleting...
                                </span>
                            ) : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {/* Chat drawer */}
            <ChatDrawer
                open={!!chat}
                onClose={() => setChat(null)}
                type={chat?.type}
                id={chat?.id}
                title={chat?.title}
                currentUser={user}
            />
        </>
    );
}