"use client";
import { useState, useRef } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Loader2,
    Upload,
    X,
    Plus,
    Trash2,
    FileText,
    Search,
    Check,
    ChevronDown,
    ChevronUp,
    Users,
} from "lucide-react";

import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { RichTextEditor } from "../ui/RichTextEditor";
const phaseSchema = z.object({
    _id: z.string().optional(),
    name: z.string().min(1, "Phase name is required"),
    order: z.number().default(0),

    description: z.string().optional(),

    estimatedDuration: z.number().nullable().optional(),

    actualStart: z.string().optional(),
    actualEnd: z.string().optional(),
    estimatedEndDate: z.string().optional(),

    assignees: z.array(z.string()).default([]),
});

const schema = z.object({
    name:             z.string().min(2, "Project name is required"),
    description:      z.string().optional(),
    client:           z.string().min(1, "Client is required"),
    startDate:        z.string().min(1, "Start date is required"),
    estimatedEndDate: z.string().min(1, "Estimated end date is required"),
    status:           z.enum(["not_started","in_progress","completed","on_hold","cancelled"]).default("not_started"),
    priority:         z.enum(["low","medium","high","critical"]).default("medium"),
    phases:           z.array(phaseSchema).optional().default([]),
}).refine(
    (d) => !d.startDate || !d.estimatedEndDate || new Date(d.estimatedEndDate) >= new Date(d.startDate),
    { message: "End date must be after start date", path: ["estimatedEndDate"] }
);

