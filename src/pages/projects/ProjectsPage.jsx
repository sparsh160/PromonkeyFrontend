"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { apiFetch } from "@/lib/api";
import { ProjectList } from "@/components/projects/ProjectList";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
    { value: "all",         label: "All Status"   },
    { value: "not_started", label: "Not Started"  },
    { value: "in_progress", label: "In Progress"  },
    { value: "completed",   label: "Completed"    },
    { value: "on_hold",     label: "On Hold"      },
    { value: "cancelled",   label: "Cancelled"    },
];

const PRIORITY_OPTIONS = [
    { value: "all",      label: "All Priority" },
    { value: "low",      label: "Low"          },
    { value: "medium",   label: "Medium"       },
    { value: "high",     label: "High"         },
    { value: "critical", label: "Critical"     },
];

export default function ProjectsPage() {
    const router = useRouter();
    const [status,   setStatus]   = useState("all");
    const [priority, setPriority] = useState("all");

    // build query string
    const query = new URLSearchParams();
    if (status   !== "all") query.set("status",   status);
    if (priority !== "all") query.set("priority", priority);
    const qs = query.toString();

    const { data: projects, loading, error, refetch } =
        useApi(`/api/projects${qs ? `?${qs}` : ""}`);

    async function handleDelete(id) {
        await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
        refetch();
    }

    // stat counts
    const active    = projects.filter(p => p.status === "in_progress").length;
    const completed = projects.filter(p => p.status === "completed").length;
    const onHold    = projects.filter(p => p.status === "on_hold").length;
    const critical  = projects.filter(p => p.priority === "critical").length;

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Projects Portfolio
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Track and manage {projects.length} active initiatives.
                    </p>
                </div>
                <Button
                    onClick={() => router.push("/promonkey/projects/new")}
                    className="gap-2 rounded-xl shadow shadow-primary/20 cursor-pointer"
                >
                    <Plus size={16} />
                    Add Project
                </Button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Active Projects", value: active,    color: "text-blue-600",   bg: "bg-blue-500/10"   },
                    { label: "Completed",        value: completed, color: "text-green-600",  bg: "bg-green-500/10"  },
                    { label: "On Hold",          value: onHold,    color: "text-amber-600",  bg: "bg-amber-500/10"  },
                    { label: "Critical Risk",    value: critical,  color: "text-red-600",    bg: "bg-red-500/10"    },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`rounded-2xl border border-border ${bg} p-4`}>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            {label}
                        </p>
                        <p className={`text-3xl font-bold mt-1 ${color}`}>
                            {String(value).padStart(2, "0")}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <Filter size={14} className="text-muted-foreground" />
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-40 h-9 text-sm rounded-lg bg-card">
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
                <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="w-40 h-9 text-sm rounded-lg bg-card">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-background">
                        {PRIORITY_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value} className="text-sm">
                                {o.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm font-medium text-destructive">
                    {error}
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 size={28} className="animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading projects...</p>
                    </div>
                </div>
            ) : (
                <ProjectList
                    projects={projects}
                    onDelete={handleDelete}
                    onRefetch={refetch}
                />
            )}

        </div>
    );
}