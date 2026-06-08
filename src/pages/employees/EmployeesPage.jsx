"use client";
import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { useApi }   from "@/hooks/useApi";
import { apiFetch, API_BASE, getToken } from "@/lib/api";
import { EmployeeForm }     from "@/components/employees/EmployeeForm";
import { EmployeeCardGrid } from "@/components/employees/EmployeeCardGrid";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export default function EmployeesPage() {

    // GET /api/employees
    const { data: employees, loading, error, refetch } = useApi("/api/employees");

    // GET /api/roles — for role dropdown in form
    const { data: roles } = useApi("/api/roles");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    /* ── POST /api/employees (multipart/form-data) ── */
    async function handleCreate(formData) {
        const res = await fetch(`${API_BASE}/api/employees`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getToken()}`,
                // do NOT set Content-Type — browser sets multipart boundary
            },
            body: formData,
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
        return json;
    }

    /* ── PUT /api/employees/:id (multipart/form-data) ── */
    async function handleUpdate(id, formData) {
        const res = await fetch(`${API_BASE}/api/employees/${id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${getToken()}`,
            },
            body: formData,
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
        return json;
    }

    /* ── DELETE /api/employees/:id ── */
    async function handleDelete(id) {
        await apiFetch(`/api/employees/${id}`, { method: "DELETE" });
        refetch();
    }

    async function handleSave(formData, isEdit) {
        if (isEdit) {
            await handleUpdate(editTarget._id, formData);
        } else {
            await handleCreate(formData);
        }
        closeDialog();
        refetch();
    }

    function openCreate() {
        setEditTarget(null);
        setDialogOpen(true);
    }

    function openEdit(employee) {
        setEditTarget(employee);
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
                    <h1 className="text-2xl font-bold text-foreground">Employees</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage your team members and their roles.
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    className="gap-2 rounded-xl shadow shadow-primary/20 cursor-pointer"
                >
                    <Plus size={16} />
                    Add Employee
                </Button>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm font-medium text-destructive">
                    {error}
                </div>
            )}

            {/* Loading / Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={28} className="animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading employees...</p>
                    </div>
                </div>
            ) : (
                <EmployeeCardGrid
                    employees={employees}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                />
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); }}>
                <DialogContent className="sm:max-w-[620px] rounded-3xl p-0 overflow-hidden bg-white">
                    <DialogHeader className="px-8 pt-8 pb-0">
                        <DialogTitle className="text-2xl font-bold">
                            {editTarget ? "Edit Employee" : "Add New Employee"}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            {editTarget
                                ? "Update work information for this employee."
                                : "Fill in the details to create a new employee account."}
                        </DialogDescription>
                    </DialogHeader>
                    <EmployeeForm
                        defaultValues={editTarget}
                        roles={roles}
                        onSave={handleSave}
                        onCancel={closeDialog}
                    />
                </DialogContent>
            </Dialog>

        </div>
    );
}