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
import { MoreVertical, Pencil, Trash2, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_STYLES = {
    create: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    read:   "bg-blue-500/10   text-blue-600   border-blue-200",
    update: "bg-amber-500/10  text-amber-600  border-amber-200",
    delete: "bg-red-500/10    text-red-600    border-red-200",
};

/* get name from string id or populated object */
function getParentName(parentRole) {
    if (!parentRole) return "—";
    if (typeof parentRole === "object") return parentRole.name;
    return parentRole;
}

/* get permission count from array of ids or objects */
function getPermCount(permissions) {
    return Array.isArray(permissions) ? permissions.length : 0;
}

export function RolesTable({ data, onEdit, onDelete }) {
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting,     setDeleting]     = useState(false);
    const [deleteError,  setDeleteError]  = useState("");

    const columns = useMemo(() => [
        {
            accessorKey: "name",
            header: "Role Name",
            cell: ({ row }) => (
                <span className="font-semibold text-foreground text-sm">
                    {row.original.name}
                </span>
            ),
        },
        {
            accessorKey: "parentRole",
            header: "Parent Role",
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {getParentName(row.original.parentRole)}
                </span>
            ),
        },
        {
            accessorKey: "permissions",
            header: "Permissions",
            cell: ({ row }) => {
                const count = getPermCount(row.original.permissions);
                const perms = row.original.permissions ?? [];

                /* show first 2 permission names if populated, else count badge */
                const isPopulated = perms.length > 0 && typeof perms[0] === "object";

                if (!isPopulated) {
                    return (
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-primary" />
                            <span className="text-sm font-semibold text-foreground">
                                {count}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {count === 1 ? "permission" : "permissions"}
                            </span>
                        </div>
                    );
                }

                return (
                    <div className="flex flex-wrap gap-1">
                        {perms.slice(0, 2).map((p) => (
                            <span
                                key={p._id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[11px] font-semibold text-primary"
                            >
                                <ShieldCheck size={9} />
                                {p.name}
                            </span>
                        ))}
                        {perms.length > 2 && (
                            <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold text-muted-foreground border border-border">
                                +{perms.length - 2} more
                            </span>
                        )}
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
                            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground cursor-pointer ">
                                <MoreVertical size={15} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 rounded-xl bg-white">
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
                                className="gap-2 text-sm cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
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
                searchPlaceholder="Search roles..."
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
                    <AlertDialogHeader >
                        <AlertDialogTitle>Delete Role</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the role{" "}
                            <span className="font-semibold text-foreground">
                                {deleteTarget?.name}
                            </span>
                            ? This may affect users assigned to this role.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {deleteError && (
                        <p className="text-xs text-destructive font-medium px-1 -mt-2">
                            {deleteError}
                        </p>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel
                            className="rounded-xl cursor-pointer "
                            disabled={deleting}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmDelete(); }}
                            disabled={deleting}
                            className="rounded-xl  hover:bg-red-500 cursor-pointer "
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