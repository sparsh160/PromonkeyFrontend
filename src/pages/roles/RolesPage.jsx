"use client";
import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { useApi }   from "@/hooks/useApi";
import { apiFetch } from "@/lib/api";
import { RoleForm }   from "@/components/roles/RolesForm";
import { RolesTable } from "@/components/roles/RolesTable";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export default function RolesPage() {

const { data: roles, loading: rolesLoading, error: rolesError, refetch: refetchRoles }
    = useApi("/api/roles");

const { data: permissions, loading: permissionsLoading }
    = useApi("/api/permissions");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    // ── POST /api/roles ───────────────────────────────────
    // ── PUT  /api/roles/:id ───────────────────────────────
    async function handleSave(formData) {
        if (editTarget) {
            await apiFetch(`/api/roles/${editTarget._id}`, {
                method: "PUT",
                body: JSON.stringify(formData),
            });
        } else {
            await apiFetch("/api/roles", {
                method: "POST",
                body: JSON.stringify(formData),
            });
        }
        closeDialog();
        refetchRoles();
    }

    // ── DELETE /api/roles/:id ─────────────────────────────
    async function handleDelete(id) {
        await apiFetch(`/api/roles/${id}`, { method: "DELETE" });
        refetchRoles();
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
                    <h1 className="text-2xl font-bold text-foreground">Roles</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage roles and their associated permissions.
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    className="gap-2 rounded-xl shadow shadow-primary/20"
                >
                    <Plus size={16} />
                    Add Role
                </Button>
            </div>

            {/* Fetch error */}
            {rolesError && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm font-medium text-destructive">
                    {rolesError}
                </div>
            )}

            {/* Loading / Table */}
            {rolesLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={28} className="animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading roles...</p>
                    </div>
                </div>
            ) : (
                <RolesTable
                    data={roles}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                />
            )}

            {/* Create / Edit dialog */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(o) => { if (!o) closeDialog(); }}
            >
                <DialogContent className="sm:max-w-[600px] rounded-3xl bg-white p-0 overflow-hidden">
                    <DialogHeader className="px-8 pt-8 pb-0">
                        <DialogTitle className="text-2xl font-bold text-foreground">
                            {editTarget ? "Edit Role" : "New Role"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            Define a role, assign a parent, and attach permissions.
                        </DialogDescription>
                    </DialogHeader>
                    <RoleForm
                        defaultValues={editTarget}
                        roles={roles}
                        permissions={permissions}
                        permissionsLoading={permissionsLoading}
                        onSave={handleSave}
                        onCancel={closeDialog}
                    />
                </DialogContent>
            </Dialog>

        </div>
    );
}