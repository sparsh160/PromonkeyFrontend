"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch, API_BASE, getToken } from "@/lib/api";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { useApi } from "@/hooks/useApi";

export default function ProjectNewPage() {
    const router = useRouter();
    const { data: clients } = useApi("/api/clients");

    async function handleSave(formData) {
        const res = await fetch(`${API_BASE}/api/projects`, {
            method: "POST",
            headers: { Authorization: `Bearer ${getToken()}` },
            body: formData,
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
        router.push("/promonkey/projects");
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={16} />
                </button>
                <div>
                    <p className="text-xs text-muted-foreground">
                        Projects &rsaquo; <span className="text-primary font-semibold">New Project</span>
                    </p>
                    <h1 className="text-2xl font-bold text-foreground">Create New Project</h1>
                </div>
            </div>
            <ProjectForm
                clients={clients}
                onSave={handleSave}
                onCancel={() => router.back()}
            />
        </div>
    );
}