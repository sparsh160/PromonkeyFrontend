import { io } from "socket.io-client";
import { API_BASE } from "@/lib/api";

let socket = null;

export function getSocket() {
    if (!socket) {
        socket = io(API_BASE, {
            autoConnect:    false,
            reconnection:   true,
            reconnectionAttempts: 5,
            reconnectionDelay:    1000,
        });
    }
    return socket;
}

export function connectSocket() {
    const s     = getSocket();
    const token = typeof window !== "undefined"
        ? localStorage.getItem("crm_auth_token")
        : null;

    if (token) {
        s.auth = { token };
    }

    if (!s.connected) s.connect();
    return s;
}

export function disconnectSocket() {
    if (socket?.connected) socket.disconnect();
}