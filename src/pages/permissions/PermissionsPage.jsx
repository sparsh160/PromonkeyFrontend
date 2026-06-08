"use client";
import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApi }  from "@/hooks/useApi";
import { apiFetch } from "@/lib/api";
import { PermissionForm } from "@/components/permissions/PermissionsForm";
import { PermissionsTable } from "@/components/permissions/PermissionsTable";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export default function PermissionsPage() {

    // ── GET /api/permissions ──────────────────────────────
    const { data, loading, error, refetch } = useApi("/api/permissions");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    // ── POST /api/permissions ─────────────────────────────
    // ── PUT  /api/permissions/:id ─────────────────────────
    async function handleSave(formData) {
        if (editTarget) {
            await apiFetch(`/api/permissions/${editTarget._id}`, {
                method: "PUT",
                body: JSON.stringify(formData),
            });
        } else {
            await apiFetch("/api/permissions", {
                method: "POST",
                body: JSON.stringify(formData),
            });
        }
        closeDialog();
        refetch(); // refresh list
    }

    // ── DELETE /api/permissions/:id ───────────────────────
    async function handleDelete(id) {
        await apiFetch(`/api/permissions/${id}`, { method: "DELETE" });
        refetch(); // refresh list
    }

    function openCreate() {
        setEditTarget(null);
        setDialogOpen(true);
    }

    function openEdit(row) {
        setEditTarget(row);
        setDialogOpen(true);
    }

    function closeDialog() {
        setDialogOpen(false);
        setEditTarget(null);
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Permissions
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage fine-grained access control for system modules.
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    className="gap-2 rounded-xl shadow shadow-primary/20 cursor-pointer"
                >
                    <Plus size={16} />
                    Add Permission
                </Button>
            </div>

            {/* Fetch error */}
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
                        <p className="text-sm text-muted-foreground">
                            Loading permissions...
                        </p>
                    </div>
                </div>
            ) : (
                <PermissionsTable
                    data={data}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                />
            )}

            {/* Create / Edit dialog */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(o) => { if (!o) closeDialog(); }}
            >
                <DialogContent className="sm:max-w-[560px] bg-white rounded-3xl p-0 overflow-hidden">
                    <DialogHeader className="px-8 pt-8 pb-0">
                        <DialogTitle className="text-2xl font-bold text-foreground">
                            {editTarget ? "Edit Permission" : "New Access Permission"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            Define fine-grained access control for specific system modules and actions.
                        </DialogDescription>
                    </DialogHeader>
                    <PermissionForm
                        defaultValues={editTarget}
                        onSave={handleSave}
                        onCancel={closeDialog}
                    />
                </DialogContent>
            </Dialog>

        </div>
    );
}