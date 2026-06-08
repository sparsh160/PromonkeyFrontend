"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Mail, Phone, MapPin,
    Building2, FileText, User, Calendar,
    Loader2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        day: "2-digit", month: "long", year: "numeric",
    });
}

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
                <p className="text-sm font-semibold text-foreground mt-0.5 break-words">
                    {value || "—"}
                </p>
            </div>
        </div>
    );
}

export default function ClientDetailPage({ id }) {
    const router = useRouter();
    const [client,  setClient]  = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");

    useEffect(() => {
        if (!id) return;
        async function load() {
            setLoading(true);
            setError("");
            try {
                const data = await apiFetch(`/api/clients/${id}`);
                setClient(data);
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
                <p className="text-sm text-muted-foreground">Loading client...</p>
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

    if (!client) return null;

    const avatar  = client.profileImage?.url ?? null;
    const letter  = client.clientName?.[0]?.toUpperCase() ?? "C";
    const creator = client.createdBy ?? {};

    return (
        <div className="space-y-6 max-w-4xl">

            {/* Back */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Clients
            </button>

            {/* Hero card */}
            <div className="bg-card border border-border rounded-2xl p-6 flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-border">
                    {avatar ? (
                        <img src={avatar} alt={client.clientName} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold text-primary">{letter}</span>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-foreground">
                        {client.clientName ?? "—"}
                    </h1>
                    {client.companyName && (
                        <p className="text-sm text-primary font-semibold mt-0.5">
                            {client.companyName}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-3">
                        {client.email && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Mail size={12} className="text-primary/60" />
                                {client.email}
                            </div>
                        )}
                        {client.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone size={12} className="text-primary/60" />
                                {client.phone}
                            </div>
                        )}
                        {client.address && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin size={12} className="text-primary/60" />
                                {client.address}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Two column */}
            <div className="grid grid-cols-2 gap-4">

                {/* Client Details */}
                <div className="bg-card border border-border rounded-2xl p-5">
                    <h2 className="text-sm font-bold text-foreground mb-1">
                        Client Details
                    </h2>
                    <p className="text-xs text-muted-foreground mb-4">
                        Contact and company information
                    </p>
                    <InfoRow icon={User}      label="Client Name"  value={client.clientName} />
                    <InfoRow icon={Building2} label="Company"      value={client.companyName} />
                    <InfoRow icon={Mail}      label="Email"        value={client.email} />
                    <InfoRow icon={Phone}     label="Phone"        value={client.phone} />
                    <InfoRow icon={MapPin}    label="Address"      value={client.address} />
                </div>

                {/* Notes + Meta */}
                <div className="space-y-4">

                    {/* Notes */}
                    {client.notes && (
                        <div className="bg-card border border-border rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <FileText size={13} className="text-primary" />
                                </div>
                                <h2 className="text-sm font-bold text-foreground">Notes</h2>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {client.notes}
                            </p>
                        </div>
                    )}

                    {/* Created by */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <h2 className="text-sm font-bold text-foreground mb-3">
                            Record Information
                        </h2>
                        <div className="space-y-3">
                            {creator.name && (
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                        {creator.name[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                                            Created by
                                        </p>
                                        <p className="text-xs font-semibold text-foreground">
                                            {creator.name}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/60">
                                <Calendar size={12} className="text-primary/60" />
                                Created {formatDate(client.createdAt)}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}