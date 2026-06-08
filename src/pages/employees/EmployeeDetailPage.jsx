"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Mail, Phone, Briefcase,
    Calendar, User, ShieldCheck, Hash,
    Loader2, CheckCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        day: "2-digit", month: "long", year: "numeric",
    });
}

const ACTION_STYLES = {
    create: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    read:   "bg-blue-500/10   text-blue-600   border-blue-200",
    update: "bg-amber-500/10  text-amber-600  border-amber-200",
    delete: "bg-red-500/10    text-red-600    border-red-200",
};

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-border/60 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={14} className="text-primary" />
            </div>
            <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                    {label}
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                    {value || "—"}
                </p>
            </div>
        </div>
    );
}

export default function EmployeeDetailPage({ id }) {
    const router = useRouter();
    const [employee, setEmployee] = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState("");

    useEffect(() => {
        if (!id) return;

        async function load() {
            setLoading(true);
            setError("");
            try {
                // calls: GET https://promonkeybackend.onrender.com/api/employees/:id
                const data = await apiFetch(`/api/employees/${id}`);
                setEmployee(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [id]);

    if (!id || loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading employee...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="space-y-4">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={16} /> Back
            </button>
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium">
                {error}
            </div>
        </div>
    );

    if (!employee) return null;

    const user   = employee.user  ?? {};
    const role   = employee.role  ?? {};
    const perms  = role.permissions ?? [];
    const avatar = user.profileImage?.url ?? null;
    const letter = user.name?.[0]?.toUpperCase() ?? "E";

    const statusStyle = employee.status === "Active"
        ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
        : "bg-slate-500/10 text-slate-500 border-slate-200";

    return (
        <div className="space-y-6 max-w-5xl">

            {/* Back */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Employees
            </button>

            {/* Top hero card */}
            <div className="bg-card border border-border rounded-2xl p-6 flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-border">
                    {avatar ? (
                        <img src={avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold text-primary">{letter}</span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-foreground">
                                {user.name ?? "—"}
                            </h1>
                            <p className="text-sm text-primary font-semibold mt-0.5">
                                {role.name ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {employee.department ?? "—"}
                                {employee.employeeId ? ` · ${employee.employeeId}` : ""}
                            </p>
                        </div>
                        <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shrink-0",
                            statusStyle
                        )}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {employee.status ?? "Active"}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail size={12} className="text-primary/60" />
                            {user.email ?? "—"}
                        </div>
                        {user.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone size={12} className="text-primary/60" />
                                {user.phone}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar size={12} className="text-primary/60" />
                            Joined {formatDate(employee.joiningDate)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Two column */}
            <div className="grid grid-cols-2 gap-4">

                {/* Personal Info */}
                <div className="bg-card border border-border rounded-2xl p-5">
                    <h2 className="text-sm font-bold text-foreground mb-1">
                        Personal Information
                    </h2>
                    <p className="text-xs text-muted-foreground mb-4">
                        Contact and identity details
                    </p>
                    <InfoRow icon={User}      label="Full Name"    value={user.name} />
                    <InfoRow icon={Mail}      label="Email"        value={user.email} />
                    <InfoRow icon={Phone}     label="Phone"        value={user.phone} />
                    <InfoRow icon={Hash}      label="Employee ID"  value={employee.employeeId} />
                    <InfoRow icon={Calendar}  label="Joining Date" value={formatDate(employee.joiningDate)} />
                    <InfoRow icon={Briefcase} label="Department"   value={employee.department} />
                </div>

                {/* Role + Permissions */}
                <div className="bg-card border border-border rounded-2xl p-5">
                    <h2 className="text-sm font-bold text-foreground mb-1">
                        Role & Permissions
                    </h2>
                    <p className="text-xs text-muted-foreground mb-4">
                        Access rights assigned via role
                    </p>

                    <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 mb-4">
                        <ShieldCheck size={16} className="text-primary shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">Assigned Role</p>
                            <p className="text-sm font-bold text-primary">{role.name ?? "—"}</p>
                        </div>
                    </div>

                    {perms.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                            No permissions assigned to this role.
                        </p>
                    ) : (
                        <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                            {perms.map((p, i) => {
                                const actions = Array.isArray(p.actions ?? p.action)
                                    ? (p.actions ?? p.action)
                                    : [(p.actions ?? p.action)].filter(Boolean);

                                return (
                                    <div
                                        key={p._id ?? i}
                                        className="flex items-center justify-between gap-2 py-2 border-b border-border/60 last:border-0"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <CheckCircle size={12} className="text-primary/60 shrink-0" />
                                            <span className="text-xs font-medium text-foreground truncate">
                                                {p.name}
                                            </span>
                                        </div>
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
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* Meta */}
            <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="text-sm font-bold text-foreground mb-4">
                    Record Information
                </h2>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Created At", value: formatDate(employee.createdAt) },
                        { label: "Updated At", value: formatDate(employee.updatedAt) },
                        { label: "Account ID", value: user._id ?? "—"               },
                    ].map(({ label, value }) => (
                        <div key={label} className="space-y-1">
                            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                                {label}
                            </p>
                            <p className="text-xs font-semibold text-foreground break-all">
                                {value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}