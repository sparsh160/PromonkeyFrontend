"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    MoreVertical, Pencil, Trash2,
    Mail, Phone, Briefcase, Calendar,
    User,
} from "lucide-react";
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
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        day: "2-digit", month: "short", year: "numeric",
    });
}

export function EmployeeCard({ employee, onEdit, onDelete }) {
    const router = useRouter();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting,   setDeleting]   = useState(false);
    const [deleteError,setDeleteError]= useState("");

    const user   = employee.user   ?? {};
    const role   = employee.role   ?? {};
    const avatar = user.profileImage?.url ?? null;
    const letter = user.name?.[0]?.toUpperCase() ?? "E";

    const statusStyle = employee.status === "Active"
        ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
        : "bg-slate-500/10 text-slate-500 border-slate-200";

    async function confirmDelete(e) {
        e.stopPropagation();
        setDeleting(true);
        setDeleteError("");
        try {
            await onDelete(employee._id);
            setDeleteOpen(false);
        } catch (err) {
            setDeleteError(err.message);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <>
            <div
                onClick={() => router.push(`/promonkey/employees/${employee._id}`)}
                className="group relative bg-card border border-border rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
            >
                {/* More vert — stops card click */}
                <div
                    className="absolute top-3 right-3"
                    onClick={(e) => e.stopPropagation()}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 flex items-center cursor-pointer justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100">
                                <MoreVertical size={15} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 rounded-xl bg-white">
                            <DropdownMenuItem
                                onClick={() => onEdit(employee)}
                                className="gap-2 text-sm cursor-pointer"
                            >
                                <Pencil size={13} />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => { setDeleteError(""); setDeleteOpen(true); }}
                                className="gap-2 text-sm cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <Trash2 size={13} />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Avatar + Status */}
                <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 overflow-hidden flex items-center justify-center mb-3 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                        {avatar ? (
                            <img src={avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xl font-bold text-primary">{letter}</span>
                        )}
                    </div>
                    <h3 className="font-bold text-foreground text-sm leading-tight">
                        {user.name ?? "—"}
                    </h3>
                    <p className="text-xs text-primary font-semibold mt-0.5">
                        {role.name ?? "—"}
                    </p>
                    <span className={cn(
                        "mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border",
                        statusStyle
                    )}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {employee.status ?? "Active"}
                    </span>
                </div>

                {/* Divider */}
                <div className="h-px bg-border mb-3" />

                {/* Info rows */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail size={12} className="shrink-0 text-primary/60" />
                        <span className="truncate">{user.email ?? "—"}</span>
                    </div>
                    {user.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone size={12} className="shrink-0 text-primary/60" />
                            <span>{user.phone}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Briefcase size={12} className="shrink-0 text-primary/60" />
                        <span>{employee.department ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar size={12} className="shrink-0 text-primary/60" />
                        <span>{formatDate(employee.joiningDate)}</span>
                    </div>
                </div>

                {/* Employee ID badge */}
                {employee.employeeId && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-center">
                        <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                            {employee.employeeId}
                        </span>
                    </div>
                )}
            </div>

            {/* Delete confirmation */}
            <AlertDialog open={deleteOpen} onOpenChange={(o) => { if (!o) { setDeleteOpen(false); setDeleteError(""); } }}>
                <AlertDialogContent className="rounded-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-foreground">{user.name}</span>?
                            This will also delete their login account.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                        <div className="mx-1 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-medium text-destructive">
                            {deleteError}
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl cursor-pointer" disabled={deleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
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
        </>
    );
}