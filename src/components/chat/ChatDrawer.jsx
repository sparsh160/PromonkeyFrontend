"use client";
import { useState, useRef, useEffect } from "react";
import {
    X, Send, Loader2, Trash2,
    MessageSquare, AlertCircle,
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

function formatTime(iso) {
    if (!iso) return "";
    const d   = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000)    return "Just now";
    if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

export function ChatDrawer({ open, onClose, type, id, title, currentUser }) {
    const [text,    setText]    = useState("");
    const bottomRef = useRef(null);
    const inputRef  = useRef(null);

    const {
        comments, loading, sending, error,
        sendComment, deleteComment,
    } = useChat(type, id);

    useEffect(() => {
        if (open) {
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
    }, [comments, open]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 150);
    }, [open]);

    async function handleSend() {
        const t = text.trim();
        if (!t || sending) return;
        setText("");
        await sendComment(t);
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    const myId = currentUser?._id;

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-[400px] bg-card border-l border-border shadow-2xl z-50 flex flex-col">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                            <MessageSquare size={15} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground leading-tight">
                                {title ?? "Chat"}
                            </p>
                            <p className="text-[10px] text-muted-foreground capitalize">
                                {type} discussion · {comments.length} message{comments.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── Messages ── */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

                    {loading && (
                        <div className="flex items-center justify-center h-32">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 size={20} className="animate-spin text-primary" />
                                <p className="text-xs text-muted-foreground">Loading messages...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                            <AlertCircle size={13} />
                            {error}
                        </div>
                    )}

                    {!loading && comments.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-48 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                                <MessageSquare size={20} className="text-muted-foreground" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">No messages yet</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Start the conversation below.
                            </p>
                        </div>
                    )}

                    {comments.map((c, i) => {
                       
                        const author = c.author ?? {};
                        const isMe   = author._id === myId;
                        const name   = author.name ?? "Unknown";
                        const avatar = author.profileImage?.url
                            ? author.profileImage.url
                            : null;
                        const letter = name[0]?.toUpperCase() ?? "?";

                        const prev     = comments[i - 1];
                        const showDate = !prev ||
                            new Date(c.createdAt).toDateString() !==
                            new Date(prev?.createdAt).toDateString();

                        return (
                            <div key={c._id}>
                                {showDate && (
                                    <div className="flex items-center gap-2 my-3">
                                        <div className="flex-1 h-px bg-border" />
                                        <span className="text-[10px] text-muted-foreground font-medium px-2">
                                            {new Date(c.createdAt).toLocaleDateString("en-US", {
                                                weekday: "short", month: "short", day: "2-digit",
                                            })}
                                        </span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                )}

                                <div className={cn(
                                    "flex items-end gap-2 group",
                                    isMe ? "flex-row-reverse" : "flex-row"
                                )}>
                                    {/* Avatar */}
                                    <div className="w-7 h-7 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0 mb-0.5">
                                        {avatar ? (
                                            <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-bold text-primary">
                                                {letter}
                                            </span>
                                        )}
                                    </div>

                                    {/* Bubble */}
                                    <div className={cn(
                                        "max-w-[75%] space-y-1",
                                        isMe ? "items-end" : "items-start"
                                    )}>
                                        {/* Name + time */}
                                        <div className={cn(
                                            "flex items-center gap-2",
                                            isMe ? "flex-row-reverse" : "flex-row"
                                        )}>
                                            <span className="text-[10px] font-semibold text-foreground">
                                                {isMe ? "You" : name}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground">
                                                {formatTime(c.createdAt)}
                                            </span>
                                        </div>

                                        {/* Message */}
                                        <div className={cn(
                                            "relative flex items-end gap-1",
                                            isMe ? "flex-row-reverse" : "flex-row"
                                        )}>
                                            <div className={cn(
                                                "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                                                isMe
                                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                                    : "bg-muted text-foreground rounded-bl-sm"
                                            )}>
                                                {c.text}
                                            </div>

                                            {/* Delete button */}
                                            {(isMe || currentUser?.role === "admin") && (
                                                <button
                                                    onClick={() => deleteComment(c._id)}
                                                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all mb-0.5"
                                                >
                                                    <Trash2 size={11} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div ref={bottomRef} />
                </div>

                {/* ── Input ── */}
                <div className="px-4 py-4 border-t border-border shrink-0">
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <textarea
                                ref={inputRef}
                                value={text}
                                onChange={e => setText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message... (Enter to send)"
                                rows={1}
                                disabled={sending}
                                className={cn(
                                    "w-full px-4 py-3 rounded-2xl border border-border bg-muted/40 text-sm resize-none",
                                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                                    "transition-all placeholder:text-muted-foreground max-h-32 overflow-y-auto",
                                    sending && "opacity-60 cursor-not-allowed"
                                )}
                                style={{ minHeight: "44px" }}
                                onInput={(e) => {
                                    e.target.style.height = "auto";
                                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
                                }}
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={!text.trim() || sending}
                            className={cn(
                                "w-11 h-11 flex items-center justify-center rounded-2xl transition-all shrink-0",
                                text.trim() && !sending
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            {sending
                                ? <Loader2 size={16} className="animate-spin" />
                                : <Send size={16} />
                            }
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                        Press Enter to send · Shift+Enter for new line
                    </p>
                </div>

            </div>
        </>
    );
}