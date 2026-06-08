"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    MoreVertical, Pencil, Trash2, Loader2,
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
import { cn } from "@/lib/utils";

export function EntityCard({
    id,
    href,
    avatar,
    initials = "?",
    title,
    subtitle,
    badge,
    rows = [],
    footer,
    onEdit,
    onDelete,
    deleteTitle   = "Delete",
    deleteDesc    = "Are you sure? This action cannot be undone.",
}) {
    const router = useRouter();
    const [deleteOpen,  setDeleteOpen]  = useState(false);
    const [deleting,    setDeleting]    = useState(false);
    const [deleteError, setDeleteError] = useState("");

    async function confirmDelete(e) {
        e.stopPropagation();
        setDeleting(true);
        setDeleteError("");
        try {
            await onDelete(id);
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
                onClick={() => href && router.push(href)}
                className={cn(
                    "group relative bg-card border border-border rounded-2xl p-5 transition-all duration-200",
                    href && "cursor-pointer hover:shadow-md hover:border-primary/30"
                )}
            >
                {/* More vert */}
                {(onEdit || onDelete) && (
                    <div
                        className="absolute top-3 right-3 z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 cursor-pointer">
                                    <MoreVertical size={15} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36 rounded-xl">
                                {onEdit && (
                                    <DropdownMenuItem
                                        onClick={() => onEdit()}
                                        className="gap-2 text-sm cursor-pointer"
                                    >
                                        <Pencil size={13} />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {onDelete && (
                                    <DropdownMenuItem
                                        onClick={() => { setDeleteError(""); setDeleteOpen(true); }}
                                        className="gap-2 text-sm cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                    >
                                        <Trash2 size={13} />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

                {/* Avatar + Title */}
                <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 overflow-hidden flex items-center justify-center mb-3 ring-2 ring-border group-hover:ring-primary/30 transition-all shrink-0">
                        {avatar ? (
                            <img
                                src={avatar}
                                alt={title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-lg font-bold text-primary">
                                {initials}
                            </span>
                        )}
                    </div>

                    <h3 className="font-bold text-foreground text-sm leading-tight pr-6">
                        {title ?? "—"}
                    </h3>

                    {subtitle && (
                        <p className="text-xs text-primary font-semibold mt-0.5">
                            {subtitle}
                        </p>
                    )}

                    {badge && (
                        <span className={cn(
                            "mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border",
                            badge.className
                        )}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {badge.label}
                        </span>
                    )}
                </div>

                {/* Divider */}
                {rows.length > 0 && <div className="h-px bg-border mb-3" />}

                {/* Info rows */}
                <div className="space-y-2">
                    {rows.map(({ icon: Icon, label, value }, i) => (
                        value ? (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                {Icon && <Icon size={12} className="shrink-0 text-primary/60" />}
                                <span className="truncate" title={value}>{value}</span>
                            </div>
                        ) : null
                    ))}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-center">
                        <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                            {footer}
                        </span>
                    </div>
                )}
            </div>

            {/* Delete dialog */}
            <AlertDialog
                open={deleteOpen}
                onOpenChange={(o) => { if (!o) { setDeleteOpen(false); setDeleteError(""); } }}
            >
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{deleteTitle}</AlertDialogTitle>
                        <AlertDialogDescription>{deleteDesc}</AlertDialogDescription>
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