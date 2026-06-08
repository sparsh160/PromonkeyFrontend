"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Clock,
    Shield,
    ShieldCheck,
    Users,
    UserRound,
    ChevronDown,
    ChevronUp,
    LogOut,
} from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);

    const avatarLetter = user?.name?.[0]?.toUpperCase() ?? "U";

    const navItems = useMemo(() => {
        if (!user) return [];

        let modules = {};

        try {
            modules = JSON.parse(
                localStorage.getItem("crm_modules") || "{}"
            );
        } catch {
            modules = {};
        }

        console.log("Role:", user.role);
        console.log("Modules:", modules);

        // ======================
        // ADMIN
        // ======================
        if (user.role === "admin") {
            return [
                {
                    icon: LayoutDashboard,
                    label: "Dashboard",
                    href: "/promonkey/dashboard",
                },
                {
                    icon: FolderKanban,
                    label: "Projects",
                    href: "/promonkey/projects",
                },
                {
                    icon: CheckSquare,
                    label: "Tasks",
                    href: "/promonkey/tasks",
                },

                {
                    icon: Users,
                    label: "Employees",
                    href: "/promonkey/employees",
                },
                {
                    icon: Shield,
                    label: "Roles",
                    href: "/promonkey/roles",
                },
                {
                    icon: ShieldCheck,
                    label: "Permissions",
                    href: "/promonkey/permissions",
                },
                {
                    icon: UserRound,
                    label: "Clients",
                    href: "/promonkey/clients",
                },
            ];
        }

        // ======================
        // CLIENT
        // ======================
        if (user.role === "client") {
            return [
                {
                    icon: LayoutDashboard,
                    label: "Dashboard",
                    href: "/promonkey/dashboard",
                },
                {
                    icon: FolderKanban,
                    label: "My Projects",
                    href: "/promonkey/projects",
                },
            ];
        }

        // ======================
        // EMPLOYEE
        // ======================
        if (user.role === "employee") {
            const items = [
                {
                    icon: LayoutDashboard,
                    label: "Dashboard",
                    href: "/promonkey/dashboard",
                },
                {
                    icon: FolderKanban,
                    label: "My Projects",
                    href: "/promonkey/projects",
                },
                {
                    icon: CheckSquare,
                    label: "My Tasks",
                    href: "/promonkey/tasks",
                },
            ];



            if (modules?.Employees?.includes("read")) {
                items.push({
                    icon: Users,
                    label: "Employees",
                    href: "/promonkey/employees",
                });
            }

            if (modules?.Clients?.includes("read")) {
                items.push({
                    icon: UserRound,
                    label: "Clients",
                    href: "/promonkey/clients",
                });
            }

            if (modules?.Roles?.includes("read")) {
                items.push({
                    icon: Shield,
                    label: "Roles",
                    href: "/promonkey/roles",
                });
            }

            if (modules?.Permissions?.includes("read")) {
                items.push({
                    icon: ShieldCheck,
                    label: "Permissions",
                    href: "/promonkey/permissions",
                });
            }



            return items;
        }

        return [];
    }, [user]);

    return (
        <aside className="w-56 shrink-0 flex flex-col h-screen bg-sidebar border-r border-sidebar-border relative">

            {/* Logo */}
            <div className="flex items-center gap-2 px-4 py-[18px] border-b border-sidebar-border shrink-0">
                <div className="w-8 h-8 relative shrink-0">
                    <Image
                        src="/images/promonkeyicon.png"
                        alt="Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                <div className="relative h-7 flex-1 min-w-0">
                    <Image
                        src="/images/promonkey-logo-bottom.webp"
                        alt="Logo"
                        fill
                        className="object-contain object-left"
                        priority
                    />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                {navItems.map(({ icon: Icon, label, href }) => {
                    const isActive = pathname === href;

                    return (
                        <Link
                            key={`${label}-${href}`}
                            href={href}
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                                isActive
                                    ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            )}
                        >
                            <Icon
                                size={15}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Profile */}
            <div className="px-3 py-4 border-t border-sidebar-border shrink-0">

                {profileOpen && (
                    <div className="absolute bottom-[72px] left-3 right-3 bg-card border border-border rounded-xl shadow-lg p-1 z-50">
                        <div className="px-3 py-2 border-b border-border mb-1">
                            <p className="text-xs font-semibold truncate">
                                {user?.name}
                            </p>

                            <p className="text-[10px] text-muted-foreground truncate">
                                {user?.email}
                            </p>
                        </div>

                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10"
                        >
                            <LogOut size={14} />
                            Logout
                        </button>
                    </div>
                )}

                <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-sidebar-accent"
                >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {avatarLetter}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-semibold truncate">
                            {user?.name || "User"}
                        </p>

                        <p className="text-[10px] text-muted-foreground capitalize">
                            {user?.role || "Member"}
                        </p>
                    </div>

                    {profileOpen ? (
                        <ChevronUp size={13} />
                    ) : (
                        <ChevronDown size={13} />
                    )}
                </button>
            </div>
        </aside>
    );
}