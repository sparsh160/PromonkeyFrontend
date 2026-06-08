"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { API_BASE } from "@/lib/api";

export function LoginForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [email,        setEmail]        = useState("");
    const [password,     setPassword]     = useState("");
    const [isLoading,    setIsLoading]    = useState(false);
    const [error,        setError]        = useState("");

    async function handleLogin(e) {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE}/api/auth/unified-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Invalid credentials. Please try again.");
            }

            if (data.token) {
                localStorage.setItem("crm_auth_token", data.token);
                document.cookie = [
                    `crm_auth_token=${data.token}`,
                    "path=/",
                    `max-age=${60 * 60 * 24 * 7}`, 
                    "SameSite=Lax",
                ].join("; ");
            }

            if (data.user) {
                localStorage.setItem("crm_user", JSON.stringify(data.user));
            }
            if (data.employee) localStorage.setItem("crm_employee",   JSON.stringify(data.employee));

            if (data.employee?.modules) {
                localStorage.setItem(
                    "crm_modules",
                    JSON.stringify(data.employee.modules)
                );
            }

            // redirect back to originally intended page if middleware set ?from=
            const params = new URLSearchParams(window.location.search);
            const from   = params.get("from") || "/promonkey/dashboard";
            router.push(from);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={handleLogin} className="flex flex-col gap-5">

            {/* Error */}
            {error && (
                <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                    {error}
                </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-sm font-semibold">
                    Email Address
                </Label>
                <div className="relative">
                    <Mail
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12 rounded-xl text-sm"
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-sm font-semibold">
                    Password
                </Label>
                <div className="relative">
                    <Lock
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 pr-12 h-12 rounded-xl text-sm"
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                        {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                </div>
            </div>

            {/* Submit */}
            <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/25 mt-1"
                disabled={isLoading}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Logging in...
                    </span>
                ) : "Login"}
            </Button>

        </form>
    );
}