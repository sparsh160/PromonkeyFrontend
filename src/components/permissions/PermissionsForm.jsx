"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, PlusCircle, Eye, FilePen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ── schema: actions is array of enums, min 1 ── */
const schema = z.object({
    name:    z.string().min(2, "Permission name is required"),
    module:  z.string().min(1, "Target module is required"),
    actions: z
        .array(z.enum(["create", "read", "update", "delete"]))
        .min(1, "Please select at least one action"),
});

const MODULES = [
    "Dashboard",     "Employees",     "Projects",
    "Tasks",         "Time Tracking", "Teams",
    "Attendance",    "Leaves",        "Calendar",
    "Clients",       "Reports",       "Analytics",
    "Settings",      "Permissions",   "Roles",
];

const ACTIONS = [
    { value: "create", label: "Create", icon: PlusCircle },
    { value: "read",   label: "Read",   icon: Eye        },
    { value: "update", label: "Update", icon: FilePen    },
    { value: "delete", label: "Delete", icon: Trash2     },
];

export function PermissionForm({ defaultValues, onSave, onCancel }) {
    const [submitError, setSubmitError] = useState("");

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name:   defaultValues?.name   ?? "",
            module: defaultValues?.module ?? "",
            // normalise: handle string "create" or array ["create","read"]
            actions: Array.isArray(defaultValues?.actions)
                ? defaultValues.actions
                : defaultValues?.actions
                ? [defaultValues.actions]
                : [],
        },
    });

    async function onSubmit(data) {
        setSubmitError("");
        try {
            // sends: { name, module, actions: ["create", "read"] }
            await onSave(data);
        } catch (e) {
            setSubmitError(e.message);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-background px-8 py-6 space-y-6">

            {/* Submit error */}
            {submitError && (
                <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                    {submitError}
                </div>
            )}

            {/* Permission Name */}
            <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                    Permission Name <span className="text-destructive">*</span>
                </Label>
                <Input
                    {...register("name")}
                    placeholder="e.g. View Employees"
                    className={cn(
                        "h-12 rounded-xl bg-muted/40 border-border text-sm",
                        errors.name && "border-destructive focus-visible:ring-destructive"
                    )}
                />
                {errors.name ? (
                    <p className="text-xs text-destructive font-medium">
                        {errors.name.message}
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground italic">
                        Use a clear label e.g. "View Employees", "Export Reports".
                    </p>
                )}
            </div>

            {/* Target Module */}
            <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                    Target Module <span className="text-destructive">*</span>
                </Label>
                <Controller
                    name="module"
                    control={control}
                    render={({ field }) => (
                        <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <SelectTrigger className={cn(
                                "h-12 rounded-xl bg-muted/40 border-border text-sm",
                                errors.module && "border-destructive"
                            )}>
                                <SelectValue placeholder="Select a module..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl bg-background">
                                {MODULES.map((m) => (
                                    <SelectItem key={m} value={m} className="text-sm">
                                        {m}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.module && (
                    <p className="text-xs text-destructive font-medium">
                        {errors.module.message}
                    </p>
                )}
            </div>

            {/* Assigned Actions — multiselect cards */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                        Assigned Actions <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-xs text-muted-foreground">
                        Select one or more
                    </span>
                </div>

                <Controller
                    name="actions"
                    control={control}
                    render={({ field }) => {
                        const selected = field.value ?? [];

                        function toggle(value) {
                            field.onChange(
                                selected.includes(value)
                                    ? selected.filter((v) => v !== value)
                                    : [...selected, value]
                            );
                        }

                        return (
                            <div className="grid grid-cols-4 gap-3">
                                {ACTIONS.map(({ value, label, icon: Icon }) => {
                                    const isSelected = selected.includes(value);
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => toggle(value)}
                                            className={cn(
                                                "relative flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 text-sm font-semibold transition-all duration-150",
                                                isSelected
                                                    ? "border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10"
                                                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/30"
                                            )}
                                        >
                                            {/* checkmark badge */}
                                            {isSelected && (
                                                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                    <svg
                                                        className="w-2.5 h-2.5 text-white"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="m4.5 12.75 6 6 9-13.5"
                                                        />
                                                    </svg>
                                                </span>
                                            )}
                                            <Icon size={20} strokeWidth={1.8} />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    }}
                />

                {errors.actions && (
                    <p className="text-xs text-destructive font-medium">
                        {errors.actions.message}
                    </p>
                )}
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pb-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="rounded-xl cursor-pointer px-6"
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="rounded-xl cursor-pointer px-6 shadow shadow-primary/20"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 size={15} className="animate-spin" />
                            Saving...
                        </span>
                    ) : (
                        defaultValues ? "Update Permission" : "Save Permission"
                    )}
                </Button>
            </div>

        </form>
    );
}