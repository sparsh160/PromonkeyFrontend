"use client";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export function useApi(path, responseKey = null) {
    const [data,    setData]    = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");

    const load = useCallback(async () => {
        if (!path) return;
        setLoading(true);
        setError("");
        try {
            const json = await apiFetch(path);

            if (Array.isArray(json)) {
                setData(json);
                return;
            }

            if (responseKey && json?.[responseKey] !== undefined) {
                setData(json[responseKey]);
                return;
            }

            const autoKey = ["data", "roles", "permissions", "employees",
                             "projects", "tasks", "users"].find(
                (k) => Array.isArray(json?.[k])
            );

            setData(autoKey ? json[autoKey] : json ?? []);

        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [path, responseKey]);

    useEffect(() => { load(); }, [load]);

    return { data, loading, error, refetch: load };
}