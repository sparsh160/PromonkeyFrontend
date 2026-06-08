"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Loader2, Check, ChevronsUpDown,
    Search, ShieldCheck, X,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Label }    from "@/components/ui/label";
import { Badge }    from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ── schema ── */
const schema = z.object({
    name:        z.string().min(2, "Role name is required"),
    parentRole:  z.string().optional().nullable(),
    permissions: z.array(z.string()).default([]),
});

/* ── ACTION badge colours (for permission chips) ── */
const ACTION_STYLES = {
    create: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    read:   "bg-blue-500/10   text-blue-600   border-blue-200",
    update: "bg-amber-500/10  text-amber-600  border-amber-200",
    delete: "bg-red-500/10    text-red-600    border-red-200",
};

/* ── helper: get _id from string or object ── */
function getId(val) {
    return typeof val === "object" && val !== null ? val._id : val;
}

export function RoleForm({
    defaultValues,
    roles = [],
    permissions = [],
    permissionsLoading = false,
    onSave,
    onCancel,
}) {
    const [submitError,  setSubmitError]  = useState("");
    const [permSearch,   setPermSearch]   = useState("");

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name: defaultValues?.name ?? "",            
            parentRole: getId(defaultValues?.parentRole) ?? "",
            permissions: (defaultValues?.permissions ?? []).map(getId),
        },
    });

    async function onSubmit(data) {
        setSubmitError("");
        try {
            
            await onSave({
                ...data,
                parentRole:  data.parentRole  || null,
                permissions: data.permissions || [],
            });
        } catch (e) {
            setSubmitError(e.message);
        }
    }

    const filteredPermissions = permissions.filter((p) =>
        p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.module.toLowerCase().includes(permSearch.toLowerCase())
    );

    const parentOptions = roles.filter(
        (r) => r._id !== defaultValues?._id
    );

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 bg-white space-y-6">

            {/* Submit error */}
            {submitError && (
                <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                    {submitError}
                </div>
            )}

            {/* Role Name */}
            <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                    Role Name <span className="text-destructive">*</span>
                </Label>
                <Input
                    {...register("name")}
                    placeholder="e.g. Sales Manager"
                    className={cn(
                        "h-12 rounded-xl bg-muted/40 border-border text-sm",
                        errors.name && "border-destructive focus-visible:ring-destructive"
                    )}
                />
                {errors.name && (
                    <p className="text-xs text-destructive font-medium">
                        {errors.name.message}
                    </p>
                )}
            </div>

            {/* Parent Role */}
            <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                    Parent Role{" "}
                    <span className="text-muted-foreground font-normal">
                        (optional)
                    </span>
                </Label>

                <Controller
                    name="parentRole"
                    control={control}
                    render={({ field }) => {const selectedParent = parentOptions.find((r) => r._id === field.value );

                        return (
                            <Select  value={field.value || "none"}  onValueChange={(val) =>  field.onChange( val === "none" ? "" : val  ) }
                            >
                                <SelectTrigger className="h-12 rounded-xl bg-muted/40 border-border text-sm">
                                    <SelectValue placeholder="No parent (top-level role)">
                                        {selectedParent?.name ||
                                            "No parent (top-level role)"}
                                    </SelectValue>
                                </SelectTrigger>

                                <SelectContent className="rounded-xl bg-white">
                                    <SelectItem
                                        value="none"
                                        className="text-sm text-muted-foreground"
                                    >
                                        — No parent (top-level)
                                    </SelectItem>

                                    {parentOptions.map((r) => (
                                        <SelectItem
                                            key={r._id}
                                            value={r._id}
                                            className="text-sm"
                                        >
                                            {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        );
                    }}
                />

                <p className="text-xs text-muted-foreground italic">
                    Leave empty to create a top-level role.
                </p>
            </div>

            {/* Permissions multiselect */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                        Permissions{" "}
                        <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Controller
                        name="permissions"
                        control={control}
                        render={({ field }) => (
                            <span className="text-xs text-muted-foreground">
                                {field.value?.length ?? 0} selected
                            </span>
                        )}
                    />
                </div>

                <Controller
                    name="permissions"
                    control={control}
                    render={({ field }) => {
                        const selected = field.value ?? [];

                        function toggle(id) {
                            if (selected.includes(id)) {
                                field.onChange(selected.filter((v) => v !== id));
                            } else {
                                field.onChange([...selected, id]);
                            }
                        }

                        function removeChip(id) {
                            field.onChange(selected.filter((v) => v !== id));
                        }

                        function selectAll() {
                            field.onChange(filteredPermissions.map((p) => p._id));
                        }

                        function clearAll() {
                            field.onChange([]);
                        }

                        /* selected permission objects for chips */
                        const selectedObjs = permissions.filter((p) =>
                            selected.includes(p._id)
                        );

                        return (
                            <div className="space-y-3">

                                {/* Selected chips */}
                                {selectedObjs.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-muted/40 border border-border min-h-[48px]">
                                        {selectedObjs.map((p) => {
                                            const actions = Array.isArray(p.actions)
                                                ? p.actions : [p.actions];
                                            return (
                                                <span
                                                    key={p._id}
                                                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary"
                                                >
                                                    <ShieldCheck size={11} />
                                                    {p.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeChip(p._id)}
                                                        className="ml-0.5 hover:text-destructive transition-colors"
                                                    >
                                                        <X size={11} />
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Search + select/clear all */}
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Search
                                            size={13}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                                        />
                                        <Input
                                            value={permSearch}
                                            onChange={(e) => setPermSearch(e.target.value)}
                                            placeholder="Search permissions..."
                                            className="pl-9 h-9 text-sm rounded-lg bg-muted/50"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={selectAll}
                                        className="text-xs text-primary font-semibold hover:underline whitespace-nowrap"
                                    >
                                        Select all
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearAll}
                                        className="text-xs text-muted-foreground font-semibold hover:text-foreground hover:underline whitespace-nowrap"
                                    >
                                        Clear
                                    </button>
                                </div>

                                {/* Permissions list */}
                                <div className="border border-border rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                                    {permissionsLoading ? (
                                        <div className="flex items-center justify-center h-24 gap-2 text-muted-foreground text-sm">
                                            <Loader2 size={16} className="animate-spin" />
                                            Loading permissions...
                                        </div>
                                    ) : filteredPermissions.length === 0 ? (
                                        <div className="flex items-center justify-center h-16 text-sm text-muted-foreground">
                                            No permissions found.
                                        </div>
                                    ) : (
                                        filteredPermissions.map((p, i) => {
                                            const isChecked = selected.includes(p._id);
                                            const actions   = Array.isArray(p.actions)
                                                ? p.actions : [p.actions];

                                            return (
                                                <button
                                                    key={p._id}
                                                    type="button"
                                                    onClick={() => toggle(p._id)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left",
                                                        i < filteredPermissions.length - 1 && "border-b border-border/60",
                                                        isChecked
                                                            ? "bg-primary/5"
                                                            : "hover:bg-muted/40"
                                                    )}
                                                >
                                                    {/* Custom checkbox */}
                                                    <div className={cn(
                                                        "w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                                                        isChecked
                                                            ? "bg-primary border-primary"
                                                            : "border-border bg-background"
                                                    )}>
                                                        {isChecked && (
                                                            <Check size={10} className="text-white" strokeWidth={3} />
                                                        )}
                                                    </div>

                                                    {/* Name + module */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-foreground truncate">
                                                            {p.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {p.module}
                                                        </p>
                                                    </div>

                                                    {/* Action badges */}
                                                    <div className="flex gap-1 shrink-0">
                                                        {actions.map((a) => (
                                                            <span
                                                                key={a}
                                                                className={cn(
                                                                    "px-1.5 py-0.5 rounded-md text-[10px] font-semibold border capitalize",
                                                                    ACTION_STYLES[a] ?? "bg-muted text-muted-foreground border-border"
                                                                )}
                                                            >
                                                                {a}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                            </div>
                        );
                    }}
                />
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pb-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="rounded-xl px-6"
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="rounded-xl px-6 shadow shadow-primary/20"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 size={15} className="animate-spin" />
                            Saving...
                        </span>
                    ) : (
                        defaultValues ? "Update Role" : "Save Role"
                    )}
                </Button>
            </div>

        </form>
    );
}