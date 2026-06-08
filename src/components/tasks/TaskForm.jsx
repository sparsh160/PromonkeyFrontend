"use client";
import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "../ui/RichTextEditor"; 

const stepSchema = z.object({
    title: z.string().min(1, "Step title is required"),
});

const schema = z.object({
    phase:          z.string().min(1, "Phase is required"),
    name:           z.string().min(2, "Task name is required"),
    description:    z.string().optional(),
    assignedTo:     z.string().optional(),
    estimatedHours: z.coerce.number().optional().nullable(),
    dueDate:        z.string().optional(),
    status:         z.enum(["not_started","in_progress","completed","on_hold"]).default("not_started"),
    steps:          z.array(stepSchema).default([]),
});

const STATUS_OPTIONS = [
    { value: "not_started", label: "Not Started" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed",   label: "Completed"   },
    { value: "on_hold",     label: "On Hold"      },
];

function extractId(val) {
    if (!val) return "";
    if (typeof val === "object") return val._id ?? "";
    return val;
}

export function TaskForm({ defaultValues, projects = [], employees = [], onSave, onCancel }) {
    const isEdit = !!defaultValues;
    const [submitError,     setSubmitError]     = useState("");
    const [selectedProject, setSelectedProject] = useState(
        extractId(defaultValues?.project) ?? ""
    );
    const [phases, setPhases] = useState([]);
    const selectedProjectObj = projects.find(
        (p) => p._id === selectedProject
    );

    useEffect(() => {
        if (!selectedProject) { setPhases([]); return; }
        const proj = projects.find(p => p._id === selectedProject);
        setPhases(proj?.phases ?? []);
    }, [selectedProject, projects]);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            phase:          extractId(defaultValues?.phase)      ?? "",
            name:           defaultValues?.name                  ?? "",
            description:    defaultValues?.description           ?? "",
            assignedTo:     extractId(defaultValues?.assignedTo) ?? "",
            estimatedHours: defaultValues?.estimatedHours        ?? null,
            dueDate:        defaultValues?.dueDate
                ? defaultValues.dueDate.split("T")[0]
                : "",
            status: defaultValues?.status ?? "not_started",
            steps:  (defaultValues?.steps ?? []).map(s => ({ title: s.title })),
        },
    });

    const {
        fields: stepFields,
        append: appendStep,
        remove: removeStep,
    } = useFieldArray({ control, name: "steps" });

    async function onSubmit(data) {
        setSubmitError("");
        try {
            const body = {
                phase:    data.phase,
                name:     data.name,
                status:   data.status,
                steps:    data.steps.map(s => ({ title: s.title })),
            };
            if (data.description)    body.description    = data.description;
            if (data.assignedTo)     body.assignedTo     = data.assignedTo;
            if (data.estimatedHours) body.estimatedHours = Number(data.estimatedHours);
            if (data.dueDate)        body.dueDate        = data.dueDate;
            await onSave(body);
        } catch (e) {
            setSubmitError(e.message);
        }
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-background px-8 py-6 space-y-5 overflow-y-auto max-h-[75vh] "
        >
            {submitError && (
                <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                    ⚠️ {submitError}
                </div>
            )}

            {/* Project selector */}
            <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                    Project <span className="text-destructive">*</span>
                </Label>
                <Select
                    value={selectedProject || ""}
                    onValueChange={(v) => setSelectedProject(v)}
                >
                    <SelectTrigger
                        className={cn(
                            "h-11 rounded-xl bg-muted/40 text-sm",
                            !selectedProject && errors.phase && "border-destructive bg-destructive/5"
                        )}
                    >
                        <SelectValue placeholder="Select project...">
                            {selectedProjectObj?.name || "Select project..."}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-background">
                        {projects.map((project) => (
                            <SelectItem key={project._id} value={project._id}>
                                {project.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Phase */}
            <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                    Phase <span className="text-destructive">*</span>
                </Label>
                <Controller
                    name="phase"
                    control={control}
                    render={({ field }) => {
                        const selectedPhase = phases.find((p) => p._id === field.value);
                        return (
                            <Select
                                value={field.value || ""}
                                onValueChange={field.onChange}
                                disabled={!selectedProject || phases.length === 0}
                            >
                                <SelectTrigger
                                    className={cn(
                                        "h-11 rounded-xl bg-muted/40 text-sm",
                                        errors.phase && "border-destructive bg-destructive/5"
                                    )}
                                >
                                    <SelectValue placeholder="Select phase...">
                                        {selectedPhase?.name || "Select phase..."}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl bg-background">
                                    {phases.map((phase) => (
                                        <SelectItem key={phase._id} value={phase._id}>
                                            {phase.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        );
                    }}
                />
                {errors.phase && (
                    <p className="text-xs text-destructive font-medium">⚠ {errors.phase.message}</p>
                )}
            </div>

            {/* Task Name */}
            <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                    Task Name <span className="text-destructive">*</span>
                </Label>
                <Input
                    {...register("name")}
                    placeholder="e.g. Create wireframes"
                    className={cn(
                        "h-11 rounded-xl bg-muted/40 text-sm",
                        errors.name && "border-destructive bg-destructive/5"
                    )}
                />
                {errors.name && (
                    <p className="text-xs text-destructive font-medium">⚠ {errors.name.message}</p>
                )}
            </div>

            {/* Description WITH RICH TEXT EDITOR */}
            <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Description</Label>
                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Describe the task with formatted text, images, or videos..."
                        />
                    )}
                />
            </div>

            {/* Assigned To + Status */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Assigned To</Label>
                    <Controller
                        name="assignedTo"
                        control={control}
                        render={({ field }) => {
                            const selectedEmployee = employees.find((e) => e._id === field.value);
                            return (
                                <Select value={field.value || ""} onValueChange={field.onChange}>
                                    <SelectTrigger className="h-11 rounded-xl bg-muted/40 text-sm">
                                        <SelectValue placeholder="Select employee...">
                                            {selectedEmployee
                                                ? `${selectedEmployee.user?.name ?? "—"}${
                                                    selectedEmployee.role?.name
                                                        ? ` · ${selectedEmployee.role.name}`
                                                        : ""
                                                }`
                                                : "Select employee..."}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl bg-background">
                                        {employees.map((e) => (
                                            <SelectItem key={e._id} value={e._id} className="text-sm">
                                                {e.user?.name ?? "—"}{e.role?.name ? ` · ${e.role.name}` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            );
                        }}
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Status</Label>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="h-11 rounded-xl bg-muted/40 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl bg-background">
                                    {STATUS_OPTIONS.map(o => (
                                        <SelectItem key={o.value} value={o.value} className="text-sm">
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>

            {/* Estimated Hours + Due Date */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Estimated Hours</Label>
                    <Input
                        {...register("estimatedHours", {
                            setValueAs: v => v === "" ? null : Number(v),
                        })}
                        type="number"
                        placeholder="e.g. 16"
                        min={0}
                        className="h-11 rounded-xl bg-muted/40 text-sm"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">Due Date</Label>
                    <Input {...register("dueDate")} type="date" className="h-11 rounded-xl bg-muted/40 text-sm" />
                </div>
            </div>

            <div className="h-px bg-border" />
            <div className="flex items-center justify-end gap-3 pb-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="rounded-xl px-6 cursor-pointer"
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="rounded-xl px-6 shadow shadow-primary/20 cursor-pointer"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 size={15} className="animate-spin" />
                            Saving...
                        </span>
                    ) : isEdit ? "Update Task" : "Create Task"}
                </Button>
            </div>
        </form>
    );
}