const STATUS_OPTIONS = [
    { value: "not_started", label: "Not Started" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed",   label: "Completed"   },
    { value: "on_hold",     label: "On Hold"      },
    { value: "cancelled",   label: "Cancelled"    },
];

const PRIORITY_OPTIONS = [
    { value: "low",      label: "Low"      },
    { value: "medium",   label: "Medium"   },
    { value: "high",     label: "High"     },
    { value: "critical", label: "Critical" },
];



const TIMELINE_OPTIONS = [
    { value: "1",  label: "1 Month"   },
    { value: "2",  label: "2 Months"  },
    { value: "3",  label: "3 Months"  },
    { value: "6",  label: "6 Months"  },
    { value: "9",  label: "9 Months"  },
    { value: "12", label: "12 Months" },
];

function AssigneeSelector({ value = [], onChange, employees = [] }) {
    const [open,   setOpen]   = useState(false);
    const [search, setSearch] = useState("");

    const filtered = employees.filter((e) => {
        const q    = search.toLowerCase();
        const name = e.user?.name?.toLowerCase() ?? "";
        const dept = e.department?.toLowerCase()  ?? "";
        const role = e.role?.name?.toLowerCase()  ?? "";
        return name.includes(q) || dept.includes(q) || role.includes(q);
    });

    function toggle(id) {
        if (value.includes(id)) {
            onChange(value.filter(v => v !== id));
        } else {
            onChange([...value, id]);
        }
    }

    const selectedEmps = employees.filter(e => value.includes(e._id));

    return (
        <div className="space-y-2">
            {/* Selected chips */}
            {selectedEmps.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedEmps.map(e => (
                        <span
                            key={e._id}
                            className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-semibold text-primary"
                        >
                            {/* avatar */}
                            <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold">
                                {e.user?.name?.[0]?.toUpperCase() ?? "E"}
                            </span>
                            {e.user?.name?.split(" ")[0]}
                            <button
                                type="button"
                                onClick={() => toggle(e._id)}
                                className="hover:text-destructive transition-colors ml-0.5"
                            >
                                <X size={9} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-background text-xs transition-colors",
                    open ? "border-primary ring-1 ring-primary/20" : "hover:bg-muted/30"
                )}
            >
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={12} />
                    <span>
                        {value.length === 0
                            ? "Assign employees..."
                            : `${value.length} assignee${value.length > 1 ? "s" : ""} selected`}
                    </span>
                </div>
                {open
                    ? <ChevronUp size={12} className="text-muted-foreground" />
                    : <ChevronDown size={12} className="text-muted-foreground" />
                }
            </button>

            {/* Dropdown */}
            {open && (
                <div className="rounded-xl border border-border bg-background shadow-lg overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-border">
                        <div className="relative">
                            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search employees..."
                                className="w-full pl-7 pr-3 py-1.5 text-xs bg-muted/40 rounded-lg border border-border focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-40 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="flex items-center justify-center h-12 text-xs text-muted-foreground">
                                No employees found.
                            </div>
                        ) : (
                            filtered.map((emp, i) => {
                                const isChecked = value.includes(emp._id);
                                const name      = emp.user?.name ?? "—";
                                const role      = emp.role?.name ?? emp.department ?? "";
                                const avatar    = emp.user?.profileImage?.url ?? null;

                                return (
                                    <button
                                        key={emp._id}
                                        type="button"
                                        onClick={() => toggle(emp._id)}
                                        className={cn(
                                            "w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors",
                                            i < filtered.length - 1 && "border-b border-border/60",
                                            isChecked ? "bg-primary/5" : "hover:bg-muted/40"
                                        )}
                                    >
                                        {/* Checkbox */}
                                        <div className={cn(
                                            "w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                                            isChecked
                                                ? "bg-primary border-primary"
                                                : "border-border bg-background"
                                        )}>
                                            {isChecked && (
                                                <Check size={8} className="text-white" strokeWidth={3} />
                                            )}
                                        </div>

                                        {/* Avatar */}
                                        <div className="w-6 h-6 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
                                            {avatar ? (
                                                <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[9px] font-bold text-primary">
                                                    {name[0]?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Name + role */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground truncate">{name}</p>
                                            {role && (
                                                <p className="text-[10px] text-muted-foreground truncate">{role}</p>
                                            )}
                                        </div>

                                        {/* Dept badge */}
                                        {emp.department && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground shrink-0">
                                                {emp.department}
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {value.length > 0 && (
                        <div className="px-3 py-2 border-t border-border flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                                {value.length} selected
                            </span>
                            <button
                                type="button"
                                onClick={() => onChange([])}
                                className="text-[10px] text-destructive font-medium hover:underline"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function normaliseAssignees(assignees = []) {
    return assignees.map(a => {
        if (typeof a === "string") return a;
        if (typeof a === "object") return a._id ?? "";
        return "";
    }).filter(Boolean);
}


export function ProjectForm({ defaultValues, clients = [], onSave, onCancel }) {
    const isEdit = !!defaultValues;
    const [submitError,  setSubmitError]  = useState("");
    const [docFiles,     setDocFiles]     = useState([]);
    const [clientSearch, setClientSearch] = useState("");
    const { data: employees = [] } = useApi("/api/employees");
    const fileInputRef = useRef(null);


    const dv = defaultValues;

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name:             dv?.name             ?? "",
            description:      dv?.description      ?? "",
            client:           typeof dv?.client === "object" ? dv.client._id : (dv?.client ?? ""),
            startDate:        dv?.startDate         ? dv.startDate.split("T")[0]         : "",
            estimatedEndDate: dv?.estimatedEndDate  ? dv.estimatedEndDate.split("T")[0]  : "",
            status:           dv?.status            ?? "not_started",
            priority:         dv?.priority          ?? "medium",
            phases: (dv?.phases ?? []).map(p => ({
                _id: p._id ?? undefined,
                name: p.name ?? "",
                order: p.order ?? 0,

                description: p.description ?? "",

                estimatedDuration: p.estimatedDuration ?? null,

                actualStart: p.actualStart
                    ? p.actualStart.split("T")[0]
                    : "",

                actualEnd: p.actualEnd
                    ? p.actualEnd.split("T")[0]
                    : "",

                estimatedEndDate: p.estimatedEndDate
                    ? p.estimatedEndDate.split("T")[0]
                    : "",

                assignees: normaliseAssignees(p.assignees),
            })),
        },
    });
    const filteredClients = clients.filter((c) => {
        const query = clientSearch.toLowerCase();
        const mainName = (c.clientName ?? c.name ?? "").toLowerCase();
        const compName = (c.companyName ?? "").toLowerCase();
        return mainName.includes(query) || compName.includes(query);
    });

    const { fields: phaseFields, append: appendPhase, remove: removePhase } = useFieldArray({
        control,
        name: "phases",
    });
   
    async function handleDeletePhase(index, phaseId) {
        if (!phaseId) {
            
            removePhase(index);
            return;
        }

        const confirmed = window.confirm("Are you sure you want to permanently delete this phase?");
        if (!confirmed) return;

        try {
            setSubmitError("");
          
            await apiFetch(`/api/phases/${phaseId}`, {
                method: "DELETE",
            });
           
            removePhase(index);
        } catch (e) {
            setSubmitError(e.message || "Failed to delete the phase from the server.");
        }
    }

    function handleFileAdd(e) {
        const files = Array.from(e.target.files ?? []);
        setDocFiles(prev => [...prev, ...files]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function removeDocFile(index) {
        setDocFiles(prev => prev.filter((_, i) => i !== index));
    }

    function handleTimelineChange(months) {
        const start = watch("startDate");
        if (!start) return;
        const d = new Date(start);
        d.setMonth(d.getMonth() + parseInt(months));
        setValue("estimatedEndDate", d.toISOString().split("T")[0], { shouldValidate: true });
    }

    async function onSubmit(data) {
        setSubmitError("");
        try {
            const fd = new FormData();
            fd.append("name",             data.name);
            fd.append("client",           data.client);
            fd.append("startDate",        data.startDate);
            fd.append("estimatedEndDate", data.estimatedEndDate);
            fd.append("status",           data.status);
            fd.append("priority",         data.priority);
            if (data.description) fd.append("description", data.description);
            // phases as JSON string
            fd.append(
                "phases",
                JSON.stringify(
                    data.phases.map((p, i) => ({
                        _id: p._id || undefined,
                        name: p.name,
                        order: i + 1,

                        description: p.description,

                        estimatedDuration: p.estimatedDuration,

                        actualStart: p.actualStart || null,
                        actualEnd: p.actualEnd || null,
                        estimatedEndDate: p.estimatedEndDate || null,

                        assignees: p.assignees || [],
                    }))
                )
            );
            // doc files
            docFiles.forEach(f => fd.append("requirementDocs", f));
            await onSave(fd);
        } catch (e) {
            setSubmitError(e.message);
        }
    }

    return (
        <div className="bg-background px-8 py-6 max-h-[75vh] overflow-y-auto ">
            {/* Global error popup */}
            {submitError && (
                <div className="mb-5 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm font-semibold text-destructive flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <span>{submitError}</span>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">

                    {/* ── LEFT: Project Details ── */}
                    <div className="col-span-2 space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText size={16} className="text-primary" />
                            <h2 className="text-sm font-bold text-foreground">Project Details</h2>
                        </div>

                        {/* Project Name */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                Project Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                {...register("name")}
                                placeholder="e.g. Q4 Market Expansion"
                                className={cn(
                                    "h-11 rounded-xl bg-muted/40 text-sm",
                                    errors.name && "border-destructive bg-destructive/5 focus-visible:ring-destructive"
                                )}
                            />
                            {errors.name && (
                                <p className="text-xs text-destructive font-medium flex items-center gap-1">
                                    <span>⚠</span> {errors.name.message}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground italic">
                                Use a descriptive name for better identification.
                            </p>
                        </div>

                        {/* Start Date + Timeline */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">
                                    Start Date <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    {...register("startDate")}
                                    type="date"
                                    className={cn(
                                        "h-11 rounded-xl bg-muted/40 text-sm",
                                        errors.startDate && "border-destructive bg-destructive/5"
                                    )}
                                />
                                {errors.startDate && (
                                    <p className="text-xs text-destructive font-medium">⚠ {errors.startDate.message}</p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">Timeline</Label>
                                <Select onValueChange={handleTimelineChange}>
                                    <SelectTrigger className="h-11 rounded-xl bg-muted/40 text-sm">
                                        <SelectValue placeholder="Select duration..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl bg-background">
                                        {TIMELINE_OPTIONS.map(o => (
                                            <SelectItem key={o.value} value={o.value} className="text-sm">
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Estimated End Date */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                Estimated End Date <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                {...register("estimatedEndDate")}
                                type="date"
                                className={cn(
                                    "h-11 rounded-xl bg-muted/40 text-sm",
                                    errors.estimatedEndDate && "border-destructive bg-destructive/5"
                                )}
                            />
                            {errors.estimatedEndDate && (
                                <p className="text-xs text-destructive font-medium">⚠ {errors.estimatedEndDate.message}</p>
                            )}
                        </div>

                        {/* Client */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                Client <span className="text-destructive">*</span>
                            </Label>
                            <Controller
                                name="client"
                                control={control}
                                render={({ field }) => {
                                    const selectedClient = clients.find(
                                        (c) => c._id === field.value
                                    );

                                    return (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger
                                                className={cn(
                                                    "h-11 rounded-xl bg-muted/40 text-sm",
                                                    errors.client &&
                                                        "border-destructive bg-destructive/5"
                                                )}
                                            >
                                                <SelectValue placeholder="Select existing client...">
                                                    {selectedClient
                                                        ? `${selectedClient.clientName ?? selectedClient.name}${
                                                            selectedClient.companyName
                                                                ? ` — ${selectedClient.companyName}`
                                                                : ""
                                                        }`
                                                        : "Select existing client..."}
                                                </SelectValue>
                                            </SelectTrigger>

                                            <SelectContent className="rounded-xl bg-background">
                                                {/* Sticky local Search Input box inside the SelectContent popover */}
                                                <div className="p-2 border-b border-border sticky top-0 bg-background z-10">
                                                    <div className="relative">
                                                        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                                        <input
                                                            value={clientSearch}
                                                            onChange={(e) => setClientSearch(e.target.value)}
                                                            onKeyDown={(e) => e.stopPropagation()} // Prevents space/navigation key conflicts with Radix UI Select
                                                            placeholder="Search clients..."
                                                            className="w-full pl-7 pr-3 py-1.5 text-xs bg-muted/40 rounded-lg border border-border focus:outline-none focus:border-primary transition-colors"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Client List */}
                                                <div className="max-h-48 overflow-y-auto">
                                                    {filteredClients.length === 0 ? (
                                                        <div className="flex items-center justify-center h-12 text-xs text-muted-foreground">
                                                            No clients found.
                                                        </div>
                                                    ) : (
                                                        filteredClients.map((c) => (
                                                            <SelectItem
                                                                key={c._id}
                                                                value={c._id}
                                                                className="text-sm"
                                                            >
                                                                {c.clientName ?? c.name}
                                                                {c.companyName
                                                                    ? ` — ${c.companyName}`
                                                                    : ""}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </div>
                                            </SelectContent>
                                        </Select>
                                    );
                                }}
                            />
                            {errors.client && (
                                <p className="text-xs text-destructive font-medium">⚠ {errors.client.message}</p>
                            )}
                        </div>

                        {/* Status + Priority */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">Status</Label>
                                <Controller
                                    name="status"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className="h-11 rounded-xl bg-muted/40 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl bg-background">
                                                {STATUS_OPTIONS.map(o => (
                                                    <SelectItem key={o.value} value={o.value} className="text-sm capitalize">
                                                        {o.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">Priority</Label>
                                <Controller
                                    name="priority"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className="h-11 rounded-xl bg-muted/40 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl bg-background">
                                                {PRIORITY_OPTIONS.map(o => (
                                                    <SelectItem key={o.value} value={o.value} className="text-sm capitalize">
                                                        {o.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">Requirements / Description</Label>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <RichTextEditor
                                        value={field.value ?? ""}
                                        onChange={field.onChange}
                                        placeholder="Briefly describe project requirements and goals..."
                                        minHeight="120px"
                                        error={!!errors.description}
                                    />
                                )}
                            />

                        </div>

                        {/* Phases */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Project Phases</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => appendPhase({
                                        name: "",
                                        order: phaseFields.length + 1,

                                        description: "",

                                        estimatedDuration: null,

                                        actualStart: "",
                                        actualEnd: "",
                                        estimatedEndDate: "",

                                        assignees: [],
                                    })}
                                    className="gap-1.5 h-7 text-xs rounded-lg"
                                >
                                    <Plus size={12} /> Add Phase
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {phaseFields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        className="rounded-xl border border-border bg-muted/20 p-4 space-y-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                {index + 1}
                                            </div>

                                            <Input
                                                {...register(`phases.${index}.name`)}
                                                placeholder="Phase Name"
                                                className="h-9 rounded-lg bg-background text-sm flex-1"
                                            />

                                            {/* ── CALLED HERE IN THE BUTTON ── */}
                                            <button
                                                type="button"
                                                onClick={() => handleDeletePhase(index, field._id)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">

                                            <div>
                                                <Label className="text-xs">
                                                    Estimated Duration (hrs)
                                                </Label>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    placeholder="80"
                                                    {...register(`phases.${index}.estimatedDuration`, {
                                                        valueAsNumber: true,
                                                    })}
                                                    className="h-9 rounded-lg bg-background text-sm"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs">
                                                    Estimated End Date
                                                </Label>
                                                <Input
                                                    type="date"
                                                    {...register(`phases.${index}.estimatedEndDate`)}
                                                    className="h-9 rounded-lg bg-background text-sm"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs">
                                                    Actual Start Date
                                                </Label>
                                                <Input
                                                    type="date"
                                                    {...register(`phases.${index}.actualStart`)}
                                                    className="h-9 rounded-lg bg-background text-sm"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs">
                                                    Actual End Date
                                                </Label>
                                                <Input
                                                    type="date"
                                                    {...register(`phases.${index}.actualEnd`)}
                                                    className="h-9 rounded-lg bg-background text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-xs">
                                                Phase Description
                                            </Label>
                                            <textarea
                                                {...register(`phases.${index}.description`)}
                                                rows={3}
                                                placeholder="Enter phase description..."
                                                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs">
                                                Assignees
                                            </Label>

                                            <Controller
                                                name={`phases.${index}.assignees`}
                                                control={control}
                                                render={({ field }) => (
                                                    <AssigneeSelector
                                                        value={field.value || []}
                                                        onChange={field.onChange}
                                                        employees={employees}
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {phaseFields.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic text-center py-3">
                                        No phases added yet. Click "Add Phase" to begin.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: Project Briefs ── */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Upload size={16} className="text-primary" />
                            <h2 className="text-sm font-bold text-foreground">Project Briefs</h2>
                        </div>

                        {/* Upload dropzone */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-muted/20 transition-all"
                        >
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Upload size={18} className="text-primary" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                                Upload Project Documentation
                            </p>
                            <p className="text-xs text-muted-foreground">
                                PDF, DOCX or ZIP (Max 20MB)
                            </p>
                            <Button type="button" variant="outline" size="sm" className="mt-1 rounded-lg text-xs h-8">
                                Browse Files
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.docx,.doc,.png,.jpg,.xlsx,.xls,.zip"
                                onChange={handleFileAdd}
                                className="hidden"
                            />
                        </div>

                        {/* Queued files */}
                        {docFiles.length > 0 && (
                            <div className="space-y-2">
                                {docFiles.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-muted/20">
                                        <FileText size={14} className="text-primary shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate">{f.name}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {(f.size / 1024 / 1024).toFixed(1)} MB
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeDocFile(i)}
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Existing docs (edit mode) */}
                        {isEdit && (defaultValues?.requirementDocs ?? []).length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Existing Documents
                                </p>
                                {defaultValues.requirementDocs.map((doc) => (
                                    <div key={doc._id} className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-muted/20">
                                        <FileText size={14} className="text-primary shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate">{doc.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{doc.fileType?.toUpperCase()}</p>
                                        </div>
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline text-[10px] font-medium"
                                        >
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Quick tip */}
                        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                            <p className="text-xs font-bold text-primary mb-1">💡 Quick Tip</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Completing all fields now will help generate more accurate predictive analytics for your project timeline later.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border" />

                {/* Footer */}
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
                        ) : isEdit ? "Update Project" : "Create Project"}
                    </Button>
                </div>
            </form>
        </div>
    );
}