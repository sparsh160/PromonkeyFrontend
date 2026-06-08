"use client";
import { useState } from "react";
import { EmployeeCard } from "./EmployeeCard";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

export function EmployeeCardGrid({ employees, onEdit, onDelete }) {
    const [search, setSearch] = useState("");

    const filtered = employees.filter((e) => {
        const q = search.toLowerCase();
        return (
            e.user?.name?.toLowerCase().includes(q)       ||
            e.user?.email?.toLowerCase().includes(q)      ||
            e.role?.name?.toLowerCase().includes(q)       ||
            e.department?.toLowerCase().includes(q)       ||
            e.employeeId?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-4">

            {/* Search + count */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-64">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search employees..."
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
                        <span className="font-semibold text-foreground">{employees.length}</span>
                        {" "}employees
                    </span>
                </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 rounded-2xl border border-border bg-card">
                    <Users size={32} className="text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold text-foreground">No employees found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {search ? "Try a different search term" : "Add your first employee to get started"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filtered.map((emp) => (
                        <EmployeeCard
                            key={emp._id}
                            employee={emp}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}