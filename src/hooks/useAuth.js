"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
    const router = useRouter();
    const [user,  setUser]  = useState(null);
    const [token, setToken] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem("crm_auth_token");
        const storedUser  = localStorage.getItem("crm_user");

        if (!storedToken) {
            router.push("/login");
            return;
        }

        setToken(storedToken);

        if (storedUser) {
            try { setUser(JSON.parse(storedUser)); }
            catch { setUser(null); }
        }

        setReady(true);
    }, []);

    function logout() {
        // clear localStorage
        localStorage.removeItem("crm_auth_token");
        localStorage.removeItem("crm_user");
        localStorage.removeItem("crm_employee");
        localStorage.removeItem("crm_modules");

        // clear cookie so middleware also blocks access
        document.cookie = "crm_auth_token=; path=/; max-age=0; SameSite=Lax";

        router.push("/login");
    }

    return { user, token, ready, logout };
}