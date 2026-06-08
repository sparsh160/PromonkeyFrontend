"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    MoreVertical, Trash2, Eye, Pencil,
    Loader2, Calendar,MessageSquare
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
import { DataTable } from "../Datatable";
import { ChatDrawer }    from "@/components/chat/ChatDrawer";
import { useAuth }       from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

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
};



export function TaskTable({ tasks, onEdit, onDelete }) {
    const router = useRouter();

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting]     = useState(false);
    const [deleteError,  setDeleteError]  = useState("");
    const { user } = useAuth();
    const [chat, setChat] = useState(null);

    const canChat = (task) => {
        const role = user?.role?.toLowerCase();
        if (role === "admin") return true;
        if (role === "employee") {
            
            const assigneeUserId = task.assignedTo?.user?._id;
            return assigneeUserId === user?._id;
        }
        return false;
    };

    const columns = useMemo(() => [
        {
            accessorKey: "name",
            header: "Task",
            cell: ({ row }) => {
                const t = row.original;
                return (
                    <div
                        className="cursor-pointer group/name"
                        onClick={() => router.push(`/promonkey/tasks/${t._id}`)}
                    >
                        <p className="text-sm font-semibold text-foreground group-hover/name:text-primary transition-colors">
                            {t.name}
                        </p>

                    </div>
                );
            },
        },
        {
            accessorKey: "project",
            header: "Project / Phase",
            accessorFn: (row) => row.project?.name ?? "",
            cell: ({ row }) => {
                const t = row.original;
                return (
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                            {t.project?.name ?? "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                            {t.phase?.name ?? "—"}
                        </p>
                    </div>
                );
            },
        },
        {
            accessorKey: "assignedTo",
            header: "Assigned To",
            accessorFn: (row) => row.assignedTo?.user?.name ?? "",
            cell: ({ row }) => {
                const emp = row.original.assignedTo;
                if (!emp) return (
                    <span className="text-xs text-muted-foreground italic">
                        Unassigned
                    </span>
                );
                const name = emp.user?.name ?? "—";
                const role = emp.role?.name ?? emp.department ?? "";
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                            {name[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                                {name}
                            </p>
                            {role && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                    {role}
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
                const t = row.original;
                const isOverdue = t.dueDate &&
                    new Date(t.dueDate) < new Date() &&
                    t.status !== "completed";
                return (
                    <div className="flex flex-col gap-1">
                        <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border capitalize w-fit",
                            STATUS_STYLES[t.status] ?? "bg-muted text-muted-foreground border-border"
                        )}>
                            {t.status?.replace(/_/g, " ")}
                        </span>
                        {isOverdue && (
                            <span className="text-[10px] font-semibold text-destructive">
                                Overdue
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "dueDate",
            header: "Due Date",
            cell: ({ row }) => {
                const t = row.original;
                const isOverdue = t.dueDate &&
                    new Date(t.dueDate) < new Date() &&
                    t.status !== "completed";
                return (
                    <div className="flex items-center gap-1.5">
                        <Calendar size={11} className={cn(
                            "shrink-0",
                            isOverdue ? "text-destructive" : "text-muted-foreground"
                        )} />
                        <span className={cn(
                            "text-xs font-semibold",
                            isOverdue ? "text-destructive" : "text-foreground"
                        )}>
                            {formatDate(t.dueDate)}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "estimatedHours",
            header: "Est. Hours",
            cell: ({ row }) => {
                const h = row.original.estimatedHours;
                return (
                    <span className="text-xs font-semibold text-foreground">
                        {h ? `${h} hrs` : "—"}
                    </span>
                );
            },
        },
        
        {
            id: "chat_col",
            header: "",
            enableSorting:      false,
            enableColumnFilter: false,
            cell: ({ row }) => {
                const t = row.original;
                if (!canChat(t)) return null;
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setChat({ type: "task", id: t._id, title: t.name });
                        }}
                        title="Task chat"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
                    >
                        <MessageSquare size={14} />
                    </button>
                );
            },
        },
        {
            id: "actions_col",
            header: "",
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ row }) => {
                const t = row.original;
                return (
                    <div className="flex justify-end">
                        <DropdownMenu >
                            <DropdownMenuTrigger asChild>
                                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground cursor-pointer">
                                    <MoreVertical size={15} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl bg-white">
                                <DropdownMenuItem
                                    onClick={() => router.push(`/promonkey/tasks/${t._id}`)}
                                    className="gap-2 text-sm cursor-pointer"
                                >
                                    <Eye size={13} />
                                    View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onEdit(t)}
                                    className="gap-2 text-sm cursor-pointer"
                                >
                                    <Pencil size={13} />
                                    Edit
                                </DropdownMenuItem>
                                <div className="h-px bg-border my-1" />
                                <DropdownMenuItem
                                    onClick={() => {
                                        setDeleteError("");
                                        setDeleteTarget(t);
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
    ], [router, onEdit]);

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
            <DataTable
                columns={columns}
                data={tasks}
                searchPlaceholder="Search tasks..."
                pageSize={10}
            />

            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(o) => {
                    if (!o) {
                        setDeleteTarget(null);
                        setDeleteError("");
                    }
                }}
            >
                <AlertDialogContent className="rounded-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Task</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-foreground">
                                {deleteTarget?.name}
                            </span>
                            ? This cannot be undone.
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