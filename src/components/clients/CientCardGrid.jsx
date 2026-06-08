"use client";
import { useState } from "react";
import { EntityCard } from "@/components/common/EntityCard";
import { Mail, Phone, MapPin, Building2, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ClientCardGrid({ clients, onEdit, onDelete }) {
    const [search, setSearch] = useState("");

    const filtered = clients.filter((c) => {
        const q = search.toLowerCase();
        return (
            c.clientName?.toLowerCase().includes(q)  ||
            c.companyName?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q)       ||
            c.phone?.toLowerCase().includes(q)       ||
            c.address?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-4">

            {/* Search + count */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-64">
                    <Search
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <Input
                        placeholder="Search clients..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-sm rounded-lg bg-card"
                    />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users size={14} />
                    <span>
                        <span className="font-semibold text-foreground">{filtered.length}</span>
                        {" "}of{" "}
                        <span className="font-semibold text-foreground">{clients.length}</span>
                        {" "}clients
                    </span>
                </div>
            </div>

            {/* Grid — 3 columns */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 rounded-2xl border border-border bg-card">
                    <Building2 size={32} className="text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold text-foreground">No clients found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {search
                            ? "Try a different search term"
                            : "Add your first client to get started"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((client) => (
                        <EntityCard
                            key={client._id}
                            id={client._id}
                            href={`/promonkey/clients/${client._id}`}
                            avatar={client.profileImage?.url ?? null}
                            initials={client.clientName?.[0]?.toUpperCase() ?? "C"}
                            title={client.clientName}
                            subtitle={client.companyName}
                            rows={[
                                { icon: Mail,     value: client.email   },
                                { icon: Phone,    value: client.phone   },
                                { icon: MapPin,   value: client.address },
                            ]}
                            footer={client.notes ? `Note: ${client.notes.slice(0, 30)}${client.notes.length > 30 ? "…" : ""}` : null}
                            onEdit={() => onEdit(client)}
                            onDelete={onDelete}
                            deleteTitle="Delete Client"
                            deleteDesc={`Are you sure you want to delete ${client.clientName}? This will also remove their profile image.`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}