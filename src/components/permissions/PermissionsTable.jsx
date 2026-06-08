"use client";
import { useState, useMemo } from "react";
import { DataTable } from "../Datatable";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_STYLES = {
    create: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    read:   "bg-blue-500/10   text-blue-600   border-blue-200",
    update: "bg-amber-500/10  text-amber-600  border-amber-200",
    delete: "bg-red-500/10    text-red-600    border-red-200",
};

export function PermissionsTable({ data, onEdit, onDelete }) {
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting]     = useState(false);
    const [deleteError,  setDeleteError]  = useState("");

    const columns = useMemo(() => [
        {
            accessorKey: "name",
            header: "Permission Name",
            cell: ({ row }) => (
                <span className="font-semibold text-foreground text-sm">
                    {row.original.name}
                </span>
            ),
        },
        {
            accessorKey: "module",
            header: "Module",
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.module}
                </span>
            ),
        },
        // replace just the action cell:
        {
            accessorKey: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const ACTION_STYLES = {
                    create: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
                    read:   "bg-blue-500/10   text-blue-600   border-blue-200",
                    update: "bg-amber-500/10  text-amber-600  border-amber-200",
                    delete: "bg-red-500/10    text-red-600    border-red-200",
                };

                // normalise: handle both string and array from API
                const actions = Array.isArray(row.original.actions)
                    ? row.original.actions
                    : [row.original.actions];

                return (
                    <div className="flex flex-wrap gap-1.5">
                        {actions.map((a) => (
                            <span
                                key={a}
                                className={cn(
                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize",
                                    ACTION_STYLES[a] ?? "bg-muted text-muted-foreground border-border"
                                )}
                            >
                                {a}
                            </span>
                        ))}
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "",
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                <MoreVertical size={15} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 bg-white rounded-xl">
                            <DropdownMenuItem
                                onClick={() => onEdit(row.original)}
                                className="gap-2 text-sm cursor-pointer"
                            >
                                <Pencil size={13} />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setDeleteError("");
                                    setDeleteTarget(row.original);
                                }}
                                className="gap-2 text-sm cursor-pointer text-destructive  focus:text-destructive focus:bg-destructive/10"
                            >
                                <Trash2 size={13} />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ], [onEdit]);

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
                data={data}
                searchPlaceholder="Search permissions..."
                pageSize={8}
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
                        <AlertDialogTitle>Delete Permission</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-foreground">
                                {deleteTarget?.name}
                            </span>
                            ? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deleteError && (
                        <p className="text-xs text-destructive font-medium px-1 -mt-2">
                            {deleteError}
                        </p>
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
                            className="rounded-xl hover:bg-red-500 cursor-pointer"
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
        </>
    );
}